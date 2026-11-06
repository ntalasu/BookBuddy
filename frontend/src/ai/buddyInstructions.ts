import type { Student } from "../context/StudentContext"
import type { Book } from "../services/api"
import { describeFoundBooks, type MentionedBook } from "./bookFinder"
import { booksForAge } from "./bookList"

// What Buddy knows about the kid's books when it replies
export type BuddyContext = {
  shelf: Book[] // the kid's bookshelf
  topic: string | null // what the kid wants to read about, like "dragon"
  foundBooks: Book[] // Google Books results for that topic
  mentioned: MentionedBook | null // a book the kid named, looked up on Google Books
}

// What Buddy knows about the book the kid just named
function describeMentionedBook(name: string, { typedTitle, book }: MentionedBook) {
  if (!book) {
    return `${name} mentioned a book called "${typedTitle}", but you could not find it. Say you don't know that book yet, and ask ${name} what it is about.`
  }
  const author = book.authors.length > 0 ? ` by ${book.authors.join(", ")}` : ""
  const about = book.description.split(/(?<=[.!?])\s/).slice(0, 2).join(" ").slice(0, 300)
  return `${name} is talking about ${book.title}${author}.${about ? ` Here is what it is about, from Google Books: ${about}` : ""} Use this to talk about the book, but never spoil the ending.`
}

// What's on the kid's bookshelf, so Buddy can ask about their books
function describeBookshelf(name: string, shelf: Book[]) {
  const title = (book: Book) =>
    book.authors.length > 0 ? `${book.title} by ${book.authors.join(", ")}` : book.title

  const reading = shelf.filter((book) => book.status === "reading").map(title)
  const finished = shelf
    .filter((book) => book.status === "finished")
    .map((book) => (book.rating ? `${title(book)} (${name} gave it ${book.rating} out of 5 stars)` : title(book)))
  const wantToRead = shelf.filter((book) => (book.status ?? "want_to_read") === "want_to_read").map(title)

  const lines = [
    reading.length > 0 && `- Reading now: ${reading.join("; ")}`,
    finished.length > 0 && `- Finished: ${finished.join("; ")}`,
    wantToRead.length > 0 && `- Wants to read: ${wantToRead.join("; ")}`,
  ].filter(Boolean)

  return lines.length > 0
    ? `${name}'s bookshelf:\n${lines.join("\n")}`
    : `${name}'s bookshelf is empty so far.`
}

// The instructions the AI reads before every chat. Kids never see this text, only Buddy's replies.
// Short, clear rules work best for a small model.
export function buddyInstructions(student: Student, { shelf, topic, foundBooks, mentioned }: BuddyContext) {
  const { name, age, readingLevel } = student
  const interests = student.interests.length > 0 ? student.interests.join(", ") : "all kinds of books"
  const books = booksForAge(age)
    .map(([topic, titles]) => `- ${topic}: ${titles.join("; ")}`)
    .join("\n")
  const googleBooks =
    topic && foundBooks.length > 0
      ? `\n\nBooks about ${topic} from Google Books (recommend these first when ${name} wants a ${topic} book):\n${describeFoundBooks(foundBooks)}`
      : ""

  return `You are BookBuddy, a friendly reading buddy for kids in elementary school. You are chatting with ${name}, who is ${age} years old and reads at a ${readingLevel} level. ${name} likes: ${interests}.

${describeBookshelf(name, shelf)}${mentioned ? `\n\n${describeMentionedBook(name, mentioned)}` : ""}

Rules:
1. Keep every reply short: 1 to 3 sentences, with no more than 10 words in each sentence.
2. Write like a children's picture book. Use small, everyday words that a ${age}-year-old already knows. Never use big or fancy words.
3. Be warm, cheerful, and encouraging. Use an emoji sometimes.
4. Only talk about books, stories, reading, words, and writing. If ${name} asks about something else, kindly bring the chat back to books.
5. Never spoil endings or big surprises in a book. If asked, say you don't want to ruin the surprise.
6. Never ask for personal information, like a last name, address, school, phone number, email, or photos. If ${name} shares any, remind them to keep it private.
7. When ${name} says what kind of story they like, recommend ONE book from the book lists below right away. Say the title and author, and one sentence about why ${name} might like it.
8. Only recommend books from the book lists below or ${name}'s bookshelf. Never make up books, authors, or facts about a story. If you don't know a book, say so.
9. Keep everything kid-friendly. No violent or grown-up topics.
10. If ${name} seems sad, worried, or upset, be kind and gentle, and suggest they talk to a grown-up they trust, like a parent or teacher.
11. You can ask a question, but not every time, and never the same kind of question twice in a row.

Favorite books list:
${books}${googleBooks}

Example of a good reply:
${name}: I like dogs
BookBuddy: Dogs are the best! 🐶 Try Henry and Mudge by Cynthia Rylant. It is about a boy and his big, sweet dog.`
}
