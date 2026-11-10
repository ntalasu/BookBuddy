import { useState } from "react"
import { useLoggedInStudent, type Student } from "../context/StudentContext"
import { followUpOptions, pickSearch } from "../ai/bookFinder"
import { groupInterests } from "../data/interests"
import { useBuddyLoader } from "../hooks/useBuddyLoader"
import { useChat } from "../hooks/useChat"
import BuddyAvatar from "./BuddyAvatar"
import BuddyWakingUp from "./BuddyWakingUp"
import ChatInput from "./ChatInput"
import RecommendedBookCard from "./RecommendedBookCard"
import VocabularyCard from "./VocabularyCard"

function cleanWord(word: string) {
  return word.toLowerCase().replace(/[^a-z]/g, "")
}

// Up to 4 of the kid's profile picks, mixing the three groups (a kind of book, a thing, fun stuff)
function pickStarters(interests: string[]) {
  const { kinds, things, fun } = groupInterests(interests)
  const mixed: string[] = []
  for (let i = 0; mixed.length < 4 && i < Math.max(kinds.length, things.length, fun.length); i++) {
    for (const group of [kinds, things, fun]) {
      if (group[i] && mixed.length < 4) mixed.push(group[i])
    }
  }
  return mixed
}

// "Magic", "Magic and Space", "Magic, Space and Camping"
function listWords(words: string[]) {
  return words.length <= 1 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`
}

// Buddy's first message, using what the kid picked on their profile
function greeting(student: Student, starters: string[]) {
  const hello = `Hi ${student.name}!${student.buddyName ? ` And hi to ${student.buddyName} too!` : ""} I'm BookBuddy. 📚`
  return starters.length > 0
    ? `${hello} I see you like ${listWords(starters.slice(0, 3))}. What do you want to read about today? Tap one, or type your own!`
    : `${hello} What do you like to read about? You can also pick your favorites on your Profile page!`
}

function ChatView() {
  const { student } = useLoggedInStudent()
  const buddy = useBuddyLoader() // starts waking Buddy up as soon as the chat opens
  const starters = pickStarters(student.interests)
  // One chat for every device: the simple chat answers while the AI loads (and for good if this device
  // can't run it, or if it breaks), and Buddy's AI answers once it's ready
  const useAI = buddy.status === "ready"
  const { messages, typing, error, sendMessage, defineWord } = useChat(
    student,
    greeting(student, starters),
    useAI,
    buddy.switchToSimple,
  )
  const hasChatted = messages.some((message) => message.from === "student")

  // after Buddy recommends a book: buttons to find a better one, using the kid's profile picks
  const lastMessage = messages[messages.length - 1]
  const justRecommended = !typing && lastMessage?.from === "buddy" && (lastMessage.recommendedBooks?.length ?? 0) > 0
  const kidMessages = messages.filter((message) => message.from === "student").map((message) => message.text)
  const followUps = justRecommended ? followUpOptions(pickSearch(kidMessages, student.interests), student.interests) : []

  // Without the AI, buttons are always there to keep going (typing still works too)
  const keepGoing =
    !useAI && hasChatted && !typing && followUps.length === 0
      ? [
          ...starters.slice(0, 3).map((pick) => ({ label: pick, message: `I like ${pick.toLowerCase()}!` })),
          { label: "📚 Pick a book for me", message: "Show me another book!" },
        ]
      : []
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
        {/* a small "Buddy is waking up…" bar while the AI loads (kids can chat meanwhile) */}
        {buddy.status === "loading" && (
          <BuddyWakingUp student={student} progress={buddy.progress} firstTime={buddy.firstTime} />
        )}

        {/* a note for grown-ups when Buddy's AI can't run on this device */}
        {buddy.status === "simple" && (
          <p className="rounded-t-xl bg-gray-50 px-4 py-2 text-xs text-gray-500">
            Buddy is using its simple chat on this device. For Buddy's full chat, use Chrome or Edge on a newer computer or tablet.
          </p>
        )}

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
                    // the space goes outside the button, or the browser drops it
                    <span key={i}>
                      <button
                        onClick={() => showDefinition(cleanWord(word), message.text)}
                        className="cursor-pointer font-semibold text-sky-700 underline decoration-dotted"
                      >
                        {word}
                      </button>{" "}
                    </span>
                  ) : (
                    <span key={i}>{word} </span>
                  ),
                )}

                {/* books Buddy recommended, with an "Add to my bookshelf" button */}
                {message.recommendedBooks?.map((book) => (
                  <RecommendedBookCard key={book.id} book={book} />
                ))}
              </div>
            </div>
          ))}
          {/* until Buddy's first words show up */}
          {typing && messages[messages.length - 1]?.from === "student" && (
            <p className="text-sm text-gray-400">BookBuddy is thinking…</p>
          )}
          {error && <p className="text-sm text-red-600">Oops, something went wrong: {error}</p>}
        </div>

        {selectedWord && (
          <VocabularyCard
            word={selectedWord}
            definition={definition?.word === selectedWord ? definition.text : null}
            onClose={() => setSelectedWord(null)}
          />
        )}

        {/* the kid's profile picks, as buttons to start the chat */}
        {!hasChatted && starters.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {starters.map((pick) => (
              <button
                key={pick}
                onClick={() => sendMessage(`I like ${pick.toLowerCase()}!`)}
                disabled={typing}
                className="rounded-full border-2 border-orange-300 bg-orange-50 px-4 py-1 font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-50"
              >
                {pick}
              </button>
            ))}
          </div>
        )}

        {[...followUps, ...keepGoing].length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {[...followUps, ...keepGoing].map((option) => (
              <button
                key={option.label}
                onClick={() => sendMessage(option.message)}
                className="rounded-full border-2 border-sky-300 bg-sky-50 px-4 py-1 font-semibold text-sky-700 hover:bg-sky-100"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        <ChatInput onSend={sendMessage} disabled={typing} />
      </div>
    </section>
  )
}

export default ChatView
