import { useEffect, useState, type ReactNode } from "react"
import { ProfileApiService } from "../api/ProfileApiService"
import { StudentContext, type Student } from "./StudentContext"

function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Load the student belonging to the authenticated WorkOS account
  useEffect(() => {
    let ignore = false

    async function loadStudent() {
      try {
        const response = await fetch(
          "http://localhost:8000/auth/student",
          {
            credentials: "include",
          }
        )

        if (response.status === 401) {
          if (!ignore) setStudent(null)
          return
        }

        if (!response.ok) {
          throw new Error("Failed to check authentication")
        }

        const data: { student: Student | null } =
          await response.json()

        let currentStudent = data.student

        // Create a profile for a new WorkOS account
        if (!currentStudent) {
          currentStudent = await ProfileApiService.signIn("Reader")
        }

        if (!ignore) {
          setStudent(currentStudent)
        }
      } catch (error) {
        console.error("Failed to load student:", error)

        if (!ignore) {
          setStudent(null)
        }
      } finally {
        if (!ignore) {
          setCheckingAuth(false)
        }
      }
    }

    loadStudent()

    return () => {
      ignore = true
    }
  }, [])

  // Only allow profile creation for authenticated users
  async function signIn(name: string) {
    const response = await fetch(
      "http://localhost:8000/auth/me",
      {
        credentials: "include",
      }
    )

    if (!response.ok) {
      throw new Error("Please sign in with WorkOS first.")
    }

    const currentStudent = await ProfileApiService.signIn(name)

    setStudent(currentStudent)
  }

  function updateStudent(changes: Partial<Student>) {
    setStudent((current) =>
      current ? { ...current, ...changes } : current
    )
  }

  function clearStudent() {
    setStudent(null)
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <p className="text-lg font-semibold text-orange-600">
          Loading BookBuddy...
        </p>
      </div>
    )
  }

  return (
    <StudentContext.Provider
      value={{
        student,
        signIn,
        setStudent,
        updateStudent,
        clearStudent,
      }}
    >
      {children}
    </StudentContext.Provider>
  )
}

export default StudentProvider