import { useEffect, useState, type ReactNode } from "react"
import { StudentContext, type Student } from "./StudentContext"

// Fake "database" in the browser until the backend stores real accounts
const CURRENT_KEY = "bookbuddy-student" // who is signed in right now
const ALL_KEY = "bookbuddy-all-students" // every student who has ever signed in, by id

function loadStudent(): Student | null {
  const saved = localStorage.getItem(CURRENT_KEY)
  return saved ? JSON.parse(saved) : null
}

function loadAllStudents(): Record<string, Student> {
  const saved = localStorage.getItem(ALL_KEY)
  return saved ? JSON.parse(saved) : {}
}

function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(loadStudent)

  // save to the browser so the student stays signed in after a refresh,
  // and so their progress is still there if they sign out and back in
  useEffect(() => {
    if (student) {
      localStorage.setItem(CURRENT_KEY, JSON.stringify(student))
      const all = loadAllStudents()
      all[student.id] = student
      localStorage.setItem(ALL_KEY, JSON.stringify(all))
    } else {
      localStorage.removeItem(CURRENT_KEY)
    }
  }, [student])

  function signIn(name: string) {
    const returning = Object.values(loadAllStudents()).find(
      (s) => s.name.toLowerCase() === name.toLowerCase(),
    )
    setStudent(
      returning ?? {
        id: crypto.randomUUID(),
        name,
        age: 8,
        readingLevel: "Grade 3",
        readingMinutes: 0,
        interests: [],
        characterId: "fox",
        characterColor: "bg-orange-200",
      },
    )
  }

  function updateStudent(changes: Partial<Student>) {
    setStudent((s) => (s ? { ...s, ...changes } : s))
  }

  function addReadingMinutes(minutes: number) {
    setStudent((s) => (s ? { ...s, readingMinutes: s.readingMinutes + minutes } : s))
  }

  function clearStudent() {
    setStudent(null)
  }

  return (
    <StudentContext.Provider value={{ student, signIn, setStudent, updateStudent, addReadingMinutes, clearStudent }}>
      {children}
    </StudentContext.Provider>
  )
}

export default StudentProvider
