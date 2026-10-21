import { type Canvas, mix, noise } from '../canvas'
import { BODY_W, blink, drawClawd, FIGURE_H, headTop, ORANGE, type Pose } from '../clawd'
import { GROUND, STAGE_H, type Theme } from './theme'

const BASE_Y = GROUND - FIGURE_H
// Le personnage centré sur la scène, quelle que soit sa largeur.
const centerX = (c: Canvas) => Math.round((c.w - BODY_W) / 2)
const MOON = 0x9ca3af
const MOON_DARK = 0x6b7280

// Un ciel étoilé qui scintille et défile doucement vers la gauche.
const stars = (c: Canvas, t: number, drift: number) => {
  for (let i = 0; i < 22; i++) {
    const x = (noise(i * 3.1 + 17) * c.w - t * drift * (0.5 + noise(i + 50))) % c.w
    const y = noise(i + 100) * (STAGE_H - 2)
    const shine = 0.5 + 0.5 * Math.sin(t * (1 + noise(i + 7) * 3) + i)
    c.set(x < 0 ? x + c.w : x, y, mix(0x334155, 0xf8fafc, shine))
  }
}

// Le sol lunaire, bosselé, avec ses cratères.
const moonGround = (c: Canvas) => {
  for (let x = 0; x < c.w; x++) c.set(x, GROUND, noise(x) > 0.85 ? MOON_DARK : MOON)
  for (const cx of [6, 30, 41]) c.rect(cx, GROUND, 3, 1, MOON_DARK)
}

// L'antenne d'astronaute avec sa lumière qui clignote.
const withAntenna = (c: Canvas, pose: Pose, t: number) => {
  drawClawd(c, pose)
  const ax = Math.round(pose.x + (pose.lean ?? 0) + BODY_W / 2)
  const ay = headTop(pose)
  c.line(ax, ay - 2, ax, ay - 1, 0xd1d5db)
  c.set(ax, ay - 3, t % 1 < 0.5 ? 0xef4444 : 0x7f1d1d)
}

// Des flammes de jetpack sous les pieds, qui vacillent.
const flames = (c: Canvas, x: number, y: number, t: number) => {
  const frame = Math.floor(t * 12)
  for (const fx of [x + 4, x + BODY_W - 6]) {
    const len = 2 + Math.floor(noise(frame + fx) * 3)
    for (let i = 0; i < len; i++) c.rect(fx, y + i, 2, 1, i === 0 ? 0xfde047 : i < 2 ? 0xfb923c : 0xef4444)
  }
}

