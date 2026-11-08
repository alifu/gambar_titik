import { Link, useParams, useSearchParams } from 'react-router-dom'
import { MODE_PARAM, parseModeParam } from '../../editor/modeParam'
import { ID } from '../../i18n/id'
import type { ColoringMode } from '../../types/progress'
import { useSession } from '../../user/useSession'
import { EditorWorkspace } from './EditorWorkspace'
import { useEditorData } from './useEditorData'

export function EditorPage() {
  const { artId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const requestedMode = parseModeParam(searchParams.get(MODE_PARAM))
  const userId = useSession((s) => s.currentUser?.id)
  if (!userId) return null
  return (
    <EditorLoader
      key={`${userId}:${artId}:${requestedMode ?? ''}`}
      artId={artId}
      userId={userId}
      requestedMode={requestedMode}
    />
  )
}

type LoaderProps = {
  artId: string
  userId: string
  /** Mode dari URL; null = mode terakhir gambar itu (atau bawaan). */
  requestedMode: ColoringMode | null
}

function EditorLoader({ artId, userId, requestedMode }: LoaderProps) {
  const { state, retry } = useEditorData(artId, userId, requestedMode)

  if (state.status === 'loading') {
    return (
      <p className="editor-message" role="status">
        {ID.editor.loading}
      </p>
    )
  }
  if (state.status === 'error') {
    return (
      <section className="editor-message">
        <h1>{ID.editor.title}</h1>
        <p role="alert">{state.message}</p>
        <button type="button" onClick={retry}>
          {ID.editor.retry}
        </button>
      </section>
    )
  }
  if (state.status === 'not-found') {
    return (
      <section className="editor-message">
        <h1>{ID.editor.notFound}</h1>
        <Link to="/galeri">{ID.editor.backToGallery}</Link>
      </section>
    )
  }
  return (
    <EditorWorkspace
      artwork={state.artwork}
      mode={state.mode}
      progress={state.progress}
      userId={userId}
    />
  )
}
