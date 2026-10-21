import { type Canvas, mix, noise } from '../canvas'
import { blink, crown, drawClawd, figureScale, hand, type Pose } from '../clawd'
import { BASE_Y, centerX, ease, hop, lerp, sparkles, sprite, story, walkLegs } from './common'
import { GROUND, type Theme } from './theme'

const EARTH = 0x854d0e
const MOSS = 0x4d7c0f
const FERN = 0x16a34a
const DINO_GREEN = 0x65a30d
const DINO_DARK = 0x3f6212
const BONE = 0xf5f5f4
const LAVA = [0xfde047, 0xf97316, 0xdc2626]

// Le personnage déguisé en dino : une rangée de plaques vertes sur le dos.
const dinoSuit = (c: Canvas, pose: Pose) => {
  drawClawd(c, pose)
  const { cx, top, w } = crown(pose)
  const step = Math.max(3, Math.round(4 * figureScale()))
  for (let x = cx - w / 2 + 2; x < cx + w / 2 - 2; x += step) {
    c.set(x, top - 1, DINO_GREEN)
    c.set(x + 1, top - 1, DINO_GREEN)
    c.set(x, top - 2, DINO_DARK)
  }
}

const FERN_SPRITE = ['f...f', '.f.f.', 'ff.ff', '.fff.', '..f..']

// La préhistoire : de la terre, de la mousse et des fougères, qui défilent de `scroll` px.
const prehistory = (c: Canvas, scroll = 0) => {
  for (let x = 0; x < c.w; x++) c.set(x, GROUND, noise(Math.floor(x + scroll)) > 0.75 ? MOSS : EARTH)
  for (let i = 0; i < Math.ceil(c.w / 20) + 1; i++) {
    const fx = (((i * 20 + 3 - scroll) % (c.w + 20)) + c.w + 20) % (c.w + 20) - 10
    sprite(c, fx, GROUND - 5, FERN_SPRITE, { f: noise(i) > 0.5 ? FERN : MOSS })
  }
}

const TREX = [
  '........gggggg.',
  '.......ggkggggg',
  '.......gggggggg',
  '.......ggggwwww',
  '.......gggggggg',
  'g.....ggggggg..',
  'gg...ggggggg.a.',
  '.gggggggggg...a',
  '..ggggggggg....',
  '....ggg.ggg....',
  '....gg...gg....',
  '...ggg..ggg....',
]
// La gueule ouverte : la mâchoire du bas tombe.
const TREX_ROAR = [...TREX.slice(0, 3), '.......gggg.w.w', '.......ggg.....', '.......gggggggg', ...TREX.slice(6)]
const TREX_COLORS = { g: 0x15803d, k: 0x1c1917, w: BONE, a: 0x15803d }

const EGG = ['..eeee..', '.eesese.', 'eeeeeeee', 'eseeeese', 'eeeesee.', 'eeeeeeee', '.eeeeee.']
const EGG_COLORS = { e: 0xfef3c7, s: 0x84cc16 }
const BABY = ['.ggg.', 'gkggg', 'gggg.', '.gg..', 'g.g..']

const SKELETON = ['..b....bb....', '.bbb.b.b.b.bb', 'bb.bbbbbbbbbb', '...b..b..b...']

const PTERO_UP = [
  'w....................w',
  'ww..................ww',
  '.www......cc......www.',
  '...wwww..hhhh..wwww...',
  '......wwwwhhwwww......',
  '..........hh..........',
]
const PTERO_DOWN = [
  '......................',
  '..........cc..........',
  '.........hhhh.........',
  '.wwwwwwwwwhhwwwwwwwww.',
  'ww.......whhw.......ww',
  'w.........hh.........w',
]
const PTERO_COLORS = { w: 0x2dd4bf, h: 0x0f766e, c: 0xf97316 }

// Le volcan, dont le sommet est en `(x, top)`.
const volcano = (c: Canvas, x: number, top: number, glow = 0) => {
  for (let row = 0; row <= GROUND - top; row++) {
    const half = 1 + row * 0.8
    for (let dx = -half; dx <= half; dx++) c.set(x + dx, top + row, noise(row * 9 + Math.round(dx)) > 0.85 ? 0x44403c : 0x57534e)
  }
  c.rect(x - 1, top, 3, 1, mix(0xdc2626, 0xfde047, glow))
}

