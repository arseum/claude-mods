// Les briques partagées par les thèmes : placement, sprites en texte,
// histoires en plusieurs actes et petits effets (notes, étincelles, météo…).

import { type Canvas, type Color, mix, noise } from '../canvas'
import { BODY_W, FIGURE_H } from '../clawd'
import { type Draw, GROUND, STAGE_H } from './theme'

// Le haut du corps quand le personnage est posé sur le sol.
export const BASE_Y = GROUND - FIGURE_H

// Le personnage centré sur la scène, quelle que soit sa largeur.
export const centerX = (c: Canvas) => Math.round((c.w - BODY_W) / 2)

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const lerp = (a: number, b: number, k: number) => a + (b - a) * clamp01(k)
// Une courbe douce de 0 à 1, pour démarrer et arriver sans à-coup.
export const ease = (k: number) => {
  const v = clamp01(k)
  return v * v * (3 - 2 * v)
}
// Un saut : 0 au sol, 1 au sommet, pour une phase `p` de 0 à 1.
export const hop = (p: number) => Math.sin(clamp01(p) * Math.PI)

// Les jambes d'une marche, qui alternent `speed` fois par seconde.
export const walkLegs = (t: number, speed = 5) =>
  Math.floor(t * speed) % 2 === 0 ? ([0, 1, 0, 1] as const) : ([1, 0, 1, 0] as const)

// Dessine un sprite écrit en texte : chaque caractère est une couleur de la
// palette, tout autre caractère (`.`, espace) est transparent.
export const sprite = (
  c: Canvas,
  x: number,
  y: number,
  rows: readonly string[],
  palette: Readonly<Record<string, Color>>,
  isFlipped = false,
) => {
  const at = (dx: number, dy: number): Color | undefined => {
    const row = rows[dy]
    if (row === undefined || dx < 0 || dx >= row.length) return undefined
    return palette[row[isFlipped ? row.length - 1 - dx : dx]!]
  }
  const left = Math.round(x)
  const top = Math.round(y)
  if (c.res === 2) return scale2x(c, left, top, rows, at)
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const color = at(dx, dy)
      if (color !== undefined) c.set(left + dx, top + dy, color)
    }
  })
}

// Le sprite agrandi deux fois par Scale2x, comme les émulateurs rétro : chaque
// pixel devient quatre, et un coin prend la couleur de ses deux voisins quand
// ils s'accordent. Les contours s'arrondissent sans perdre l'allure pixel art.
const scale2x = (c: Canvas, left: number, top: number, rows: readonly string[], at: (dx: number, dy: number) => Color | undefined) => {
  const width = Math.max(...rows.map(row => row.length))
  for (let dy = 0; dy < rows.length; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const p = at(dx, dy)
      const a = at(dx, dy - 1)
      const b = at(dx + 1, dy)
      const l = at(dx - 1, dy)
      const d = at(dx, dy + 1)
      const corners = [
        l === a && l !== d && a !== b ? a : p,
        a === b && a !== l && b !== d ? b : p,
        d === l && d !== b && l !== a ? l : p,
        b === d && b !== a && d !== l ? d : p,
      ]
      corners.forEach((color, i) => {
        if (color !== undefined) c.fineAt((left + dx) * 2 + (i % 2), (top + dy) * 2 + (i >> 1), color)
      })
    }
  }
}

// Une histoire : des actes joués l'un après l'autre, chacun avec son temps à lui,
// puis on recommence. Chaque acte reçoit aussi sa progression de 0 à 1.
export type Act = readonly [seconds: number, draw: (c: Canvas, t: number, progress: number) => void]

export const story = (acts: readonly Act[]): Draw => {
  const total = acts.reduce((sum, [seconds]) => sum + seconds, 0)
  return (c, t) => {
    let local = t % total
    for (const [seconds, draw] of acts) {
      if (local < seconds) return draw(c, local, local / seconds)
      local -= seconds
    }
  }
}

// Une croche de 3×5 px.
export const note = (c: Canvas, x: number, y: number, color: Color) => {
  c.rect(x, y + 3, 2, 2, color)
  c.line(x + 1, y, x + 1, y + 3, color)
  c.set(x + 2, y, color)
  c.set(x + 2, y + 1, color)
}

export const NOTE_COLORS = [0xf472b6, 0x67e8f9, 0xfde047, 0xa78bfa]

// Des notes qui montent autour de `cx` et disparaissent.
export const floatingNotes = (c: Canvas, t: number, cx: number, count: number, spread = 14) => {
  for (let i = 0; i < count; i++) {
    const life = (t * 0.7 + i / count) % 1
    const side = i % 2 === 0 ? -1 : 1
    const x = cx + side * (spread + 4 * noise(i)) + Math.sin(life * 6 + i) * 1.5
    if (life < 0.85) note(c, x, GROUND - 6 - life * 9, NOTE_COLORS[i % NOTE_COLORS.length]!)
  }
}

