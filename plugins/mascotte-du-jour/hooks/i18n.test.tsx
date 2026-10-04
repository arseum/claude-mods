import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { hasThemeTranslation } from './i18n'
import { THEMES } from './themes'

const PIRATE_DAY = { date: '2026-10-04', theme: 'pirate', phrase: 'Cap à l’ouest !', isChosenByClaude: true }

const emptyBand = (on: On) =>
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })

const band = {
  plugin: 'mascotte-du-jour',
  surface: 'terminal',
  component: 'AbovePrompt',
  requestId: 'band',
  props: { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 120, scroll: { offset: 0, bodyRows: 19 }, view: {} },
} as const

test('chaque texte de thème a sa traduction anglaise', () => {
  const missing: string[] = []
  for (const theme of THEMES) {
    const texts = [theme.name, theme.pitch, theme.idle.name, ...theme.anims.map(a => a.name), ...(theme.specials ?? []).flatMap(s => [s.occasion, s.anim.name])]
    for (const text of texts) if (!hasThemeTranslation(text)) missing.push(text)
  }
  expect(missing).toEqual([])
})

test('en anglais, la bande parle anglais', { options: { language: 'en' } }, async ($, on) => {
  emptyBand(on)
  mock.clock(on, { now: new Date(2026, 9, 4, 12).getTime() })
  mock.store(on, { daily: PIRATE_DAY })
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('ui.blit', () => ({ value: {} }))
  on('ui.log', () => ({ value: undefined }))
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  const drawing = await $.ui.mount(band)

  expect(await drawing.find({ text: /calmly holds the helm/ })).toBeDefined()
})

test('en anglais, /mascot comprend « sound on »', { options: { language: 'en' } }, async ($, on) => {
  mock.clock(on, { now: new Date(2026, 9, 4, 12).getTime() })
  mock.store(on, { daily: PIRATE_DAY })
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('ui.blit', () => ({ value: {} }))
  on('ui.log', () => ({ value: undefined }))
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  const answer = await $.command.run({ command: 'mascot', args: 'sound on', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } })

  expect(answer.text).toContain('A little sound')
})

test('en français, la bande parle français', { options: { language: 'fr' } }, async ($, on) => {
  emptyBand(on)
  mock.clock(on, { now: new Date(2026, 9, 4, 12).getTime() })
  mock.store(on, { daily: PIRATE_DAY })
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('ui.blit', () => ({ value: {} }))
  on('ui.log', () => ({ value: undefined }))
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  const drawing = await $.ui.mount(band)

  expect(await drawing.find({ text: /tient la barre/ })).toBeDefined()
})
