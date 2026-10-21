import { Navigate } from "react-router"
import { useStudent } from "../context/StudentContext"

function WelcomePage() {
  const { student } = useStudent()

  // Already signed in? Go straight to Discover
  if (student) {
    return <Navigate to="/discover" replace />
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

        <p className="mt-3 text-gray-600">
          Your reading adventure starts here!
        </p>

        <button
          onClick={loginWithWorkOS}
          className="mt-8 w-full rounded-lg bg-orange-500 py-3 font-semibold text-white hover:bg-orange-600"
        >
          Sign In / Create Account
        </button>

        <p className="mt-4 text-sm text-gray-500">
          New to BookBuddy? Create your account to get started.
        </p>

      </div>
    </div>
  )
}

export default WelcomePage