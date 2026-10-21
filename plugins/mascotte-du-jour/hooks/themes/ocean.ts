import { type Canvas, type Color, mix, noise } from '../canvas'
import { blink, crown, drawClawd, type Pose } from '../clawd'
import { BASE_Y, bubbles, centerX, ease, hop, lerp, sparkles, sprite, story } from './common'
import { GROUND, STAGE_H, type Special, type Theme } from './theme'

const SAND = 0xfde68a
const KELP = 0x15803d
const FISH: readonly Color[] = [0xfb923c, 0xfacc15, 0x38bdf8, 0xf472b6]

// Le fond marin : un dégradé bleu nuit, du sable et des algues qui ondulent.
const seabed = (c: Canvas, t: number) => {
  for (let y = 0; y < STAGE_H; y++) {
    const color = mix(0x0c4a6e, 0x082f49, y / STAGE_H)
    for (let x = (y * 7) % 3; x < c.w; x += 3) c.set(x, y, color)
  }
  for (let x = 0; x < c.w; x++) c.set(x, GROUND, noise(x) > 0.8 ? 0xd6b46a : SAND)
  for (let i = 0; i < c.w / 9; i++) {
    const kx = i * 9 + 3 + noise(i) * 4
    const height = 3 + Math.round(noise(i + 5) * 4)
    for (let k = 0; k < height; k++) c.set(kx + Math.sin(t * 2 + k * 0.6 + i) * (k / 3), GROUND - 1 - k, KELP)
  }
}

// Un poisson de 4×2 px qui nage dans la direction `dir`.
const fish = (c: Canvas, x: number, y: number, color: Color, dir: 1 | -1) => {
  c.rect(x, y, 3, 2, color)
  c.set(x + (dir > 0 ? -1 : 3), y + (Math.floor(x) % 2), mix(color, 0x000000, 0.3))
  c.set(x + (dir > 0 ? 2 : 0), y, 0x0f172a)
}

// Le tuba qui dépasse de la tête, et ses bulles.
const snorkel = (c: Canvas, pose: Pose, t: number) => {
  const { cx, top } = crown(pose)
  c.line(cx + 4, top - 1, cx + 4, top - 4, 0xfacc15)
  c.set(cx + 5, top - 4, 0xfacc15)
  if (t % 1.5 < 0.4) c.set(cx + 5, top - 6 - (t % 1.5) * 6, 0xbae6fd)
}

const CHEST = ['.bbbbbb.', 'bbyybbbb', 'bbbbbbbb', 'bbbyybbb', 'bbbbbbbb']
const SHARK = ['.......g....', '......gg....', 'g...gggggg..', 'gggggggggwgg', 'g...ggggggg.', '......g.....']

const PAPER_FISH = ['.ooo..o', 'ooooooo', '.ooo..o']

// Le 1er avril : un poisson en papier collé dans le dos, et il ne s'en rend pas compte.
const aprilFool: Special = {
  dates: ['04-01'],
  occasion: 'le 1er avril',
  anim: {
    id: 'poisson-avril',
    name: 'Poisson d’avril !',
    draw: (c, t) => {
      seabed(c, t)
      const cycle = t % 8
      const isLooking = cycle > 6
      const dir = Math.floor(t / 8) % 2 === 0 ? 1 : -1
      const k = Math.min(cycle, 6) / 6
      const x = Math.round(dir > 0 ? lerp(4, c.w - 20, k) : lerp(c.w - 20, 4, k))
      const look = isLooking ? (Math.floor(cycle * 3) % 2 ? 2 : -2) : dir * 2
      const pose: Pose = { x, y: BASE_Y, arms: isLooking ? [60, 60] : [-40, -40], legs: isLooking ? [0, 0, 0, 0] : [0, 1, 0, 1], eyes: isLooking ? 'wide' : 'open', look }
      drawClawd(c, pose)
      snorkel(c, pose, t)
      // Le poisson en papier, du côté du dos.
      sprite(c, dir > 0 ? x - 4 : x + 13, BASE_Y + 3, PAPER_FISH, { o: 0xfb923c }, dir > 0)
      // Les vrais poissons qui passent en rigolant (des bulles).
      for (let i = 0; i < 3; i++) {
        const fx = (c.w + 8 - ((t * 5 + i * 17) % (c.w + 16)))
        fish(c, fx, 3 + i * 3, FISH[i % FISH.length]!, -1)
        if (Math.floor(t * 3 + i) % 3 === 0) c.set(fx - 1, 2 + i * 3, 0xbae6fd)
      }
      if (isLooking) c.set(x + 8, BASE_Y - 3, 0xfde047)
    },
  },
}

