import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

// Midi, le 4 octobre 2026 (heure locale), et le thème qu'une autre session a déjà choisi.
const NOON = new Date(2026, 9, 4, 12).getTime()
const OTHER_SESSION = { date: '2026-10-04', theme: 'halloween', phrase: 'Choisi par une autre session', isChosenByClaude: true }

const emptyBand = (on: On) =>
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })

// Un stockage partagé que le test modifie lui-même, comme le ferait une autre session.
const sharedStore = (on: On, entries: Record<string, unknown>) => {
  on('store.get', (_$, e) => ({ value: entries[e.key] }))
  on('store.set', (_$, e) => {
    entries[e.key] = e.value
    return { value: undefined }
  })
  on('store.delete', (_$, e) => {
    delete entries[e.key]
    return { value: undefined }
  })
  return entries
}

test('une session reprend le thème du jour choisi par une autre', async ($, on) => {
  emptyBand(on)
  mock.clock(on, { now: NOON })
  mock.store(on, { daily: OTHER_SESSION })
  const answer = await $.command.run({ command: 'mascotte', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } })

  expect(answer.text).toContain('Halloween')
})

test('un thème imposé dans une autre session est repris à la synchronisation suivante', async ($, on) => {
  emptyBand(on)
  const clock = mock.clock(on, { now: NOON })
  const store = sharedStore(on, { daily: OTHER_SESSION })
  // Ce que le moteur fait sous le plugin pendant le démarrage et l'animation.
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('ui.blit', () => ({ value: {} }))
  on('ui.log', () => ({ value: undefined }))
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })

  const band = await $.ui.mount({
    plugin: 'mascotte-du-jour',
    surface: 'terminal',
    component: 'AbovePrompt',
    requestId: 'band',
    props: { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 120, scroll: { offset: 0, bodyRows: 19 }, view: {} },
  })
  await clock.advance(1_000)
  expect(await band.find({ text: /Halloween/ })).toBeDefined()

  // Une autre session impose le thème pirate : la bande suit sans aucune commande ici.
  store.daily = { ...OTHER_SESSION, theme: 'pirate' }
  await clock.advance(31_000)
  expect(await band.find({ text: /Pirate/ })).toBeDefined()
})

test('à la reprise, la bande montre le thème enregistré, jamais celui par défaut', async ($, on) => {
  emptyBand(on)
  mock.clock(on, { now: NOON })
  mock.store(on, { daily: OTHER_SESSION })
  // Aucune synchronisation n'a encore eu lieu : la bande lit le thème enregistré.
  const band = await $.ui.mount({
    plugin: 'mascotte-du-jour',
    surface: 'terminal',
    component: 'AbovePrompt',
    requestId: 'band',
    props: { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 120, scroll: { offset: 0, bodyRows: 19 }, view: {} },
  })

  expect(await band.find({ text: /Halloween/ })).toBeDefined()
  expect(await band.find({ text: /Danse/ })).toBeUndefined()
})
