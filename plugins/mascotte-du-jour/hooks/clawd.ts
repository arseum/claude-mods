// Le petit personnage orange de Claude Code, en pixel art, posable :
// un corps de 16×8 px, deux yeux, deux bras et quatre jambes. En mode mini
// (terminal bas), le même personnage en 12×5, les pieds au même endroit.

import type { Canvas, Color } from './canvas'

export const BODY_W = 16
export const BODY_H = 8
export const LEG_H = 3
// Hauteur totale, du haut du corps au bas des pieds.
export const FIGURE_H = BODY_H + LEG_H

export const ORANGE = 0xd97757
const ORANGE_LIGHT = 0xe89a7e
const ORANGE_DARK = 0xb85f44
const EYE = 0x1f1e1d
// Les nuances en plus du personnage en haute définition (taille géante).
const ORANGE_SHINE = 0xf3bea9
const ORANGE_EDGE = 0xc8694c
const FOOT = 0x8f4a35
const GLINT = 0xffffff
const BLUSH = 0xf29a8a

export type Eyes = 'open' | 'closed' | 'happy' | 'wide' | 'square' | 'none'

export type Pose = {
  // Coin haut gauche du corps.
  x: number
  y: number
  // Angle de chaque bras en degrés : 0 à l'horizontale, 90 en l'air, -90 le long du corps.
  arms?: readonly [number, number]
  // De combien chaque jambe est relevée, de 0 à 2.
  legs?: readonly [number, number, number, number]
  eyes?: Eyes
  eyeColor?: Color
  // Où regardent les yeux, en pixels (négatif : à gauche).
  look?: number
  // Positif : écrasé (plus large, plus bas) ; négatif : étiré.
  squash?: number
  // Décalage horizontal du haut du corps par rapport au bas.
  lean?: number
  // Largeur du corps, pour une vue de profil pendant une toupie.
  width?: number
}

// Les proportions du personnage : la taille normale et la mini.
type Size = {
  bodyW: number
  bodyH: number
  legH: number
  legW: number
  legXs: (w: number) => readonly number[]
  eyeW: number
  eyeH: number
  eyeTop: number
  eyeInset: number
  shoulderRow: number
  armSteps: number
  armThick: number
  scale: number
}

const FULL: Size = {
  bodyW: BODY_W,
  bodyH: BODY_H,
  legH: LEG_H,
  legW: 2,
  legXs: w => [2, 5, w - 7, w - 4],
  eyeW: 2,
  eyeH: 3,
  eyeTop: 2,
  eyeInset: 4,
  shoulderRow: 3,
  armSteps: 4,
  armThick: 2,
  scale: 1,
}

const MINI: Size = {
  bodyW: 12,
  bodyH: 5,
  legH: 2,
  legW: 1,
  legXs: w => [1, 3, w - 4, w - 2],
  eyeW: 1,
  eyeH: 2,
  eyeTop: 1,
  eyeInset: 3,
  shoulderRow: 2,
  armSteps: 3,
  armThick: 1,
  scale: 0.75,
}

let size = FULL

// Bascule tous les dessins suivants en mini (ou les remet en taille normale).
export const setMini = (isMini: boolean) => {
  size = isMini ? MINI : FULL
}

// Où se trouve le haut de la tête pour une pose : en mini, le corps est plus bas
// pour garder les pieds au même endroit.
export const headTop = (pose: Pose) => Math.round(pose.y) + FIGURE_H - (size.bodyH + size.legH)

// La géométrie d'une pose à la taille courante : où sont le corps, les épaules, les mains.
const layout = (pose: Pose) => {
  const squash = Math.round(pose.squash ?? 0)
  const fullW = pose.width ?? BODY_W
  const w = Math.round(fullW * size.scale) + squash * 2
  const h = size.bodyH - squash
  const x = Math.round(pose.x + (fullW - Math.round(fullW * size.scale)) / 2) - squash
  const y = headTop(pose) + squash
  const lean = (pose.lean ?? 0) * size.scale
  const shiftAt = (row: number) => Math.round(lean * (1 - row / Math.max(1, h - 1)))
  const t = size.armThick
  const armPoints = (side: -1 | 1) => {
    const angle = (pose.arms ?? [-60, -60])[side < 0 ? 0 : 1]
    const rad = (angle * Math.PI) / 180
    const fromX = side < 0 ? x + shiftAt(size.shoulderRow) - t : x + shiftAt(size.shoulderRow) + w
    const sy = y + size.shoulderRow
    return Array.from({ length: size.armSteps }, (_, i) => ({
      x: Math.round(fromX + Math.cos(rad) * side * i * 1.2),
      y: Math.round(sy - Math.sin(rad) * i * 1.2),
    }))
  }
  return { x, y, w, h, shiftAt, armPoints }
}

