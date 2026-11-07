import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ID } from '../../i18n/id'
import { useSession } from '../../user/useSession'

const REDIRECT_DELAY_MS = 800

export function LoginPage() {
  const navigate = useNavigate()
  const currentUser = useSession((s) => s.currentUser)
  const restored = useSession((s) => s.restored)
  const restoreError = useSession((s) => s.restoreError)
  const restoreSession = useSession((s) => s.restoreSession)
  const login = useSession((s) => s.login)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [welcome, setWelcome] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!restored) void restoreSession()
  }, [restored, restoreSession])

  useEffect(() => {
    if (!welcome) return
    const timer = setTimeout(() => navigate('/galeri'), REDIRECT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [welcome, navigate])

  if (currentUser && !submitting) return <Navigate to="/galeri" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const result = await login(name)
      if (!result.ok) {
        setSubmitting(false)
        return setError(result.error)
      }
      const { displayName } = result.user
      setWelcome(
        result.isReturning ? ID.login.welcomeBack(displayName) : ID.login.welcomeNew(displayName),
      )
    } catch {
      setSubmitting(false)
      setError(ID.login.saveFailed)
    }
  }

  return (
    <section className="page-card">
      <h1>{ID.login.title}</h1>
      <p>{ID.login.storageNote}</p>
      {restoreError && (
        <p role="alert" className="form-error">
          {restoreError}
        </p>
      )}
      {welcome ? (
        <p role="status">{welcome}</p>
      ) : (
        <form className="page-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="login-name">{ID.login.nameLabel}</label>
          <input
            id="login-name"
            type="text"
            autoComplete="nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={error !== ''}
            aria-describedby="login-error"
          />
          <p id="login-error" className="form-error" role="alert" aria-live="polite">
            {error}
          </p>
          <button type="submit">{ID.login.submit}</button>
        </form>
      )}
    </section>
  )
}
