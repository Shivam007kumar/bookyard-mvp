from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    email: str
    full_name: str
    unit_no: str
    whatsapp_no: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: int
    credits: int
    class Config:
        from_attributes = True

# --- Book Schemas ---
class BookBase(BaseModel):
    title: str
    author: str
    isbn: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None 
    condition: str 
    category: str

class BookCreate(BookBase):
    pass

class BookResponse(BookBase):
    id: int
    owner_id: int
    status: str
    class Config:
        from_attributes = True

# --- Transaction Schemas ---
class TransactionCreate(BaseModel):
    book_id: int

class TransactionResponse(BaseModel):
    id: int
    book_id: int
    borrower_id: int
    owner_id: int
    status: str
    created_at: datetime
    
    # ⬇️ THESE NESTED FIELDS ARE WHAT YOU WERE MISSING ⬇️
    book: BookResponse
    borrower: UserResponse
    owner: UserResponse
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str