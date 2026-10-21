import { type Canvas, type Color, mix, noise } from '../canvas'
import { blink, crown, drawClawd, hand, type Pose } from '../clawd'
import { BASE_Y, centerX, ease, hop, lerp, sparkles, sprite, story, walkLegs } from './common'
import { GROUND, type Special, type Theme } from './theme'

const GRASS = 0x65a30d
const GRASS_DARK = 0x4d7c0f
const STONE = 0x78716c
const STONE_DARK = 0x57534e
const STEEL = 0xcbd5e1
const STEEL_DARK = 0x94a3b8
const PLUME = 0xdc2626
const WOOD = 0x92400e
const GOLD = 0xfacc15

const HELM = ['......rr......', '.....rr.......', '...ssssssss...', '..sssssssssss.', '.sdsssssssssd.']
const HELM_COLORS = { s: STEEL, d: STEEL_DARK, r: PLUME }

// Le chevalier : le personnage sous son heaume à plumet.
const knight = (c: Canvas, pose: Pose) => {
  drawClawd(c, pose)
  const { cx, top } = crown(pose)
  sprite(c, cx - 7, top - 4, HELM, HELM_COLORS)
}

// L'herbe de la cour du château.
const lawn = (c: Canvas) => {
  for (let x = 0; x < c.w; x++) c.set(x, GROUND, noise(x + 70) > 0.8 ? GRASS_DARK : GRASS)
}

// Un château de `w` px de large à partir de `x` : des murs crénelés, une porte et un drapeau.
const castle = (c: Canvas, x: number, w: number, t: number, isGateOpen = false) => {
  const top = GROUND - 9
  for (let y = top; y < GROUND; y++) {
    for (let dx = 0; dx < w; dx++) c.set(x + dx, y, (dx + (y % 2) * 2) % 4 === 0 && y % 2 === 0 ? STONE_DARK : STONE)
  }
  for (let dx = 0; dx < w; dx += 3) c.rect(x + dx, top - 1, 2, 1, STONE)
  // La tour du milieu, plus haute.
  const tx = x + Math.round(w / 2) - 3
  c.rect(tx, top - 4, 6, 4, STONE)
  c.set(tx, top - 5, STONE)
  c.set(tx + 2, top - 5, STONE)
  c.set(tx + 5, top - 5, STONE)
  c.rect(tx + 2, top - 3, 2, 2, 0x1c1917)
  // Le drapeau qui flotte au vent.
  c.line(tx + 3, top - 5, tx + 3, top - 9, WOOD)
  const flutter = Math.floor(t * 4) % 2
  c.rect(tx + 4, top - 9, 3, 2, PLUME)
  c.set(tx + 7, top - 9 + flutter, PLUME)
  // La porte en arc.
  const gx = x + Math.round(w / 2) - 2
  c.rect(gx, GROUND - 5, 4, 5, isGateOpen ? 0x1c1917 : WOOD)
  c.rect(gx + 1, GROUND - 6, 2, 1, isGateOpen ? 0x1c1917 : WOOD)
  return { gx, top }
}

// Un bouclier tenu dans la main gauche.
const shield = (c: Canvas, pose: Pose) => {
  const { x, y } = hand(pose, -1)
  c.rect(x - 2, y - 2, 3, 5, STEEL_DARK)
  c.rect(x - 1, y - 1, 1, 3, PLUME)
  return { x: x - 2, y }
}

// Une épée dans la main droite, pointée selon `angle`.
const sword = (c: Canvas, pose: Pose, angle: number, length = 6) => {
  const { x, y } = hand(pose, 1)
  const rad = (angle * Math.PI) / 180
  const tip = { x: x + 1 + Math.cos(rad) * length, y: y - Math.sin(rad) * length }
  c.line(x + 1, y, tip.x, tip.y, STEEL)
  c.set(x + 1, y, GOLD)
  return tip
}

const DRAGON = [
  '......h...h...',
  '.....rrr.rr...',
  '...rrrrrrrrr..',
  '.rrrkrrrrrrrr.',
  'rrrrrrrrrrrrrr',
  'wrwrrrrrrrrrrr',
  '.......rrrrrrr',
  '........rrrrrr',
  '.........rrrrr',
  '.........rrrrr',
  '........rrrrrr',
  '.......rrrrrrr',
]
const DRAGON_COLORS = { r: 0xb91c1c, h: 0xfde68a, k: 0xfde047, w: 0xf8fafc }
const FIRE: readonly Color[] = [0xfde047, 0xf97316, 0xdc2626]

