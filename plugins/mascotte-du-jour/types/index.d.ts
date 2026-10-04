export type Daily = { date: string; theme: string; phrase: string; isChosenByClaude: boolean }

// Ce que fait le personnage en dehors des animations du thème (voir hooks/activities.ts).
export type ActivityId = 'lire' | 'ecrire' | 'commande' | 'web' | 'agent' | 'echec' | 'fete' | 'triste'

declare module 'claude-code' {
  interface PluginState {
    'mascotte-du-jour': {
      daily: Daily | null
      anim: string | null
      isChoosing: boolean
      clip: number
      activity: ActivityId | null
      // Quand le tour en cours a commencé (ms), null hors d'un tour.
      turnStart: number | null
      // Incrémenté chaque minute pendant un tour, pour redessiner la ligne de suivi.
      minute: number
    }
  }
}
