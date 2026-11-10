// Buddy's replies when the AI can't run on the kid's device (the "simple chat").
// Book recommendations and book lookups work the same as with the AI (the code picks the book
// and shows its real story sentence). Everything else gets a friendly reply based on keywords.
import type { Book } from "../services/api"
import { authorNames, bestStorySentence, shortTitle } from "./bookFinder"
import type { BuddyTask } from "./buddyInstructions"

function titleWithAuthor(book: Book) {
  return book.authors.length > 0 ? `${shortTitle(book.title)} by ${authorNames(book)}` : shortTitle(book.title)
}

// Keyword replies, checked in order (the first match wins)
const keywordReplies: [RegExp, (name: string) => string][] = [
  // never ask for or keep personal info (numbers, emails)
  [/\d{3,}|@/, () => "Let's keep that private! 🔒 Want to talk about books instead?"],
  // the same kind words as Buddy's AI instructions
  [
    /\b(sad|upset|scared|worried|angry|lonely|cry|crying)\b/,
    () => "I'm sorry you're feeling that way 💛 It might help to talk to a grown-up you trust, like a parent or teacher. I'm always here to chat about books too!",
  ],
  [/\b(hi|hello|hey|hiya)\b/, (name) => `Hi ${name}! 👋 What do you want to read about today?`],
  [/\b(no|nope|nah|don't|dont)\b/, () => "That's okay! What else do you like to read about? 📚"],  // before "thanks", so "no thanks" isn't "you're welcome"
  [/\b(thanks|thank you|thx)\b/, () => "You're welcome! 📚 Happy reading!"],
  [/\b(bored|boring)\b/, () => "Let's find you a fun book! 📚 Do you like dragons, space, or something funny?"],
  [/\b(read it|finished|already read|done)\b/, () => "Wow, great job reading! 🌟 Want me to find another one?"],
  [/\b(yes|yeah|yay|yep|sure|ok|okay|cool|awesome|love)\b/, () => "Yay! 🎉 Tap 📚 Another one for more, or tell me what you like!"],
  [/\?\s*$/, () => "Great question! I'm best at finding books. 📚 Tell me something you like, like dogs, magic, or space!"],
]

// Buddy's reply without the AI. (Recommendations are handled in ChatApiService the same way as with the AI.)
export function simpleReply(name: string, task: BuddyTask, latest: string) {
  const text = latest.toLowerCase()

  switch (task.type) {
    case "talkAbout": {
      const book = task.mentioned.book
      if (!book) return "I don't know that book yet! What is it about? 📚"
      const story = bestStorySentence(book)
      return `Ooh, ${titleWithAuthor(book)}! ${story ? `${story} ` : ""}I won't spoil the ending! 📚`
    }
    case "noBooks":
      return "I couldn't find one right now. 😕 What else do you like to read about?"
    case "recommend":
      return "" // not used: recommendations are written in ChatApiService
    case "chat": {
      // "What's it about?" right after a recommendation: the real story sentence
      const last = task.lastSuggested
      if (last && /what.*(about|happen)|tell me (more|about)|more about/.test(text)) {
        const story = bestStorySentence(last)
        return story ? `Here's what happens in ${shortTitle(last.title)}: ${story}` : `I don't know much more about ${shortTitle(last.title)}, but I think you'll love it! 📚`
      }
      const match = keywordReplies.find(([pattern]) => pattern.test(text))
      return match ? match[1](name) : "I can find you a great book! 📚 Tell me something you like, like dogs, magic, or space."
    }
  }
}
