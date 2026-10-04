// Les deux langues de la mascotte. Les thèmes sont écrits en français ; leur
// version anglaise vit ici, indexée par le texte français (un test vérifie
// qu'aucun texte de thème n'est oublié). Les messages de l'interface ont une
// clé chacun.

export type Lang = 'fr' | 'en'

// Les textes des thèmes en anglais : noms, pitchs, animations, occasions.
const THEMES_EN: Readonly<Record<string, string>> = {
  // Arcade
  Arcade: 'Arcade',
  'des jeux vidéo rétro : un jeu de plateforme avec des pièces, des envahisseurs de l’espace, des blocs qui tombent, une course de karts, un combat de boss':
    'retro video games: a platformer with coins, space invaders, falling blocks, a kart race, a boss fight',
  'attend une pièce': 'waits for a coin',
  'Niveau 1-1': 'World 1-1',
  Envahisseurs: 'Invaders',
  'Blocs qui tombent': 'Falling blocks',
  'Course de karts': 'Kart race',
  'Combat de boss': 'Boss fight',
  // Cuisine
  Cuisine: 'Cooking',
  'une toque de chef, des crêpes qui sautent, une marmite qui mijote, une pizza qui tourne, un gâteau d’anniversaire, du jonglage':
    'a chef’s hat, flipping crêpes, a simmering pot, a spinning pizza, a birthday cake, juggling',
  'surveille la marmite': 'keeps an eye on the pot',
  'Saut de crêpes': 'Crêpe flip',
  'La soupe du chef': 'Chef’s soup',
  Pizzaiolo: 'Pizzaiolo',
  'Gâteau d’anniversaire': 'Birthday cake',
  'Jonglage de légumes': 'Veggie juggling',
  'la Chandeleur': 'Candlemas (crêpe day)',
  'Crêpe et pièce d’or': 'Crêpe and a gold coin',
  // Danse
  Danse: 'Dance',
  'une boule à facettes, un dancefloor qui clignote, du disco, un moonwalk, de la danse robot': 'a disco ball, a flashing dance floor, disco, a moonwalk, robot dancing',
  'tape du pied en attendant': 'taps a foot while waiting',
  'Disco Fever': 'Disco Fever',
  Moonwalk: 'Moonwalk',
  'Danse du robot': 'Robot dance',
  'Sauts de joie': 'Jumps for joy',
  'La toupie': 'The spinning top',
  'le Nouvel An': 'New Year',
  'Bonne année !': 'Happy New Year!',
  // Jardin
  Jardin: 'Garden',
  'un chapeau de paille, un arrosoir qui fait pousser des fleurs, des papillons, des abeilles, une carotte à arracher, une averse puis un arc-en-ciel':
    'a straw hat, a watering can that grows flowers, butterflies, bees, a stubborn carrot, a shower then a rainbow',
  'contemple ses fleurs': 'admires the flowers',
  'Arrosage du potager': 'Watering the veggies',
  'Chasse aux papillons': 'Butterfly chase',
  'La carotte récalcitrante': 'The stubborn carrot',
  'Les abeilles bourdonnent': 'Buzzing bees',
  'Averse et arc-en-ciel': 'Shower and rainbow',
  'la Saint-Valentin': 'Valentine’s Day',
  'Un bouquet pour toi': 'A bouquet for you',
  // Halloween
  Halloween: 'Halloween',
  'une nuit de pleine lune, des citrouilles sculptées, un costume de fantôme, des chauves-souris, des bonbons, des squelettes qui dansent':
    'a full-moon night, carved pumpkins, a ghost costume, bats, candy, dancing skeletons',
  'veille près de sa citrouille': 'keeps watch by the pumpkin',
  'Costume de fantôme': 'Ghost costume',
  'Sculpter la citrouille': 'Carving the pumpkin',
  'Nuée de chauves-souris': 'Swarm of bats',
  'Pluie de bonbons': 'Candy rain',
  'Bouh !': 'Boo!',
  'Danse macabre': 'Skeleton dance',
  'Des bonbons ou un sort !': 'Trick or treat!',
  // Magicien
  Magicien: 'Wizard',
  'un chapeau pointu, une baguette, des sortilèges, un lapin dans un chapeau, un balai volant, des potions': 'a pointy hat, a wand, spells, a rabbit in a hat, a flying broom, potions',
  'médite en lévitation': 'meditates, levitating',
  Sortilège: 'Spell',
  'Le lapin dans le chapeau': 'Rabbit in the hat',
  'Balai volant': 'Flying broom',
  'Potion bouillonnante': 'Bubbling potion',
  'Orbes en orbite': 'Orbiting orbs',
  'Feu d’artifice magique': 'Magic fireworks',
  // Musique
  Musique: 'Music',
  'une guitare électrique, une batterie, un chef d’orchestre, un concert avec projecteurs et public, un DJ': 'an electric guitar, drums, a conductor, a concert with spotlights and a crowd, a DJ',
  'accorde sa guitare': 'tunes the guitar',
  'Solo de guitare': 'Guitar solo',
  'Solo de batterie': 'Drum solo',
  'Chef d’orchestre': 'Conductor',
  'Concert à guichets fermés': 'Sold-out concert',
  'Mix du DJ': 'DJ set',
  'la Fête de la musique': 'the Music Day festival',
  'Fête de la musique': 'Music Day',
  // Océan
  Océan: 'Ocean',
  'la plongée sous-marine, des bancs de poissons, un requin, un trésor englouti, des méduses lumineuses, du surf': 'scuba diving, schools of fish, a shark, a sunken treasure, glowing jellyfish, surfing',
  'flotte entre les algues': 'floats among the kelp',
  'Plongée avec les poissons': 'Diving with fish',
  'Un requin passe…': 'A shark swims by…',
  'Le trésor englouti': 'Sunken treasure',
  'Ballet des méduses': 'Jellyfish ballet',
  'Surf sur la vague': 'Riding the wave',
  'le 1er avril': 'April Fools’ Day',
  'Poisson d’avril !': 'April Fools!',
  // Pirate
  Pirate: 'Pirate',
  'un tricorne, des duels à l’épée, une longue-vue, la planche, un trésor enterré, une tempête': 'a tricorn hat, sword fights, a spyglass, walking the plank, buried treasure, a storm',
  'tient la barre tranquillement': 'calmly holds the helm',
  'À l’abordage !': 'Board them!',
  'Terre en vue !': 'Land ho!',
  'Marcher sur la planche': 'Walking the plank',
  'Le trésor enfoui': 'Buried treasure',
  'Dans la tempête': 'In the storm',
  // Espace
  Espace: 'Space',
  'des étoiles, un jetpack, l’apesanteur, un drapeau planté sur la Lune, un astéroïde à esquiver': 'stars, a jetpack, zero gravity, a flag planted on the Moon, an asteroid to dodge',
  'flotte tranquillement': 'floats peacefully',
  Jetpack: 'Jetpack',
  Apesanteur: 'Zero gravity',
  'Un petit pas': 'One small step',
  'Esquive d’astéroïde': 'Asteroid dodge',
  'Salut la Terre': 'Hello, Earth',
  // Sport
  Sport: 'Sport',
  'un bandeau de sportif, des jongles, un penalty, un panier de basket, des haltères, un sprint jusqu’à la ligne d’arrivée':
    'a sweatband, keepy-uppies, a penalty kick, a basketball dunk, dumbbells, a sprint to the finish line',
  's’échauffe': 'warms up',
  Jongles: 'Keepy-uppies',
  'Le penalty': 'Penalty kick',
  'Smash au basket': 'Slam dunk',
  'Séance d’haltères': 'Dumbbell session',
  'Sprint final': 'Final sprint',
  // Hiver
  Hiver: 'Winter',
  'la neige qui tombe, une écharpe, un bonhomme de neige, une bataille de boules de neige, du ski, du patin à glace, un chocolat chaud':
    'falling snow, a scarf, a snowman, a snowball fight, skiing, ice skating, a hot chocolate',
  'regarde tomber la neige': 'watches the snow fall',
  'Le bonhomme de neige': 'The snowman',
  'Bataille de boules de neige': 'Snowball fight',
  'Descente à ski': 'Ski run',
  'Patin à glace': 'Ice skating',
  'Chocolat chaud': 'Hot chocolate',
  Noël: 'Christmas',
  'Joyeux Noël !': 'Merry Christmas!',
}

