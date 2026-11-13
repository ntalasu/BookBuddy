import { useEffect, useState } from "react"
import {
  searchBooks,
  getBookDetails,
  saveBook,
  getSavedBooks,
  deleteBook,
  updateBookStatus,
  reviewBook,
  type Book as ApiBook,
  type ReadingStatus
} from "../services/api"
import BookReviewCard from "./BookReviewCard"
import Stars from "./Stars"

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
  // Only on saved bookshelf books
  status?: ReadingStatus
  startedAt?: string | null
  finishedAt?: string | null
  rating?: number | null
  favoritePart?: string | null
}

// The three shelves on "My Bookshelf"
const shelves: { status: ReadingStatus; title: string; empty: string }[] = [
  { status: "want_to_read", title: "🌟 Want to Read", empty: "Save a book below to add it here!" },
  { status: "reading", title: "📖 Reading Now", empty: "Pick a book from Want to Read and start reading!" },
  { status: "finished", title: "✅ Finished", empty: "Books you finish will show up here." },
]

type ShelfArea = "discover" | "shelf"

// e.g. "Nov 2"
function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const recommendedTopics = [
  "Matilda",
  "Charlotte's Web",
  "The Wild Robot",
  "Magic Tree House",
  "Dog Man",
  "The Very Hungry Caterpillar",
  "National Geographic Kids",
  "Percy Jackson",
]

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

// Pick a spine style from the book id so the same book always looks
// the same, whether it's on the discover shelf or the saved bookshelf
function getSpineStyle(bookId: string) {
  let hash = 0
  for (const char of bookId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return `${spineColors[hash % spineColors.length]} ${spineHeights[hash % spineHeights.length]}`
}

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
    publishedDate: book.publishedDate || "",
    status: book.status,
    startedAt: book.startedAt,
    finishedAt: book.finishedAt,
    rating: book.rating,
    favoritePart: book.favoritePart
  }
}

