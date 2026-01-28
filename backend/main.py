from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import bcrypt 
from datetime import datetime, timedelta
import jwt 
from typing import List, Optional
import requests # Make sure to pip install requests
import re
import models, schemas, database
import requests

# --- CONFIG ---
SECRET_KEY = "supersecretkey" 
ALGORITHM = "HS256"
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

security = HTTPBearer()

def get_db():
    db = database.SessionLocal()
    try: yield db
    finally: db.close()

# --- AUTH UTILS ---
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except: raise HTTPException(401, "Invalid token")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user: raise HTTPException(401, "User not found")
    return user

# --- AUTH ENDPOINTS ---
@app.post("/auth/signup")
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(400, "Email taken")
    
    hashed = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    new_user = models.User(email=user.email, hashed_password=hashed, full_name=user.full_name, unit_no=user.unit_no, whatsapp_no=user.whatsapp_no)
    db.add(new_user)
    db.commit()
    return {"msg": "User created"}

@app.post("/auth/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not bcrypt.checkpw(user.password.encode('utf-8'), db_user.hashed_password.encode('utf-8')):
        raise HTTPException(400, "Invalid credentials")
    
    token = jwt.encode({"sub": db_user.email, "exp": datetime.utcnow() + timedelta(days=7)}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserResponse)
def me(user: models.User = Depends(get_current_user)): return user

# --- BOOK ENDPOINTS ---
@app.get("/books", response_model=List[schemas.BookResponse])
def get_books(search: Optional[str] = None, category: Optional[str] = None, db: Session = Depends(get_db)):
    # Start with all available books
    query = db.query(models.Book).filter(models.Book.status == "Available")
    
    # Apply Search Filter
    if search:
        query = query.filter(models.Book.title.contains(search))
    
    # Apply Category Filter (NEW)
    if category and category != "All":
        query = query.filter(models.Book.category == category)
        
    return query.all()


@app.get("/books/lookup")
def lookup_isbn(isbn: str):
    # 1. Clean ISBN
    clean_isbn = re.sub(r'[^0-9X]', '', isbn.upper())
    
    # 2. Define Headers (To look like a real browser)
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
    }

    print(f"Searching for {clean_isbn}...") # Debug log

    # --- STRATEGY A: GOOGLE BOOKS ---
    try:
        url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{clean_isbn}"
        resp = requests.get(url, headers=headers)
        data = resp.json()

        if "items" in data and len(data["items"]) > 0:
            info = data["items"][0]["volumeInfo"]
            img = info.get("imageLinks", {}).get("thumbnail", "")
            if img.startswith("http://"): img = img.replace("http://", "https://")
            
            return {
                "title": info.get("title", "Unknown"),
                "author": info.get("authors", ["Unknown"])[0],
                "description": info.get("description", ""),
                "cover_image": img
            }
    except Exception as e:
        print(f"Google failed: {e}")

    # --- STRATEGY B: OPEN LIBRARY (Fallback) ---
    # Great for specific ISBNs that Google misses
    try:
        print("Falling back to OpenLibrary...")
        ol_url = f"https://openlibrary.org/api/books?bibkeys=ISBN:{clean_isbn}&jscmd=data&format=json"
        resp = requests.get(ol_url, headers=headers)
        data = resp.json()
        
        key = f"ISBN:{clean_isbn}"
        if key in data:
            info = data[key]
            return {
                "title": info.get("title", "Unknown"),
                "author": info.get("authors", [{"name": "Unknown"}])[0]["name"],
                "description": "No description available.",
                "cover_image": info.get("cover", {}).get("medium", "")
            }
    except Exception as e:
        print(f"OpenLibrary failed: {e}")

    # If both fail
    raise HTTPException(status_code=404, detail="Book not found in any database")


@app.post("/books", response_model=schemas.BookResponse)
def create_book(book: schemas.BookCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_book = models.Book(**book.dict(), owner_id=current_user.id, status="Available")
    db.add(new_book)
    current_user.credits += 1 # Reward
    db.commit()
    db.refresh(new_book)
    return new_book

# --- TRANSACTION ENDPOINTS ---
@app.post("/transactions/request")
def request_book(payload: schemas.TransactionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    book = db.query(models.Book).filter(models.Book.id == payload.book_id).first()
    if not book or book.status != "Available": raise HTTPException(400, "Unavailable")
    if book.owner_id == current_user.id: raise HTTPException(400, "Cannot request own book")
    if current_user.credits < 1: raise HTTPException(400, "Insufficient credits")

    txn = models.Transaction(book_id=book.id, borrower_id=current_user.id, owner_id=book.owner_id, status="Requested")
    book.status = "Pending_Approval"
    db.add(txn)
    db.commit()
    return txn





@app.get("/books/my-books", response_model=List[schemas.BookResponse])
def get_my_books(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Fetch books owned by the current user, ordered by newest first
    return db.query(models.Book).filter(
        models.Book.owner_id == current_user.id
    ).order_by(models.Book.id.desc()).all()




# Make sure response_model is set to List[schemas.TransactionResponse]
@app.get("/transactions/my-requests", response_model=List[schemas.TransactionResponse])
def get_my_requests(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Transaction).filter(
        (models.Transaction.borrower_id == current_user.id) | 
        (models.Transaction.owner_id == current_user.id)
    ).all()

@app.put("/transactions/{txn_id}/{action}")
def handle_txn(txn_id: int, action: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    txn = db.query(models.Transaction).filter(models.Transaction.id == txn_id).first()
    if not txn: raise HTTPException(404, "Not found")

    if action == "approve":
        if txn.owner_id != current_user.id: raise HTTPException(403, "Unauthorized")
        borrower = db.query(models.User).filter(models.User.id == txn.borrower_id).first()
        if borrower.credits < 1: raise HTTPException(400, "Borrower lost credits")
        txn.status = "Approved"
        borrower.credits -= 1

    elif action == "handover":
        if txn.owner_id != current_user.id: raise HTTPException(403, "Unauthorized")
        txn.status = "Completed"
        txn.book.status = "Exchanged"

    elif action == "return":
        if txn.owner_id != current_user.id: raise HTTPException(403, "Unauthorized")
        txn.status = "Returned"
        txn.book.status = "Available"

    db.commit()
    return {"msg": "Success"}