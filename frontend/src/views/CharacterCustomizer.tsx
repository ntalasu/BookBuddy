import { useState } from "react"
import { ProfileApiService } from "../api/ProfileApiService"
import { useLoggedInStudent } from "../context/StudentContext"
import {
  backgroundColors,
  characters,
  fancyBackgrounds,
  findCharacter,
  hats,
  items,
  type Accessory,
} from "../data/characters"
import { useReadingProgress } from "../hooks/useReadingProgress"
import BuddyAvatar from "./BuddyAvatar"

function CharacterCustomizer() {
  const { student, updateStudent } = useLoggedInStudent()
  const { progress } = useReadingProgress(student.id)
  const [characterId, setCharacterId] = useState(student.characterId)
  const [color, setColor] = useState(student.characterColor)
  const [hatId, setHatId] = useState(student.hatId ?? "none")
  const [itemId, setItemId] = useState(student.itemId ?? "none")
  const [buddyName, setBuddyName] = useState(student.buddyName ?? "")
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const character = findCharacter(characterId)

  // wrap a "set" function so any change also hides the "Saved!" message
  function change<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setSaved(false)
    }
  }

  // returns the badge name needed to unlock this accessory, or null if it's unlocked
  function lockedBy(accessory: Accessory) {
    if (!accessory.unlockBadgeId) return null
    if (progress?.earnedBadgeIds.includes(accessory.unlockBadgeId)) return null
    const badge = progress?.badges.find((b) => b.id === accessory.unlockBadgeId)
    return badge ? `${badge.emoji} ${badge.name}` : "a reading badge"
  }

  async function saveCustomization() {
    try {
      const savedStudent = await ProfileApiService.updateProfile(student.id, {
        characterId,
        characterColor: color,
        hatId,
        itemId,
        buddyName: buddyName.trim(),
      })
      updateStudent(savedStudent)
      setSaved(true)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function accessoryPicker(list: Accessory[], selectedId: string, onSelect: (id: string) => void) {
    return (
      <div className="flex flex-wrap gap-2">
        {list.map((a) => {
          const lock = lockedBy(a)
          return (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              disabled={lock !== null}
              title={lock ? `Earn ${lock} to unlock!` : a.name}
              className={`relative flex h-12 w-12 items-center justify-center rounded-lg text-2xl ${
                a.id === selectedId ? "bg-orange-100 ring-2 ring-orange-500" : "bg-gray-50 hover:bg-gray-100"
              } ${lock ? "cursor-not-allowed opacity-40 grayscale" : ""}`}
            >
              {a.emoji || <span className="text-sm text-gray-400">None</span>}
              {lock && <span className="absolute -right-1 -bottom-1 text-sm">🔒</span>}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-lg">
      <h3 className="mb-6 text-xl font-bold">My Reading Buddy</h3>

      {/* big preview */}
      <div className="mt-8 flex justify-center">
        <BuddyAvatar characterId={characterId} color={color} hatId={hatId} itemId={itemId} size="lg" />
      </div>
      <p className="mt-3 text-center text-lg font-semibold">{buddyName.trim() || character.name}</p>

      <p className="mt-4 mb-2 font-semibold">Name your buddy</p>
      <input
        value={buddyName}
        onChange={(e) => change(setBuddyName)(e.target.value)}
        maxLength={20}
        placeholder={`e.g. Sir ${character.name}-a-lot`}
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      />

      <p className="mt-4 mb-2 font-semibold">Pick a buddy</p>
      <div className="grid grid-cols-6 gap-2">
        {characters.map((c) => (
          <button
            key={c.id}
            onClick={() => change(setCharacterId)(c.id)}
            title={c.name}
            className={`rounded-lg p-2 text-3xl ${
              c.id === characterId ? "bg-orange-100 ring-2 ring-orange-500" : "hover:bg-gray-100"
            }`}
          >
            {c.emoji}
          </button>
        ))}
      </div>

      <p className="mt-4 mb-2 font-semibold">Pick a hat</p>
      {accessoryPicker(hats, hatId, change(setHatId))}

      <p className="mt-4 mb-2 font-semibold">Pick something to hold</p>
      {accessoryPicker(items, itemId, change(setItemId))}
      <p className="mt-2 text-xs text-gray-500">🔒 Keep reading to earn badges and unlock more!</p>

      <p className="mt-4 mb-2 font-semibold">Pick a background</p>
      <div className="flex flex-wrap gap-2">
        {backgroundColors.map((c) => (
          <button
            key={c}
            onClick={() => change(setColor)(c)}
            className={`h-9 w-9 rounded-full ${c} ${c === color ? "ring-2 ring-gray-700 ring-offset-2" : ""}`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {fancyBackgrounds.map((bg) => (
          <button
            key={bg.name}
            onClick={() => change(setColor)(bg.className)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${bg.className} ${
              bg.className === color ? "ring-2 ring-gray-700 ring-offset-2" : ""
            }`}
          >
            {bg.name}
          </button>
        ))}
      </div>

      <button
        onClick={saveCustomization}
        className="mt-6 rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600"
      >
        Save
      </button>
      {saved && <span className="ml-3 text-green-600">✓ Saved!</span>}
      {error && <span className="ml-3 text-red-600">Couldn't save: {error}</span>}
    </div>
  )
}

export default CharacterCustomizer
