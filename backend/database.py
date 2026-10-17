import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).resolve().parent / "books.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS bookshelf (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            authors TEXT,
            description TEXT,
            thumbnail TEXT,
            page_count INTEGER,
            published_date TEXT,
            categories TEXT
       )
   """)

    connection.commit()
    connection.close()


def save_book(book):
    connection = get_connection()

    connection.execute("""
                       INSERT OR IGNORE INTO bookshelf (
            id,
            title,
            authors,
            description,
            thumbnail,
            page_count,
            published_date,
            categories
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                       """, (
                           book["id"],
                           book["title"],
                           ", ".join(book.get("authors", [])),
                           book.get("description", ""),
                           book.get("thumbnail"),
                           book.get("pageCount"),
                           book.get("publishedDate", ""),
                           ", ".join(book.get("categories", []))
                       ))

    connection.commit()
    connection.close()

def get_saved_books():
    connection = get_connection()

    rows = connection.execute(
        "SELECT * FROM bookshelf"
    ).fetchall()

    connection.close()

    books = []

    for row in rows:
        books.append({
            "id": row["id"],
            "title": row["title"],
            "authors": row["authors"].split(", ") if row["authors"] else [],
            "description": row["description"],
            "thumbnail": row["thumbnail"],
            "pageCount": row["page_count"],
            "publishedDate": row["published_date"],
            "categories": row["categories"].split(", ") if row["categories"] else []
        })

    return books

def delete_book(book_id):
    connection = get_connection()
    cursor = connection.execute(
        "DELETE FROM bookshelf WHERE id = ?",
        (book_id,)
    )
    connection.commit()
    deleted = cursor.rowcount > 0
    connection.close()

    return deleted