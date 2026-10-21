import { type Canvas, type Color, mix, noise } from '../canvas'
import { BODY_W, blink, crown, drawClawd, hand, type Pose } from '../clawd'
import { BASE_Y, centerX, ease, falling, flash, hop, lerp, sparkles, sprite, story, walkLegs } from './common'
import { GROUND, type Theme } from './theme'

const BRICK = 0xb45309
const COIN = 0xfacc15
const NEON: readonly Color[] = [0x22d3ee, 0xf472b6, 0xa3e635, 0xfacc15]

const INVADER = ['.g...g.', '..ggg..', '.gwgwg.', 'ggggggg', 'g.g.g.g']
const BOSS = ['...pppp...', '..pppppp..', '.pyppppyp.', 'pppppppppp', 'pp.pppp.pp', 'pppppppppp', '.p.p..p.p.', 'p..p..p..p']

const CAP = ['..rrrrrr...', '.rrrwwrrr..', 'rrrrrrrrrrr', '........rrr']
const CAP_COLORS = { r: 0xdc2626, w: 0xf8fafc }

// Le joueur : le personnage avec sa casquette rouge de héros de plateforme.
const capped = (c: Canvas, pose: Pose) => {
  drawClawd(c, pose)
  const { cx, top } = crown(pose)
  sprite(c, cx - 6, top - 3, CAP, CAP_COLORS)
}

// Un sol en briques de jeu vidéo.
const bricks = (c: Canvas) => {
  for (let x = 0; x < c.w; x++) c.set(x, GROUND, x % 4 === 0 ? 0x78350f : BRICK)
}

// Une pièce qui tourne sur elle-même (elle s'amincit puis s'élargit).
const coin = (c: Canvas, x: number, y: number, t: number) => {
  const w = Math.max(1, Math.round(Math.abs(Math.cos(t * 5)) * 3))
  c.rect(x - Math.floor(w / 2), y - 1, w, 3, COIN)
}

// Un bloc « ? » flottant.
const block = (c: Canvas, x: number, y: number, isUsed: boolean) => {
  c.rect(x, y, 5, 4, isUsed ? 0x78350f : 0xf59e0b)
  if (!isUsed) {
    c.set(x + 2, y + 1, 0xfef3c7)
    c.set(x + 2, y + 3, 0xfef3c7)
  }
}

// Le score en haut à gauche : des pastilles qui s'allument.
const score = (c: Canvas, points: number) => {
  for (let i = 0; i < Math.min(12, points); i++) c.set(1 + i * 2, 0, COIN)
}

const TETROMINOS: readonly (readonly [number, number][])[] = [
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [1, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 1], [2, 1]],
]

