import { useCallback, useEffect, useState } from "react" 
import { ChatApiService } from "../api/ChatApiService"
import type { Student } from "../context/StudentContext"
import type { ChatMessage } from "../types"

// useAI is false when Buddy's AI can't run (yet): the simple chat answers instead.
// onAIFailed is called if the AI breaks in the middle of the chat, to switch to the simple chat for good.
export function useChat(student: Student, greeting: string, useAI: boolean, onAIFailed: (() => void) | undefined, conversationId: string | null, onConversationCreated?: (conversationId: string) => void) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ from: "buddy", text: greeting }])
  const [typing, setTyping] = useState(false) // true from sending until Buddy's reply is finished
  const [error, setError] = useState<string | null>(null)
  

  const sendMessage = useCallback(async (message: string) => {
    let currentConversationId = conversationId 
    let createdNewConversation = false 

  const history: ChatMessage[] = [
    ...messages,
    { from: "student", text: message },
  ]

  setMessages(history)
  setTyping(true)
  setError(null)

  try {
    // Create a conversation only when the first message is sent
    if (!currentConversationId) {
      const newConversation =
        await ChatApiService.createConversation(student.id)

      currentConversationId = newConversation.id
      createdNewConversation = true
    }

    const response = await ChatApiService.sendMessage(
      student,
      history,
      (textSoFar) => {
        if (textSoFar.trim()) {
          setMessages([
            ...history,
            { from: "buddy", text: textSoFar },
          ])
        }
      },
      useAI
    )

    if (response.aiFailed) {
      onAIFailed?.()
    }

    const finalMessages: ChatMessage[] = [
      ...history,
      {
        from: "buddy",
        text: response.reply,
        vocabularyWords: response.vocabularyWords,
        recommendedBooks: response.recommendedBooks,
      },
    ]

    setMessages(finalMessages)

    await ChatApiService.saveConversation(
      student.id,
      currentConversationId!,
      finalMessages
    )
    if (createdNewConversation) {
        onConversationCreated?.(currentConversationId)
    }
  } catch (e) {
    setMessages(history)
    setError((e as Error).message)
  } finally {
    setTyping(false)
  }
}, [conversationId, messages, onAIFailed, onConversationCreated, student, useAI,]) 

  async function defineWord(word: string, context: string) {
    const response = await ChatApiService.defineWord(student, word, context, useAI)
    return response.definition
  }

  // load any earlier messages once when the screen first shows up
  useEffect(() => {
  let ignore = false

  if (!conversationId) {
    setMessages([{ from: "buddy", text: greeting }])
    return
  }

  ChatApiService.getConversation(student.id, conversationId)
    .then((earlier) => {
      if (!ignore) {
        setMessages(
          earlier.length > 0
            ? earlier
            : [{ from: "buddy", text: greeting }]
        )
      }
    })
    .catch((e: Error) => {
      if (!ignore) {
        setError(e.message)
      }
    })

  return () => {
    ignore = true
  }
}, [student.id, conversationId, greeting])

  return { messages, typing, error, sendMessage, defineWord,}
}
