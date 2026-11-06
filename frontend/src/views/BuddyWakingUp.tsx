import type { Student } from "../context/StudentContext"
import type { BuddyStatus } from "../hooks/useBuddyLoader"
import BuddyAvatar from "./BuddyAvatar"

type Props = {
  student: Student
  status: BuddyStatus
  progress: number // 0 to 1
  firstTime: boolean
}

// Shown in the chat while Buddy's AI is loading (or if it can't load on this device)
function BuddyWakingUp({ student, status, progress, firstTime }: Props) {
  const percent = Math.round(progress * 100)

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className={status === "loading" ? "animate-bounce" : ""}>
        <BuddyAvatar
          characterId={student.characterId}
          color={student.characterColor}
          hatId={student.hatId}
          itemId={student.itemId}
          size="lg"
        />
      </div>

      {status === "error" ? (
        <>
          <p className="text-xl font-bold">Oh no! Buddy can't wake up on this device. 😴</p>
          <p className="max-w-sm text-sm text-gray-600">
            Buddy needs a newer browser, like Chrome or Edge. Ask a grown-up for help!
          </p>
        </>
      ) : (
        <>
          <p className="text-xl font-bold">
            {firstTime ? "Downloading Buddy's brain…" : "Buddy is waking up…"} 💤
          </p>
          {firstTime && (
            <p className="max-w-sm text-sm text-gray-600">
              This only happens the first time, so it might take a few minutes. Next time it'll be quick!
            </p>
          )}
          <div className="h-4 w-64 overflow-hidden rounded-full bg-gray-200">
            <div className="h-4 rounded-full bg-orange-500 transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-sm font-semibold text-orange-600">{percent}%</p>
        </>
      )}
    </div>
  )
}

export default BuddyWakingUp
