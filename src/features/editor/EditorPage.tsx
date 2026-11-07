import { Link, useParams } from 'react-router-dom'
import { ID } from '../../i18n/id'
import { useSession } from '../../user/useSession'
import { EditorWorkspace } from './EditorWorkspace'
import { useEditorData } from './useEditorData'

export function EditorPage() {
  const { artId = '' } = useParams()
  const userId = useSession((s) => s.currentUser?.id)
  if (!userId) return null
  return <EditorLoader key={`${userId}:${artId}`} artId={artId} userId={userId} />
}

type LoaderProps = {
  artId: string
  userId: string
}

function EditorLoader({ artId, userId }: LoaderProps) {
  const { state, retry } = useEditorData(artId, userId)

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
  return <EditorWorkspace artwork={state.artwork} progress={state.progress} userId={userId} />
}
