// Finds real books for Buddy to recommend, using Google Books (through our backend).
// Only a topic word like "dragon" is ever searched, never the kid's actual message,
// so what kids type stays on their device.
import { groupInterests } from "../data/interests"
import { getRecommendations, searchBooks, type Book } from "../services/api"

// Kid words -> the topic we search for. Covers every interest on the profile page too.
// A "kind" of book (like mystery) can be mixed with a thing (like dogs) to find a dog mystery.
type Topic = { search: string; words: string[]; kind?: boolean }

const topics: Topic[] = [
  // kinds of books
  { search: "adventure", kind: true, words: ["adventure", "adventures"] },
  { search: "mystery", kind: true, words: ["mystery", "mysteries", "detective", "detectives"] },
  { search: "funny", kind: true, words: ["funny", "silly", "joke", "jokes", "riddles", "jokes & riddles"] },
  { search: "fantasy", kind: true, words: ["fantasy"] },
  { search: "magic", kind: true, words: ["magic", "magical", "wizard", "wizards", "witch", "witches", "spell", "spells", "magic tricks"] },
  { search: "fairy", kind: true, words: ["fairy", "fairies", "fairy tale", "fairy tales"] },
  { search: "ghost", kind: true, words: ["ghost", "ghosts", "spooky", "haunted", "scary"] },
  { search: "superhero", kind: true, words: ["superhero", "superheroes", "superheros"] },
  { search: "comic", kind: true, words: ["comic", "comics", "graphic novel", "graphic novels"] },
  { search: "poems", kind: true, words: ["poem", "poems", "poetry"] },
  // things kids are into
  { search: "dragon", words: ["dragon", "dragons"] },
  { search: "unicorn", words: ["unicorn", "unicorns"] },
  { search: "princess", words: ["princess", "princesses"] },
  { search: "knight", words: ["knight", "knights", "castle", "castles", "knights & castles"] },
  { search: "monster", words: ["monster", "monsters"] },
  { search: "pirate", words: ["pirate", "pirates"] },
  { search: "dog", words: ["dog", "dogs", "puppy", "puppies"] },
  { search: "cat", words: ["cat", "cats", "kitten", "kittens"] },
  { search: "horse", words: ["horse", "horses", "pony", "ponies"] },
  { search: "pet", words: ["pet", "pets"] },
  { search: "animal", words: ["animal", "animals"] },
  { search: "dinosaur", words: ["dinosaur", "dinosaurs", "dino", "dinos"] },
  { search: "bug", words: ["bug", "bugs", "insect", "insects", "butterfly", "butterflies"] },
  { search: "ocean", words: ["ocean", "sea", "shark", "sharks", "whale", "whales", "fish"] },
  { search: "space", words: ["space", "planet", "planets", "astronaut", "astronauts", "rocket", "rockets", "stars"] },
  { search: "robot", words: ["robot", "robots"] },
  { search: "science", words: ["science", "scientist", "experiment", "experiments", "how things work"] },
  { search: "history", words: ["history", "historical", "long ago"] },
  { search: "biography", words: ["real people", "biography", "biographies", "true story"] },
  { search: "camping", words: ["camping", "camp", "tent"] },
  { search: "nature", words: ["nature", "forest", "trees"] },
  { search: "soccer", words: ["soccer"] },
  { search: "baseball", words: ["baseball"] },
  { search: "basketball", words: ["basketball"] },
  { search: "sports", words: ["sports", "sport"] },
  { search: "truck", words: ["truck", "trucks", "car", "cars", "trucks & cars"] },
  { search: "train", words: ["train", "trains"] },
  { search: "friend", words: ["friend", "friends", "friendship"] },
  { search: "family", words: ["family", "brother", "sister"] },
  { search: "school", words: ["school"] },
  { search: "holiday", words: ["holiday", "holidays", "christmas", "halloween", "thanksgiving", "hanukkah"] },
  { search: "birthday", words: ["birthday", "birthdays"] },
  { search: "toy", words: ["toy", "toys"] },
  { search: "video game", words: ["video game", "video games", "gaming"] },
  { search: "build", words: ["building things", "building", "lego", "legos", "build"] },
  { search: "art", words: ["art", "drawing", "painting"] },
  { search: "music", words: ["music", "singing"] },
  { search: "cooking", words: ["cooking", "baking", "treats & sweets", "sweets", "treats"] },
]

