import requests
import os
from dotenv import load_dotenv
import re
import html

load_dotenv()

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"

def clean_description(description):
    if not description:
        return ""

    description = re.sub(r"<br\s*/?>", "\n", description, flags=re.IGNORECASE)
    description = re.sub(r"</p>", "\n", description, flags=re.IGNORECASE)
    description = re.sub(r"<[^>]+>", "", description)

    return html.unescape(description).strip()

def is_child_friendly(info):
    title = info.get("title", "").lower()
    description = clean_description(info.get("description", "")).lower()
    categories = [c.lower() for c in info.get("categories", [])]
    authors = info.get("authors", [])
    page_count = info.get("pageCount")

    # Exclude books without enough information
    if not authors or not description:
        return False

    # Exclude very long books
    if page_count and page_count > 500:
        return False

    # Exclude clearly adult or academic categories
    excluded_categories = [
        "business",
        "medical",
        "law",
        "political science",
        "engineering",
        "agriculture",
        "professional",
        "adult fiction",
        "true crime",
    ]

    if any(
            word in category
            for category in categories
            for word in excluded_categories
    ):
        return False

    # Prefer books labeled for children
    child_categories = [
        "juvenile",
        "children",
        "young readers",
        "picture books",
        "early readers",
    ]

    if any(
            word in category
            for category in categories
            for word in child_categories
    ):
        return True

    # Also allow books with child-related descriptions
    child_keywords = [
        "children",
        "kids",
        "young readers",
        "elementary school",
        "picture book",
        "bedtime story",
        "middle grade",
        "ages 5",
        "ages 6",
        "ages 7",
        "ages 8",
        "ages 9",
        "ages 10",
        "ages 11",
    ]

    return any(word in title or word in description for word in child_keywords)

def search_books(query):
    params = {
        "q": query,
        "maxResults": 40,
        "printType": "books",
        "key": os.getenv("GOOGLE_BOOKS_API_KEY")
    }

    response = requests.get(
        GOOGLE_BOOKS_URL,
        params=params,
        timeout=10
    )

    response.raise_for_status()
    data = response.json()

    books = []

    for item in data.get("items", []):
        info = item.get("volumeInfo", {})

        # Skip books that aren't appropriate for K-5
        if not is_child_friendly(info):
            continue

        book = {
            "id": item.get("id"),
            "title": info.get("title", "Unknown"),
            "authors": info.get("authors", []),
            "description": clean_description(info.get("description", "")),
            "thumbnail": info.get("imageLinks", {}).get("thumbnail"),
            "pageCount": info.get("pageCount"),
            "publishedDate": info.get("publishedDate", ""),
            "categories": info.get("categories", [])
        }

        books.append(book)

        # Show up to 10 appropriate books
        if len(books) == 10:
            break

    return books

def get_book_details(book_id):
    url = f"{GOOGLE_BOOKS_URL}/{book_id}"

    params = {
        "key": os.getenv("GOOGLE_BOOKS_API_KEY")
    }

    response = requests.get(url, params=params, timeout=10)

    response.raise_for_status()

    book = response.json()

    info = book.get("volumeInfo", {})

    return {
        "id": book.get("id"),
        "title": info.get("title", ""),
        "authors": info.get("authors", []),
        "description": clean_description(info.get("description", "")),
        "thumbnail": info.get("imageLinks", {}).get("thumbnail", ""),
        "pageCount": info.get("pageCount", 0),
        "publishedDate": info.get("publishedDate", ""),
        "categories": info.get("categories", [])
    }