import CharacterCustomizer from "../views/CharacterCustomizer"
import ReadingProfileForm from "../views/ReadingProfileForm"

function ProfilePage() {
  return (
    <section className="p-6">
      <h2 className="mb-4 text-2xl font-bold">My Profile</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <ReadingProfileForm />
        <CharacterCustomizer />
      </div>
    </section>
  )
}

export default ProfilePage
