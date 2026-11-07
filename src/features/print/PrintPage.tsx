import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ID } from '../../i18n/id'
import { PrintSheet } from './PrintSheet'
import { usePrintData } from './usePrintData'

export function PrintPage() {
  const { artId = '' } = useParams()
  const { state, retry } = usePrintData(artId)
  const [includeKey, setIncludeKey] = useState(false)

  if (state.status === 'loading') {
    return (
      <p className="print-message" role="status">
        {ID.print.loading}
      </p>
    )
  }
  if (state.status === 'error') {
    return (
      <section className="print-message">
        <h1>{ID.print.title}</h1>
        <p role="alert">{state.message}</p>
        <button type="button" onClick={retry}>
          {ID.print.retry}
        </button>
      </section>
    )
  }
  if (state.status === 'not-found') {
    return (
      <section className="print-message">
        <h1>{ID.print.notFound}</h1>
        <Link to="/galeri">{ID.print.backToGallery}</Link>
      </section>
    )
  }
  return (
    <div className="print-page">
      <div className="print-controls print-hide">
        <Link to={`/warnai/${state.artwork.id}`}>{ID.editor.title}</Link>
        <label className="print-key-toggle">
          <input
            type="checkbox"
            checked={includeKey}
            onChange={(e) => setIncludeKey(e.target.checked)}
          />
          {ID.print.includeAnswerKey}
        </label>
        <button type="button" onClick={() => window.print()}>
          {ID.print.printButton}
        </button>
      </div>
      <PrintSheet artwork={state.artwork} variant="code" />
      {includeKey && <PrintSheet artwork={state.artwork} variant="key" />}
    </div>
  )
}
