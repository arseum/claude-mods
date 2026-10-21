import { type Canvas, mix, noise } from '../canvas'
import { blink, crown, drawClawd, figureScale, hand, type Pose } from '../clawd'
import { BASE_Y, centerX, ease, hop, lerp, sparkles, sprite, story, walkLegs } from './common'
import { GROUND, type Theme } from './theme'

const CAPE = 0xdc2626
const CAPE_DARK = 0x991b1b
const EMBLEM = 0xfacc15
const ASPHALT = 0x52525b
const ASPHALT_LIGHT = 0x71717a
const BUILDING = 0x2e2e33
const WINDOW_LIT = 0x8a7a4a

// La cape, accrochée aux épaules, qui flotte vers `side` (-1 : à gauche) ;
// `streaming` de 0 (elle pend) à 1 (à l'horizontale, en plein vol).
const cape = (c: Canvas, pose: Pose, t: number, side: -1 | 1 = -1, streaming = 0.3) => {
  const { cx, top, w } = crown(pose)
  const s = figureScale()
  const anchor = cx + side * (w / 2 - 1)
  const length = Math.round(10 * s)
  for (let k = 0; k < length; k++) {
    const along = k / length
    const wave = Math.sin(t * 10 - k * 0.8) * along * 1.2
    const x = anchor + side * along * length * streaming * 1.2
    const y = top + 1 + along * length * (1 - streaming * 0.85) + wave
    c.line(x, y, x - side * Math.round(4 * s), y + 1, k % 3 === 0 ? CAPE_DARK : CAPE)
  }
}

// Le super-héros : la cape derrière lui, et une ceinture dorée à boucle.
const hero = (c: Canvas, pose: Pose, t: number, side: -1 | 1 = -1, streaming = 0.3) => {
  cape(c, pose, t, side, streaming)
  drawClawd(c, pose)
  const { cx, top, w } = crown(pose)
  const row = top + (figureScale() < 1 ? 4 : 7) - Math.round(pose.squash ?? 0)
  c.rect(cx - w / 2, row, w, 1, EMBLEM)
  c.rect(cx - 1, row, 2, 1, 0xb45309)
}

// La ville : des immeubles aux fenêtres allumées, qui défilent de `scroll` px, et la rue.
const city = (c: Canvas, scroll = 0) => {
  const block = 11
  for (let i = -1; i < Math.ceil(c.w / block) + 1; i++) {
    const n = Math.floor(scroll / block) + i
    const bx = i * block - (scroll % block)
    const height = 3 + Math.round(noise(n * 3.7) * 5)
    c.rect(bx, GROUND - height, block - 2, height, BUILDING)
    for (let wy = GROUND - height + 1; wy < GROUND - 1; wy += 2) {
      for (let wx = 1; wx < block - 3; wx += 2) if (noise(n * 31 + wx * 7 + wy) > 0.7) c.set(bx + wx, wy, WINDOW_LIT)
    }
  }
  for (let x = 0; x < c.w; x++) c.set(x, GROUND, Math.floor(x + scroll) % 6 < 3 ? ASPHALT : ASPHALT_LIGHT)
}

const CAT = ['k...k', 'kkkkk', 'kwkwk', 'kkkkk', '.kkk.']
const CAT_COLORS = { k: 0xd4d4d8, w: 0x16a34a }
const TREE = ['..gggggg..', '.gggggggg.', 'gggggggggg', '.gggggggg.', '....tt....', '....tt....', '....tt....', '....tt....', '....tt....', '...tttt...']

const TRAIN = ['....rrrrrrrrrrrrr', '...rrwwrwwrwwrrrr', '..rrrwwrwwrwwrrrr', '.yrrrrrrrrrrrrrrr', 'rrrrrrrrrrrrrrrrr', '.kk..kk.....kk..k']
const TRAIN_COLORS = { r: 0x2563eb, w: 0xbae6fd, y: 0xfde047, k: 0x1c1917 }

