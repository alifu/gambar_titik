import { ID } from '../i18n/id'

export const NAME_MIN_LENGTH = 2
export const NAME_MAX_LENGTH = 30

const ALLOWED_NAME = /^[\p{L}\p{M}\p{N} _.-]+$/u

export type NormalizeResult =
  | { readonly ok: true; readonly id: string; readonly displayName: string }
  | { readonly ok: false; readonly error: string }

function toSlug(displayName: string): string {
  return displayName.toLocaleLowerCase('id-ID').replace(/ /g, '-').replace(/-{2,}/g, '-')
}

export function normalizeName(raw: string): NormalizeResult {
  const displayName = raw.trim().replace(/\s+/g, ' ')
  if (displayName.length === 0) return { ok: false, error: ID.nameError.empty }
  if (!ALLOWED_NAME.test(displayName)) return { ok: false, error: ID.nameError.invalidChars }
  if (displayName.length < NAME_MIN_LENGTH) return { ok: false, error: ID.nameError.tooShort }
  if (displayName.length > NAME_MAX_LENGTH) return { ok: false, error: ID.nameError.tooLong }
  return { ok: true, id: toSlug(displayName), displayName }
}
