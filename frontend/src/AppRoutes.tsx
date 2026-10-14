import { Navigate, Route, Routes } from "react-router"
import AppLayout from "./AppLayout"
import ChatPage from "./pages/ChatPage"
import DiscoverPage from "./pages/DiscoverPage"
import ProfilePage from "./pages/ProfilePage"
import ProgressPage from "./pages/ProgressPage"

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
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
