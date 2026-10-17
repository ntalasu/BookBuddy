import { useEffect, useState } from "react"
import {
  searchBooks,
  getBookDetails,
  type Book as ApiBook
} from "../services/api"

type Book = {
  id: string
  title: string
  author: string
  readingLevel: string
  genres: string[]
  coverUrl: string
  description: string
  pageCount: number | null
  publishedDate: string
}

const spineColors = [
  "bg-red-800",
  "bg-blue-800",
  "bg-emerald-700",
  "bg-amber-600",
  "bg-purple-800"
]

const spineHeights = [
  "h-80",
  "h-72",
  "h-76",
  "h-68",
  "h-80"
]

// Convert Google Books data into our bookshelf format
function formatBook(book: ApiBook): Book {
  return {
    id: book.id,
    title: book.title,
    author: book.authors.join(", ") || "Unknown author",
    readingLevel: "Not available",
    genres: book.categories || [],
    coverUrl: book.thumbnail || "",
    description: book.description || "",
    pageCount: book.pageCount ?? null,
    publishedDate: book.publishedDate || ""
  }
}

function BookDiscoveryView() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [query, setQuery] = useState("Matilda")
  const [loading, setLoading] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [error, setError] = useState("")
  const [detailsError, setDetailsError] = useState("")

  async function handleSearch(searchQuery: string) {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError("")
    setDetailsError("")
    setSelectedBook(null)

    try {
      const results = await searchBooks(searchQuery)
      setBooks(results.map(formatBook))
    } catch (err) {
      console.error("Error searching books:", err)
      setError("Unable to load books. Please try again.")
      setBooks([])
    } finally {
      setLoading(false)
    }
  }

  // Load books when the page opens
  useEffect(() => {
    handleSearch("Matilda")
  }, [])

  // Retrieve full book details when clicked
  async function handleSelectBook(book: Book) {
    setSelectedBook(book)
    setDetailsLoading(true)
    setDetailsError("")

    try {
      const details = await getBookDetails(book.id)
      setSelectedBook(formatBook(details))
    } catch (err) {
      console.error("Error retrieving book details:", err)
      setDetailsError("Unable to load additional book details.")
    } finally {
      setDetailsLoading(false)
    }
  }

  return (
    <section className="p-6">
      <h2 className="mb-4 text-2xl font-bold">
        Your Bookshelf
      </h2>

      {/* Search bar */}
      <div className="mb-6 flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch(query)
          }}
          placeholder="Search for books..."
          className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2"
        />

        <button
          onClick={() => handleSearch(query)}
          disabled={loading}
          className="rounded-lg bg-orange-500 px-6 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Search status */}
      {error && (
        <p className="mb-4 text-red-600">{error}</p>
      )}

      {loading && (
        <p className="mb-4 text-gray-600">Loading books...</p>
      )}

      {!loading && !error && books.length === 0 && (
        <p className="mb-4 text-gray-600">No books found.</p>
      )}

      {/* Bookshelf - Nina's original design */}
      <div className="flex items-end gap-1 border-b-[16px] border-amber-900 px-4">
        {books.map((book, index) => {
          const isSelected = selectedBook?.id === book.id

          return (
            <button
              key={book.id}
              onClick={() => handleSelectBook(book)}
              className={`${spineColors[index % spineColors.length]} ${spineHeights[index % spineHeights.length]}
                flex w-14 cursor-pointer justify-between overflow-hidden rounded-t-sm px-2 py-3 text-white shadow-lg
                transition-transform [writing-mode:vertical-rl]
                ${isSelected ? "-translate-y-6" : "hover:-translate-y-2"}`}
            >
              <span className="font-bold">{book.title}</span>
              <span className="text-xs opacity-80">{book.author}</span>
            </button>
          )
        })}
      </div>

      {/* Book details card */}
      {selectedBook && (
        <div className="mt-8 flex max-w-xl gap-6 rounded-xl bg-white p-6 shadow-lg">

          {selectedBook.coverUrl ? (
            <img
              src={selectedBook.coverUrl}
              alt={`Cover of ${selectedBook.title}`}
              className="h-fit w-32 shrink-0 rounded shadow-md"
            />
          ) : (
            <div className="flex w-32 shrink-0 items-center justify-center rounded bg-gray-200 p-3 text-center text-sm text-gray-500">
              No cover available
            </div>
          )}

          <div>
            <h3 className="text-2xl font-bold">
              {selectedBook.title}
            </h3>

            <p className="text-gray-600">
              by {selectedBook.author}
            </p>

            {detailsLoading && (
              <p className="mt-3 text-sm text-gray-500">
                Loading details...
              </p>
            )}

            {detailsError && (
              <p className="mt-3 text-sm text-red-600">
                {detailsError}
              </p>
            )}

            {!detailsLoading && (
              <>
                {selectedBook.description && (
                  <p className="mt-4 text-sm text-gray-700">
                    {selectedBook.description}
                  </p>
                )}

                {selectedBook.pageCount != null && (
                  <p className="mt-3 text-sm">
                    <strong>Pages:</strong> {selectedBook.pageCount}
                  </p>
                )}

                {selectedBook.publishedDate && (
                  <p className="mt-2 text-sm">
                    <strong>Published:</strong> {selectedBook.publishedDate}
                  </p>
                )}

                {selectedBook.genres.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedBook.genres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full bg-amber-100 px-3 py-1 text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default BookDiscoveryView