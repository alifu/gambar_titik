import type { Artwork, Category } from '../types/artwork.ts'
import { animalSubjects } from './animals.ts'
import { createArtwork } from './artwork.ts'
import type { Subject } from './design.ts'
import { foodSubjects } from './food.ts'
import { createRng, deriveSeed } from './random.ts'
import { render } from './raster.ts'
import { scenerySubjects } from './scenery.ts'

export const DEFAULT_SEED = 20261107

export interface CategorySpec {
  readonly category: Category
  readonly width: number
  readonly height: number
  readonly subjects: readonly Subject[]
}

export const CATEGORY_SPECS: readonly CategorySpec[] = [
  { category: 'scenery', width: 96, height: 64, subjects: scenerySubjects },
  { category: 'animal', width: 64, height: 64, subjects: animalSubjects },
  { category: 'food', width: 64, height: 64, subjects: foodSubjects },
]

function generateOne(seed: number, spec: CategorySpec, subject: Subject, variant: number): Artwork {
  const id = `${spec.category}-${subject.key}-${String(variant + 1).padStart(2, '0')}`
  const design = subject.create(createRng(deriveSeed(seed, id)), variant)
  const raster = render(spec.width, spec.height, design.layers)
  return createArtwork({ id, title: design.title, category: spec.category }, raster)
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
