import { useCallback, useEffect, useState } from "react"
import { ProgressApiService } from "../api/ProgressApiService"
import type { ProgressResponse } from "../types"

export function useReadingProgress(studentId: string) {
  const [progress, setProgress] = useState<ProgressResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadProgress = useCallback(async () => {
    try {
      setProgress(await ProgressApiService.getProgress(studentId))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [studentId])

  async function logReading(minutes: number) {
    try {
      await ProgressApiService.createReadingLog(studentId, minutes)
      await loadProgress() // get the new total and any new badges
    } catch (e) {
      setError((e as Error).message)
    }
  }

  // load once when the screen first shows up
  useEffect(() => {
    let ignore = false // if the screen closes before the data arrives, don't use it
    ProgressApiService.getProgress(studentId)
      .then((result) => {
        if (!ignore) setProgress(result)
      })
      .catch((e: Error) => {
        if (!ignore) setError(e.message)
      })
    return () => {
      ignore = true
    }
  }, [studentId])

  return { progress, error, logReading, loadProgress }
}
