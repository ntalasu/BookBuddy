import { useState } from "react"
import { useLoggedInStudent } from "../context/StudentContext"
import ChatInput from "./ChatInput"
import VocabularyCard from "./VocabularyCard"

type ChatMessage = {
  from: "student" | "buddy"
  text: string
}

// Fake data until the backend's ChatService and VocabularyService are ready
const fakeReplies = [
  "Ooh, great question! A good adventure story always has a brave character who faces a challenge.",
  "I think you'd enjoy a mysterious book. Want me to suggest one?",
  "That's so interesting! Being curious is what makes a great reader.",
  "Books are amazing because they let your imagination go anywhere!",
]

const definitions: Record<string, string> = {
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

function ChatView() {
  const { student } = useLoggedInStudent()
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "buddy", text: `Hi ${student.name}! I'm BookBuddy. Ask me about any book, or tap an underlined word to learn what it means!` },
  ])
  const [typing, setTyping] = useState(false)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)

  function submitMessage(message: string) {
    setMessages((m) => [...m, { from: "student", text: message }])
    setTyping(true)

    // pretend to wait for the backend
    setTimeout(() => {
      const reply = fakeReplies[Math.floor(Math.random() * fakeReplies.length)]
      displayResponse(reply)
    }, 1000)
  }

  function displayResponse(reply: string) {
    setTyping(false)
    setMessages((m) => [...m, { from: "buddy", text: reply }])
  }

  return (
    <section className="p-6">
      <h2 className="mb-4 text-2xl font-bold">Chat with BookBuddy</h2>

      <div className="flex h-[32rem] max-w-2xl flex-col rounded-xl bg-white shadow-lg">
        {/* messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.from === "student" ? "ml-auto bg-orange-500 text-white" : "bg-amber-100"
              }`}
            >
              {message.from === "buddy"
                ? message.text.split(" ").map((word, i) =>
                    definitions[cleanWord(word)] ? (
                      <button
                        key={i}
                        onClick={() => setSelectedWord(cleanWord(word))}
                        className="cursor-pointer font-semibold text-sky-700 underline decoration-dotted"
                      >
                        {word}{" "}
                      </button>
                    ) : (
                      <span key={i}>{word} </span>
                    ),
                  )
                : message.text}
            </div>
          ))}
          {typing && <p className="text-sm text-gray-400">BookBuddy is typing…</p>}
        </div>

        {selectedWord && (
          <VocabularyCard
            word={selectedWord}
            definition={definitions[selectedWord]}
            onClose={() => setSelectedWord(null)}
          />
        )}

        <ChatInput onSend={submitMessage} disabled={typing} />
      </div>
    </section>
  )
}

export default ChatView