const ROCK = ['...rrrr...', '..rrrrrr..', '.rrrrdrrr.', 'rrrdrrrrrr']

// Un feu d'artifice qui éclate en `(x, y)` ; `life` de 0 à 1.
const burst = (c: Canvas, x: number, y: number, life: number, color: Color) => {
  if (life < 0.25) {
    c.dot(x, GROUND - (GROUND - y) * (life / 0.25), 0xfef3c7)
    return
  }
  const k = (life - 0.25) / 0.75
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2
    c.dot(x + Math.cos(a) * k * 7, y + Math.sin(a) * k * 5 + k * k * 2, mix(color, 0x1c1917, k * 0.45))
  }
}

// Le 14 Juillet : un feu d'artifice bleu, blanc, rouge au-dessus du château.
const bastilleDay: Special = {
  dates: ['07-14'],
  occasion: 'le 14 Juillet',
  anim: {
    id: 'feu-d-artifice',
    name: 'Feu d’artifice au château',
    draw: (c, t) => {
      lawn(c)
      castle(c, c.w - 26, 22, t)
      const colors = [0x3b82f6, 0xf8fafc, 0xef4444]
      for (let i = 0; i < 3; i++) {
        const life = (t * 0.5 + i / 3) % 1
        burst(c, lerp(28, c.w - 8, i / 2), 3 + (i % 2) * 2, life, colors[i]!)
      }
      const air = hop((t * 1.5) % 1)
      const pose: Pose = { x: 4, y: BASE_Y - Math.round(air * 2), arms: [-40, 85], eyes: 'happy', look: 2 }
      knight(c, pose)
      // Un petit drapeau tricolore agité.
      const h = hand(pose, 1)
      c.line(h.x + 1, h.y, h.x + 1, h.y - 4, WOOD)
      const wave = Math.floor(t * 5) % 2
      c.rect(h.x + 2, h.y - 4 + wave, 1, 2, 0x3b82f6)
      c.rect(h.x + 3, h.y - 4, 1, 2, 0xf8fafc)
      c.rect(h.x + 4, h.y - 4 + wave, 1, 2, 0xef4444)
    },
  },
}

