import type { Artwork } from '../types/artwork'

/**
 * Artwork uji 6×6 ('#' = outline):
 * ```
 * r0: . . # # . .    region A = {0,1,6,7}
 * r1: . . # # . .    region C = {4,5,10,11}
 * r2: # # . . # #    region B = {14,15,20,21} (hanya bersentuhan diagonal dengan A dan C)
 * r3: # # . . # #
 * r4: # # # # # #
 * r5: . . . . . .    region E = {30..35}
 * ```
 */
const ROWS = ['..##..', '..##..', '##..##', '##..##', '######', '......']

export const REGION_A = [0, 1, 6, 7]
export const REGION_B = [14, 15, 20, 21]
export const REGION_C = [4, 5, 10, 11]
export const REGION_E = [30, 31, 32, 33, 34, 35]

export const TEST_ARTWORK: Artwork = {
  id: 'test-art-01',
  title: 'Kucing Uji',
  category: 'animal',
  width: 6,
  height: 6,
  palette: [
    { code: '0', name: 'Hitam', hex: '#000000' },
    { code: '1', name: 'Oranye', hex: '#ffaa00' },
    { code: '2', name: 'Biru', hex: '#3366ff' },
  ],
  pixels: ROWS.join('')
    .split('')
    .map((c) => (c === '#' ? 0 : 1)),
}
