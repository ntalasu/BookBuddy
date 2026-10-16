import { createContext, useContext } from "react"

export type Student = {
  id: string
  name: string
  age: number
  readingLevel: string
  readingMinutes: number
  interests: string[]
  characterId: string
  characterColor: string
}

type StudentContextValue = {
  student: Student | null
  signIn: (name: string) => void
  setStudent: (student: Student) => void
  updateStudent: (changes: Partial<Student>) => void
  addReadingMinutes: (minutes: number) => void
  clearStudent: () => void
}

export const StudentContext = createContext<StudentContextValue | null>(null)

// Use anywhere in the app to get the current student (may be null if nobody is signed in)
export function useStudent() {
  const value = useContext(StudentContext)
  if (!value) throw new Error("useStudent must be used inside <StudentProvider>")
  return value
}

// Use on pages that are only shown to a signed-in student
export function useLoggedInStudent() {
  const { student, ...actions } = useStudent()
  if (!student) throw new Error("No student is signed in")
  return { student, ...actions }
}
