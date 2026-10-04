import { type Canvas, mix, noise } from '../canvas'
import { BODY_W, blink, crown, drawClawd, hand, type Pose } from '../clawd'
import { BASE_Y, centerX, ease, falling, hop, lerp, sparkles, story, walkLegs } from './common'
import { GROUND, type Theme } from './theme'

const PITCH = 0x16a34a
const PITCH_LIGHT = 0x22c55e
const BALL = 0xf8fafc
const SWEAT = 0x93c5fd

// Le terrain : de l'herbe rayée.
const pitch = (c: Canvas) => {
  for (let x = 0; x < c.w; x++) c.set(x, GROUND, Math.floor(x / 4) % 2 ? PITCH : PITCH_LIGHT)
}

// Un bandeau de sportif sur le front.
const athlete = (c: Canvas, pose: Pose) => {
  drawClawd(c, pose)
  const { cx, top, w } = crown(pose)
  c.rect(cx - w / 2, top + 1, w, 1, 0xef4444)
}

// Un ballon de foot de 3×3 px.
const ball = (c: Canvas, x: number, y: number) => {
  c.rect(x - 1, y - 1, 3, 3, BALL)
  c.set(x, y, 0x111827)
}

// Le but : un cadre blanc et son filet.
const goal = (c: Canvas, x: number, bulge = 0) => {
  c.line(x, GROUND - 9, x, GROUND - 1, BALL)
  c.line(x, GROUND - 9, x + 7, GROUND - 9, BALL)
  for (let y = GROUND - 8; y < GROUND; y += 2) for (let k = 1; k < 7; k += 2) c.set(x + k + (y === GROUND - 4 ? bulge : 0), y, 0x9ca3af)
}

