import { useState } from "react"
import { ProfileApiService } from "../api/ProfileApiService"
import { useLoggedInStudent, type Student } from "../context/StudentContext"

type Profile = Pick<Student, "name" | "age" | "readingLevel" | "interests">

const ages = [4, 5, 6, 7, 8, 9, 10, 11, 12]
const readingLevels = ["Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"]
const interestGroups = [
  {
    title: "📚 Kinds of books I like",
    options: ["Adventure", "Mystery", "Funny", "Fantasy", "Magic", "Fairy Tales", "Spooky", "Superheroes", "Comics", "Poetry", "Jokes & Riddles"],
  },
  {
    title: "⭐ Things I'm into",
    options: ["Animals", "Pets", "Dinosaurs", "Bugs", "Ocean", "Nature", "Space", "Robots", "Science", "How Things Work", "History", "Real People", "Pirates", "Sports", "Art", "Music", "Cooking"],
  },
  {
    title: "🎉 Fun stuff",
    options: [
      "Friendship", "Family", "School", "Holidays", "Birthdays",
      "Video Games", "Toys", "Building Things", "Trucks & Cars", "Trains",
      "Knights & Castles", "Princesses", "Monsters", "Magic Tricks", "Camping", "Treats & Sweets",
    ],
  },
]

function ReadingProfileForm() {
  const { student, updateStudent } = useLoggedInStudent()
  const [profile, setProfile] = useState<Profile>({
    name: student.name,
    age: student.age,
    readingLevel: student.readingLevel,
    interests: student.interests,
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // copy the old profile and change just the fields that were edited
  function updateProfile(changes: Partial<Profile>) {
    setProfile({ ...profile, ...changes })
    setSaved(false)
  }

  function toggleInterest(interest: string) {
    const interests = profile.interests.includes(interest)
      ? profile.interests.filter((i) => i !== interest)
      : [...profile.interests, interest]
    updateProfile({ interests })
  }

  async function submit() {
    try {
      const savedProfile = await ProfileApiService.updateProfile(student.id, profile)
      updateStudent(savedProfile)
      setSaved(true)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-lg">
      <h3 className="mb-4 text-xl font-bold">About Me</h3>

      <label className="mb-1 block font-semibold">My name</label>
      <input
        value={profile.name}
        onChange={(e) => updateProfile({ name: e.target.value })}
        placeholder="Type your name"
        className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2"
      />

      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <label className="mb-1 block font-semibold">Age</label>
          <select
            value={profile.age}
            onChange={(e) => updateProfile({ age: Number(e.target.value) })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            {ages.map((age) => (
              <option key={age} value={age}>
                {age}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block font-semibold">Reading level</label>
          <select
            value={profile.readingLevel}
            onChange={(e) => updateProfile({ readingLevel: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            {readingLevels.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      {interestGroups.map((group) => (
        <div key={group.title} className="mb-5">
          <p className="mb-2 font-semibold">{group.title}</p>
          <div className="flex flex-wrap gap-2">
            {group.options.map((interest) => {
              const picked = profile.interests.includes(interest)
              return (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    picked ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-orange-100"
                  }`}
                >
                  {interest}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <div className="mb-6" />

      <button
        onClick={submit}
        className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600"
      >
        Save
      </button>
      {saved && <span className="ml-3 text-green-600">✓ Saved!</span>}
      {error && <span className="ml-3 text-red-600">Couldn't save: {error}</span>}
    </div>
  )
}

export default ReadingProfileForm
