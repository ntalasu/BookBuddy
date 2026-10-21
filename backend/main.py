from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from services.google_books import search_books, get_book_details
from database import (
    init_db, save_book, get_saved_books, delete_book,
    get_student, find_student_by_workos_id, create_student, update_student,
    create_auth_session, get_auth_session, delete_auth_session
)
import requests
import uuid
import os
from dotenv import load_dotenv
from workos import WorkOSClient
from fastapi.responses import RedirectResponse
import secrets

load_dotenv()

WORKOS_API_KEY = os.getenv("WORKOS_API_KEY")
WORKOS_CLIENT_ID = os.getenv("WORKOS_CLIENT_ID")
WORKOS_REDIRECT_URI = os.getenv("WORKOS_REDIRECT_URI")
WORKOS_COOKIE_PASSWORD = os.getenv("WORKOS_COOKIE_PASSWORD")

if not all([
    WORKOS_API_KEY,
    WORKOS_CLIENT_ID,
    WORKOS_REDIRECT_URI,
    WORKOS_COOKIE_PASSWORD
]):
    raise RuntimeError("Missing WorkOS environment variables")

workos = WorkOSClient(
    api_key=WORKOS_API_KEY,
    client_id=WORKOS_CLIENT_ID
)

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

# Redirect users to WorkOS to sign in
@app.get("/auth/login")
def auth_login():
    state = secrets.token_urlsafe(32)

    authorization_url = workos.user_management.get_authorization_url(
        provider="authkit",
        redirect_uri=WORKOS_REDIRECT_URI,
        state=state,
    )

    response = RedirectResponse(url=authorization_url)

    response.set_cookie(
        key="workos_oauth_state",
        value=state,
        httponly=True,
        secure=False,  # Local development only
        samesite="lax",
        max_age=600,
    )

    return response
# Handle the response from WorkOS after login
@app.get("/auth/callback")
def auth_callback(request: Request, code: str, state: str):
    saved_state = request.cookies.get("workos_oauth_state")

    # Make sure this is the same login request we started
    if not saved_state or not secrets.compare_digest(saved_state, state):
        raise HTTPException(status_code=400, detail="Invalid login state")

    # Exchange the authorization code for an authenticated user
    try:
        authentication = workos.user_management.authenticate_with_code(
            code=code
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed")

    # Create a session for the authenticated WorkOS user
    session_token = create_auth_session(authentication.user.id)

    response = RedirectResponse(
        url="http://localhost:5173/welcome"
    )

    response.set_cookie(
        key="bookbuddy_session",
        value=session_token,
        httponly=True,
        secure=False,  # Local development only
        samesite="lax",
        max_age=86400,
        path="/"
    )

    response.delete_cookie("workos_oauth_state")

    print("WorkOS authentication successful")

    return response

def require_auth(request: Request):
    token = request.cookies.get("bookbuddy_session")

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    workos_user_id = get_auth_session(token)

    if not workos_user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session"
        )

    return workos_user_id


@app.get("/auth/me")
def auth_me(workos_user_id: str = Depends(require_auth)):
    return {
        "authenticated": True,
        "workosUserId": workos_user_id
    }

# Return the student profile linked to the logged-in WorkOS account
@app.get("/auth/student", response_model=None)
def auth_student(workos_user_id: str = Depends(require_auth)):
    student = find_student_by_workos_id(workos_user_id)

    if not student:
        return {"student": None}

    return {"student": student}

@app.post("/auth/logout")
def auth_logout(request: Request):
    token = request.cookies.get("bookbuddy_session")

    if token:
        delete_auth_session(token)

    response = RedirectResponse(
        url="http://localhost:5173/welcome",
        status_code=303
    )

    response.delete_cookie("bookbuddy_session")

    return response

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
def sign_in(

        request: SignInRequest,
        workos_user_id: str = Depends(require_auth)

):
    name = request.name.strip()

    if not name:
        raise HTTPException(

            status_code=422,
            detail="Name can't be empty."

        )

    # Find the profile belonging to this WorkOS account
    student = find_student_by_workos_id(workos_user_id)

    if student:
        return student

    # First login: create a new profile linked to WorkOS
    return create_student(

        str(uuid.uuid4()),
        name,
        workos_user_id

    )


@app.get("/students/{student_id}", response_model=Student)
def get_student_profile(
        student_id: str,
        workos_user_id: str = Depends(require_auth)
):
    student = find_student_by_workos_id(workos_user_id)

    if not student or student["id"] != student_id:
        raise HTTPException(
            status_code=404,
            detail="Student not found."
        )
    return student


@app.post("/students/{student_id}", response_model=Student)
def update_student_profile(
        student_id: str,
        changes: StudentUpdate,
        workos_user_id: str = Depends(require_auth)
):
    student = find_student_by_workos_id(workos_user_id)

    if not student or student["id"] != student_id:
        raise HTTPException(
            status_code=404,
            detail="Student not found."
        )

    return update_student(
        student_id,
        changes.model_dump(exclude_unset=True, exclude_none=True)
    )