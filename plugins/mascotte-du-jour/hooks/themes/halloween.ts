import { type Canvas, mix, noise } from '../canvas'
import { BODY_W, blink, crown, drawClawd, hand, type Pose } from '../clawd'
import { BASE_Y, centerX, falling, hop, lerp, sparkles, sprite, story, walkLegs } from './common'
import { GROUND, type Special, type Theme } from './theme'

const PUMPKIN = 0xf97316
const NIGHT_GRASS = 0x14532d
const GHOST = 0xf1f5f9
const CANDY = [0xf472b6, 0xa3e635, 0xfacc15, 0x60a5fa, 0xc084fc]

const PUMPKIN_ROWS = ['...g...', '.ooooo.', 'ooooooo', 'ooooooo', 'ooooooo', '.ooooo.']
const CARVED_ROWS = ['...g...', '.ooooo.', 'oyoooyo', 'ooooooo', 'oyyyyyo', '.ooooo.']
const SKELETON = ['.www.', '.wkw.', '..w..', 'wwwww', '..w..', '.w.w.', 'w...w']

// La nuit d'Halloween : herbe sombre et grosse lune pâle.
const night = (c: Canvas) => {
  for (let x = 0; x < c.w; x++) c.set(x, GROUND, noise(x) > 0.8 ? 0x166534 : NIGHT_GRASS)
  c.disc(c.w - 6, 4, 3, 0xfef9c3)
  c.disc(c.w - 5, 3, 1, 0xfde68a)
}

// Une citrouille, sculptée et allumée (la flamme vacille) ou non.
const pumpkin = (c: Canvas, x: number, t: number, isCarved: boolean) => {
  const glow = noise(Math.floor(t * 8)) > 0.3 ? 0xfde047 : 0xf59e0b
  sprite(c, x, GROUND - 6, isCarved ? CARVED_ROWS : PUMPKIN_ROWS, { g: 0x16a34a, o: PUMPKIN, y: glow })
}

// Une chauve-souris qui bat des ailes.
const bat = (c: Canvas, x: number, y: number, t: number) => {
  const isUp = Math.floor(t * 8) % 2 === 0
  c.set(x, y, 0x1f1f1f)
  c.set(x + 1, y, 0x1f1f1f)
  c.set(x - 1, y + (isUp ? -1 : 1), 0x3f3f46)
  c.set(x + 2, y + (isUp ? -1 : 1), 0x3f3f46)
}

// Un fantôme : une forme blanche arrondie au bas ondulant, avec deux yeux.
const ghost = (c: Canvas, x: number, y: number, t: number, w = 10) => {
  for (let row = 0; row < 9; row++) {
    const inset = row === 0 ? 2 : row === 1 ? 1 : 0
    c.rect(x + inset, y + row, w - inset * 2, 1, GHOST)
  }
  for (let i = 0; i < w; i += 2) c.set(x + i + (Math.floor(t * 4) % 2), y + 9, GHOST)
  c.rect(x + 2, y + 3, 2, 2, 0x111827)
  c.rect(x + w - 4, y + 3, 2, 2, 0x111827)
}

const WITCH_HAT = ['....k....', '...kkk...', '..kkokk..', 'kkkkkkkkk']
const BUCKET = ['.k...k.', '.ooooo.', 'oyoooyo', 'ooooooo', 'oyyyyyo', '.ooooo.']

// Le 31 octobre : la tournée des bonbons, en chapeau de sorcière, seau-citrouille à la main.
const halloweenNight: Special = {
  dates: ['10-31'],
  occasion: 'Halloween',
  anim: {
    id: 'bonbons',
    name: 'Des bonbons ou un sort !',
    draw: (c, t) => {
      night(c)
      for (let i = 0; i < 3; i++) bat(c, ((t * 8 + i * 23) % (c.w + 10)) - 5, 2 + i * 2 + Math.round(Math.sin(t * 3 + i)), t + i)
      const x = centerX(c) - 8 + Math.round(Math.sin(t * 0.6) * 5)
      const pose: Pose = { x, y: BASE_Y, arms: [-30, -5], legs: walkLegs(t, 3), eyes: 'happy', look: 2 }
      drawClawd(c, pose)
      const { cx, top } = crown(pose)
      sprite(c, cx - 5, top - 4, WITCH_HAT, { k: 0x3b0764, o: PUMPKIN })
      const h = hand(pose, 1)
      sprite(c, h.x + 1, h.y, BUCKET, { k: 0x1f1f1f, o: PUMPKIN, y: 0xfde047 })
      // Les bonbons lancés depuis la droite, qui retombent dans le seau.
      for (let i = 0; i < 4; i++) {
        const life = (t * 0.8 + i / 4) % 1
        const bx = lerp(c.w - 3, h.x + 4, life)
        const by = lerp(GROUND - 9, h.y, life) - hop(life) * 5
        c.rect(bx, by, 2, 1, CANDY[i % CANDY.length]!)
      }
    },
  },
}

