import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const NOON = new Date(2026, 9, 4, 12).getTime()
const TODAY = { date: '2026-10-04', theme: 'pirate', phrase: 'À l’abordage !', isChosenByClaude: true }

const emptyBand = (on: On) =>
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })

const band = (isWorking: boolean) =>
  ({
    plugin: 'mascotte-du-jour',
    surface: 'terminal',
    component: 'AbovePrompt',
    requestId: 'band',
    props: { hasSurvey: false, isWorking, maxRows: 20, bodyColumns: 120, scroll: { offset: 0, bodyRows: 19 }, view: {} },
  }) as const

// Le moteur sous le plugin : chaque outil répond tout de suite, en erreur si demandé.
const tools = (on: On, isError = false) =>
  on('tool.call', () => ({ result: { stdout: '', stderr: '', interrupted: false }, isError }) as never)

test('pendant une commande, la mascotte lance une commande, puis revient au thème', async ($, on) => {
  emptyBand(on)
  const clock = mock.clock(on, { now: NOON })
  mock.store(on, { daily: TODAY })
  tools(on)
  const drawing = await $.ui.mount(band(true))

  await $.tool.call({ tool: 'Bash', command: 'ls' })
  expect(await drawing.find({ text: /lance une commande · 1 action/ })).toBeDefined()

  await clock.advance(7_000)
  expect(await drawing.find({ text: /lance une commande/ })).toBeUndefined()
})

test('une activité tient au moins 3 secondes avant la suivante', async ($, on) => {
  emptyBand(on)
  const clock = mock.clock(on, { now: NOON })
  mock.store(on, { daily: TODAY })
  tools(on)
  const drawing = await $.ui.mount(band(true))

  await $.tool.call({ tool: 'Bash', command: 'ls' })
  await $.tool.call({ tool: 'Read', file_path: '/tmp/a' })
  expect(await drawing.find({ text: /lance une commande/ })).toBeDefined()

  await clock.advance(3_100)
  expect(await drawing.find({ text: /lit le code/ })).toBeDefined()
})

test('deux erreurs d’affilée et elle a l’air déçue', async ($, on) => {
  emptyBand(on)
  const clock = mock.clock(on, { now: NOON })
  mock.store(on, { daily: TODAY })
  tools(on, true)
  const drawing = await $.ui.mount(band(true))

  await $.tool.call({ tool: 'Bash', command: 'false' })
  await $.tool.call({ tool: 'Bash', command: 'false' })
  await clock.advance(3_100)
  expect(await drawing.find({ text: /une erreur/ })).toBeDefined()
})

test('le 31 octobre, le thème Halloween a son animation exclusive', async ($, on) => {
  emptyBand(on)
  mock.clock(on, { now: new Date(2026, 9, 31, 12).getTime() })
  mock.store(on, { daily: { ...TODAY, date: '2026-10-31', theme: 'halloween' } })
  await $.command.run({ command: 'mascotte', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } })
  const drawing = await $.ui.mount(band(false))

  expect(await drawing.find({ text: /Des bonbons ou un sort/ })).toBeDefined()
})

test('/mascotte son on active le son de fin de tour', async ($, on) => {
  mock.clock(on, { now: NOON })
  const store: Record<string, unknown> = { daily: TODAY }
  on('store.get', (_$, e) => ({ value: store[e.key] }))
  on('store.set', (_$, e) => {
    store[e.key] = e.value
    return { value: undefined }
  })
  const answer = await $.command.run({ command: 'mascotte', args: 'son on', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } })

  expect(answer.text).toContain('🔔')
  expect(store.sound).toBe(true)
})
