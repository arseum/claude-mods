import { type Canvas, type Color, mix, noise } from '../canvas'
import { blink, crown, drawClawd, hand, type Pose } from '../clawd'
import { BASE_Y, centerX, floatingNotes, hop, NOTE_COLORS, note, sparkles, sprite } from './common'
import { GROUND, STAGE_H, type Special, type Theme } from './theme'

const STAGE = 0x3f3f46
const GOLD = 0xfacc15

const GUITAR = ['.......n', '......n.', '.....n..', 'rrr.n...', 'rrrr....', 'rwrr....', '.rr.....']
const GUITAR_COLORS = { r: 0xdc2626, n: 0xfde68a, w: 0xf8fafc }

// La scène en bois sombre.
const stage = (c: Canvas) => {
  for (let x = 0; x < c.w; x++) c.set(x, GROUND, x % 5 === 0 ? 0x27272a : STAGE)
}

// Un faisceau de projecteur qui balaie la scène depuis le haut.
const spotlight = (c: Canvas, fromX: number, toX: number, color: Color) => {
  for (let y = 0; y < GROUND; y += 1) {
    const k = y / GROUND
    const x = fromX + (toX - fromX) * k
    if (y % 2 === 0) c.set(x, y, mix(color, 0x000000, 0.55))
    c.set(x + (y % 3) - 1, y, mix(color, 0x000000, 0.75))
  }
}

// Un casque audio : l'arceau au-dessus de la tête et deux écouteurs sur les côtés.
const headphones = (c: Canvas, pose: Pose) => {
  drawClawd(c, pose)
  const { cx, top, w } = crown(pose)
  const left = Math.round(cx - w / 2) - 1
  const right = Math.round(cx + w / 2)
  c.line(left + 1, top - 1, right - 1, top - 1, 0x27272a)
  c.rect(left, top, 1, 1, 0x27272a)
  c.rect(right, top, 1, 1, 0x27272a)
  c.rect(left - 1, top + 1, 2, 3, 0x3f3f46)
  c.rect(right, top + 1, 2, 3, 0x3f3f46)
}

// La guitare portée en travers du corps.
const guitar = (c: Canvas, pose: Pose) => {
  const { x, y } = hand(pose, -1)
  sprite(c, x + 3, y - 1, GUITAR, GUITAR_COLORS)
}

// Un public : une rangée de têtes qui sautent en rythme.
const crowd = (c: Canvas, t: number) => {
  for (let i = 0; i < c.w / 5; i++) {
    const jump = Math.floor(t * 4 + noise(i) * 2) % 2
    const x = i * 5 + 1 + Math.round(noise(i + 9) * 2)
    c.rect(x, GROUND - 1 - jump, 3, 2, mix(0x1e293b, 0x475569, noise(i + 3)))
  }
}

// La Fête de la musique : un concert dans la rue, du monde partout et des confettis.
const musicDay: Special = {
  dates: ['06-21'],
  occasion: 'la Fête de la musique',
  anim: {
    id: 'fete-musique',
    name: 'Fête de la musique',
    draw: (c, t) => {
      const sweep = Math.sin(t * 1.5)
      spotlight(c, 4, c.w / 2 + sweep * 18, 0xfde047)
      spotlight(c, c.w - 4, c.w / 2 - sweep * 18, 0xa3e635)
      for (let i = 0; i < 14; i++) {
        const y = ((noise(i * 3) * 14 + t * 4 * (0.7 + noise(i))) % 14)
        c.set(noise(i * 7.7) * c.w + Math.sin(t * 2 + i), y, NOTE_COLORS[i % NOTE_COLORS.length]!)
      }
      const strum = Math.floor(t * 6) % 2
      const air = hop((t * 1.2) % 1)
      const pose: Pose = { x: centerX(c), y: BASE_Y - 2 - Math.round(air * 2), arms: [-30, strum ? -10 : -40], eyes: 'happy' }
      drawClawd(c, pose)
      guitar(c, pose)
      floatingNotes(c, t, centerX(c) + 8, 4, 16)
      crowd(c, t * 1.4)
    },
  },
}