export const knightTheme: Theme = {
  id: 'chevalier',
  name: 'Chevalier',
  emoji: '🏰',
  pitch: 'un heaume à plumet, un château fort, un dragon qui crache du feu, une joute, l’épée dans le rocher, un pont-levis, l’adoubement',
  dress: (c, pose) => knight(c, pose),
  scene: c => lawn(c),
  sky: 'open',
  // La fête : l'épée brandie, l'étendard qui claque au vent, des étincelles d'or.
  cheer: (c, t) => {
    const air = hop((t * 1.6) % 1)
    const pose: Pose = { x: centerX(c), y: BASE_Y - Math.round(air * 2), arms: [-10, 88], eyes: 'happy' }
    knight(c, pose)
    const tip = sword(c, pose, 90, 6)
    sparkles(c, t, tip.x, tip.y, 4, GOLD, 5)
    // L'étendard dans l'autre main.
    const h = hand(pose, -1)
    c.line(h.x, GROUND - 1, h.x, 2, WOOD)
    const wave = Math.floor(t * 6) % 2
    c.rect(h.x - 6, 2 + wave, 6, 4, PLUME)
    c.rect(h.x - 4, 3 + wave, 2, 2, GOLD)
  },
  specials: [bastilleDay],

  idle: {
    id: 'garde',
    name: 'monte la garde au château',
    draw: (c, t) => {
      lawn(c)
      castle(c, c.w - 26, 22, t)
      const pose: Pose = { x: centerX(c) - 10, y: BASE_Y, arms: [-60, 0], eyes: blink(t), look: Math.round(Math.sin(t * 0.4) * 2) }
      knight(c, pose)
      // La lance tenue droite, sa pointe qui brille.
      const h = hand(pose, 1)
      c.line(h.x + 1, GROUND - 1, h.x + 1, h.y - 7, WOOD)
      c.set(h.x + 1, h.y - 8, t % 3 < 0.2 ? 0xffffff : STEEL)
    },
  },

  anims: [
    {
      id: 'dragon',
      name: 'Face au dragon',
      draw: story([
        [4.5, (c, t) => {
          lawn(c)
          const dx = c.w - 14
          const breath = Math.sin(t * 2) > -0.2
          sprite(c, dx, GROUND - 11, DRAGON, DRAGON_COLORS)
          const pose: Pose = { x: 6, y: BASE_Y + 1, arms: [10, -60], lean: -1, squash: 1, eyes: breath ? 'closed' : 'wide', look: 2 }
          knight(c, pose)
          const s = shield(c, { ...pose, arms: [10, -60] })
          // Le souffle de feu, qui s'écrase sur le bouclier.
          if (breath) {
            for (let i = 0; i < 18; i++) {
              const life = (t * 3 + i / 18) % 1
              const fx = lerp(dx, s.x + 26, life)
              c.dot(fx, GROUND - 6 + Math.sin(i * 1.7 + t * 9) * life * 2, FIRE[i % FIRE.length]!)
            }
            sparkles(c, t, s.x + 24, s.y, 3, 0xfde047, 4)
          }
        }],
        [3.5, (c, t) => {
          lawn(c)
          const dx = c.w - 14
          sprite(c, dx + Math.round(Math.sin(t * 2)), GROUND - 11, DRAGON, { ...DRAGON_COLORS, k: 0x1c1917 })
          // Finalement, ils deviennent amis : des petits cœurs.
          for (let i = 0; i < 3; i++) {
            const life = (t * 0.6 + i / 3) % 1
            const hx = lerp(26, dx - 4, i / 2)
            const hy = 6 - life * 5
            c.set(hx, hy, 0xf472b6)
            c.set(hx + 2, hy, 0xf472b6)
            c.rect(hx, hy + 1, 3, 1, 0xf472b6)
            c.set(hx + 1, hy + 2, 0xf472b6)
          }
          knight(c, { x: 6, y: BASE_Y, arms: [-60, 60 + Math.round(Math.sin(t * 8) * 20)], eyes: 'happy', look: 2 })
        }],
      ]),
    },
    {
      id: 'joute',
      name: 'La joute',
      draw: story([
        [3, (c, t, p) => {
          lawn(c)
          const qx = c.w - 10
          // Le mannequin d'entraînement : un poteau et son bras de bois.
          c.rect(qx, GROUND - 9, 1, 9, WOOD)
          c.rect(qx - 4, GROUND - 8, 9, 1, WOOD)
          c.rect(qx + 4, GROUND - 9, 2, 3, PLUME)
          const x = lerp(-4, qx - 30, ease(p))
          const pose: Pose = { x, y: BASE_Y - Math.round(hop((t * 4) % 1)), arms: [-50, 0], legs: walkLegs(t, 9), lean: 2, eyes: 'square', look: 2 }
          knight(c, pose)
          sword(c, pose, 0, 12)
        }],
        [0.5, (c, t) => {
          lawn(c)
          const qx = c.w - 10
          c.rect(qx, GROUND - 9, 1, 9, WOOD)
          c.rect(qx - 4, GROUND - 8, 9, 1, WOOD)
          const pose: Pose = { x: qx - 30, y: BASE_Y, arms: [-50, 0], lean: 3, eyes: 'wide', look: 2 }
          knight(c, pose)
          const tip = sword(c, pose, 0, 12)
          sparkles(c, t, tip.x, tip.y, 4, 0xfde047, 6)
        }],
        [3, (c, t, p) => {
          lawn(c)
          const qx = c.w - 10
          c.rect(qx, GROUND - 9, 1, 9, WOOD)
          // Le bras du mannequin tourne à toute vitesse, puis ralentit.
          const a = (1 - (1 - p) ** 2) * Math.PI * 8
          c.line(qx - Math.cos(a) * 4, GROUND - 8 - Math.sin(a) * 1, qx + Math.cos(a) * 4, GROUND - 8 + Math.sin(a) * 1, WOOD)
          const air = hop((t * 2) % 1)
          knight(c, { x: qx - 30, y: BASE_Y - Math.round(air * 3), arms: [80, 80], eyes: 'happy', look: 2 })
        }],
      ]),
    },
    {
      id: 'epee-rocher',
      name: 'L’épée dans le rocher',
      draw: story([
        [4.5, (c, t, p) => {
          lawn(c)
          const rx = centerX(c) + 10
          sprite(c, rx, GROUND - 4, ROCK, { r: STONE, d: STONE_DARK })
          c.line(rx + 5, GROUND - 5, rx + 5, GROUND - 9, STEEL)
          c.rect(rx + 3, GROUND - 10, 5, 1, GOLD)
          c.set(rx + 5, GROUND - 11, GOLD)
          // Il tire de toutes ses forces, de plus en plus fort.
          const strain = Math.round(Math.sin(t * (10 + p * 20)) * (0.5 + p))
          knight(c, { x: rx - 16 + strain, y: BASE_Y + 1, arms: [30, 30], lean: -2, squash: 1, eyes: 'closed', look: 2 })
          if (p > 0.6) sparkles(c, t, rx + 5, GROUND - 6, 3, 0xe5e7eb, 3)
        }],
        [4, (c, t, p) => {
          lawn(c)
          const rx = centerX(c) + 10
          sprite(c, rx, GROUND - 4, ROCK, { r: STONE, d: STONE_DARK })
          // L'épée brandie, et un rayon de lumière qui descend du ciel.
          const beam = ease(p * 3)
          for (let y = 0; y < GROUND * beam; y++) if ((y + Math.floor(t * 8)) % 3) c.dot(rx - 6 + (y % 2) * 0.5, y, 0xfef9c3)
          const pose: Pose = { x: rx - 14, y: BASE_Y - Math.round(hop((t * 1.5) % 1) * 2), arms: [-50, 88], eyes: 'happy', look: 1 }
          knight(c, pose)
          const tip = sword(c, pose, 90, 6)
          c.rect(hand(pose, 1).x - 1, hand(pose, 1).y, 4, 1, GOLD)
          sparkles(c, t, tip.x, tip.y, 4, 0xfef9c3, 5)
        }],
      ]),
    },
    {
      id: 'pont-levis',
      name: 'Le pont-levis s’abaisse',
      draw: story([
        [3, (c, t, p) => {
          lawn(c)
          const { gx } = castle(c, c.w - 26, 22, t)
          // Le fossé, et le pont qui descend lentement.
          c.rect(gx - 9, GROUND, 9, 1, 0x0284c7)
          const a = ease(p) * (Math.PI / 2)
          c.line(gx - 1, GROUND - 6, gx - 1 - Math.sin(a) * 8, GROUND - 6 + (1 - Math.cos(a)) * 6, WOOD, 1)
          if (p < 0.9) c.line(gx - 1, GROUND - 7, gx - 1 - Math.sin(a) * 8, GROUND - 6 + (1 - Math.cos(a)) * 6, STEEL_DARK)
          knight(c, { x: 4, y: BASE_Y, arms: [-60, -60], eyes: blink(t), look: 2 })
        }],
        [4, (c, t, p) => {
          lawn(c)
          const { gx } = castle(c, c.w - 26, 22, t, true)
          c.rect(gx - 9, GROUND, 9, 1, 0x0284c7)
          c.rect(gx - 9, GROUND - 1, 9, 1, WOOD)
          // Il traverse en paradant et entre dans le château.
          const x = lerp(4, gx - 6, ease(p))
          if (p < 0.92) knight(c, { x, y: BASE_Y - (x > gx - 22 ? 1 : 0), arms: [70, -60], legs: walkLegs(t, 4), eyes: 'happy', look: 2 })
          else sparkles(c, t, gx + 2, GROUND - 3, 3, GOLD, 4)
        }],
      ]),
    },
    {
      id: 'adoubement',
      name: 'L’adoubement',
      draw: story([
        [4, (c, t, p) => {
          lawn(c)
          const x = centerX(c) - 4
          knight(c, { x, y: BASE_Y + 2, arms: [-80, -80], squash: 2, eyes: 'closed' })
          // L'épée du roi, venue d'en haut, touche une épaule puis l'autre.
          const side = p < 0.5 ? -1 : 1
          const tap = Math.max(0, Math.sin(((p * 2) % 1) * Math.PI))
          const bx = side < 0 ? x - 1 : x + 17
          c.line(bx + side * 8, 0, bx, BASE_Y + 2 - tap * 2, STEEL)
          c.rect(bx + side * 8 - 1, 0, 3, 1, GOLD)
          if (tap > 0.9) sparkles(c, t, bx, BASE_Y + 1, 2, 0xfef9c3, 3)
        }],
        [3, (c, t) => {
          lawn(c)
          const x = centerX(c) - 4
          const pose: Pose = { x, y: BASE_Y, arms: [-60, 70], eyes: 'happy' }
          knight(c, pose)
          sword(c, pose, 80, 6)
          sparkles(c, t, x + 8, BASE_Y - 4, 12, GOLD, 6)
        }],
      ]),
    },
  ],
}
