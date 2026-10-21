import { type Canvas, mix } from '../canvas'
import { blink, crown, drawClawd, figureScale, hand, type Pose } from '../clawd'
import { BASE_Y, centerX, ease, falling, hop, lerp, sparkles, sprite, story, walkLegs } from './common'
import { GROUND, type Theme } from './theme'

const HOOD = 0x52525b
const HOOD_LIGHT = 0x71717a
const KNOT = 0xdc2626
const TILE = 0x475569
const TILE_LIGHT = 0x64748b
const BAMBOO = 0x65a30d
const BAMBOO_DARK = 0x3f6212
const STEEL = 0xe5e7eb
const PETALS = [0xfbcfe8, 0xf9a8d4]

// Le ninja : une cagoule sombre qui ne laisse qu'une fente pour les yeux, et
// les deux pans du nœud qui flottent derrière la tête.
const ninja = (c: Canvas, pose: Pose, t = 0) => {
  drawClawd(c, pose)
  const { cx, top, w } = crown(pose)
  const isMini = figureScale() < 1
  const slitTop = isMini ? 1 : 2
  const slitH = isMini ? 2 : 3
  const bodyH = isMini ? 5 : 8
  const left = cx - w / 2
  c.rect(left, top, w, slitTop, HOOD)
  c.rect(left + 1, top, w - 2, 1, HOOD_LIGHT)
  c.rect(left, top + slitTop + slitH, w, bodyH - slitTop - slitH, HOOD)
  const flutter = Math.round(Math.sin(t * 8))
  c.line(left - 1, top + 1, left - 4, top + 1 + flutter, KNOT)
  c.line(left - 1, top + 1, left - 4, top + 3 - flutter, KNOT)
}

// Un toit de tuiles, et quelques pétales de cerisier qui volent.
const rooftop = (c: Canvas, t: number, petals = 8) => {
  for (let x = 0; x < c.w; x++) c.set(x, GROUND, x % 4 === 0 ? TILE_LIGHT : TILE)
  falling(c, t, { count: petals, speed: 2.5, color: PETALS[0]!, sway: 2, colors: PETALS })
}

// Un shuriken de 3×3 px qui tourne.
const shuriken = (c: Canvas, x: number, y: number, t: number) => {
  const isStraight = Math.floor(t * 12) % 2 === 0
  c.set(x, y, STEEL)
  for (const [dx, dy] of isStraight ? ([[-1, 0], [1, 0], [0, -1], [0, 1]] as const) : ([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const)) c.set(x + dx, y + dy, STEEL)
}

const TARGET = ['.rrrr.', 'rwwwwr', 'rwrrwr', 'rwrrwr', 'rwwwwr', '.rrrr.', '..bb..', '..bb..', '..bb..']
const TARGET_COLORS = { r: 0xdc2626, w: 0xf8fafc, b: 0x92400e }

// Une tige de bambou de `height` px ; coupée, son haut est en `fallen` (de 0 à 1 : il tombe).
const bamboo = (c: Canvas, x: number, height: number, cutAt?: number, fallen = 0) => {
  for (let k = 0; k < height; k++) {
    const y = GROUND - 1 - k
    if (cutAt !== undefined && k >= cutAt) {
      const drop = ease(fallen) * cutAt
      c.set(x + Math.round(fallen * 3), y + drop, k % 4 === 0 ? BAMBOO_DARK : BAMBOO)
    } else c.set(x, y, k % 4 === 0 ? BAMBOO_DARK : BAMBOO)
  }
}

// Un nuage de fumée qui gonfle autour de `(x, y)` puis se dissipe ; `k` de 0 à 1.
const smoke = (c: Canvas, x: number, y: number, k: number) => {
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    const r = 1 + k * 6
    c.disc(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.5, 2 + r * 0.4 - k * 1.5, mix(i % 2 ? 0xe5e7eb : 0xcbd5e1, 0x6b7280, k))
  }
}

const MELON = ['.gggg.', 'gGgGgg', 'gggGgg', '.gggg.']
const MELON_HALF = ['gggg', 'rrrr', '.rk.']

