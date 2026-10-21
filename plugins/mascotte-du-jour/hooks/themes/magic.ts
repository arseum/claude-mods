import { type Canvas, type Color, mix, noise } from '../canvas'
import { blink, crown, drawClawd, hand, type Pose } from '../clawd'
import { BASE_Y, centerX, ease, hop, lerp, sparkles, sprite, starfield, story } from './common'
import { GROUND, type Theme } from './theme'

const PURPLE = 0x7c3aed
const STAR = 0xfde047
const MAGIC = [0xc084fc, 0x67e8f9, 0xf472b6, 0xfde047]

const HAT = ['.....p.....', '....ppp....', '...ppypp...', '..ppppppp..', 'ppppppppppp']
const HAT_COLORS = { p: PURPLE, y: STAR }

// Le magicien : le personnage avec son chapeau pointu.
const wizard = (c: Canvas, pose: Pose) => {
  drawClawd(c, pose)
  const { cx, top } = crown(pose)
  sprite(c, cx - 5, top - 5, HAT, HAT_COLORS)
}

// La baguette dans la main droite ; renvoie sa pointe.
const wand = (c: Canvas, pose: Pose, angle: number, t: number) => {
  const { x, y } = hand(pose, 1)
  const rad = (angle * Math.PI) / 180
  const tip = { x: x + 1 + Math.cos(rad) * 4, y: y - Math.sin(rad) * 4 }
  c.line(x + 1, y, tip.x, tip.y, 0x451a03)
  c.set(tip.x, tip.y, t % 0.4 < 0.2 ? 0xffffff : STAR)
  return tip
}

// Un éclair magique en zigzag entre deux points.
const bolt = (c: Canvas, x0: number, y0: number, x1: number, t: number, color: Color) => {
  let y = y0
  const frame = Math.floor(t * 12)
  for (let x = x0; x < x1; x += 2) {
    const ny = y0 + (noise(frame * 31 + x) - 0.5) * 6
    c.line(x, y, x + 2, ny, color)
    y = ny
  }
}

const RABBIT = ['.w.w.', '.w.w.', 'wwwww', 'wpwpw', 'wwwww', '.w.w.']
const RABBIT_COLORS = { w: 0xf8fafc, p: 0xf472b6 }
const TOP_HAT = ['.kkkkk.', '.kkkkk.', '.krrrk.', 'kkkkkkk']
const TOP_HAT_COLORS = { k: 0x111827, r: 0xdc2626 }
const CAULDRON = ['gggggggg', 'kkkkkkkk', 'kkkkkkkk', '.kkkkkk.', '.k....k.']

