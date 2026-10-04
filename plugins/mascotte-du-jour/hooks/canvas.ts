// Une toile de pixels encodée pour un Raster : chaque cellule porte deux pixels
// empilés (▀ avec le pixel du haut en avant-plan et celui du bas en fond).

export type Color = number

const EMPTY = -1
const DEFAULT_COLOR = 0x01000000
const UPPER_HALF = 0x2580
const LOWER_HALF = 0x2584

export class Canvas {
  readonly px: Int32Array
  // La taille réelle en pixels : `res` pixels réels par pixel logique, dans chaque sens.
  readonly pw: number
  readonly ph: number

  // `w`×`h` est la taille logique, celle avec laquelle les thèmes dessinent ; avec
  // `res` à 2 (taille géante), formes et positions gagnent un demi-pixel de finesse.
  constructor(
    readonly w: number,
    readonly h: number,
    readonly res = 1,
  ) {
    this.pw = Math.round(w * res)
    this.ph = Math.round(h * res)
    this.px = new Int32Array(this.pw * this.ph).fill(EMPTY)
  }

  // Un pixel réel, à des coordonnées logiques qui peuvent tomber entre deux pixels.
  fine(x: number, y: number, color: Color) {
    const ix = Math.round(x * this.res)
    const iy = Math.round(y * this.res)
    if (ix < 0 || iy < 0 || ix >= this.pw || iy >= this.ph) return
    this.px[iy * this.pw + ix] = color
  }

  // Une particule (étoile, goutte, confetti…) : un pixel fin en haute définition,
  // un pixel ordinaire sinon.
  dot(x: number, y: number, color: Color) {
    if (this.res > 1) this.fine(x, y, color)
    else this.set(x, y, color)
  }

  // Un pixel logique : les pixels réels qu'il couvre (un carré de `res`×`res`, ou
  // tantôt 1, tantôt 2 pixels de côté quand `res` n'est pas entier).
  set(x: number, y: number, color: Color) {
    const x0 = Math.round(x * this.res)
    const y0 = Math.round(y * this.res)
    const x1 = Math.max(x0 + 1, Math.round((x + 1) * this.res))
    const y1 = Math.max(y0 + 1, Math.round((y + 1) * this.res))
    for (let ry = Math.max(0, y0); ry < Math.min(this.ph, y1); ry++) {
      for (let rx = Math.max(0, x0); rx < Math.min(this.pw, x1); rx++) this.px[ry * this.pw + rx] = color
    }
  }

  rect(x: number, y: number, w: number, h: number, color: Color) {
    const x0 = Math.round(x * this.res)
    const y0 = Math.round(y * this.res)
    const x1 = Math.round((x + Math.round(w)) * this.res)
    const y1 = Math.round((y + Math.round(h)) * this.res)
    for (let ry = Math.max(0, y0); ry < Math.min(this.ph, y1); ry++) {
      for (let rx = Math.max(0, x0); rx < Math.min(this.pw, x1); rx++) this.px[ry * this.pw + rx] = color
    }
  }

  // Une ligne de carrés `thick`×`thick`, du point (x0, y0) au point (x1, y1),
  // tracée à la finesse réelle de la toile : en haute définition, un trait
  // d'épaisseur 1 ne fait qu'un pixel fin.
  line(x0: number, y0: number, x1: number, y1: number, color: Color, thick = 1) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * this.res))
    const size = this.res === 1 ? thick : Math.max(1, thick * this.res - (thick === 1 ? 1 : 0))
    for (let i = 0; i <= steps; i++) {
      const k = i / steps
      const x = x0 + (x1 - x0) * k
      const y = y0 + (y1 - y0) * k
      if (this.res === 1) this.rect(Math.round(x), Math.round(y), thick, thick, color)
      else {
        const rx = Math.round(x * this.res)
        const ry = Math.round(y * this.res)
        for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) this.fineAt(rx + dx, ry + dy, color)
      }
    }
  }

  disc(cx: number, cy: number, r: number, color: Color) {
    const res = this.res
    for (let ry = Math.floor((cy - r) * res); ry <= Math.ceil((cy + r) * res); ry++) {
      for (let rx = Math.floor((cx - r) * res); rx <= Math.ceil((cx + r) * res); rx++) {
        // Au centre du pixel réel (à la résolution 1, exactement le pixel logique).
        const x = (rx + (res - 1) / 2) / res
        const y = (ry + (res - 1) / 2) / res
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.3) this.fineAt(rx, ry, color)
      }
    }
  }

  // Les finitions de la haute définition : un liseré de lumière sur le dessus du sol
  // (la rangée logique `ground`), là où ses deux rangées réelles sont du même ton.
  polish(ground: number) {
    if (this.res < 2) return
    const top = ground * this.res
    for (let x = 0; x < this.pw; x++) {
      const color = this.px[top * this.pw + x]!
      if (color === EMPTY || color !== this.px[(top + 1) * this.pw + x]) continue
      this.px[top * this.pw + x] = mix(color, 0xffffff, 0.22)
    }
  }

  fineAt(rx: number, ry: number, color: Color) {
    if (rx >= 0 && ry >= 0 && rx < this.pw && ry < this.ph) this.px[ry * this.pw + rx] = color
  }

  // Une bande horizontale de `h` px à partir de la rangée `y0` (toile à la résolution 1).
  cropped(y0: number, h: number): Canvas {
    const out = new Canvas(this.w, h)
    out.px.set(this.px.subarray(y0 * this.w, (y0 + h) * this.w))
    return out
  }

  encode(): string {
    const rows = Math.ceil(this.ph / 2)
    const words = new Uint32Array(this.pw * rows * 3)
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < this.pw; col++) {
        const top = this.px[row * 2 * this.pw + col]!
        const bottom = row * 2 + 1 < this.ph ? this.px[(row * 2 + 1) * this.pw + col]! : EMPTY
        const i = (row * this.pw + col) * 3
        if (top === EMPTY && bottom === EMPTY) {
          words.set([0x20, DEFAULT_COLOR, DEFAULT_COLOR], i)
        } else if (top === EMPTY) {
          words.set([LOWER_HALF, bottom, DEFAULT_COLOR], i)
        } else {
          words.set([UPPER_HALF, top, bottom === EMPTY ? DEFAULT_COLOR : bottom], i)
        }
      }
    }
    const bytes = new Uint8Array(words.buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i += 4096) binary += String.fromCharCode(...bytes.subarray(i, i + 4096))
    return btoa(binary)
  }
}

// Un nombre pseudo-aléatoire stable dans [0, 1) pour un entier donné.
export const noise = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

export const mix = (a: Color, b: Color, k: number): Color => {
  const ch = (shift: number) => {
    const ca = (a >> shift) & 0xff
    const cb = (b >> shift) & 0xff
    return Math.round(ca + (cb - ca) * Math.min(1, Math.max(0, k)))
  }
  return (ch(16) << 16) | (ch(8) << 8) | ch(0)
}
