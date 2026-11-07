import { describe, expect, it } from 'vitest'
import type { Artwork } from '../types/artwork'
import {
  ArtworkDataError,
  encodeArtwork,
  encodeArtworks,
  encodeOutline,
  encodeReference,
} from './codec'
import { decodeArtworks } from './decode'

const SAMPLE: Artwork = {
  id: 'food-apple-01',
  title: 'Apel Merah',
  category: 'food',
  width: 3,
  height: 2,
  outline: [true, true, false, false, false, true],
  reference: ['#ff0000', '#ff0000', '#ffffff', '#ffffff', '#ffffff', '#000000'],
  suggestedPalette: ['#ffffff', '#ff0000', '#000000'],
}

const encodedSample = () => JSON.parse(JSON.stringify(encodeArtworks([SAMPLE])))

describe('encode', () => {
  it('RLE outline dimulai dari run false', () => {
    expect(encodeOutline([true, true, false])).toEqual([0, 2, 1])
    expect(encodeOutline([false, true, true])).toEqual([1, 2])
  })

  it('RLE reference memakai indeks palet', () => {
    expect(encodeReference(['#000000', '#000000', '#ffffff'], ['#ffffff', '#000000'])).toEqual([
      1, 2, 0, 1,
    ])
  })

  it('menolak warna di luar palet', () => {
    expect(() => encodeReference(['#123456'], ['#ffffff'])).toThrow(ArtworkDataError)
  })
})

describe('decodeArtworks', () => {
  it('roundtrip encode → JSON → decode menghasilkan data identik', () => {
    expect(decodeArtworks(encodedSample())).toEqual([SAMPLE])
    expect(encodeArtwork(SAMPLE).palette).toEqual(SAMPLE.suggestedPalette)
  })

  const broken: [
    string,
    (data: { version: number; artworks: Record<string, unknown>[] }) => unknown,
  ][] = [
    ['bukan objek', () => 'teks'],
    ['versi salah', (data) => ({ ...data, version: 2 })],
    ['tanpa daftar gambar', (data) => ({ version: data.version })],
    ['gambar bukan objek', (data) => ({ ...data, artworks: [42] })],
    ['id kosong', (data) => ({ ...data, artworks: [{ ...data.artworks[0], id: '' }] })],
    ['judul bukan teks', (data) => ({ ...data, artworks: [{ ...data.artworks[0], title: 5 }] })],
    [
      'kategori asing',
      (data) => ({ ...data, artworks: [{ ...data.artworks[0], category: 'robot' }] }),
    ],
    ['lebar tidak valid', (data) => ({ ...data, artworks: [{ ...data.artworks[0], width: 0 }] })],
    [
      'tinggi terlalu besar',
      (data) => ({ ...data, artworks: [{ ...data.artworks[0], height: 9999 }] }),
    ],
    [
      'palet tidak valid',
      (data) => ({ ...data, artworks: [{ ...data.artworks[0], palette: ['merah'] }] }),
    ],
    ['palet kosong', (data) => ({ ...data, artworks: [{ ...data.artworks[0], palette: [] }] })],
    [
      'reference ganjil',
      (data) => ({ ...data, artworks: [{ ...data.artworks[0], reference: [0] }] }),
    ],
    [
      'indeks warna di luar palet',
      (data) => ({ ...data, artworks: [{ ...data.artworks[0], reference: [9, 6] }] }),
    ],
    [
      'reference terlalu panjang',
      (data) => ({ ...data, artworks: [{ ...data.artworks[0], reference: [0, 7] }] }),
    ],
    [
      'reference terlalu pendek',
      (data) => ({ ...data, artworks: [{ ...data.artworks[0], reference: [0, 5] }] }),
    ],
    [
      'outline bukan daftar',
      (data) => ({ ...data, artworks: [{ ...data.artworks[0], outline: 'x' }] }),
    ],
    [
      'outline negatif',
      (data) => ({ ...data, artworks: [{ ...data.artworks[0], outline: [-1, 7] }] }),
    ],
    [
      'outline terlalu pendek',
      (data) => ({ ...data, artworks: [{ ...data.artworks[0], outline: [2] }] }),
    ],
    ['ID ganda', (data) => ({ ...data, artworks: [data.artworks[0], data.artworks[0]] })],
  ]

  it.each(broken)('menolak data rusak: %s', (_, corrupt) => {
    expect(() => decodeArtworks(corrupt(encodedSample()))).toThrow(ArtworkDataError)
  })

  it('pesan error berbahasa Indonesia dan menyebut lokasi', () => {
    const data = encodedSample()
    expect(() =>
      decodeArtworks({ ...data, artworks: [{ ...data.artworks[0], width: -1 }] }),
    ).toThrow(/Data gambar rusak \(gambar ke-1, food-apple-01\)/)
  })
})
