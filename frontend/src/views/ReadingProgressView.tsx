import { useState } from "react"
import { useLoggedInStudent } from "../context/StudentContext"
import { useReadingProgress } from "../hooks/useReadingProgress"
import ReadingTimer from "./ReadingTimer"

function ReadingProgressView() {
  const [minutesInput, setMinutesInput] = useState("")
  const { student } = useLoggedInStudent()
  const { progress, error, logReading } = useReadingProgress(student.id)

  function logMinutes() {
    const minutes = Number(minutesInput)
    if (minutes <= 0) return
    logReading(minutes)
    setMinutesInput("")
  }

  if (error) return <p className="p-6 text-red-600">Couldn't load your progress: {error}</p>
  if (!progress) return <p className="p-6 text-gray-500">Loading your progress…</p>

  const { totalMinutes, badges, earnedBadgeIds } = progress
  const nextBadge = badges.find((badge) => !earnedBadgeIds.includes(badge.id))

  return (
    <section className="p-6">
      <h2 className="mb-4 text-2xl font-bold">My Reading</h2>

      <div className="max-w-xl rounded-xl bg-white p-6 shadow-lg">
        <ReadingTimer onFinish={logReading} />

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
        {badges.map((badge) => {
          const earned = earnedBadgeIds.includes(badge.id)
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
