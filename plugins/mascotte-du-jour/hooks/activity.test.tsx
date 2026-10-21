import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { isCommit } from './activities'

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

test('un commit git se reconnaît à sa commande et à ce que git répond', () => {
  const done = '[main 1ffcbdd] Six nouveaux thèmes\n 3 files changed, 12 insertions(+)'
  expect(isCommit('git commit -m "Ajout"', done)).toBe(true)
  expect(isCommit('git add -A && git commit -m "$(cat <<\'EOF\'\nAjout\nEOF\n)"', done)).toBe(true)
  expect(isCommit('git -C /tmp/projet commit -am wip', '[feature/x (root-commit) 0a1b2c3] wip')).toBe(true)
  expect(isCommit('git commit -q -F -', '')).toBe(true)
  expect(isCommit('git commit -qm "x"', '')).toBe(true)
  expect(isCommit('git commit -m "x"', '')).toBe(false)
  expect(isCommit('git commit -m init', '[main (root-commit) abc1234] init')).toBe(true)
  expect(isCommit('git commit -m x', '[detached HEAD abc1234] x')).toBe(true)
  expect(isCommit('git rebase --continue', '[main abc1234] x')).toBe(false)
  expect(isCommit('git cherry-pick abc1234', '[main def5678] x')).toBe(false)
  expect(isCommit('git commit -m x &', '')).toBe(false)
  expect(isCommit('git commit -m "Ajout"', 'On branch main\nnothing to commit, working tree clean')).toBe(false)
  expect(isCommit('git commit --dry-run -m x', done)).toBe(false)
  expect(isCommit('git log --oneline -3', '1ffcbdd Six nouveaux thèmes')).toBe(false)
  expect(isCommit('echo commit', done)).toBe(false)
  expect(isCommit(undefined, done)).toBe(false)
})

test('après un commit réussi, la mascotte fête le commit', async ($, on) => {
  emptyBand(on)
  const clock = mock.clock(on, { now: NOON })
  mock.store(on, { daily: TODAY })
  on('tool.call', () => ({ result: { stdout: '[main 1ffcbdd] Ajout', stderr: '', interrupted: false }, text: '[main 1ffcbdd] Ajout' }) as never)
  const drawing = await $.ui.mount(band(true))

  await $.tool.call({ tool: 'Bash', command: 'git commit -m "Ajout"' })
  expect(await drawing.find({ text: /commit réussi !/ })).toBeDefined()

  await clock.advance(4_500)
  expect(await drawing.find({ text: /commit réussi/ })).toBeUndefined()
})

test('un commit fait par un sous-agent se fête aussi', async ($, on) => {
  emptyBand(on)
  mock.clock(on, { now: NOON })
  mock.store(on, { daily: TODAY })
  on('tool.call', () => ({ result: { stdout: '', stderr: '', interrupted: false }, text: '[main 1ffcbdd] Ajout' }) as never)
  const drawing = await $.ui.mount(band(true))

  await $.tool.call({ tool: 'Bash', command: 'git commit -m "Ajout"', agentId: 'agent-1' } as never)
  expect(await drawing.find({ text: /commit réussi !/ })).toBeDefined()
})

test('après la fête d’un commit de sous-agent, la mascotte reprend les renforts en cours', async ($, on) => {
  emptyBand(on)
  const clock = mock.clock(on, { now: NOON })
  mock.store(on, { daily: TODAY })
  let finishAgent = () => {}
  on('tool.call', (_$, e) => {
    if (e.tool === 'Agent') return new Promise(resolve => (finishAgent = () => resolve({ result: {}, text: 'fini' } as never)))
    return { result: { stdout: '', stderr: '', interrupted: false }, text: '[main 1ffcbdd] Ajout' } as never
  })
  const drawing = await $.ui.mount(band(true))

  const agent = $.tool.call({ tool: 'Agent', prompt: 'committe', description: 'commit' } as never)
  await clock.advance(100)
  await $.tool.call({ tool: 'Bash', command: 'git commit -m "Ajout"', agentId: 'agent-1' } as never)
  expect(await drawing.find({ text: /commit réussi !/ })).toBeDefined()

  await clock.advance(4_500)
  expect(await drawing.find({ text: /envoie des renforts/ })).toBeDefined()
  finishAgent()
  await agent
})

test('un commit qui échoue ne se fête pas', async ($, on) => {
  emptyBand(on)
  mock.clock(on, { now: NOON })
  mock.store(on, { daily: TODAY })
  on('tool.call', () => ({ result: { stdout: 'nothing to commit', stderr: '', interrupted: false }, text: 'nothing to commit', isError: true }) as never)
  const drawing = await $.ui.mount(band(true))

  await $.tool.call({ tool: 'Bash', command: 'git commit -m "Ajout"' })
  expect(await drawing.find({ text: /commit réussi/ })).toBeUndefined()
})
