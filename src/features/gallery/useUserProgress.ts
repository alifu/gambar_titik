import { useCallback, useEffect, useMemo, useState } from 'react'
import { listProgress } from '../../storage/repository'
import type { Progress } from '../../types/progress'

/** Progres user sebagai map artId → Progress. */
export function useUserProgress(userId: string | undefined) {
  const [items, setItems] = useState<readonly Progress[]>([])
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!userId) return
    let active = true
    listProgress(userId)
      .then((list) => {
        if (!active) return
        setItems(list)
        setError(null)
      })
      .catch((e: Error) => active && setError(e.message))
    return () => {
      active = false
    }
  }, [userId, attempt])

  const progressByArt = useMemo(() => new Map(items.map((p) => [p.artId, p])), [items])
  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { progressByArt, error, retry }
}
