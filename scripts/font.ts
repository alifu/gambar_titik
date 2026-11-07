/** Font bitmap 3×5 minimal (angka, huruf besar, tanda baca) untuk lembar pratinjau PNG. */
export const GLYPH_WIDTH = 3
export const GLYPH_HEIGHT = 5

const GLYPHS: Readonly<Record<string, string>> = {
  '0': '111101101101111',
  '1': '010110010010111',
  '2': '111001111100111',
  '3': '111001111001111',
  '4': '101101111001001',
  '5': '111100111001111',
  '6': '111100111101111',
  '7': '111001010010010',
  '8': '111101111101111',
  '9': '111101111001111',
  A: '010101111101101',
  B: '110101110101110',
  C: '011100100100011',
  D: '110101101101110',
  E: '111100110100111',
  F: '111100110100100',
  G: '011100101101011',
  H: '101101111101101',
  I: '111010010010111',
  J: '001001001101010',
  K: '101101110101101',
  L: '100100100100111',
  M: '101111111101101',
  N: '110101101101101',
  O: '010101101101010',
  P: '110101110100100',
  Q: '010101101110011',
  R: '110101110101101',
  S: '011100010001110',
  T: '111010010010010',
  U: '101101101101111',
  V: '101101101101010',
  W: '101101111111101',
  X: '101101010101101',
  Y: '101101010010010',
  Z: '111001010100111',
  '-': '000000111000000',
  '·': '000000010000000',
  '#': '101111101111101',
  ' ': '000000000000000',
}

/** Pixel menyala glyph (dx, dy) untuk satu karakter; karakter tak dikenal = kosong. */
export function glyphPixels(char: string): readonly (readonly [number, number])[] {
  const bits = GLYPHS[char.toUpperCase()] ?? GLYPHS[' ']
  return [...bits].flatMap((bit, index) =>
    bit === '1' ? [[index % GLYPH_WIDTH, Math.floor(index / GLYPH_WIDTH)] as const] : [],
  )
}
