import { useCallback, useEffect, useMemo, useState } from 'react'
import { latestProgressByArt } from '../../storage/latestProgress'
import { listProgress, purgeLegacyProgress } from '../../storage/repository'
import type { Progress } from '../../types/progress'

/** Progres terbaru user sebagai map artId → Progress; progres lama (tanpa mode) dibersihkan. */
export function useUserProgress(userId: string | undefined) {
  const [items, setItems] = useState<readonly Progress[]>([])
  const [legacyDiscarded, setLegacyDiscarded] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!userId) return
    let active = true
    purgeLegacyProgress(userId)
      .then(async (discarded) => ({ discarded, list: await listProgress(userId) }))
      .then(({ discarded, list }) => {
        if (!active) return
        setItems(list)
        setLegacyDiscarded(discarded)
        setError(null)
      })
      .catch((e: Error) => active && setError(e.message))
    return () => {
      active = false
    }
  }, [userId, attempt])

  const progressByArt = useMemo(() => latestProgressByArt(items), [items])
  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { progressByArt, legacyDiscarded, error, retry }
}
