// Les activités communes à tous les thèmes : ce que fait le personnage pendant
// que Claude lit, écrit, lance une commande, cherche sur le web ou envoie des
// renforts, et ses réactions (une erreur, un commit réussi, la fin d'un long tour). Chaque thème
// y met son costume et son décor ; les accessoires restent près du sol pour
// rester visibles en mini.

import { type Canvas, mix, noise } from './canvas'
import { blink, crown, hand, type Pose } from './clawd'
import { BASE_Y, centerX, falling, hop, sparkles, sprite, walkLegs } from './themes/common'
import { type Lang, t } from './i18n'
import { type Anim, GROUND, type Theme } from './themes/theme'

export type Activity = 'lire' | 'ecrire' | 'commande' | 'web' | 'agent' | 'echec' | 'commit' | 'fete' | 'triste'

// Les réactions passent avant tout le reste, même quand Claude ne travaille plus.
export const isReaction = (a: Activity) => a === 'commit' || a === 'fete' || a === 'triste'

// Un `git commit` réussi (la commande n'a pas échoué) qui a vraiment créé un commit : git
// l'annonce par « [branche abc1234] message », sauf en --quiet où il ne dit rien.
// Ni un --dry-run, ni un `git log` qui parle de commits.
export function isCommit(command: unknown, output: unknown): boolean {
  if (typeof command !== 'string') return false
  const call = command.match(/\bgit\b[^|;&\n]*\bcommit\b[^|;&\n]*/)?.[0]
  if (call === undefined || /--dry-run\b/.test(call)) return false
  return (typeof output === 'string' && /^\[[^\]\n]+ [0-9a-f]{7,40}\]/m.test(output)) || /\s(-[a-zA-Z]*q[a-zA-Z]*|--quiet)\b/.test(call)
}

// L'activité d'un appel d'outil, ou null pour un outil qui ne se voit pas (une liste de tâches…).
export function activityOf(tool: string): Activity | null {
  if (/^(Read|Grep|Glob|LS|LSP)$/.test(tool)) return 'lire'
  if (/^(Edit|MultiEdit|Write|NotebookEdit)$/.test(tool)) return 'ecrire'
  if (/^(Bash|BashOutput|KillShell|PowerShell)$/.test(tool)) return 'commande'
  if (/^(WebFetch|WebSearch)$/.test(tool) || tool.startsWith('mcp__')) return 'web'
  if (/^(Agent|Task)$/.test(tool)) return 'agent'
  return null
}

const PAPER = 0xf8fafc
const INK = 0x94a3b8
const SCREEN = 0x0f172a
const FRAME = 0x475569
const CODE = [0x67e8f9, 0xf472b6, 0xa3e635, 0xfde047]
const CONFETTI = [0xf472b6, 0x67e8f9, 0xfde047, 0xa3e635, 0xc084fc]

// Le personnage un peu à gauche, pour laisser la place à l'accessoire.
const leftX = (c: Canvas) => centerX(c) - 6

const backdrop = (c: Canvas, t: number, theme: Theme) => {
  if (theme.scene) return theme.scene(c, t)
  for (let x = 0; x < c.w; x++) c.set(x, GROUND, noise(x) > 0.85 ? 0x6b7280 : 0x9ca3af)
}

// Un livre ouvert tenu à deux mains, dont les pages tournent.
const read = (c: Canvas, t: number, theme: Theme) => {
  const x = centerX(c)
  const pose: Pose = { x, y: BASE_Y, arms: [-25, -25], eyes: blink(t), look: Math.round(Math.sin(t * 0.7)) }
  theme.dress(c, pose, t)
  const by = BASE_Y + 6
  c.rect(x + 2, by, 12, 4, PAPER)
  c.rect(x + 7, by, 2, 4, INK)
  for (let row = 1; row < 4; row += 1) {
    c.rect(x + 3, by + row, 3, 1, row % 2 ? INK : mix(INK, PAPER, 0.5))
    c.rect(x + 10, by + row, 3, 1, row % 2 ? mix(INK, PAPER, 0.5) : INK)
  }
  // La page qui tourne, toutes les 2,5 secondes.
  const flip = (t % 2.5) / 0.5
  if (flip < 1) c.rect(x + 9 + Math.round(-flip * 6), by - 1, 1, 4, 0xe2e8f0)
}

