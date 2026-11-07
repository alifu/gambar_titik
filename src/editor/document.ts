import { commit, createHistory, redo, replacePresent, undo, type History } from './history'
import type { PixelColors } from './tools'

/** State warna gambar + riwayat. `strokeDirty` = goresan aktif sudah tercatat sebagai satu langkah. */
export interface DocumentState {
  readonly history: History<PixelColors>
  readonly strokeActive: boolean
  readonly strokeDirty: boolean
}

export type ColorsUpdate = (colors: PixelColors) => PixelColors

export type DocumentAction =
  | { readonly type: 'stroke-start' }
  | { readonly type: 'stroke-apply'; readonly update: ColorsUpdate }
  | { readonly type: 'stroke-end' }
  | { readonly type: 'apply'; readonly update: ColorsUpdate }
  | { readonly type: 'undo' }
  | { readonly type: 'redo' }

export function createDocument(colors: PixelColors): DocumentState {
  return { history: createHistory(colors), strokeActive: false, strokeDirty: false }
}

function applyInStroke(state: DocumentState, update: ColorsUpdate): DocumentState {
  const next = update(state.history.present)
  if (next === state.history.present) return state
  if (state.strokeDirty) return { ...state, history: replacePresent(state.history, next) }
  return { ...state, history: commit(state.history, next), strokeDirty: true }
}

/**
 * Reducer murni untuk editor.
 * - Selama goresan (stroke-start → stroke-apply* → stroke-end), semua perubahan digabung jadi satu langkah undo.
 * - `apply` = satu aksi satu langkah (ember, reset).
 * - Update yang tidak mengubah apa pun (array sama) tidak menambah langkah.
 */
export function documentReducer(state: DocumentState, action: DocumentAction): DocumentState {
  switch (action.type) {
    case 'stroke-start':
      return { ...state, strokeActive: true, strokeDirty: false }
    case 'stroke-apply':
      return state.strokeActive ? applyInStroke(state, action.update) : state
    case 'stroke-end':
      return { ...state, strokeActive: false, strokeDirty: false }
    case 'apply':
      return { ...state, history: commit(state.history, action.update(state.history.present)) }
    case 'undo':
      return state.strokeActive ? state : { ...state, history: undo(state.history) }
    case 'redo':
      return state.strokeActive ? state : { ...state, history: redo(state.history) }
  }
}
