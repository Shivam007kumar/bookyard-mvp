from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    unit_no = Column(String) 
    whatsapp_no = Column(String) 
    credits = Column(Integer, default=3) 

    books = relationship("Book", back_populates="owner")
    requests_made = relationship("Transaction", back_populates="borrower", foreign_keys="Transaction.borrower_id")
    requests_received = relationship("Transaction", back_populates="owner", foreign_keys="Transaction.owner_id")

class Book(Base):
    __tablename__ = "books"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    author = Column(String)
    isbn = Column(String, nullable=True)
    description = Column(String, nullable=True)
    cover_image = Column(String, nullable=True) # The new field
    condition = Column(String) 
    category = Column(String)
    status = Column(String, default="Available")
    
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="books")
    transactions = relationship("Transaction", back_populates="book")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="Requested")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    book_id = Column(Integer, ForeignKey("books.id"))
    borrower_id = Column(Integer, ForeignKey("users.id"))
    owner_id = Column(Integer, ForeignKey("users.id"))

    book = relationship("Book", back_populates="transactions")
    borrower = relationship("User", foreign_keys=[borrower_id], back_populates="requests_made")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="requests_received")