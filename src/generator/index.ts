import type { Artwork, Category } from '../types/artwork.ts'
import { animalSubjects } from './animals.ts'
import { createArtwork, type ArtworkOptions } from './artwork.ts'
import type { Subject } from './design.ts'
import { coverDesign, fitSubject } from './fit.ts'
import { EDGE_CONTRAST } from './outline.ts'
import { MAX_PALETTE_SIZE } from './quantize.ts'
import { foodSubjects } from './food.ts'
import { createRng, deriveSeed } from './random.ts'
import { render, type Layer, type View } from './raster.ts'
import { scenerySubjects } from './scenery.ts'
import { HEIGHT as SCENE_HEIGHT, WIDTH as SCENE_WIDTH } from './scenery/moods.ts'

export const DEFAULT_SEED = 20261107
/** Sampel per sisi kotak saat merender desain ke grid kecil. */
const SAMPLES = 4
/** Sisa kotak latar di tiap sisi subjek hewan & makanan (termasuk garis tepi luar). */
const SUBJECT_MARGIN = 2
/** Skala horizontal pemandangan (desain 96 lebar → 48 kotak, sedikit dipotong di tepi). */
const SCENE_SCALE_X = 1.8
/** Pemandangan memakai garis tepi di batas yang lebih halus (salju, malam), kecuali pita langit. */
const SCENE_EDGE_CONTRAST = 6
/** Pemandangan dibatasi 10 warna (target lembar 6–10). */
const SCENE_MAX_COLORS = 10
const SUBJECT_OPTIONS: ArtworkOptions = { edgeContrast: EDGE_CONTRAST, maxColors: MAX_PALETTE_SIZE }

export interface CategorySpec {
  readonly category: Category
  readonly width: number
  readonly height: number
  readonly subjects: readonly Subject[]
  readonly view: (layers: readonly Layer[]) => View
  readonly options: ArtworkOptions
}

export const CATEGORY_SPECS: readonly CategorySpec[] = [
  {
    category: 'scenery',
    width: 48,
    height: 40,
    subjects: scenerySubjects,
    view: () => coverDesign(48, 40, SCENE_WIDTH, SCENE_HEIGHT, SCENE_SCALE_X),
    options: { edgeContrast: SCENE_EDGE_CONTRAST, maxColors: SCENE_MAX_COLORS },
  },
  {
    category: 'animal',
    width: 40,
    height: 40,
    subjects: animalSubjects,
    view: (layers) => fitSubject(layers, 40, 40, SUBJECT_MARGIN),
    options: SUBJECT_OPTIONS,
  },
  {
    category: 'food',
    width: 40,
    height: 40,
    subjects: foodSubjects,
    view: (layers) => fitSubject(layers, 40, 40, SUBJECT_MARGIN),
    options: SUBJECT_OPTIONS,
  },
]

function generateOne(seed: number, spec: CategorySpec, subject: Subject, variant: number): Artwork {
  const id = `${spec.category}-${subject.key}-${String(variant + 1).padStart(2, '0')}`
  const design = subject.create(createRng(deriveSeed(seed, id)), variant)
  const raster = render(spec.width, spec.height, design.layers, spec.view(design.layers), SAMPLES)
  return createArtwork({ id, title: design.title, category: spec.category }, raster, spec.options)
}

/** Hasilkan seluruh 100 gambar secara deterministik dari seed. */
export function generateAllArtworks(seed = DEFAULT_SEED): Artwork[] {
  return CATEGORY_SPECS.flatMap((spec) =>
    spec.subjects.flatMap((subject) =>
      Array.from({ length: subject.count }, (_, variant) =>
        generateOne(seed, spec, subject, variant),
      ),
    ),
  )
}
