import { BACKGROUND_SYMBOL, type Artwork } from '../../types/artwork'
import { codeAt, referenceColor } from '../../render/pixelColors'

const CELL = 10
const FRAME = 1.2
const LINE = 0.25
const FONT_SIZE = 6.5
const LINE_COLOR = '#9a9a9a'
const FRAME_COLOR = '#000000'
const BACKGROUND_DOT_COLOR = '#8a8a8a'

export type GridVariant = 'code' | 'key'

type Props = {
  readonly artwork: Artwork
  readonly variant: GridVariant
  readonly label: string
}

type CellProps = {
  readonly artwork: Artwork
  readonly index: number
  readonly variant: GridVariant
}

function Cell({ artwork, index, variant }: CellProps) {
  const x = (index % artwork.width) * CELL
  const y = Math.floor(index / artwork.width) * CELL
  const fill = variant === 'key' ? (referenceColor(artwork, index) ?? '#ffffff') : '#ffffff'
  const code = codeAt(artwork, index)
  const showText = variant === 'code'
  return (
    <g data-cell={index}>
      <rect
        x={x}
        y={y}
        width={CELL}
        height={CELL}
        fill={fill}
        stroke={LINE_COLOR}
        strokeWidth={LINE}
      />
      {showText && (
        <text
          x={x + CELL / 2}
          y={y + CELL / 2}
          fontSize={FONT_SIZE}
          textAnchor="middle"
          dominantBaseline="central"
          fill={code === null ? BACKGROUND_DOT_COLOR : '#111111'}
          fontFamily="Arial, Helvetica, sans-serif"
        >
          {code ?? BACKGROUND_SYMBOL}
        </text>
      )}
    </g>
  )
}

/** Grid SVG: vektor sehingga tajam saat dicetak. Skala mengikuti lebar kontainer. */
export function PrintGrid({ artwork, variant, label }: Props) {
  const width = artwork.width * CELL
  const height = artwork.height * CELL
  const pad = FRAME
  return (
    <svg
      className="print-grid"
      role="img"
      aria-label={label}
      viewBox={`${-pad} ${-pad} ${width + pad * 2} ${height + pad * 2}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {artwork.pixels.map((_, index) => (
        <Cell key={index} artwork={artwork} index={index} variant={variant} />
      ))}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="none"
        stroke={FRAME_COLOR}
        strokeWidth={FRAME}
      />
    </svg>
  )
}
