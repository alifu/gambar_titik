import { describe, expect, it } from 'vitest'
import type { Artwork } from '../types/artwork'
import { ArtworkDataError, encodeArtwork, encodeArtworks, encodeRows } from './codec'
import { decodeArtworks } from './decode'

const SAMPLE: Artwork = {
  id: 'food-apple-01',
  title: 'Apel Merah',
  category: 'food',
  width: 3,
  height: 2,
  palette: [
    { code: '0', name: 'Hitam', hex: '#000000' },
    { code: '1', name: 'Merah', hex: '#ff0000' },
  ],
  pixels: [0, -1, 1, 0, 1, 1],
}

type Data = { version: number; artworks: Record<string, unknown>[] }
const encodedSample = (): Data => JSON.parse(JSON.stringify(encodeArtworks([SAMPLE])))
const withArtwork = (data: Data, patch: Record<string, unknown>) => ({
  ...data,
  artworks: [{ ...data.artworks[0], ...patch }],
})

describe('encode', () => {
  it('menulis baris ber-kode dengan titik untuk latar', () => {
    expect(encodeRows(SAMPLE)).toEqual(['0.1', '011'])
    expect(encodeArtwork(SAMPLE).palette).toEqual(SAMPLE.palette)
  })

  it('menolak indeks di luar palet', () => {
    expect(() => encodeRows({ ...SAMPLE, pixels: [0, 0, 0, 0, 0, 7] })).toThrow(ArtworkDataError)
  })
})

describe('decodeArtworks', () => {
  it('roundtrip encode → JSON → decode menghasilkan data identik', () => {
    expect(decodeArtworks(encodedSample())).toEqual([SAMPLE])
  })

  const black = { code: '0', name: 'Hitam', hex: '#000000' }
  const broken: [string, (data: Data) => unknown][] = [
    ['bukan objek', () => 'teks'],
    ['versi lama', (data) => ({ ...data, version: 1 })],
    ['tanpa daftar gambar', (data) => ({ version: data.version })],
    ['gambar bukan objek', (data) => ({ ...data, artworks: [42] })],
    ['id kosong', (data) => withArtwork(data, { id: '' })],
    ['judul bukan teks', (data) => withArtwork(data, { title: 5 })],
    ['kategori asing', (data) => withArtwork(data, { category: 'robot' })],
    ['lebar tidak valid', (data) => withArtwork(data, { width: 0 })],
    ['tinggi terlalu besar', (data) => withArtwork(data, { height: 9999 })],
    ['palet bukan daftar', (data) => withArtwork(data, { palette: 'x' })],
    ['palet kosong', (data) => withArtwork(data, { palette: [] })],
    ['palet terlalu banyak', (data) => withArtwork(data, { palette: Array(13).fill(black) })],
    ['entri palet bukan objek', (data) => withArtwork(data, { palette: ['#000000'] })],
    ['kode tidak valid', (data) => withArtwork(data, { palette: [{ ...black, code: 'a' }] })],
    ['nama kosong', (data) => withArtwork(data, { palette: [{ ...black, name: ' ' }] })],
    ['hex tidak valid', (data) => withArtwork(data, { palette: [{ ...black, hex: 'hitam' }] })],
    [
      'warna pertama bukan kode 0',
      (data) => withArtwork(data, { palette: [{ ...black, code: '1' }] }),
    ],
    ['kode ganda', (data) => withArtwork(data, { palette: [black, black] })],
    ['rows bukan daftar', (data) => withArtwork(data, { rows: '0.1011' })],
    ['jumlah baris salah', (data) => withArtwork(data, { rows: ['0.1'] })],
    ['baris terlalu pendek', (data) => withArtwork(data, { rows: ['0.', '011'] })],
    ['baris bukan teks', (data) => withArtwork(data, { rows: [12, '011'] })],
    ['kode tidak dikenal', (data) => withArtwork(data, { rows: ['0.9', '011'] })],
    ['ID ganda', (data) => ({ ...data, artworks: [data.artworks[0], data.artworks[0]] })],
  ]

  it.each(broken)('menolak data rusak: %s', (_, corrupt) => {
    expect(() => decodeArtworks(corrupt(encodedSample()))).toThrow(ArtworkDataError)
  })

  it('pesan error berbahasa Indonesia dan menyebut lokasi', () => {
    expect(() => decodeArtworks(withArtwork(encodedSample(), { width: -1 }))).toThrow(
      /Data gambar rusak \(gambar ke-1, food-apple-01\)/,
    )
    expect(() => decodeArtworks(withArtwork(encodedSample(), { rows: ['0.Z', '011'] }))).toThrow(
      'kode "Z" di baris ke-1 tidak ada di palet',
    )
  })
})
