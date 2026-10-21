import { type Canvas, type Color, mix, noise } from '../canvas'
import { BODY_W, blink, drawClawd, FIGURE_H } from '../clawd'
import { GROUND, type Special, type Theme } from './theme'

const FLOOR_COLORS = [0xec4899, 0x22d3ee, 0xfacc15, 0xa78bfa]
const NOTE_COLORS = [0xf472b6, 0x67e8f9, 0xfde047]
const BASE_Y = GROUND - FIGURE_H
// Le personnage centré sur la scène, quelle que soit sa largeur.
const centerX = (c: Canvas) => Math.round((c.w - BODY_W) / 2)
// La boule à facettes pend dans un coin, loin de la tête.
const DISCO_X = 5

// Le dancefloor : des dalles qui changent de couleur sur le temps.
const floor = (c: Canvas, t: number, isLit: boolean) => {
  const beat = Math.floor(t * 2.5)
  for (let tile = 0; tile < c.w / 6; tile++) {
    const color = FLOOR_COLORS[(tile + beat) % FLOOR_COLORS.length]!
    c.rect(tile * 6, GROUND, 5, 1, isLit ? color : mix(color, 0x000000, 0.75))
  }
}

// La boule à facettes, dont les reflets tournent.
const discoBall = (c: Canvas, cx: number, t: number, isOn: boolean) => {
  c.line(cx, 0, cx, 0, 0x6b7280)
  c.disc(cx, 2, 1.6, isOn ? 0xd1d5db : 0x6b7280)
  if (!isOn) return
  const spin = Math.floor(t * 8)
  for (let i = 0; i < 4; i++) {
    const angle = (spin + i * 2) * 0.8
    const r = 5 + 2 * noise(spin + i)
    c.set(cx + Math.cos(angle) * r * 1.6, 2 + Math.sin(angle) * r * 0.5, FLOOR_COLORS[(spin + i) % 4]!)
  }
}

// Une croche de 3×5 px.
const note = (c: Canvas, x: number, y: number, color: Color) => {
  c.rect(x, y + 3, 2, 2, color)
  c.line(x + 1, y, x + 1, y + 3, color)
  c.set(x + 2, y, color)
  c.set(x + 2, y + 1, color)
}

// Des notes qui montent et disparaissent, autour de `cx`.
const floatingNotes = (c: Canvas, t: number, cx: number, count: number) => {
  for (let i = 0; i < count; i++) {
    const life = (t * 0.7 + i / count) % 1
    const side = i % 2 === 0 ? -1 : 1
    const x = cx + side * (13 + 4 * noise(i)) + Math.sin(life * 6 + i) * 1.5
    const y = GROUND - 6 - life * 9
    if (life < 0.85) note(c, x, y, NOTE_COLORS[i % NOTE_COLORS.length]!)
  }
}

// Des étincelles qui scintillent au hasard autour d'un point.
const sparkles = (c: Canvas, t: number, cx: number, cy: number, spread: number) => {
  const frame = Math.floor(t * 10)
  for (let i = 0; i < 5; i++) {
    const seed = frame * 7 + i
    if (noise(seed) > 0.6) continue
    c.set(cx + (noise(seed + 1) - 0.5) * spread * 2, cy + (noise(seed + 2) - 0.5) * spread, 0xfef3c7)
  }
}

const FIREWORKS = [0xf472b6, 0xfde047, 0x67e8f9, 0xa3e635, 0xf97316]

// Le Nouvel An : des feux d'artifice au-dessus du dancefloor.
const newYear: Special = {
  dates: ['12-31', '01-01'],
  occasion: 'le Nouvel An',
  anim: {
    id: 'bonne-annee',
    name: 'Bonne année !',
    draw: (c, t) => {
      for (let i = 0; i < 3; i++) {
        const local = t + i * 0.8
        const round = Math.floor(local / 2.4)
        const p = (local % 2.4) / 2.4
        const fx = 5 + noise(i * 11 + round * 3) * (c.w - 10)
        const color = FIREWORKS[(i + round) % FIREWORKS.length]!
        if (p < 0.35) c.set(fx, GROUND - 1 - (p / 0.35) * (GROUND - 6), 0xfef3c7)
        else {
          const k = (p - 0.35) / 0.65
          for (let a = 0; a < 10; a++) {
            const angle = (a / 10) * Math.PI * 2
            c.set(fx + Math.cos(angle) * k * 5, 5 + Math.sin(angle) * k * 3.5, mix(color, 0x000000, k * 0.8))
          }
        }
      }
      floor(c, t, true)
      const beat = Math.floor(t * 2.5) % 2
      drawClawd(c, { x: centerX(c), y: BASE_Y - beat, arms: beat ? [80, 20] : [20, 80], legs: beat ? [0, 1, 0, 0] : [0, 0, 1, 0], eyes: 'happy' })
    },
  },
}

