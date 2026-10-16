import type { Student } from "../context/StudentContext"
import { ApiClient, fakeDelay, USE_MOCK } from "./ApiClient"

export type ProfileUpdate = Pick<Student, "name" | "age" | "readingLevel" | "interests">

export const ProfileApiService = {
  async getProfile(studentId: string): Promise<Student> {
    if (USE_MOCK) {
      throw new Error("getProfile has no fake version yet. The signed-in student comes from StudentContext.")
    }
    return ApiClient.get(`/students/${studentId}`)
  },

  async updateProfile(studentId: string, profile: ProfileUpdate): Promise<ProfileUpdate> {
    if (USE_MOCK) {
      await fakeDelay(300)
      return profile // pretend the server saved it
    }
    return ApiClient.post(`/students/${studentId}`, profile)
  },
}
