/**
 * Pratinjau kurasi dev:
 * - `preview/<kategori>-color.png`: semua gambar satu kategori, berwarna (kunci jawaban).
 * - `preview/<kategori>-coded.png`: semua gambar satu kategori, gaya lembar ber-kode (garis grid + kode).
 * - `preview/sheets/<id>.png`: lembar ber-kode satu gambar, lengkap dengan legenda.
 * Pakai: `npx tsx scripts/preview-artworks.ts [kategori-atau-awalan-id] [skala]`.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { hexToRgb } from '../src/generator/color.ts'
import { generateAllArtworks } from '../src/generator/index.ts'
import { BACKGROUND, BACKGROUND_SYMBOL, type Artwork } from '../src/types/artwork.ts'
import { GLYPH_HEIGHT, GLYPH_WIDTH, glyphPixels } from './font.ts'
import { encodePng } from './png.ts'

const PREVIEW_DIR = fileURLToPath(new URL('../preview/', import.meta.url))
const COLUMNS = 6
const GAP = 6
const LABEL_HEIGHT = 12
const SHEET_BACKGROUND = '#9a9a9a'
const PAPER = '#ffffff'
const GRID_LINE = '#c8c8c8'
const CODE_INK = '#555555'
const DEFAULT_SCALE = 4
const CODED_CELL = 12
const SHEET_CELL = 16
const SHEET_MARGIN = 16
const LEGEND_ROW = 22
const LEGEND_COLUMNS = 3

interface Canvas {
  readonly width: number
  readonly height: number
  readonly data: Uint8Array
}

function createCanvas(width: number, height: number, color: string): Canvas {
  const canvas = { width, height, data: new Uint8Array(width * height * 3) }
  fillRect(canvas, 0, 0, width, height, color)
  return canvas
}

function fillRect(canvas: Canvas, x: number, y: number, w: number, h: number, color: string) {
  const rgb = hexToRgb(color)
  for (let py = Math.max(0, y); py < Math.min(canvas.height, y + h); py++) {
    for (let px = Math.max(0, x); px < Math.min(canvas.width, x + w); px++) {
      canvas.data.set(rgb, (py * canvas.width + px) * 3)
    }
  }
}

function drawText(
  canvas: Canvas,
  text: string,
  x: number,
  y: number,
  scale: number,
  color: string,
) {
  ;[...text].forEach((char, index) => {
    const left = x + index * (GLYPH_WIDTH + 1) * scale
    glyphPixels(char).forEach(([dx, dy]) =>
      fillRect(canvas, left + dx * scale, y + dy * scale, scale, scale, color),
    )
  })
}

function textWidth(text: string, scale: number): number {
  return text.length * (GLYPH_WIDTH + 1) * scale - scale
}

/** Isi satu kotak gaya lembar ber-kode: kertas putih, garis grid, kode / titik di tengah. */
function drawCodedCell(
  canvas: Canvas,
  artwork: Artwork,
  index: number,
  x: number,
  y: number,
  cell: number,
) {
  fillRect(canvas, x, y, cell, cell, GRID_LINE)
  fillRect(canvas, x + 1, y + 1, cell - 1, cell - 1, PAPER)
  const value = artwork.pixels[index]
  const char = value === BACKGROUND ? BACKGROUND_SYMBOL : artwork.palette[value].code
  const scale = Math.max(1, Math.floor((cell - 2) / (GLYPH_HEIGHT + 2)))
  const left = x + Math.floor((cell - GLYPH_WIDTH * scale) / 2) + 1
  const top = y + Math.floor((cell - GLYPH_HEIGHT * scale) / 2) + 1
  drawText(canvas, char, left, top, scale, CODE_INK)
}

type Style = 'color' | 'coded'

function drawArtwork(
  canvas: Canvas,
  artwork: Artwork,
  x: number,
  y: number,
  cell: number,
  style: Style,
) {
  artwork.pixels.forEach((value, index) => {
    const cx = x + (index % artwork.width) * cell
    const cy = y + Math.floor(index / artwork.width) * cell
    if (style === 'coded') {
      drawCodedCell(canvas, artwork, index, cx, cy, cell)
      return
    }
    fillRect(canvas, cx, cy, cell, cell, value === BACKGROUND ? PAPER : artwork.palette[value].hex)
  })
}

function shortId(artwork: Artwork): string {
  return artwork.id.replace(/^(scenery|animal|food)-/, '')
}

