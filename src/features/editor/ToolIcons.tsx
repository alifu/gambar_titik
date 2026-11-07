import type { ReactNode } from 'react'

export type IconName =
  'brush' | 'bucket' | 'eraser' | 'picker' | 'undo' | 'redo' | 'zoomIn' | 'zoomOut' | 'zoomReset'

const ICON_PATHS: Readonly<Record<IconName, ReactNode>> = {
  brush: (
    <>
      <path d="M14.5 4.5l5 5-8.5 8.5-5-5z" />
      <path d="M6 13c-2 0-3 1.5-3 3.5 0 1.5-.5 2.5-1 3 3 .5 6 .5 7-2 .5-1 .5-2 0-3" />
    </>
  ),
  bucket: (
    <>
      <path d="M4 12l7-8 8 8-7 7z" />
      <path d="M4 12h15" />
      <path d="M21 16c0 1.4-1 2.5-1 2.5s-1-1.100-1-2.500a1 1 0 012 0z" />
    </>
  ),
  eraser: (
    <>
      <path d="M8 20l-4.500-4.500a2 2 0 010-2.800L13 3.200a2 2 0 012.800 0l4.500 4.500a2 2 0 010 2.800L12 19" />
      <path d="M8 20h12" />
      <path d="M7 10l7 7" />
    </>
  ),
  picker: (
    <>
      <path d="M15 4l5 5-3 1-1.500-1.500L9 15l-1 3-2 1-1-1 1-2 3-1 6.500-6.500L14 7z" />
      <path d="M4 20l1.500-1.500" />
    </>
  ),
  undo: (
    <>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10a6 6 0 010 12h-3" />
    </>
  ),
  redo: (
    <>
      <path d="M15 14l5-5-5-5" />
      <path d="M20 9H10a6 6 0 000 12h3" />
    </>
  ),
  zoomIn: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-5-5M11 8v6M8 11h6" />
    </>
  ),
  zoomOut: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-5-5M8 11h6" />
    </>
  ),
  zoomReset: (
    <>
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </>
  ),
}

/** Ikon SVG sederhana; dekoratif (aria-hidden), label ada di tombol. */
export function ToolIcon({ name }: { name: IconName }) {
  return (
    <svg
      className="tool-icon"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name]}
    </svg>
  )
}