export const dinoTheme: Theme = {
  id: 'dino',
  name: 'Dinosaures',
  emoji: '🦖',
  pitch: 'la préhistoire, un costume de dino, un T-rex qui poursuit, un œuf qui éclot, des fossiles à déterrer, un volcan qui gronde, un vol en ptérodactyle',
  dress: (c, pose) => dinoSuit(c, pose),
  scene: c => prehistory(c),
  sky: 'open',

  idle: {
    id: 'brontosaure',
    name: 'fait coucou au brontosaure',
    draw: (c, t) => {
      prehistory(c)
      // Un brontosaure qui dépasse du bord droit : son dos, et son long cou qui descend puis remonte.
      const dip = (Math.sin(t * 0.5) + 1) / 2
      const body = 0x6b8e23
      c.disc(c.w + 1, GROUND - 3, 5, body)
      const hx = c.w - 13 - dip * 4
      const hy = 1 + dip * 5
      c.line(c.w - 3, GROUND - 6, hx + 3, hy + 2, body, 2)
      c.rect(hx, hy, 5, 3, body)
      c.set(hx + 1, hy, 0x1c1917)
      for (const lx of [c.w - 5, c.w - 1]) c.rect(lx, GROUND - 1, 2, 1, mix(body, 0x000000, 0.3))
      const isWaving = dip > 0.6
      dinoSuit(c, { x: centerX(c) - 6, y: BASE_Y, arms: [-60, isWaving ? (Math.floor(t * 4) % 2 ? 60 : 85) : -60], eyes: isWaving ? 'happy' : blink(t), look: Math.round(dip * 2) })
    },
  },

  anims: [
    {
      id: 'poursuite',
      name: 'Poursuite avec le T-rex',
      draw: (c, t) => {
        const scroll = t * 18
        prehistory(c, scroll)
        const x = centerX(c) + 6
        const air = hop((t * 3) % 1)
        dinoSuit(c, { x, y: BASE_Y - Math.round(air * 2), arms: [70, 70], legs: walkLegs(t, 8), lean: 2, eyes: 'wide', look: Math.floor(t) % 2 ? -2 : 2 })
        // Le T-rex derrière lui, qui rugit de temps en temps.
        const isRoaring = t % 2.5 < 0.8
        const rx = x - 19 + Math.round(Math.sin(t * 1.3) * 2)
        sprite(c, rx, GROUND - 12 + Math.round(hop((t * 3 + 0.5) % 1)), isRoaring ? TREX_ROAR : TREX, TREX_COLORS)
        if (isRoaring) sparkles(c, t, rx + 17, GROUND - 9, 3, 0xe5e7eb, 3)
        // La poussière des pas.
        c.dot(x - 2 - ((t * 18) % 6), GROUND - 1, 0xa8a29e)
      },
    },
    {
      id: 'eclosion',
      name: 'L’œuf qui éclot',
      draw: story([
        [4, (c, t, p) => {
          prehistory(c)
          const ex = centerX(c) + 14
          const wobble = Math.sin(t * (6 + p * 14)) * p * 1.5
          sprite(c, ex + Math.round(wobble), GROUND - 7, EGG, EGG_COLORS)
          // Les fissures qui apparaissent.
          if (p > 0.5) c.line(ex + 2 + Math.round(wobble), GROUND - 5, ex + 4 + Math.round(wobble), GROUND - 4, 0x78716c)
          if (p > 0.8) c.line(ex + 4 + Math.round(wobble), GROUND - 4, ex + 6 + Math.round(wobble), GROUND - 5, 0x78716c)
          dinoSuit(c, { x: centerX(c) - 10, y: BASE_Y, arms: [-30, -30], eyes: 'wide', look: 2 })
        }],
        [4, (c, t, p) => {
          prehistory(c)
          const ex = centerX(c) + 14
          // Les deux moitiés de coquille, et le bébé qui sautille.
          sprite(c, ex - 2, GROUND - 3, EGG.slice(4), EGG_COLORS)
          sprite(c, ex + 5, GROUND - 3, EGG.slice(4), EGG_COLORS)
          const air = hop((t * 2) % 1)
          sprite(c, ex + 1 + Math.round(p * 2), GROUND - 5 - Math.round(air * 3), BABY, { g: 0xa3e635, k: 0x1c1917 }, true)
          const joy = hop((t * 2 + 0.5) % 1)
          dinoSuit(c, { x: centerX(c) - 10, y: BASE_Y - Math.round(joy * 2), arms: [80, 80], eyes: 'happy', look: 2 })
          sparkles(c, t, ex + 3, GROUND - 8, 5, 0xfef9c3, 3)
        }],
      ]),
    },
    {
      id: 'fossiles',
      name: 'Fouille de fossiles',
      draw: story([
        [6, (c, t, p) => {
          prehistory(c)
          const sx = centerX(c) + 4
          // Le squelette apparaît colonne après colonne sous le pinceau.
          const shown = Math.round(p * SKELETON[0]!.length)
          sprite(c, sx, GROUND - 3, SKELETON.map(row => row.slice(0, shown)), { b: BONE })
          const brush = Math.round(Math.sin(t * 10) * 1.5)
          const pose: Pose = { x: sx - 16 + shown, y: BASE_Y + 1, arms: [-30, -45 + brush * 8], squash: 1, eyes: blink(t), look: 2 }
          dinoSuit(c, pose)
          const h = hand(pose, 1)
          c.line(h.x + 1, h.y, h.x + 3, h.y + 3, 0xa16207)
          if (Math.floor(t * 6) % 2) sparkles(c, t, h.x + 3, h.y + 4, 2, 0xd6d3d1, 2)
        }],
        [4, (c, t) => {
          prehistory(c)
          const sx = centerX(c) + 4
          sprite(c, sx, GROUND - 3, SKELETON, { b: BONE })
          const air = hop((t * 1.8) % 1)
          const pose: Pose = { x: sx - 16, y: BASE_Y - Math.round(air * 3), arms: [-50, 85], eyes: 'happy', look: 1 }
          dinoSuit(c, pose)
          // Un os brandi bien haut.
          const h = hand(pose, 1)
          c.rect(h.x - 1, h.y - 3, 4, 1, BONE)
          c.set(h.x - 2, h.y - 4, BONE)
          c.set(h.x - 2, h.y - 2, BONE)
          c.set(h.x + 3, h.y - 4, BONE)
          c.set(h.x + 3, h.y - 2, BONE)
        }],
      ]),
    },
    {
      id: 'volcan',
      name: 'Le volcan se réveille',
      draw: story([
        [3.5, (c, t, p) => {
          const shake = p > 0.4 ? Math.round(Math.sin(t * 40)) : 0
          volcano(c, c.w - 14 + shake, 4, p)
          prehistory(c)
          // De la fumée qui monte du cratère.
          for (let i = 0; i < 4; i++) {
            const life = (t * 0.6 + i / 4) % 1
            c.dot(c.w - 14 + Math.sin(life * 5 + i) * 2, 3 - life * 4, mix(0x9ca3af, 0x4b5563, life))
          }
          dinoSuit(c, { x: centerX(c) - 10 + shake, y: BASE_Y, arms: [-50, -50], eyes: p > 0.4 ? 'wide' : blink(t), look: 2 })
        }],
        [4.5, (c, t, p) => {
          volcano(c, c.w - 14, 4, 1)
          prehistory(c)
          // L'éruption : des gerbes de lave qui retombent.
          for (let i = 0; i < 14; i++) {
            const life = (t * 0.9 + i / 14) % 1
            const dir = noise(i) - 0.5
            const lx = c.w - 14 + dir * 30 * life
            const ly = 4 - Math.sin(life * Math.PI) * 6 + life * 10
            if (ly < GROUND) c.dot(lx, ly, LAVA[i % LAVA.length]!)
          }
          // Il s'enfuit vers la gauche, puis revient doucement voir.
          const x = p < 0.5 ? lerp(centerX(c) - 10, 2, ease(p * 2)) : 2
          dinoSuit(c, { x, y: BASE_Y - Math.round(hop((t * 3) % 1) * (p < 0.5 ? 2 : 0)), arms: [85, 85], legs: p < 0.5 ? walkLegs(t, 8) : [0, 0, 0, 0], eyes: 'wide', look: 2 })
        }],
      ]),
    },
    {
      id: 'pterodactyle',
      name: 'Envolée en ptérodactyle',
      draw: (c, t) => {
        prehistory(c)
        const span = c.w + 30
        const x = ((t * 7) % span) - 18
        const y = Math.round(Math.sin(t * 2) * 0.6)
        const isUp = Math.floor(t * 4) % 2 === 0
        // Il se tient aux pattes du ptérodactyle, les jambes repliées, son ombre au sol.
        dinoSuit(c, { x, y: y + 4, arms: [88, 88], legs: [2, 2, 2, 2], lean: -1, eyes: 'happy', look: 2 })
        sprite(c, x - 3, y - (isUp ? 2 : 1), isUp ? PTERO_UP : PTERO_DOWN, PTERO_COLORS)
        c.rect(x + 2, GROUND, 12, 1, 0x422006)
        // Le vent de la vitesse.
        for (let i = 0; i < 3; i++) c.dot(x - 4 - ((t * 20 + i * 5) % 12), y + 7 + i * 2, 0xe5e7eb)
      },
    },
  ],
}
