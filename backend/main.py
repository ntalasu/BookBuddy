from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from services.google_books import search_books, get_book_details
from database import init_db, save_book, get_saved_books, delete_book
import requests


# Initialize database when the application starts
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)


# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Book model
class Book(BaseModel):
    id: str
    title: str
    authors: list[str] = Field(default_factory=list)
    description: str = ""
    thumbnail: str | None = None
    pageCount: int | None = None
    publishedDate: str = ""
    categories: list[str] = Field(default_factory=list)


# Home endpoint
@app.get("/")
def home():
    return {"message": "Welcome to BookBuddy API!"}


# Search books using Google Books API
@app.get("/books/search")
def get_books(query: str):
    try:
        return search_books(query)

    except requests.RequestException as e:
        print("Google Books API error:", repr(e))
        raise HTTPException(
            status_code=502,
            detail="Unable to retrieve books right now."
        )


# Get details for a specific book
@app.get("/books/{book_id}")
def get_book(book_id: str):
    try:
        return get_book_details(book_id)

    except requests.RequestException as e:
        print("Google Books API error:", repr(e))
        raise HTTPException(
            status_code=502,
            detail="Unable to retrieve book details right now."
        )


# Save a book to the bookshelf
@app.post("/bookshelf")
def add_to_bookshelf(book: Book):
    save_book(book.model_dump())

    return {
        "message": "Book saved successfully!"
    }

@app.get("/bookshelf")
def get_bookshelf():
    return get_saved_books()

@app.delete("/bookshelf/{book_id}")
def remove_from_bookshelf(book_id: str):

    deleted = delete_book(book_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Book not found in bookshelf."
        )

    return {"message": "Book removed successfully!"}