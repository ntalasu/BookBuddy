export type Character = {
  id: string
  emoji: string
  name: string
}

export const characters: Character[] = [
  // animals
  { id: "fox", emoji: "🦊", name: "Fox" },
  { id: "panda", emoji: "🐼", name: "Panda" },
  { id: "owl", emoji: "🦉", name: "Owl" },
  { id: "turtle", emoji: "🐢", name: "Turtle" },
  { id: "cat", emoji: "🐱", name: "Cat" },
  { id: "dog", emoji: "🐶", name: "Dog" },
  { id: "bunny", emoji: "🐰", name: "Bunny" },
  { id: "penguin", emoji: "🐧", name: "Penguin" },
  { id: "lion", emoji: "🦁", name: "Lion" },
  { id: "frog", emoji: "🐸", name: "Frog" },
  { id: "octopus", emoji: "🐙", name: "Octopus" },
  { id: "butterfly", emoji: "🦋", name: "Butterfly" },
  { id: "koala", emoji: "🐨", name: "Koala" },
  { id: "sloth", emoji: "🦥", name: "Sloth" },
  { id: "hedgehog", emoji: "🦔", name: "Hedgehog" },
  { id: "chameleon", emoji: "🦎", name: "Chameleon" },
  // fantasy
  { id: "dragon", emoji: "🐉", name: "Dragon" },
  { id: "unicorn", emoji: "🦄", name: "Unicorn" },
  { id: "dinosaur", emoji: "🦖", name: "Dinosaur" },
  { id: "wizard", emoji: "🧙", name: "Wizard" },
  { id: "fairy", emoji: "🧚", name: "Fairy" },
  { id: "mermaid", emoji: "🧜", name: "Mermaid" },
  { id: "vampire", emoji: "🧛", name: "Vampire" },
  { id: "zombie", emoji: "🧟", name: "Zombie" },
  // sci-fi and heroes
  { id: "robot", emoji: "🤖", name: "Robot" },
  { id: "alien", emoji: "👽", name: "Alien" },
  { id: "astronaut", emoji: "🧑‍🚀", name: "Astronaut" },
  { id: "superhero", emoji: "🦸", name: "Superhero" },
  { id: "ninja", emoji: "🥷", name: "Ninja" },
  { id: "detective", emoji: "🕵️", name: "Detective" },
  { id: "pirate", emoji: "🏴‍☠️", name: "Pirate" },
  { id: "samurai", emoji: "🗡️", name: "Samurai" },
]

export const backgroundColors = [
  "bg-red-200", "bg-orange-200", "bg-amber-200", "bg-yellow-200", "bg-lime-200", "bg-green-200",
  "bg-teal-200", "bg-cyan-200", "bg-sky-200", "bg-blue-200", "bg-indigo-200", "bg-purple-200",
  "bg-fuchsia-200", "bg-pink-200", "bg-rose-200", "bg-stone-200",
]

export const fancyBackgrounds = [
  { name: "Sunset", className: "bg-linear-to-br from-orange-300 to-pink-400" },
  { name: "Ocean", className: "bg-linear-to-br from-cyan-200 to-blue-500" },
  { name: "Forest", className: "bg-linear-to-br from-lime-200 to-emerald-500" },
  { name: "Galaxy", className: "bg-linear-to-br from-indigo-500 to-purple-800 text-white" },
  { name: "Candy", className: "bg-linear-to-br from-pink-200 to-sky-200" },
  { name: "Rainbow", className: "bg-linear-to-r from-red-300 via-yellow-200 to-sky-300" },
]

export type Accessory = {
  id: string
  emoji: string
  name: string
  unlockBadgeId?: string // locked until the student earns this reading badge
}

// worn on top of the buddy's head
export const hats: Accessory[] = [
  { id: "none", emoji: "", name: "No hat" },
  { id: "bow", emoji: "🎀", name: "Bow" },
  { id: "cap", emoji: "🧢", name: "Cap" },
  { id: "flower", emoji: "🌸", name: "Flower" },
  { id: "gradcap", emoji: "🎓", name: "Grad Cap", unlockBadgeId: "2" },
  { id: "tophat", emoji: "🎩", name: "Top Hat", unlockBadgeId: "3" },
  { id: "crown", emoji: "👑", name: "Crown", unlockBadgeId: "4" },
  { id: "sunhat", emoji: "👒", name: "Sun Hat", unlockBadgeId: "14" },
  { id: "helmet", emoji: "⛑️", name: "Explorer Helmet", unlockBadgeId: "11" },
]

// held in the bottom corner
export const items: Accessory[] = [
  { id: "none", emoji: "", name: "Nothing" },
  { id: "balloon", emoji: "🎈", name: "Balloon" },
  { id: "ball", emoji: "⚽", name: "Ball" },
  { id: "icecream", emoji: "🍦", name: "Ice Cream" },
  { id: "book", emoji: "📖", name: "Book", unlockBadgeId: "1" },
  { id: "wand", emoji: "🪄", name: "Magic Wand", unlockBadgeId: "3" },
  { id: "trophy", emoji: "🏆", name: "Trophy", unlockBadgeId: "4" },
  { id: "flashlight", emoji: "🔦", name: "Flashlight", unlockBadgeId: "5" },
  { id: "telescope", emoji: "🔭", name: "Telescope", unlockBadgeId: "6" },
  { id: "rocket", emoji: "🚀", name: "Rocket", unlockBadgeId: "7" },
  { id: "unicorn", emoji: "🦄", name: "Unicorn", unlockBadgeId: "8" },
  { id: "books", emoji: "📚", name: "Book Stack", unlockBadgeId: "9" },
  { id: "moon", emoji: "🌙", name: "Moon", unlockBadgeId: "12" },
  { id: "teddy", emoji: "🧸", name: "Teddy Bear", unlockBadgeId: "13" },
  { id: "sprout", emoji: "🌱", name: "Sprout", unlockBadgeId: "16" },
]

export function findCharacter(id: string) {
  return characters.find((c) => c.id === id) ?? characters[0]
}

export function findAccessory(list: Accessory[], id: string | undefined) {
  return list.find((a) => a.id === id) ?? list[0]
}
