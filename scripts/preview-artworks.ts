/**
 * Halaman kurasi dev: tulis preview/index.html (semua gambar, contoh + garis tepi)
 * dan lembar PNG per kategori. Pakai: `npx tsx scripts/preview-artworks.ts [kategori] [skala]`.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { hexToRgb } from '../src/generator/color.ts'
import { generateAllArtworks } from '../src/generator/index.ts'
import type { Artwork } from '../src/types/artwork.ts'
import { encodePng } from './png.ts'

const PREVIEW_DIR = fileURLToPath(new URL('../preview/', import.meta.url))
const COLUMNS = 6
const GAP = 4
const LINE_COLOR = '#2b2b33'
const SHEET_BACKGROUND = '#808080'
const DEFAULT_SCALE = 3

type Mode = 'reference' | 'combined' | 'outline'

function pixelColor(artwork: Artwork, index: number, mode: Mode): string {
  if (mode === 'reference') return artwork.reference[index]
  if (artwork.outline[index]) return LINE_COLOR
  return mode === 'combined' ? artwork.reference[index] : '#ffffff'
}

function drawTile(
  sheet: Uint8Array,
  sheetWidth: number,
  artwork: Artwork,
  origin: readonly [number, number],
  scale: number,
  mode: Mode,
) {
  for (let index = 0; index < artwork.width * artwork.height; index++) {
    const [r, g, b] = hexToRgb(pixelColor(artwork, index, mode))
    const baseX = origin[0] + (index % artwork.width) * scale
    const baseY = origin[1] + Math.floor(index / artwork.width) * scale
    for (let dy = 0; dy < scale; dy++) {
      for (let dx = 0; dx < scale; dx++) {
        const offset = ((baseY + dy) * sheetWidth + baseX + dx) * 3
        sheet[offset] = r
        sheet[offset + 1] = g
        sheet[offset + 2] = b
      }
    }
  }
}

function writeSheet(artworks: readonly Artwork[], name: string, scale: number, mode: Mode) {
  const tileWidth = artworks[0].width * scale + GAP
  const tileHeight = artworks[0].height * scale + GAP
  const rows = Math.ceil(artworks.length / COLUMNS)
  const width = tileWidth * Math.min(COLUMNS, artworks.length) + GAP
  const height = tileHeight * rows + GAP
  const sheet = new Uint8Array(width * height * 3)
  const [r, g, b] = hexToRgb(SHEET_BACKGROUND)
  for (let offset = 0; offset < sheet.length; offset += 3) sheet.set([r, g, b], offset)
  artworks.forEach((artwork, index) => {
    const origin = [
      GAP + (index % COLUMNS) * tileWidth,
      GAP + Math.floor(index / COLUMNS) * tileHeight,
    ] as const
    drawTile(sheet, width, artwork, origin, scale, mode)
  })
  writeFileSync(`${PREVIEW_DIR}${name}-${mode}.png`, encodePng(width, height, sheet))
}

function htmlPage(artworks: readonly Artwork[]): string {
  const data = JSON.stringify(artworks)
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Kurasi Gambar</title>
<style>body{font-family:sans-serif;background:#eee;margin:16px}.grid{display:flex;flex-wrap:wrap;gap:12px}
figure{background:#fff;padding:8px;margin:0;border-radius:8px}canvas{image-rendering:pixelated;width:192px;margin:2px}
figcaption{font-size:12px}</style></head><body><h1>Kurasi ${artworks.length} gambar</h1><div class="grid" id="grid"></div>
<script>const artworks=${data};const grid=document.getElementById('grid');
function draw(a,outlineOnly){const c=document.createElement('canvas');c.width=a.width;c.height=a.height;const x=c.getContext('2d');
a.reference.forEach((col,i)=>{x.fillStyle=outlineOnly?(a.outline[i]?'${LINE_COLOR}':'#fff'):col;x.fillRect(i%a.width,Math.floor(i/a.width),1,1)});return c}
for(const a of artworks){const f=document.createElement('figure');f.append(draw(a,false),draw(a,true));
const cap=document.createElement('figcaption');cap.textContent=a.id+' — '+a.title+' ('+a.suggestedPalette.length+' warna)';f.append(cap);grid.append(f)}
</script></body></html>`
}

function main() {
  const [category, scaleArg] = process.argv.slice(2)
  const scale = Number(scaleArg ?? DEFAULT_SCALE)
  const artworks = generateAllArtworks()
  mkdirSync(PREVIEW_DIR, { recursive: true })
  writeFileSync(`${PREVIEW_DIR}index.html`, htmlPage(artworks))
  const categories = category ? [category] : ['scenery', 'animal', 'food']
  for (const name of categories) {
    const subset = artworks.filter(
      (artwork) => artwork.category === name || artwork.id.startsWith(name),
    )
    if (subset.length === 0) continue
    writeSheet(subset, name, scale, 'combined')
    writeSheet(subset, name, scale, 'outline')
  }
  process.stdout.write(`Pratinjau ${artworks.length} gambar ditulis ke ${PREVIEW_DIR}\n`)
}

main()
