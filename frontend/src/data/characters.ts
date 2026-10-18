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

export const backgroundColors = ["bg-orange-200", "bg-sky-200", "bg-green-200", "bg-pink-200", "bg-purple-200", "bg-yellow-200"]

export function findCharacter(id: string) {
  return characters.find((c) => c.id === id) ?? characters[0]
}
