import type { Student } from "../context/StudentContext"
import BuddyAvatar from "./BuddyAvatar"

type Props = {
  student: Student
  progress: number // 0 to 1
  firstTime: boolean
}

// A small bar at the top of the chat while Buddy's AI is loading.
// Kids can already chat while they wait: the simple chat answers until the AI is ready.
function BuddyWakingUp({ student, progress, firstTime }: Props) {
  const percent = Math.round(progress * 100)

  return (
    <div className="flex items-center gap-3 rounded-t-xl border-b border-orange-100 bg-orange-50 px-4 py-2">
      <div className="animate-bounce">
        <BuddyAvatar
          characterId={student.characterId}
          color={student.characterColor}
          hatId={student.hatId}
          itemId={student.itemId}
          size="sm"
        />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-orange-800">
          {firstTime ? "Downloading Buddy's brain" : "Buddy is waking up"}… {percent}% 💤
        </p>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-orange-100">
          <div className="h-2 rounded-full bg-orange-500 transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          You can chat while you wait!{firstTime ? " This only takes a while the first time." : ""}
        </p>
      </div>
    </div>
  )
}

export default BuddyWakingUp
