import { useState } from "react"

type Props = {
  bookTitle: string
  justFinished: boolean // "You finished it!" vs. changing an earlier rating
  initialRating?: number | null
  initialFavoritePart?: string | null
  onSave: (rating: number, favoritePart: string) => Promise<void>
  onSkip: () => void
}

// what each number of stars means, in kid words
const ratingLabels = ["", "Not for me", "It was okay", "Good!", "Really good!", "I loved it!"]

// The "How did you like it?" pop-up shown after finishing a book
function BookReviewCard({ bookTitle, justFinished, initialRating, initialFavoritePart, onSave, onSkip }: Props) {
  const [rating, setRating] = useState(initialRating ?? 0)
  const [hovered, setHovered] = useState(0)
  const [favoritePart, setFavoritePart] = useState(initialFavoritePart ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const shownRating = hovered || rating

  async function save() {
    if (rating === 0 || saving) return
    setSaving(true)
    setError("")
    try {
      await onSave(rating, favoritePart.trim())
    } catch {
      setError("Couldn't save your rating. Try again!")
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onSkip}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-4xl">{justFinished ? "🎉" : "⭐"}</p>
        <h3 className="mt-2 text-xl font-bold">{justFinished ? `You finished ${bookTitle}!` : `Rate ${bookTitle}`}</h3>
        <p className="mt-1 text-gray-600">How did you like it?</p>

        {/* stars */}
        <div className="mt-4 flex justify-center gap-1" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
              className={`text-5xl transition-transform hover:scale-110 ${star <= shownRating ? "text-yellow-400" : "text-gray-300"}`}
            >
              ★
            </button>
          ))}
        </div>
        <p className="mt-1 h-6 font-semibold text-orange-600">{ratingLabels[shownRating]}</p>

        {/* favorite part */}
        <label className="mt-4 block text-left text-sm font-semibold text-gray-700">
          What was your favorite part? <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={favoritePart}
          onChange={(e) => setFavoritePart(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="Tell us about the story!"
          className="mt-1 w-full resize-none rounded-lg border border-gray-300 px-3 py-2"
        />
        <p className="text-right text-xs text-gray-400">{favoritePart.length}/200</p>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={save}
            disabled={rating === 0 || saving}
            className="rounded-lg bg-orange-500 px-6 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={onSkip} className="rounded-lg bg-gray-100 px-6 py-2 font-semibold text-gray-700 hover:bg-gray-200">
            Skip
          </button>
        </div>
        {rating === 0 && <p className="mt-2 text-xs text-gray-400">Tap a star to rate it</p>}
      </div>
    </div>
  )
}

export default BookReviewCard
