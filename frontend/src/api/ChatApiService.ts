import { findBooksAbout, findMentionedBook, pickTopic } from "../ai/bookFinder"
import { favoriteTitlesForAge } from "../ai/bookList"
import { askBuddy, defineWithBuddy, pickVocabularyWords } from "../ai/buddyEngine"
import type { Student } from "../context/StudentContext"
import { getSavedBooks } from "../services/api"
import type { ChatMessage, ChatResponse, DefinitionResponse } from "../types"

// Buddy's chat runs on the AI in the browser (see src/ai), not the backend,
// so it's free, has no message limit, and messages never leave the kid's device.
export const ChatApiService = {
  // history = the whole chat so far, ending with the kid's new message.
  // onText is called with Buddy's reply so far, so it can appear word by word.
  async sendMessage(student: Student, history: ChatMessage[], onText: (textSoFar: string) => void): Promise<ChatResponse> {
    // Buddy gets the kid's bookshelf, Google Books results for the topic they're talking about,
    // and a lookup of any book they name. Only a topic word or a short book title is ever
    // searched (never numbers or emails); the kid's messages themselves stay on the device.
    const kidMessages = history.filter((message) => message.from === "student").map((message) => message.text)
    const topic = pickTopic(kidMessages, student.interests)
    const [shelf, foundBooks] = await Promise.all([
      getSavedBooks().catch(() => []),
      topic ? findBooksAbout(topic).catch(() => []) : [],
    ])
    const mentioned = await findMentionedBook(
      kidMessages,
      [...shelf, ...foundBooks],
      favoriteTitlesForAge(student.age),
    ).catch(() => null)
    const reply = await askBuddy(student, { shelf, topic, foundBooks, mentioned }, history, onText)
    return { reply, vocabularyWords: pickVocabularyWords(reply) }
  },

  // Chats aren't saved anywhere yet, so every visit starts fresh
  async getConversation(): Promise<ChatMessage[]> {
    return []
  },

  async defineWord(student: Student, word: string, context: string): Promise<DefinitionResponse> {
    return { word, definition: await defineWithBuddy(student, word, context) }
  },
}
