import type { Book, Recommendation } from "../types"
import { ApiClient, fakeDelay, USE_MOCK } from "./ApiClient"

const fakeBooks: Book[] = [
  { id: "1", title: "The Great Gatsby", author: "F. Scott Fitzgerald", readingLevel: "Advanced", genres: ["Fiction", "Classic"], coverUrl: "https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg" },
  { id: "2", title: "Charlotte's Web", author: "E. B. White", readingLevel: "Grade 3", genres: ["Animals", "Friendship"], coverUrl: "https://covers.openlibrary.org/b/isbn/9780064400558-M.jpg" },
  { id: "3", title: "Matilda", author: "Roald Dahl", readingLevel: "Grade 4", genres: ["Funny", "Magic"], coverUrl: "https://covers.openlibrary.org/b/isbn/9780142410370-M.jpg" },
  { id: "4", title: "The Wild Robot", author: "Peter Brown", readingLevel: "Grade 3", genres: ["Adventure", "Robots"], coverUrl: "https://covers.openlibrary.org/b/isbn/9780316381994-M.jpg" },
  { id: "5", title: "Holes", author: "Louis Sachar", readingLevel: "Grade 5", genres: ["Mystery", "Adventure"], coverUrl: "https://covers.openlibrary.org/b/isbn/9780440414803-M.jpg" },
]

const fakeReasons = [
  "A classic story full of big dreams.",
  "Perfect if you love animals and friendship.",
  "Funny, magical, and a little bit sneaky!",
  "An adventure with a robot who learns about nature.",
  "A mystery that will keep you guessing.",
]

export const BookApiService = {
  async getRecommendations(studentId: string): Promise<Recommendation[]> {
    if (USE_MOCK) {
      await fakeDelay()
      return fakeBooks.map((book, i) => ({ rank: i + 1, reason: fakeReasons[i], book }))
    }
    return ApiClient.get(`/students/${studentId}/recommendations`)
  },

  async getBook(bookId: string): Promise<Book> {
    if (USE_MOCK) {
      await fakeDelay()
      const book = fakeBooks.find((b) => b.id === bookId)
      if (!book) throw new Error("Book not found")
      return book
    }
    return ApiClient.get(`/books/${bookId}`)
  },
}
