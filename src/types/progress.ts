export interface UserProfile {
  readonly id: string
  readonly displayName: string
  readonly createdAt: number
  readonly lastLoginAt: number
}

export interface Progress {
  readonly artId: string
  /** Warna hex per pixel, null = belum diwarnai. Panjang = width * height artwork. */
  readonly colors: readonly (string | null)[]
  /** Persen (0-100) pixel non-outline yang sudah diwarnai */
  readonly percent: number
  /** Ditandai selesai oleh user */
  readonly completed: boolean
  readonly recentColors: readonly string[]
  readonly updatedAt: number
}

export interface ExportFile {
  readonly version: 1
  readonly exportedAt: number
  readonly user: UserProfile
  readonly progress: readonly Progress[]
}
