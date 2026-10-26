// The shapes of data the frontend and backend send to each other.
// These must match the backend's Pydantic schemas.

export type Book = {
  id: string
  title: string
  author: string
  readingLevel: string
  genres: string[]
  coverUrl: string
}

export type Recommendation = {
  rank: number
  reason: string
  book: Book
}

// what a badge counts
export type BadgeKind =
  | "minutes" // total minutes read
  | "streak" // longest number of days read in a row
  | "longSession" // most minutes read in one session
  | "bedtime" // sessions logged after 7pm
  | "earlyBird" // sessions logged before 9am
  | "weekend" // Saturdays and Sundays read on
  | "daysRead" // different days read on

export type Badge = {
  id: string
  name: string
  criteria: string
  kind: BadgeKind
  goal: number // how much of that kind is needed, e.g. 60 minutes or 7 days
  emoji: string
}

export type ReadingLog = {
  id: string
  studentId: string
  minutesRead: number
  loggedAt: string
  utcOffsetMinutes: number
}

export type ProgressResponse = {
  totalMinutes: number
  currentStreak: number // days in a row, counting today or yesterday
  longestStreak: number
  readToday: boolean
  badges: Badge[] // every badge, so locked ones can be shown too
  earnedBadgeIds: string[]
}

export type ChatMessage = {
  from: "student" | "buddy"
  text: string
  vocabularyWords?: string[] // words in a buddy message the student can tap for a definition
}

export type ChatResponse = {
  reply: string
  vocabularyWords: string[]
}

export type DefinitionResponse = {
  word: string
  definition: string
}
