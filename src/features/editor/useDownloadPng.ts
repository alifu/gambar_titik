import { useState } from 'react'
import type { PixelColors } from '../../editor/tools'
import { ID } from '../../i18n/id'
import type { Artwork } from '../../types/artwork'
import type { ColoringMode } from '../../types/progress'
import { downloadPng } from './downloadPng'
import { errorMessage } from './useEditorData'

/** Unduh PNG hasil mewarnai; `error` berisi pesan jika gagal. */
export function useDownloadPng(artwork: Artwork, colors: PixelColors, mode: ColoringMode) {
  const [error, setError] = useState<string | null>(null)
  const download = async () => {
    setError(null)
    try {
      await downloadPng(artwork, colors, mode)
    } catch (e) {
      setError(errorMessage(e, ID.editor.downloadFailed))
    }
  }
  return { download, error }
}
