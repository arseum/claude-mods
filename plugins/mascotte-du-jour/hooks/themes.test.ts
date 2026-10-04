import { expect, test } from 'claude-code/testing'

import { ACTIVITIES, activityAnim } from './activities'
import { Canvas } from './canvas'
import { setMini } from './clawd'
import { withSky } from './sky'
import { THEMES } from './themes'

test('chaque animation de chaque thème se dessine, en taille normale comme en mini', () => {
  for (const theme of THEMES) {
    for (const anim of [theme.idle, ...theme.anims]) {
      for (const isMini of [false, true]) {
        setMini(isMini)
        for (const t of [0, 1.3, 7.9, 42, 600]) {
          const canvas = new Canvas(80, 16)
          anim.draw(canvas, t)
          expect(canvas.encode().length).toBeGreaterThan(0)
        }
      }
    }
  }
  setMini(false)
})

test('les identifiants de thèmes et d’animations sont uniques', () => {
  const themeIds = THEMES.map(t => t.id)
  expect(new Set(themeIds).size).toBe(themeIds.length)
  for (const theme of THEMES) {
    const ids = [theme.idle, ...theme.anims].map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(theme.anims.length).toBeGreaterThanOrEqual(4)
  }
})

test('chaque activité et chaque animation exclusive se dessine dans chaque thème, à toute heure', () => {
  for (const theme of THEMES) {
    const anims = [...ACTIVITIES.map(a => activityAnim(a, theme)), ...(theme.specials ?? []).map(s => s.anim)]
    for (const anim of anims) {
      for (const isMini of [false, true]) {
        setMini(isMini)
        for (const [t, hour] of [[0, 3], [1.3, 7], [7.9, 13], [42, 19.5], [600, 23]] as const) {
          const canvas = new Canvas(80, 16)
          withSky(anim.draw, theme, hour)(canvas, t)
          expect(canvas.encode().length).toBeGreaterThan(0)
        }
      }
    }
  }
  setMini(false)
})

test('les dates spéciales ne se chevauchent pas', () => {
  const dates = THEMES.flatMap(t => (t.specials ?? []).flatMap(s => s.dates))
  expect(new Set(dates).size).toBe(dates.length)
})

test('en haute définition, chaque animation se dessine à double finesse', () => {
  for (const theme of THEMES) {
    for (const anim of [theme.idle, ...theme.anims, ...ACTIVITIES.map(a => activityAnim(a, theme))]) {
      const canvas = new Canvas(80, 16, 2)
      anim.draw(canvas, 2.5)
      // 160 colonnes × 16 lignes, 3 mots de 4 octets par case, en base64.
      expect(atob(canvas.encode()).length).toBe(160 * 16 * 12)
    }
  }
})

test('aux finesses intermédiaires (1,25 et 1,5), chaque animation remplit exactement la bande', () => {
  for (const [res, rows] of [[1.25, 10], [1.5, 12]] as const) {
    for (const theme of THEMES) {
      for (const anim of [theme.idle, ...theme.anims, ...ACTIVITIES.map(a => activityAnim(a, theme))]) {
        const canvas = new Canvas(120 / res, 16, res)
        anim.draw(canvas, 3.3)
        expect(atob(canvas.encode()).length).toBe(120 * rows * 12)
      }
    }
  }
})
