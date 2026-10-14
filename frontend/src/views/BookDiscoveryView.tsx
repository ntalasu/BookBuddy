import { useState } from "react"

type Book = {
  id: string
  title: string
  author: string
  readingLevel: string
  genres: string[]
  coverUrl: string
}

const books: Book[] = [
  { id: "1", title: "The Great Gatsby", author: "F. Scott Fitzgerald", readingLevel: "Advanced", genres: ["Fiction", "Classic"], coverUrl: "https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg" },
  { id: "2", title: "Charlotte's Web", author: "E. B. White", readingLevel: "Grade 3", genres: ["Animals", "Friendship"], coverUrl: "https://covers.openlibrary.org/b/isbn/9780064400558-M.jpg" },
  { id: "3", title: "Matilda", author: "Roald Dahl", readingLevel: "Grade 4", genres: ["Funny", "Magic"], coverUrl: "https://covers.openlibrary.org/b/isbn/9780142410370-M.jpg" },
  { id: "4", title: "The Wild Robot", author: "Peter Brown", readingLevel: "Grade 3", genres: ["Adventure", "Robots"], coverUrl: "https://covers.openlibrary.org/b/isbn/9780316381994-M.jpg" },
  { id: "5", title: "Holes", author: "Louis Sachar", readingLevel: "Grade 5", genres: ["Mystery", "Adventure"], coverUrl: "https://covers.openlibrary.org/b/isbn/9780440414803-M.jpg" },
]

const spineColors = ["bg-red-800", "bg-blue-800", "bg-emerald-700", "bg-amber-600", "bg-purple-800"]
const spineHeights = ["h-80", "h-72", "h-76", "h-68", "h-80"]

function BookDiscoveryView() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  return (
    <section className="p-6">
      <h2 className="mb-4 text-2xl font-bold">Your Bookshelf</h2>

      {/* the shelf */}
      <div className="flex items-end gap-1 border-b-[16px] border-amber-900 px-4">
        {books.map((book, index) => {
          const isSelected = selectedBook?.id === book.id
          return (
            // one book spine
            <button
              key={book.id}
              onClick={() => setSelectedBook(book)}
              className={`${spineColors[index % spineColors.length]} ${spineHeights[index % spineHeights.length]}
                flex w-14 cursor-pointer justify-between overflow-hidden rounded-t-sm px-2 py-3 text-white shadow-lg
                transition-transform [writing-mode:vertical-rl]
                ${isSelected ? "-translate-y-6" : "hover:-translate-y-2"}`}
            >
              <span className="font-bold">{book.title}</span>
              <span className="text-xs opacity-80">{book.author}</span>
            </button>
          )
        })}
      </div>

      {/* details card for the book that was clicked */}
      {selectedBook && (
        <div className="mt-8 flex max-w-xl gap-6 rounded-xl bg-white p-6 shadow-lg">
          <img
            src={selectedBook.coverUrl}
            alt={`Cover of ${selectedBook.title}`}
            className="w-32 rounded shadow-md"
          />
          <div>
            <h3 className="text-2xl font-bold">{selectedBook.title}</h3>
            <p className="text-gray-600">by {selectedBook.author}</p>
            <p className="mt-3 text-sm font-semibold">{selectedBook.readingLevel}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedBook.genres.map((genre) => (
                <span key={genre} className="rounded-full bg-amber-100 px-3 py-1 text-sm">
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default BookDiscoveryView
