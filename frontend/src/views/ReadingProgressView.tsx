import { useState } from "react"
import { useLoggedInStudent } from "../context/StudentContext"
import ReadingTimer from "./ReadingTimer"

type Badge = {
  id: string
  name: string
  criteria: string
  minutesNeeded: number
  emoji: string
}

const allBadges: Badge[] = [
  { id: "1", name: "First Page", criteria: "Read for 10 minutes", minutesNeeded: 10, emoji: "📖" },
  { id: "2", name: "Bookworm", criteria: "Read for 60 minutes", minutesNeeded: 60, emoji: "🐛" },
  { id: "3", name: "Reading Star", criteria: "Read for 180 minutes", minutesNeeded: 180, emoji: "⭐" },
  { id: "4", name: "Book Champion", criteria: "Read for 300 minutes", minutesNeeded: 300, emoji: "🏆" },
]

function ReadingProgressView() {
  const [minutesInput, setMinutesInput] = useState("")
  const { student, addReadingMinutes } = useLoggedInStudent()
  const totalMinutes = student.readingMinutes

  function addMinutes(minutes: number) {
    addReadingMinutes(minutes)
  }

  function logMinutes() {
    const minutes = Number(minutesInput)
    if (minutes <= 0) return
    addMinutes(minutes)
    setMinutesInput("")
  }


  const earnedBadges = allBadges.filter((badge) => totalMinutes >= badge.minutesNeeded)
  const nextBadge = allBadges.find((badge) => totalMinutes < badge.minutesNeeded)

  return (
    <section className="p-6">
      <h2 className="mb-4 text-2xl font-bold">My Reading</h2>

      <div className="max-w-xl rounded-xl bg-white p-6 shadow-lg">
        <ReadingTimer onFinish={addMinutes} />

        <p className="mt-6 mb-2 text-sm text-gray-500">Read without the timer? Type your minutes:</p>

        <div className="flex gap-2">
          <input
            type="number"
            value={minutesInput}
            onChange={(e) => setMinutesInput(e.target.value)}
            placeholder="e.g. 20"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
          />
          <button onClick={logMinutes} className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600">
            Log it!
          </button>
        </div>

        <p className="mt-6 text-lg">
          You've read <span className="font-bold text-orange-600">{totalMinutes}</span> minutes total
        </p>

        {nextBadge && (
          <div className="mt-3">
            <p className="text-sm text-gray-600">
              {nextBadge.minutesNeeded - totalMinutes} more minutes until {nextBadge.emoji} {nextBadge.name}
            </p>
            <div className="mt-1 h-3 rounded-full bg-gray-200">
              <div
                className="h-3 rounded-full bg-orange-500 transition-all"
                style={{ width: `${(totalMinutes / nextBadge.minutesNeeded) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <h3 className="mt-8 mb-3 text-xl font-bold">My Badges</h3>
      <div className="flex flex-wrap gap-4">
        {allBadges.map((badge) => {
          const earned = earnedBadges.includes(badge)
          return (
            <div
              key={badge.id}
              title={badge.criteria}
              className={`w-28 rounded-xl p-4 text-center shadow ${earned ? "bg-yellow-100" : "bg-gray-100 opacity-40 grayscale"}`}
            >
              <div className="text-4xl">{badge.emoji}</div>
              <div className="mt-1 text-sm font-semibold">{badge.name}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default ReadingProgressView
