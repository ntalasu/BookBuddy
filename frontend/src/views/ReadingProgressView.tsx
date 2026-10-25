import { useState } from "react"
import { useLoggedInStudent } from "../context/StudentContext"
import { useReadingProgress } from "../hooks/useReadingProgress"
import ReadingTimer from "./ReadingTimer"
import type { BadgeKind } from "../types"

// how the badges are grouped on the page
const badgeGroups: { title: string; kinds: BadgeKind[] }[] = [
  { title: "Reading Time", kinds: ["minutes", "longSession"] },
  { title: "Streaks & Habits", kinds: ["streak", "daysRead"] },
  { title: "Special", kinds: ["bedtime", "earlyBird", "weekend"] },
]

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

  const { totalMinutes, currentStreak, readToday, badges, earnedBadgeIds } = progress
  const nextBadge = badges.find((badge) => badge.kind === "minutes" && !earnedBadgeIds.includes(badge.id))
  const nextStreakBadge = badges.find((badge) => badge.kind === "streak" && badge.goal > currentStreak)

  let streakMessage = "Read today to start a streak!"
  if (currentStreak > 0 && !readToday) streakMessage = "Read today to keep your streak going!"
  else if (nextStreakBadge && currentStreak > 0) {
    const daysLeft = nextStreakBadge.goal - currentStreak
    streakMessage = `${daysLeft} more ${daysLeft === 1 ? "day" : "days"} until ${nextStreakBadge.emoji} ${nextStreakBadge.name}`
  } else if (currentStreak > 0) streakMessage = "Amazing! Keep it up!"

  return (
    <section className="p-6">
      <h2 className="mb-4 text-2xl font-bold">My Reading</h2>

      <div className={`mb-4 flex max-w-xl items-center gap-4 rounded-xl p-4 shadow ${currentStreak > 0 ? "bg-orange-100" : "bg-gray-100"}`}>
        <div className={`text-5xl ${currentStreak > 0 && readToday ? "" : "opacity-40 grayscale"}`}>🔥</div>
        <div>
          <p className="text-xl font-bold">
            {currentStreak} {currentStreak === 1 ? "day" : "days"} in a row
          </p>
          <p className="text-sm text-gray-600">{streakMessage}</p>
        </div>
      </div>

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
              {nextBadge.goal - totalMinutes} more minutes until {nextBadge.emoji} {nextBadge.name}
            </p>
            <div className="mt-1 h-3 rounded-full bg-gray-200">
              <div
                className="h-3 rounded-full bg-orange-500 transition-all"
                style={{ width: `${(totalMinutes / nextBadge.goal) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <h3 className="mt-8 text-xl font-bold">My Badges</h3>
      <p className="mb-3 text-sm text-gray-600">
        You've earned {earnedBadgeIds.length} of {badges.length} badges!
      </p>
      {badgeGroups.map((group) => (
        <div key={group.title} className="mb-6">
          <h4 className="mb-2 font-semibold text-gray-700">{group.title}</h4>
          <div className="flex flex-wrap gap-4">
            {badges
              .filter((badge) => group.kinds.includes(badge.kind))
              .map((badge) => {
                const earned = earnedBadgeIds.includes(badge.id)
                return (
                  <div
                    key={badge.id}
                    title={badge.criteria}
                    className={`w-28 rounded-xl p-4 text-center shadow ${earned ? "bg-yellow-100" : "bg-gray-100"}`}
                  >
                    <div className={`text-4xl ${earned ? "" : "opacity-40 grayscale"}`}>{badge.emoji}</div>
                    <div className="mt-1 text-sm font-semibold">{badge.name}</div>
                    <div className="mt-1 text-xs text-gray-500">{badge.criteria}</div>
                  </div>
                )
              })}
          </div>
        </div>
      ))}
    </section>
  )
}

export default ReadingProgressView
