import hashlib
import secrets
import sqlite3
import time
from datetime import datetime, timezone
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

    # Add reading status to existing bookshelves.
    # Books saved before this was added start out as "want_to_read".
    columns = [
        row["name"]
        for row in connection.execute("PRAGMA table_info(student_bookshelf)").fetchall()
    ]

    if "status" not in columns:
        connection.execute(
            "ALTER TABLE student_bookshelf ADD COLUMN status TEXT NOT NULL DEFAULT 'want_to_read'"
        )

    if "started_at" not in columns:
        connection.execute(
            "ALTER TABLE student_bookshelf ADD COLUMN started_at TEXT"
        )

    if "finished_at" not in columns:
        connection.execute(
            "ALTER TABLE student_bookshelf ADD COLUMN finished_at TEXT"
        )

    # How many times the book has been finished, so rereading doesn't erase it
    if "times_finished" not in columns:
        connection.execute(
            "ALTER TABLE student_bookshelf ADD COLUMN times_finished INTEGER NOT NULL DEFAULT 0"
        )

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

    # Every book a student has ever finished. Kept even if the book is
    # removed from their bookshelf, so finished-book badges stay earned.
    connection.execute("""
        CREATE TABLE IF NOT EXISTS finished_books (
            student_id TEXT NOT NULL,
            book_id TEXT NOT NULL,
            first_finished_at TEXT NOT NULL,
            PRIMARY KEY (student_id, book_id),
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    """)

    # Star rating and favorite part a student gives a finished book
    columns = [
        row["name"]
        for row in connection.execute("PRAGMA table_info(finished_books)").fetchall()
    ]

    if "rating" not in columns:
        connection.execute(
            "ALTER TABLE finished_books ADD COLUMN rating INTEGER"
        )

    if "favorite_part" not in columns:
        connection.execute(
            "ALTER TABLE finished_books ADD COLUMN favorite_part TEXT"
        )

    # Books finished before this table existed
    connection.execute("""
        INSERT OR IGNORE INTO finished_books (student_id, book_id, first_finished_at)
        SELECT student_id, book_id, finished_at
        FROM student_bookshelf
        WHERE times_finished > 0 AND finished_at IS NOT NULL
    """)

    # Store every reading session a student logs
    connection.execute("""
        CREATE TABLE IF NOT EXISTS reading_logs (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            minutes_read INTEGER NOT NULL,
            logged_at TEXT NOT NULL,
            utc_offset_minutes INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    """)

    connection.execute("""
        CREATE INDEX IF NOT EXISTS idx_reading_logs_student
        ON reading_logs(student_id)
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
        SELECT
            bookshelf.*,
            student_bookshelf.status,
            student_bookshelf.started_at,
            student_bookshelf.finished_at,
            student_bookshelf.times_finished,
            finished_books.rating,
            finished_books.favorite_part
        FROM bookshelf
        JOIN student_bookshelf
            ON bookshelf.id = student_bookshelf.book_id
        LEFT JOIN finished_books
            ON finished_books.book_id = student_bookshelf.book_id
            AND finished_books.student_id = student_bookshelf.student_id
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
            "categories": row["categories"].split(", ") if row["categories"] else [],
            "status": row["status"],
            "startedAt": row["started_at"],
            "finishedAt": row["finished_at"],
            "timesFinished": row["times_finished"],
            "rating": row["rating"],
            "favoritePart": row["favorite_part"]
        })

    return books


# Move a saved book to "want_to_read", "reading", or "finished".
# Returns False if the book isn't on this student's bookshelf.
def update_book_status(book_id, student_id, status):
    now = datetime.now(timezone.utc).isoformat()
    connection = get_connection()

    if status == "reading":
        # Starting (or rereading) a book: new start date, not finished yet
        cursor = connection.execute("""
            UPDATE student_bookshelf
            SET status = 'reading', started_at = ?, finished_at = NULL
            WHERE book_id = ? AND student_id = ?
        """, (now, book_id, student_id))

    elif status == "finished":
        # Only count it once if they press "finished" twice
        cursor = connection.execute("""
            UPDATE student_bookshelf
            SET
                times_finished = times_finished + (CASE WHEN status = 'finished' THEN 0 ELSE 1 END),
                status = 'finished',
                started_at = COALESCE(started_at, ?),
                finished_at = CASE WHEN status = 'finished' THEN finished_at ELSE ? END
            WHERE book_id = ? AND student_id = ?
        """, (now, now, book_id, student_id))

        # Remember it for badges (only the first time this book is finished)
        if cursor.rowcount > 0:
            connection.execute("""
                INSERT OR IGNORE INTO finished_books (student_id, book_id, first_finished_at)
                VALUES (?, ?, ?)
            """, (student_id, book_id, now))

    else:
        # Back to the "want to read" list
        cursor = connection.execute("""
            UPDATE student_bookshelf
            SET status = 'want_to_read', started_at = NULL, finished_at = NULL
            WHERE book_id = ? AND student_id = ?
        """, (book_id, student_id))

    connection.commit()

    updated = cursor.rowcount > 0

    connection.close()

    return updated


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


# Save a star rating (1-5) and optional favorite part for a finished book.
# Returns False if the student hasn't finished this book.
def save_book_review(book_id, student_id, rating, favorite_part):
    connection = get_connection()

    cursor = connection.execute("""
        UPDATE finished_books
        SET rating = ?, favorite_part = ?
        WHERE book_id = ? AND student_id = ?
    """, (rating, favorite_part, book_id, student_id))

    connection.commit()

    updated = cursor.rowcount > 0

    connection.close()

    return updated


# How many different books a student has ever finished
def count_finished_books(student_id):
    connection = get_connection()

    count = connection.execute(
        "SELECT COUNT(*) FROM finished_books WHERE student_id = ?",
        (student_id,)
    ).fetchone()[0]

    connection.close()

    return count


# Reading logs
def reading_log_from_row(row):
    return {
        "id": row["id"],
        "studentId": row["student_id"],
        "minutesRead": row["minutes_read"],
        "loggedAt": row["logged_at"],
        "utcOffsetMinutes": row["utc_offset_minutes"]
    }


def add_reading_log(log_id, student_id, minutes, logged_at, utc_offset_minutes):
    connection = get_connection()

    connection.execute("""
        INSERT INTO reading_logs (
            id,
            student_id,
            minutes_read,
            logged_at,
            utc_offset_minutes
        )
        VALUES (?, ?, ?, ?, ?)
    """, (log_id, student_id, minutes, logged_at, utc_offset_minutes))

    # Keep the running total on the student profile up to date
    connection.execute("""
        UPDATE students
        SET reading_minutes = reading_minutes + ?
        WHERE id = ?
    """, (minutes, student_id))

    connection.commit()

    row = connection.execute(
        "SELECT * FROM reading_logs WHERE id = ?",
        (log_id,)
    ).fetchone()

    connection.close()

    return reading_log_from_row(row)


def get_reading_logs(student_id):
    connection = get_connection()

    rows = connection.execute("""
        SELECT * FROM reading_logs
        WHERE student_id = ?
        ORDER BY logged_at
    """, (student_id,)).fetchall()

    connection.close()

    return [reading_log_from_row(row) for row in rows]


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