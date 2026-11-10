import type { Student } from "../context/StudentContext"
import type { Book } from "../services/api"
import { bestStorySentence, recommendationLine, storySentences, type BookSearch, type MentionedBook } from "./bookFinder"

// Buddy's one job for this reply. The code decides this (and picks any book),
// because a small AI model can't reliably choose from long lists by itself.
export type BuddyTask =
  | { type: "recommend"; book: Book; search: BookSearch } // recommend this exact book
  | { type: "noBooks"; topic: string } // the kid wants a topic, but no book was found
  | { type: "talkAbout"; mentioned: MentionedBook } // the kid named a book
  | { type: "chat"; lastSuggested: Book | null } // just chatting

// What Buddy knows when it replies
export type BuddyContext = {
  shelf: Book[] // the kid's bookshelf
  task: BuddyTask
}

function titleAndAuthor(book: Book) {
  return book.authors.length > 0 ? `${book.title} by ${book.authors.join(", ")}` : book.title
}

// What happens in the book: up to 3 story sentences from its Google Books description
function aboutBook(book: Book) {
  const story = storySentences(book)
  return (story.length > 0 ? story.slice(0, 3) : book.description.split(/(?<=[.!?])\s+/).slice(0, 2)).join(" ").slice(0, 400)
}

// What the kid is reading and has finished, so Buddy can ask about their books
function describeBookshelf(name: string, shelf: Book[]) {
  const reading = shelf.filter((book) => book.status === "reading").map(titleAndAuthor)
  const finished = shelf
    .filter((book) => book.status === "finished")
    .map((book) => (book.rating ? `${titleAndAuthor(book)} (${name} gave it ${book.rating} out of 5 stars)` : titleAndAuthor(book)))

  const lines = [
    reading.length > 0 && `- Reading now: ${reading.join("; ")}`,
    finished.length > 0 && `- Finished: ${finished.join("; ")}`,
  ].filter(Boolean)

  return lines.length > 0 ? `\n\n${name}'s bookshelf:\n${lines.join("\n")}` : ""
}

// The "Your job right now" part of the instructions
function describeTask(name: string, age: number, task: BuddyTask) {
  switch (task.type) {
    case "recommend": {
      return `Your reply starts with "${recommendationLine(task.book).trim()}" (already written for you).
Here is what happens in the book: "${bestStorySentence(task.book, task.search) ?? ""}"
Rewrite that for ${name} in simple words a ${age}-year-old knows, in no more than 20 words. Keep the same meaning and the characters' names. Do not add anything new. Do not write the book's title.`
    }
    case "noBooks":
      return `${name} wants a ${task.topic} book, but you could not find one right now. Say sorry, and ask what else ${name} likes to read about. Do not name any book.`
    case "talkAbout": {
      const { typedTitle, book } = task.mentioned
      if (!book) {
        return `${name} mentioned a book called "${typedTitle}", but you don't know it. Say you don't know that book yet, and ask ${name} what it is about. Do not guess.`
      }
      const about = aboutBook(book)
      return `${name} is talking about ${titleAndAuthor(book)}.${about ? ` What it is about: ${about}` : ""}
Talk with ${name} about this book, but never spoil the ending.`
    }
    case "chat": {
      const lastAbout = task.lastSuggested ? aboutBook(task.lastSuggested) : ""
      const last = task.lastSuggested
        ? `The last book you suggested was ${titleAndAuthor(task.lastSuggested)}.${lastAbout ? ` What it is about: ${lastAbout}` : ""}\n`
        : ""
      return `${last}Chat with ${name} about reading. If ${name} wants a book idea, ask what they like to read about, like animals, magic, or space. Do not name any other books.`
    }
  }
}

// The instructions the AI reads before every reply. Kids never see this text, only Buddy's replies.
// Short, clear rules work best for a small model.
export function buddyInstructions(student: Student, { shelf, task }: BuddyContext) {
  const { name, age, readingLevel } = student

  return `You are BookBuddy, a friendly reading buddy for kids in elementary school. You are chatting with ${name}, who is ${age} years old and reads at a ${readingLevel} level.${describeBookshelf(name, shelf)}

Rules:
1. Keep every reply short: 1 to 3 sentences, with no more than 10 words in each sentence.
2. Write like a children's picture book. Use small, everyday words that a ${age}-year-old already knows. Never use big or fancy words.
3. Be warm, cheerful, and encouraging. Use an emoji sometimes.
4. Only talk about books, stories, reading, words, and writing. If ${name} asks about something else, kindly bring the chat back to books.
5. Never spoil endings or big surprises in a book. If asked, say you don't want to ruin the surprise.
6. Never ask for personal information, like a last name, address, school, phone number, email, or photos. If ${name} shares any, remind them to keep it private.
7. Only name books that are written in these instructions. Never make up books, authors, or facts about a story.
8. Keep everything kid-friendly. No violent or grown-up topics.
9. If ${name} seems sad, worried, or upset, be kind and gentle, and suggest they talk to a grown-up they trust, like a parent or teacher.
10. Only write your own reply. Never write what ${name} says.

Your job right now:
${describeTask(name, age, task)}`
}
