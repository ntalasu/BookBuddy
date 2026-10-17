import type { ReactElement } from "react"
import { Navigate, Route, Routes } from "react-router"
import AppLayout from "./AppLayout"
import { useStudent } from "./context/StudentContext"
import ChatPage from "./pages/ChatPage"
import DiscoverPage from "./pages/DiscoverPage"
import ProfilePage from "./pages/ProfilePage"
import ProgressPage from "./pages/ProgressPage"
import WelcomePage from "./pages/WelcomePage"

function AppRoutes() {
  const { student } = useStudent()

  // only show the page if a student is signed in, otherwise send them to the welcome page
  function requireStudentSession(page: ReactElement) {
    return student ? page : <Navigate to="/welcome" replace />
  }

  return (
    <Routes>
      <Route path="/welcome" element={<WelcomePage />} />
      <Route element={requireStudentSession(<AppLayout />)}>
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/discover" replace />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
