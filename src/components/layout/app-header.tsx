import { Menu, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BotId } from "@/types"

interface AppHeaderProps {
  onMenuClick: () => void
  selectedBot: BotId
  onBotChange: (bot: BotId) => void
}

export function AppHeader({
  onMenuClick,
  selectedBot,
  onBotChange,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-gold-500/10 bg-purple-900/80 backdrop-blur-xl px-4 md:px-6">
      {/* Left: menu toggle + title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden text-gold-500 hover:bg-gold-500/10"
        >
          <Menu size={20} />
        </Button>
        <h1 className="text-base md:text-lg font-heading font-bold text-gold-500 truncate">
          ศรีคเนศ เทวาลัย
        </h1>
      </div>

      {/* Right: bot selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-gold-500/20 bg-black/20 px-3 py-1.5">
          <Bot size={16} className="text-gold-500" />
          <select
            value={selectedBot}
            onChange={(e) => onBotChange(e.target.value as BotId)}
            className="bg-transparent text-sm text-white font-heading outline-none cursor-pointer"
          >
            <option value="Bot 1 Sriganett99" className="bg-purple-900">
              Bot 1: Sriganett99
            </option>
            <option value="Bot 2 ศรีคเนศ เทวาลัย" className="bg-purple-900">
              Bot 2: ศรีคเนศ เทวาลัย
            </option>
          </select>
        </div>

        {/* User avatar placeholder */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500/20 text-xs font-bold text-gold-500 font-heading">
          ด
        </div>
      </div>
    </header>
  )
}