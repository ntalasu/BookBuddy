import { useCallback, useEffect, useState } from "react"
import { ChatApiService } from "../api/ChatApiService"
import type { ChatMessage } from "../types"

export function useChat(studentId: string, greeting: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ from: "buddy", text: greeting }])
  const [typing, setTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadConversation = useCallback(async () => {
    try {
      const earlier = await ChatApiService.getConversation(studentId)
      if (earlier.length > 0) setMessages(earlier)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [studentId])

  async function sendMessage(message: string) {
    setMessages((m) => [...m, { from: "student", text: message }])
    setTyping(true)
    setError(null)
    try {
      const response = await ChatApiService.sendMessage(studentId, message)
      setMessages((m) => [...m, { from: "buddy", text: response.reply, vocabularyWords: response.vocabularyWords }])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setTyping(false)
    }
  }

  async function defineWord(word: string, context: string) {
    const response = await ChatApiService.defineWord(studentId, word, context)
    return response.definition
  }

  // load any earlier messages once when the screen first shows up
  useEffect(() => {
    let ignore = false // if the screen closes before the data arrives, don't use it
    ChatApiService.getConversation(studentId)
      .then((earlier) => {
        if (!ignore && earlier.length > 0) setMessages(earlier)
      })
      .catch((e: Error) => {
        if (!ignore) setError(e.message)
      })
    return () => {
      ignore = true
    }
  }, [studentId])

  return { messages, typing, error, sendMessage, defineWord, loadConversation }
}
