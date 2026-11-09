// Buddy's AI brain, running in the browser with WebLLM (https://webllm.mlc.ai/).
// Nothing here talks to our backend: the model runs on the kid's own device.
import type { ChatCompletionMessageParam, InitProgressReport, WebWorkerMLCEngine } from "@mlc-ai/web-llm"
import type { Student } from "../context/StudentContext"
import type { ChatMessage } from "../types"
import { buddyInstructions, type BuddyContext } from "./buddyInstructions"
import { BUDDY_MODEL } from "./buddyModel"

// How many earlier messages Buddy remembers. Small models copy their own earlier
// replies, so remembering less keeps Buddy from repeating itself (and is faster).
const HISTORY_LENGTH = 6

let enginePromise: Promise<WebWorkerMLCEngine> | null = null
const progressListeners = new Set<(report: InitProgressReport) => void>()

// Start loading the model (downloads it the first time, then it's cached by the browser).
// Safe to call more than once: it only loads one time.
export function loadBuddy() {
  if (!enginePromise) {
    const worker = new Worker(new URL("./buddyWorker.ts", import.meta.url), { type: "module" })
    // WebLLM is big, so it's only downloaded when the chat is opened, not on every page
    enginePromise = import("@mlc-ai/web-llm")
      .then(({ CreateWebWorkerMLCEngine }) =>
        CreateWebWorkerMLCEngine(worker, BUDDY_MODEL, {
          initProgressCallback: (report) => progressListeners.forEach((listener) => listener(report)),
        }),
      )
      .catch((error) => {
        enginePromise = null // let the next try start over
        worker.terminate()
        throw error
      })
  }
  return enginePromise
}

// Get told how far along loading is (used by the "Buddy is waking up…" screen)
export function onBuddyLoadProgress(listener: (report: InitProgressReport) => void) {
  progressListeners.add(listener)
  return () => {
    progressListeners.delete(listener)
  }
}

// Ask Buddy for a reply. onText is called with the reply so far, as each word arrives.
export async function askBuddy(
  student: Student,
  context: BuddyContext,
  history: ChatMessage[],
  onText: (textSoFar: string) => void,
) {
  const engine = await loadBuddy()

  // skip the greeting at the top of the chat: the AI copies it if it sees it
  const firstStudentMessage = history.findIndex((message) => message.from === "student")
  const recent = history.slice(Math.max(firstStudentMessage, history.length - HISTORY_LENGTH))

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: buddyInstructions(student, context) },
    ...recent.map((message): ChatCompletionMessageParam =>
      message.from === "student"
        ? { role: "user", content: message.text }
        : { role: "assistant", content: message.text },
    ),
  ]

  const stream = await engine.chat.completions.create({
    messages,
    stream: true,
    temperature: 0.7,
    frequency_penalty: 0.5, // fewer repeated words within a reply
    presence_penalty: 0.3,
    max_tokens: 150, // keeps replies short
    stop: [`\n${student.name}:`, `${student.name}:`, "\nBookBuddy:"], // stop if Buddy starts writing the kid's side
  })

  let reply = ""
  for await (const chunk of stream) {
    reply += chunk.choices[0]?.delta.content ?? ""
    onText(withoutLabel(reply))
  }
  return withoutLabel(reply).trim()
}

// Small models sometimes start with "BookBuddy:" like a script. Kids shouldn't see that.
function withoutLabel(reply: string) {
  return reply.replace(/^\s*(?:BookBuddy|Buddy)\s*:\s*/i, "")
}

// Ask Buddy to explain a word for a kid, using the real dictionary meanings (so it can't make one up)
export async function defineWithBuddy(student: Student, word: string, sentence: string, meanings: string[]) {
  const engine = await loadBuddy()

  const response = await engine.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You explain words to a ${student.age}-year-old kid. Here is what the dictionary says "${word}" means:
${meanings.map((meaning, i) => `${i + 1}. ${meaning}`).join("\n")}
Pick the meaning that fits the sentence. Explain it in one short sentence of no more than 12 words, using easy words a first grader knows. Only use the dictionary meaning. Do not add anything else. Do not use the word "${word}" itself.`,
      },
      { role: "user", content: `What does "${word}" mean in this sentence: "${sentence}"` },
    ],
    temperature: 0.2,
    max_tokens: 60,
  })

  return response.choices[0]?.message.content?.trim() ?? ""
}

// Long, everyday words that aren't worth underlining
const commonWords = new Set([
  "anything", "everyone", "everything", "something", "sometimes", "somebody", "anybody",
  "together", "favorite", "favourite", "question", "questions", "probably", "actually",
  "remember", "whatever", "different", "interesting", "wonderful", "awesome", "yourself",
  "stories", "animals", "talking", "reading", "because", "another", "nothing", "someone",
  "children", "friends", "friendship", "characters", "character", "beautiful", "everybody",
  "tomorrow", "yesterday", "birthday", "suggest", "recommend", "absolutely", "definitely",
])

// Pick up to 2 bigger words from Buddy's reply for kids to tap and learn
export function pickVocabularyWords(reply: string) {
  const words: string[] = []
  for (const raw of reply.split(/\s+/)) {
    const letters = raw.replace(/^[^A-Za-z]+/, "") // ignore quotes and brackets in front
    if (/^[A-Z]/.test(letters)) continue // skip names and book titles
    const word = letters.toLowerCase().replace(/[^a-z]/g, "")
    if (word.length >= 8 && !commonWords.has(word) && !words.includes(word)) words.push(word)
    if (words.length === 2) break
  }
  return words
}