export const oceanTheme: Theme = {
  id: 'ocean',
  name: 'Océan',
  emoji: '🌊',
  pitch: 'la plongée sous-marine, des bancs de poissons, un requin, un trésor englouti, des méduses lumineuses, du surf',
  dress: (c, pose, t) => {
    drawClawd(c, pose)
    snorkel(c, pose, t)
  },
  scene: (c, t) => seabed(c, t),
  sky: 'own',
  // La fête : un geyser de bulles le soulève, et les poissons font la ronde.
  cheer: (c, t) => {
    const x = centerX(c)
    const lift = (Math.sin(t * 3) + 1) / 2
    const y = BASE_Y - 1 - Math.round(lift * 3)
    for (let i = 0; i < 14; i++) {
      const life = (t * 2 + i / 14) % 1
      c.dot(x + 8 + Math.sin(i * 2.3 + t * 5) * 5, GROUND - life * (GROUND - y), i % 3 ? 0xbae6fd : 0xe0f2fe)
    }
    for (let i = 0; i < 4; i++) {
      const a = t * 1.8 + (i / 4) * Math.PI * 2
      fish(c, x + 7 + Math.cos(a) * 20, 6 + Math.sin(a) * 4, FISH[i]!, Math.sin(a) > 0 ? -1 : 1)
    }
    const pose: Pose = { x, y, arms: [80, 80], legs: [1, 1, 1, 1], eyes: 'happy' }
    drawClawd(c, pose)
    snorkel(c, pose, t)
  },
  specials: [aprilFool],

  idle: {
    id: 'flotte',
    name: 'flotte entre les algues',
    draw: (c, t) => {
      seabed(c, t)
      bubbles(c, t, 6)
      const fx = ((t * 4) % (c.w + 10)) - 5
      fish(c, fx, 4, FISH[0]!, 1)
      const pose: Pose = { x: centerX(c), y: BASE_Y - 2 + Math.round(Math.sin(t)), arms: [10, 10], legs: [1, 0, 1, 0], eyes: blink(t) }
      drawClawd(c, pose)
      snorkel(c, pose, t)
    },
  },

  anims: [
    {
      id: 'plongee',
      name: 'Plongée avec les poissons',
      draw: (c, t) => {
        seabed(c, t)
        bubbles(c, t, 8)
        const span = c.w + 30
        const x = ((t * 8) % span) - 20
        const kick = Math.floor(t * 5) % 2
        const pose: Pose = { x, y: BASE_Y - 3 + Math.round(Math.sin(t * 1.5) * 2), arms: [kick ? 20 : -10, kick ? -10 : 20], legs: kick ? [0, 2, 0, 2] : [2, 0, 2, 0], lean: 2, eyes: 'happy', look: 2 }
        drawClawd(c, pose)
        snorkel(c, pose, t)
        // Le banc de poissons qui le suit.
        for (let i = 0; i < 6; i++) fish(c, x - 6 - (i % 3) * 5 + Math.sin(t * 3 + i), 3 + Math.floor(i / 3) * 4 + Math.sin(t * 2 + i), FISH[i % 4]!, 1)
      },
    },
    {
      id: 'requin',
      name: 'Un requin passe…',
      draw: (c, t) => {
        seabed(c, t)
        const period = 6
        const p = (t % period) / period
        const sx = c.w + 4 - p * (c.w + 20)
        sprite(c, sx, 2, SHARK, { g: 0x64748b, w: 0xf8fafc })
        const isClose = sx < centerX(c) + 30 && sx > centerX(c) - 16
        const pose: Pose = { x: centerX(c), y: BASE_Y + (isClose ? 1 : 0), arms: isClose ? [-90, -90] : [10, 10], squash: isClose ? 1 : 0, eyes: isClose ? 'wide' : blink(t), look: sx > centerX(c) ? 2 : -2 }
        drawClawd(c, pose)
        snorkel(c, pose, t)
        if (!isClose) bubbles(c, t, 5)
      },
    },
    {
      id: 'tresor-englouti',
      name: 'Le trésor englouti',
      draw: story([
        [5, (c, t, p) => {
          seabed(c, t)
          bubbles(c, t, 5)
          const cx = c.w - 18
          sprite(c, cx, GROUND - 5, CHEST, { b: 0x78350f, y: 0xfacc15 })
          const x = lerp(2, cx - 18, ease(p))
          const pose: Pose = { x, y: BASE_Y - 2 + Math.round(Math.sin(t * 2)), arms: [20, 20], legs: Math.floor(t * 4) % 2 ? [0, 2, 0, 2] : [2, 0, 2, 0], eyes: blink(t), look: 2 }
          drawClawd(c, pose)
          snorkel(c, pose, t)
        }],
        [5, (c, t) => {
          seabed(c, t)
          const cx = c.w - 18
          sprite(c, cx, GROUND - 5, CHEST, { b: 0x78350f, y: 0xfacc15 })
          for (let i = 0; i < 8; i++) {
            const life = (t * 0.8 + i / 8) % 1
            c.set(cx + 3 + Math.sin(i * 2 + t) * 3, GROUND - 6 - life * 9, life < 0.5 ? 0xfacc15 : 0xbae6fd)
          }
          const pose: Pose = { x: cx - 18, y: BASE_Y - 1 - Math.round(hop((t * 1.5) % 1) * 2), arms: [70, 70], eyes: 'happy', look: 2 }
          drawClawd(c, pose)
          snorkel(c, pose, t)
        }],
      ]),
    },
    {
      id: 'meduses',
      name: 'Ballet des méduses',
      draw: (c, t) => {
        seabed(c, t)
        const pulse = (k: number) => Math.sin(t * 2 + k)
        for (let i = 0; i < 4; i++) {
          const jx = 6 + i * ((c.w - 12) / 3)
          if (Math.abs(jx - (centerX(c) + 8)) < 14) continue
          const jy = 3 + pulse(i) * 2
          const glow = mix(0xf0abfc, 0xa78bfa, (pulse(i) + 1) / 2)
          c.rect(jx - 2, jy, 5, 2, glow)
          c.rect(jx - 1, jy - 1, 3, 1, glow)
          for (let k = 0; k < 3; k++) c.line(jx - 2 + k * 2, jy + 2, jx - 2 + k * 2 + Math.sin(t * 3 + k), jy + 5, mix(glow, 0x000000, 0.4))
        }
        // Il imite les méduses : il monte et descend, les bras qui pulsent.
        const pose: Pose = { x: centerX(c), y: BASE_Y - 2 - Math.round(pulse(0) * 2), arms: [pulse(0) > 0 ? 60 : -20, pulse(0) > 0 ? 60 : -20], legs: [1, 1, 1, 1], eyes: 'happy' }
        drawClawd(c, pose)
        snorkel(c, pose, t)
      },
    },
    {
      id: 'surf',
      name: 'Surf sur la vague',
      draw: (c, t) => {
        // Le ciel au-dessus de l'eau, un soleil, et une grande vague.
        c.disc(c.w - 7, 3, 2.5, 0xfde047)
        const x = centerX(c) + Math.round(Math.sin(t * 0.7) * (c.w / 2 - 14))
        const crest = Math.sin(t * 2)
        for (let wx = 0; wx < c.w; wx++) {
          const h = 2 + Math.round(Math.max(0, 3 - Math.abs(wx - x - 8) / 5) + Math.sin(wx * 0.4 - t * 4) * 0.8)
          for (let k = 0; k < h; k++) c.set(wx, GROUND - k, k === h - 1 ? 0xe0f2fe : 0x0284c7)
        }
        const y = BASE_Y - 4 + Math.round(crest)
        // La planche sous ses pieds.
        c.rect(x - 2, y + 11, 21, 1, 0xf97316)
        c.set(x + 19, y + 10, 0xf97316)
        drawClawd(c, { x, y, arms: [30 - crest * 20, 10 + crest * 20], lean: Math.round(crest * 2), squash: 1, eyes: 'happy', look: 2 })
        sparkles(c, t, x - 4, y + 9, 3, 0xe0f2fe, 4)
      },
    },
  ],
}