// Every topic in a piece of text (a kid's message or a profile interest)
function topicsIn(text: string) {
  const lower = text.toLowerCase()
  const words = new Set(lower.split(/[^a-z&]+/))
  return topics.filter((topic) =>
    topic.words.some((word) => (word.includes(" ") ? lower.includes(word) : words.has(word))),
  )
}

function findTopic(text: string) {
  return topicsIn(text)[0]
}

// What to search for: a kind of book and/or a thing, like { kind: "mystery", thing: "dog" }
export type BookSearch = { kind?: string; thing?: string }

// Pick what to search for: the topics in the kid's newest message. For "another one" or "yes",
// the topics from their last few messages. If the chat hasn't mentioned any, their profile picks.
export function pickSearch(kidMessages: string[], interests: string[]): BookSearch | null {
  const search: BookSearch = {}
  const fillFrom = (texts: string[]) => {
    for (const text of texts) {
      for (const topic of topicsIn(text)) {
        if (topic.kind) search.kind ??= topic.search
        else search.thing ??= topic.search
      }
    }
  }

  // a new topic in the newest message replaces older ones ("I like magic!" then "I like space!" = space)
  const latest = kidMessages[kidMessages.length - 1] ?? ""
  fillFrom(topicsIn(latest).length > 0 ? [latest] : kidMessages.slice(-3).reverse())
  if (!search.kind && !search.thing) {
    // an older topic, if the newest messages are just "yes" and "no"
    const older = [...kidMessages].reverse().find((message) => findTopic(message))
    if (older) fillFrom([older])
  }
  if (!search.kind && !search.thing) fillFrom(interests)

  return search.kind || search.thing ? search : null
}

// "spooky dinosaur", "dinosaur", or "spooky"
export function describeSearch({ kind, thing }: BookSearch) {
  const kindWord = kind ? (kindWords[kind] ?? kind) : undefined
  return [kindWord, thing].filter(Boolean).join(" ")
}

// Descriptions that point to teen or grown-up books, even when Google calls them kids' books
const notForKids = /game of thrones|\bhbo\b|young adult|\bteens?\b|\bYA\b|ages 1[2-9]|adults?\b|mature/i

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

// ---- Picking the book Buddy recommends ----

// Does the kid's message mention a topic, like "spooky" or "dogs"?
export function mentionsTopic(text: string) {
  return topicsIn(text).length > 0
}

// "Show me another one!", "what about other books?"
export function asksForAnother(text: string) {
  return /\b(another|more|other|others|else|different|next)\b/i.test(text)
}

// The book to recommend. Our backend finds popular, well-loved kids' books on the topic
// (from Open Library), reads their descriptions, and only returns books that fit the kid's
// age, reading level, and interests. If none fit, there's no book (Buddy says so) rather
// than a book that doesn't fit. Skips books already suggested or already on the bookshelf.
export async function pickBookFor(
  search: BookSearch,
  kid: { interests: string[]; age: number; readingLevel: string },
  skip: Book[],
) {
  const topics = [search.thing, search.kind].filter((topic): topic is string => Boolean(topic))
  const skipTitles = skip.map((book) => book.title)

  // the kid's profile picks as topics (like "Pets" -> "pet"), so the backend can find books that mix them in
  const interestTopics = [...new Set(kid.interests.flatMap((interest) => topicsIn(interest).map((t) => t.search)))]
  const [best] = await getRecommendations(
    topics,
    kid.interests,
    kid.age,
    skipTitles,
    kid.readingLevel,
    interestTopics.filter((topic) => !topics.includes(topic)),
  ).catch(() => [])
  return best ?? null
}

// ---- Follow-up buttons after a recommendation, built from the kid's profile picks ----

