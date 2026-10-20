import { useState } from "react"
import { useLoggedInStudent } from "../context/StudentContext"
import { useChat } from "../hooks/useChat"
import BuddyAvatar from "./BuddyAvatar"
import ChatInput from "./ChatInput"
import VocabularyCard from "./VocabularyCard"

function cleanWord(word: string) {
  return word.toLowerCase().replace(/[^a-z]/g, "")
}

function ChatView() {
  const { student } = useLoggedInStudent()
  const { messages, typing, error, sendMessage, defineWord } = useChat(
    student.id,
    `Hi ${student.name}!${student.buddyName ? ` And hi to ${student.buddyName} too!` : ""} I'm BookBuddy. Ask me about any book, or tap an underlined word to learn what it means!`,
  )
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [definition, setDefinition] = useState<{ word: string; text: string } | null>(null)

  async function showDefinition(word: string, context: string) {
    setSelectedWord(word)
    try {
      setDefinition({ word, text: await defineWord(word, context) })
    } catch {
      setDefinition({ word, text: "Sorry, I couldn't look that word up." })
    }
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
              className={`flex items-end gap-2 ${message.from === "student" ? "flex-row-reverse" : ""}`}
            >
              {/* who's talking: the student's buddy, or BookBuddy */}
              {message.from === "student" ? (
                <BuddyAvatar
                  characterId={student.characterId}
                  color={student.characterColor}
                  hatId={student.hatId}
                  itemId={student.itemId}
                  size="sm"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 text-lg">📚</div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.from === "student" ? "bg-orange-500 text-white" : "bg-amber-100"
                }`}
              >
                {message.text.split(" ").map((word, i) =>
                  message.vocabularyWords?.includes(cleanWord(word)) ? (
                    <button
                      key={i}
                      onClick={() => showDefinition(cleanWord(word), message.text)}
                      className="cursor-pointer font-semibold text-sky-700 underline decoration-dotted"
                    >
                      {word}{" "}
                    </button>
                  ) : (
                    <span key={i}>{word} </span>
                  ),
                )}
              </div>
            </div>
          ))}
          {typing && <p className="text-sm text-gray-400">BookBuddy is typing…</p>}
          {error && <p className="text-sm text-red-600">Oops, something went wrong: {error}</p>}
        </div>

        {selectedWord && (
          <VocabularyCard
            word={selectedWord}
            definition={definition?.word === selectedWord ? definition.text : null}
            onClose={() => setSelectedWord(null)}
          />
        )}

        <ChatInput onSend={sendMessage} disabled={typing} />
      </div>
    </section>
  )
}

export default ChatView