function BookDiscoveryView() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  // which part of the page the selected book was tapped on, so its details show right there
  const [selectedFrom, setSelectedFrom] = useState<ShelfArea>("discover")
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [books, setBooks] = useState<Book[]>([])
  const [savedBooks, setSavedBooks] = useState<Book[]>([])
  const [query, setQuery] = useState("Matilda")
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [error, setError] = useState("")
  const [detailsError, setDetailsError] = useState("")

  //const [, setShowingRecommendations] = useState(true)
  // the saved book being rated in the "How did you like it?" pop-up
  const [reviewingBook, setReviewingBook] = useState<Book | null>(null)
  const [reviewJustFinished, setReviewJustFinished] = useState(false)

  async function loadRecommendations() {
    setLoading(true)
    setError("")
    setSelectedBook(null)
    setShowingRecommendations(true)

    try {
      const results = await Promise.all(
        recommendedTopics.map((topic) => searchBooks(topic))
      )

      const uniqueBooks = new Map<string, Book>()

      results.forEach((bookList) => {
        const book = bookList[0]

        if (book) {
          uniqueBooks.set(book.id, formatBook(book))
        }
      })

      setBooks(Array.from(uniqueBooks.values()))
    } catch (err) {
      console.error("Error loading recommendations:", err)
      setError("Unable to load recommended books.")
    } finally {
      setLoading(false)
    }
  }

  async function loadSavedBooks() {
    try {
      const results = await getSavedBooks()
      setSavedBooks(results.map(formatBook))
    } catch (error) {
      console.error("Error loading saved books:", error)
    }
  }

  // Save selected book to the database
  const handleSaveBook = async () => {
    if (!selectedBook || saving || detailsLoading) return

    setSaving(true)
    setSaveMessage("")

    try {
      const bookDetails = await getBookDetails(selectedBook.id)

      await saveBook(bookDetails)
      await loadSavedBooks()

      setSaveMessage("Book saved to your bookshelf!")
    } catch (error) {
      console.error("Error saving book:", error)
      setSaveMessage("Failed to save book.")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBook = async () => {
    if (!selectedBook) return

    try {
      await deleteBook(selectedBook.id)

      // Remove the deleted book from the bookshelf
      setSavedBooks((prev) =>
        prev.filter((book) => book.id !== selectedBook.id)
      )

      setSelectedBook(null)
      setSaveMessage("")
    } catch (error) {
      console.error("Error deleting book:", error)
      setSaveMessage("Failed to remove book.")
    }
  }

  // Move the selected saved book to another shelf
  async function handleChangeStatus(status: ReadingStatus) {
    if (!selectedBook) return

    setSaveMessage("")

    try {
      const updated = formatBook(await updateBookStatus(selectedBook.id, status))

      setSavedBooks((prev) =>
        prev.map((book) => (book.id === updated.id ? updated : book))
      )

      if (status === "reading") setSaveMessage("Happy reading! 📖")
      if (status === "finished") {
        setSaveMessage("🎉 Great job finishing this book!")
        setReviewingBook(updated)
        setReviewJustFinished(true)
      }
    } catch (error) {
      console.error("Error updating book status:", error)
      setSaveMessage("Failed to update book.")
    }
  }

  // Save the rating from the pop-up
  async function handleSaveReview(rating: number, favoritePart: string) {
    if (!reviewingBook) return

    const updated = formatBook(await reviewBook(reviewingBook.id, rating, favoritePart))

    setSavedBooks((prev) =>
      prev.map((book) => (book.id === updated.id ? updated : book))
    )
    setReviewingBook(null)
    setSaveMessage("⭐ Thanks for rating this book!")
  }

  // Search for books using Google Books API
async function handleSearch(searchQuery: string) {
  if (!searchQuery.trim()) {
    setBooks([])
    setError("")
    setHasSearched(false)
    return
  }

  setHasSearched(true)
  setLoading(true)

  setError("")
  setDetailsError("")
  setSaveMessage("")
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
  void loadSavedBooks()
}, [])

  // Retrieve full book details when clicked
  async function handleSelectBook(book: Book, from: ShelfArea) {
    // clicking the book that's already open closes it
    if (selectedBook?.id === book.id && selectedFrom === from) {
      setSelectedBook(null)
      return
    }

    setSelectedFrom(from)
    setSelectedBook(book)
    setDetailsLoading(true)
    setDetailsError("")
    setSaveMessage("")

    try {
      const details = await getBookDetails(book.id)
         setSelectedBook((current) => (current?.id === book.id ? formatBook(details) : current))
    } catch (err) {
      console.error("Error retrieving book details:", err)
      setDetailsError("Unable to load additional book details.")
    } finally {
      setDetailsLoading(false)
    }
  }

  // The selected book's bookshelf entry (with its status), if it's saved
  const savedEntry = selectedBook
    ? savedBooks.find((book) => book.id === selectedBook.id)
    : undefined

  // One book spine. Used on every shelf.
  function renderSpine(book: Book, from: ShelfArea) {
    const isSelected = selectedBook?.id === book.id && selectedFrom === from

    return (
      <button
        key={book.id}
        onClick={() => handleSelectBook(book, from)}
        className={`${getSpineStyle(book.id)}
          flex w-14 cursor-pointer justify-between overflow-hidden rounded-t-sm px-2 py-3 text-white shadow-lg
          transition-transform [writing-mode:vertical-rl]
          ${isSelected ? "-translate-y-6" : "hover:-translate-y-2"}`}
      >
        <span className="font-bold">
          {book.title}
        </span>

        <span className="text-xs opacity-80">
          {book.author}
        </span>
      </button>
    )
  }

  // Book details card, shown under the shelf the book was tapped on
  const detailsCard = selectedBook && (
    <div className="mt-8 flex max-w-xl gap-6 rounded-xl bg-white p-6 shadow-lg">

      {/* Book cover */}
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

      {/* Book information */}
      <div className="min-w-0 flex-1">

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
            {/* Description */}
            {selectedBook.description && (
              <p className="mt-4 text-sm text-gray-700">
                {selectedBook.description}
              </p>
            )}

            {/* Page count */}
            {selectedBook.pageCount != null && (
              <p className="mt-3 text-sm">
                <strong>Pages:</strong> {selectedBook.pageCount}
              </p>
            )}

            {/* Published date */}
            {selectedBook.publishedDate && (
              <p className="mt-2 text-sm">
                <strong>Published:</strong> {selectedBook.publishedDate}
              </p>
            )}

            {/* Genres */}
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

        {/* Reading status: what's next for this saved book */}
        {savedEntry?.status === "finished" && savedEntry.finishedAt && (
          <p className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-800">
            ✅ {savedEntry.startedAt
              ? `You started this on ${formatDate(savedEntry.startedAt)} and finished on ${formatDate(savedEntry.finishedAt)}!`
              : `You finished this on ${formatDate(savedEntry.finishedAt)}!`}
          </p>
        )}

        {/* Rating: shown once a book is finished (and kept while rereading) */}
        {savedEntry && (savedEntry.status === "finished" || savedEntry.rating) && (
          <div className="mt-3 rounded-lg bg-yellow-50 p-3 text-sm">
            {savedEntry.rating ? (
              <>
                <p className="flex items-center gap-2">
                  <strong>Your rating:</strong> <Stars rating={savedEntry.rating} size="text-xl" />
                </p>
                {savedEntry.favoritePart && (
                  <p className="mt-1 text-gray-700">
                    <strong>Favorite part:</strong> “{savedEntry.favoritePart}”
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-600">You haven't rated this book yet.</p>
            )}

            <button
              onClick={() => {
                setReviewingBook(savedEntry)
                setReviewJustFinished(false)
              }}
              className="mt-2 font-semibold text-orange-600 underline hover:text-orange-700"
            >
              {savedEntry.rating ? "Change rating" : "⭐ Rate this book"}
            </button>
          </div>
        )}

        {savedEntry?.status === "reading" && savedEntry.startedAt && (
          <p className="mt-5 text-sm text-gray-600">
            📖 You started reading this on {formatDate(savedEntry.startedAt)}.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {/* Save to Bookshelf button */}
          {!savedEntry && (
            <button
              onClick={handleSaveBook}
              disabled={saving || detailsLoading}
              className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : "📚 Save to Bookshelf"}
            </button>
          )}

          {savedEntry && (savedEntry.status ?? "want_to_read") === "want_to_read" && (
            <button
              onClick={() => handleChangeStatus("reading")}
              className="rounded-lg bg-sky-500 px-5 py-2 font-semibold text-white hover:bg-sky-600"
            >
              📖 I started reading this!
            </button>
          )}

          {savedEntry?.status === "reading" && (
            <button
              onClick={() => handleChangeStatus("finished")}
              className="rounded-lg bg-green-500 px-5 py-2 font-semibold text-white hover:bg-green-600"
            >
              ✅ I finished it!
            </button>
          )}

          {savedEntry?.status === "finished" && (
            <button
              onClick={() => handleChangeStatus("reading")}
              className="rounded-lg bg-sky-100 px-5 py-2 font-semibold text-sky-800 hover:bg-sky-200"
            >
              🔁 Read it again
            </button>
          )}

          {savedEntry && (
            <button
              onClick={handleDeleteBook}
              className="rounded-lg bg-red-500 px-5 py-2 font-semibold text-white hover:bg-red-600"
            >
              🗑️ Remove from Bookshelf
            </button>
          )}
        </div>

        {/* Save confirmation message */}
        {saveMessage && (
          <p className="mt-2 text-sm text-gray-700">
            {saveMessage}
          </p>
        )}

      </div>
    </div>
  )

  return (
    <section className="p-6">

      {/* Discover books */}
      <h2 className="mb-4 text-2xl font-bold">
        🔎 Discover Books
      </h2>

      {/* Search bar */}
      <div className="mb-6 flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
          }}
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
        <p className="mb-4 text-red-600">
          {error}
        </p>
      )}

      {loading && (
        <p className="mb-4 text-gray-600">
          Loading books...
        </p>
      )}

      {hasSearched && !loading && !error && books.length === 0 && (
        <p className="mb-4 text-gray-600">
          No books found.
        </p>
      )}

      {/* Bookshelf - Nina's original design */}
      <div className="flex items-end gap-1 border-b-[16px] border-amber-900 px-4">
        {books.map((book) => renderSpine(book, "discover"))}
      </div>

      {selectedFrom === "discover" && detailsCard}

      {/* My saved bookshelf */}
      <h2 className="mt-12 mb-4 text-2xl font-bold">
        📚 My Bookshelf
      </h2>

      {savedBooks.length === 0 ? (
        <p className="mb-8 text-gray-600">
          No saved books yet. Discover a book and add it to your bookshelf!
        </p>
      ) : (
        <div className="mb-10 space-y-8">
          {shelves.map((shelf) => {
            const shelfBooks = savedBooks.filter(
              (book) => (book.status ?? "want_to_read") === shelf.status
            )

            return (
              <div key={shelf.status}>
                <h3 className="mb-2 text-lg font-semibold">
                  {shelf.title} ({shelfBooks.length})
                </h3>

                {shelfBooks.length === 0 ? (
                  <p className="border-b-[16px] border-amber-900 px-4 pb-3 text-sm text-gray-500">
                    {shelf.empty}
                  </p>
                ) : (
                  <div className="mt-8 flex items-end gap-1 border-b-[16px] border-amber-900 px-4">
                    {shelfBooks.map((book) => renderSpine(book, "shelf"))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {selectedFrom === "shelf" && detailsCard}

      {/* "How did you like it?" pop-up */}
      {reviewingBook && (
        <BookReviewCard
          bookTitle={reviewingBook.title}
          justFinished={reviewJustFinished}
          initialRating={reviewingBook.rating}
          initialFavoritePart={reviewingBook.favoritePart}
          onSave={handleSaveReview}
          onSkip={() => setReviewingBook(null)}
        />
      )}
    </section>
  )
}

export default BookDiscoveryView