export const sportTheme: Theme = {
  id: 'sport',
  name: 'Sport',
  emoji: '⚽',
  pitch: 'un bandeau de sportif, des jongles, un penalty, un panier de basket, des haltères, un sprint jusqu’à la ligne d’arrivée',
  dress: (c, pose) => athlete(c, pose),
  scene: c => pitch(c),
  sky: 'open',

  idle: {
    id: 'echauffement',
    name: 's’échauffe',
    draw: (c, t) => {
      pitch(c)
      const stretch = Math.sin(t * 1.2)
      athlete(c, { x: centerX(c), y: BASE_Y, arms: [stretch > 0 ? 85 : -60, stretch > 0 ? -60 : 85], lean: Math.round(stretch * 2), eyes: blink(t) })
    },
  },

  anims: [
    {
      id: 'jongles',
      name: 'Jongles',
      draw: (c, t) => {
        pitch(c)
        const x = centerX(c)
        const p = (t * 1.4) % 1
        const kick = p < 0.15 || p > 0.9
        athlete(c, { x, y: BASE_Y, arms: [20, 20], legs: kick ? [0, 0, 0, 2] : [0, 0, 0, 0], eyes: 'happy', look: 2 })
        ball(c, x + BODY_W - 1, GROUND - 2 - hop(p) * 10)
        const juggles = Math.floor(t * 1.4) % 10
        for (let i = 0; i < juggles; i++) c.set(2 + i * 2, 1, 0xfacc15)
      },
    },
    {
      id: 'penalty',
      name: 'Le penalty',
      draw: story([
        [2.5, (c, t, p) => {
          pitch(c)
          const gx = c.w - 10
          goal(c, gx)
          const x = lerp(2, gx - 34, ease(p))
          athlete(c, { x, y: BASE_Y, arms: [-30, -30], legs: walkLegs(t, 6), lean: 2, eyes: 'wide', look: 2 })
          ball(c, gx - 16, GROUND - 2)
        }],
        [1, (c, t, p) => {
          pitch(c)
          const gx = c.w - 10
          goal(c, gx, p > 0.8 ? 1 : 0)
          athlete(c, { x: gx - 34, y: BASE_Y, arms: [40, -20], legs: [0, 0, 0, 2], lean: 2, eyes: 'wide', look: 2 })
          ball(c, lerp(gx - 16, gx + 4, p), GROUND - 2 - hop(p) * 6)
        }],
        [4, (c, t) => {
          pitch(c)
          const gx = c.w - 10
          goal(c, gx, 1)
          ball(c, gx + 4, GROUND - 4)
          falling(c, t, { count: 24, speed: 8, color: 0xfacc15, colors: [0xfacc15, 0xef4444, 0x3b82f6, BALL] })
          athlete(c, { x: gx - 34, y: BASE_Y - Math.round(hop((t * 2) % 1) * 3), arms: [85, 85], eyes: 'happy', look: 2 })
        }],
      ]),
    },
    {
      id: 'basket',
      name: 'Smash au basket',
      draw: story([
        [3, (c, t, p) => {
          for (let x = 0; x < c.w; x++) c.set(x, GROUND, 0xb45309)
          const hx = c.w - 6
          c.line(hx, 2, hx, GROUND - 1, 0x6b7280)
          c.rect(hx - 6, 4, 6, 1, 0xf97316)
          const x = lerp(2, hx - 30, p)
          const pose: Pose = { x, y: BASE_Y, arms: [-30, -20], legs: walkLegs(t, 5), eyes: blink(t), look: 2 }
          athlete(c, pose)
          // Le dribble : le ballon rebondit entre la main et le sol.
          const h = hand(pose, 1)
          const bounce = Math.abs(Math.sin(t * 7))
          c.disc(h.x + 2, lerp(h.y + 1, GROUND - 2, bounce), 1.2, 0xf97316)
        }],
        [1.2, (c, t, p) => {
          for (let x = 0; x < c.w; x++) c.set(x, GROUND, 0xb45309)
          const hx = c.w - 6
          c.line(hx, 2, hx, GROUND - 1, 0x6b7280)
          c.rect(hx - 6, 4, 6, 1, 0xf97316)
          const x = lerp(hx - 30, hx - 22, p)
          const pose: Pose = { x, y: BASE_Y - Math.round(hop(p) * 5), arms: [80, 80], legs: [2, 2, 2, 2], eyes: 'wide', look: 2 }
          athlete(c, pose)
          const h = hand(pose, 1)
          c.disc(lerp(h.x + 1, hx - 3, p), lerp(h.y - 1, 3, p), 1.2, 0xf97316)
        }],
        [2.5, (c, t) => {
          for (let x = 0; x < c.w; x++) c.set(x, GROUND, 0xb45309)
          const hx = c.w - 6
          c.line(hx, 2, hx, GROUND - 1, 0x6b7280)
          c.rect(hx - 6, 4, 6, 1, 0xf97316)
          c.disc(hx - 3, Math.min(GROUND - 2, 6 + t * 8), 1.2, 0xf97316)
          athlete(c, { x: hx - 24, y: BASE_Y - Math.round(hop((t * 2) % 1) * 2), arms: [70, 70], eyes: 'happy', look: -1 })
          sparkles(c, t, hx - 4, 5, 4, 0xfacc15)
        }],
      ]),
    },
    {
      id: 'halteres',
      name: 'Séance d’haltères',
      draw: (c, t) => {
        for (let x = 0; x < c.w; x++) c.set(x, GROUND, 0x374151)
        const x = centerX(c)
        const p = (t / 2.2) % 1
        const isUp = p > 0.35 && p < 0.75
        const pose: Pose = { x, y: BASE_Y, arms: isUp ? [80, 80] : [10, 10], squash: isUp ? 0 : 1, eyes: isUp ? 'closed' : 'wide' }
        athlete(c, pose)
        // La barre, tenue des deux mains, avec ses poids.
        const l = hand(pose, -1)
        const r = hand(pose, 1)
        c.line(l.x - 2, l.y, r.x + 3, r.y, 0x9ca3af)
        c.rect(l.x - 4, l.y - 2, 2, 5, 0x111827)
        c.rect(r.x + 3, r.y - 2, 2, 5, 0x111827)
        if (isUp) {
          for (let i = 0; i < 2; i++) c.set(x + (i ? BODY_W + 1 : -2), BASE_Y + 1 + ((t * 8 + i * 3) % 6), SWEAT)
        }
      },
    },
    {
      id: 'sprint',
      name: 'Sprint final',
      draw: (c, t) => {
        // La piste qui défile, avec ses lignes.
        for (let x = 0; x < c.w; x++) c.set(x, GROUND, 0xb91c1c)
        for (let i = 0; i < c.w / 8 + 1; i++) {
          const lx = ((i * 8 - t * 40) % (c.w + 8) + c.w + 8) % (c.w + 8)
          c.rect(lx, GROUND, 3, 1, BALL)
        }
        const lap = t % 6
        const x = centerX(c) - 8
        const isFinish = lap > 4.5
        // Les traits de vitesse derrière lui.
        for (let i = 0; i < 4; i++) c.line(x - 4 - i * 3 - noise(Math.floor(t * 10) + i) * 3, BASE_Y + 2 + i * 2, x - 2 - i * 3, BASE_Y + 2 + i * 2, mix(0xf8fafc, 0x000000, 0.5))
        if (isFinish) {
          const tx = x + 22
          c.line(tx, BASE_Y + 4, tx + 2 + (lap - 4.5) * 10, BASE_Y + 2, BALL)
          c.line(tx, BASE_Y + 4, tx - 2, BASE_Y + 9, BALL)
          sparkles(c, t, tx, BASE_Y, 8, 0xfacc15)
        } else {
          c.line(c.w - (lap / 4.5) * (c.w - x - 22), 2, c.w - (lap / 4.5) * (c.w - x - 22), GROUND - 1, BALL)
        }
        athlete(c, { x, y: BASE_Y - Math.floor(t * 8) % 2, arms: isFinish ? [80, 80] : Math.floor(t * 8) % 2 ? [40, -40] : [-40, 40], legs: walkLegs(t, 8), lean: 3, eyes: isFinish ? 'happy' : 'closed', look: 2 })
      },
    },
  ],
}
