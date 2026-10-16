import type { Badge, ProgressResponse, ReadingLog } from "../types"
import { ApiClient, fakeDelay, USE_MOCK } from "./ApiClient"

const fakeBadges: Badge[] = [
  { id: "1", name: "First Page", criteria: "Read for 10 minutes", minutesNeeded: 10, emoji: "📖" },
  { id: "2", name: "Bookworm", criteria: "Read for 60 minutes", minutesNeeded: 60, emoji: "🐛" },
  { id: "3", name: "Reading Star", criteria: "Read for 180 minutes", minutesNeeded: 180, emoji: "⭐" },
  { id: "4", name: "Book Champion", criteria: "Read for 300 minutes", minutesNeeded: 300, emoji: "🏆" },
]

// Fake "database" of reading logs kept in the browser
const LOGS_KEY = "bookbuddy-mock-reading-logs"

function loadLogs(): Record<string, ReadingLog[]> {
  const saved = localStorage.getItem(LOGS_KEY)
  return saved ? JSON.parse(saved) : {}
}

export const ProgressApiService = {
  async createReadingLog(studentId: string, minutes: number): Promise<ReadingLog> {
    if (USE_MOCK) {
      await fakeDelay(200)
      const log: ReadingLog = {
        id: crypto.randomUUID(),
        studentId,
        minutesRead: minutes,
        loggedAt: new Date().toISOString(),
      }
      const logs = loadLogs()
      logs[studentId] = [...(logs[studentId] ?? []), log]
      localStorage.setItem(LOGS_KEY, JSON.stringify(logs))
      return log
    }
    return ApiClient.post("/reading-logs", { studentId, minutes })
  },

  async getProgress(studentId: string): Promise<ProgressResponse> {
    if (USE_MOCK) {
      await fakeDelay(200)
      const totalMinutes = (loadLogs()[studentId] ?? []).reduce((sum, log) => sum + log.minutesRead, 0)
      return {
        totalMinutes,
        badges: fakeBadges,
        earnedBadgeIds: fakeBadges.filter((b) => totalMinutes >= b.minutesNeeded).map((b) => b.id),
      }
    }
    return ApiClient.get(`/students/${studentId}/progress`)
  },
}
