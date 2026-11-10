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
  matchedTopics?: string[]; // from recommendations: which asked-for topics the book really matches
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

// Good kids' books for topics like ["ghost", "dinosaur"], ranked by how popular they are
// and how well they match the kid's interests. exclude = titles to skip (already suggested or saved).
export async function getRecommendations(
  topics: string[],
  interests: string[],
  age: number,
  exclude: string[],
  readingLevel?: string,
  interestTopics: string[] = [],
  limit = 1
): Promise<Book[]> {
  const params = new URLSearchParams({ age: String(age), limit: String(limit) });
  if (readingLevel) params.append("reading_level", readingLevel);
  interestTopics.forEach((topic) => params.append("interest_topics", topic));
  topics.forEach((topic) => params.append("topics", topic));
  interests.forEach((interest) => params.append("interests", interest));
  exclude.forEach((title) => params.append("exclude", title));

  const response = await fetch(`${API_URL}/books/recommendations?${params}`);

  if (!response.ok) {
    throw new Error("Failed to get recommendations");
  }

  return response.json();
}

// Is this a well-known kids' book? For things kids type like "cat in the hat". Returns null if not.
export async function getKnownBook(title: string): Promise<Book | null> {
  const response = await fetch(`${API_URL}/books/known?title=${encodeURIComponent(title)}`);

  if (!response.ok) {
    return null;
  }

  return response.json();
}
