import type { Artwork, Category } from '../types/artwork'
import type { Progress } from '../types/progress'

export function makeArtwork(id: string, title: string, category: Category): Artwork {
  return {
    id,
    title,
    category,
    width: 2,
    height: 2,
    outline: [true, false, false, false],
    reference: ['#000000', '#ff0000', '#00ff00', '#0000ff'],
    suggestedPalette: ['#ff0000'],
  }
}

export const TEST_ARTWORKS: readonly Artwork[] = [
  makeArtwork('scenery-1', 'Gunung Biru', 'scenery'),
  makeArtwork('animal-1', 'Kucing Oranye', 'animal'),
  makeArtwork('food-1', 'Café Latte', 'food'),
  makeArtwork('animal-2', 'Kelinci', 'animal'),
]

export function makeProgress(artId: string, percent: number, completed = false): Progress {
  return {
    artId,
    colors: [null, '#ff0000', null, null],
    percent,
    completed,
    recentColors: [],
    updatedAt: 1,
  }
}
