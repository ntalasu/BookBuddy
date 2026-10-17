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

def search_books(query):
    params = {
        "q": query,
        "maxResults": 10,
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

        book = {
            "id": item.get("id"),
            "title": info.get("title", "Unknown"),
            "authors": info.get("authors", []),
            "description": clean_description(info.get("description", "")),
            "thumbnail": info.get("imageLinks", {}).get("thumbnail"),
            "pageCount": info.get("pageCount")
        }

        books.append(book)

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