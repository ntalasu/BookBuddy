import type { Student } from "../context/StudentContext"
import { ApiClient } from "./ApiClient"

// Anything about a student except their id can be changed
export type ProfileUpdate = Partial<Omit<Student, "id">>

// Profiles are saved by the real backend (no fake version), so the backend must be running.
export const ProfileApiService = {
  signIn(name: string): Promise<Student> {
    return ApiClient.post("/students/sign-in", { name })
  },

  getProfile(studentId: string): Promise<Student> {
    return ApiClient.get(`/students/${studentId}`)
  },

  updateProfile(studentId: string, changes: ProfileUpdate): Promise<Student> {
    return ApiClient.post(`/students/${studentId}`, changes)
  },
}
