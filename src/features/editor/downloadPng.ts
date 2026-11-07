import { ID } from '../../i18n/id'
import { resolveAllPixelColors } from '../../render/pixelColors'
import type { PixelColors } from '../../editor/tools'
import type { Artwork } from '../../types/artwork'

/** Setiap pixel gambar menjadi PNG_SCALE × PNG_SCALE pixel agar tidak buram. */
export const PNG_SCALE = 8
const FALLBACK_FILE_NAME = 'gambar'

/** "Kucing Oranye!" → "kucing-oranye.png" */
export function pngFileName(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || FALLBACK_FILE_NAME}.png`
}

/** Render warna user (outline ikut, pixel kosong putih) ke PNG yang diperbesar. */
export function renderPng(artwork: Artwork, colors: PixelColors, scale = PNG_SCALE): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = artwork.width * scale
  canvas.height = artwork.height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error(ID.editor.downloadFailed))
  resolveAllPixelColors(artwork, colors, 'user').forEach((color, i) => {
    ctx.fillStyle = color
    ctx.fillRect((i % artwork.width) * scale, Math.floor(i / artwork.width) * scale, scale, scale)
  })
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error(ID.editor.downloadFailed))
    }, 'image/png')
  })
}

export async function downloadPng(artwork: Artwork, colors: PixelColors): Promise<void> {
  const blob = await renderPng(artwork, colors)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = pngFileName(artwork.title)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