export const halloweenTheme: Theme = {
  id: 'halloween',
  name: 'Halloween',
  emoji: '🎃',
  pitch: 'une nuit de pleine lune, des citrouilles sculptées, un costume de fantôme, des chauves-souris, des bonbons, des squelettes qui dansent',
  dress: (c, pose) => drawClawd(c, pose),
  scene: c => night(c),
  sky: 'own',
  // La fête : les citrouilles s'allument et des petits fantômes font la ronde autour de lui.
  cheer: (c, t) => {
    pumpkin(c, 3, t, true)
    pumpkin(c, c.w - 10, t, true)
    for (let i = 0; i < 2; i++) {
      const a = t * 2 + i * Math.PI
      if (Math.sin(a) < 0.3) ghost(c, centerX(c) + 5 + Math.cos(a) * 20, 3 + Math.sin(a) * 2, t + i, 6)
    }
    const air = hop((t * 1.8) % 1)
    drawClawd(c, { x: centerX(c), y: BASE_Y - Math.round(air * 3), arms: [80, 80], eyes: 'happy' })
  },
  specials: [halloweenNight],

  idle: {
    id: 'veillee',
    name: 'veille près de sa citrouille',
    draw: (c, t) => {
      night(c)
      const x = centerX(c) - 6
      pumpkin(c, x + 22, t, true)
      if (t % 9 < 3) bat(c, c.w - ((t % 9) / 3) * (c.w + 4), 5 + Math.sin(t * 4) * 2, t)
      drawClawd(c, { x, y: BASE_Y, arms: [-70, -70], squash: 0, eyes: blink(t), look: 2 })
    },
  },

  anims: [
    {
      id: 'fantome',
      name: 'Costume de fantôme',
      draw: (c, t) => {
        night(c)
        const x = centerX(c) + Math.sin(t * 0.8) * (c.w / 2 - 14)
        const y = BASE_Y - 2 + Math.round(Math.sin(t * 2.5) * 1.5)
        ghost(c, x - 1, y, t, BODY_W + 2)
        if (Math.floor(t * 2) % 4 === 0) sparkles(c, t, x + 8, y - 2, 5, 0xe9d5ff, 3)
      },
    },
    {
      id: 'citrouille',
      name: 'Sculpter la citrouille',
      draw: story([
        [7, (c, t, p) => {
          night(c)
          const x = centerX(c) - 6
          pumpkin(c, x + 22, t, p > 0.75)
          const cut = Math.floor(t * 4) % 2
          const pose: Pose = { x, y: BASE_Y, arms: [-50, cut ? -20 : 15], eyes: blink(t), look: 2 }
          drawClawd(c, pose)
          const h = hand(pose, 1)
          c.line(h.x + 1, h.y, h.x + 3, h.y + (cut ? 2 : -1), 0xd1d5db)
          if (cut) sparkles(c, t, x + 25, GROUND - 4, 3, PUMPKIN, 3)
        }],
        [5, (c, t) => {
          night(c)
          const x = centerX(c) - 6
          pumpkin(c, x + 22, t, true)
          // La lueur de la citrouille autour d'elle.
          for (let i = 0; i < 6; i++) c.set(x + 25 + Math.cos(i + t) * 6, GROUND - 4 + Math.sin(i + t) * 3, mix(0xfde047, 0x000000, 0.5))
          const air = hop((t * 2) % 1)
          drawClawd(c, { x, y: BASE_Y - Math.round(air * 2), arms: [70, 70], eyes: 'happy', look: 2 })
        }],
      ]),
    },
    {
      id: 'chauves-souris',
      name: 'Nuée de chauves-souris',
      draw: (c, t) => {
        night(c)
        for (let i = 0; i < 9; i++) {
          const speed = 10 + noise(i) * 8
          const bx = c.w + 4 - ((t * speed + noise(i + 4) * c.w) % (c.w + 8))
          bat(c, bx, 2 + noise(i + 2) * 8 + Math.sin(t * 5 + i) * 1.5, t + i * 0.1)
        }
        const flail = Math.floor(t * 5) % 2
        drawClawd(c, { x: centerX(c), y: BASE_Y + 1, arms: flail ? [80, 40] : [40, 80], squash: 1, eyes: 'wide', look: Math.round(Math.sin(t * 3) * 2) })
      },
    },
    {
      id: 'bonbons',
      name: 'Pluie de bonbons',
      draw: (c, t) => {
        night(c)
        falling(c, t, { count: 24, speed: 9, color: CANDY[0]!, colors: CANDY })
        const x = centerX(c) + Math.sin(t * 1.3) * (c.w / 2 - 16)
        const pose: Pose = { x, y: BASE_Y, arms: [-40, 20], legs: walkLegs(t, 4), eyes: 'happy', look: Math.cos(t * 1.3) > 0 ? 2 : -2 }
        drawClawd(c, pose)
        // Le seau citrouille, de plus en plus plein.
        const h = hand(pose, 1)
        c.rect(h.x + 1, h.y + 1, 4, 3, PUMPKIN)
        c.set(h.x + 2, h.y, CANDY[Math.floor(t) % CANDY.length]!)
      },
    },
    {
      id: 'frayeur',
      name: 'Bouh !',
      draw: story([
        [4, (c, t, p) => {
          night(c)
          const x = lerp(6, centerX(c) + 6, p)
          drawClawd(c, { x, y: BASE_Y, arms: [-60, -60], legs: walkLegs(t, 3), eyes: blink(t), look: 2 })
          ghost(c, x - 16, BASE_Y - 1 + Math.round(Math.sin(t * 3)), t)
        }],
        [1.5, (c, t, p) => {
          night(c)
          const x = centerX(c) + 6
          drawClawd(c, { x, y: BASE_Y - Math.round(hop(p) * 5), arms: [90, 90], legs: [2, 2, 2, 2], eyes: 'wide', look: -2 })
          ghost(c, x - 14, BASE_Y - 3, t)
        }],
        [3, (c, t, p) => {
          night(c)
          const x = centerX(c) + 6
          // Le fantôme s'évapore en fumée…
          if (p < 0.4) for (let i = 0; i < 8; i++) c.disc(x - 9 + Math.cos(i) * p * 15, BASE_Y + 3 + Math.sin(i * 2) * p * 6, 1, mix(GHOST, 0x000000, p * 2))
          // … et il rit de sa propre peur.
          const shake = Math.floor(t * 8) % 2
          drawClawd(c, { x, y: BASE_Y, arms: [shake ? 20 : 10, shake ? 10 : 20], squash: shake, eyes: 'happy', look: -2 })
        }],
      ]),
    },
    {
      id: 'squelettes',
      name: 'Danse macabre',
      draw: (c, t) => {
        night(c)
        const beat = Math.floor(t * 3) % 2
        const x = centerX(c)
        for (const [i, sx] of [x - 14, x + 24].entries()) {
          const isUp = (beat + i) % 2 === 0
          sprite(c, sx, GROUND - 7 - (isUp ? 1 : 0), SKELETON, { w: 0xe5e7eb, k: 0x111827 }, isUp)
        }
        const pose: Pose = { x, y: BASE_Y - beat, arms: beat ? [70, -30] : [-30, 70], lean: beat ? 2 : -2, eyes: 'happy' }
        drawClawd(c, pose)
        const { cx, top } = crown(pose)
        // Un petit chapeau de sorcière pour l'occasion.
        sprite(c, cx - 4, top - 4, ['....k....', '...kk....', '..kkpk...', 'kkkkkkkkk'], { k: 0x1f1f1f, p: 0x7c3aed })
        sparkles(c, t, x + 8, 3, 18, 0xa3e635, 3)
      },
    },
  ],
}
