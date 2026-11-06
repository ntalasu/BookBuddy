// Finds real books for Buddy to recommend, using Google Books (through our backend).
// Only a topic word like "dragon" is ever searched, never the kid's actual message,
// so what kids type stays on their device.
import { searchBooks, type Book } from "../services/api"

// Kid words -> the topic we search for. Covers the interests on the profile page too.
const topics: { search: string; words: string[] }[] = [
  { search: "dragon", words: ["dragon", "dragons"] },
  { search: "magic", words: ["magic", "magical", "wizard", "wizards", "witch", "witches", "spell", "spells"] },
  { search: "fairy", words: ["fairy", "fairies", "fairy tales"] },
  { search: "unicorn", words: ["unicorn", "unicorns"] },
  { search: "princess", words: ["princess", "princesses"] },
  { search: "knight", words: ["knight", "knights", "castle", "castles", "knights & castles"] },
  { search: "monster", words: ["monster", "monsters"] },
  { search: "ghost", words: ["ghost", "ghosts", "spooky", "haunted"] },
  { search: "superhero", words: ["superhero", "superheroes", "superheros"] },
  { search: "pirate", words: ["pirate", "pirates"] },
  { search: "mystery", words: ["mystery", "mysteries", "detective", "detectives"] },
  { search: "adventure", words: ["adventure", "adventures"] },
  { search: "funny", words: ["funny", "silly", "jokes", "jokes & riddles", "comics"] },
  { search: "dog", words: ["dog", "dogs", "puppy", "puppies"] },
  { search: "cat", words: ["cat", "cats", "kitten", "kittens"] },
  { search: "horse", words: ["horse", "horses", "pony", "ponies"] },
  { search: "animal", words: ["animal", "animals", "pets"] },
  { search: "dinosaur", words: ["dinosaur", "dinosaurs", "dino", "dinos"] },
  { search: "bug", words: ["bug", "bugs", "insect", "insects", "butterfly", "butterflies"] },
  { search: "ocean", words: ["ocean", "sea", "shark", "sharks", "whale", "whales", "fish"] },
  { search: "space", words: ["space", "planet", "planets", "astronaut", "astronauts", "rocket", "rockets", "stars"] },
  { search: "robot", words: ["robot", "robots"] },
  { search: "science", words: ["science", "scientist", "experiment", "experiments", "how things work"] },
  { search: "nature", words: ["nature", "forest", "camping"] },
  { search: "soccer", words: ["soccer"] },
  { search: "baseball", words: ["baseball"] },
  { search: "basketball", words: ["basketball"] },
  { search: "sports", words: ["sports", "sport"] },
  { search: "truck", words: ["truck", "trucks", "car", "cars", "trucks & cars"] },
  { search: "train", words: ["train", "trains"] },
  { search: "friend", words: ["friend", "friends", "friendship"] },
  { search: "family", words: ["family", "brother", "sister"] },
  { search: "school", words: ["school"] },
  { search: "art", words: ["art", "drawing", "painting"] },
  { search: "music", words: ["music", "singing"] },
  { search: "cooking", words: ["cooking", "baking", "treats & sweets"] },
  { search: "birthday", words: ["birthday", "birthdays"] },
]

// The topic in a piece of text (a kid's message or a profile interest), if there is one
function findTopic(text: string) {
  const lower = text.toLowerCase()
  const words = new Set(lower.split(/[^a-z&]+/))
  return topics.find((topic) =>
    topic.words.some((word) => (word.includes(" ") ? lower.includes(word) : words.has(word))),
  )?.search
}

// The topic to recommend books for: the newest one the kid mentioned in the chat,
// or else one of their profile interests
export function pickTopic(kidMessages: string[], interests: string[]) {
  for (const message of [...kidMessages].reverse()) {
    const topic = findTopic(message)
    if (topic) return topic
  }
  for (const interest of interests) {
    const topic = findTopic(interest)
    if (topic) return topic
  }
  return null
}

// Books that aren't stories to read, like coloring and drawing books
const notStoryBooks = /how to draw|coloring|colouring|activity|sticker|workbook|puzzle|guide to|encyclopedia/i

// Descriptions that point to teen or grown-up books, even when Google calls them kids' books
const notForKids = /game of thrones|\bhbo\b|young adult|\bteens?\b|\bYA\b|ages 1[2-9]|adults?\b|mature/i

// "My Father's Dragon: A Story" and "MY FATHER'S DRAGON" count as the same book
function sameBookKey(book: Book) {
  return book.title.toLowerCase().split(":")[0].replace(/[^a-z0-9]/g, "")
}

// Translations often show the English title in brackets, like "Hombre Perro (Dog Man: ...)".
// If that English title is also in the results, the bracketed one is a translation.
function isTranslationOf(book: Book, keys: Set<string>) {
  const bracketed = book.title.match(/\(([^)]+)\)/)?.[1]
  if (!bracketed) return false
  const key = sameBookKey({ ...book, title: bracketed })
  return key !== sameBookKey(book) && keys.has(key)
}

// Remember searches, so chatting about dragons doesn't search Google every message
const cache = new Map<string, Book[]>()

// Up to 4 different kids' books about a topic
export async function findBooksAbout(topic: string) {
  const cached = cache.get(topic)
  if (cached) return cached

  // Searching titles finds the best-known books. If that finds too few, search more widely.
  const titleMatches = await searchBooks(`intitle:${topic} subject:"juvenile fiction"`, "en")
  const results =
    titleMatches.length >= 4
      ? titleMatches
      : [...titleMatches, ...(await searchBooks(`${topic} subject:"juvenile fiction"`, "en"))]

  const books: Book[] = []
  const seen = new Set<string>()
  const allKeys = new Set(results.map(sameBookKey))
  for (const book of results) {
    if (isTranslationOf(book, allKeys)) continue
    const isKidsBook = (book.categories ?? []).some((category) => category.toLowerCase().includes("juvenile"))
    if (!isKidsBook || notStoryBooks.test(book.title) || notForKids.test(book.description)) continue
    if (seen.has(sameBookKey(book))) continue
    seen.add(sameBookKey(book))
    books.push(book)
    if (books.length === 4) break
  }

  cache.set(topic, books)
  return books
}

