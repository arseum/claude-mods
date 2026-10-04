import { type Canvas, type Color, mix, noise } from '../canvas'
import { blink, crown, drawClawd, hand, type Pose } from '../clawd'
import { BASE_Y, centerX, ease, falling, hop, lerp, sparkles, sprite, story } from './common'
import { GROUND, type Special, type Theme } from './theme'

const STEEL = 0x9ca3af
const PAN = 0x374151
const TILE = 0xe5e7eb
const TILE_DARK = 0x9ca3af

const TOQUE = ['..wwwww..', '.wwwwwww.', '.wwwwwww.', '..wwwww..', '..ggggg..']
const TOQUE_COLORS = { w: 0xf8fafc, g: 0xd1d5db }

// Le chef : le personnage avec sa toque.
const chef = (c: Canvas, pose: Pose) => {
  drawClawd(c, pose)
  const { cx, top } = crown(pose)
  sprite(c, cx - 4, top - 5, TOQUE, TOQUE_COLORS)
}

// Le carrelage de la cuisine.
const floor = (c: Canvas) => {
  for (let x = 0; x < c.w; x++) c.set(x, GROUND, Math.floor(x / 3) % 2 ? TILE : TILE_DARK)
}

// De la vapeur qui monte en ondulant au-dessus de (x, y).
const steam = (c: Canvas, t: number, x: number, y: number) => {
  for (let i = 0; i < 3; i++) {
    const life = (t * 0.8 + i / 3) % 1
    c.set(x + i * 2 - 2 + Math.sin(t * 3 + i) * 1.2, y - life * 6, mix(0xf1f5f9, 0x475569, life))
  }
}

// Une marmite sur un réchaud, avec ses flammes.
const pot = (c: Canvas, t: number, x: number, soup: Color) => {
  c.rect(x, GROUND - 5, 8, 1, soup)
  c.rect(x, GROUND - 4, 8, 3, STEEL)
  c.set(x - 1, GROUND - 4, STEEL)
  c.set(x + 8, GROUND - 4, STEEL)
  c.rect(x - 1, GROUND - 1, 10, 1, PAN)
  for (let i = 0; i < 6; i++) if (noise(Math.floor(t * 10) + i) > 0.4) c.set(x + 1 + i, GROUND - 1, i % 2 ? 0xf97316 : 0x3b82f6)
}

const CAKE_LAYERS: readonly Color[] = [0xf9a8d4, 0xfef3c7, 0x92400e]

// La Chandeleur : on fait sauter la crêpe une pièce d'or dans l'autre main, pour la chance.
const chandeleur: Special = {
  dates: ['02-02'],
  occasion: 'la Chandeleur',
  anim: {
    id: 'chandeleur',
    name: 'Crêpe et pièce d’or',
    draw: (c, t) => {
      floor(c)
      const x = centerX(c) - 2
      const p = (t / 1.8) % 1
      const flips = Math.floor(t / 1.8)
      // L'assiette de crêpes réussies, à droite.
      c.rect(x + 26, GROUND - 1, 9, 1, 0xe5e7eb)
      for (let i = 0; i < Math.min(6, flips % 7); i++) c.rect(x + 27, GROUND - 2 - i, 7, 1, i % 2 ? 0xfcd34d : 0xfbbf24)
      const isTossing = p < 0.15
      const pose: Pose = { x, y: BASE_Y, arms: [40, isTossing ? 35 : 5], eyes: p > 0.2 && p < 0.8 ? 'wide' : 'happy', look: 1 }
      chef(c, pose)
      const coin = hand(pose, -1)
      c.rect(coin.x - 1, coin.y - 1, 2, 2, t % 0.6 < 0.3 ? 0xfacc15 : 0xfde68a)
      const h = hand(pose, 1)
      c.rect(h.x + 1, h.y, 3, 1, PAN)
      c.rect(h.x + 4, h.y, 6, 1, PAN)
      const air = hop(p)
      const width = Math.max(1, Math.round(Math.abs(Math.cos(p * Math.PI * 2)) * 6))
      c.rect(h.x + 7 - width / 2, h.y - 1 - Math.round(air * 9), width, 1, p % 0.5 < 0.25 ? 0xfcd34d : 0xd97706)
    },
  },
}

