import { useCallback, useEffect, useState } from "react"
import { ChatApiService } from "../api/ChatApiService"
import type { Student } from "../context/StudentContext"
import type { ChatMessage } from "../types"

export function useChat(student: Student, greeting: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ from: "buddy", text: greeting }])
  const [typing, setTyping] = useState(false) // true from sending until Buddy's reply is finished
  const [error, setError] = useState<string | null>(null)

  const loadConversation = useCallback(async () => {
    try {
      const earlier = await ChatApiService.getConversation()
      if (earlier.length > 0) setMessages(earlier)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  async function sendMessage(message: string) {
    const history: ChatMessage[] = [...messages, { from: "student", text: message }]
    setMessages(history)
    setTyping(true)
    setError(null)
    try {
      // show Buddy's reply word by word as it's written
      const response = await ChatApiService.sendMessage(student, history, (textSoFar) => {
        if (textSoFar.trim()) setMessages([...history, { from: "buddy", text: textSoFar }])
      })
      setMessages([...history, { from: "buddy", text: response.reply, vocabularyWords: response.vocabularyWords }])
    } catch (e) {
      setMessages(history)
      setError((e as Error).message)
    } finally {
      setTyping(false)
    }
  }

  async function defineWord(word: string, context: string) {
    const response = await ChatApiService.defineWord(student, word, context)
    return response.definition
  }

  // load any earlier messages once when the screen first shows up
  useEffect(() => {
    let ignore = false // if the screen closes before the data arrives, don't use it
    ChatApiService.getConversation()
      .then((earlier) => {
        if (!ignore && earlier.length > 0) setMessages(earlier)
      })
      .catch((e: Error) => {
        if (!ignore) setError(e.message)
      })
    return () => {
      ignore = true
    }
  }, [])

  return { messages, typing, error, sendMessage, defineWord, loadConversation }
}
