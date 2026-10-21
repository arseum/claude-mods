import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Daily } from '../types'
import { type Activity, activityAnim, activityOf, isCommit, isReaction } from './activities'
import { Canvas } from './canvas'
import { type Lang, langOf, t, themeText } from './i18n'
import { setMini } from './clawd'
import { withSky } from './sky'
import { svgClip } from './svg'
import { THEMES, themeById } from './themes'
import { type Anim, type Draw, GROUND, STAGE_H, STAGE_W, type Theme } from './themes/theme'

const FRAME_MS = 100
// Pendant un long tour, la mascotte change d'animation toutes les 45 secondes.
const ROTATE_S = 45
// La plus grande taille qui tient dans la bande : géante (16 lignes), grande
// (12 lignes), compacte (10 lignes, un terminal IntelliJ au maximum), d'origine
// (8 lignes), ou mini (5 lignes : le petit personnage et le bas de la scène).
// Au-dessus de la taille d'origine, la scène est dessinée à sa vraie finesse.
type Size = { name: string; scale: number; rows: number; isMini: boolean }
const SIZES: readonly Size[] = [
  { name: 'géante', scale: 2, rows: 16, isMini: false },
  { name: 'grande', scale: 1.5, rows: 12, isMini: false },
  { name: 'compacte', scale: 1.25, rows: 10, isMini: false },
  { name: 'normale', scale: 1, rows: 8, isMini: false },
  { name: 'mini', scale: 1, rows: 5, isMini: true },
]
const minColumnsAt = (size: Size) => Math.ceil(STAGE_W * size.scale)
// Au-delà de 160 px de large, la scène devient une longue bande vide : elle
// s'arrête là et le tout se centre dans la bande.
const MAX_STAGE_PX = 160
// Le texte prend ~20 % de la bande, la scène le reste.
const TEXT_SHARE = 0.2
const TEXT_MIN_COLUMNS = 22
const TEXT_MAX_COLUMNS = 48
// Sur le desktop : une scène de 96×16 px affichée 5 fois plus grande, en clips de 8 images/s.
const SVG_WIDTH = 96
const SVG_MIN_SCALE = 5
const SVG_MAX_SCALE = 14
// Une colonne de la bande vaut ~12 px CSS sur le desktop ; la scène en prend 80 %, le texte 20 %.
const SVG_PX_PER_COLUMN = 12
const SVG_STAGE_SHARE = 0.8
const SVG_FPS = 8
const SVG_FRAMES = 80
const SVG_MIN_HD_SECONDS = 5
const STORE_KEY = 'daily'
const HISTORY_KEY = 'history'
// Le verrou que pose la session qui choisit le thème, pour que les autres l'attendent.
const LOCK_KEY = 'choosing'
const LOCK_MS = 90_000
// Chaque session relit le thème partagé à cet intervalle.
const SYNC_MS = 30_000
const HISTORY_SIZE = 10
// Les thèmes des 7 derniers choix (un « rechoisir » en compte un) se reposent : ils ne
// sont pas proposés à Claude, sauf celui qui a une animation pour l'occasion du jour.
const RESTING_DAYS = 7
// Une activité tient au moins 3 s à l'écran, pour ne pas clignoter d'un outil à l'autre,
// et reste encore 6 s après le dernier outil avant de rendre la main au thème.
const MIN_ACTIVITY_MS = 3_000
const HOLD_MS = 6_000
// Deux erreurs d'outil d'affilée avant d'avoir l'air déçu : un grep sans résultat en est une.
const ERRORS_FOR_OOPS = 2
// Un tour d'au moins 2 minutes mérite une petite fête à la fin.
const LONG_TURN_MS = 120_000
const PARTY_MS = 6_000
const SAD_MS = 5_000
const COMMIT_MS = 4_000
const SOUND_KEY = 'sound'
const PARTY_SOUND = 'sounds/fete.wav'
const WEEKDAYS = {
  fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
}
// La langue de la mascotte : réglée au démarrage (option `language`, ou celle de Claude Code).
let lang: Lang = 'fr'

