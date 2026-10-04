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

const band = (maxRows: number, bodyColumns = 120, viewRows?: number) =>
  ({
    plugin: 'mascotte-du-jour',
    surface: 'terminal',
    component: 'AbovePrompt',
    ...(viewRows === undefined ? {} : { viewport: { columns: bodyColumns, rows: viewRows } }),
    requestId: 'band',
    props: { hasSurvey: false, isWorking: false, maxRows, bodyColumns, scroll: { offset: 0, bodyRows: maxRows - 1 }, view: {} },
  }) as const

test('un terminal bas affiche la mascotte en taille d’origine', async ($, on) => {
  emptyBand(on)
  const stage = await (await $.ui.mount(band(9))).find({ key: 'stage' })

  expect(stage?.props.rows).toBe(8)
})

test('un terminal IntelliJ au maximum (10 lignes) l’affiche en HD compacte', async ($, on) => {
  emptyBand(on)
  const stage = await (await $.ui.mount(band(10, 146, 33))).find({ key: 'stage' })

  expect(stage?.props.rows).toBe(10)
})

test('un terminal haut l’affiche agrandie', async ($, on) => {
  emptyBand(on)
  const stage = await (await $.ui.mount(band(14))).find({ key: 'stage' })

  expect(stage?.props.rows).toBe(12)
})

test('un grand écran l’affiche en taille géante', async ($, on) => {
  emptyBand(on)
  const stage = await (await $.ui.mount(band(25, 300, 60))).find({ key: 'stage' })

  expect(stage?.props.rows).toBe(16)
})

test('la taille géante s’affiche dès que ses 16 lignes tiennent dans la bande', async ($, on) => {
  emptyBand(on)
  const stage = await (await $.ui.mount(band(16, 300, 40))).find({ key: 'stage' })

  expect(stage?.props.rows).toBe(16)
})

test('sur un écran très large, la scène ne s’étire pas sans fin', async ($, on) => {
  emptyBand(on)
  const stage = await (await $.ui.mount(band(25, 500, 60))).find({ key: 'stage' })

  expect(stage?.props.columns).toBe(320)
})

test('un terminal très bas affiche la mini-mascotte', async ($, on) => {
  emptyBand(on)
  const stage = await (await $.ui.mount(band(5))).find({ key: 'stage' })

  expect(stage?.props.rows).toBe(5)
})

test('sans la place, la bande reste vide', async ($, on) => {
  emptyBand(on)

  expect(await (await $.ui.mount(band(4))).find({ key: 'stage' })).toBeUndefined()
})
