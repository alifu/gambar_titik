import type { Artwork, Category } from '../types/artwork'
import type { Progress } from '../types/progress'

export function makeArtwork(id: string, title: string, category: Category): Artwork {
  return {
    id,
    title,
    category,
    width: 2,
    height: 2,
    palette: [
      { code: '0', name: 'Hitam', hex: '#000000' },
      { code: '1', name: 'Merah', hex: '#ff0000' },
      { code: '2', name: 'Hijau', hex: '#00ff00' },
      { code: '3', name: 'Biru', hex: '#0000ff' },
    ],
    pixels: [0, 1, 2, 3],
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
    mode: 'free',
    colors: [null, '#ff0000', null, null],
    percent,
    completed,
    recentColors: [],
    updatedAt: 1,
  }
}
