import { type Canvas, mix, noise } from '../canvas'
import { blink, crown, drawClawd, figureScale, hand, type Pose } from '../clawd'
import { BASE_Y, centerX, ease, falling, hop, lerp, sparkles, sprite, story, walkLegs } from './common'
import { GROUND, type Special, type Theme } from './theme'

const SNOW = 0xf8fafc
const SNOW_SHADE = 0xcbd5e1
const SCARF = 0xdc2626
const ICE = 0xbae6fd

// La neige au sol et les flocons qui tombent.
const winter = (c: Canvas, t: number, flakes = 26) => {
  for (let x = 0; x < c.w; x++) c.set(x, GROUND, noise(x) > 0.85 ? SNOW_SHADE : SNOW)
  falling(c, t, { count: flakes, speed: 3, color: SNOW, sway: 1.2 })
}

// Le personnage emmitouflé : une écharpe rouge qui flotte au vent.
const bundled = (c: Canvas, pose: Pose, t: number) => {
  drawClawd(c, pose)
  const { cx, top, w } = crown(pose)
  const row = top + Math.round(4 * figureScale())
  c.rect(cx - w / 2, row, w, 1, SCARF)
  const flutter = Math.round(Math.sin(t * 6))
  c.rect(cx + w / 2 - 3, row + 1, 2, 2 + flutter, SCARF)
}

// Un petit nuage de buée devant la bouche.
const breath = (c: Canvas, t: number, x: number, y: number) => {
  const life = t % 2.5
  if (life < 1) c.disc(x + life * 4, y - life * 2, 1 + life, mix(0xf1f5f9, 0x334155, life))
}

const TREE = ['.....y.....', '....ggg....', '...ggggg...', '....ggg....', '..ggggggg..', '.ggggggggg.', '...ggggg...', '.ggggggggg.', 'ggggggggggg', '....bbb....']
const LIGHTS = [0xef4444, 0xfde047, 0x60a5fa, 0xf472b6]

// Noël : le sapin qui clignote, les cadeaux au pied, et des sauts de joie.
const christmas: Special = {
  dates: ['12-24', '12-25'],
  occasion: 'Noël',
  anim: {
    id: 'sapin',
    name: 'Joyeux Noël !',
    draw: (c, t) => {
      winter(c, t, 14)
      const tx = centerX(c) + 14
      const ty = GROUND - TREE.length
      sprite(c, tx, ty, TREE, { y: 0xfde047, g: 0x166534, b: 0x78350f })
      TREE.forEach((row, dy) => {
        for (let dx = 0; dx < row.length; dx++) {
          if (row[dx] === 'g' && noise(dx * 7 + dy * 13) > 0.72) c.set(tx + dx, ty + dy, LIGHTS[(Math.floor(t * 2) + dx + dy) % LIGHTS.length]!)
        }
      })
      if (t % 1 < 0.5) c.set(tx + 5, ty, 0xffffff)
      // Les cadeaux au pied du sapin.
      c.rect(tx - 4, GROUND - 3, 4, 3, 0xdc2626)
      c.rect(tx - 3, GROUND - 3, 1, 3, 0xfde047)
      c.rect(tx + 11, GROUND - 2, 4, 2, 0x2563eb)
      c.rect(tx + 12, GROUND - 2, 1, 2, 0xf8fafc)
      const air = t % 2.5 < 0.6 ? hop((t % 2.5) / 0.6) : 0
      bundled(c, { x: centerX(c) - 10, y: BASE_Y - Math.round(air * 3), arms: air > 0 ? [80, 80] : [-50, -50], eyes: air > 0 ? 'happy' : blink(t), look: 2 }, t)
    },
  },
}