// Un ordinateur portable posé à côté, et du code qui s'écrit à l'écran.
const write = (c: Canvas, t: number, theme: Theme) => {
  const x = leftX(c)
  const typing = Math.floor(t * 8) % 2
  const pose: Pose = { x, y: BASE_Y, arms: [-50, typing ? -5 : -20], lean: 1, eyes: blink(t, 'square'), look: 2 }
  theme.dress(c, pose, t)
  const lx = x + 22
  c.rect(lx, GROUND - 1, 12, 1, FRAME)
  c.rect(lx + 2, GROUND - 8, 10, 7, FRAME)
  c.rect(lx + 3, GROUND - 7, 8, 5, SCREEN)
  // Les lignes s'écrivent l'une après l'autre, puis l'écran défile.
  const written = (t * 6) % 30
  for (let row = 0; row < 5; row++) {
    const len = Math.max(0, Math.min(6, Math.round(written - row * 6)))
    const indent = Math.round(noise(row + Math.floor(t / 5) * 5) * 2)
    if (len > 0) c.rect(lx + 3 + indent, GROUND - 7 + row, Math.min(len, 8 - indent), 1, CODE[(row + indent) % CODE.length]!)
  }
}

// Un grand terminal où défilent des lignes, et le curseur qui clignote.
const command = (c: Canvas, t: number, theme: Theme) => {
  const x = leftX(c)
  const tap = Math.floor(t * 2) % 2
  theme.dress(c, { x, y: BASE_Y, arms: [-70, -70], legs: [0, 0, 0, tap], eyes: blink(t), look: 2 }, t)
  const tx = x + 22
  c.rect(tx, GROUND - 10, 12, 10, FRAME)
  c.rect(tx + 1, GROUND - 9, 10, 8, SCREEN)
  const scroll = Math.floor(t * 4)
  for (let row = 0; row < 6; row++) {
    const len = 2 + Math.round(noise(scroll + row) * 6)
    c.rect(tx + 2, GROUND - 8 + row, len, 1, mix(0x4ade80, SCREEN, 0.3 + (5 - row) * 0.1))
  }
  c.set(tx + 2, GROUND - 2, 0x4ade80)
  if (t % 0.8 < 0.4) c.set(tx + 4, GROUND - 2, 0xf8fafc)
}

// Un globe qui tourne sur son pied, et le personnage qui le montre du doigt.
const web = (c: Canvas, t: number, theme: Theme) => {
  const x = leftX(c)
  const pose: Pose = { x, y: BASE_Y, arms: [-60, 15], eyes: blink(t, 'wide'), look: 2 }
  theme.dress(c, pose, t)
  const gx = x + 27
  const gy = GROUND - 7
  const r = 4
  c.line(gx, gy + r, gx, GROUND - 1, FRAME)
  c.rect(gx - 2, GROUND - 1, 5, 1, FRAME)
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r + 0.5) continue
      // La longitude du point, qui avance avec la rotation.
      const lon = Math.asin(Math.max(-1, Math.min(1, dx / Math.sqrt(Math.max(1, r * r - dy * dy))))) + t * 1.5
      const isLand = noise(Math.floor(lon * 2.2) * 13 + dy * 3) > 0.55
      c.set(gx + dx, gy + dy, isLand ? 0x22c55e : 0x2563eb)
    }
  }
  // Des ondes qui partent du globe.
  const wave = (t * 1.5) % 1
  c.set(gx + r + 1 + Math.round(wave * 4), gy - r - Math.round(wave * 2), mix(0x67e8f9, 0x000000, wave))
}

const CLONE = ['ooooo', 'okoko', 'ooooo', 'o.o.o']
const CLONE_COLORS = { o: 0xd97757, k: 0x1f1e1d }