// How each kind of book is said in a sentence
const kindWords: Record<string, string> = {
  adventure: "adventure", mystery: "mystery", funny: "funny", fantasy: "fantasy", magic: "magic",
  fairy: "fairy tale", ghost: "spooky", superhero: "superhero", comic: "comic", poems: "poetry",
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export type FollowUp = { label: string; message: string }

// e.g. after a spooky book: [Spooky dinosaurs] [Spooky school] [📚 Another one]
export function followUpOptions(search: BookSearch | null, interests: string[]): FollowUp[] {
  const options: FollowUp[] = []
  const { kinds, things, fun } = groupInterests(interests)

  if (search?.kind && !search.thing) {
    // a kind of book: mix it with things the kid is into
    const kind = kindWords[search.kind] ?? search.kind
    for (const pick of [...things, ...fun]) {
      if (findTopic(pick)?.kind) continue // "Magic Tricks" is a kind, not a thing
      const thing = pick.toLowerCase()
      options.push({ label: capitalize(`${kind} ${thing}`), message: `I want a ${kind} book about ${thing}!` })
      if (options.length === 2) break
    }
  } else if (search?.thing && !search.kind) {
    // a thing: mix it with kinds of books the kid likes
    for (const pick of kinds) {
      const topic = findTopic(pick)
      if (!topic?.kind) continue
      const kind = kindWords[topic.search] ?? pick.toLowerCase()
      options.push({ label: capitalize(`${kind} ${search.thing}`), message: `I want a ${kind} book about ${search.thing}!` })
      if (options.length === 2) break
    }
  }

  options.push({ label: "📚 Another one", message: "Show me another one!" })
  return options
}

// ---- Writing the recommendation line ourselves, so the title always matches the book ----

// "Dog Man: Grime and Punishment: A Graphic Novel (Dog Man #9): From the Creator of..." -> "Dog Man: Grime and Punishment"
export function shortTitle(title: string) {
  const [main, subtitle] = title.replace(/\s*\(.*?\)/g, "").split(/\s*:\s*/)
  const isFluff = !subtitle || /novel|edition|book \d|from the|series|story|stories|special|classic/i.test(subtitle)
  return isFluff ? main.trim() : `${main.trim()}: ${subtitle.trim()}`
}

// "Shannon Hale and Dean Hale", "Dr. Seuss"
export function authorNames(book: Book) {
  return book.authors.slice(0, 2).join(" and ")
}

// "Try Harper and the Circus of Dreams by Cerrie Burnell! "
export function recommendationLine(book: Book) {
  const author = book.authors.length > 0 ? ` by ${authorNames(book)}` : ""
  return `Try ${shortTitle(book.title)}${author}! `
}

// ---- Fact-checking Buddy's replies, so kids only see true things ----

function sentencesOf(text: string) {
  return text.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.trim())
}

