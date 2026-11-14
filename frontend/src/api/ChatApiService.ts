import {
  asksForAnother,
  similarBookTitle,
  topicsFromBook,
  pickSimilarBook,
  describeSearch,
  findMentionedBook,
  mentionsTopic,
  pickBookFor,
  bestStorySentence,
  hasWords,
  isBasedOn,
  keepsTheDetails,
  keepTrueSentences,
  partialMatchLine,
  pickSearch,
  recommendationLine,
  shortTitle,
} from "../ai/bookFinder"
import { favoriteTitlesForAge } from "../ai/bookList"
import { askBuddy, defineWithBuddy, pickVocabularyWords } from "../ai/buddyEngine"
import { dictionaryMeanings, mainMeaning } from "../ai/dictionary"
import { simpleReply } from "../ai/simpleReplies"
import type { BuddyTask } from "../ai/buddyInstructions"
import type { Student } from "../context/StudentContext"
import { getSavedBooks, type Book } from "../services/api"
import type { ChatMessage, ChatResponse, DefinitionResponse } from "../types"

// Buddy's chat runs on the AI in the browser (see src/ai), not the backend,
// so it's free, has no message limit, and messages never leave the kid's device.
// useAI is false on devices that can't run the AI: then the code writes every reply (the "simple chat").
export const ChatApiService = {
  // history = the whole chat so far, ending with the kid's new message.
  // onText is called with Buddy's reply so far, so it can appear word by word.
  async sendMessage(
    student: Student,
    history: ChatMessage[],
    onText: (textSoFar: string) => void,
    useAI = true,
  ): Promise<ChatResponse> {
    // Only a topic word (like "dragon") or a short book title is ever searched on Google Books
    // (never numbers or emails); the kid's messages themselves stay on the device.
    const kidMessages = history.filter((message) => message.from === "student").map((message) => message.text)
    const latest = kidMessages[kidMessages.length - 1] ?? ""
    const shelf = await getSavedBooks().catch(() => [])
    const suggested = history.flatMap((message) => message.recommendedBooks ?? [])

    const task = await decideTask(student, latest, kidMessages, shelf, suggested)

    // Recommendations: we write "Try <title> by <author>!" ourselves, so it always matches the book card,
    // and say so if the book only matches part of what the kid asked for. Then the real story sentence(s)
    // that show what the book is about, picked by us from the description.
    const line =
      task.type === "recommend"
        ? recommendationLine(task.book)
        : ""
    const story = task.type === "recommend" ? bestStorySentence(task.book, task.search) : null

    // The simple chat's reply (no AI): used on devices that can't run the AI, while it's still
    // loading, or if it breaks while writing this reply
    const simpleVersion =
      task.type === "recommend" ? line + (story ?? "I think you'll love it! 📚") : simpleReply(student.name, task, latest)

    let reply = simpleVersion
    let aiFailed = false
    if (!useAI || (task.type === "recommend" && !story)) {
      onText(reply)
    } else {
      try {
        reply = await replyWithAI(student, history, shelf, task, line, story, onText)
      } catch (error) {
        console.error("Buddy's AI stopped working, using the simple chat:", error)
        aiFailed = true
        reply = simpleVersion
        onText(reply)
      }
    }

    // a card to add the book to the bookshelf (if it isn't there already)
    const cardBook = task.type === "recommend" ? task.book : task.type === "talkAbout" ? task.mentioned.book : null
    const onShelf = cardBook && shelf.some((book) => book.id === cardBook.id || book.title === cardBook.title)
    const recommendedBooks = cardBook && !onShelf ? [cardBook] : []

    // words to underline for kids to tap and learn, sized for the kid's age
    const vocabularyWords = pickVocabularyWords(reply, student.age)

    return { reply, vocabularyWords, recommendedBooks, aiFailed }
  },

  // Chats aren't saved anywhere yet, so every visit starts fresh
  // we want the chats to save the conversations 
  async getConversation(studentId: string): Promise<ChatMessage[]> {
  const saved = localStorage.getItem(`bookbuddy-chat-${studentId}`)

  if (!saved) return []

  try {
    return JSON.parse(saved) as ChatMessage[]
  } catch {
    return []
  }
},

async saveConversation(
  studentId: string,
  messages: ChatMessage[],
): Promise<void> {
  localStorage.setItem(
    `bookbuddy-chat-${studentId}`,
    JSON.stringify(messages),
  )
},

  // The meaning comes from a real dictionary. Buddy only rewords it for kids, and if its
  // version doesn't match the dictionary, kids see the dictionary's own (shortened) meaning.
  async defineWord(student: Student, word: string, context: string, useAI = true): Promise<DefinitionResponse> {
    const meanings = await dictionaryMeanings(word)
    if (meanings.length === 0) {
      return { word, definition: "Hmm, I don't know that word yet. Let's look it up with a grown-up! 📖" }
    }
    if (!useAI) return { word, definition: mainMeaning(meanings) }
    const kidWords = await defineWithBuddy(student, word, context, meanings).catch(() => "")
    const matchesDictionary = hasWords(kidWords) && isBasedOn(kidWords, `${meanings.join(" ")} ${context}`, 0.34)
    return { word, definition: matchesDictionary ? kidWords : mainMeaning(meanings) }
  },
}