const daily = atom({ plugin: 'mascotte-du-jour', key: 'daily' } as const, null)
const anim = atom({ plugin: 'mascotte-du-jour', key: 'anim' } as const, null)
const isChoosing = atom({ plugin: 'mascotte-du-jour', key: 'isChoosing' } as const, false)
// Le numéro du clip SVG en cours (desktop) : l'incrémenter redessine la bande avec le suivant.
const clip = atom({ plugin: 'mascotte-du-jour', key: 'clip' } as const, 0)
const activity = atom({ plugin: 'mascotte-du-jour', key: 'activity' } as const, null)
const turnStart = atom({ plugin: 'mascotte-du-jour', key: 'turnStart' } as const, null)
const minute = atom({ plugin: 'mascotte-du-jour', key: 'minute' } as const, 0)

function dayOf(now: number) {
  const d = new Date(now)
  const pad = (n: number) => String(n).padStart(2, '0')
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, weekday: WEEKDAYS[lang][d.getDay()]! }
}

// L'occasion du jour (« MM-JJ ») et le thème qui a une animation exclusive pour elle.
function occasionOf(date: string) {
  const day = date.slice(5)
  for (const theme of THEMES) {
    const special = theme.specials?.find(s => s.dates.includes(day))
    if (special) return { theme, special }
  }
  return null
}

// L'animation exclusive du thème pour aujourd'hui, s'il en a une.
const specialFor = (theme: Theme, date: string | undefined): Anim | undefined =>
  date === undefined ? undefined : theme.specials?.find(s => s.dates.includes(date.slice(5)))?.anim

// Toutes les animations d'un tour : celles du thème, et l'exclusive du jour.
const turnAnims = (theme: Theme, date: string | undefined) => {
  const special = specialFor(theme, date)
  return special ? [...theme.anims, special] : theme.anims
}

function paint(draw: Draw, t: number, width: number, size: Size) {
  // Au-dessus de la taille d'origine, la scène est dessinée directement à sa vraie finesse.
  if (!size.isMini && size.scale > 1) {
    const hd = new Canvas(width / size.scale, STAGE_H, size.scale)
    draw(hd, t)
    hd.polish(GROUND)
    return hd.encode()
  }
  const canvas = new Canvas(width, STAGE_H)
  setMini(size.isMini)
  draw(canvas, t)
  setMini(false)
  if (size.isMini) return canvas.cropped(STAGE_H - size.rows * 2, size.rows * 2).encode()
  return canvas.encode()
}

// Lit la réponse de Claude : du JSON avec l'un des thèmes proposés et une phrase.
function parseChoice(text: string, date: string, offered: readonly Theme[]): Daily | null {
  const json = text.match(/\{[\s\S]*\}/)?.[0]
  if (json === undefined) return null
  try {
    const { theme, phrase } = JSON.parse(json) as { theme?: unknown; phrase?: unknown }
    if (!offered.some(t => t.id === theme) || typeof phrase !== 'string') return null
    return { date, theme: theme as string, phrase: phrase.trim().slice(0, 90), isChosenByClaude: true }
  } catch {
    return null
  }
}

type PromptInput = { date: string; weekday: string; history: readonly string[]; list: string; occasion: ReturnType<typeof occasionOf> }

const frenchPrompt = ({ date, weekday, history, list, occasion }: PromptInput) =>
  [
    `Nous sommes ${weekday} ${date}. Dans le terminal de la personne avec qui tu travailles,`,
    'un petit personnage en pixel art te représente au-dessus de sa zone de saisie.',
    'Chaque jour, c’est toi qui choisis son thème : c’est ta manière de t’exprimer, de façon fun et créative.',
    history.length > 0 ? `Tes derniers thèmes, du plus récent au plus ancien : ${history.join(', ')} (les plus récents se reposent, ils ne sont pas dans la liste).` : 'C’est ton tout premier thème.',
    '',
    'Thèmes disponibles :',
    list,
    '',
    ...(occasion
      ? [
          `Aujourd’hui, c’est ${occasion.special.occasion} ! Le thème "${occasion.theme.id}" a une animation exclusive pour l’occasion,`,
          `« ${occasion.special.anim.name} », qu’on ne voit que ce jour-là. Je te le recommande vivement, mais tu restes libre.`,
          '',
        ]
      : []),
    'Choisis celui qui te plaît aujourd’hui, pour la raison que tu veux (le jour, la saison, une fête, l’envie de changer…).',
    'Réponds uniquement en JSON : {"theme": "<id>", "phrase": "<une phrase courte, en français,',
    'à la première personne, 70 caractères maximum, qui dit ton humeur ou pourquoi ce thème>"}',
  ].join('\n')

