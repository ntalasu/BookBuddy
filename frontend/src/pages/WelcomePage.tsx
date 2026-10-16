import { useState } from "react"
import { Navigate } from "react-router"
import { useStudent } from "../context/StudentContext"

function WelcomePage() {
  const { student, signIn } = useStudent()
  const [name, setName] = useState("")

  // already signed in? go straight to the bookshelf
  if (student) return <Navigate to="/discover" replace />

  function start() {
    const trimmed = name.trim()
    if (trimmed === "") return
    // fake sign-in until the backend handles real accounts
    signIn(trimmed)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-amber-50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="text-6xl">📚</div>
        <h1 className="mt-2 text-4xl font-extrabold text-orange-600">BookBuddy</h1>
        <p className="mt-2 text-gray-600">Who's reading today?</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") start()
          }}
          placeholder="Type your name"
          className="mt-6 w-full rounded-lg border border-gray-300 px-3 py-2 text-center"
        />
        <button
          onClick={start}
          className="mt-4 w-full rounded-lg bg-orange-500 py-2 font-semibold text-white hover:bg-orange-600"
        >
          Let's read!
        </button>
      </div>
    </div>
  )
}

export default WelcomePage
