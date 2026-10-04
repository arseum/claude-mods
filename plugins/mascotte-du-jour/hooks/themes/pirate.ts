import { type Canvas, mix, noise } from '../canvas'
import { blink, crown, drawClawd, hand, type Pose } from '../clawd'
import { BASE_Y, centerX, ease, falling, flash, hop, lerp, sparkles, sprite, story, walkLegs, waves } from './common'
import { GROUND, type Theme } from './theme'

const WOOD = 0x92400e
const WOOD_DARK = 0x78350f
const GOLD = 0xfacc15
const STEEL = 0xd1d5db
const SEA = 0x0ea5e9

const HAT = ['....kkkkkk....', '..kkkkwwkkkk..', 'kkkkkkkkkkkkkk']
const HAT_COLORS = { k: 0x1f2937, w: 0xf8fafc }

// Le pirate : le personnage avec son tricorne.
const pirate = (c: Canvas, pose: Pose) => {
  drawClawd(c, pose)
  const { cx, top } = crown(pose)
  sprite(c, cx - 7, top - 3, HAT, HAT_COLORS)
}

// Le pont du navire, en planches.
const deck = (c: Canvas, from = 0, to = c.w) => {
  for (let x = from; x < to; x++) c.set(x, GROUND, x % 7 === 0 ? WOOD_DARK : WOOD)
}

// Une épée tenue dans la main droite, pointée selon `angle`.
const sword = (c: Canvas, pose: Pose, angle: number) => {
  const { x, y } = hand(pose, 1)
  const rad = (angle * Math.PI) / 180
  c.set(x + 1, y, GOLD)
  c.line(x + 1, y, x + 1 + Math.cos(rad) * 7, y - Math.sin(rad) * 7, STEEL)
  return { x: x + 1 + Math.cos(rad) * 7, y: y - Math.sin(rad) * 7 }
}

const PALM = ['..gg.gg', '.gggggg', 'gg.b.gg', '...b...', '...b...', '.sssss.']
const PALM_COLORS = { g: 0x16a34a, b: WOOD, s: 0xfde68a }
const CHEST = ['.bbbbbb.', 'bbyybbbb', 'bbbbbbbb', 'bbbyybbb', 'bbbbbbbb']
const CHEST_COLORS = { b: WOOD, y: GOLD }

