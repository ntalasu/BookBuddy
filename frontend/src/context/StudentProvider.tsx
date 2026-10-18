import { useEffect, useState, type ReactNode } from "react"
import { ApiError } from "../api/ApiClient"
import { ProfileApiService } from "../api/ProfileApiService"
import { StudentContext, type Student } from "./StudentContext"

// Remembers who is signed in on this browser, so a refresh doesn't sign them out.
// The student's actual profile is saved by the backend.
const CURRENT_KEY = "bookbuddy-student"

function loadStudent(): Student | null {
  const saved = localStorage.getItem(CURRENT_KEY)
  return saved ? JSON.parse(saved) : null
}

function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(loadStudent)
  const studentId = student?.id

  // keep the browser's copy up to date
  useEffect(() => {
    if (student) localStorage.setItem(CURRENT_KEY, JSON.stringify(student))
    else localStorage.removeItem(CURRENT_KEY)
  }, [student])

  // when the app opens, get the latest profile from the backend
  useEffect(() => {
    if (!studentId) return
    let ignore = false
    ProfileApiService.getProfile(studentId)
      .then((latest) => {
        if (!ignore) setStudent(latest)
      })
      .catch((e) => {
        // the backend doesn't know this student (e.g. signed in before profiles were saved
        // there): sign them out so they can sign in again. If the backend is just down, keep
        // using the saved copy.
        if (!ignore && e instanceof ApiError && e.status === 404) setStudent(null)
      })
    return () => {
      ignore = true
    }
  }, [studentId])

  async function signIn(name: string) {
    setStudent(await ProfileApiService.signIn(name))
  }

  function updateStudent(changes: Partial<Student>) {
    setStudent((s) => (s ? { ...s, ...changes } : s))
  }

  function clearStudent() {
    setStudent(null)
  }

  return (
    <StudentContext.Provider value={{ student, signIn, setStudent, updateStudent, clearStudent }}>
      {children}
    </StudentContext.Provider>
  )
}

export default StudentProvider