export const heroTheme: Theme = {
  id: 'super-heros',
  name: 'Super-héros',
  emoji: '🦸',
  pitch: 'une cape qui claque au vent, un vol au-dessus de la ville, un chat à sauver dans un arbre, un train arrêté à mains nues, une météorite repoussée, une cabine téléphonique',
  dress: (c, pose, t) => hero(c, pose, t),
  scene: c => city(c),
  sky: 'open',
  // La fête : un looping au-dessus de la ville, avec une traînée d'étoiles.
  cheer: (c, t) => {
    const a = t * 3
    const x = centerX(c) + Math.round(Math.cos(a) * 12)
    const y = BASE_Y - 3 + Math.round(Math.sin(a) * 2)
    for (let k = 1; k < 6; k++) {
      const b = a - k * 0.35
      sparkles(c, t + k, centerX(c) + 8 + Math.cos(b) * 12, BASE_Y + 3 + Math.sin(b) * 2, 1, EMBLEM, 1)
    }
    hero(c, { x, y, arms: [85, 85], legs: [2, 2, 2, 2], eyes: 'happy', look: Math.sin(a) > 0 ? -2 : 2 }, t, Math.sin(a) > 0 ? 1 : -1, 0.9)
  },

  idle: {
    id: 'pose-heroique',
    name: 'prend la pose, la cape au vent',
    draw: (c, t) => {
      city(c)
      // Les poings sur les hanches, le regard au loin.
      hero(c, { x: centerX(c), y: BASE_Y, arms: [-40, -40], eyes: blink(t), look: Math.round(Math.sin(t * 0.3) * 2) }, t, -1, 0.45 + Math.sin(t * 1.5) * 0.15)
    },
  },

  anims: [
    {
      id: 'envol',
      name: 'Envol au-dessus de la ville',
      draw: (c, t) => {
        city(c, t * 14)
        const x = centerX(c) - 4
        const y = BASE_Y - 3 + Math.round(Math.sin(t * 2) * 1.5)
        hero(c, { x, y, arms: [-70, 20], legs: [2, 2, 2, 2], lean: 2, eyes: 'happy', look: 2 }, t, -1, 1)
        for (let i = 0; i < 4; i++) c.dot(x - 10 - ((t * 30 + i * 7) % 20), y + 2 + i * 2, 0xe5e7eb)
      },
    },
    {
      id: 'chat',
      name: 'Le chat coincé dans l’arbre',
      draw: story([
        [2.5, (c, t) => {
          city(c)
          const tx = c.w - 16
          sprite(c, tx, GROUND - 10, TREE, { g: 0x16a34a, t: 0x78350f })
          sprite(c, tx + 3, GROUND - 14 + (Math.floor(t * 2) % 2), CAT, CAT_COLORS)
          hero(c, { x: 6, y: BASE_Y, arms: [-40, -40], eyes: blink(t), look: 2 }, t)
        }],
        [2, (c, t, p) => {
          city(c)
          const tx = c.w - 16
          sprite(c, tx, GROUND - 10, TREE, { g: 0x16a34a, t: 0x78350f })
          sprite(c, tx + 3, GROUND - 14, CAT, CAT_COLORS)
          // Il s'envole jusqu'à la branche.
          const x = lerp(6, tx - 12, ease(p))
          const y = lerp(BASE_Y, 0, hop(p * 0.5 + 0.5 * ease(p)))
          hero(c, { x, y, arms: [85, 20], legs: [2, 2, 2, 2], lean: 2, eyes: 'wide', look: 2 }, t, -1, 0.9)
        }],
        [3.5, (c, t, p) => {
          city(c)
          const tx = c.w - 16
          sprite(c, tx, GROUND - 10, TREE, { g: 0x16a34a, t: 0x78350f })
          // Il redescend, le chat bien calé sur la tête.
          const x = lerp(tx - 12, centerX(c) - 8, ease(p))
          const y = lerp(0, BASE_Y, ease(p * 1.5))
          const pose: Pose = { x, y, arms: p > 0.7 ? [80, 80] : [-30, -30], eyes: 'happy', look: -1 }
          hero(c, pose, t, 1, 0.3)
          const { cx, top } = crown(pose)
          sprite(c, cx - 2, top - 5, CAT, { ...CAT_COLORS, w: t % 2 < 1.8 ? 0x16a34a : 0xd4d4d8 })
        }],
      ]),
    },
    {
      id: 'train',
      name: 'Arrêter le train à mains nues',
      draw: story([
        [2.5, (c, t, p) => {
          city(c)
          const x = 6
          hero(c, { x, y: BASE_Y, arms: [0, 0], lean: 1, legs: [0, 0, 1, 0], eyes: 'square', look: 2 }, t, -1, 0.5)
          const tx = lerp(c.w + 2, x + 22, p)
          sprite(c, tx, GROUND - 6, TRAIN, TRAIN_COLORS)
          if (noise(Math.floor(t * 4)) > 0.5) c.dot(tx + 14, GROUND - 8, 0xd1d5db)
        }],
        [2, (c, t, p) => {
          city(c)
          // Le choc : il recule un peu, des étincelles sous les roues, puis plus rien ne bouge.
          const push = Math.round((1 - ease(p)) * 4)
          const x = 6 - Math.round(ease(Math.min(1, p * 3)) * 2)
          hero(c, { x, y: BASE_Y, arms: [0, 0], lean: 2, squash: 1, eyes: 'closed', look: 2 }, t, -1, 0.9)
          sprite(c, x + 22 - push + 2, GROUND - 6, TRAIN, TRAIN_COLORS)
          if (p < 0.7) sparkles(c, t, x + 30, GROUND - 1, 4, 0xfde047, 5)
        }],
        [3, (c, t) => {
          city(c)
          sprite(c, 26, GROUND - 6, TRAIN, TRAIN_COLORS)
          hero(c, { x: 4, y: BASE_Y - Math.round(hop((t * 1.5) % 1) * 2), arms: [-40, 85], eyes: 'happy', look: 2 }, t)
        }],
      ]),
    },
    {
      id: 'meteorite',
      name: 'Repousser la météorite',
      draw: story([
        [2.5, (c, t, p) => {
          city(c)
          // La météorite qui tombe en diagonale, avec sa traînée de feu.
          const mx = lerp(c.w - 6, centerX(c) + 12, p)
          const my = lerp(-2, 3, p)
          for (let k = 1; k < 9; k++) c.disc(mx + k * 1.3, my - k * 0.5, 1.4 - k * 0.12, mix(0xfde047, 0xdc2626, k / 9))
          c.disc(mx, my, 2.4, 0x78716c)
          c.set(mx - 1, my, 0x57534e)
          hero(c, { x: centerX(c) - 8, y: BASE_Y, arms: [-40, -40], squash: p > 0.6 ? 1 : 0, eyes: 'wide', look: 2 }, t)
        }],
        [0.6, (c, t) => {
          city(c)
          const pose: Pose = { x: centerX(c) - 6, y: BASE_Y - 5, arms: [-40, 75], legs: [2, 2, 2, 2], eyes: 'square', look: 2 }
          hero(c, pose, t, -1, 0.8)
          const h = hand(pose, 1)
          c.disc(h.x + 2, h.y - 2, 2.4, 0x78716c)
          sparkles(c, t, h.x + 2, h.y - 2, 4, 0xfde047, 6)
        }],
        [3, (c, t, p) => {
          city(c)
          // Elle repart dans l'espace, et devient une étoile.
          const sx = lerp(centerX(c) + 12, c.w - 4, ease(p))
          const sy = lerp(2, -1, ease(p))
          if (p < 0.8) c.disc(sx, sy, 2.4 * (1 - p), 0x78716c)
          else sparkles(c, t, c.w - 4, 1, 2, 0xfef9c3, 3)
          hero(c, { x: centerX(c) - 8, y: BASE_Y - Math.round(hop((t * 1.5) % 1) * 2), arms: [-40, 85], eyes: 'happy', look: 2 }, t)
        }],
      ]),
    },
    {
      id: 'cabine',
      name: 'Changement de costume',
      draw: story([
        [2.5, (c, t, p) => {
          city(c)
          const bx = centerX(c) + 8
          // Il arrive en simple passant, et entre dans la cabine.
          const x = lerp(-4, bx - 3, ease(p))
          c.rect(bx - 4, GROUND - 13, 12, 13, 0x1d4ed8)
          c.rect(bx - 2, GROUND - 11, 8, 8, 0x93c5fd)
          if (p < 0.85) drawClawd(c, { x, y: BASE_Y, arms: [-60, -60], legs: walkLegs(t, 4), eyes: blink(t), look: 2 })
        }],
        [1.5, (c, t) => {
          city(c)
          const bx = centerX(c) + 8
          // Dans la cabine, ça tourbillonne.
          c.rect(bx - 4, GROUND - 13, 12, 13, 0x1d4ed8)
          c.rect(bx - 2, GROUND - 11, 8, 8, 0x93c5fd)
          const spin = Math.floor(t * 12) % 4
          c.rect(bx - 1 + spin, GROUND - 9, 2, 4, spin % 2 ? 0xd97757 : CAPE)
          sparkles(c, t, bx + 2, GROUND - 7, 5, 0xffffff, 4)
        }],
        [3.5, (c, t, p) => {
          city(c)
          const bx = centerX(c) + 8
          c.rect(bx - 4, GROUND - 13, 12, 13, 0x1d4ed8)
          c.rect(bx - 2, GROUND - 11, 8, 8, 0x93c5fd)
          // Il en jaillit en super-héros et s'envole.
          const x = lerp(bx - 3, bx - 26, ease(p))
          const y = lerp(BASE_Y, BASE_Y - 3, ease(p))
          hero(c, { x, y, arms: [85, -40], legs: p > 0.3 ? [2, 2, 2, 2] : [0, 0, 0, 0], eyes: 'happy', look: -2 }, t, 1, 0.3 + p * 0.6)
        }],
      ]),
    },
  ],
}