export const pirateTheme: Theme = {
  id: 'pirate',
  name: 'Pirate',
  emoji: '🏴‍☠️',
  pitch: 'un tricorne, des duels à l’épée, une longue-vue, la planche, un trésor enterré, une tempête',
  dress: (c, pose) => pirate(c, pose),
  scene: c => deck(c),
  sky: 'open',

  idle: {
    id: 'barre',
    name: 'tient la barre tranquillement',
    draw: (c, t) => {
      deck(c)
      const x = centerX(c)
      // La barre : une roue en bois à côté de lui.
      const wx = x + 26
      const wy = BASE_Y + 3
      for (let i = 0; i < 8; i++) {
        const a = i * (Math.PI / 4) + t * 0.3
        c.line(wx, wy, wx + Math.cos(a) * 4, wy + Math.sin(a) * 4, i % 2 ? WOOD : WOOD_DARK)
      }
      c.set(wx, wy, GOLD)
      pirate(c, { x, y: BASE_Y, arms: [-60, 0], lean: Math.round(Math.sin(t * 0.8)), eyes: blink(t), look: 1 })
    },
  },

  anims: [
    {
      id: 'abordage',
      name: 'À l’abordage !',
      draw: (c, t) => {
        deck(c)
        const beat = Math.floor(t * 3) % 4
        const x = centerX(c) - 4 + (beat === 1 ? 2 : beat === 3 ? -1 : 0)
        const angles = [10, -15, 35, 0]
        const pose: Pose = { x, y: BASE_Y, arms: [40, angles[beat]!], legs: beat % 2 ? [0, 0, 1, 0] : [1, 0, 0, 0], lean: beat === 1 ? 2 : 0, eyes: 'wide', look: 2 }
        pirate(c, pose)
        const tip = sword(c, pose, angles[beat]!)
        // L'épée d'un adversaire invisible, qui pare.
        const foeX = x + 34
        c.line(foeX, BASE_Y + 1, tip.x + 1, tip.y, 0x9ca3af)
        if (beat === 1 || beat === 3) sparkles(c, t, tip.x + 1, tip.y, 3, GOLD, 4)
      },
    },
    {
      id: 'longue-vue',
      name: 'Terre en vue !',
      draw: story([
        [6, (c, t) => {
          waves(c, t, SEA)
          const look = Math.round(Math.sin(t * 1.2) * 2)
          const pose: Pose = { x: centerX(c) - 8, y: BASE_Y - 1, arms: [-60, 5], eyes: blink(t), look }
          pirate(c, pose)
          const { x, y } = hand(pose, 1)
          c.rect(x + 1, y - 1, 5, 2, WOOD)
          c.rect(x + 6, y - 1, 1, 2, GOLD)
        }],
        [5, (c, t, p) => {
          waves(c, t, SEA)
          sprite(c, c.w - 14, GROUND - 6 + Math.round((1 - ease(p * 2)) * 6), PALM, PALM_COLORS)
          const air = hop((t * 1.8) % 1)
          pirate(c, { x: centerX(c) - 8, y: BASE_Y - 1 - Math.round(air * 3), arms: [80, 80], eyes: 'happy', look: 2 })
        }],
      ]),
    },
    {
      id: 'planche',
      name: 'Marcher sur la planche',
      draw: story([
        [4, (c, t, p) => {
          deck(c, 0, 18)
          waves(c, t, SEA)
          c.rect(14, GROUND - 1, 24, 1, WOOD)
          pirate(c, { x: lerp(0, 22, ease(p)), y: BASE_Y - 1, arms: [-30, -30], legs: walkLegs(t, 3), eyes: 'wide', lean: Math.round(Math.sin(t * 5)) })
        }],
        [1.2, (c, t, p) => {
          deck(c, 0, 18)
          waves(c, t, SEA)
          const bend = Math.round(Math.sin(p * Math.PI * 4) * 2)
          c.line(14, GROUND - 1, 37, GROUND - 1 + bend, WOOD)
          pirate(c, { x: 22, y: BASE_Y - 1 + bend - Math.round(hop(p) * 4), arms: [70, 70], eyes: 'wide' })
        }],
        [2, (c, t, p) => {
          deck(c, 0, 18)
          waves(c, t, SEA)
          c.rect(14, GROUND - 1, 24, 1, WOOD)
          pirate(c, { x: 26, y: BASE_Y + Math.round(p * 12), arms: [90, 90], eyes: 'closed' })
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI
            c.set(34 + Math.cos(a) * p * 10, GROUND - 2 - Math.sin(a) * p * 6, 0xe0f2fe)
          }
        }],
        [2.5, (c, t, p) => {
          deck(c, 0, 18)
          c.rect(14, GROUND - 1, 24, 1, WOOD)
          pirate(c, { x: 26, y: BASE_Y + 6 - Math.round(ease(p) * 3), arms: [60, 60], eyes: 'happy' })
          waves(c, t, SEA)
        }],
      ]),
    },
    {
      id: 'tresor',
      name: 'Le trésor enfoui',
      draw: story([
        [7, (c, t, p) => {
          for (let x = 0; x < c.w; x++) c.set(x, GROUND, noise(x) > 0.8 ? 0xd6b46a : 0xfde68a)
          const dig = Math.floor(t * 2.5) % 2
          const x = centerX(c) - 6
          const pose: Pose = { x, y: BASE_Y, arms: [-40, dig ? -70 : 20], lean: dig ? 1 : -1, eyes: blink(t) }
          pirate(c, pose)
          const h = hand(pose, 1)
          c.line(h.x + 1, h.y, h.x + 4, h.y + 5, WOOD)
          c.rect(h.x + 3, h.y + 5, 3, 2, STEEL)
          // Le trou qui se creuse et la terre qui vole.
          c.rect(x + 22, GROUND, Math.round(2 + p * 6), 1, 0x78350f)
          if (dig) sparkles(c, t, x + 26, GROUND - 4, 4, 0xd6b46a, 4)
        }],
        [7, (c, t, p) => {
          for (let x = 0; x < c.w; x++) c.set(x, GROUND, noise(x) > 0.8 ? 0xd6b46a : 0xfde68a)
          const x = centerX(c) - 6
          sprite(c, x + 22, GROUND - 5 + Math.round((1 - ease(p * 3)) * 5), CHEST, CHEST_COLORS)
          if (p > 0.3) {
            // Les pièces qui jaillissent du coffre.
            for (let i = 0; i < 7; i++) {
              const life = (t * 1.2 + i / 7) % 1
              c.set(x + 26 + (i - 3) * life * 3, GROUND - 6 - hop(life) * 8, GOLD)
            }
          }
          const air = p > 0.3 ? hop((t * 2) % 1) : 0
          pirate(c, { x, y: BASE_Y - Math.round(air * 3), arms: p > 0.3 ? [70, 70] : [-40, -40], eyes: p > 0.3 ? 'happy' : 'wide', look: 2 })
        }],
      ]),
    },
    {
      id: 'tempete',
      name: 'Dans la tempête',
      draw: (c, t) => {
        falling(c, t, { count: 40, speed: 30, color: 0x60a5fa, length: 3 })
        waves(c, t * 1.6, 0x0369a1, 0xe0f2fe)
        if (noise(Math.floor(t * 4)) > 0.88) flash(c, 0xfef9c3)
        const roll = Math.sin(t * 1.7) * 3
        const pose: Pose = { x: centerX(c) + Math.round(roll), y: BASE_Y - 1, arms: [85, -40], lean: Math.round(roll), eyes: 'wide', look: Math.round(-roll) }
        pirate(c, pose)
        sparkles(c, t, centerX(c) + 8, BASE_Y - 4, 10, mix(0xffffff, 0x60a5fa, 0.5), 3)
      },
    },
  ],
}