// Un texte de thème dans la langue demandée (le français tel quel).
export const themeText = (lang: Lang, text: string) => (lang === 'en' ? (THEMES_EN[text] ?? text) : text)

// Pour le test : les textes de thèmes qui ont leur traduction.
export const hasThemeTranslation = (text: string) => text in THEMES_EN

// Les messages de l'interface.
const MESSAGES = {
  choosing: { fr: 'Je choisis le thème du jour…', en: 'Picking today’s theme…' },
  random: { fr: 'Tiré au sort aujourd’hui !', en: 'Picked at random today!' },
  forced: { fr: 'Tu as choisi le thème {theme} aujourd’hui, je m’y mets !', en: 'You picked the {theme} theme today, let’s go!' },
  commandDescription: {
    fr: 'Le thème du jour de la mascotte : le voir, le changer, ou laisser Claude rechoisir',
    en: 'The mascot’s theme of the day: see it, change it, or let Claude pick again',
  },
  commandHint: { fr: '[thème|rechoisir|son on|son off|diag]', en: '[theme|reroll|sound on|sound off|diag]' },
  unknownTheme: { fr: 'Thème inconnu. Disponibles : {names}, « rechoisir », ou « son on|off ».', en: 'Unknown theme. Available: {names}, “reroll”, or “sound on|off”.' },
  soundOn: { fr: '🔔 Un petit son à la fin des longs tours.', en: '🔔 A little sound at the end of long turns.' },
  soundOff: { fr: '🔕 Plus de son à la fin des longs tours.', en: '🔕 No more sound at the end of long turns.' },
  chosenBy: { fr: 'choisi par Claude', en: 'picked by Claude' },
  notChosenBy: { fr: 'pas choisi par Claude', en: 'not picked by Claude' },
  status: {
    fr: '{emoji} Thème du jour : {theme} ({who}) — « {phrase} »\nDisponibles : {names}. /{command} rechoisir pour me laisser recommencer.',
    en: '{emoji} Theme of the day: {theme} ({who}) — “{phrase}”\nAvailable: {names}. /{command} reroll to let me pick again.',
  },
  minutes: { fr: '{n} min', en: '{n} min' },
  actions: { fr: '{n} action', en: '{n} action' },
  actionsPlural: { fr: '{n} actions', en: '{n} actions' },
  phrase: { fr: '« {phrase} »', en: '“{phrase}”' },
  // Les activités communes à tous les thèmes.
  lire: { fr: 'lit le code', en: 'reads the code' },
  ecrire: { fr: 'écrit du code', en: 'writes code' },
  commande: { fr: 'lance une commande', en: 'runs a command' },
  web: { fr: 'cherche sur le web', en: 'searches the web' },
  agent: { fr: 'envoie des renforts', en: 'sends reinforcements' },
  echec: { fr: 'aïe, une erreur…', en: 'ouch, an error…' },
  fete: { fr: 'Terminé !', en: 'Done!' },
  triste: { fr: 'le tour a échoué…', en: 'the turn failed…' },
} as const

export type MessageKey = keyof typeof MESSAGES

// Un message de l'interface, avec ses valeurs ({nom}) remplacées.
export const t = (lang: Lang, key: MessageKey, values: Readonly<Record<string, string | number>> = {}) =>
  MESSAGES[key][lang].replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? `{${name}}`))

// La langue d'une valeur de réglage (« Français », « fr_FR.UTF-8 », « english »…), ou null.
export const langOf = (value: unknown): Lang | null => {
  if (typeof value !== 'string' || value.trim() === '') return null
  if (/^(fr|fran)/i.test(value.trim())) return 'fr'
  if (/^(en|engl|angl)/i.test(value.trim())) return 'en'
  return null
}