// Des étincelles qui scintillent au hasard autour d'un point.
export const sparkles = (c: Canvas, t: number, cx: number, cy: number, spread: number, color: Color = 0xfef3c7, count = 5) => {
  const frame = Math.floor(t * 10)
  for (let i = 0; i < count; i++) {
    const seed = frame * 7 + i * 13
    if (noise(seed) > 0.6) continue
    const sx = cx + (noise(seed + 1) - 0.5) * spread * 2
    const sy = cy + (noise(seed + 2) - 0.5) * spread
    if (c.res === 1) {
      c.set(sx, sy, color)
      continue
    }
    // En haute définition, une petite croix qui scintille, le cœur plus clair.
    const arm = 1 / c.res
    c.fine(sx, sy, mix(color, 0xffffff, 0.6))
    for (const [ox, oy] of [[-arm, 0], [arm, 0], [0, -arm], [0, arm]] as const) c.fine(sx + ox, sy + oy, color)
  }
}

// Un ciel étoilé qui scintille et défile vers la gauche à `drift` px/s.
export const starfield = (c: Canvas, t: number, drift: number, count = 22) => {
  for (let i = 0; i < count; i++) {
    const x = (noise(i * 3.1 + 17) * c.w - t * drift * (0.5 + noise(i + 50))) % c.w
    const shine = 0.5 + 0.5 * Math.sin(t * (1 + noise(i + 7) * 3) + i)
    c.dot(x < 0 ? x + c.w : x, noise(i + 100) * (STAGE_H - 2), mix(0x334155, 0xf8fafc, shine))
  }
}

// Des particules qui tombent (pluie, neige, confettis…), chacune à sa colonne.
export const falling = (
  c: Canvas,
  t: number,
  { count, speed, color, length = 1, sway = 0, colors }: { count: number; speed: number; color: Color; length?: number; sway?: number; colors?: readonly Color[] },
) => {
  for (let i = 0; i < count; i++) {
    const x0 = noise(i * 7.3) * c.w
    const y = ((noise(i * 1.9) * STAGE_H + t * speed * (0.7 + 0.6 * noise(i + 3))) % (STAGE_H + length)) - length
    const x = x0 + Math.sin(t * 2 + i) * sway
    const tint = colors ? colors[i % colors.length]! : color
    if (c.res === 1) for (let k = 0; k < length; k++) c.set(x - k * 0.3, y + k, tint)
    // En haute définition : la pluie en trait fin et continu ; les confettis tournoient
    // (tantôt à plat, tantôt debout) ; la neige en flocons de deux tailles, pour la profondeur.
    else if (length > 1) for (let k = 0; k < length * c.res; k++) c.fine(x - (k / c.res) * 0.3, y + k / c.res, tint)
    else if (colors) {
      const isFlat = Math.floor(t * 6 + i) % 2 === 0
      c.fine(x, y, tint)
      c.fine(x + (isFlat ? 0.5 : 0), y + (isFlat ? 0 : 0.5), tint)
    } else if (i % 3 === 0) c.set(x, y, tint)
    else c.fine(x, y, tint)
  }
}

// Des bulles qui montent en oscillant.
export const bubbles = (c: Canvas, t: number, count: number, color: Color = 0xbae6fd) => {
  for (let i = 0; i < count; i++) {
    const x = noise(i * 5.1) * c.w + Math.sin(t * 3 + i) * 1.2
    const y = STAGE_H - (((t * (3 + noise(i) * 4) + noise(i + 9) * STAGE_H) % (STAGE_H + 2)))
    if (c.res === 1) {
      c.set(x, y, color)
      if (i % 3 === 0) c.set(x + 1, y, mix(color, 0x000000, 0.4))
      continue
    }
    // En haute définition, une bulle ronde et creuse avec son reflet.
    const f = 1 / c.res
    for (const [ox, oy] of [[0, -f], [-f, 0], [f, 0], [0, f]] as const) c.fine(x + ox, y + oy, color)
    c.fine(x - f, y - f, 0xffffff)
  }
}

// Un sol plein d'une couleur, avec quelques variations.
export const ground = (c: Canvas, color: Color, speckle: Color, seed = 0) => {
  for (let x = 0; x < c.w; x++) c.set(x, GROUND, noise(x + seed) > 0.85 ? speckle : color)
}

// Des vagues qui roulent sur les deux rangées du bas.
export const waves = (c: Canvas, t: number, color: Color = 0x0ea5e9, foam: Color = 0xe0f2fe) => {
  for (let x = 0; x < c.w; x++) {
    const h = Math.sin(x * 0.35 - t * 3) + Math.sin(x * 0.13 + t * 1.3)
    c.set(x, GROUND, color)
    if (h > 0.2) c.set(x, GROUND - 1, h > 1.2 ? foam : color)
  }
}

// Un flash qui illumine toute la scène (éclair, projecteur) : un cadre clair.
export const flash = (c: Canvas, color: Color) => {
  for (let x = 0; x < c.w; x += 2) {
    c.dot(x, 0, color)
    c.dot(x + 1, 1, color)
  }
}