export const cookingTheme: Theme = {
  id: 'cuisine',
  name: 'Cuisine',
  emoji: '🍳',
  pitch: 'une toque de chef, des crêpes qui sautent, une marmite qui mijote, une pizza qui tourne, un gâteau d’anniversaire, du jonglage',
  dress: (c, pose) => chef(c, pose),
  scene: c => floor(c),
  sky: 'window',
  specials: [chandeleur],

  idle: {
    id: 'mijote',
    name: 'surveille la marmite',
    draw: (c, t) => {
      floor(c)
      const x = centerX(c) - 8
      pot(c, t, x + 24, 0xf97316)
      steam(c, t, x + 28, GROUND - 6)
      chef(c, { x, y: BASE_Y, arms: [-70, -50], eyes: blink(t), look: 2 })
    },
  },

  anims: [
    {
      id: 'crepes',
      name: 'Saut de crêpes',
      draw: (c, t) => {
        floor(c)
        const x = centerX(c) - 4
        const p = (t / 1.6) % 1
        const flips = Math.floor(t / 1.6)
        // La pile de crêpes déjà réussies, à gauche.
        for (let i = 0; i < Math.min(6, flips % 7); i++) c.rect(x - 14, GROUND - 1 - i, 7, 1, i % 2 ? 0xfcd34d : 0xfbbf24)
        const isTossing = p < 0.15
        const pose: Pose = { x, y: BASE_Y, arms: [-50, isTossing ? 35 : 5], eyes: p > 0.2 && p < 0.8 ? 'wide' : 'happy', look: 2 }
        chef(c, pose)
        const h = hand(pose, 1)
        c.rect(h.x + 1, h.y, 3, 1, PAN)
        c.rect(h.x + 4, h.y, 6, 1, PAN)
        // La crêpe : elle monte, se retourne (s'amincit) et retombe dans la poêle.
        const air = hop(p)
        const width = Math.max(1, Math.round(Math.abs(Math.cos(p * Math.PI * 2)) * 6))
        c.rect(h.x + 7 - width / 2, h.y - 1 - Math.round(air * 9), width, 1, p % 0.5 < 0.25 ? 0xfcd34d : 0xd97706)
      },
    },
    {
      id: 'marmite',
      name: 'La soupe du chef',
      draw: (c, t) => {
        floor(c)
        const x = centerX(c) - 8
        pot(c, t, x + 24, 0x84cc16)
        steam(c, t, x + 28, GROUND - 6)
        const isTasting = t % 5 > 3.8
        const stir = Math.sin(t * 5)
        const pose: Pose = { x, y: BASE_Y, arms: [-50, isTasting ? 60 : -10 + stir * 20], eyes: isTasting ? 'happy' : blink(t), look: 2 }
        chef(c, pose)
        const h = hand(pose, 1)
        if (isTasting) {
          c.line(h.x + 1, h.y, h.x - 2, h.y - 3, STEEL)
          sparkles(c, t, x + 8, BASE_Y - 2, 6, 0xfde047, 3)
        } else {
          c.line(h.x + 1, h.y, x + 28 + stir * 2, GROUND - 5, STEEL)
        }
      },
    },
    {
      id: 'pizza',
      name: 'Pizzaiolo',
      draw: story([
        [5, (c, t) => {
          floor(c)
          const x = centerX(c)
          chef(c, { x, y: BASE_Y, arms: [80, 80], eyes: 'happy', legs: Math.floor(t * 3) % 2 ? [0, 1, 0, 0] : [0, 0, 1, 0] })
          // La pâte qui tourne au-dessus de sa tête.
          const width = 4 + Math.round(Math.abs(Math.sin(t * 6)) * 8)
          c.rect(x + 8 - width / 2, BASE_Y - 6 + Math.round(Math.sin(t * 2)), width, 1, 0xfde68a)
        }],
        [6, (c, t, p) => {
          floor(c)
          const x = centerX(c) - 8
          // La pizza sur le plan de travail, garnie petit à petit.
          const px = x + 24
          c.rect(px, GROUND - 2, 12, 1, PAN)
          c.rect(px + 1, GROUND - 3, 10, 1, 0xfde68a)
          c.rect(px + 2, GROUND - 3, Math.round(ease(p * 2) * 8), 1, 0xdc2626)
          const toppings = Math.floor(p * 10)
          for (let i = 0; i < toppings; i++) c.set(px + 2 + ((i * 3) % 8), GROUND - 4, i % 2 ? 0x16a34a : 0xfef3c7)
          const pose: Pose = { x, y: BASE_Y, arms: [-50, Math.sin(t * 6) * 20], eyes: p > 0.8 ? 'happy' : blink(t), look: 2 }
          chef(c, pose)
          if (p > 0.8) sparkles(c, t, px + 6, GROUND - 6, 6, 0xfde047)
        }],
      ]),
    },
    {
      id: 'gateau',
      name: 'Gâteau d’anniversaire',
      draw: story([
        [9, (c, t, p) => {
          floor(c)
          const x = centerX(c) - 10
          const cx = x + 26
          // Les étages qui s'empilent, puis la bougie.
          const layers = Math.min(3, Math.floor(p * 4))
          for (let i = 0; i < layers; i++) c.rect(cx - 5 + i, GROUND - 2 - i * 2, 11 - i * 2, 2, CAKE_LAYERS[i]!)
          const drop = (p * 4) % 1
          if (layers < 3) c.rect(cx - 5 + layers, lerp(0, GROUND - 2 - layers * 2, ease(drop)), 11 - layers * 2, 2, CAKE_LAYERS[layers]!)
          if (p > 0.8) {
            c.rect(cx, GROUND - 9, 1, 3, 0x60a5fa)
            c.set(cx, GROUND - 10, noise(Math.floor(t * 8)) > 0.5 ? 0xfde047 : 0xf97316)
          }
          chef(c, { x, y: BASE_Y, arms: [-50, -20], eyes: blink(t), look: 2 })
        }],
        [5, (c, t) => {
          floor(c)
          falling(c, t, { count: 30, speed: 8, color: 0xf472b6, colors: [0xf472b6, 0x67e8f9, 0xfde047, 0xa78bfa] })
          const x = centerX(c) - 10
          const cx = x + 26
          for (let i = 0; i < 3; i++) c.rect(cx - 5 + i, GROUND - 2 - i * 2, 11 - i * 2, 2, CAKE_LAYERS[i]!)
          c.rect(cx, GROUND - 9, 1, 3, 0x60a5fa)
          c.set(cx, GROUND - 10, noise(Math.floor(t * 8)) > 0.5 ? 0xfde047 : 0xf97316)
          const clap = Math.floor(t * 4) % 2
          chef(c, { x, y: BASE_Y - Math.round(hop((t * 2) % 1) * 2), arms: clap ? [40, 40] : [10, 10], eyes: 'happy', look: 2 })
        }],
      ]),
    },
    {
      id: 'jonglage',
      name: 'Jonglage de légumes',
      draw: (c, t) => {
        floor(c)
        const x = centerX(c)
        const beat = Math.floor(t * 3) % 2
        chef(c, { x, y: BASE_Y, arms: beat ? [30, -10] : [-10, 30], eyes: 'happy' })
        const items: readonly Color[] = [0xef4444, 0xfef3c7, 0xfacc15]
        items.forEach((color, i) => {
          const p = (t * 0.9 + i / 3) % 1
          const ix = lerp(x - 7, x + 23, p < 0.5 ? p * 2 : 2 - p * 2)
          c.disc(ix, BASE_Y + 4 - hop(p) * 5, 1, color)
        })
      },
    },
  ],
}