// Decide Buddy's job for this reply, and pick the book if it should recommend one.
// The code does this, not the AI: a small model can't reliably choose books by itself.
async function decideTask(
  student: Student,
  latest: string,
  kidMessages: string[],
  shelf: Book[],
  suggested: Book[],
): Promise<BuddyTask> {

  // Check if the student wants a book similar to another book
  const similarTitle = similarBookTitle(latest)

  if (similarTitle) {
    const mentioned = await findMentionedBook(
      [`Have you read ${similarTitle}?`],
      shelf,
      favoriteTitlesForAge(student.age)
    ).catch(() => null)

    if (mentioned?.book) {
      const search = topicsFromBook(mentioned.book)

      const book = await pickSimilarBook(
        mentioned.book,
        {
          age: student.age,
          readingLevel: student.readingLevel,
        },
        [...shelf, ...suggested, mentioned.book]
      ).catch((error) => {
        console.error("Similar book recommendation failed:", error)
        return null
      })

      if (book) {
        return {
          type: "recommend",
          book,
          search: search ?? { kind: "adventure" },
        }
      }

      return {
        type: "noBooks",
        topic: similarTitle,
      }
    }

    return {
      type: "noBooks",
      topic: similarTitle,
    }
  }
  // 1. The kid named a book ("have you read Dog Man?"): talk about it
  const mentioned = await findMentionedBook([latest], shelf, favoriteTitlesForAge(student.age)).catch(() => null)
  if (mentioned) return { type: "talkAbout", mentioned }

  // 2. The kid wants a book ("I like spooky!", "show me another one"): pick one
  const search = pickSearch(kidMessages, student.interests)
  if (search && (mentionsTopic(latest) || asksForAnother(latest))) {
    const topic = describeSearch(search)
    // the book has to fit the kid's age, reading level, and profile interests
    const book = await pickBookFor(search, student, [...shelf, ...suggested]).catch(() => null)
    return book ? { type: "recommend", book, search } : { type: "noBooks", topic }
  }

  // 3. Just chatting (like "yes!" or "I read it already")
  return { type: "chat", lastSuggested: suggested[suggested.length - 1] ?? null }
}

// What Buddy says if everything it wrote failed the fact check
function safeReply(task: BuddyTask) {
  switch (task.type) {
    case "talkAbout":
      return task.mentioned.book
        ? `${shortTitle(task.mentioned.book.title)} sounds great! I don't want to spoil it. 📚 What do you like about it?`
        : "I don't know that book yet! What is it about? 📚"
    case "noBooks":
      return "I couldn't find one right now. 😕 What else do you like to read about?"
    default:
      return "That's so cool! 📚 What do you want to read about next?"
  }
}

// Buddy's reply with the AI. Everything it writes is fact-checked first.
async function replyWithAI(
  student: Student,
  history: ChatMessage[],
  shelf: Book[],
  task: BuddyTask,
  line: string,
  story: string | null,
  onText: (textSoFar: string) => void,
) {
  if (task.type === "recommend" && story) {
    // Buddy rewrites the story sentence in kid words. Its version has to match the story and keep
    // the details (names, what happens). If not, kids see the real story sentence instead.
    const simpler = await askBuddy(student, { shelf, task }, history, (text) => onText(line + text))
    const checked = keepTrueSentences(simpler, {
      allowed: [task.book],
      factsFrom: { ...task.book, description: story },
      everySentence: true,
    })
    return line + (hasWords(checked) && keepsTheDetails(checked, story) ? checked : story)
  }

  // Anything Buddy says about a book has to match the book's real description,
  // and it can't name any books besides the real one being talked about
  const raw = await askBuddy(student, { shelf, task }, history, onText)
  const book = task.type === "talkAbout" ? task.mentioned.book : task.type === "chat" ? task.lastSuggested : null
  // when the kid asked about a book, every sentence is about it; in other chat, only sentences that
  // make a claim about the book (a name, "the story...", its title) get checked
  const checked = keepTrueSentences(raw, {
    allowed: book ? [book] : [],
    factsFrom: book,
    everySentence: task.type === "talkAbout",
  })
  return hasWords(checked) ? checked : safeReply(task)
}
