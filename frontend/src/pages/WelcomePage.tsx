import { useState } from "react"
import { Navigate } from "react-router"
import { useStudent } from "../context/StudentContext"

function WelcomePage() {
  const { student, signIn } = useStudent()
  const [name, setName] = useState("")
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Already signed in? Go straight to Discover
  if (student) return <Navigate to="/discover" replace />

  async function start() {
    const trimmed = name.trim()
    if (trimmed === "" || signingIn) return

    setSigningIn(true)
    setError(null)

    try {
      await signIn(trimmed)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      )
    } finally {
      setSigningIn(false)
    }
  }

  function loginWithWorkOS() {
    window.location.href = "http://localhost:8000/auth/login"
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-amber-50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="text-6xl">📚</div>

        <h1 className="mt-2 text-4xl font-extrabold text-orange-600">
          BookBuddy
        </h1>

        <p className="mt-2 text-gray-600">Who's reading today?</p>

        <button
          onClick={loginWithWorkOS}
          className="mt-6 w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Sign in / Sign up
        </button>

        <p className="mt-4 text-sm text-gray-500">
          Already signed in? Enter your name below.
        </p>

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
          disabled={signingIn}
          className="mt-4 w-full rounded-lg bg-orange-500 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {signingIn ? "Signing in…" : "Let's read!"}
        </button>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  )
}

export default WelcomePage