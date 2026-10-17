const API_URL = "http://127.0.0.1:8000";

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

export async function searchBooks(query: string): Promise<Book[]> {
  const response = await fetch(
    `${API_URL}/books/search?query=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error("Failed to search books");
  }

  return response.json();
}

export async function getBookDetails(bookId: string): Promise<Book> {
  const response = await fetch(
    `${API_URL}/books/${encodeURIComponent(bookId)}`
  );

  if (!response.ok) {
    throw new Error("Failed to retrieve book details");
  }

  return response.json();
}

export async function saveBook(book: Book): Promise<void> {
  const response = await fetch(`${API_URL}/bookshelf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(book),
  });

  if (!response.ok) {
    throw new Error("Failed to save book");
  }
}

export async function getSavedBooks(): Promise<Book[]> {
  const response = await fetch(`${API_URL}/bookshelf`);

  if (!response.ok) {
    throw new Error("Failed to retrieve saved books");
  }

  return response.json();
}

export async function deleteBook(bookId: string): Promise<void> {
  const response = await fetch(
    `${API_URL}/bookshelf/${encodeURIComponent(bookId)}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete book");
  }
}