import { Link } from 'react-router-dom'
import { ID } from '../../i18n/id'
import type { ColoringMode } from '../../types/progress'
import { galleryPathWithQuery } from '../gallery/galleryPath'
import { ModeSwitch } from './ModeSwitch'
import { SaveIndicator } from './SaveIndicator'
import type { SaveStatus } from './useAutoSave'

type Props = {
  title: string
  mode: ColoringMode
  percent: number
  isCompleted: boolean
  saveStatus: SaveStatus
  onSaveRetry: () => void
  onModeChange: (mode: ColoringMode) => void
}

export function EditorHeader(props: Props) {
  return (
    <header className="editor-header">
      <Link to={galleryPathWithQuery()} className="editor-back">
        {ID.editor.backToGallery}
      </Link>
      <h1 id="editor-title" className="editor-title">
        {props.title}
      </h1>
      <ModeSwitch mode={props.mode} onChange={props.onModeChange} />
      <p className="editor-status">
        <span className="editor-percent">{ID.editor.progress(props.percent)}</span>
        {props.isCompleted && <span className="editor-badge">{ID.editor.completedBadge}</span>}
        <SaveIndicator status={props.saveStatus} onRetry={props.onSaveRetry} />
      </p>
    </header>
  )
}
