import { type Canvas, type Color, mix, noise } from '../canvas'
import { blink, crown, drawClawd, hand, type Pose } from '../clawd'
import { BASE_Y, centerX, ease, floatingNotes, hop, lerp, sparkles, sprite, story } from './common'
import { GROUND, type Theme } from './theme'

const DUST = 0xe7c38a
const DUST_DARK = 0xc9a25f
const LEATHER = 0x92400e
const LEATHER_DARK = 0x713f12
const CACTUS_GREEN = 0x4d7c0f
const GOLD = 0xfacc15
const STEEL = 0x9ca3af

const HAT = ['....hhhhhh....', '...hhhhhhhh...', 'h..bbbbbbbb..h', 'hhhhhhhhhhhhhh']
const HAT_COLORS = { h: LEATHER, b: LEATHER_DARK }

// Le cow-boy : le personnage sous son chapeau.
const cowboy = (c: Canvas, pose: Pose) => {
  drawClawd(c, pose)
  const { cx, top } = crown(pose)
  sprite(c, cx - 7, top - 4, HAT, HAT_COLORS)
}

const CACTUS = ['..g..', 'g.g..', 'g.g.g', 'ggg.g', '..ggg', '..g..', '..g..']

// Le désert : la poussière au sol, et deux cactus aux bords.
const desert = (c: Canvas) => {
  for (let x = 0; x < c.w; x++) c.set(x, GROUND, noise(x + 40) > 0.82 ? DUST_DARK : DUST)
  sprite(c, 2, GROUND - 7, CACTUS, { g: CACTUS_GREEN })
  sprite(c, c.w - 7, GROUND - 7, CACTUS, { g: CACTUS_GREEN }, true)
}

// Un virevoltant qui roule de gauche à droite en rebondissant, toutes les `period` secondes.
const tumbleweed = (c: Canvas, t: number, period = 7) => {
  const p = (t % period) / period
  const x = lerp(-4, c.w + 4, p)
  const y = GROUND - 2 - Math.round(Math.abs(Math.sin(p * Math.PI * 6)) * 2)
  for (let i = 0; i < 6; i++) {
    const a = i * (Math.PI / 3) + t * 6
    c.dot(x + Math.cos(a) * 1.5, y + Math.sin(a) * 1.5, i % 2 ? DUST_DARK : 0xa16207)
  }
  c.dot(x, y, 0xa16207)
}

// Un revolver tenu dans la main droite.
const revolver = (c: Canvas, pose: Pose) => {
  const { x, y } = hand(pose, 1)
  c.rect(x + 1, y, 3, 1, STEEL)
  c.set(x + 1, y + 1, LEATHER_DARK)
  return { x: x + 4, y }
}

const HORSE = [
  '.....................bb...',
  '....................bbbb..',
  '...................bbbbbbk',
  '..................mbbb....',
  'mm..bbbbbbbbbbbbbbbbbb....',
  '.mmbbbbbbbbbbbbbbbbbbb....',
  '....bbbbbbbbbbbbbbbbb.....',
  '....b..b..........b..b....',
  '....k..k..........k..k....',
]
const HORSE_COLORS: Readonly<Record<string, Color>> = { b: 0xe7e5e4, m: 0x57534e, k: 0x292524 }

// Le cheval qui rue : chaque colonne monte ou descend selon `tilt`, l'avant
// en l'air quand `tilt` est positif, l'arrière quand il est négatif.
const horse = (c: Canvas, x: number, y: number, tilt: number) => {
  const width = HORSE[0]!.length
  HORSE.forEach((row, dy) => {
    for (let dx = 0; dx < width; dx++) {
      const color = HORSE_COLORS[row[dx]!]
      if (color === undefined) continue
      const lift = Math.round(tilt * ((dx - width / 2) / (width / 2)) * 2)
      c.set(x + dx, y + dy - lift, color)
    }
  })
}

const NUGGET_COLORS = { y: GOLD, o: 0xca8a04 }

