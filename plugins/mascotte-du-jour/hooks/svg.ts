// Le rendu des surfaces sans Raster (le desktop) : quelques secondes de
// l'animation, image par image, assemblées en un clip SVG qui se joue tout
// seul en boucle grâce aux animations SMIL. Le mod envoie le clip suivant
// quand celui-ci se termine.

import { Canvas } from './canvas'
import { type Draw, GROUND, STAGE_H } from './themes/theme'

// Le plafond de l'élément Svg est de 131 072 caractères : on garde de la marge.
const MAX_SOURCE = 120_000

// Le fond de la scène : un petit écran sombre, lisible en thème clair comme sombre.
const SCREEN = 0x0b0b10

const hex = (color: number) => `#${color.toString(16).padStart(6, '0')}`

// Des pixels en chemins SVG : un <path> par couleur, fait des segments
// horizontaux de pixels de cette couleur (-1 : transparent).
function paths(px: Int32Array, width: number, height: number) {
  const byColor = new Map<number, string>()
  for (let y = 0; y < height; y++) {
    let x = 0
    while (x < width) {
      const color = px[y * width + x]!
      let run = 1
      while (x + run < width && px[y * width + x + run] === color) run++
      if (color >= 0) byColor.set(color, `${byColor.get(color) ?? ''}M${x} ${y}h${run}v1h-${run}z`)
      x += run
    }
  }
  return [...byColor].map(([color, d]) => `<path fill="${hex(color)}" d="${d}"/>`).join('')
}

// Un clip de `frames` images au plus, à `fps` images par seconde, à partir de `t0`,
// dessiné à `res` pixels réels par pixel de la scène.
// Le décor (la couleur la plus fréquente de chaque pixel) est dessiné une seule
// fois ; chaque image ne porte que ses pixels qui s'en écartent. Renvoie le
// document SVG et la durée réelle du clip (raccourci s'il ne tient pas).
export function svgClip(draw: Draw, t0: number, sceneWidth: number, fps: number, frames: number, res = 1) {
  const width = sceneWidth * res
  const height = STAGE_H * res
  const canvases = Array.from({ length: frames }, (_, i) => {
    const canvas = new Canvas(sceneWidth, STAGE_H, res)
    draw(canvas, t0 + i / fps)
    canvas.polish(GROUND)
    return canvas.px.map(color => (color < 0 ? SCREEN : color))
  })

  const backdrop = new Int32Array(width * height)
  for (let i = 0; i < backdrop.length; i++) {
    const counts = new Map<number, number>()
    let best = SCREEN
    let bestCount = 0
    for (const px of canvases) {
      const color = px[i]!
      const n = (counts.get(color) ?? 0) + 1
      counts.set(color, n)
      if (n > bestCount) {
        best = color
        bestCount = n
      }
    }
    backdrop[i] = best
  }
  const background = paths(backdrop, width, height)

  const bodies: string[] = []
  let length = 300 + background.length
  for (const px of canvases) {
    const body = paths(px.map((color, i) => (color === backdrop[i] ? -1 : color)), width, height)
    if (length + body.length + 200 > MAX_SOURCE) break
    bodies.push(body)
    length += body.length + 200
  }

  const count = bodies.length
  const seconds = count / fps
  const at = (k: number) => (k / count).toFixed(4)
  const groups = bodies.map((body, i) => {
    if (count === 1) return `<g>${body}</g>`
    // Chaque image n'est visible que pendant sa tranche du clip.
    const [values, keyTimes] =
      i === 0 ? ['visible;hidden', `0;${at(1)}`] : i === count - 1 ? ['hidden;visible', `0;${at(i)}`] : ['hidden;visible;hidden', `0;${at(i)};${at(i + 1)}`]
    return `<g visibility="hidden"><animate attributeName="visibility" values="${values}" keyTimes="${keyTimes}" dur="${seconds}s" repeatCount="indefinite" calcMode="discrete"/>${body}</g>`
  })

  const source = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${background}${groups.join('')}</svg>`
  return { source, seconds }
}
