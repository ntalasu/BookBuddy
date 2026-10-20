import { findAccessory, findCharacter, hats, items } from "../data/characters"

type Props = {
  characterId: string
  color: string
  hatId?: string
  itemId?: string
  size: "sm" | "md" | "lg"
}

const sizes = {
  sm: { circle: "h-8 w-8 text-xl", hat: "-top-3 text-base", item: "-right-1 -bottom-1 text-xs" },
  md: { circle: "h-10 w-10 text-2xl", hat: "-top-3.5 text-lg", item: "-right-1 -bottom-1 text-sm" },
  lg: { circle: "h-32 w-32 text-7xl", hat: "-top-9 text-5xl", item: "-right-2 bottom-0 text-4xl" },
}

// The student's buddy picture with its hat and held item. Used in the header, profile, and chat.
function BuddyAvatar({ characterId, color, hatId, itemId, size }: Props) {
  const character = findCharacter(characterId)
  const hat = findAccessory(hats, hatId)
  const item = findAccessory(items, itemId)
  const s = sizes[size]

  return (
    <div className="relative inline-block shrink-0">
      <div className={`flex items-center justify-center rounded-full ${s.circle} ${color}`}>
        {character.emoji}
      </div>
      {hat.emoji && <span className={`absolute left-1/2 -translate-x-1/2 ${s.hat}`}>{hat.emoji}</span>}
      {item.emoji && <span className={`absolute ${s.item}`}>{item.emoji}</span>}
    </div>
  )
}

export default BuddyAvatar
