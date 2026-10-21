import hashlib
import secrets
import sqlite3
import time
from pathlib import Path


DATABASE_PATH = Path(__file__).resolve().parent / "books.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH, timeout=30)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA busy_timeout = 30000")
    return connection


def init_db():
    connection = get_connection()

    # Store book information
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

    # Connect saved books to individual students
    connection.execute("""
        CREATE TABLE IF NOT EXISTS student_bookshelf (
            student_id TEXT NOT NULL,
            book_id TEXT NOT NULL,
            PRIMARY KEY (student_id, book_id),
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (book_id) REFERENCES bookshelf(id)
        )
    """)

    # Store student profiles
    connection.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            workos_user_id TEXT UNIQUE,
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

    # Add WorkOS user ID to existing student records
    columns = [
        row["name"]
        for row in connection.execute("PRAGMA table_info(students)").fetchall()
    ]

    if "workos_user_id" not in columns:
        connection.execute(
            "ALTER TABLE students ADD COLUMN workos_user_id TEXT"
        )

    connection.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_students_workos_user
        ON students(workos_user_id)
    """)

    # Store authenticated user sessions
    connection.execute("""
        CREATE TABLE IF NOT EXISTS auth_sessions (
            session_hash TEXT PRIMARY KEY,
            workos_user_id TEXT NOT NULL,
            expires_at INTEGER NOT NULL
        )
    """)

    # Add WorkOS session IDs to existing databases
    columns = [
        row["name"]
        for row in connection.execute("PRAGMA table_info(auth_sessions)").fetchall()
    ]

    if "workos_session_id" not in columns:
        connection.execute(
            "ALTER TABLE auth_sessions ADD COLUMN workos_session_id TEXT"
        )

    connection.commit()
    connection.close()


def save_book(book, student_id):
    connection = get_connection()

    # Save book details if they are not already stored
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

    # Add the book to this student's bookshelf
    connection.execute("""
        INSERT OR IGNORE INTO student_bookshelf (student_id, book_id)
        VALUES (?, ?)
    """, (student_id, book["id"]))

    connection.commit()
    connection.close()


def get_saved_books(student_id):
    connection = get_connection()

    rows = connection.execute("""
        SELECT bookshelf.*
        FROM bookshelf
        JOIN student_bookshelf
            ON bookshelf.id = student_bookshelf.book_id
        WHERE student_bookshelf.student_id = ?
    """, (student_id,)).fetchall()

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


def delete_book(book_id, student_id):
    connection = get_connection()

    cursor = connection.execute("""
        DELETE FROM student_bookshelf
        WHERE book_id = ? AND student_id = ?
    """, (book_id, student_id))

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


def find_student_by_workos_id(workos_user_id):
    connection = get_connection()

    row = connection.execute(
        "SELECT * FROM students WHERE workos_user_id = ?",
        (workos_user_id,)
    ).fetchone()

    connection.close()

    return student_from_row(row) if row else None


def create_student(student_id, name, workos_user_id):
    connection = get_connection()

    connection.execute("""
        INSERT INTO students (id, name, workos_user_id)
        VALUES (?, ?, ?)
    """, (student_id, name, workos_user_id))

    connection.commit()
    connection.close()

    return get_student(student_id)


def update_student(student_id, changes):
    # Changes use frontend field names
    # Example: {"hatId": "crown", "interests": ["Dinosaurs"]}

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


# Authentication sessions
def hash_session(token):
    return hashlib.sha256(token.encode()).hexdigest()


def create_auth_session(workos_user_id, workos_session_id):
    token = secrets.token_urlsafe(32)
    expires_at = int(time.time()) + 86400

    connection = get_connection()
    connection.execute(
        """
        INSERT INTO auth_sessions (
            session_hash,
            workos_user_id,
            expires_at,
            workos_session_id
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            hash_session(token),
            workos_user_id,
            expires_at,
            workos_session_id
        )
    )
    connection.commit()
    connection.close()

    return token

def get_workos_session_id(token):
    connection = get_connection()

    row = connection.execute(
        """
        SELECT workos_session_id
        FROM auth_sessions
        WHERE session_hash = ?
        """,
        (hash_session(token),)
    ).fetchone()

    connection.close()

    return row["workos_session_id"] if row else None

def get_auth_session(token):
    connection = get_connection()

    row = connection.execute("""
        SELECT workos_user_id
        FROM auth_sessions
        WHERE session_hash = ?
          AND expires_at > ?
    """, (hash_session(token), int(time.time()))).fetchone()

    connection.close()

    return row["workos_user_id"] if row else None


def delete_auth_session(token):
    connection = get_connection()

    connection.execute("""
        DELETE FROM auth_sessions
        WHERE session_hash = ?
    """, (hash_session(token),))

    connection.commit()
    connection.close()