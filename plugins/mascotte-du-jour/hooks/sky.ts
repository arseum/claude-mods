// Le ciel qui suit l'heure : le soleil qui traverse la scène dans la journée,
// rose au lever, orange au coucher, puis la lune et quelques étoiles la nuit.
// Dessiné avant le thème, dans les pixels encore vides : le décor passe devant.
// Sans teinte sur le reste, pour ne pas jurer avec le fond du terminal.

import { type Canvas, mix, noise } from './canvas'
import type { Draw, Theme } from './themes/theme'

const SUNRISE = 6
const SUNSET = 21

const sunColor = (hour: number) => {
  if (hour < 8.5) return mix(0xfb7185, 0xfde047, (hour - SUNRISE) / 2.5)
  if (hour > 18) return mix(0xfde047, 0xf97316, (hour - 18) / 3)
  return 0xfde047
}

const sun = (c: Canvas, x: number, y: number, hour: number, t: number) => {
  const color = sunColor(hour)
  c.disc(x, y, 2.2, color)
  // Quatre rayons qui scintillent doucement.
  if (Math.sin(t * 2) > -0.3) {
    for (const [dx, dy] of [[-4, 0], [4, 0], [0, -4], [0, 4], [-3, -3], [3, -3], [-3, 3], [3, 3]] as const) c.dot(x + dx, y + dy, mix(color, 0x000000, 0.25))
  }
}

const night = (c: Canvas, x: number, y: number, t: number) => {
  // Un croissant de lune : un disque pâle, mordu par un disque vide.
  // Calculé pixel réel par pixel réel : un croissant net en haute définition.
  const step = 1 / c.res
  for (let dy = -2.5; dy <= 2.5; dy += step) {
    for (let dx = -2.5; dx <= 2.5; dx += step) {
      const inMoon = dx * dx + dy * dy <= 5.2
      const inBite = (dx - 1.4) ** 2 + (dy + 0.6) ** 2 <= 3.2
      if (inMoon && !inBite) c.dot(x + dx, y + dy, dx < -1.2 ? 0xd1d5db : 0xf3f4f6)
    }
  }
  for (let i = 0; i < 8; i++) {
    const shine = 0.5 + 0.5 * Math.sin(t * (0.8 + noise(i + 3) * 2) + i * 2)
    c.dot(noise(i * 4.7 + 1) * c.w, noise(i * 2.3 + 8) * 6, mix(0x334155, 0xf1f5f9, shine))
  }
}

// Une petite fenêtre en haut à gauche : ciel de jour ou de nuit.
const window = (c: Canvas, hour: number, t: number) => {
  const isDay = hour >= SUNRISE && hour < SUNSET
  c.rect(1, 1, 9, 6, 0x78716c)
  c.rect(2, 2, 7, 4, isDay ? 0x7dd3fc : 0x1e293b)
  c.rect(5, 2, 1, 4, 0x78716c)
  if (isDay) c.disc(3, 3, 1, sunColor(hour))
  else {
    c.set(7, 3, 0xe5e7eb)
    if (Math.sin(t * 1.5) > 0) c.set(3, 4, 0xf1f5f9)
  }
}

// Ajoute le ciel de l'heure (`hour` de 0 à 24, fractions comprises) sous l'animation.
export const withSky = (draw: Draw, theme: Theme, hour: number): Draw => {
  if (theme.sky === 'own') return draw
  return (c, t) => {
    if (theme.sky === 'window') window(c, hour, t)
    else if (hour >= SUNRISE && hour < SUNSET) {
      const k = (hour - SUNRISE) / (SUNSET - SUNRISE)
      sun(c, 4 + k * (c.w - 8), 6 - Math.sin(k * Math.PI) * 3, hour, t)
    } else night(c, c.w - 7, 3, t)
    draw(c, t)
  }
}
