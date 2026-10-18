from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from services.google_books import search_books, get_book_details
from database import (
    init_db, save_book, get_saved_books, delete_book,
    get_student, find_student_by_name, create_student, update_student
)
import requests
import uuid


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

# Student model (profile + reading buddy customization)
class Student(BaseModel):
    id: str
    name: str
    age: int
    readingLevel: str
    readingMinutes: int
    interests: list[str]
    characterId: str
    characterColor: str
    buddyName: str
    hatId: str
    itemId: str


class SignInRequest(BaseModel):
    name: str = Field(min_length=1, max_length=40)


# Every field is optional so the frontend can send only what changed
class StudentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=40)
    age: int | None = Field(default=None, ge=4, le=12)
    readingLevel: str | None = None
    interests: list[str] | None = None
    characterId: str | None = None
    characterColor: str | None = None
    buddyName: str | None = Field(default=None, max_length=20)
    hatId: str | None = None
    itemId: str | None = None


# Sign in by name: returns the existing student, or creates a new one
@app.post("/students/sign-in", response_model=Student)
def sign_in(request: SignInRequest):
    name = request.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Name can't be empty.")

    student = find_student_by_name(name)
    if student:
        return student

    return create_student(str(uuid.uuid4()), name)


@app.get("/students/{student_id}", response_model=Student)
def get_student_profile(student_id: str):
    student = get_student(student_id)

    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    return student


# Save profile or reading buddy changes
@app.post("/students/{student_id}", response_model=Student)
def update_student_profile(student_id: str, changes: StudentUpdate):
    if not get_student(student_id):
        raise HTTPException(status_code=404, detail="Student not found.")

    return update_student(student_id, changes.model_dump(exclude_unset=True, exclude_none=True))