export const ninjaTheme: Theme = {
  id: 'ninja',
  name: 'Ninja',
  emoji: '🥷',
  pitch: 'une cagoule de ninja, des shurikens, des bambous tranchés net, une bombe fumigène, une course sur les toits, une pastèque coupée en plein vol, des cerisiers en fleur',
  dress: (c, pose, t) => ninja(c, pose, t),
  scene: (c, t) => rooftop(c, t, 5),
  sky: 'open',
  // La fête : il disparaît et réapparaît d'un bout à l'autre dans des bouffées de fumée et de pétales.
  cheer: (c, t) => {
    const spots = [centerX(c) - 14, centerX(c) + 14, centerX(c)]
    const period = 0.9
    const i = Math.floor(t / period) % spots.length
    const k = (t % period) / period
    const x = spots[i]!
    if (k > 0.25) ninja(c, { x, y: BASE_Y - Math.round(hop((k - 0.25) / 0.75) * 3), arms: [80, 80], eyes: 'happy' }, t)
    if (k < 0.5) smoke(c, x + 8, BASE_Y + 5, k * 2)
    for (let p = 0; p < 8; p++) {
      const a = (p / 8) * Math.PI * 2
      c.dot(x + 8 + Math.cos(a) * (3 + k * 9), BASE_Y + 4 + Math.sin(a) * (2 + k * 5), PETALS[p % 2]!)
    }
  },

  idle: {
    id: 'meditation',
    name: 'médite sous les pétales',
    draw: (c, t) => {
      rooftop(c, t)
      const breathe = Math.round(Math.sin(t * 1.2) * 0.6)
      ninja(c, { x: centerX(c), y: BASE_Y + 1 + breathe, arms: [-20, -20], squash: 1, eyes: 'closed' }, t)
    },
  },

  anims: [
    {
      id: 'shurikens',
      name: 'Lancer de shurikens',
      draw: (c, t) => {
        rooftop(c, t, 4)
        const tx = c.w - 10
        sprite(c, tx, GROUND - 9, TARGET, TARGET_COLORS)
        const period = 1.2
        const k = (t % period) / period
        const throws = Math.floor(t / period)
        const pose: Pose = { x: 6, y: BASE_Y, arms: [-40, k < 0.25 ? 50 : 0], lean: k < 0.25 ? -1 : 1, eyes: 'square', look: 2 }
        ninja(c, pose, t)
        // Le shuriken vole jusqu'à la cible ; les précédents y restent plantés.
        const h = hand(pose, 1)
        if (k >= 0.25) shuriken(c, lerp(h.x + 2, tx + 3, (k - 0.25) / 0.6), GROUND - 7 + (throws % 3) - 1, t)
        for (let i = 0; i < Math.min(3, throws % 4); i++) c.set(tx + 2 + i, GROUND - 7 + i - 1, STEEL)
      },
    },
    {
      id: 'bambous',
      name: 'Bambous tranchés net',
      draw: story([
        [2.5, (c, t) => {
          rooftop(c, t, 4)
          for (let i = 0; i < 3; i++) bamboo(c, c.w - 22 + i * 6, 11 + (i % 2) * 2)
          ninja(c, { x: 4, y: BASE_Y + 1, arms: [-70, -70], squash: 1, eyes: 'closed', look: 2 }, t)
        }],
        [0.4, (c, t, p) => {
          rooftop(c, t, 4)
          for (let i = 0; i < 3; i++) bamboo(c, c.w - 22 + i * 6, 11 + (i % 2) * 2)
          // Un éclair blanc : il traverse la scène d'un trait.
          const x = lerp(4, c.w - 18, p)
          c.line(4, BASE_Y + 4, x + 8, BASE_Y + 3, 0xffffff)
          ninja(c, { x, y: BASE_Y, arms: [0, 0], lean: 3, eyes: 'square', look: 2 }, t)
        }],
        [3, (c, t, p) => {
          rooftop(c, t, 4)
          for (let i = 0; i < 3; i++) bamboo(c, c.w - 22 + i * 6, 11 + (i % 2) * 2, 6, Math.min(1, p * 2 - i * 0.2))
          const pose: Pose = { x: c.w - 18, y: BASE_Y, arms: [-60, 70], eyes: p > 0.4 ? 'happy' : 'square', look: -2 }
          ninja(c, pose, t)
          const h = hand(pose, 1)
          c.line(h.x + 1, h.y, h.x + 1, h.y - 6, STEEL)
        }],
      ]),
    },
    {
      id: 'fumigene',
      name: 'Bombe fumigène',
      draw: story([
        [2, (c, t) => {
          rooftop(c, t, 4)
          ninja(c, { x: 6, y: BASE_Y, arms: [-60, 30], eyes: blink(t), look: 2 }, t)
        }],
        [1.2, (c, t, p) => {
          rooftop(c, t, 4)
          if (p < 0.35) ninja(c, { x: 6, y: BASE_Y, arms: [-60, -60], eyes: 'closed' }, t)
          smoke(c, 14, BASE_Y + 5, p)
        }],
        [1, (c, t) => rooftop(c, t, 4)],
        [1.2, (c, t, p) => {
          rooftop(c, t, 4)
          const x = c.w - 22
          if (p > 0.5) ninja(c, { x, y: BASE_Y, arms: [80, 80], eyes: 'happy', look: -2 }, t)
          smoke(c, x + 8, BASE_Y + 5, p)
        }],
        [2, (c, t) => {
          rooftop(c, t, 4)
          ninja(c, { x: c.w - 22, y: BASE_Y - Math.round(hop((t * 2) % 1) * 2), arms: [-60, 70], eyes: 'happy', look: -2 }, t)
        }],
      ]),
    },
    {
      id: 'toits',
      name: 'Course sur les toits',
      draw: (c, t) => {
        // Des toits qui défilent, séparés par des ruelles à sauter.
        const scroll = t * 16
        const span = 28
        const gapAt = (wx: number) => ((wx % span) + span) % span > span - 6
        for (let x = 0; x < c.w; x++) {
          const wx = x + scroll
          if (gapAt(wx)) continue
          c.set(x, GROUND, Math.floor(wx) % 4 === 0 ? TILE_LIGHT : TILE)
          c.set(x, GROUND - 1, Math.floor(wx) % 4 === 0 ? TILE_LIGHT : TILE)
        }
        falling(c, t, { count: 5, speed: 2.5, color: PETALS[0]!, sway: 2, colors: PETALS })
        const x = centerX(c) - 6
        // Il saute au-dessus de chaque ruelle.
        const feet = x + 8 + scroll
        const phase = ((feet + 10) % span) / 14
        const air = phase < 1 ? hop(phase) : 0
        ninja(c, { x, y: BASE_Y - 1 - Math.round(air * 4), arms: air > 0 ? [60, 20] : [-20, 20], legs: air > 0 ? [1, 1, 1, 1] : walkLegs(t, 10), lean: 2, eyes: 'square', look: 2 }, t)
        for (let i = 0; i < 3; i++) c.dot(x - 3 - ((t * 24 + i * 6) % 14), BASE_Y + 3 + i * 2, 0x94a3b8)
      },
    },
    {
      id: 'pasteque',
      name: 'La pastèque coupée en plein vol',
      draw: story([
        [1.6, (c, t, p) => {
          rooftop(c, t, 4)
          // La pastèque lancée depuis la droite monte en tournant.
          const mx = lerp(c.w + 2, centerX(c) + 18, p)
          const my = lerp(GROUND - 4, 1, ease(p))
          sprite(c, mx, my, MELON, { g: 0x15803d, G: 0x22c55e }, Math.floor(t * 6) % 2 === 0)
          ninja(c, { x: centerX(c) - 8, y: BASE_Y, arms: [-60, 20], eyes: 'square', look: 2 }, t)
        }],
        [0.3, (c, t) => {
          rooftop(c, t, 4)
          const pose: Pose = { x: centerX(c) - 8, y: BASE_Y - 3, arms: [-60, 70], lean: 2, eyes: 'wide', look: 2 }
          ninja(c, pose, t)
          const mx = centerX(c) + 18
          c.line(mx - 4, 6, mx + 9, 0, 0xffffff)
          sprite(c, mx, 1, MELON, { g: 0x15803d, G: 0x22c55e })
        }],
        [3, (c, t, p) => {
          rooftop(c, t, 4)
          // Les deux moitiés retombent bien rangées, côte à côte.
          const mx = centerX(c) + 18
          const fall = ease(Math.min(1, p * 1.6))
          sprite(c, mx - 3 * fall, lerp(1, GROUND - 3, fall), MELON_HALF, { g: 0x15803d, r: 0xf43f5e, k: 0x1c1917 })
          sprite(c, mx + 4 + 2 * fall, lerp(1, GROUND - 3, fall), MELON_HALF, { g: 0x15803d, r: 0xf43f5e, k: 0x1c1917 })
          ninja(c, { x: centerX(c) - 8, y: BASE_Y, arms: [-70, -70], eyes: p > 0.6 ? 'happy' : 'closed', look: 2 }, t)
          if (p > 0.6) sparkles(c, t, mx + 4, GROUND - 5, 4, 0xfecdd3, 3)
        }],
      ]),
    },
  ],
}
