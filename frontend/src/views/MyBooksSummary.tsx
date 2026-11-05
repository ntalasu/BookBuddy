import { useEffect, useState } from "react"
import { Link } from "react-router"
import { getSavedBooks, type Book } from "../services/api"

// e.g. "Nov 2"
function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function BookRow({ book, note }: { book: Book; note: string }) {
  return (
    <li className="flex items-center gap-3">
      {book.thumbnail ? (
        <img src={book.thumbnail} alt="" className="h-14 w-10 shrink-0 rounded object-cover shadow" />
      ) : (
        <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded bg-gray-200 text-lg">📕</div>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold">{book.title}</p>
        <p className="text-sm text-gray-500">{note}</p>
      </div>
    </li>
  )
}

// The "My Books" section on the Progress page: books being read and books finished
function MyBooksSummary() {
  const [books, setBooks] = useState<Book[] | null>(null)
  const [error, setError] = useState(false)

  // load once when the screen first shows up
  useEffect(() => {
    let ignore = false // if the screen closes before the data arrives, don't use it
    getSavedBooks()
      .then((result) => {
        if (!ignore) setBooks(result)
      })
      .catch(() => {
        if (!ignore) setError(true)
      })
    return () => {
      ignore = true
    }
  }, [])

  if (error) return <p className="text-sm text-red-600">Couldn't load your books.</p>
  if (!books) return <p className="text-sm text-gray-500">Loading your books…</p>

  const reading = books.filter((book) => book.status === "reading")
  const finished = books
    .filter((book) => book.status === "finished")
    .sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? "")) // newest first
  const wantToRead = books.filter((book) => (book.status ?? "want_to_read") === "want_to_read")

  return (
    <div className="max-w-xl rounded-xl bg-white p-6 shadow-lg">
      <div className="flex flex-wrap gap-3 text-sm font-semibold">
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800">📖 Reading {reading.length}</span>
        <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">✅ Finished {finished.length}</span>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">🌟 Want to Read {wantToRead.length}</span>
      </div>

      {books.length === 0 && (
        <p className="mt-4 text-gray-600">
          No books yet!{" "}
          <Link to="/discover" className="font-semibold text-orange-600 underline">
            Find a book to read
          </Link>
        </p>
      )}

      {reading.length > 0 && (
        <>
          <h4 className="mt-5 mb-2 font-semibold text-gray-700">Reading Now</h4>
          <ul className="space-y-3">
            {reading.map((book) => (
              <BookRow
                key={book.id}
                book={book}
                note={book.startedAt ? `Started ${formatDate(book.startedAt)}` : "Reading now"}
              />
            ))}
          </ul>
        </>
      )}

      {finished.length > 0 && (
        <>
          <h4 className="mt-5 mb-2 font-semibold text-gray-700">Finished</h4>
          <ul className="space-y-3">
            {finished.map((book) => (
              <BookRow
                key={book.id}
                book={book}
                note={book.finishedAt ? `Finished ${formatDate(book.finishedAt)} 🎉` : "Finished 🎉"}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default MyBooksSummary
