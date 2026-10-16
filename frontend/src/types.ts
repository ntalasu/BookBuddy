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

export type Badge = {
  id: string
  name: string
  criteria: string
  minutesNeeded: number
  emoji: string
}

export type ReadingLog = {
  id: string
  studentId: string
  minutesRead: number
  loggedAt: string
}

export type ProgressResponse = {
  totalMinutes: number
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
