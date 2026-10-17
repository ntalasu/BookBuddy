import { useState } from "react"
import { useLoggedInStudent } from "../context/StudentContext"
import { backgroundColors, characters, findCharacter } from "../data/characters"

function CharacterCustomizer() {
  const { student, updateStudent } = useLoggedInStudent()
  const [characterId, setCharacterId] = useState(student.characterId)
  const [color, setColor] = useState(student.characterColor)
  const [saved, setSaved] = useState(false)

  const character = findCharacter(characterId)

  function selectCharacter(id: string) {
    setCharacterId(id)
    setSaved(false)
  }

  function selectColor(newColor: string) {
    setColor(newColor)
    setSaved(false)
  }

  function saveCustomization() {
    // later this will also send the choice to the backend
    updateStudent({ characterId, characterColor: color })
    setSaved(true)
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-lg">
      <h3 className="mb-4 text-xl font-bold">My Reading Buddy</h3>

      {/* big preview */}
      <div className={`mx-auto flex h-32 w-32 items-center justify-center rounded-full text-7xl ${color}`}>
        {character.emoji}
      </div>
      <p className="mt-2 text-center font-semibold">{character.name}</p>

      <p className="mt-4 mb-2 font-semibold">Pick a buddy</p>
      <div className="grid grid-cols-6 gap-2">
        {characters.map((c) => (
          <button
            key={c.id}
            onClick={() => selectCharacter(c.id)}
            title={c.name}
            className={`rounded-lg p-2 text-3xl ${
              c.id === characterId ? "bg-orange-100 ring-2 ring-orange-500" : "hover:bg-gray-100"
            }`}
          >
            {c.emoji}
          </button>
        ))}
      </div>

      <p className="mt-4 mb-2 font-semibold">Pick a color</p>
      <div className="flex gap-2">
        {backgroundColors.map((c) => (
          <button
            key={c}
            onClick={() => selectColor(c)}
            className={`h-9 w-9 rounded-full ${c} ${c === color ? "ring-2 ring-gray-700 ring-offset-2" : ""}`}
          />
        ))}
      </div>

      <button
        onClick={saveCustomization}
        className="mt-6 rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600"
      >
        Save
      </button>
      {saved && <span className="ml-3 text-green-600">✓ Saved!</span>}
    </div>
  )
}

export default CharacterCustomizer
