export type Character = {
  id: string
  emoji: string
  name: string
}

export const characters: Character[] = [
  { id: "fox", emoji: "🦊", name: "Fox" },
  { id: "panda", emoji: "🐼", name: "Panda" },
  { id: "owl", emoji: "🦉", name: "Owl" },
  { id: "turtle", emoji: "🐢", name: "Turtle" },
  { id: "dragon", emoji: "🐉", name: "Dragon" },
  { id: "unicorn", emoji: "🦄", name: "Unicorn" },
]

export const backgroundColors = ["bg-orange-200", "bg-sky-200", "bg-green-200", "bg-pink-200", "bg-purple-200", "bg-yellow-200"]

export function findCharacter(id: string) {
  return characters.find((c) => c.id === id) ?? characters[0]
}
