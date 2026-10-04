import { arcadeTheme } from './arcade'
import { cookingTheme } from './cooking'
import { dance } from './dance'
import { gardenTheme } from './garden'
import { halloweenTheme } from './halloween'
import { magicTheme } from './magic'
import { musicTheme } from './music'
import { oceanTheme } from './ocean'
import { pirateTheme } from './pirate'
import { space } from './space'
import { sportTheme } from './sport'
import type { Theme } from './theme'
import { winterTheme } from './winter'

export const THEMES: readonly Theme[] = [dance, space, pirateTheme, magicTheme, cookingTheme, musicTheme, halloweenTheme, oceanTheme, winterTheme, gardenTheme, sportTheme, arcadeTheme]

export const themeById = (id: string | undefined): Theme => THEMES.find(theme => theme.id === id) ?? THEMES[0]!
