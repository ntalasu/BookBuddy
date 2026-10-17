import { NavLink, Outlet } from "react-router"
import { useLoggedInStudent } from "./context/StudentContext"
import { findCharacter } from "./data/characters"

const tabs = [
  { to: "/discover", label: "📚 Discover" },
  { to: "/progress", label: "⭐ Progress" },
  { to: "/chat", label: "💬 Chat" },
  { to: "/profile", label: "👤 Profile" },
]

function AppLayout() {
  const { student, clearStudent } = useLoggedInStudent()
  const character = findCharacter(student.characterId)

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 p-4">
          <h1 className="text-3xl font-extrabold text-orange-600">BookBuddy</h1>
          <nav className="flex gap-2">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 font-semibold ${
                    isActive ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-orange-100"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className={`flex h-10 w-10 items-center justify-center rounded-full text-2xl ${student.characterColor}`}>
              {character.emoji}
            </span>
            <span className="font-semibold">{student.name}</span>
            <button onClick={clearStudent} className="ml-2 text-sm text-gray-500 hover:text-gray-800">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
