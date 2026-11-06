import { useEffect, useState } from "react"
import { loadBuddy, onBuddyLoadProgress } from "../ai/buddyEngine"
import { BUDDY_MODEL } from "../ai/buddyModel"

export type BuddyStatus = "loading" | "ready" | "error"

// Starts waking Buddy up as soon as the chat opens, and reports how far along it is
export function useBuddyLoader() {
  const [status, setStatus] = useState<BuddyStatus>("loading")
  const [progress, setProgress] = useState(0) // 0 to 1
  const [firstTime, setFirstTime] = useState(false) // true if the model has to be downloaded

  useEffect(() => {
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
        console.error("Buddy couldn't load:", error)
        if (!ignore) setStatus("error")
      })

    return () => {
      ignore = true
      stopListening()
    }
  }, [])

  return { status, progress, firstTime }
}
