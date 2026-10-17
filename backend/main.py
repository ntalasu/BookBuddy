from fastapi import FastAPI, HTTPException
from services.google_books import search_books, get_book_details
import requests
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)
@app.get("/")
def home():
    return {"message": "Welcome to BookBuddy API!"}


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