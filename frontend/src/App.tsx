import { BrowserRouter } from "react-router"
import AppRoutes from "./AppRoutes"
import StudentProvider from "./context/StudentProvider"

function App() {
  return (
    <BrowserRouter>
      <StudentProvider>
        <AppRoutes />
      </StudentProvider>
    </BrowserRouter>
  )
}

export default App
