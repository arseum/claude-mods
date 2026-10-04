import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const band = (isWorking: boolean) =>
  ({
    plugin: 'mascotte-du-jour',
    surface: 'terminal',
    component: 'AbovePrompt',
    requestId: 'band',
    props: { hasSurvey: false, isWorking, maxRows: 20, bodyColumns: 120, scroll: { offset: 0, bodyRows: 19 }, view: {} },
  }) as const

// Le moteur ne dessine rien dans la bande.
const emptyBand = (on: On) => {
  // Le thème du jour déjà enregistré, comme dans une vraie session.
  mock.store(on, { daily: { date: '2026-10-04', theme: 'pirate', phrase: 'Cap à l’ouest !', isChosenByClaude: true } })
  return on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })
}

test('au repos, la mascotte fait sa pose d’attente', async ($, on) => {
  emptyBand(on)
  const drawing = await $.ui.mount(band(false))

  expect(await drawing.find({ key: 'stage' })).toBeDefined()
  expect(await drawing.find({ text: /⏸/ })).toBeDefined()
})

test('pendant un tour, elle joue une animation du thème', async ($, on) => {
  emptyBand(on)
  const drawing = await $.ui.mount(band(true))

  expect(await drawing.find({ key: 'stage' })).toBeDefined()
  expect(await drawing.find({ text: /▶/ })).toBeDefined()
})