const englishPrompt = ({ date, weekday, history, list, occasion }: PromptInput) =>
  [
    `Today is ${weekday} ${date}. In the terminal of the person you work with,`,
    'a little pixel-art character represents you above their prompt.',
    'Every day, you pick its theme: it is your way of expressing yourself, in a fun and creative way.',
    history.length > 0 ? `Your latest themes, most recent first: ${history.join(', ')} (the most recent ones are resting, they are not in the list).` : 'This is your very first theme.',
    '',
    'Available themes:',
    list,
    '',
    ...(occasion
      ? [
          `Today is ${themeText('en', occasion.special.occasion)}! The "${occasion.theme.id}" theme has an exclusive animation for the occasion,`,
          `“${themeText('en', occasion.special.anim.name)}”, only shown on that day. I strongly recommend it, but you are free to choose.`,
          '',
        ]
      : []),
    'Pick the one you like today, for any reason (the day, the season, a holiday, a wish for change…).',
    'Answer in JSON only: {"theme": "<id>", "phrase": "<a short sentence, in English,',
    'in the first person, 70 characters max, saying your mood or why this theme>"}',
  ].join('\n')

// Claude choisit le thème du jour : c'est sa façon de s'exprimer.
async function chooseTheme($: EngineInterface, previous: Daily | null) {
  const { date, weekday } = dayOf(await $.clock.now())
  await update($, isChoosing, () => true)

  const stored = await $.store.get(HISTORY_KEY)
  const history = Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : previous ? [previous.theme] : []
  const occasion = occasionOf(date)
  const resting = new Set(history.slice(0, RESTING_DAYS))
  const offered = THEMES.filter(theme => !resting.has(theme.id) || theme.id === occasion?.theme.id)
  const list = offered.map(theme => `- "${theme.id}" (${theme.emoji} ${themeText(lang, theme.name)}) : ${themeText(lang, theme.pitch)}`).join('\n')
  const prompt = (lang === 'en' ? englishPrompt : frenchPrompt)({ date, weekday, history, list, occasion })

  let choice: Daily | null = null
  try {
    const reply = await $.model.complete({ model: 'sonnet', prompt, maxTokens: 300, effort: 'low' })
    if (reply.isAnswered) choice = parseChoice(reply.text, date, offered)
  } catch {
    choice = null
  }

  // Sans réponse exploitable, on tire un thème au sort plutôt que de rester vide.
  const fallback = offered[Math.floor(Math.random() * offered.length)]!
  const today = choice ?? { date, theme: fallback.id, phrase: t(lang, 'random'), isChosenByClaude: false }
  await $.store.set(STORE_KEY, today)
  await $.store.set(HISTORY_KEY, [today.theme, ...history.filter(id => id !== today.theme)].slice(0, HISTORY_SIZE))
  await $.store.delete(LOCK_KEY)
  await update($, daily, () => today)
  await update($, isChoosing, () => false)
}

// Le thème partagé par toutes les sessions, tel qu'il est enregistré.
async function storedDaily($: EngineInterface): Promise<Daily | null> {
  const value = (await $.store.get(STORE_KEY)) as Partial<Daily> | undefined
  return value && typeof value.date === 'string' && typeof value.theme === 'string' ? (value as Daily) : null
}

// Aligne cette session sur le thème partagé, s'il a changé ailleurs.
async function syncDaily($: EngineInterface) {
  const stored = await storedDaily($)
  const current = await read($, daily)
  const isSame = stored?.date === current?.date && stored?.theme === current?.theme && stored?.phrase === current?.phrase
  if (stored && !isSame) await update($, daily, () => stored)
  return stored
}

