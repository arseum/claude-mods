import { type Canvas, type Color, mix, noise } from '../canvas'
import { blink, crown, drawClawd, hand, type Pose } from '../clawd'
import { BASE_Y, centerX, ease, falling, hop, sparkles, sprite, story, walkLegs } from './common'
import { GROUND, type Special, type Theme } from './theme'

const GRASS = 0x22c55e
const GRASS_DARK = 0x15803d
const PETALS: readonly Color[] = [0xf472b6, 0xfacc15, 0xa78bfa, 0xf97316, 0xf8fafc]

// L'herbe, et le soleil si on le demande (sinon c'est l'heure qui décide du ciel).
const garden = (c: Canvas, withSun = false) => {
  for (let x = 0; x < c.w; x++) c.set(x, GROUND, noise(x) > 0.75 ? GRASS_DARK : GRASS)
  if (withSun) {
    c.disc(4, 3, 2.5, 0xfde047)
    c.set(8, 1, 0xfde047)
    c.set(1, 7, 0xfde047)
  }
}

// Une fleur dont la tige mesure `growth` (0 : rien, 1 : en fleur), qui se balance.
const flower = (c: Canvas, x: number, t: number, growth: number, color: Color, height = 6) => {
  const h = Math.round(height * growth)
  if (h <= 0) return
  const sway = Math.round(Math.sin(t * 1.5 + x) * 0.6)
  c.line(x, GROUND - 1, x + sway, GROUND - h, GRASS_DARK)
  if (growth > 0.7) {
    const fx = x + sway
    const fy = GROUND - h - 1
    c.set(fx - 1, fy, color)
    c.set(fx + 1, fy, color)
    c.set(fx, fy - 1, color)
    c.set(fx, fy + 1, color)
    c.set(fx, fy, 0xfde047)
  }
}

// Un papillon aux ailes qui battent.
const butterfly = (c: Canvas, x: number, y: number, t: number, color: Color) => {
  const isOpen = Math.floor(t * 8) % 2 === 0
  c.set(x, y, 0x1f2937)
  c.set(x - 1, y - (isOpen ? 1 : 0), color)
  c.set(x + 1, y - (isOpen ? 1 : 0), color)
  if (isOpen) {
    c.set(x - 1, y + 1, color)
    c.set(x + 1, y + 1, color)
  }
}

// Une abeille rayée qui bourdonne.
const bee = (c: Canvas, x: number, y: number, t: number) => {
  c.set(x, y, 0xfacc15)
  c.set(x + 1, y, 0x111827)
  c.set(x + 2, y, 0xfacc15)
  c.set(x + 1, y - 1 - (Math.floor(t * 12) % 2), 0xe0f2fe)
}

const STRAW_HAT = ['...yyyy...', 'yyyyyyyyyy']
const UMBRELLA = ['...rrrrr...', '.rrrrrrrrr.', 'rrrrrrrrrrr', '.....k.....']

// Le jardinier : le personnage avec son chapeau de paille.
const gardener = (c: Canvas, pose: Pose) => {
  drawClawd(c, pose)
  const { cx, top } = crown(pose)
  sprite(c, cx - 5, top - 2, STRAW_HAT, { y: 0xfde68a })
}

const HEART = ['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..']

// La Saint-Valentin : un bouquet à offrir et des cœurs qui s'envolent des fleurs.
const valentine: Special = {
  dates: ['02-14'],
  occasion: 'la Saint-Valentin',
  anim: {
    id: 'saint-valentin',
    name: 'Un bouquet pour toi',
    draw: (c, t) => {
      garden(c)
      for (let i = 0; i < c.w / 8; i++) flower(c, 3 + i * 8, t, 1, PETALS[i % PETALS.length]!, 3 + (i % 3))
      for (let i = 0; i < 4; i++) {
        const life = (t * 0.35 + i / 4) % 1
        const hx = 6 + noise(i * 5 + Math.floor(t * 0.35 + i / 4) * 7) * (c.w - 12)
        if (life < 0.9) sprite(c, hx + Math.sin(life * 8 + i) * 1.5, GROUND - 5 - life * 10, HEART, { r: i % 2 ? 0xf43f5e : 0xf9a8d4 })
      }
      const beat = t % 1.2 < 0.15
      const pose: Pose = { x: centerX(c), y: BASE_Y, arms: [-50, 25], squash: beat ? 1 : 0, eyes: 'happy', look: 2 }
      gardener(c, pose)
      const h = hand(pose, 1)
      c.line(h.x + 1, h.y, h.x + 3, h.y - 3, GRASS_DARK)
      for (const [dx, dy, color] of [[2, -5, 0xf43f5e], [4, -4, 0xf9a8d4], [3, -6, 0xf472b6]] as const) c.rect(h.x + dx, h.y + dy, 2, 2, color)
    },
  },
}

