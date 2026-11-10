import { useState } from "react"
import { shortTitle } from "../ai/bookFinder"
import { saveBook, type Book } from "../services/api"

// A book Buddy recommended in the chat, with a button to add it to the kid's bookshelf
function RecommendedBookCard({ book }: { book: Book }) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle")

  async function addToBookshelf() {
    setState("saving")
    try {
      await saveBook(book) // same as "Save to Bookshelf" on the Discover page: goes to Want to Read
      setState("saved")
    } catch {
      setState("error")
    }
  }

  return (
    <div className="mt-2 flex items-center gap-3 rounded-xl bg-white p-2 shadow-sm">
      {book.thumbnail ? (
        <img src={book.thumbnail} alt="" className="h-16 w-11 shrink-0 rounded object-cover shadow" />
      ) : (
        <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-gray-200 text-xl">📕</div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{shortTitle(book.title)}</p>
        {book.authors.length > 0 && <p className="truncate text-xs text-gray-500">by {book.authors.join(", ")}</p>}

        {state === "saved" ? (
          <p className="mt-1 text-sm font-semibold text-green-700">✅ On your bookshelf!</p>
        ) : (
          <button
            onClick={addToBookshelf}
            disabled={state === "saving"}
            className="mt-1 rounded-lg bg-orange-500 px-3 py-1 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {state === "saving" ? "Adding…" : "📚 Add to my bookshelf"}
          </button>
        )}
        {state === "error" && <p className="mt-1 text-xs text-red-600">Couldn't add it. Try again!</p>}
      </div>
    </div>
  )
}

export default RecommendedBookCard