export const westernTheme: Theme = {
  id: 'western',
  name: 'Far West',
  emoji: '🤠',
  pitch: 'un chapeau de cow-boy, un lasso, un duel à midi avec des virevoltants, un rodéo, la ruée vers l’or, un harmonica au coin du feu',
  dress: (c, pose) => cowboy(c, pose),
  scene: c => desert(c),
  sky: 'open',

  idle: {
    id: 'virevoltant',
    name: 'regarde passer les virevoltants',
    draw: (c, t) => {
      desert(c)
      tumbleweed(c, t, 9)
      const p = (t % 9) / 9
      const look = Math.round(lerp(-2, 2, p))
      cowboy(c, { x: centerX(c), y: BASE_Y, arms: [-70, -70], lean: Math.round(Math.sin(t * 0.6) * 0.6), eyes: blink(t), look })
    },
  },

  anims: [
    {
      id: 'lasso',
      name: 'Le lasso',
      draw: story([
        [4, (c, t) => {
          desert(c)
          const pose: Pose = { x: centerX(c) - 6, y: BASE_Y, arms: [-50, 80], eyes: 'happy', look: 2 }
          cowboy(c, pose)
          // La boucle qui tourne au-dessus de la main.
          const h = hand(pose, 1)
          const cx = h.x + 1
          const cy = h.y - 2
          for (let i = 0; i < 14; i++) {
            const a = (i / 14) * Math.PI * 2 + t * 9
            c.dot(cx + Math.cos(a) * 6, cy + Math.sin(a) * 1.5, i < 3 ? 0xfef3c7 : DUST_DARK)
          }
          c.line(h.x + 1, h.y, cx + Math.cos(t * 9) * 6, cy + Math.sin(t * 9) * 1.5, DUST_DARK)
        }],
        [3, (c, t, p) => {
          desert(c)
          const pose: Pose = { x: centerX(c) - 6, y: BASE_Y, arms: [-50, 20], lean: 1, eyes: p > 0.5 ? 'happy' : 'open', look: 2 }
          cowboy(c, pose)
          // La corde vole jusqu'au cactus de droite et l'attrape.
          const h = hand(pose, 1)
          const reach = ease(p * 2)
          const tx = lerp(h.x + 1, c.w - 5, reach)
          const ty = lerp(h.y, GROUND - 5, reach)
          c.line(h.x + 1, h.y, tx, ty - Math.sin(reach * Math.PI) * 3, DUST_DARK)
          c.rect(tx - 2, ty - Math.sin(reach * Math.PI) * 3, 5, 1, DUST_DARK)
          if (p > 0.5) sparkles(c, t, c.w - 5, GROUND - 7, 3, GOLD, 3)
        }],
      ]),
    },
    {
      id: 'duel',
      name: 'Duel à midi',
      draw: story([
        [4, (c, t) => {
          desert(c)
          tumbleweed(c, t, 4)
          // L'adversaire : un cactus, avec son propre chapeau.
          sprite(c, c.w - 16, GROUND - 7, CACTUS, { g: CACTUS_GREEN })
          sprite(c, c.w - 20, GROUND - 11, HAT, HAT_COLORS)
          const twitch = t % 1.2 < 0.15 ? 1 : 0
          cowboy(c, { x: 6, y: BASE_Y, arms: [-70, -80 + twitch * 10], eyes: 'square', look: 2 })
        }],
        [0.6, (c, t) => {
          desert(c)
          sprite(c, c.w - 16, GROUND - 7, CACTUS, { g: CACTUS_GREEN })
          sprite(c, c.w - 20, GROUND - 11, HAT, HAT_COLORS)
          const pose: Pose = { x: 6, y: BASE_Y, arms: [-70, 5], lean: -1, eyes: 'wide', look: 2 }
          cowboy(c, pose)
          const tip = revolver(c, pose)
          c.disc(tip.x + 1, tip.y, 1.2, 0xfde047)
        }],
        [3.4, (c, t, p) => {
          desert(c)
          sprite(c, c.w - 16, GROUND - 7, CACTUS, { g: CACTUS_GREEN })
          // Le chapeau du cactus s'envole en tournoyant.
          const fly = ease(p * 1.5)
          sprite(c, c.w - 20 + fly * 6, GROUND - 11 - hop(fly) * 4 + fly * 9, HAT, HAT_COLORS, Math.floor(t * 6) % 2 === 0)
          const pose: Pose = { x: 6, y: BASE_Y, arms: [-70, 70], eyes: 'happy', look: 2 }
          cowboy(c, pose)
          // Il souffle sur la fumée du canon.
          const tip = hand(pose, 1)
          c.rect(tip.x + 1, tip.y - 2, 1, 3, STEEL)
          const life = (t * 1.5) % 1
          c.dot(tip.x + 1 + Math.sin(life * 6) * 0.7, tip.y - 3 - life * 4, mix(0xe5e7eb, 0x6b7280, life))
        }],
      ]),
    },
    {
      id: 'rodeo',
      name: 'Rodéo',
      draw: (c, t) => {
        desert(c)
        const tilt = Math.sin(t * 5)
        const hx = centerX(c) - 6
        const bounce = Math.round(Math.abs(Math.sin(t * 10)))
        // En selle, les jambes cachées par le cheval : il tient bon d'une main et salue de l'autre.
        cowboy(c, { x: hx + 4, y: GROUND - 11 - bounce, arms: [-30, 75 + Math.round(tilt * 15)], lean: Math.round(-tilt * 2), eyes: 'happy', look: Math.round(tilt * 2) })
        horse(c, hx, GROUND - 8, tilt)
        // La poussière soulevée par les sabots.
        if (Math.abs(tilt) > 0.7) sparkles(c, t, tilt > 0 ? hx + 6 : hx + 20, GROUND - 1, 4, DUST_DARK, 4)
      },
    },
    {
      id: 'ruee-vers-l-or',
      name: 'La ruée vers l’or',
      draw: story([
        [6, (c, t) => {
          desert(c)
          // La rivière où il tamise.
          const rx = centerX(c) + 14
          for (let x = rx - 6; x < rx + 10; x++) c.set(x, GROUND, Math.sin(x * 0.8 - t * 5) > 0.6 ? 0xbae6fd : 0x0284c7)
          const shake = Math.round(Math.sin(t * 16))
          const pose: Pose = { x: centerX(c) - 6 + shake, y: BASE_Y + 1, arms: [-20, -20], squash: 1, eyes: blink(t), look: 2 }
          cowboy(c, pose)
          const h = hand(pose, 1)
          c.rect(h.x - 1, h.y + 2, 6, 1, STEEL)
          c.rect(h.x, h.y + 1, 4, 1, 0x0284c7)
          if (noise(Math.floor(t * 3)) > 0.7) c.set(h.x + 2, h.y + 1, GOLD)
        }],
        [4, (c, t) => {
          desert(c)
          const rx = centerX(c) + 14
          for (let x = rx - 6; x < rx + 10; x++) c.set(x, GROUND, Math.sin(x * 0.8 - t * 5) > 0.6 ? 0xbae6fd : 0x0284c7)
          const air = hop((t * 1.6) % 1)
          const pose: Pose = { x: centerX(c) - 6, y: BASE_Y - Math.round(air * 3), arms: [-40, 85], eyes: 'happy', look: 1 }
          cowboy(c, pose)
          // La pépite brandie bien haut, qui brille.
          const h = hand(pose, 1)
          sprite(c, h.x - 1, h.y - 3, ['.yy.', 'yyyo', '.yo.'], NUGGET_COLORS)
          sparkles(c, t, h.x + 1, h.y - 3, 4, 0xfef9c3, 4)
        }],
      ]),
    },
    {
      id: 'harmonica',
      name: 'Harmonica au coin du feu',
      draw: (c, t) => {
        desert(c)
        // Le feu de camp : des bûches croisées et des flammes qui dansent.
        const fx = centerX(c) + 20
        c.line(fx - 3, GROUND, fx + 3, GROUND - 1, LEATHER_DARK)
        c.line(fx - 3, GROUND - 1, fx + 3, GROUND, LEATHER)
        const frame = Math.floor(t * 8)
        for (let dx = -2; dx <= 2; dx++) {
          const tall = 2 + Math.round(noise(frame * 5 + dx) * 2) + (2 - Math.abs(dx))
          for (let k = 0; k < tall; k++) c.set(fx + dx, GROUND - 2 - k, k >= tall - 1 ? 0xfde047 : k >= tall - 2 ? 0xf97316 : 0xdc2626)
        }
        if (noise(frame) > 0.5) c.dot(fx + (noise(frame + 1) - 0.5) * 4, GROUND - 9 - noise(frame + 2) * 3, 0xfde047)
        const sway = Math.round(Math.sin(t * 2))
        const pose: Pose = { x: centerX(c) - 8, y: BASE_Y + 1, arms: [-20, -20], squash: 1, lean: sway, eyes: 'closed', look: 1 }
        cowboy(c, pose)
        // L'harmonica devant la bouche, qui glisse d'un côté à l'autre.
        const { cx, top } = crown(pose)
        const slide = Math.round(Math.sin(t * 3))
        c.rect(cx - 3 + slide, top + 5, 6, 2, STEEL)
        for (let k = 0; k < 3; k++) c.set(cx - 2 + slide + k * 2, top + 6, 0x374151)
        floatingNotes(c, t, centerX(c) - 1, 3, 12)
        // Il bat la mesure du pied.
        if (Math.floor(t * 2) % 2 === 0) sparkles(c, t, centerX(c) - 8, GROUND, 1, DUST_DARK, 1)
      },
    },
  ],
}
