import { ID } from '../i18n/id'
import { deleteProgress, listProgress, saveProgress } from './repository'
import type { ExportFile, Progress, UserProfile } from '../types/progress'

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
const EXPORT_VERSION = 1

export type PixelCountLookup = (artId: string) => number | undefined
export type MergeMode = 'merge' | 'replace'

export interface ImportSuccess {
  readonly ok: true
  readonly file: ExportFile
  readonly warnings: readonly string[]
}
export interface ImportFailure {
  readonly ok: false
  readonly errors: readonly string[]
}
export type ImportResult = ImportSuccess | ImportFailure

export function buildExportFile(
  user: UserProfile,
  progress: readonly Progress[],
  now: number = Date.now(),
): ExportFile {
  return { version: EXPORT_VERSION, exportedAt: now, user, progress }
}

export function exportFileName(userId: string, date: Date): string {
  return `gambar-titik-${userId}-${date.toISOString().slice(0, 10)}.json`
}

export function downloadExportFile(file: ExportFile, date: Date = new Date()): void {
  const blob = new Blob([JSON.stringify(file)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = exportFileName(file.user.id, date)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

type Rec = Record<string, unknown>
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v)
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isStr = (v: unknown): v is string => typeof v === 'string'

function parseUser(raw: unknown): UserProfile | undefined {
  if (!isRec(raw)) return undefined
  const { id, displayName, createdAt, lastLoginAt } = raw
  if (!isStr(id) || !isStr(displayName) || !isNum(createdAt) || !isNum(lastLoginAt)) {
    return undefined
  }
  return { id, displayName, createdAt, lastLoginAt }
}

interface ProgressParse {
  readonly progress?: Progress
  readonly error?: string
  readonly warning?: string
}

function validateColors(
  artId: string,
  colors: unknown,
  getPixelCount: PixelCountLookup,
): { colors?: (string | null)[]; error?: string; unknown?: boolean } {
  if (!Array.isArray(colors)) return { error: ID.importError.badLength(artId) }
  const expected = getPixelCount(artId)
  if (expected === undefined) return { unknown: true }
  if (colors.length !== expected) return { error: ID.importError.badLength(artId) }
  const valid = colors.every((c) => c === null || (isStr(c) && HEX_COLOR.test(c)))
  if (!valid) return { error: ID.importError.badColor(artId) }
  return { colors: colors as (string | null)[] }
}

function parseProgress(
  raw: unknown,
  index: number,
  getPixelCount: PixelCountLookup,
): ProgressParse {
  if (!isRec(raw)) return { error: ID.importError.badProgress(index) }
  const { artId, percent, completed, recentColors, updatedAt } = raw
  if (
    !isStr(artId) ||
    !isNum(percent) ||
    typeof completed !== 'boolean' ||
    !Array.isArray(recentColors) ||
    !recentColors.every((c) => isStr(c) && HEX_COLOR.test(c)) ||
    !isNum(updatedAt)
  ) {
    return { error: ID.importError.badProgress(index) }
  }
  if (percent < 0 || percent > 100) return { error: ID.importError.badPercent(artId) }
  const checked = validateColors(artId, raw.colors, getPixelCount)
  if (checked.unknown) return { warning: ID.profile.skipped(artId) }
  if (checked.error || !checked.colors) return { error: checked.error }
  return {
    progress: {
      artId,
      colors: checked.colors,
      percent,
      completed,
      recentColors: recentColors as string[],
      updatedAt,
    },
  }
}

function fail(...errors: string[]): ImportFailure {
  return { ok: false, errors }
}

export function parseImportFile(text: string, getPixelCount: PixelCountLookup): ImportResult {
  if (new Blob([text]).size > MAX_IMPORT_BYTES) return fail(ID.importError.tooLarge)
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return fail(ID.importError.badJson)
  }
  if (!isRec(data)) return fail(ID.importError.notObject)
  if (data.version !== EXPORT_VERSION) return fail(ID.importError.badVersion)
  const user = parseUser(data.user)
  if (!user) return fail(ID.importError.badUser)
  if (!Array.isArray(data.progress) || !isNum(data.exportedAt)) {
    return fail(ID.importError.badProgressList)
  }
  const results = data.progress.map((item, i) => parseProgress(item, i, getPixelCount))
  const errors = results.flatMap((r) => (r.error ? [r.error] : []))
  if (errors.length > 0) return { ok: false, errors }
  const progress = results.flatMap((r) => (r.progress ? [r.progress] : []))
  const warnings = results.flatMap((r) => (r.warning ? [r.warning] : []))
  return {
    ok: true,
    file: { version: EXPORT_VERSION, exportedAt: data.exportedAt, user, progress },
    warnings,
  }
}

export function mergeProgress(
  existing: readonly Progress[],
  incoming: readonly Progress[],
  mode: MergeMode,
): Progress[] {
  if (mode === 'replace') return [...incoming]
  const byArt = new Map(existing.map((p) => [p.artId, p] as const))
  for (const item of incoming) {
    const current = byArt.get(item.artId)
    if (!current || item.updatedAt > current.updatedAt) byArt.set(item.artId, item)
  }
  return [...byArt.values()]
}

/** Terapkan hasil impor ke penyimpanan milik userId. Mengembalikan progres akhir. */
export async function applyImport(
  userId: string,
  incoming: readonly Progress[],
  mode: MergeMode,
): Promise<Progress[]> {
  const existing = await listProgress(userId)
  const result = mergeProgress(existing, incoming, mode)
  const keep = new Set(result.map((p) => p.artId))
  await Promise.all(
    existing.filter((p) => !keep.has(p.artId)).map((p) => deleteProgress(userId, p.artId)),
  )
  await Promise.all(result.map((p) => saveProgress(userId, p)))
  return result
}