// Le haut du corps : là où se posent les chapeaux (centre et rangée du haut).
export const crown = (pose: Pose) => {
  const { x, y, w, shiftAt } = layout(pose)
  return { cx: x + shiftAt(0) + w / 2, top: y, w }
}

// Le bout d'un bras (-1 : gauche, 1 : droite), là où se tient un accessoire.
export const hand = (pose: Pose, side: -1 | 1) => {
  const points = layout(pose).armPoints(side)
  const last = points[points.length - 1]!
  return { x: last.x + (side > 0 ? size.armThick - 1 : 0), y: last.y }
}

// L'échelle courante du personnage (1, ou 0.75 en mini) pour dimensionner les accessoires.
export const figureScale = () => size.scale

export const drawClawd = (c: Canvas, pose: Pose) => {
  if (c.res > 1 && size === FULL) return drawClawdHD(c, pose)
  const { x, y, w, h, shiftAt, armPoints } = layout(pose)

  // Jambes, deux de chaque côté comme sur le logo.
  const legs = pose.legs ?? [0, 0, 0, 0]
  size.legXs(w).forEach((lx, i) => {
    const lift = Math.min(size.legH - 1, Math.max(0, legs[i] ?? 0))
    c.rect(x + lx, y + h, size.legW, size.legH - lift, ORANGE_DARK)
  })

  // Corps, rangée par rangée pour pouvoir le pencher.
  for (let row = 0; row < h; row++) {
    const color = row === 0 ? ORANGE_LIGHT : row === h - 1 ? ORANGE_DARK : ORANGE
    c.rect(x + shiftAt(row), y + row, w, 1, color)
  }

  // Bras : des carrés qui partent des épaules.
  for (const side of [-1, 1] as const) {
    for (const p of armPoints(side)) c.rect(p.x, p.y, size.armThick, size.armThick, ORANGE)
  }

  drawEyes(c, x, y, w, pose, shiftAt(size.shoulderRow))
}

const drawEyes = (c: Canvas, x: number, y: number, w: number, pose: Pose, shift: number) => {
  const eyes = pose.eyes ?? 'open'
  if (eyes === 'none') return
  const color = pose.eyeColor ?? EYE
  const look = Math.round((pose.look ?? 0) * size.scale)
  const isProfile = (pose.width ?? BODY_W) < BODY_W
  const { eyeW, eyeH, eyeTop } = size
  const eyeXs = isProfile ? [Math.round(w / 2) - 1] : [size.eyeInset, w - size.eyeInset - eyeW]
  const bottom = y + eyeTop + eyeH - 1

  for (const offset of eyeXs) {
    const ex = x + offset + look + shift
    switch (eyes) {
      case 'open':
        c.rect(ex, y + eyeTop, eyeW, eyeH, color)
        break
      case 'wide':
        c.rect(ex, y + eyeTop - 1, eyeW, eyeH + 1, color)
        break
      case 'closed':
        c.rect(ex, bottom, eyeW, 1, color)
        break
      case 'happy':
        c.set(ex - 1, bottom, color)
        c.rect(ex, bottom - 1, eyeW, 1, color)
        c.set(ex + eyeW, bottom, color)
        break
      case 'square':
        c.rect(ex, y + eyeTop, eyeW, Math.min(2, eyeH), color)
        break
    }
  }
}

// Clignement naturel : les yeux se ferment brièvement toutes les ~3,5 s.
export const blink = (t: number, eyes: Eyes = 'open'): Eyes => (t % 3.7 < 0.15 ? 'closed' : eyes)

