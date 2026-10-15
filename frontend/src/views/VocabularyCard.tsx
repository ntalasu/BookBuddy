type Props = {
  word: string
  definition: string
  onClose: () => void
}

function VocabularyCard({ word, definition, onClose }: Props) {
  return (
    <div className="m-4 rounded-xl border-2 border-sky-300 bg-sky-50 p-4">
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold text-sky-700">📘 New word</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
      <p className="text-2xl font-bold">{word}</p>
      <p className="mt-1">{definition}</p>
    </div>
  )
}

export default VocabularyCard
