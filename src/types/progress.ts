export interface UserProfile {
  readonly id: string
  readonly displayName: string
  readonly createdAt: number
  readonly lastLoginAt: number
}

/** Cara mewarnai: sesuai kode warna, atau bebas. */
export type ColoringMode = 'number' | 'free'

export interface Progress {
  readonly artId: string
  readonly mode: ColoringMode
  /** Warna hex per pixel, null = belum diwarnai. Panjang = width * height artwork. */
  readonly colors: readonly (string | null)[]
  /** Persen (0-100): mode nomor = kotak benar, mode bebas = kotak non-latar & non-garis yang terisi */
  readonly percent: number
  /** Ditandai selesai oleh user */
  readonly completed: boolean
  readonly recentColors: readonly string[]
  readonly updatedAt: number
}

export interface ExportFile {
  readonly version: 2
  readonly exportedAt: number
  readonly user: UserProfile
  readonly progress: readonly Progress[]
}
