import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const emptyBand = (on: On) => {
  // Le thème du jour déjà enregistré, comme dans une vraie session.
  mock.store(on, { daily: { date: '2026-10-04', theme: 'pirate', phrase: 'Cap à l’ouest !', isChosenByClaude: true } })
  return on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })
}

test('sur le desktop, la mascotte est un clip SVG animé', async ($, on) => {
  emptyBand(on)
  const drawing = await $.ui.mount({
    plugin: 'mascotte-du-jour',
    surface: 'desktop',
    component: 'AbovePrompt',
    requestId: 'band',
    props: { hasSurvey: false, isWorking: true, maxRows: 5, bodyColumns: 120, scroll: { offset: 0, bodyRows: 4 }, view: {} },
  })
  const svg = await drawing.find({ type: 'Svg' })
  const source = String(svg?.props.source ?? '')

  expect(source.startsWith('<svg')).toBe(true)
  expect(source).toContain('<animate')
  expect(source.length).toBeLessThan(131072)
})