export const magicTheme: Theme = {
  id: 'magicien',
  name: 'Magicien',
  emoji: '🧙',
  pitch: 'un chapeau pointu, une baguette, des sortilèges, un lapin dans un chapeau, un balai volant, des potions',
  dress: (c, pose) => wizard(c, pose),
  scene: (c, t) => starfield(c, t, 0.3, 12),
  sky: 'own',
  // La fête : un feu d'artifice qui jaillit de la baguette.
  cheer: (c, t) => {
    const pose: Pose = { x: centerX(c) - 8, y: BASE_Y - Math.round(hop((t * 1.5) % 1) * 2), arms: [-30, 80], eyes: 'happy', look: 2 }
    wizard(c, pose)
    const tip = wand(c, pose, 80, t)
    for (let i = 0; i < 3; i++) {
      const life = (t * 0.8 + i / 3) % 1
      const bx = tip.x + 6 + i * 9
      const by = 3 + (i % 2) * 2
      if (life < 0.3) c.dot(lerp(tip.x, bx, life / 0.3), lerp(tip.y, by, life / 0.3), 0xfef3c7)
      else {
        const k = (life - 0.3) / 0.7
        for (let p = 0; p < 8; p++) {
          const a = (p / 8) * Math.PI * 2
          c.set(bx + Math.cos(a) * k * 6, by + Math.sin(a) * k * 4 + k * k, mix(MAGIC[(i + p) % MAGIC.length]!, 0x1e1b4b, Math.max(0, k - 0.6)))
        }
      }
    }
  },

  idle: {
    id: 'medite',
    name: 'médite en lévitation',
    draw: (c, t) => {
      starfield(c, t, 0.3, 12)
      const bob = Math.round(Math.sin(t * 1.2))
      const pose: Pose = { x: centerX(c), y: BASE_Y - 1 + bob, arms: [-20, -20], legs: [1, 1, 1, 1], eyes: 'closed' }
      wizard(c, pose)
      sparkles(c, t * 0.4, centerX(c) + 8, BASE_Y + 3, 14, MAGIC[Math.floor(t) % 4], 2)
    },
  },

  anims: [
    {
      id: 'sortilege',
      name: 'Sortilège',
      draw: (c, t) => {
        starfield(c, t, 0.5, 12)
        const isCasting = t % 2 < 1.2
        const pose: Pose = { x: 6, y: BASE_Y, arms: [-40, isCasting ? 30 : 70], eyes: isCasting ? 'wide' : 'happy', look: 2 }
        wizard(c, pose)
        const tip = wand(c, pose, isCasting ? 10 : 60, t)
        const color = MAGIC[Math.floor(t / 2) % MAGIC.length]!
        if (isCasting) {
          bolt(c, tip.x + 1, tip.y, c.w - 4, t, color)
          sparkles(c, t, c.w - 5, tip.y, 4, color, 6)
        } else {
          sparkles(c, t, tip.x, tip.y - 1, 3, color, 4)
        }
      },
    },
    {
      id: 'lapin',
      name: 'Le lapin dans le chapeau',
      draw: story([
        [3, (c, t) => {
          const x = centerX(c) - 8
          sprite(c, x + 24, GROUND - 4, TOP_HAT, TOP_HAT_COLORS)
          const tap = Math.floor(t * 3) % 2
          const pose: Pose = { x, y: BASE_Y, arms: [-40, tap ? -10 : 20], eyes: blink(t), look: 2 }
          wizard(c, pose)
          wand(c, pose, tap ? -30 : 0, t)
        }],
        [1, (c, t, p) => {
          const x = centerX(c) - 8
          sprite(c, x + 24, GROUND - 4, TOP_HAT, TOP_HAT_COLORS)
          for (let i = 0; i < 6; i++) c.disc(x + 27 + Math.cos(i) * p * 6, GROUND - 6 - Math.sin(i * 2) * p * 3, 1.5, mix(0xe5e7eb, 0x6b7280, p))
          wizard(c, { x, y: BASE_Y, arms: [-40, 50], eyes: 'wide', look: 2 })
        }],
        [4, (c, t, p) => {
          const x = centerX(c) - 8
          sprite(c, x + 24, GROUND - 4, TOP_HAT, TOP_HAT_COLORS)
          const rx = x + 25 + Math.round(ease(p) * 20)
          sprite(c, rx, GROUND - 10 + Math.round((1 - hop((p * 4) % 1)) * 4), RABBIT, RABBIT_COLORS)
          // Il salue : penché en avant, les bras écartés.
          wizard(c, { x, y: BASE_Y, arms: [10, 10], lean: p > 0.5 ? 3 : 0, eyes: 'happy', look: 2 })
        }],
      ]),
    },
    {
      id: 'balai',
      name: 'Balai volant',
      draw: (c, t) => {
        starfield(c, t, 4, 16)
        const span = c.w + 26
        const x = ((t * 14) % span) - 18
        const y = BASE_Y - 3 + Math.round(Math.sin(t * 2.5) * 2)
        // Le balai sous lui, et ses brindilles derrière.
        c.line(x - 4, y + 9, x + 20, y + 8, 0x92400e)
        for (let i = 0; i < 4; i++) c.line(x - 4, y + 9, x - 8, y + 7 + i, STAR)
        for (let i = 1; i <= 6; i++) c.set(x - 8 - i * 3, y + 8 + Math.sin(t * 8 + i), MAGIC[i % 4]!)
        wizard(c, { x, y, arms: [20, 20], legs: [2, 2, 2, 2], lean: 2, eyes: 'happy', look: 2 })
      },
    },
    {
      id: 'potion',
      name: 'Potion bouillonnante',
      draw: (c, t) => {
        const x = centerX(c) - 10
        const cx = x + 26
        const color = MAGIC[Math.floor(t / 3) % MAGIC.length]!
        sprite(c, cx - 4, GROUND - 5, CAULDRON, { g: color, k: 0x1f2937 })
        // Les flammes sous le chaudron.
        for (let i = 0; i < 4; i++) c.set(cx - 2 + i, GROUND, noise(Math.floor(t * 10) + i) > 0.5 ? 0xf97316 : 0xfacc15)
        // Les bulles et, toutes les 3 secondes, une bouffée colorée.
        for (let i = 0; i < 4; i++) {
          const life = (t * 1.5 + i / 4) % 1
          c.set(cx - 3 + i * 2, GROUND - 6 - life * 5, mix(color, 0xffffff, life))
        }
        if (t % 3 > 2.4) for (let i = 0; i < 5; i++) c.disc(cx + Math.cos(i * 1.3) * 4, GROUND - 10 - ((t % 3) - 2.4) * 8, 1.5, color)
        const stir = Math.sin(t * 4)
        const pose: Pose = { x, y: BASE_Y, arms: [-40, -20 + stir * 25], eyes: blink(t), look: 2 }
        wizard(c, pose)
        const h = hand(pose, 1)
        c.line(h.x + 1, h.y, cx + stir * 2, GROUND - 5, 0x92400e)
      },
    },
    {
      id: 'levitation',
      name: 'Orbes en orbite',
      draw: (c, t) => {
        starfield(c, t, 0.4, 14)
        const x = centerX(c)
        const y = BASE_Y - 2 + Math.round(Math.sin(t * 1.5) * 2)
        const orbs = MAGIC.map((color, i) => {
          const a = t * 2 + (i * Math.PI) / 2
          return { x: x + 8 + Math.cos(a) * 16, y: y + 5 + Math.sin(a) * 4, front: Math.sin(a) > 0, color }
        })
        for (const o of orbs) if (!o.front) c.disc(o.x, o.y, 1.2, mix(o.color, 0x000000, 0.4))
        wizard(c, { x, y, arms: [75, 75], legs: [1, 2, 2, 1], eyes: 'closed' })
        for (const o of orbs) if (o.front) c.disc(o.x, o.y, 1.4, o.color)
      },
    },
    {
      id: 'feu-artifice',
      name: 'Feu d’artifice magique',
      draw: (c, t) => {
        starfield(c, t, 0.3, 10)
        const pose: Pose = { x: 4, y: BASE_Y, arms: [-30, 80], eyes: 'happy' }
        wizard(c, pose)
        const tip = wand(c, pose, 80, t)
        // Trois fusées décalées qui montent puis éclatent.
        for (let k = 0; k < 3; k++) {
          const p = (t / 2.4 + k / 3) % 1
          const tx = lerp(tip.x, 26 + k * ((c.w - 30) / 3) + noise(Math.floor(t / 2.4 + k / 3) * 7 + k) * 8, p * 2)
          const color = MAGIC[(k + Math.floor(t / 2.4)) % 4]!
          if (p < 0.5) {
            c.set(tx, lerp(tip.y, 3, p * 2), 0xffffff)
          } else {
            const r = (p - 0.5) * 14
            for (let i = 0; i < 10; i++) {
              const a = (i / 10) * Math.PI * 2
              c.set(tx + Math.cos(a) * r, 3 + Math.sin(a) * r * 0.5 + (p - 0.5) * 4, mix(color, 0x000000, (p - 0.5) * 1.6))
            }
          }
        }
      },
    },
  ],
}