export const arcadeTheme: Theme = {
  id: 'arcade',
  name: 'Arcade',
  emoji: '👾',
  pitch: 'des jeux vidéo rétro : un jeu de plateforme avec des pièces, des envahisseurs de l’espace, des blocs qui tombent, une course de karts, un combat de boss',
  dress: (c, pose) => capped(c, pose),
  scene: c => bricks(c),
  sky: 'open',
  // La fête : un tuyau vert crache des pièces en gerbe, et le score grimpe.
  cheer: (c, t) => {
    const x = centerX(c) - 8
    const px = x + 24
    c.rect(px, GROUND - 4, 6, 4, 0x16a34a)
    c.rect(px - 1, GROUND - 6, 8, 2, 0x22c55e)
    for (let i = 0; i < 6; i++) {
      const life = (t * 1.2 + i / 6) % 1
      coin(c, px + 3 + (i % 2 ? 1 : -1) * life * (6 + i * 2), GROUND - 7 - hop(life) * 7, t + i)
    }
    capped(c, { x, y: BASE_Y - Math.round(hop((t * 1.6) % 1) * 3), arms: [88, 88], eyes: 'happy', look: 2 })
    score(c, Math.floor(t * 4) % 12 + 1)
  },

  idle: {
    id: 'insert-coin',
    name: 'attend une pièce',
    draw: (c, t) => {
      bricks(c)
      const x = centerX(c)
      if (t % 1.2 < 0.8) coin(c, x + 26, BASE_Y + 2, t)
      drawClawd(c, { x, y: BASE_Y, arms: [-70, -70], eyes: blink(t), look: 2 })
    },
  },

  anims: [
    {
      id: 'plateforme',
      name: 'Niveau 1-1',
      draw: (c, t) => {
        bricks(c)
        const period = 1.6
        const p = (t % period) / period
        const hits = Math.floor(t / period)
        score(c, hits)
        const scroll = (t * 6) % 12
        const x = centerX(c) - 10
        // Une rangée de blocs qui défile ; il saute sous celui du milieu.
        for (let i = -1; i < c.w / 12 + 1; i++) block(c, i * 12 - scroll + 6, 1, false)
        const air = hop(p)
        hero(c, x, air, t)
        if (p > 0.45 && p < 0.9) coin(c, x + 8, 0 - (p - 0.45) * 6 + 1, t)
        if (air > 0.95) sparkles(c, t, x + 8, 5, 3, COIN)
      },
    },
    {
      id: 'envahisseurs',
      name: 'Envahisseurs',
      draw: (c, t) => {
        for (let x = 0; x < c.w; x += 2) c.set(x, GROUND, 0x22c55e)
        const wave = Math.floor(t / 8)
        const local = t % 8
        const sway = Math.sin(local * 1.2) * 6
        const x = centerX(c) + Math.sin(t * 1.7) * (c.w / 2 - 14)
        // Une rangée d'envahisseurs ; ceux qui ont été touchés disparaissent.
        for (let i = 0; i < 5; i++) {
          const ix = c.w / 2 - 22 + i * 10 + sway
          const isDown = local > 1 + i * 1.3
          if (!isDown) sprite(c, ix, 1 + Math.floor(local / 3), INVADER, { g: NEON[(i + wave) % 4]!, w: 0xffffff }, Math.floor(t * 2) % 2 === 0)
          else if (local < 1.4 + i * 1.3) sparkles(c, t, ix + 3, 3, 4, NEON[i % 4]!, 6)
        }
        // Ses tirs laser qui montent.
        for (let k = 0; k < 3; k++) {
          const ly = BASE_Y - ((t * 30 + k * 5) % 12)
          c.line(x + 8, ly, x + 8, ly + 2, 0xf472b6)
        }
        drawClawd(c, { x, y: BASE_Y, arms: [80, 80], eyes: 'wide' })
      },
    },
    {
      id: 'blocs',
      name: 'Blocs qui tombent',
      draw: (c, t) => {
        bricks(c)
        const cell = 2
        const well = c.w - 22
        const cycle = t % 12
        // Le puits à droite où s'empilent les blocs, rangée après rangée.
        c.line(well - 1, 2, well - 1, GROUND - 1, 0x6b7280)
        c.line(well + 18, 2, well + 18, GROUND - 1, 0x6b7280)
        const rows = Math.floor(cycle / 2.4)
        const isClearing = cycle > 11
        for (let r = 0; r < rows; r++) for (let k = 0; k < 9; k++) if (noise(r * 11 + k) > 0.15 || r === rows - 1) c.rect(well + k * cell, GROUND - 2 - r * cell, cell, cell, isClearing ? 0xffffff : NEON[(r + k) % 4]!)
        const shape = TETROMINOS[Math.floor(cycle / 2.4) % TETROMINOS.length]!
        const fall = (cycle % 2.4) / 2.4
        const sx = well + 6
        const sy = lerp(2, GROUND - 4 - rows * cell, ease(fall))
        for (const [dx, dy] of shape) c.rect(sx + dx * cell, sy + dy * cell, cell, cell, NEON[Math.floor(cycle) % 4]!)
        if (isClearing) flash(c, 0xfef9c3)
        drawClawd(c, { x: centerX(c) - 16, y: BASE_Y - (isClearing ? Math.round(hop((t * 2) % 1) * 3) : 0), arms: isClearing ? [80, 80] : [-20, 30], eyes: isClearing ? 'happy' : blink(t), look: 2 })
      },
    },
    {
      id: 'kart',
      name: 'Course de karts',
      draw: (c, t) => {
        // La route qui défile en pointillés.
        for (let x = 0; x < c.w; x++) c.set(x, GROUND, 0x4b5563)
        for (let i = 0; i < c.w / 10 + 1; i++) c.rect(((i * 10 - t * 50) % (c.w + 10) + c.w + 10) % (c.w + 10), GROUND - 4, 4, 1, 0xf8fafc)
        const x = centerX(c) - 8
        const bump = Math.floor(t * 10) % 2
        const pose: Pose = { x, y: BASE_Y - 1 - bump, arms: [-10, -10], legs: [2, 2, 2, 2], lean: 1, eyes: 'happy', look: 2 }
        drawClawd(c, pose)
        // Le kart autour de lui, avec ses roues qui tournent.
        c.rect(x - 3, GROUND - 4, BODY_W + 6, 2, 0xdc2626)
        for (const wx of [x - 1, x + BODY_W + 1]) {
          c.disc(wx, GROUND - 1, 1.2, 0x111827)
          c.set(wx + (bump ? 1 : -1), GROUND - 1, 0x9ca3af)
        }
        // Une boîte à objets qui arrive.
        const bx = c.w + 6 - ((t * 25) % (c.w + 20))
        c.rect(bx, GROUND - 7, 4, 4, NEON[Math.floor(t * 4) % 4]!)
        for (let i = 0; i < 4; i++) c.set(x - 6 - i * 2, GROUND - 2 - noise(Math.floor(t * 10) + i) * 2, mix(0xd1d5db, 0x000000, i / 4))
      },
    },
    {
      id: 'boss',
      name: 'Combat de boss',
      draw: story([
        [12, (c, t, p) => {
          bricks(c)
          const bx = c.w - 14
          const by = GROUND - 9 + Math.round(Math.sin(t * 2))
          sprite(c, bx, by, BOSS, { p: 0x7c3aed, y: 0xfde047 })
          // Sa barre de vie qui baisse au fil des coups.
          const life = 1 - p
          c.rect(bx, 0, Math.round(10 * life), 1, 0xef4444)
          // Les boules de feu qu'il lance et que l'on esquive en sautant.
          const fp = (t / 1.5) % 1
          const fx = lerp(bx - 2, -4, fp)
          c.disc(fx, GROUND - 3, 1.3, noise(Math.floor(t * 10)) > 0.5 ? 0xf97316 : 0xfacc15)
          const x = centerX(c) - 14
          const isOver = Math.abs(fx - (x + 8)) < 9
          const pose: Pose = { x, y: BASE_Y - (isOver ? 5 : 0), arms: isOver ? [80, 80] : [-20, 10], legs: isOver ? [2, 2, 2, 2] : walkLegs(t, 2), eyes: isOver ? 'wide' : blink(t), look: 2 }
          drawClawd(c, pose)
          // Et ses propres tirs vers le boss.
          const h = hand(pose, 1)
          const sp = (t * 2) % 1
          c.rect(lerp(h.x + 2, bx, sp), h.y, 2, 1, 0x22d3ee)
          if (sp > 0.9) sparkles(c, t, bx + 2, by + 3, 3, 0x22d3ee)
        }],
        [5, (c, t, p) => {
          bricks(c)
          const bx = c.w - 14
          // Le boss explose en mille éclats.
          for (let i = 0; i < 14; i++) {
            const a = (i / 14) * Math.PI * 2
            c.set(bx + 5 + Math.cos(a) * p * 16, GROUND - 6 + Math.sin(a) * p * 6, NEON[i % 4]!)
          }
          falling(c, t, { count: 16, speed: 6, color: COIN })
          drawClawd(c, { x: centerX(c) - 14, y: BASE_Y - Math.round(hop((t * 2) % 1) * 3), arms: [85, 85], eyes: 'happy', look: 2 })
        }],
      ]),
    },
  ],
}

// Le héros du jeu de plateforme : il saute, le poing en l'air.
function hero(c: Canvas, x: number, air: number, t: number) {
  drawClawd(c, { x, y: BASE_Y - Math.round(air * 4), arms: air > 0.2 ? [-30, 85] : [-30, -30], legs: air > 0.2 ? [2, 1, 1, 2] : walkLegs(t, 6), eyes: 'happy', look: 1 })
}
