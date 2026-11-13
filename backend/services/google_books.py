import requests
import os
from dotenv import load_dotenv
import re
import html
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from functools import lru_cache
import sqlite3
import json
import time
from pathlib import Path

load_dotenv()

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"
CACHE_DB = Path(__file__).resolve().parent.parent / "google_books_cache.db"
CACHE_SECONDS = 7 * 24 * 60 * 60  # 7 days


def initialize_cache():
    with sqlite3.connect(CACHE_DB, timeout=10) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS google_books_cache (
                cache_key TEXT PRIMARY KEY,
                response TEXT NOT NULL,
                created_at REAL NOT NULL
            )
        """)


def get_cached(cache_key):
    with sqlite3.connect(CACHE_DB, timeout=10) as conn:
        row = conn.execute(
            """
            SELECT response, created_at
            FROM google_books_cache
            WHERE cache_key = ?
            """,
            (cache_key,)
        ).fetchone()

    if row and time.time() - row[1] < CACHE_SECONDS:
        return json.loads(row[0])

    return None


def save_cached(cache_key, data):
    with sqlite3.connect(CACHE_DB, timeout=10) as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO google_books_cache
            (cache_key, response, created_at)
            VALUES (?, ?, ?)
            """,
            (cache_key, json.dumps(data), time.time())
        )


initialize_cache()


retry_strategy = Retry(
    total=1,
    backoff_factor=1,
    status_forcelist=[500, 502, 503, 504],
    allowed_methods=["GET"],
)

session = requests.Session()
session.mount("https://", HTTPAdapter(max_retries=retry_strategy))


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


@lru_cache(maxsize=256)
def search_books(query, language=None):
    # Check SQLite cache before calling Google Books
    cache_key = f"search:{query.strip().lower()}:{language or ''}"

    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    params = {
        "q": query,
        "maxResults": 40,
        "printType": "books",
        "key": os.getenv("GOOGLE_BOOKS_API_KEY")
    }

    # Optional: only books in one language, e.g. "en" (used by Buddy's chat)
    if language:
        params["langRestrict"] = language

    response = session.get(
        GOOGLE_BOOKS_URL,
        params=params,
        timeout=10
    )

    if response.status_code != 200:
        print("Google Books status:", response.status_code)
        print("Google Books error:", response.text[:500])

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
            "categories": info.get("categories", []),
            "ratingsCount": info.get("ratingsCount", 0),
            "publisher": info.get("publisher", "")
        }

        books.append(book)

        # Show up to 10 appropriate books
        if len(books) == 10:
            break

    # Save successful results to SQLite cache
    save_cached(cache_key, books)

    return books


@lru_cache(maxsize=512)
def get_book_details(book_id):
    # Check SQLite cache before calling Google Books
    cache_key = f"details:{book_id}"

    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    url = f"{GOOGLE_BOOKS_URL}/{book_id}"

    params = {
        "key": os.getenv("GOOGLE_BOOKS_API_KEY")
    }

    response = session.get(url, params=params, timeout=10)

    response.raise_for_status()

    book = response.json()

    info = book.get("volumeInfo", {})

    result = {
        "id": book.get("id"),
        "title": info.get("title", ""),
        "authors": info.get("authors", []),
        "description": clean_description(info.get("description", "")),
        "thumbnail": info.get("imageLinks", {}).get("thumbnail", ""),
        "pageCount": info.get("pageCount", 0),
        "publishedDate": info.get("publishedDate", ""),
        "categories": info.get("categories", [])
    }

    # Save successful book details to SQLite cache
    save_cached(cache_key, result)

    return result