import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { encodeArtworks } from '../src/data/codec.ts'
import { generateAllArtworks } from '../src/generator/index.ts'

const ARTWORKS_PATH = fileURLToPath(new URL('../public/data/artworks.json', import.meta.url))
const BYTES_PER_KB = 1024

const artworks = generateAllArtworks()
const json = JSON.stringify(encodeArtworks(artworks))
mkdirSync(dirname(ARTWORKS_PATH), { recursive: true })
writeFileSync(ARTWORKS_PATH, `${json}\n`)

const counts = artworks.reduce<Record<string, number>>(
  (total, artwork) => ({ ...total, [artwork.category]: (total[artwork.category] ?? 0) + 1 }),
  {},
)
process.stdout.write(
  `${artworks.length} gambar (${JSON.stringify(counts)}) → public/data/artworks.json ` +
    `(${(Buffer.byteLength(json) / BYTES_PER_KB).toFixed(1)} KB)\n`,
)
