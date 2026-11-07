import { useEffect, useEffectEvent, useState } from 'react'
import type { Tool } from '../../editor/tools'

export interface ShortcutActions {
  readonly onTool: (tool: Tool) => void
  readonly onUndo: () => void
  readonly onRedo: () => void
  readonly onZoomIn: () => void
  readonly onZoomOut: () => void
  readonly onZoomReset: () => void
  /** Dicek lebih dulu untuk tombol tanpa modifier (mis. kode warna di mode nomor). true = ditangani. */
  readonly onPlainKey?: (key: string) => boolean
}

const TOOL_KEYS: Readonly<Record<string, Tool>> = {
  b: 'brush',
  g: 'bucket',
  e: 'eraser',
  i: 'picker',
}

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])
const ACTIVATABLE_TAGS = new Set(['BUTTON', 'A', 'SUMMARY'])

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement && (TYPING_TAGS.has(target.tagName) || target.isContentEditable)
  )
}

/** Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl+Y. true jika ditangani. */
function handleHistoryKey(event: KeyboardEvent, actions: ShortcutActions): boolean {
  if (!event.ctrlKey && !event.metaKey) return false
  const key = event.key.toLowerCase()
  if (key === 'z') {
    if (event.shiftKey) actions.onRedo()
    else actions.onUndo()
    return true
  }
  if (key === 'y') {
    actions.onRedo()
    return true
  }
  return false
}

function handlePlainKey(event: KeyboardEvent, actions: ShortcutActions): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return false
  if (actions.onPlainKey?.(event.key)) return true
  const tool = TOOL_KEYS[event.key.toLowerCase()]
  if (tool) actions.onTool(tool)
  else if (event.key === '+' || event.key === '=') actions.onZoomIn()
  else if (event.key === '-' || event.key === '_') actions.onZoomOut()
  else if (event.key === '0') actions.onZoomReset()
  else return false
  return true
}

/**
 * Pintasan keyboard editor (diabaikan saat mengetik di input).
 * Mengembalikan `isSpaceHeld` untuk mode geser kanvas (spasi + drag).
 */
export function useEditorShortcuts(actions: ShortcutActions): boolean {
  const [isSpaceHeld, setIsSpaceHeld] = useState(false)

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (isTyping(event.target)) return
    if (event.key === ' ') {
      const target = event.target
      if (target instanceof HTMLElement && ACTIVATABLE_TAGS.has(target.tagName)) return
      event.preventDefault()
      setIsSpaceHeld(true)
      return
    }
    if (handleHistoryKey(event, actions) || handlePlainKey(event, actions)) event.preventDefault()
  })

  useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === ' ') setIsSpaceHeld(false)
    }
    const onBlur = () => setIsSpaceHeld(false)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  return isSpaceHeld
}