function writeCategorySheet(
  artworks: readonly Artwork[],
  name: string,
  cell: number,
  style: Style,
) {
  const tileWidth = artworks[0].width * cell + GAP
  const tileHeight = artworks[0].height * cell + GAP + LABEL_HEIGHT
  const rows = Math.ceil(artworks.length / COLUMNS)
  const canvas = createCanvas(
    tileWidth * Math.min(COLUMNS, artworks.length) + GAP,
    tileHeight * rows + GAP,
    SHEET_BACKGROUND,
  )
  artworks.forEach((artwork, index) => {
    const x = GAP + (index % COLUMNS) * tileWidth
    const y = GAP + Math.floor(index / COLUMNS) * tileHeight
    drawText(canvas, `${shortId(artwork)} ${artwork.palette.length}W`, x, y, 2, '#000000')
    drawArtwork(canvas, artwork, x, y + LABEL_HEIGHT, cell, style)
  })
  writeFileSync(
    `${PREVIEW_DIR}${name}-${style}.png`,
    encodePng(canvas.width, canvas.height, canvas.data),
  )
}

function drawLegend(canvas: Canvas, artwork: Artwork, top: number) {
  const columnWidth = Math.floor((canvas.width - 2 * SHEET_MARGIN) / LEGEND_COLUMNS)
  artwork.palette.forEach((entry, index) => {
    const x = SHEET_MARGIN + (index % LEGEND_COLUMNS) * columnWidth
    const y = top + Math.floor(index / LEGEND_COLUMNS) * LEGEND_ROW
    fillRect(canvas, x, y, 30, 16, '#000000')
    fillRect(canvas, x + 1, y + 1, 28, 14, entry.hex)
    drawText(canvas, entry.code, x + 36, y + 3, 2, '#000000')
    drawText(canvas, entry.name, x + 50, y + 3, 2, '#000000')
  })
}

function writeArtworkSheet(artwork: Artwork) {
  const gridWidth = artwork.width * SHEET_CELL + 1
  const legendRows = Math.ceil(artwork.palette.length / LEGEND_COLUMNS)
  const canvas = createCanvas(
    gridWidth + 2 * SHEET_MARGIN,
    artwork.height * SHEET_CELL + 3 * SHEET_MARGIN + 20 + legendRows * LEGEND_ROW,
    PAPER,
  )
  drawText(canvas, artwork.title, SHEET_MARGIN, SHEET_MARGIN, 3, '#000000')
  const label = `${artwork.palette.length} WARNA`
  drawText(
    canvas,
    label,
    canvas.width - SHEET_MARGIN - textWidth(label, 2),
    SHEET_MARGIN + 2,
    2,
    '#000000',
  )
  const gridTop = SHEET_MARGIN + 24
  drawArtwork(canvas, artwork, SHEET_MARGIN, gridTop, SHEET_CELL, 'coded')
  fillRect(canvas, SHEET_MARGIN, gridTop + artwork.height * SHEET_CELL, gridWidth, 1, GRID_LINE)
  fillRect(
    canvas,
    SHEET_MARGIN + artwork.width * SHEET_CELL,
    gridTop,
    1,
    artwork.height * SHEET_CELL,
    GRID_LINE,
  )
  drawLegend(canvas, artwork, gridTop + artwork.height * SHEET_CELL + SHEET_MARGIN)
  writeFileSync(
    `${PREVIEW_DIR}sheets/${artwork.id}.png`,
    encodePng(canvas.width, canvas.height, canvas.data),
  )
}

function main() {
  const [filter, scaleArg] = process.argv.slice(2)
  const scale = Number(scaleArg ?? DEFAULT_SCALE)
  const artworks = generateAllArtworks()
  mkdirSync(`${PREVIEW_DIR}sheets`, { recursive: true })
  const groups = filter ? [filter] : ['scenery', 'animal', 'food']
  for (const name of groups) {
    const subset = artworks.filter(
      (artwork) => artwork.category === name || artwork.id.startsWith(name),
    )
    if (subset.length === 0) continue
    writeCategorySheet(subset, name, scale, 'color')
    writeCategorySheet(subset, name, CODED_CELL, 'coded')
    subset.forEach(writeArtworkSheet)
  }
  process.stdout.write(`Pratinjau ${artworks.length} gambar ditulis ke ${PREVIEW_DIR}\n`)
}

main()
