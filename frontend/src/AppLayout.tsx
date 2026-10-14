import { NavLink, Outlet } from "react-router"

const tabs = [
  { to: "/discover", label: "📚 Discover" },
  { to: "/progress", label: "⭐ Progress" },
  { to: "/chat", label: "💬 Chat" },
  { to: "/profile", label: "👤 Profile" },
]

function AppLayout() {
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
        </div>
      </header>

      <main className="mx-auto max-w-5xl">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