// De petits clones qui courent en tous sens pendant que le personnage dirige.
const agents = (c: Canvas, t: number, theme: Theme) => {
  const x = centerX(c)
  const wave = Math.round(Math.sin(t * 6) * 15)
  theme.dress(c, { x, y: BASE_Y, arms: [60 + wave, 60 - wave], eyes: 'happy' }, t)
  for (let i = 0; i < 3; i++) {
    const span = 14 + i * 3
    const k = Math.sin(t * (1.6 + i * 0.4) + i * 2)
    const side = i % 2 === 0 ? -1 : 1
    const cx = x + 8 + side * (14 + i * 4) + k * (span / 3)
    const legs = walkLegs(t + i, 8)[0]
    const row = legs ? CLONE : [...CLONE.slice(0, 3), '.o.o.']
    sprite(c, cx - 2, GROUND - 4 - Math.round(hop((t * 2 + i / 3) % 1) * 1), row, CLONE_COLORS, k < 0)
  }
}

// Avachi sous un petit nuage de pluie.
const oops = (c: Canvas, t: number, theme: Theme) => {
  const x = centerX(c)
  const pose: Pose = { x, y: BASE_Y + 1, arms: [-85, -85], squash: 1, eyes: 'closed', look: -1 }
  theme.dress(c, pose, t)
  const { cx, top } = crown(pose)
  const cloudY = Math.max(0, top - 5)
  c.rect(cx - 4, cloudY, 9, 2, 0x6b7280)
  c.rect(cx - 2, cloudY - 1, 5, 1, 0x6b7280)
  for (let i = 0; i < 4; i++) {
    const drop = (t * 6 + i * 0.37) % 1
    c.set(cx - 3 + i * 2, cloudY + 2 + drop * 3, 0x60a5fa)
  }
}

// Un commit réussi : un petit graphe git où un nouveau nœud vert apparaît, et un saut de joie.
const commit = (c: Canvas, t: number, theme: Theme) => {
  const x = leftX(c)
  const air = hop((t * 1.4) % 1)
  theme.dress(c, { x, y: BASE_Y - Math.round(air * 2), arms: [-40, 80], eyes: 'happy', look: 2 }, t)
  const gx = x + 22
  const gy = GROUND - 6
  c.line(gx, gy, gx + 12, gy, INK)
  for (let i = 0; i < 3; i++) c.disc(gx + i * 4, gy, 1.3, INK)
  // Le nouveau nœud gonfle, avec un éclat autour, toutes les 2,5 s.
  const k = (t % 2.5) / 2.5
  c.disc(gx + 12, gy, 0.6 + Math.min(1, k * 4) * 1.1, 0x4ade80)
  if (k < 0.5) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      c.dot(gx + 12 + Math.cos(a) * (2 + k * 6), gy + Math.sin(a) * (2 + k * 6) * 0.7, mix(0xbbf7d0, 0x14532d, k * 2))
    }
  }
}

// Des confettis, des sauts de joie et des étincelles.
const party = (c: Canvas, t: number, theme: Theme) => {
  falling(c, t, { count: 30, speed: 7, color: CONFETTI[0]!, sway: 1, colors: CONFETTI })
  const x = centerX(c)
  const air = hop((t * 1.6) % 1)
  const pose: Pose = { x, y: BASE_Y - Math.round(air * 3), arms: [80, 80], legs: air > 0.2 ? [1, 1, 1, 1] : [0, 0, 0, 0], squash: air < 0.1 ? 1 : 0, eyes: 'happy' }
  theme.dress(c, pose, t)
  const left = hand(pose, -1)
  const right = hand(pose, 1)
  sparkles(c, t, left.x, left.y - 1, 3, 0xfde047, 3)
  sparkles(c, t + 0.5, right.x, right.y - 1, 3, 0xfde047, 3)
}

const DRAWS: Readonly<Record<Activity, (c: Canvas, t: number, theme: Theme) => void>> = {
  lire: read,
  ecrire: write,
  commande: command,
  web,
  agent: agents,
  echec: oops,
  commit,
  fete: party,
  triste: oops,
}

// L'activité jouée dans le costume et le décor du thème, nommée dans la langue demandée.
export const activityAnim = (activity: Activity, theme: Theme, lang: Lang = 'fr'): Anim => ({
  id: `activite-${activity}`,
  name: t(lang, activity),
  draw: (c, t) => {
    backdrop(c, t, theme)
    if (activity === 'fete' && theme.cheer) theme.cheer(c, t)
    else DRAWS[activity](c, t, theme)
  },
})

export const ACTIVITIES = Object.keys(DRAWS) as Activity[]