export const gardenTheme: Theme = {
  id: 'jardin',
  name: 'Jardin',
  emoji: '🌻',
  pitch: 'un chapeau de paille, un arrosoir qui fait pousser des fleurs, des papillons, des abeilles, une carotte à arracher, une averse puis un arc-en-ciel',
  dress: (c, pose) => gardener(c, pose),
  scene: c => garden(c),
  sky: 'open',
  // La fête : tout le jardin fleurit d'un coup, et les papillons arrivent.
  cheer: (c, t) => {
    const colors = [0xf472b6, 0xfde047, 0xa78bfa, 0xf97316, 0x60a5fa]
    const growth = Math.min(1, (t % 6) * 1.5)
    for (let i = 0; i < c.w / 6; i++) {
      const fx = i * 6 + 2
      if (Math.abs(fx - (centerX(c) + 8)) > 11) flower(c, fx, t, Math.min(1, Math.max(0, growth * 1.6 - (i % 3) * 0.3)), colors[i % colors.length]!, 4 + (i % 3))
    }
    for (let i = 0; i < 2; i++) butterfly(c, centerX(c) + 8 + Math.cos(t * 1.5 + i * 3) * 16, 3 + Math.sin(t * 2.2 + i) * 2, t, colors[i + 2]!)
    gardener(c, { x: centerX(c), y: BASE_Y - Math.round(hop((t * 1.6) % 1) * 3), arms: [80, 80], eyes: 'happy' })
  },
  specials: [valentine],

  idle: {
    id: 'contemple',
    name: 'contemple ses fleurs',
    draw: (c, t) => {
      garden(c)
      const x = centerX(c)
      for (let i = 0; i < 6; i++) flower(c, i < 3 ? x - 10 + i * 4 : x + 22 + (i - 3) * 4, t, 1, PETALS[i % PETALS.length]!)
      if (t % 10 < 5) butterfly(c, x + 8 + Math.sin(t) * 18, 3 + Math.sin(t * 2) * 2, t, 0xf472b6)
      gardener(c, { x, y: BASE_Y, arms: [-70, -70], eyes: blink(t, 'happy') })
    },
  },

  anims: [
    {
      id: 'arrosage',
      name: 'Arrosage du potager',
      draw: story([
        [12, (c, t, p) => {
          garden(c)
          const x = 4
          const pose: Pose = { x, y: BASE_Y, arms: [-50, 10], eyes: blink(t), look: 2 }
          gardener(c, pose)
          // L'arrosoir et l'eau qui coule.
          const h = hand(pose, 1)
          c.rect(h.x + 1, h.y, 4, 3, 0x22d3ee)
          c.line(h.x + 5, h.y, h.x + 8, h.y - 1, 0x22d3ee)
          for (let i = 0; i < 6; i++) {
            const life = (t * 2 + i / 6) % 1
            c.set(h.x + 8 + life * 4 + (i % 2), h.y + life * (GROUND - h.y), 0x93c5fd)
          }
          // Les fleurs poussent l'une après l'autre devant lui.
          for (let i = 0; i < 6; i++) flower(c, x + 26 + i * 5, t, ease(p * 6 - i * 0.8), PETALS[i % PETALS.length]!, 4 + (i % 3) * 2)
        }],
        [4, (c, t) => {
          garden(c)
          for (let i = 0; i < 6; i++) flower(c, 30 + i * 5, t, 1, PETALS[i % PETALS.length]!, 4 + (i % 3) * 2)
          sparkles(c, t, 42, GROUND - 8, 12, 0xfde047, 4)
          gardener(c, { x: 4, y: BASE_Y - Math.round(hop((t * 2) % 1) * 2), arms: [70, 70], eyes: 'happy', look: 2 })
        }],
      ]),
    },
    {
      id: 'papillons',
      name: 'Chasse aux papillons',
      draw: (c, t) => {
        garden(c)
        const bx = centerX(c) + 8 + Math.sin(t * 0.9) * (c.w / 2 - 10)
        const by = 3 + Math.sin(t * 2.3) * 2
        butterfly(c, bx, by, t, 0xa78bfa)
        butterfly(c, bx + 6 + Math.sin(t * 3) * 3, by + 3, t + 0.2, 0xfacc15)
        const x = bx - 8 - Math.cos(t * 0.9) * 10
        const air = hop((t * 1.6) % 1)
        gardener(c, { x, y: BASE_Y - Math.round(air * 3), arms: [80, 60], legs: walkLegs(t, 5), eyes: 'happy', look: Math.cos(t * 0.9) > 0 ? 2 : -2 })
      },
    },
    {
      id: 'carotte',
      name: 'La carotte récalcitrante',
      draw: story([
        [4, (c, t, p) => {
          garden(c)
          const x = centerX(c) - 6
          const strain = Math.round(Math.sin(t * 14) * 0.6)
          // Les fanes de la carotte, encore en terre.
          c.line(x + 24, GROUND - 1, x + 23, GROUND - 4, GRASS_DARK)
          c.line(x + 24, GROUND - 1, x + 26, GROUND - 4, GRASS_DARK)
          gardener(c, { x: x + strain, y: BASE_Y, arms: [-10, -10], lean: -2 - Math.round(p * 2), squash: p > 0.5 ? 1 : 0, eyes: 'closed', look: 2 })
        }],
        [1, (c, t, p) => {
          garden(c)
          const x = centerX(c) - 6 - Math.round(ease(p) * 6)
          gardener(c, { x, y: BASE_Y + Math.round(p * 2), arms: [60, 60], squash: 1, eyes: 'wide', look: 2 })
          c.line(x + 24, GROUND - 6 - p * 3, x + 26, GROUND - 2, 0xf97316)
        }],
        [4, (c, t) => {
          garden(c)
          const x = centerX(c) - 12
          const pose: Pose = { x, y: BASE_Y - Math.round(hop((t * 2) % 1) * 2), arms: [-40, 85], eyes: 'happy' }
          gardener(c, pose)
          const h = hand(pose, 1)
          c.line(h.x + 1, h.y - 1, h.x + 1, h.y - 5, 0xf97316)
          c.set(h.x, h.y - 6, GRASS_DARK)
          c.set(h.x + 2, h.y - 6, GRASS_DARK)
        }],
      ]),
    },
    {
      id: 'abeilles',
      name: 'Les abeilles bourdonnent',
      draw: (c, t) => {
        garden(c)
        const x = centerX(c)
        for (let i = 0; i < 4; i++) flower(c, x - 12 + i * 14, t, 1, PETALS[i]!, 5)
        for (let i = 0; i < 3; i++) {
          const a = t * (1.5 + i * 0.3) + i * 2
          bee(c, x + 8 + Math.sin(a) * 20, 5 + Math.sin(a * 2) * 3, t)
        }
        const dodge = Math.round(Math.sin(t * 3) * 2)
        gardener(c, { x: x + dodge, y: BASE_Y, arms: [40 + dodge * 15, 40 - dodge * 15], eyes: 'wide', look: dodge })
      },
    },
    {
      id: 'averse',
      name: 'Averse et arc-en-ciel',
      draw: story([
        [8, (c, t) => {
          garden(c, false)
          falling(c, t, { count: 34, speed: 22, color: 0x60a5fa, length: 2 })
          const x = centerX(c) + Math.sin(t * 0.8) * 10
          // Il piétine dans une flaque qui éclabousse à chaque pas.
          const stomp = Math.floor(t * 3) % 2
          c.rect(x - 2, GROUND, 20, 1, 0x3b82f6)
          sparkles(c, t, x + (stomp ? 3 : 13), GROUND - 2, 4, 0x93c5fd, 4)
          const pose: Pose = { x, y: BASE_Y, arms: [60, -30], legs: stomp ? [2, 2, 0, 0] : [0, 0, 2, 2], eyes: 'happy' }
          drawClawd(c, pose)
          // Le parapluie juste au-dessus de sa tête, tenu de la main gauche.
          const { cx, top } = crown(pose)
          sprite(c, cx - 5, top - 4, UMBRELLA.slice(0, 3), { r: 0xef4444 })
          const h = hand(pose, -1)
          c.line(h.x + 1, h.y, cx - 3, top - 2, 0x374151)
        }],
        [5, (c, t, p) => {
          garden(c)
          // L'arc-en-ciel qui se dessine au-dessus de lui.
          const colors: readonly Color[] = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x3b82f6, 0xa855f7]
          const cx = c.w / 2
          colors.forEach((color, i) => {
            const r = 18 - i
            for (let a = 0; a < Math.PI * ease(p * 1.5); a += 0.05) c.set(cx + Math.cos(Math.PI - a) * r * 1.6, GROUND + 4 - Math.sin(a) * r * 0.9, mix(color, 0x000000, 0.2))
          })
          gardener(c, { x: centerX(c), y: BASE_Y, arms: [70, 70], eyes: 'happy', legs: [0, 0, 0, 0] })
        }],
      ]),
    },
  ],
}
