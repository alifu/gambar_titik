/// <reference lib="dom" />
import { readFileSync } from 'node:fs'
import { expect, type Page } from '@playwright/test'
import { decodeArtworks } from '../../src/data/decode.ts'
import type { Artwork } from '../../src/types/artwork.ts'

const BACKGROUND_INDEX = -1

export interface Region {
  readonly code: string
  readonly paletteIndex: number
  /** Indeks kotak pertama region (4-arah terhubung, kode sama). */
  readonly start: number
}

export function loadArtworksFromDisk(): readonly Artwork[] {
  const raw = readFileSync('public/data/artworks.json', 'utf8')
  return decodeArtworks(JSON.parse(raw))
}

/** Semua region kode (komponen 4-arah) sebuah gambar. */
export function regionsOf(artwork: Artwork): readonly Region[] {
  const { width, height, pixels, palette } = artwork
  const seen = new Set<number>()
  const regions: Region[] = []
  pixels.forEach((value, start) => {
    if (value === BACKGROUND_INDEX || seen.has(start)) return
    const queue = [start]
    seen.add(start)
    for (let head = 0; head < queue.length; head++) {
      const i = queue[head]
      const x = i % width
      const around = [
        x > 0 ? i - 1 : -1,
        x < width - 1 ? i + 1 : -1,
        i >= width ? i - width : -1,
        i < width * (height - 1) ? i + width : -1,
      ]
      for (const n of around) {
        if (n >= 0 && pixels[n] === value && !seen.has(n)) {
          seen.add(n)
          queue.push(n)
        }
      }
    }
    regions.push({ code: palette[value].code, paletteIndex: value, start })
  })
  return regions
}

/** Gambar dengan region paling sedikit, agar E2E "selesaikan gambar" cepat. */
export function simplestArtwork(artworks: readonly Artwork[]): Artwork {
  return artworks.reduce((best, art) =>
    regionsOf(art).length < regionsOf(best).length ? art : best,
  )
}

export function legendButton(page: Page, code: string) {
  return page.getByRole('button', { name: new RegExp(`^Kode ${code},`) })
}

/** Klik tengah kotak `index` pada kanvas. */
export async function clickCell(page: Page, artwork: Artwork, index: number): Promise<void> {
  const canvas = page.getByRole('img', { name: /Kanvas mewarnai/ })
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Kanvas tidak punya ukuran')
  const x = box.x + ((index % artwork.width) + 0.5) * (box.width / artwork.width)
  const y = box.y + (Math.floor(index / artwork.width) + 0.5) * (box.height / artwork.height)
  await page.mouse.click(x, y)
}

/** Cari gambar lewat kotak pencarian galeri lalu buka dari pilihan mode di kartunya. */
export async function openFromCard(page: Page, title: string, mode: string): Promise<void> {
  await page.getByLabel('Cari judul gambar').fill(title)
  await page.getByRole('link', { name: `Warnai ${title}: ${mode}`, exact: true }).click()
  await expect(page.getByRole('group', { name: 'Cara mewarnai', exact: true })).toBeVisible()
}

/** Isi area untuk satu region kode (alat Isi area harus sudah aktif). */
export async function fillRegion(page: Page, artwork: Artwork, region: Region): Promise<void> {
  await legendButton(page, region.code).click()
  await clickCell(page, artwork, region.start)
}