export const winterTheme: Theme = {
  id: 'hiver',
  name: 'Hiver',
  emoji: '❄️',
  pitch: 'la neige qui tombe, une écharpe, un bonhomme de neige, une bataille de boules de neige, du ski, du patin à glace, un chocolat chaud',
  dress: (c, pose, t) => bundled(c, pose, t),
  scene: (c, t) => winter(c, t),
  sky: 'open',
  specials: [christmas],

  idle: {
    id: 'frissonne',
    name: 'regarde tomber la neige',
    draw: (c, t) => {
      winter(c, t)
      const shiver = t % 4 < 0.6 ? Math.round(Math.sin(t * 40)) : 0
      const x = centerX(c) + shiver
      bundled(c, { x, y: BASE_Y, arms: [-70, -70], eyes: blink(t), look: 1 }, t)
      breath(c, t, x + 17, BASE_Y + 4)
    },
  },

  anims: [
    {
      id: 'bonhomme',
      name: 'Le bonhomme de neige',
      draw: story([
        [5, (c, t, p) => {
          winter(c, t, 14)
          // Il pousse une boule de neige qui grossit.
          const r = 1 + ease(p) * 3.5
          const x = lerp(2, centerX(c) - 4, p)
          bundled(c, { x, y: BASE_Y, arms: [0, 0], legs: walkLegs(t, 3), lean: 2, eyes: blink(t), look: 2 }, t)
          c.disc(x + 22 + r, GROUND - r, r, SNOW)
        }],
        [7, (c, t, p) => {
          winter(c, t, 14)
          const x = centerX(c) - 4
          const bx = x + 26
          c.disc(bx, GROUND - 4, 4, SNOW)
          // Le milieu, puis la tête, puis le nez, le chapeau et les boutons.
          if (p > 0.15) c.disc(bx, lerp(-4, GROUND - 10, ease((p - 0.15) * 4)), 3, SNOW)
          if (p > 0.45) c.disc(bx, lerp(-4, GROUND - 14, ease((p - 0.45) * 4)), 2, SNOW)
          if (p > 0.7) {
            c.set(bx + 2, GROUND - 14, 0xf97316)
            c.set(bx + 3, GROUND - 14, 0xf97316)
            c.set(bx - 1, GROUND - 15, 0x111827)
            c.set(bx, GROUND - 10, 0x111827)
            c.set(bx, GROUND - 8, 0x111827)
          }
          if (p > 0.85) c.rect(bx - 2, GROUND - 17, 5, 1, 0x111827)
          const isDone = p > 0.85
          bundled(c, { x, y: BASE_Y - (isDone ? Math.round(hop((t * 2) % 1) * 2) : 0), arms: isDone ? [70, 70] : [-30, 40], eyes: isDone ? 'happy' : blink(t), look: 2 }, t)
        }],
      ]),
    },
    {
      id: 'boules',
      name: 'Bataille de boules de neige',
      draw: (c, t) => {
        winter(c, t, 14)
        const x = 6
        const p = (t / 1.4) % 1
        const isHit = Math.floor(t / 1.4) % 3 === 2 && p > 0.6 && p < 0.85
        const pose: Pose = { x, y: BASE_Y, arms: [-40, p < 0.2 ? 90 : 10], eyes: isHit ? 'closed' : 'happy', look: 2, lean: isHit ? -2 : 0 }
        bundled(c, pose, t)
        // Sa boule part en cloche vers la droite et s'écrase.
        if (p > 0.2) {
          const k = (p - 0.2) / 0.8
          const bx = lerp(x + 22, c.w - 6, k)
          if (k < 0.95) c.disc(bx, BASE_Y + 2 - hop(k) * 6, 1, SNOW)
          else sparkles(c, t, c.w - 6, GROUND - 2, 3, SNOW, 5)
        }
        // De temps en temps, une boule ennemie arrive en retour.
        if (Math.floor(t / 1.4) % 3 === 2) {
          const bx = lerp(c.w, x + 10, p / 0.7)
          if (p < 0.7) c.disc(bx, BASE_Y + 3 - hop(p / 0.7) * 4, 1, SNOW_SHADE)
          else if (isHit) sparkles(c, t, x + 8, BASE_Y + 3, 4, SNOW, 6)
        }
      },
    },
    {
      id: 'ski',
      name: 'Descente à ski',
      draw: (c, t) => {
        winter(c, t, 18)
        // Des bosses qui défilent.
        for (let i = 0; i < c.w / 16 + 1; i++) {
          const mx = ((i * 16 - t * 18) % (c.w + 16) + c.w + 16) % (c.w + 16) - 8
          c.rect(mx, GROUND - 1, 5, 1, SNOW)
        }
        const air = hop((t * 1.1) % 1)
        const x = centerX(c) - 6
        const y = BASE_Y - 1 - Math.round(air * 3)
        bundled(c, { x, y, arms: [-20, -20], legs: [1, 1, 1, 1], lean: 2, eyes: 'happy', look: 2 }, t)
        c.line(x - 3, y + 11, x + 20, y + 10, 0x2563eb)
        for (const side of [-1, 1] as const) {
          const h = hand({ x, y, arms: [-20, -20], lean: 2 }, side)
          c.line(h.x, h.y, h.x - 3, y + 11, 0x6b7280)
        }
        for (let i = 0; i < 6; i++) c.set(x - 5 - i * 2, y + 10 - noise(Math.floor(t * 10) + i) * 3, SNOW)
      },
    },
    {
      id: 'patinage',
      name: 'Patin à glace',
      draw: (c, t) => {
        for (let x = 0; x < c.w; x++) c.set(x, GROUND, noise(x + Math.floor(t * 2)) > 0.9 ? 0xffffff : ICE)
        falling(c, t, { count: 12, speed: 3, color: SNOW, sway: 1.2 })
        const cycle = t % 6
        const isSpinning = cycle > 4.4
        if (isSpinning) {
          const face = Math.floor(t * 10) % 4
          bundled(c, { x: centerX(c), y: BASE_Y - 1, width: face % 2 ? 10 : 16, arms: [80, 80], legs: [0, 0, 0, 0], eyes: face === 2 ? 'none' : 'happy' }, t)
          sparkles(c, t, centerX(c) + 8, BASE_Y + 4, 12, 0xe0f2fe, 6)
        } else {
          const x = centerX(c) + Math.sin(cycle * 1.4) * (c.w / 2 - 14)
          const glide = Math.cos(cycle * 1.4)
          bundled(c, { x, y: BASE_Y - 1, arms: [glide > 0 ? -10 : 30, glide > 0 ? 30 : -10], legs: glide > 0 ? [0, 0, 2, 2] : [2, 2, 0, 0], lean: Math.round(glide * 2), eyes: 'happy', look: glide > 0 ? 2 : -2 }, t)
        }
      },
    },
    {
      id: 'chocolat',
      name: 'Chocolat chaud',
      draw: (c, t) => {
        winter(c, t, 18)
        const x = centerX(c)
        const sip = t % 5 > 3.5
        const pose: Pose = { x, y: BASE_Y + 1, arms: [-60, sip ? 50 : 20], squash: 1, eyes: sip ? 'closed' : 'happy' }
        bundled(c, pose, t)
        const h = hand(pose, 1)
        c.rect(h.x + 1, h.y - 1, 3, 3, 0xf8fafc)
        c.rect(h.x + 1, h.y - 1, 3, 1, 0x78350f)
        for (let i = 0; i < 2; i++) {
          const life = (t * 0.7 + i / 2) % 1
          c.set(h.x + 2 + Math.sin(t * 3 + i), h.y - 2 - life * 5, mix(0xf1f5f9, 0x334155, life))
        }
      },
    },
  ],
}
