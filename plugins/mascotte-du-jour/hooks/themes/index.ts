import { arcadeTheme } from './arcade'
import { campingTheme } from './camping'
import { cookingTheme } from './cooking'
import { dance } from './dance'
import { dinoTheme } from './dino'
import { gardenTheme } from './garden'
import { halloweenTheme } from './halloween'
import { heroTheme } from './hero'
import { knightTheme } from './knight'
import { magicTheme } from './magic'
import { musicTheme } from './music'
import { ninjaTheme } from './ninja'
import { oceanTheme } from './ocean'
import { pirateTheme } from './pirate'
import { space } from './space'
import { sportTheme } from './sport'
import type { Theme } from './theme'
import { westernTheme } from './western'
import { winterTheme } from './winter'

export const THEMES: readonly Theme[] = [dance, space, pirateTheme, magicTheme, cookingTheme, musicTheme, halloweenTheme, oceanTheme, winterTheme, gardenTheme, sportTheme, arcadeTheme, westernTheme, dinoTheme, knightTheme, ninjaTheme, campingTheme, heroTheme]

export const themeById = (id: string | undefined): Theme => THEMES.find(theme => theme.id === id) ?? THEMES[0]!
