import BookDiscoveryView from "./views/BookDiscoveryView"
import ReadingProgressView from "./views/ReadingProgressView"
function App() {
  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <h1 className="text-4xl font-extrabold text-orange-600">BookBuddy</h1>
      <p className="text-gray-600">Welcome! Let's find a great book.</p>
      <BookDiscoveryView />
      <ReadingProgressView />
    </div>
  )
}

export default App

