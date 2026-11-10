import { useEffect, useState } from "react"
import { loadBuddy, onBuddyLoadProgress } from "../ai/buddyEngine"
import { BUDDY_MODEL } from "../ai/buddyModel"

// loading = Buddy's AI is waking up (kids can already chat: the simple chat answers meanwhile),
// ready = the AI chat, simple = the chat without AI for good
// (for devices that can't run it: older Chromebooks and tablets, Safari, Firefox, or if the AI breaks)
export type BuddyStatus = "loading" | "ready" | "simple"

// Can this device run Buddy's AI? It needs WebGPU. Add ?simple to the address to try the
// simple chat on any device (for testing).
function canRunAI() {
  if (new URLSearchParams(window.location.search).has("simple")) return false
  return "gpu" in navigator
}

// Starts waking Buddy up as soon as the chat opens, and reports how far along it is
export function useBuddyLoader() {
  const [status, setStatus] = useState<BuddyStatus>(() => (canRunAI() ? "loading" : "simple"))
  const [progress, setProgress] = useState(0) // 0 to 1
  const [firstTime, setFirstTime] = useState(false) // true if the model has to be downloaded

  useEffect(() => {
    if (!canRunAI()) return // no download at all: go straight to the simple chat
    let ignore = false // if the screen closes before Buddy is ready, don't update it

    // Already downloaded before? Then it's just a few seconds of waking up.
    import("@mlc-ai/web-llm")
      .then(({ hasModelInCache }) => hasModelInCache(BUDDY_MODEL))
      .then((cached) => {
        if (!ignore) setFirstTime(!cached)
      })
      .catch(() => {})

    const stopListening = onBuddyLoadProgress((report) => {
      if (!ignore) setProgress(report.progress)
    })

    loadBuddy()
      .then(() => {
        if (!ignore) setStatus("ready")
      })
      .catch((error) => {
        // WebGPU is there but the AI still couldn't start (not enough memory, an old graphics chip...)
        console.error("Buddy couldn't load, using the simple chat:", error)
        if (!ignore) setStatus("simple")
      })

    return () => {
      ignore = true
      stopListening()
    }
  }, [])

  // the AI broke in the middle of a chat (out of memory, the tab went to sleep...): use the simple chat from now on
  function switchToSimple() {
    setStatus("simple")
  }

  return { status, progress, firstTime, switchToSimple }
}
