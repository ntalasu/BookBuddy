import { useState } from "react"
import { ProfileApiService, type ProfileUpdate } from "../api/ProfileApiService"
import { useLoggedInStudent } from "../context/StudentContext"

type Profile = ProfileUpdate

const readingLevels = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"]
const interestOptions = ["Animals", "Adventure", "Mystery", "Funny", "Magic", "Space", "Sports", "Robots", "Friendship"]

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
          <input
            type="number"
            min="4"
            max="14"
            value={profile.age}
            onChange={(e) => updateProfile({ age: Number(e.target.value) })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
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

      <p className="mb-2 font-semibold">I like books about…</p>
      <div className="mb-6 flex flex-wrap gap-2">
        {interestOptions.map((interest) => {
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
