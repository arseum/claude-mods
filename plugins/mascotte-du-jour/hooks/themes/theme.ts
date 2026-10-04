import type { Canvas } from '../canvas'
import type { Pose } from '../clawd'

// Dessine une image de l'animation au temps `t` (en secondes) sur la scène.
export type Draw = (c: Canvas, t: number) => void

export type Anim = { id: string; name: string; draw: Draw }

// Une animation exclusive, jouée seulement les jours de son occasion (« MM-JJ »).
export type Special = { dates: readonly string[]; occasion: string; anim: Anim }

export type Theme = {
  id: string
  name: string
  emoji: string
  // Ce que Claude lit pour choisir le thème du jour.
  pitch: string
  // Ce que fait le personnage quand Claude ne travaille pas.
  idle: Anim
  // Ce qu'il fait pendant un tour, une tirée au hasard à chaque prompt.
  anims: readonly Anim[]
  // Le personnage en costume, pour les activités communes à tous les thèmes.
  dress: (c: Canvas, pose: Pose, t: number) => void
  // Le décor des activités communes ; un simple sol gris sinon.
  scene?: Draw
  // Ce que l'heure ajoute au ciel : soleil ou lune (`open`), une fenêtre en
  // coin (`window`, en intérieur) ou rien (`own`, le thème a déjà son ciel).
  sky: 'open' | 'window' | 'own'
  specials?: readonly Special[]
}

// La scène fait 16 px de haut (8 lignes) ; sa largeur suit la bande, 48 colonnes au moins.
export const STAGE_W = 48
export const STAGE_H = 16
export const GROUND = STAGE_H - 1