export const dance: Theme = {
  id: 'danse',
  name: 'Danse',
  emoji: '💃',
  pitch: 'une boule à facettes, un dancefloor qui clignote, du disco, un moonwalk, de la danse robot',
  dress: (c, pose) => drawClawd(c, pose),
  scene: (c, t) => {
    floor(c, t, true)
    discoBall(c, DISCO_X, t, true)
  },
  sky: 'own',
  // La fête : une toupie sous la boule à facettes, puis un grand saut, et des notes partout.
  cheer: (c, t) => {
    const k = t % 2
    const isSpinning = k < 1.3
    const width = isSpinning ? Math.max(4, Math.round(BODY_W * Math.abs(Math.cos(t * 9)))) : BODY_W
    const air = isSpinning ? 0 : Math.sin(((k - 1.3) / 0.7) * Math.PI)
    const pose = { x: centerX(c) + Math.round((BODY_W - width) / 2), y: BASE_Y - Math.round(air * 3), width, arms: [80, 80] as const, eyes: isSpinning && width < 10 ? ('none' as const) : ('happy' as const) }
    drawClawd(c, pose)
    floatingNotes(c, t, centerX(c) + 8, 6)
  },
  specials: [newYear],

  idle: {
    id: 'pause',
    name: 'tape du pied en attendant',
    draw: (c, t) => {
      floor(c, t, false)
      discoBall(c, DISCO_X, t, false)
      const tap = Math.floor(t * 1.2) % 2
      drawClawd(c, { x: centerX(c), y: BASE_Y, arms: [-70, -70], legs: [0, 0, 0, tap], eyes: blink(t), look: 1 })
    },
  },

  anims: [
    {
      id: 'disco',
      name: 'Disco Fever',
      draw: (c, t) => {
        floor(c, t, true)
        discoBall(c, DISCO_X, t, true)
        const beat = Math.floor(t * 2.5) % 4
        const isUp = beat % 2 === 0
        const side = beat < 2 ? 1 : -1
        drawClawd(c, {
          x: centerX(c) + side,
          y: BASE_Y - (isUp ? 1 : 0),
          arms: isUp ? (side > 0 ? [-60, 65] : [65, -60]) : [-20, -20],
          legs: isUp ? (side > 0 ? [0, 0, 1, 2] : [2, 1, 0, 0]) : [0, 0, 0, 0],
          lean: side * (isUp ? 2 : 1),
          eyes: 'happy',
        })
        floatingNotes(c, t, c.w / 2, 3)
      },
    },
    {
      id: 'moonwalk',
      name: 'Moonwalk',
      draw: (c, t) => {
        floor(c, t, true)
        const span = c.w + 26
        const x = c.w - BODY_W - 6 - ((t * 9) % span)
        const wrapped = x < -BODY_W - 10 ? x + span : x
        const step = Math.floor(t * 4) % 2
        drawClawd(c, {
          x: wrapped,
          y: BASE_Y,
          arms: step === 0 ? [-40, -75] : [-75, -40],
          legs: step === 0 ? [0, 2, 0, 2] : [2, 0, 2, 0],
          lean: -1,
          look: 2,
          eyes: blink(t, 'happy'),
        })
        // Des notes laissées derrière lui.
        for (let i = 0; i < 3; i++) {
          const age = (t * 1.3 + i / 3) % 1
          note(c, wrapped + BODY_W + 4 + age * 10, BASE_Y + 2 - age * 6, NOTE_COLORS[i]!)
        }
      },
    },
    {
      id: 'robot',
      name: 'Danse du robot',
      draw: (c, t) => {
        floor(c, t, true)
        const POSES = [
          [0, 0], [90, -90], [-90, 90], [90, 90], [0, -90], [-90, 0], [45, 45], [-90, -90],
        ] as const
        const step = Math.floor(t * 3)
        const arms = POSES[step % POSES.length]!
        drawClawd(c, {
          x: centerX(c) + (step % 4 < 2 ? -1 : 1),
          y: BASE_Y,
          arms,
          legs: step % 2 === 0 ? [0, 0, 0, 0] : [1, 0, 0, 1],
          eyes: 'square',
          eyeColor: step % 3 === 0 ? 0x7dd3fc : 0x38bdf8,
        })
        // Un petit « bip » au-dessus de la tête à chaque mouvement.
        if ((t * 3) % 1 < 0.3) {
          c.set(centerX(c) + BODY_W + 3, BASE_Y - 2, 0x7dd3fc)
          c.set(centerX(c) + BODY_W + 5, BASE_Y - 3, 0x7dd3fc)
        }
      },
    },
    {
      id: 'saut',
      name: 'Sauts de joie',
      draw: (c, t) => {
        floor(c, t, true)
        const p = (t * 1.3) % 1
        const air = Math.sin(p * Math.PI)
        const isLanding = p < 0.08 || p > 0.92
        drawClawd(c, {
          x: centerX(c),
          y: BASE_Y - Math.round(air * 4),
          arms: air > 0.3 ? [80, 80] : [-30, -30],
          legs: air > 0.3 ? [1, 2, 2, 1] : [0, 0, 0, 0],
          squash: isLanding ? 1 : air > 0.8 ? -1 : 0,
          eyes: 'happy',
        })
        if (air > 0.5) sparkles(c, t, c.w / 2, BASE_Y - 1, 14)
        floatingNotes(c, t, c.w / 2, 2)
      },
    },
    {
      id: 'toupie',
      name: 'La toupie',
      draw: (c, t) => {
        floor(c, t, true)
        discoBall(c, DISCO_X, t, true)
        const face = Math.floor(t * 7) % 4
        const isSide = face % 2 === 1
        const width = isSide ? 10 : BODY_W
        drawClawd(c, {
          x: centerX(c) + (BODY_W - width) / 2,
          y: BASE_Y,
          width,
          arms: [10, 10],
          legs: face === 0 ? [0, 1, 0, 1] : [1, 0, 1, 0],
          eyes: face === 2 ? 'none' : 'happy',
          look: face === 1 ? 2 : face === 3 ? -2 : 0,
        })
        // Des traits de vitesse qui tournent autour.
        for (let i = 0; i < 3; i++) {
          const a = t * 9 + (i * Math.PI * 2) / 3
          c.set(c.w / 2 + Math.cos(a) * 15, BASE_Y + 5 + Math.sin(a) * 4, 0xfef3c7)
        }
      },
    },
  ],
}
