import { useState } from "react"
import { useLoggedInStudent } from "../context/StudentContext"
import { useRecommendations } from "../hooks/useRecommendations"
import type { Recommendation } from "../types"

const spineColors = ["bg-red-800", "bg-blue-800", "bg-emerald-700", "bg-amber-600", "bg-purple-800"]
const spineHeights = ["h-80", "h-72", "h-76", "h-68", "h-80"]

function BookDiscoveryView() {
  const { student } = useLoggedInStudent()
  const { recommendations, loading, error } = useRecommendations(student.id)
  const [selected, setSelected] = useState<Recommendation | null>(null)

  if (loading) return <p className="p-6 text-gray-500">Finding books for you…</p>
  if (error) return <p className="p-6 text-red-600">Couldn't load books: {error}</p>

  return (
    <section className="p-6">
      <h2 className="mb-4 text-2xl font-bold">Your Bookshelf</h2>

      {/* the shelf */}
      <div className="flex items-end gap-1 border-b-[16px] border-amber-900 px-4">
        {recommendations.map((recommendation, index) => {
          const { book } = recommendation
          const isSelected = selected?.book.id === book.id
          return (
            // one book spine
            <button
              key={book.id}
              onClick={() => setSelected(recommendation)}
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

      {/* details card for the book that was clicked */}
      {selected && (
        <div className="mt-8 flex max-w-xl gap-6 rounded-xl bg-white p-6 shadow-lg">
          <img
            src={selected.book.coverUrl}
            alt={`Cover of ${selected.book.title}`}
            className="w-32 rounded shadow-md"
          />
          <div>
            <h3 className="text-2xl font-bold">{selected.book.title}</h3>
            <p className="text-gray-600">by {selected.book.author}</p>
            <p className="mt-3 italic">"{selected.reason}"</p>
            <p className="mt-3 text-sm font-semibold">{selected.book.readingLevel}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selected.book.genres.map((genre) => (
                <span key={genre} className="rounded-full bg-amber-100 px-3 py-1 text-sm">
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default BookDiscoveryView
