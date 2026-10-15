import { useState } from "react"

type Props = {
  onSend: (message: string) => void
  disabled: boolean
}

function ChatInput({ onSend, disabled }: Props) {
  const [message, setMessage] = useState("")

  function submit() {
    const text = message.trim()
    if (text === "" || disabled) return
    onSend(text)
    setMessage("")
  }

  return (
    <div className="flex gap-2 border-t border-gray-200 p-4">
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit()
        }}
        placeholder="Ask BookBuddy anything about books…"
        className="flex-1 rounded-full border border-gray-300 px-4 py-2"
      />
      <button
        onClick={submit}
        disabled={disabled}
        className="rounded-full bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-40"
      >
        Send
      </button>
    </div>
  )
}

export default ChatInput
