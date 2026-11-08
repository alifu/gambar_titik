import type { Design, Subject } from './design.ts'
import type { Rng } from './random.ts'
import type { Layer } from './raster.ts'
import { MOODS, type Mood } from './scenery/moods.ts'
import {
  beachScene,
  forestScene,
  lakeScene,
  meadowScene,
  mountainScene,
  riverScene,
  villageScene,
} from './scenery/places.ts'

type Compose = (rng: Rng, mood: Mood) => Layer[]

function place(
  key: string,
  name: string,
  compose: Compose,
  moods: readonly Mood[] = MOODS,
): Subject {
  return {
    key,
    count: moods.length,
    create: (rng: Rng, variant: number): Design => {
      const mood = moods[variant % moods.length]
      return {
        title: `${mood.word} di ${name}`,
        layers: compose(rng, mood),
      }
    },
  }
}

export const scenerySubjects: readonly Subject[] = [
  place('mountain', 'Pegunungan', mountainScene),
  place('lake', 'Danau', lakeScene),
  place(
    'beach',
    'Pantai',
    beachScene,
    MOODS.filter((mood) => !mood.snow),
  ),
  place('forest', 'Hutan', forestScene),
  place('village', 'Desa', villageScene),
  place('meadow', 'Padang Rumput', meadowScene),
  place('river', 'Sungai', riverScene),
]
