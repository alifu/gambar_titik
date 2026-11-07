import { useEffect, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ID } from '../../i18n/id'
import {
  applyImport,
  buildExportFile,
  downloadExportFile,
  parseImportFile,
  type ImportSuccess,
  type MergeMode,
  type PixelCountLookup,
} from '../../storage/exportImport'
import { listProgress } from '../../storage/repository'
import type { Progress } from '../../types/progress'
import { useSession } from '../../user/useSession'

interface ProfilePageProps {
  /** undefined = data gambar belum siap; pemulihan cadangan dinonaktifkan. */
  readonly getPixelCount?: PixelCountLookup
  /** Pesan galat pemuatan data gambar, jika ada. */
  readonly lookupError?: string | null
}

export function ProfilePage({ getPixelCount, lookupError }: ProfilePageProps) {
  const navigate = useNavigate()
  const user = useSession((s) => s.currentUser)
  const logout = useSession((s) => s.logout)
  const [progress, setProgress] = useState<readonly Progress[]>([])
  const [pending, setPending] = useState<ImportSuccess | null>(null)
  const [messages, setMessages] = useState<readonly string[]>([])
  const [errors, setErrors] = useState<readonly string[]>([])
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    let active = true
    listProgress(userId)
      .then((items) => active && setProgress(items))
      .catch((e: Error) => active && setErrors([e.message]))
    return () => {
      active = false
    }
  }, [userId])

  if (!user) return null

  async function handleBackup() {
    if (!user) return
    try {
      downloadExportFile(buildExportFile(user, await listProgress(user.id)))
    } catch (e) {
      setErrors([(e as Error).message])
    }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    setMessages([])
    setErrors([])
    if (!file || !getPixelCount) return
    const result = parseImportFile(await file.text(), getPixelCount)
    if (!result.ok) return setErrors([ID.profile.importFailed, ...result.errors])
    setPending(result)
  }

  async function handleMode(mode: MergeMode) {
    if (!user || !pending) return
    const warnings = [...pending.warnings]
    if (pending.file.user.id !== user.id) {
      warnings.unshift(ID.profile.differentName(pending.file.user.displayName, user.displayName))
    }
    try {
      const result = await applyImport(user.id, pending.file.progress, mode)
      setProgress(result)
      setMessages([ID.profile.importDone(pending.file.progress.length), ...warnings])
    } catch (e) {
      setErrors([(e as Error).message])
    }
    setPending(null)
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <section className="page-card profile">
      <h1>{ID.profile.title}</h1>
      <p className="profile-name">{user.displayName}</p>
      <p>
        {ID.profile.artworksStarted}: {progress.length}
      </p>
      <p>
        {ID.profile.artworksCompleted}: {progress.filter((p) => p.completed).length}
      </p>
      <button type="button" className="profile-button" onClick={handleBackup}>
        {ID.profile.backup}
      </button>
      <label className="profile-restore">
        <span>{ID.profile.restore}</span>
        <input
          type="file"
          accept=".json,application/json"
          onChange={handleFile}
          disabled={!getPixelCount}
        />
      </label>
      {!getPixelCount && <p>{lookupError ?? ID.profile.importLoading}</p>}
      {pending && (
        <div role="dialog" aria-label={ID.profile.chooseModeTitle}>
          <p>{ID.profile.chooseModeTitle}</p>
          <p>{ID.profile.mergeHint}</p>
          <p>{ID.profile.replaceHint}</p>
          <button type="button" onClick={() => handleMode('merge')}>
            {ID.profile.merge}
          </button>
          <button type="button" onClick={() => handleMode('replace')}>
            {ID.profile.replace}
          </button>
          <button type="button" onClick={() => setPending(null)}>
            {ID.profile.cancel}
          </button>
        </div>
      )}
      <div role="status" className="profile-messages">
        {messages.map((m) => (
          <p key={m}>{m}</p>
        ))}
      </div>
      <div role="alert" className="form-error">
        {errors.map((m) => (
          <p key={m}>{m}</p>
        ))}
      </div>
      <button
        type="button"
        className="profile-button editor-button-secondary"
        onClick={handleLogout}
      >
        {ID.profile.switchUser}
      </button>
    </section>
  )
}