// Does the sentence name a book (a title in quotes, or "by Somebody") that isn't one of the real books?
// Small AI models make up books, so these sentences are dropped.
function namesOtherBook(sentence: string, allowed: Book[]) {
  const namesABook = /["“”]/.test(sentence) || /\bby [A-Z]/.test(sentence)
  if (!namesABook) return false
  const lower = sentence.toLowerCase()
  return !allowed.some((book) => lower.includes(shortTitle(book.title).toLowerCase()))
}

// Usual first words of a sentence, which are capitalized but aren't names
const sentenceStarters = new Set(
  ("I You We It It's That This What Reading Read Yes No Wow Great Oh Ooh Yay Books Book Let's Do Did Are Is " +
    "How Why Maybe Sure Me My Your There Here So And But If When Have Has Can Could Would Will Thanks Thank " +
    "Awesome Cool Nice Good Hi Hello Hey Keep Try Tell Sounds Happy All Every Some The A An").split(" "),
)

// Names like "Hatty" or "Zelda" in the sentence (capitalized words that aren't just starting it)
function namesIn(sentence: string) {
  const words = sentence.trim().match(/[A-Za-z][A-Za-z']*/g) ?? []
  return words.filter((word, i) => /^[A-Z][a-z]{2,}$/.test(word) && (i > 0 || !sentenceStarters.has(word)))
}

// Does the sentence say something about what's in the book? (Not "Great job!" or a question.)
function claimsAboutBook(sentence: string, book: Book) {
  if (sentence.trim().endsWith("?")) return false // questions don't claim anything
  const lower = sentence.toLowerCase()
  const titleWords = (shortTitle(book.title).toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((w) => !everydayWords.has(w))
  return (
    /\b(story|it's about|it is about|in it|happens|character|main|adventure|journey)\b/.test(lower) ||
    titleWords.some((word) => lower.includes(word)) ||
    namesIn(sentence).length > 0
  )
}

// Keep only the true parts of Buddy's reply:
// - drop sentences that name a book that isn't one of the `allowed` real books
// - if `factsFrom` is a book, drop sentences about it that aren't backed up by its real description
//   (every sentence, or only ones that make a claim about the book)
export function keepTrueSentences(
  text: string,
  { allowed = [], factsFrom, everySentence = false }: { allowed?: Book[]; factsFrom?: Book | null; everySentence?: boolean },
) {
  const source = factsFrom ? `${factsFrom.title} ${factsFrom.authors.join(" ")} ${factsFrom.description}` : ""
  return sentencesOf(text)
    .filter((sentence) => {
      if (namesOtherBook(sentence, allowed)) return false
      if (!factsFrom || sentence.trim().endsWith("?")) return true
      if (!everySentence && !claimsAboutBook(sentence, factsFrom)) return true
      return isBasedOn(sentence, source)
    })
    .join(" ")
    .trim()
}

// Is there anything left besides emoji?
export function hasWords(text: string) {
  return /[a-z]/i.test(text)
}

// Topics like ["art", "magic"] -> "magic art"
export function describeTopics(topics: string[]) {
  return describeSearch({
    kind: topics.find((topic) => topic in kindWords),
    thing: topics.find((topic) => !(topic in kindWords)),
  })
}

// If the book only matches part of what the kid asked for, say so honestly:
// "I couldn't find a magic art book, but here's a magic one! "
export function partialMatchLine(book: Book, asked: BookSearch) {
  const askedTopics = [asked.thing, asked.kind].filter(Boolean) as string[]
  const matched = book.matchedTopics ?? askedTopics
  if (matched.length >= askedTopics.length) return ""
  return `I couldn't find a ${describeSearch(asked)} book, but here's a ${describeTopics(matched)} one! `
}

// Everyday words that don't need to come from the book's description
const everydayWords = new Set([
  "about", "there", "their", "these", "those", "which", "would", "could", "should", "really", "think",
  "going", "story", "stories", "books", "reading", "great", "super", "amazing", "awesome", "exciting",
  "wonderful", "favorite", "every", "things", "something", "where", "while", "after", "before", "other",
  "again", "always", "never", "maybe", "loves", "likes", "little", "called", "makes", "wants", "together",
  "people", "lots", "pages", "enjoy", "perfect", "cool", "learn", "learns", "special",
  "book", "read", "love", "like", "want", "this", "that", "with", "will", "make", "your", "have", "from",
  "they", "what", "when", "then", "just", "very", "into", "more", "most", "some", "much", "many", "each",
  "also", "been", "here", "boy", "girl", "kid", "kids", "fun", "find", "finds", "best", "help", "helps",
  "such", "good", "nice", "sound", "sounds", "great", "glad", "happy", "proud", "hope", "reader", "readers",
  "pick", "next", "time", "today", "enjoy", "yay", "wow", "excited", "know", "sure", "think", "favorite",
])

// Is Buddy's sentence based on the real description? At least half of its bigger words should be
// in the description too (matching the first 4 letters, so "painted" matches "painting").
// If Buddy made things up (like "artists" and "colors" for a book with no art), it isn't.
export function isBasedOn(sentence: string, description: string, enough = 0.5) {
  const stems = (text: string) => (text.toLowerCase().match(/[a-z]{4,}/g) ?? []).map((word) => word.slice(0, 4))
  const describedStems = new Set(stems(description))
  const words = stems(sentence).filter((stem) => ![...everydayWords].some((word) => word.startsWith(stem)))
  if (words.length === 0) return true
  const found = words.filter((stem) => describedStems.has(stem)).length
  return found / words.length >= enough
}

// ---- Picking the one story sentence that says what a book is about ----

// Sentences in Google Books descriptions about awards, editions, and reviews, not the story
const notTheStory =
  /award|winner|medal|bestsell|best-sell|best sell|edition|new york times|#1|praise|acclaim|generation|classic|author|readers|paperback|hardcover|repackag|illustrat|series|called|features|guardian|review|netflix|movie|adapt|foreword|interview/i

// The sentences of a description that tell what happens in the book
export function storySentences(book: Book) {
  return book.description
    .split(/(?<=[.!?]["”’]?)\s+/) // a quote can end a sentence too
    .filter((sentence) => sentence.trim() && !notTheStory.test(sentence))
}

// Words that show a sentence tells the plot (someone wants something, something goes wrong...)
const plotWords =
  /\b(when|but|until|must|find|finds|discover\w*|meet\w*|help\w*|save\w*|steal\w*|missing|lost|determined|search\w*|journey|adventure|secret|myster\w*|magic\w*|friend\w*|rescue\w*)\b/gi

// Long sentences are cut at a comma or dash, so kids get one clear idea
function trimmed(sentence: string) {
  const words = sentence.trim().split(/\s+/)
  if (words.length <= 28) return sentence.trim()
  const cut = words.slice(0, 28).join(" ")
  const lastBreak = Math.max(cut.lastIndexOf(","), cut.lastIndexOf("—"))
  const short = lastBreak > 40 ? cut.slice(0, lastBreak) : cut
  return `${short.replace(/[,;:—\s]+$/, "")}…`
}

// Does a sentence mention a topic? ("a rare musical gift" mentions music)
function mentionsTopicWord(sentence: string, topic: string) {
  const words = topics.find((t) => t.search === topic)?.words ?? [topic]
  const lower = sentence.toLowerCase()
  return [topic, ...words].some((word) => new RegExp(`\\b${word}`).test(lower))
}

// What happens in the book, in one or two story sentences: ones that show why it fits what the kid
// asked for (for "magic music": the music part and the magic part), with characters and a plot.
export function bestStorySentence(book: Book, search?: BookSearch) {
  const asked = [search?.thing, search?.kind].filter(Boolean) as string[]
  const scored = storySentences(book).map((sentence, position) => {
    const wordCount = sentence.split(/\s+/).length
    const covers = asked.filter((topic) => mentionsTopicWord(sentence, topic))
    let score = (sentence.match(plotWords)?.length ?? 0) + 2 * Math.min(namesIn(sentence).length, 2) + 4 * covers.length
    if (wordCount < 6 || wordCount > 45) score -= 5
    if (sentence.trim().endsWith("?")) score -= 4 // "But can they save the day?" is a teaser, not what happens
    if (/^(this|that|it|these|those|they)\b/i.test(sentence.trim())) score -= 3 // needs the sentence before it
    return { sentence, score, covers, position }
  })
  const ranked = [...scored].sort((a, b) => b.score - a.score)
  const best = ranked[0]
  if (!best || best.score <= -5) return null

  // if the best sentence doesn't show every asked-for topic, add the best one that shows the rest
  const missing = asked.filter((topic) => !best.covers.includes(topic))
  const second = ranked.find((s) => s !== best && s.score > -5 && missing.some((topic) => s.covers.includes(topic)))
  const sentences = second ? [best, second].sort((a, b) => a.position - b.position) : [best]
  return sentences.map((s) => trimmed(s.sentence)).join(" ")
}

// Does Buddy's simpler version still say something specific from the story sentence
// (a character's name, or at least two real details)? "Magic is special." doesn't.
export function keepsTheDetails(simpler: string, story: string) {
  const stems = (text: string) =>
    new Set((text.toLowerCase().match(/[a-z]{4,}/g) ?? []).map((w) => w.slice(0, 4)).filter((s) => ![...everydayWords].some((w) => w.startsWith(s))))
  const storyStems = stems(story)
  const shared = [...stems(simpler)].filter((stem) => storyStems.has(stem)).length
  const sharedNames = namesIn(simpler).filter((name) => story.includes(name)).length
  return sharedNames >= 1 || shared >= 2
}
