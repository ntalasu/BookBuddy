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
}

// Search books using Google Books API
export async function searchBooks(query: string): Promise<Book[]> {
  const response = await fetch(
    `${API_URL}/books/search?query=${encodeURIComponent(query)}`
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
