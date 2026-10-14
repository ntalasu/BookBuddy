import { useEffect, useState } from "react"

type Props = {
  onFinish: (minutes: number) => void
}

function ReadingTimer({ onFinish }: Props) {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [running])

  function start() {
    setRunning(true)
  }

  function pause() {
    setRunning(false)
  }

  function stop() {
    setRunning(false)
    const minutes = Math.round(seconds / 60)
    if (minutes > 0) onFinish(minutes)
    setSeconds(0)
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0")
  const ss = String(seconds % 60).padStart(2, "0")

  return (
    <div className="text-center">
      <p className="mb-2 font-semibold">Reading timer</p>
      <p className="font-mono text-5xl font-bold text-orange-600">{mm}:{ss}</p>
      <div className="mt-4 flex justify-center gap-2">
        {running ? (
          <button onClick={pause} className="rounded-lg bg-yellow-400 px-5 py-2 font-semibold hover:bg-yellow-500">
            Pause
          </button>
        ) : (
          <button onClick={start} className="rounded-lg bg-green-500 px-5 py-2 font-semibold text-white hover:bg-green-600">
            {seconds === 0 ? "Start reading" : "Keep reading"}
          </button>
        )}
        <button
          onClick={stop}
          disabled={seconds === 0}
          className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-40"
        >
          I'm done!
        </button>
      </div>
    </div>
  )
}

export default ReadingTimer
