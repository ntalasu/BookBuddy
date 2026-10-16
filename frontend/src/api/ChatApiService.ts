import type { ChatMessage, ChatResponse, DefinitionResponse } from "../types"
import { ApiClient, fakeDelay, USE_MOCK } from "./ApiClient"

const fakeReplies = [
  "Ooh, great question! A good adventure story always has a brave character who faces a challenge.",
  "I think you'd enjoy a mysterious book. Want me to suggest one?",
  "That's so interesting! Being curious is what makes a great reader.",
  "Books are amazing because they let your imagination go anywhere!",
]

const fakeDefinitions: Record<string, string> = {
  adventure: "An exciting trip or experience, often with some danger.",
  character: "A person or animal in a story.",
  challenge: "Something hard that takes effort to do.",
  mysterious: "Strange and hard to explain or understand.",
  curious: "Wanting to learn or know more about something.",
  imagination: "The part of your mind that makes up pictures and ideas.",
}

function cleanWord(word: string) {
  return word.toLowerCase().replace(/[^a-z]/g, "")
}

export const ChatApiService = {
  async sendMessage(studentId: string, message: string, bookId?: string): Promise<ChatResponse> {
    if (USE_MOCK) {
      await fakeDelay(1000)
      const reply = fakeReplies[Math.floor(Math.random() * fakeReplies.length)]
      const vocabularyWords = reply.split(" ").map(cleanWord).filter((w) => w in fakeDefinitions)
      return { reply, vocabularyWords }
    }
    return ApiClient.post("/chat", { studentId, message, bookId })
  },

  async getConversation(studentId: string): Promise<ChatMessage[]> {
    if (USE_MOCK) {
      return []
    }
    return ApiClient.get(`/students/${studentId}/conversation`)
  },

  async defineWord(studentId: string, word: string, context: string): Promise<DefinitionResponse> {
    if (USE_MOCK) {
      await fakeDelay(300)
      return { word, definition: fakeDefinitions[word] ?? "I don't know that word yet!" }
    }
    return ApiClient.post("/vocabulary/define", { studentId, word, context })
  },
}
