import { type Canvas, mix, noise } from '../canvas'
import { blink, crown, drawClawd, hand, type Pose } from '../clawd'
import { BASE_Y, centerX, ease, hop, lerp, sparkles, sprite, story, walkLegs } from './common'
import { GROUND, type Theme } from './theme'

const NEEDLES = 0x166534
const NEEDLES_LIGHT = 0x15803d
const TRUNK = 0x78350f
const FOREST_FLOOR = 0x4d7c0f
const KHAKI = 0xb8a16a
const KHAKI_DARK = 0x8a7546
const TENT = 0xea580c
const TENT_DARK = 0xc2410c
const STICK = 0xa16207

const HAT = ['...kkkkkkkk...', '...bbbbbbbb...', 'kkkkkkkkkkkkkk']
const HAT_COLORS = { k: KHAKI, b: KHAKI_DARK }

// Le randonneur : le personnage sous son chapeau de brousse.
const hiker = (c: Canvas, pose: Pose) => {
  drawClawd(c, pose)
  const { cx, top } = crown(pose)
  sprite(c, cx - 7, top - 3, HAT, HAT_COLORS)
}

const PINE = ['..g..', '.ggg.', '..g..', '.ggg.', 'ggggg', '.ggg.', 'ggggg', '..t..']

// La forêt : un sol d'aiguilles, et des sapins qui défilent de `scroll` px.
const forest = (c: Canvas, scroll = 0) => {
  for (let x = 0; x < c.w; x++) c.set(x, GROUND, noise(Math.floor(x + scroll) + 11) > 0.8 ? 0x713f12 : FOREST_FLOOR)
  const spacing = 34
  for (let i = 0; i < Math.ceil(c.w / spacing) + 1; i++) {
    const px = (((i * spacing + 2 - scroll) % (c.w + spacing)) + c.w + spacing) % (c.w + spacing) - 6
    sprite(c, px, GROUND - 8, PINE, { g: i % 2 ? NEEDLES : NEEDLES_LIGHT, t: TRUNK })
  }
}

// La tente, plantée en `x` ; `rise` de 0 (à plat) à 1 (montée).
const tent = (c: Canvas, x: number, rise = 1) => {
  const height = Math.max(1, Math.round(8 * rise))
  for (let row = 0; row < height; row++) {
    const half = Math.round(((row + 1) / height) * 7)
    const y = GROUND - height + row
    c.rect(x + 7 - half, y, half * 2, 1, row === height - 1 ? TENT_DARK : TENT)
  }
  if (rise > 0.8) c.rect(x + 6, GROUND - 4, 2, 4, 0x431407)
}

// Le feu de camp, et ses flammes qui dansent.
const campfire = (c: Canvas, x: number, t: number) => {
  c.line(x - 3, GROUND, x + 3, GROUND - 1, TRUNK)
  c.line(x - 3, GROUND - 1, x + 3, GROUND, 0x92400e)
  const frame = Math.floor(t * 8)
  for (let dx = -2; dx <= 2; dx++) {
    const tall = 2 + Math.round(noise(frame * 5 + dx) * 2) + (2 - Math.abs(dx))
    for (let k = 0; k < tall; k++) c.set(x + dx, GROUND - 2 - k, k >= tall - 1 ? 0xdc2626 : k >= tall - 2 ? 0xf97316 : 0xfde047)
  }
}

const BEAR = [
  '.bb......bb.',
  '.bbbbbbbbbb.',
  'bbkbbbbbbkbb',
  'bbbbbnnbbbbb',
  'bbbbnkknbbbb',
  '.bbbbbbbbbb.',
  'bbbbbbbbbbbb',
  'bbbbbbbbbbbb',
  'bbbbbbbbbbbb',
  '.bb......bb.',
]
const BEAR_COLORS = { b: 0x7c4a1e, k: 0x1c1917, n: 0xd6a770 }

