import { useCallback, useEffect, useState } from "react"
import { BookApiService } from "../api/BookApiService"
import type { Recommendation } from "../types"

export function useRecommendations(studentId: string) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecommendations = useCallback(async () => {
    try {
      setRecommendations(await BookApiService.getRecommendations(studentId))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  // load once when the screen first shows up
  useEffect(() => {
    let ignore = false // if the screen closes before the data arrives, don't use it
    BookApiService.getRecommendations(studentId)
      .then((result) => {
        if (!ignore) setRecommendations(result)
      })
      .catch((e: Error) => {
        if (!ignore) setError(e.message)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [studentId])

  return { recommendations, loading, error, loadRecommendations }
}