// Le personnage en haute définition, sur une toile à `res` 2 : la même pose et la
// même place, mais un corps aux coins arrondis, avec reflet, ombre et contour, des
// bras lisses, des pieds et des yeux qui brillent.
const drawClawdHD = (c: Canvas, pose: Pose) => {
  const { x, y, w, h, armPoints } = layout(pose)
  const res = c.res
  const lean = pose.lean ?? 0
  // Le décalage du haut du corps, rangée réelle par rangée réelle : un penché sans marches.
  const shiftAt = (row: number) => Math.round(lean * (1 - row / Math.max(1, h * res - 1)) * res)
  const put = (rx: number, ry: number, color: Color) => c.fine(rx / res, ry / res, color)

  // Les jambes, avec un pied plus sombre.
  const legs = pose.legs ?? [0, 0, 0, 0]
  size.legXs(w).forEach((lx, i) => {
    const lift = Math.min(size.legH - 1, Math.max(0, legs[i] ?? 0))
    // Des mesures en pixels entiers : à une finesse de 1,25 ou 1,5, toutes les jambes restent égales.
    const top = Math.round((y + h) * res)
    const tall = Math.round((y + h + size.legH - lift) * res) - top
    const left = Math.round((x + lx) * res)
    const legW = Math.max(1, Math.round(size.legW * res) - 1)
    for (let dy = 0; dy < tall; dy++) for (let dx = 0; dx < legW; dx++) put(left + dx, top + dy, dy === tall - 1 ? FOOT : ORANGE_DARK)
  })

  // Le corps : rangées réelles, coins arrondis, reflet en haut, ombre en bas, bords plus sombres.
  const rows = Math.round((y + h) * res) - Math.round(y * res)
  const cols = Math.round(w * res)
  const bodyTop = Math.round(y * res)
  for (let row = 0; row < rows; row++) {
    const left = Math.round(x * res) + shiftAt(row)
    const isEdgeRow = row === 0 || row === rows - 1
    for (let col = isEdgeRow ? 1 : 0; col < (isEdgeRow ? cols - 1 : cols); col++) {
      const isSide = col === 0 || col === cols - 1
      const color =
        row === 0 ? ORANGE_LIGHT : row === 1 ? (col > 2 && col < cols * 0.45 ? ORANGE_SHINE : ORANGE_LIGHT) : row >= rows - 2 ? ORANGE_DARK : isSide ? ORANGE_EDGE : ORANGE
      put(left + col, bodyTop + row, color)
    }
  }

  // Les bras : un trait lisse de l'épaule à la main.
  const t = size.armThick
  for (const side of [-1, 1] as const) {
    const points = armPoints(side)
    // Le trait part de l'intérieur de l'épaule, pour que le bras tienne au corps.
    const from = { x: points[0]!.x - side * (t / 2), y: points[0]!.y }
    const to = points[points.length - 1]!
    const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) * res * 1.5))
    for (let i = 0; i <= steps; i++) {
      const k = i / steps
      const cx = Math.round((from.x + (to.x - from.x) * k + t / 2) * res)
      const cy = Math.round((from.y + (to.y - from.y) * k + t / 2) * res)
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) put(cx + dx, cy + dy, dy === 1 ? ORANGE_EDGE : ORANGE)
    }
  }

  drawEyesHD(c, x, y, w, pose, shiftAt(size.shoulderRow * res))
}

const drawEyesHD = (c: Canvas, x: number, y: number, w: number, pose: Pose, shift: number) => {
  const eyes = pose.eyes ?? 'open'
  if (eyes === 'none') return
  const res = c.res
  const put = (rx: number, ry: number, color: Color) => c.fine(rx / res, ry / res, color)
  const color = pose.eyeColor ?? EYE
  const look = Math.round((pose.look ?? 0) * res)
  const isProfile = (pose.width ?? BODY_W) < BODY_W
  // Des yeux en pixels entiers, pour qu'ils soient identiques à toute finesse.
  // Sous la double finesse, des yeux de 2 pixels de large : 3 donnerait une forme de croix.
  const ew = res < 2 ? 2 : Math.round(size.eyeW * res)
  const eh = Math.max(3, Math.round(size.eyeH * res))
  const offsets = isProfile ? [Math.round(w / 2) - 1] : [size.eyeInset, w - size.eyeInset - size.eyeW]
  const top = Math.round((y + size.eyeTop) * res)
  const bottom = top + eh - 1

  // Un œil plein aux coins arrondis, avec son point de lumière.
  const filled = (ex: number, from: number, to: number) => {
    for (let ry = from; ry <= to; ry++) {
      for (let dx = 0; dx < ew; dx++) {
        const isCorner = ew > 2 && (ry === from || ry === to) && (dx === 0 || dx === ew - 1)
        if (!isCorner) put(ex + dx, ry, color)
      }
    }
    if (color === EYE) put(ex + ew - (ew > 2 ? 2 : 1), from + (ew > 2 ? 1 : 0), GLINT)
  }

  offsets.forEach((offset, i) => {
    const ex = Math.round((x + offset) * res) + look + shift
    switch (eyes) {
      case 'open':
        filled(ex, top, bottom)
        break
      case 'wide':
        filled(ex, top - Math.round(res), bottom)
        break
      case 'square':
        filled(ex, top, top + Math.min(2 * res, eh) - 1)
        break
      case 'closed':
        for (let dx = 0; dx < ew; dx++) put(ex + dx, bottom, color)
        put(ex - 1, bottom - 1, color)
        put(ex + ew, bottom - 1, color)
        break
      case 'happy': {
        // Un arc fin, et une joue rose du côté extérieur.
        for (let dx = 1; dx < ew - 1; dx++) put(ex + dx, bottom - 2, color)
        put(ex, bottom - 1, color)
        put(ex + ew - 1, bottom - 1, color)
        put(ex - 1, bottom, color)
        put(ex + ew, bottom, color)
        const cheek = i === 0 ? ex - 2 : ex + ew
        if (!isProfile) for (let dx = 0; dx < 3; dx++) put(cheek + dx - (i === 0 ? 0 : 1), bottom + 2, BLUSH)
        break
      }
    }
  })
}