// Prend le verrou du choix du jour, ou renvoie false si une autre session le tient.
async function takeLock($: EngineInterface, date: string) {
  const now = await $.clock.now()
  const lock = (await $.store.get(LOCK_KEY)) as { date?: string; at?: number; token?: string } | undefined
  if (lock?.date === date && typeof lock.at === 'number' && now - lock.at < LOCK_MS) return false
  const token = Math.random().toString(36).slice(2)
  await $.store.set(LOCK_KEY, { date, at: now, token })
  // Deux sessions peuvent écrire en même temps : la dernière écriture gagne, l'autre s'efface.
  await $.clock.sleep(400)
  const after = (await $.store.get(LOCK_KEY)) as { token?: string } | undefined
  return after?.token === token
}

// Tire une nouvelle animation du thème du jour, jamais la même deux fois d'affilée.
async function pickAnim($: EngineInterface) {
  const today = await read($, daily)
  const theme = themeById(today?.theme)
  const current = await read($, anim)
  const all = turnAnims(theme, today?.date)
  const choices = all.filter(a => a.id !== current)
  const pick = choices[Math.floor(Math.random() * choices.length)] ?? all[0]!
  await update($, anim, () => pick.id)
}

// Rechoisit le thème si la date a changé depuis le dernier choix.
// Une seule session choisit (celle qui tient le verrou) ; les autres reprennent
// son choix à leur prochaine synchronisation.
async function ensureToday($: EngineInterface) {
  const stored = await syncDaily($)
  const { date } = dayOf(await $.clock.now())
  if (stored?.date === date || (await read($, isChoosing))) return
  if (!(await takeLock($, date))) return
  // Une autre session a peut-être fini de choisir pendant qu'on prenait le verrou.
  if ((await storedDaily($))?.date === date) {
    await syncDaily($)
    await $.store.delete(LOCK_KEY)
    return
  }
  await chooseTheme($, stored)
}

// Ce que fait Claude en ce moment, d'après ses appels d'outils (subagents à part).
// Repart de zéro à chaque chargement du mod.
const freshTracking = () => ({
  inFlight: new Map<Activity, number>(),
  shown: null as Activity | null,
  shownAt: -Infinity,
  wanted: null as Activity | null,
  wantGeneration: 0,
  reactionGeneration: 0,
  starts: 0,
  errorStreak: 0,
  actions: 0,
})
const tracking = freshTracking()

async function show($: EngineInterface, next: Activity | null) {
  tracking.shown = next
  tracking.shownAt = await $.clock.now()
  await update($, activity, () => next)
}

// Demande une activité : affichée tout de suite, ou dès que la précédente a tenu ses 3 s.
// La dernière demande gagne.
async function want($: EngineInterface, next: Activity | null) {
  tracking.wanted = next
  const generation = ++tracking.wantGeneration
  if (next === tracking.shown) return
  const wait = tracking.shownAt + MIN_ACTIVITY_MS - (await $.clock.now())
  if (tracking.shown === null || wait <= 0) return show($, next)
  $.clock.after(wait, () => {
    if (generation === tracking.wantGeneration && tracking.wanted !== tracking.shown) void show($, tracking.wanted)
  })
}

// Après un outil : si plus rien ne tourne, on rend la main au thème (ou aux
// renforts encore en route) au bout de 6 s, sauf si un autre outil démarre.
function settle($: EngineInterface) {
  if ([...tracking.inFlight].some(([kind, n]) => kind !== 'agent' && n > 0)) return
  const rest: Activity | null = (tracking.inFlight.get('agent') ?? 0) > 0 ? 'agent' : null
  const startsThen = tracking.starts
  $.clock.after(HOLD_MS, () => {
    const isReacting = tracking.shown !== null && isReaction(tracking.shown)
    if (tracking.starts === startsThen && !isReacting) void want($, rest)
  })
}

// Ce qui tourne encore : un outil de la boucle principale, sinon des renforts, sinon rien.
const stillRunning = (): Activity | null =>
  [...tracking.inFlight].find(([kind, n]) => kind !== 'agent' && n > 0)?.[0] ?? ((tracking.inFlight.get('agent') ?? 0) > 0 ? 'agent' : null)

