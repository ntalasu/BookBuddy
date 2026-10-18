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

    connection.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            age INTEGER NOT NULL DEFAULT 8,
            reading_level TEXT NOT NULL DEFAULT 'Grade 3',
            reading_minutes INTEGER NOT NULL DEFAULT 0,
            interests TEXT NOT NULL DEFAULT '',
            character_id TEXT NOT NULL DEFAULT 'fox',
            character_color TEXT NOT NULL DEFAULT 'bg-orange-200',
            buddy_name TEXT NOT NULL DEFAULT '',
            hat_id TEXT NOT NULL DEFAULT 'none',
            item_id TEXT NOT NULL DEFAULT 'none'
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

# Frontend (camelCase) field name -> students table column
STUDENT_COLUMNS = {
    "name": "name",
    "age": "age",
    "readingLevel": "reading_level",
    "readingMinutes": "reading_minutes",
    "interests": "interests",
    "characterId": "character_id",
    "characterColor": "character_color",
    "buddyName": "buddy_name",
    "hatId": "hat_id",
    "itemId": "item_id",
}


def student_from_row(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "age": row["age"],
        "readingLevel": row["reading_level"],
        "readingMinutes": row["reading_minutes"],
        "interests": row["interests"].split(", ") if row["interests"] else [],
        "characterId": row["character_id"],
        "characterColor": row["character_color"],
        "buddyName": row["buddy_name"],
        "hatId": row["hat_id"],
        "itemId": row["item_id"]
    }


def get_student(student_id):
    connection = get_connection()

    row = connection.execute(
        "SELECT * FROM students WHERE id = ?",
        (student_id,)
    ).fetchone()

    connection.close()

    return student_from_row(row) if row else None


def find_student_by_name(name):
    connection = get_connection()

    row = connection.execute(
        "SELECT * FROM students WHERE LOWER(name) = LOWER(?)",
        (name,)
    ).fetchone()

    connection.close()

    return student_from_row(row) if row else None


def create_student(student_id, name):
    connection = get_connection()

    connection.execute(
        "INSERT INTO students (id, name) VALUES (?, ?)",
        (student_id, name)
    )

    connection.commit()
    connection.close()

    return get_student(student_id)


def update_student(student_id, changes):
    # changes uses frontend field names, e.g. {"hatId": "crown", "interests": ["Dinosaurs"]}
    columns = []
    values = []

    for field, value in changes.items():
        if field == "interests":
            value = ", ".join(value)
        columns.append(f"{STUDENT_COLUMNS[field]} = ?")
        values.append(value)

    if columns:
        connection = get_connection()
        connection.execute(
            f"UPDATE students SET {', '.join(columns)} WHERE id = ?",
            (*values, student_id)
        )
        connection.commit()
        connection.close()

    return get_student(student_id)
