const API_URL = "http://localhost:8000";

export interface Book {
  id: string;
  title: string;
  authors: string[];
  description: string;
  thumbnail: string | null;
  pageCount: number | null;
  publishedDate?: string;
  categories?: string[];
  // Only on saved bookshelf books
  status?: ReadingStatus;
  startedAt?: string | null;
  finishedAt?: string | null;
  timesFinished?: number;
  rating?: number | null; // 1-5 stars, once a finished book is rated
  favoritePart?: string | null;
}

export type ReadingStatus = "want_to_read" | "reading" | "finished";

// Search books using Google Books API
export async function searchBooks(query: string, language?: string): Promise<Book[]> {
  const languageParam = language ? `&language=${encodeURIComponent(language)}` : "";
  const response = await fetch(
    `${API_URL}/books/search?query=${encodeURIComponent(query)}${languageParam}`
  );

  if (!response.ok) {
    throw new Error("Failed to search books");
  }

  return response.json();
}

// Get details about a specific book
export async function getBookDetails(bookId: string): Promise<Book> {
  const response = await fetch(
    `${API_URL}/books/${encodeURIComponent(bookId)}`
  );

  if (!response.ok) {
    throw new Error("Failed to retrieve book details");
  }

  return response.json();
}

// Save a book to the authenticated user's bookshelf
export async function saveBook(book: Book): Promise<void> {
  const response = await fetch(`${API_URL}/bookshelf`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(book),
  });

  if (!response.ok) {
    throw new Error("Failed to save book");
  }
}

// Retrieve saved books
export async function getSavedBooks(): Promise<Book[]> {
  const response = await fetch(`${API_URL}/bookshelf`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to retrieve saved books");
  }

  return response.json();
}

// Remove a book from the bookshelf
export async function deleteBook(bookId: string): Promise<void> {
  const response = await fetch(
    `${API_URL}/bookshelf/${encodeURIComponent(bookId)}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete book");
  }
}

// Move a saved book to "want to read", "reading", or "finished"
export async function updateBookStatus(bookId: string, status: ReadingStatus): Promise<Book> {
  const response = await fetch(
    `${API_URL}/bookshelf/${encodeURIComponent(bookId)}/status`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update book status");
  }

  return response.json();
}

// Rate a finished book (1-5 stars) and optionally share a favorite part
export async function reviewBook(bookId: string, rating: number, favoritePart: string): Promise<Book> {
  const response = await fetch(
    `${API_URL}/bookshelf/${encodeURIComponent(bookId)}/review`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rating, favoritePart }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save rating");
  }

  return response.json();
}