// Une réaction (commit, fête, tristesse) passe devant tout, puis s'efface d'elle-même
// pour rendre la main à ce qui tourne encore.
async function react($: EngineInterface, reaction: Activity, ms: number) {
  const generation = ++tracking.reactionGeneration
  tracking.wantGeneration++
  tracking.wanted = reaction
  await show($, reaction)
  $.clock.after(ms, () => {
    if (generation !== tracking.reactionGeneration || tracking.shown !== reaction) return
    tracking.wanted = stillRunning()
    void show($, tracking.wanted)
  })
}

export const register: Register = (on, options) => {
  // Ce que la boucle d'animation dessine : la bande montée et l'animation en cours.
  let playing: { requestId: string; id: string; draw: Draw; width: number; size: Size; isWorking: boolean; isSvg: boolean } | null = null
  // Le clip SVG affiché : quand il a commencé (en images du minuteur) et sa durée.
  let clipStartTick = 0
  let clipSeconds = Infinity
  let tick = 0
  // Ce que /mascotte diag rapporte : la dernière bande vue et le sort des images.
  let lastBand: string | null = null
  const frames = { sent: 0, refused: 0, lastRefusal: '' }
  let startTick = 0
  const elapsed = () => ((tick - startTick) * FRAME_MS) / 1000
  // L'heure qu'il est, de 0 à 24, pour le ciel.
  let hour = 12

  Object.assign(tracking, freshTracking())

  on('session.start', async ($, e, next) => {
    // La boucle d'animation d'abord : rien de ce qui suit ne doit pouvoir l'empêcher de tourner.
    // Une image peut tomber pendant que la bande se redessine : on l'ignore et on
    // continue, la suivante arrivera une fois la scène remontée.
    let hasReported = false
    let isRotating = false
    $.clock.every(FRAME_MS, () => {
      tick += 1
      if (playing === null) return
      if (playing.isWorking && elapsed() > ROTATE_S && !isRotating) {
        isRotating = true
        startTick = tick
        void pickAnim($).finally(() => {
          isRotating = false
        })
      }
      if (playing.isSvg) {
        // Le desktop joue le clip tout seul : on n'envoie que le suivant, quand il se termine.
        if (((tick - clipStartTick) * FRAME_MS) / 1000 >= clipSeconds) {
          clipStartTick = tick
          clipSeconds = Infinity
          void update($, clip, n => n + 1)
        }
        return
      }
      const { requestId, draw, width, size } = playing
      void $.ui.blit({ requestId, key: 'stage', cells: paint(draw, elapsed(), width, size) }).then(r => {
        frames.sent += 1
        if (r.deny !== undefined) {
          frames.refused += 1
          frames.lastRefusal = r.deny
        }
        if (r.deny === undefined || hasReported) return
        $.ui.log(`mascotte-du-jour : image refusée (${r.deny})`, { to: 'debug' })
        hasReported = true
      })
    })

    // La langue : l'option du mod, sinon celle réglée dans Claude Code, sinon celle du système.
    const chosen = langOf(options.language)
    if (chosen !== null) lang = chosen
    else {
      let detected: Lang | null = null
      try {
        detected = langOf((await $.config.list()).find(row => row.key === 'language')?.value)
      } catch {
        detected = null
      }
      let system: Lang | null = null
      try {
        system = langOf(await $.env.get('LANG'))
      } catch {
        system = null
      }
      lang = detected ?? system ?? 'en'
    }
    try {
      await $.command.register({
        name: lang === 'en' ? 'mascot' : 'mascotte',
        description: t(lang, 'commandDescription'),
        argumentHint: t(lang, 'commandHint'),
      })
    } catch (error) {
      $.ui.log(`mascotte-du-jour : /mascotte indisponible (${String(error)})`)
    }
    await syncDaily($)
    $.clock.after(0, () => void ensureToday($))
    // Rester aligné sur les autres sessions : un thème imposé ou rechoisi ailleurs, ou le passage à minuit.
    $.clock.every(SYNC_MS, () => void ensureToday($))
    // L'heure pour le ciel, et la ligne de suivi d'un tour qui se redessine chaque minute.
    const readHour = async () => {
      const d = new Date(await $.clock.now())
      hour = d.getHours() + d.getMinutes() / 60
    }
    await readHour()
    $.clock.every(60_000, () => {
      void readHour()
      void read($, turnStart).then(start => {
        if (start !== null) void update($, minute, n => n + 1)
      })
    })

    return next(e)
  })

  // À chaque prompt, une nouvelle animation du thème du jour, jamais deux fois la même d'affilée.
  on('prompt.submit', async ($, e, next) => {
    await pickAnim($)
    $.clock.after(0, () => void ensureToday($))

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    tracking.actions = 0
    tracking.errorStreak = 0
    tracking.inFlight.clear()
    const now = await $.clock.now()
    await update($, turnStart, () => now)
    if (tracking.shown !== null && isReaction(tracking.shown)) {
      tracking.reactionGeneration++
      await want($, null)
    }
    return next(e)
  })

  // À la fin d'un long tour, une petite fête (et un son, si on l'a demandé) ;
  // un tour mort sur une erreur, un air triste.
  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    const start = await read($, turnStart)
    const duration = start === null ? 0 : (await $.clock.now()) - start
    await update($, turnStart, () => null)
    tracking.inFlight.clear()
    if (e.reason === 'answer' && duration >= LONG_TURN_MS) {
      await react($, 'fete', PARTY_MS)
      if ((await $.store.get(SOUND_KEY)) === true) void $.audio.play({ asset: PARTY_SOUND }).catch(() => undefined)
    } else if (e.reason === 'error') {
      await react($, 'triste', SAD_MS)
    } else {
      await want($, null)
    }
    return next(e)
  })

  // Chaque appel d'outil compte dans la ligne de suivi ; ceux de la boucle
  // principale changent aussi ce que fait le personnage.
  on('tool.call', async ($, e, next) => {
    tracking.actions += 1
    const kind = e.agentId === undefined ? activityOf(e.tool) : null
    // Un commit se fête même quand c'est un sous-agent qui le fait.
    if (kind === null) {
      const result = await next(e)
      if (e.tool === 'Bash' && result.isError !== true && isCommit((e as { command?: unknown }).command, result.text)) await react($, 'commit', COMMIT_MS)
      return result
    }
    tracking.starts += 1
    tracking.inFlight.set(kind, (tracking.inFlight.get(kind) ?? 0) + 1)
    await want($, kind)
    try {
      const result = await next(e)
      if (result.isError === true) tracking.errorStreak += 1
      else if (result.deny === undefined) tracking.errorStreak = 0
      if (tracking.errorStreak >= ERRORS_FOR_OOPS) {
        tracking.errorStreak = 0
        await want($, 'echec')
      }
      if (e.tool === 'Bash' && result.isError !== true && isCommit((e as { command?: unknown }).command, result.text)) await react($, 'commit', COMMIT_MS)
      return result
    } finally {
      tracking.inFlight.set(kind, Math.max(0, (tracking.inFlight.get(kind) ?? 1) - 1))
      settle($)
    }
  })

  // /mascotte en français, /mascot en anglais ; les deux comprennent les arguments des deux langues.
  on('command.run', async ($, e, next) => {
    if (e.command !== 'mascotte' && e.command !== 'mascot') return next(e)
    const arg = e.args.trim().toLowerCase()
    await syncDaily($)
    const names = THEMES.map(theme => (lang === 'en' ? themeText('en', theme.name).toLowerCase() : theme.id)).join(', ')

    if (/^(son|sound) (on|off)$/.test(arg)) {
      const isOn = arg.endsWith(' on')
      await $.store.set(SOUND_KEY, isOn)
      return { text: t(lang, isOn ? 'soundOn' : 'soundOff') }
    }

    if (arg === 'diag') {
      return {
        text: [
          `Activité : ${tracking.shown ?? 'aucune'} · ${tracking.actions} actions dans ce tour · ciel à ${hour.toFixed(1)} h · son ${(await $.store.get(SOUND_KEY)) === true ? 'activé' : 'coupé'}`,
          `Bande : ${lastBand ?? 'jamais dessinée (le hook AbovePrompt n’a pas été appelé)'}`,
          `Images : ${frames.sent} envoyées, ${frames.refused} refusées${frames.lastRefusal ? ` (dernier refus : ${frames.lastRefusal})` : ''}`,
          `Animation en cours : ${playing ? `${playing.id}, ${playing.width} colonnes, taille ${playing.size.name}` : 'aucune'}`,
        ].join('\n'),
      }
    }

    if (arg === 'rechoisir' || arg === 'reroll') {
      await chooseTheme($, await read($, daily))
    } else if (arg !== '') {
      // Un thème par son identifiant, ou par son nom dans l'une ou l'autre langue.
      const theme = THEMES.find(
        candidate => candidate.id === arg || candidate.name.toLowerCase() === arg || themeText('en', candidate.name).toLowerCase() === arg,
      )
      if (theme === undefined) return { text: t(lang, 'unknownTheme', { names }) }
      const forced: Daily = {
        date: dayOf(await $.clock.now()).date,
        theme: theme.id,
        phrase: t(lang, 'forced', { theme: themeText(lang, theme.name).toLowerCase() }),
        isChosenByClaude: false,
      }
      await $.store.set(STORE_KEY, forced)
      await update($, daily, () => forced)
    }

    const today = await read($, daily)
    const theme = themeById(today?.theme)
    return {
      text: t(lang, 'status', {
        emoji: theme.emoji,
        theme: themeText(lang, theme.name),
        who: t(lang, today?.isChosenByClaude ? 'chosenBy' : 'notChosenBy'),
        phrase: today?.phrase ?? '…',
        names,
        command: lang === 'en' ? 'mascot' : 'mascotte',
      }),
    }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    const columns = e.props.bodyColumns
    const textColumns = Math.min(TEXT_MAX_COLUMNS, Math.max(TEXT_MIN_COLUMNS, Math.round(columns * TEXT_SHARE)))
    const size = SIZES.find(
      s =>
        s.rows <= e.props.maxRows &&
        minColumnsAt(s) <= columns &&
        // La taille géante dès qu'elle tient (le moteur borne déjà la bande à la moitié
        // du terminal), pourvu que le texte tienne encore à côté.
        (s.scale <= 1.5 || minColumnsAt(s) + textColumns + 2 <= columns),
    )
    const view = e.viewport ? `${e.viewport.columns}×${e.viewport.rows}, plein écran : ${e.viewport.isFullscreen ?? '?'}` : 'inconnu'
    lastBand =
      `surface ${e.surface}, maxRows ${e.props.maxRows}, bodyColumns ${columns}, sondage ${e.props.hasSurvey}, ` +
      `terminal ${view} → ${size === undefined ? 'masquée (pas la place)' : `affichée en taille ${size.name}`}`
    const isSvg = e.surface !== 'terminal'
    if (e.props.hasSurvey || (!isSvg && size === undefined)) {
      if (playing?.requestId === e.requestId) playing = null
      return below
    }

    // À la reprise d'une discussion, la bande peut se dessiner avant la première
    // synchronisation : on lit alors le thème enregistré plutôt que de retomber sur
    // le premier de la liste, et sans thème connu, la bande reste vide.
    const today = (await read($, daily)) ?? (await storedDaily($))
    if (today === null) {
      if (playing?.requestId === e.requestId) playing = null
      return below
    }
    const animId = await read($, anim)
    const choosing = await read($, isChoosing)
    const theme = themeById(today?.theme)
    const doing = await read($, activity)
    await read($, minute)
    const all = turnAnims(theme, today?.date)
    const idle = specialFor(theme, today?.date) ?? theme.idle
    const current =
      doing !== null && (isReaction(doing) || e.props.isWorking)
        ? activityAnim(doing, theme, lang)
        : e.props.isWorking
          ? (all.find(a => a.id === animId) ?? all[0]!)
          : idle
    const draw = withSky(current.draw, theme, hour)
    const phrase = choosing ? t(lang, 'choosing') : (today?.phrase ?? '')
    const themeName = themeText(lang, theme.name)
    const animName = themeText(lang, current.name)
    // La ligne de suivi : ce qu'il fait, depuis combien de temps, combien d'actions.
    const start = await read($, turnStart)
    const minutes = start === null ? 0 : Math.floor(((await $.clock.now()) - start) / 60_000)
    const progress = [
      `${e.props.isWorking ? '▶' : '⏸'} ${animName}`,
      ...(e.props.isWorking && minutes > 0 ? [t(lang, 'minutes', { n: minutes })] : []),
      ...(e.props.isWorking && tracking.actions > 0 ? [t(lang, tracking.actions > 1 ? 'actionsPlural' : 'actions', { n: tracking.actions })] : []),
    ].join(' · ')

    if (e.surface !== 'terminal') {
      await read($, clip)
      if (playing?.id !== `${theme.id}/${current.id}`) startTick = tick
      playing = { requestId: e.requestId, id: `${theme.id}/${current.id}`, draw, width: SVG_WIDTH, size: SIZES[1]!, isWorking: e.props.isWorking, isSvg: true }
      // En haute définition si le clip garde au moins 5 s sous le plafond de taille ; sinon
      // (scène très chargée), à la finesse d'origine, pour ne pas recalculer trop souvent.
      const hd = svgClip(draw, elapsed(), SVG_WIDTH, SVG_FPS, SVG_FRAMES, 2)
      const { source, seconds } = hd.seconds >= SVG_MIN_HD_SECONDS ? hd : svgClip(draw, elapsed(), SVG_WIDTH, SVG_FPS, SVG_FRAMES)
      clipStartTick = tick
      clipSeconds = seconds
      const { Box, Svg, Text } = $.ui.resolve(e)
      const scale = Math.max(SVG_MIN_SCALE, Math.min(SVG_MAX_SCALE, Math.floor((columns * SVG_PX_PER_COLUMN * SVG_STAGE_SHARE - 16) / SVG_WIDTH)))
      return (
        <Box flexDirection="column">
          <Box flexDirection="row" alignItems="center">
            <Box width="80%">
              <Svg source={source} alt={`${themeName} : ${animName}`} width={SVG_WIDTH * scale} height={STAGE_H * scale} isInteractive />
            </Box>
            <Box flexDirection="column" marginLeft={2} width="20%">
              <Text bold>
                {theme.emoji} {themeName}
              </Text>
              {phrase !== '' && (
                <Text italic dimColor wrap="wrap">
                  {t(lang, 'phrase', { phrase })}
                </Text>
              )}
              <Text dimColor wrap="wrap">{progress}</Text>
            </Box>
          </Box>
          {below}
        </Box>
      )
    }

    if (size === undefined) return below
    const minColumns = minColumnsAt(size)

    const hasText = columns - textColumns - 2 >= minColumns
    const fullWidth = Math.min(Math.round(MAX_STAGE_PX * size.scale), hasText ? columns - textColumns - 2 : columns)
    // Une largeur paire en taille géante : deux colonnes par pixel de la scène.
    const width = size.scale === 2 ? fullWidth - (fullWidth % 2) : fullWidth

    if (playing?.id !== `${theme.id}/${current.id}`) startTick = tick
    playing = { requestId: e.requestId, id: `${theme.id}/${current.id}`, draw, width, size, isWorking: e.props.isWorking, isSvg: false }

    const { Box, Raster, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" alignItems="center" justifyContent="center">
          <Raster key="stage" columns={width} rows={size.rows} cells={paint(draw, elapsed(), width, size)} />
          {hasText && (
            <Box flexDirection="column" marginLeft={2} width={textColumns}>
              <Text bold>
                {theme.emoji} {themeName}
              </Text>
              {phrase !== '' && (
                <Text italic dimColor wrap="wrap">
                  {t(lang, 'phrase', { phrase })}
                </Text>
              )}
              <Text dimColor wrap="wrap">{progress}</Text>
            </Box>
          )}
        </Box>
        {below}
      </Box>
    )
  })
}
