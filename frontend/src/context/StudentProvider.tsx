import { useEffect, useState, type ReactNode } from "react"
import { ApiError } from "../api/ApiClient"
import { ProfileApiService } from "../api/ProfileApiService"
import { StudentContext, type Student } from "./StudentContext"

const CURRENT_KEY = "bookbuddy-student"

function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const studentId = student?.id

  // Check WorkOS authentication when BookBuddy opens
  useEffect(() => {
    let ignore = false

    async function checkAuth() {
      try {
        const response = await fetch("http://localhost:8000/auth/me", {
          credentials: "include",
        })

        if (!response.ok) {
          if (!ignore) {
            setStudent(null)
            localStorage.removeItem(CURRENT_KEY)
          }
          return
        }

        // WorkOS session is valid; load the profile linked to this account
        const profileResponse = await fetch("http://localhost:8000/auth/student", {
          credentials: "include",
        })

        if (!profileResponse.ok) {
          throw new Error("Failed to load student profile")
        }

        const data: { student: Student | null } = await profileResponse.json()

        if (!ignore) {
          setStudent(data.student)
        }
      } catch (error) {
        console.error("Authentication check failed:", error)
        if (!ignore) setStudent(null)
      } finally {
        if (!ignore) setCheckingAuth(false)
      }
    }

    checkAuth()

    return () => {
      ignore = true
    }
  }, [])

  // Save student information in this browser
  useEffect(() => {
    if (checkingAuth) return

    if (student) {
      localStorage.setItem(CURRENT_KEY, JSON.stringify(student))
    } else {
      localStorage.removeItem(CURRENT_KEY)
    }
  }, [student, checkingAuth])

  // Get the latest student profile from the backend
  useEffect(() => {
    if (checkingAuth || !studentId) return

    let ignore = false

    ProfileApiService.getProfile(studentId)
      .then((latest) => {
        if (!ignore) setStudent(latest)
      })
      .catch((e) => {
        if (!ignore && e instanceof ApiError && e.status === 404) {
          setStudent(null)
        }
      })

    return () => {
      ignore = true
    }
  }, [studentId, checkingAuth])

  async function signIn(name: string) {
    const response = await fetch("http://localhost:8000/auth/me", {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Please sign in with WorkOS first.")
    }

    setStudent(await ProfileApiService.signIn(name))
  }

  function updateStudent(changes: Partial<Student>) {
    setStudent((s) => (s ? { ...s, ...changes } : s))
  }

  function clearStudent() {
    setStudent(null)
  }

  // Don't show protected pages before authentication is checked
  if (checkingAuth) {
    return <div>Checking authentication...</div>
  }

  return (
    <StudentContext.Provider
      value={{ student, signIn, setStudent, updateStudent, clearStudent }}
    >
      {children}
    </StudentContext.Provider>
  )
}

export default StudentProvider