export const campingTheme: Theme = {
  id: 'camping',
  name: 'Camping',
  emoji: '🏕️',
  pitch: 'un chapeau de randonneur, une tente qui ne veut pas tenir, des guimauves grillées au feu de camp, un ours curieux, des lucioles, une randonnée en forêt',
  dress: (c, pose) => hiker(c, pose),
  scene: c => forest(c),
  sky: 'open',

  idle: {
    id: 'bivouac',
    name: 'se repose devant sa tente',
    draw: (c, t) => {
      forest(c)
      tent(c, c.w - 24)
      campfire(c, centerX(c) + 13, t)
      hiker(c, { x: centerX(c) - 10, y: BASE_Y + 1, arms: [-30, -30], squash: 1, eyes: blink(t), look: 2 })
    },
  },

  anims: [
    {
      id: 'guimauves',
      name: 'Guimauves grillées',
      draw: story([
        [4, (c, t, p) => {
          forest(c)
          const fx = centerX(c) + 14
          campfire(c, fx, t)
          const pose: Pose = { x: centerX(c) - 12, y: BASE_Y + 1, arms: [-30, 15], squash: 1, eyes: blink(t), look: 2 }
          hiker(c, pose)
          // La guimauve au bout du bâton, qui dore peu à peu.
          const h = hand(pose, 1)
          c.line(h.x + 1, h.y, fx - 1, GROUND - 7, STICK)
          c.rect(fx - 1, GROUND - 8, 2, 2, mix(0xfafaf9, 0xd97706, p))
        }],
        [1.6, (c, t) => {
          forest(c)
          const fx = centerX(c) + 14
          campfire(c, fx, t)
          const pose: Pose = { x: centerX(c) - 12, y: BASE_Y + 1, arms: [-30, 40], squash: 1, eyes: 'wide', look: 2 }
          hiker(c, pose)
          // Oups, elle prend feu !
          const h = hand(pose, 1)
          const tip = { x: h.x + 6, y: h.y - 4 }
          c.line(h.x + 1, h.y, tip.x, tip.y, STICK)
          c.rect(tip.x, tip.y - 1, 2, 2, 0x292524)
          for (let i = 0; i < 4; i++) c.dot(tip.x + noise(Math.floor(t * 10) + i) * 2, tip.y - 2 - noise(i * 3 + Math.floor(t * 10)) * 3, i % 2 ? 0xf97316 : 0xfde047)
        }],
        [3, (c, t) => {
          forest(c)
          campfire(c, centerX(c) + 14, t)
          // Il souffle dessus, puis la croque quand même, ravi.
          const pose: Pose = { x: centerX(c) - 12, y: BASE_Y - Math.round(hop((t * 1.5) % 1) * 2), arms: [-50, 75], eyes: 'happy', look: 1 }
          hiker(c, pose)
          const h = hand(pose, 1)
          c.line(h.x + 1, h.y, h.x + 3, h.y - 4, STICK)
          c.rect(h.x + 3, h.y - 6, 2, 2, 0x44403c)
        }],
      ]),
    },
    {
      id: 'tente',
      name: 'La tente qui ne tient pas',
      draw: story([
        [2.5, (c, t, p) => {
          forest(c)
          const tx = centerX(c) + 6
          tent(c, tx, ease(p))
          const pose: Pose = { x: tx - 18, y: BASE_Y, arms: [-40, 40 + Math.round(Math.sin(t * 8) * 15)], eyes: 'square', look: 2 }
          hiker(c, pose)
        }],
        [0.4, (c, t, p) => {
          forest(c)
          tent(c, centerX(c) + 6, 1 - p)
          hiker(c, { x: centerX(c) - 12, y: BASE_Y, arms: [80, 80], eyes: 'wide', look: 2 })
        }],
        [1.4, (c, t) => {
          forest(c)
          tent(c, centerX(c) + 6, 0)
          hiker(c, { x: centerX(c) - 12, y: BASE_Y + 1, arms: [-80, -80], squash: 1, eyes: 'closed', look: 2 })
        }],
        [2.2, (c, t, p) => {
          forest(c)
          tent(c, centerX(c) + 6, ease(p))
          hiker(c, { x: centerX(c) - 12, y: BASE_Y, arms: [-40, 40 + Math.round(Math.sin(t * 8) * 15)], eyes: 'square', look: 2 })
        }],
        [2.5, (c, t) => {
          forest(c)
          tent(c, centerX(c) + 6)
          hiker(c, { x: centerX(c) - 12, y: BASE_Y - Math.round(hop((t * 2) % 1) * 3), arms: [80, 80], eyes: 'happy', look: 2 })
          sparkles(c, t, centerX(c) + 13, GROUND - 9, 4, 0xfde047, 3)
        }],
      ]),
    },
    {
      id: 'ours',
      name: 'Un ours curieux',
      draw: story([
        [3, (c, t, p) => {
          forest(c)
          const bx = lerp(c.w + 2, centerX(c) + 12, ease(p))
          sprite(c, bx, GROUND - 10 + Math.round(hop((t * 3) % 1)), BEAR, BEAR_COLORS)
          hiker(c, { x: centerX(c) - 12, y: BASE_Y, arms: [-80, -80], eyes: p > 0.5 ? 'wide' : blink(t), look: 2 })
        }],
        [3, (c, t) => {
          forest(c)
          // Il fait le mort ; l'ours renifle.
          const bx = centerX(c) + 8 + Math.round(Math.sin(t * 4))
          sprite(c, bx, GROUND - 10, BEAR, BEAR_COLORS)
          if (Math.floor(t * 3) % 2) sparkles(c, t, bx - 1, GROUND - 6, 1, 0xe5e7eb, 2)
          hiker(c, { x: centerX(c) - 12, y: BASE_Y + 2, arms: [-90, -90], squash: 2, eyes: 'closed' })
        }],
        [3, (c, t, p) => {
          forest(c)
          // L'ours repart ; il ouvre un œil, puis les deux.
          const bx = lerp(centerX(c) + 8, c.w + 4, ease(p))
          sprite(c, bx, GROUND - 10 + Math.round(hop((t * 3) % 1)), BEAR, BEAR_COLORS, true)
          hiker(c, { x: centerX(c) - 12, y: BASE_Y + (p < 0.6 ? 2 : 0), arms: p < 0.6 ? [-90, -90] : [70, 70], squash: p < 0.6 ? 2 : 0, eyes: p < 0.6 ? 'square' : 'happy', look: 2 })
        }],
      ]),
    },
    {
      id: 'lucioles',
      name: 'La chasse aux lucioles',
      draw: (c, t) => {
        forest(c)
        // Les lucioles qui clignotent en dérivant.
        const count = 7
        for (let i = 0; i < count; i++) {
          const fx = (noise(i * 3.3) * c.w + Math.sin(t * 0.7 + i) * 6 + c.w) % c.w
          const fy = 2 + noise(i * 1.7) * 9 + Math.sin(t * 1.3 + i * 2) * 2
          const glow = Math.sin(t * 3 + i * 1.9)
          if (glow > -0.2) c.dot(fx, fy, mix(0x65a30d, 0xfef08a, (glow + 0.2) / 1.2))
        }
        // Il en garde une dans un bocal qui luit.
        const x = centerX(c) - 8 + Math.round(Math.sin(t * 0.8) * 8)
        const pose: Pose = { x, y: BASE_Y - Math.round(hop((t * 1.2) % 1) * 2), arms: [-30, 60], legs: walkLegs(t, 3), eyes: 'happy', look: Math.round(Math.cos(t * 0.8) * 2) }
        hiker(c, pose)
        const h = hand(pose, 1)
        c.rect(h.x, h.y - 4, 3, 4, 0x93c5fd)
        c.rect(h.x, h.y - 5, 3, 1, 0x9ca3af)
        c.set(h.x + 1, h.y - 2, Math.sin(t * 4) > 0 ? 0xfef08a : 0xbef264)
      },
    },
    {
      id: 'randonnee',
      name: 'Randonnée en forêt',
      draw: (c, t) => {
        const scroll = t * 7
        forest(c, scroll)
        const x = centerX(c) - 4
        const pose: Pose = { x, y: BASE_Y - (Math.floor(t * 4) % 2), arms: [-20, 30], legs: walkLegs(t, 4), lean: 1, eyes: blink(t, 'happy'), look: 2 }
        // Le sac à dos, derrière lui.
        c.rect(x - 3, BASE_Y + 1, 4, 6, 0x1d4ed8)
        c.rect(x - 3, BASE_Y, 4, 1, 0x1e40af)
        hiker(c, pose)
        // Le bâton de marche, planté à chaque pas.
        const h = hand(pose, 1)
        const plant = Math.floor(t * 2) % 2
        c.line(h.x + 1, h.y - 1, h.x + 2 + plant, GROUND - 1, STICK)
        // Un oiseau qui passe.
        const bx = (c.w + 6 - ((t * 10) % (c.w + 12)))
        const flap = Math.floor(t * 6) % 2
        c.set(bx, 3, 0x1c1917)
        c.set(bx - 1, 3 - flap, 0x1c1917)
        c.set(bx + 1, 3 - flap, 0x1c1917)
      },
    },
  ],
}