export const musicTheme: Theme = {
  id: 'musique',
  name: 'Musique',
  emoji: '🎸',
  pitch: 'une guitare électrique, une batterie, un chef d’orchestre, un concert avec projecteurs et public, un DJ',
  dress: (c, pose) => headphones(c, pose),
  scene: c => stage(c),
  sky: 'own',
  // La fête : le moulin à vent à la guitare, sous deux projecteurs qui se croisent, et le public en délire.
  cheer: (c, t) => {
    const sweep = Math.sin(t * 2) * 12
    spotlight(c, 6, centerX(c) + 8 + sweep, 0xfde68a)
    spotlight(c, c.w - 6, centerX(c) + 8 - sweep, 0xf9a8d4)
    const windmill = (t * 540) % 360
    const pose: Pose = { x: centerX(c), y: BASE_Y - Math.round(hop((t * 2) % 1) * 2), arms: [-20, windmill], eyes: 'happy' }
    headphones(c, pose)
    guitar(c, pose)
    floatingNotes(c, t, centerX(c) + 8, 5)
    crowd(c, t * 2)
  },
  specials: [musicDay],

  idle: {
    id: 'accorde',
    name: 'accorde sa guitare',
    draw: (c, t) => {
      stage(c)
      const pose: Pose = { x: centerX(c), y: BASE_Y, arms: [-30, -40], legs: [0, 0, 0, Math.floor(t * 1.5) % 2], eyes: blink(t, 'closed'), look: -1 }
      drawClawd(c, pose)
      guitar(c, pose)
      if (t % 3 < 0.5) note(c, centerX(c) + 22, BASE_Y - 1, NOTE_COLORS[Math.floor(t / 3) % 4]!)
    },
  },

  anims: [
    {
      id: 'solo',
      name: 'Solo de guitare',
      draw: (c, t) => {
        stage(c)
        const beat = Math.floor(t * 4)
        if (beat % 4 === 0) spotlight(c, c.w / 2, centerX(c) + 8, 0xfde047)
        const pose: Pose = { x: centerX(c), y: BASE_Y, arms: [-30, beat % 2 ? -50 : -10], lean: beat % 2 ? -2 : 1, legs: [0, 0, beat % 2, 0], eyes: 'closed' }
        drawClawd(c, pose)
        guitar(c, pose)
        floatingNotes(c, t * 1.4, centerX(c) + 8, 4)
      },
    },
    {
      id: 'batterie',
      name: 'Solo de batterie',
      draw: (c, t) => {
        stage(c)
        const x = centerX(c)
        const hit = Math.floor(t * 6) % 2
        drawClawd(c, { x, y: BASE_Y - 1, arms: hit ? [40, -10] : [-10, 40], legs: [1, 1, 1, 1], eyes: 'closed', lean: hit ? 1 : -1 })
        // La batterie devant lui : grosse caisse, caisses claires, cymbales.
        c.disc(x + 8, GROUND - 3, 3, 0xf8fafc)
        c.disc(x + 8, GROUND - 3, 1.5, 0xdc2626)
        c.rect(x - 4, BASE_Y + 6, 5, 2, 0xd1d5db)
        c.rect(x + 16, BASE_Y + 6, 5, 2, 0xd1d5db)
        const shimmer = hit ? GOLD : 0xca8a04
        c.rect(x - 7, BASE_Y + 2 - hit, 6, 1, shimmer)
        c.rect(x + 18, BASE_Y + 2 - (1 - hit), 6, 1, hit ? 0xca8a04 : GOLD)
        sparkles(c, t, hit ? x - 4 : x + 21, BASE_Y + 1, 3, GOLD, 3)
      },
    },
    {
      id: 'orchestre',
      name: 'Chef d’orchestre',
      draw: (c, t) => {
        // Une portée qui défile derrière lui, avec ses notes.
        for (let line = 0; line < 5; line++) for (let x = 0; x < c.w; x += 2) c.set(x, 2 + line * 2, 0x334155)
        for (let i = 0; i < 6; i++) {
          const nx = ((i * 17 - t * 6) % (c.w + 8) + c.w + 8) % (c.w + 8) - 4
          note(c, nx, 1 + ((i * 3) % 5), NOTE_COLORS[i % 4]!)
        }
        stage(c)
        // La baguette dessine un 8 dans l'air.
        const a = t * 3
        const pose: Pose = { x: centerX(c), y: BASE_Y, arms: [-20 + Math.sin(a) * 30, 40 + Math.sin(a * 2) * 30], eyes: 'closed', lean: Math.round(Math.sin(a) * 1.5) }
        drawClawd(c, pose)
        const h = hand(pose, 1)
        c.line(h.x + 1, h.y, h.x + 4, h.y - 3, 0xf8fafc)
      },
    },
    {
      id: 'concert',
      name: 'Concert à guichets fermés',
      draw: (c, t) => {
        const sweep = Math.sin(t * 1.2)
        spotlight(c, 4, c.w / 2 + sweep * 18, 0xf472b6)
        spotlight(c, c.w - 4, c.w / 2 - sweep * 18, 0x67e8f9)
        const air = hop((t * 1.5) % 1)
        const pose: Pose = { x: centerX(c), y: BASE_Y - 3 - Math.round(air * 2), arms: [85, -20], eyes: 'happy', legs: air > 0.3 ? [1, 2, 2, 1] : [0, 0, 0, 0] }
        drawClawd(c, pose)
        // Le micro dans la main droite.
        const h = hand(pose, 1)
        c.rect(h.x + 1, h.y - 2, 1, 3, 0x6b7280)
        c.rect(h.x, h.y - 3, 3, 1, 0x111827)
        crowd(c, t)
        if (Math.floor(t * 4) % 4 === 0) floatingNotes(c, t, centerX(c) + 8, 2, 18)
      },
    },
    {
      id: 'dj',
      name: 'Mix du DJ',
      draw: (c, t) => {
        // L'égaliseur derrière lui : des barres qui dansent.
        for (let i = 0; i < c.w / 3; i++) {
          const height = Math.round((0.3 + 0.7 * Math.abs(Math.sin(t * (2 + noise(i) * 4) + i))) * (STAGE_H - 6))
          const color = mix(0x22d3ee, 0xa855f7, i / (c.w / 3))
          for (let k = 0; k < height; k += 2) c.rect(i * 3, GROUND - 2 - k, 2, 1, mix(color, 0x000000, 0.6))
        }
        const x = centerX(c)
        const bob = Math.floor(t * 4) % 2
        drawClawd(c, { x, y: BASE_Y - bob, arms: [-10, -10 + Math.sin(t * 8) * 15], eyes: 'closed', lean: bob })
        // Les platines.
        c.rect(x - 6, GROUND - 4, 28, 4, 0x18181b)
        for (const px of [x - 1, x + 15]) {
          c.disc(px, GROUND - 4, 2, 0x3f3f46)
          c.set(px + Math.cos(t * 6) * 2, GROUND - 4 + Math.sin(t * 6), 0xf8fafc)
        }
      },
    },
  ],
}