// One line per book for Buddy: title, author, and the first sentence of what it's about
export function describeFoundBooks(books: Book[]) {
  return books
    .map((book) => {
      const author = book.authors.length > 0 ? ` by ${book.authors.join(", ")}` : ""
      const firstSentence = book.description.split(/(?<=[.!?])\s/)[0].slice(0, 160)
      return `- ${book.title}${author}${firstSentence ? `: ${firstSentence}` : ""}`
    })
    .join("\n")
}

// ---- Looking up a book the kid names, like "have you read Matilda?" ----

// Clear signs a kid is naming a book. These may search Google Books.
const namingPhrases = [
  /"([^"]+)"/, // a title in quotes
  /“([^”]+)”/,
  /\b(?:book|story) (?:called|named) (.+)/,
  /\bheard of (.+)/,
  /\b(?:have you|did you|i|i've|ive|i have|im|i'm|i am) (?:ever )?(?:read|reading|finished|started) (.+)/,
]
// Softer signs, like "I love Matilda". These only match books Buddy already knows about.
const likingPhrases = [/\b(?:i|i really) (?:like|love|liked|loved) (.+)/, /\babout (.+)/]

// Words that end the title part of a sentence, like "have you read matilda AND holes"
const titleEnders = /\s+(?:and|but|because|cause|too|yet|it|it's|its|is|was|by|right|lol)\b.*$/

// The title part of a message, or null. Never more than 6 words, and nothing with numbers or @.
// "whole" keeps words like "and", for titles like "Frog and Toad".
function titleFrom(message: string, patterns: RegExp[], clearlyABook: boolean, whole = false) {
  for (const pattern of patterns) {
    const match = message.toLowerCase().match(pattern)?.[1]
    if (!match) continue
    const phrase = match
      .split(/[?.!,;]/)[0]
      .replace(/^(?:the book|the story|a book|book)\s+/, "")
    const title = (whole ? phrase : phrase.replace(titleEnders, "")).trim()
    const words = title.split(/\s+/).filter(Boolean)
    if (words.length === 0 || words.length > 6 || /[0-9@]/.test(title)) continue
    // "i love dragons" is a topic, not a title (but "have you read dog man" is a title)
    if (findTopic(title) && words.length <= (clearlyABook ? 1 : 2)) continue
    if (/^(?:a|an|some|any|about|books?|stories|reading|it|that|this|them|you|my|your)\b/.test(title)) continue
    return title
  }
  return null
}

function titleKey(title: string) {
  return title.toLowerCase().split(":")[0].replace(/^the\s+/, "").replace(/[^a-z0-9]/g, "")
}

// Does this book's title match what the kid typed? ("matilda" matches "Matilda: A Novel")
function titleMatches(bookTitle: string, typed: string) {
  const book = titleKey(bookTitle)
  const kid = titleKey(typed)
  return kid.length >= 3 && (book === kid || (kid.length >= 5 && book.startsWith(kid)))
}

const lookupCache = new Map<string, Book | null>()

// Search Google Books for one title, preferring kids' books
async function lookUpTitle(title: string, author?: string) {
  const cacheKey = `${title}|${author ?? ""}`
  if (lookupCache.has(cacheKey)) return lookupCache.get(cacheKey) ?? null

  const query = `intitle:"${title}"${author ? ` inauthor:"${author}"` : ""}`
  const results = (await searchBooks(query, "en")).filter(
    (book) => titleMatches(book.title, title) && !notForKids.test(book.description),
  )
  const isKidsBook = (book: Book) => (book.categories ?? []).some((c) => c.toLowerCase().includes("juvenile"))
  // For a series like Dog Man, every book matches. The shortest title is usually the first book.
  const exact = results
    .filter((book) => titleKey(book.title) === titleKey(title))
    .sort((a, b) => a.title.length - b.title.length)
  // best: the exact title as a kids' book, then the exact title, then a close match (like a sequel)
  const found =
    exact.find(isKidsBook) ??
    exact[0] ??
    results.find(isKidsBook) ??
    results[0] ??
    null

  lookupCache.set(cacheKey, found)
  return found
}

export type MentionedBook = { typedTitle: string; book: Book | null }

// The book the kid is talking about in their newest messages, looked up on Google Books.
// knownBooks = books Buddy already has (bookshelf + topic results); favorites = "Title by Author" lines.
export async function findMentionedBook(kidMessages: string[], knownBooks: Book[], favorites: string[]) {
  for (const message of kidMessages.slice(-3).reverse()) {
    // 1. A book Buddy already knows: no new search needed
    const phrases = [...namingPhrases, ...likingPhrases]
    for (const liked of [titleFrom(message, phrases, false, true), titleFrom(message, phrases, false)]) {
      if (!liked) continue
      const known = knownBooks.find((book) => titleMatches(book.title, liked))
      if (known) return { typedTitle: liked, book: known }

      const favorite = favorites.find((line) => titleMatches(line.split(" by ")[0], liked))
      if (favorite) {
        const [title, author] = favorite.split(" by ")
        return { typedTitle: liked, book: await lookUpTitle(title, author) }
      }
    }

    // 2. Clearly naming a book Buddy doesn't know: look it up
    const named = titleFrom(message, namingPhrases, true)
    if (named) return { typedTitle: named, book: await lookUpTitle(named) }
  }
  return null
}
