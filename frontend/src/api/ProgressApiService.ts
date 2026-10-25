import type { ProgressResponse, ReadingLog } from "../types"
import { ApiClient } from "./ApiClient"

// Reading logs, streaks, and badges are saved by the real backend (no fake version), so the backend must be running.
// The time zone offset lets the backend use the student's own clock for streaks and bedtime/early bird badges.
export const ProgressApiService = {
  createReadingLog(studentId: string, minutes: number): Promise<ReadingLog> {
    return ApiClient.post("/reading-logs", {
      studentId,
      minutes,
      utcOffsetMinutes: new Date().getTimezoneOffset(),
    })
  },

  getProgress(studentId: string): Promise<ProgressResponse> {
    return ApiClient.get(`/students/${studentId}/progress?utcOffsetMinutes=${new Date().getTimezoneOffset()}`)
  },
}