export const space: Theme = {
  id: 'espace',
  name: 'Espace',
  emoji: '🚀',
  pitch: 'des étoiles, un jetpack, l’apesanteur, un drapeau planté sur la Lune, un astéroïde à esquiver',
  dress: (c, pose, t) => withAntenna(c, pose, t),
  scene: (c, t) => {
    stars(c, t, 0.5)
    moonGround(c)
  },
  sky: 'own',
  // La fête : un tour de jetpack, et des étoiles filantes.
  cheer: (c, t) => {
    for (let i = 0; i < 3; i++) {
      const life = (t * 0.9 + i / 3) % 1
      const sx = c.w - life * (c.w + 10)
      const sy = 1 + i * 2 + life * 3
      for (let k = 0; k < 4; k++) c.set(sx + k, sy - k * 0.3, mix(0xfef9c3, 0x334155, k / 4))
    }
    const x = centerX(c) + Math.round(Math.sin(t * 1.5) * 10)
    const y = BASE_Y - 3 + Math.round(Math.sin(t * 3) * 1.5)
    const pose: Pose = { x, y, arms: [80, 80], legs: [1, 1, 1, 1], lean: Math.round(Math.cos(t * 1.5) * 2), eyes: 'happy' }
    withAntenna(c, pose, t)
    flames(c, x, y + FIGURE_H, t)
  },

  idle: {
    id: 'flotte',
    name: 'flotte tranquillement',
    draw: (c, t) => {
      stars(c, t, 0.5)
      const bob = Math.round(Math.sin(t * 1.4))
      withAntenna(c, { x: centerX(c), y: BASE_Y - 1 + bob, arms: [-30, -30], legs: [1, 0, 0, 1], eyes: blink(t) }, t / 2)
    },
  },

  anims: [
    {
      id: 'jetpack',
      name: 'Jetpack',
      draw: (c, t) => {
        stars(c, t, 3)
        const x = centerX(c) + Math.sin(t * 0.9) * (c.w / 2 - 14)
        const y = BASE_Y - 3 + Math.sin(t * 2.3) * 2
        flames(c, x, y + FIGURE_H - 2, t)
        withAntenna(c, {
          x,
          y,
          arms: [15, 15],
          legs: [2, 2, 2, 2],
          lean: Math.round(Math.cos(t * 0.9) * 2),
          eyes: 'happy',
        }, t)
      },
    },
    {
      id: 'apesanteur',
      name: 'Apesanteur',
      draw: (c, t) => {
        stars(c, t, 1.5)
        const wave = Math.sin(t * 2)
        withAntenna(c, {
          x: centerX(c) + Math.sin(t * 0.6) * 4,
          y: BASE_Y - 2 + Math.sin(t * 1.1) * 2,
          arms: [40 + wave * 40, 40 - wave * 40],
          legs: [Math.round(1 + wave), 0, 2, Math.round(1 - wave)],
          lean: Math.round(Math.sin(t * 0.8) * 3),
          eyes: blink(t, 'wide'),
          look: Math.round(Math.sin(t * 0.5) * 2),
        }, t)
      },
    },
    {
      id: 'drapeau',
      name: 'Un petit pas',
      draw: (c, t) => {
        stars(c, t, 0.3)
        moonGround(c)
        const p = t % 7
        const walkEnd = 2.5
        const x = p < walkEnd ? -18 + (p / walkEnd) * (centerX(c) + 12) : centerX(c) - 6
        const step = Math.floor(p * 5) % 2
        const isPlanted = p > 3.2
        const isWalking = p < walkEnd
        if (isPlanted) {
          // Le drapeau orange, qui ondule.
          const pole = centerX(c) + BODY_W + 4
          c.line(pole, GROUND - 13, pole, GROUND - 1, 0xe5e7eb)
          for (let fx = 1; fx <= 7; fx++) {
            const wave = Math.round(Math.sin(t * 6 - fx * 0.9) * 0.6)
            c.rect(pole + fx, GROUND - 13 + wave, 1, 4, fx === 4 ? 0xfef3c7 : ORANGE)
          }
        }
        withAntenna(c, {
          x,
          y: BASE_Y,
          arms: isWalking ? (step ? [-30, -70] : [-70, -30]) : isPlanted ? [-60, 70] : [-60, 30],
          legs: isWalking ? (step ? [0, 1, 0, 1] : [1, 0, 1, 0]) : [0, 0, 0, 0],
          eyes: isPlanted ? 'happy' : blink(t),
          look: isWalking ? 2 : 0,
        }, t)
      },
    },
    {
      id: 'asteroide',
      name: 'Esquive d’astéroïde',
      draw: (c, t) => {
        stars(c, t, 2)
        moonGround(c)
        const period = (c.w + 16) / 24
        const p = (t % period) / period
        const ax = c.w + 6 - p * (c.w + 16)
        const ay = GROUND - 3
        const dist = ax - (centerX(c) + BODY_W / 2)
        const isDodging = Math.abs(dist) < 14
        const air = isDodging ? Math.cos((dist / 14) * (Math.PI / 2)) : 0
        withAntenna(c, {
          x: centerX(c),
          y: BASE_Y - Math.round(air * 4),
          arms: isDodging ? [70, 70] : [-50, -50],
          legs: isDodging ? [2, 1, 1, 2] : [0, 0, 0, 0],
          eyes: dist > 0 && dist < 26 ? 'wide' : dist < 0 ? 'happy' : blink(t),
          look: dist > 0 ? 2 : -2,
        }, t)
        // L'astéroïde, sa traînée et ses cratères.
        for (let i = 1; i <= 4; i++) c.set(ax + 3 + i * 2, ay + (i % 2), mix(0xfb923c, 0x000000, i / 5))
        c.disc(ax, ay, 2.2, 0x92400e)
        c.set(ax - 1, ay - 1, 0x78350f)
        c.set(ax + 1, ay + 1, 0x78350f)
      },
    },
    {
      id: 'terre',
      name: 'Salut la Terre',
      draw: (c, t) => {
        stars(c, t, 0.4)
        // La Terre, avec des continents qui tournent.
        const ex = c.w - 7
        const ey = 6
        c.disc(ex, ey, 5, 0x2563eb)
        for (let i = 0; i < 6; i++) {
          const lon = (i * 1.7 + t * 0.6) % (Math.PI * 2)
          if (Math.cos(lon) > 0) c.rect(ex + Math.sin(lon) * 3.5 - 1, ey - 3 + i, 3, 1, 0x22c55e)
        }
        const wave = Math.sin(t * 7) * 25
        withAntenna(c, {
          x: 8,
          y: BASE_Y + Math.round(Math.sin(t * 1.2)),
          arms: [-60, 95 + wave],
          legs: [0, 1, 0, 0],
          eyes: blink(t, 'happy'),
          look: 2,
          lean: 1,
        }, t)
      },
    },
  ],
}
