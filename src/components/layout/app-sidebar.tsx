import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  Home, Camera, Zap, Search, Printer, FileText,
  MapPin, Cake, FolderOpen, BarChart3, Package,
  ScrollText, Truck, Receipt, Image, IdCard,
  FileImage, Settings, Play, MessageSquare, Users,
  Send, Key, LogOut, ChevronDown, ChevronRight,
  Sparkles,
} from "lucide-react"

type MenuGroup = {
  label: string
  items: { icon: React.ReactNode; label: string; path: string }[]
}

const menuGroups: MenuGroup[] = [
  {
    label: "",
    items: [{ icon: <Home size={18} />, label: "สร้างออร์เดอร์ใหม่", path: "/create-order" }],
  },
  {
    label: "เครื่องมือ",
    items: [
      { icon: <Camera size={18} />, label: "สแกนสลิปขนส่ง", path: "/scanner" },
      { icon: <Zap size={18} />, label: "สั่งซื้อด่วน", path: "/quick-order" },
      { icon: <Search size={18} />, label: "ค้นหาข้อมูลจัดส่ง", path: "/search" },
    ],
  },
  {
    label: "การพิมพ์",
    items: [
      { icon: <Printer size={18} />, label: "พิมพ์รายรับ", path: "/print-receipt" },
      { icon: <FileText size={18} />, label: "การพิมพ์คำสั่งซื้อ", path: "/print-quick-order" },
    ],
  },
  {
    label: "จัดการลูกค้า",
    items: [
      { icon: <MapPin size={18} />, label: "จัดการที่อยู่", path: "/customers" },
      { icon: <Cake size={18} />, label: "จัดการวันเกิด", path: "/participants" },
      { icon: <FolderOpen size={18} />, label: "จัดการชีต", path: "/sheets" },
    ],
  },
  {
    label: "คลังสินค้าและขนส่ง",
    items: [
      { icon: <BarChart3 size={18} />, label: "ภาพรวมสต็อก", path: "/inventory" },
      { icon: <Package size={18} />, label: "จัดการสินค้า", path: "/products" },
      { icon: <ScrollText size={18} />, label: "จัดการพิธี", path: "/ceremonies" },
      { icon: <Truck size={18} />, label: "จัดการค่าส่ง", path: "/shipping" },
    ],
  },
  {
    label: "รายงาน/บัญชี",
    items: [
      { icon: <BarChart3 size={18} />, label: "รายงาน", path: "/reports" },
      { icon: <Receipt size={18} />, label: "จัดการบิลรายจ่าย", path: "/bills" },
    ],
  },
  {
    label: "จัดการภาพ",
    items: [
      { icon: <Image size={18} />, label: "คลังภาพ", path: "/gallery" },
      { icon: <IdCard size={18} />, label: "ภาพร่วมพิธี", path: "/ceremony-cards" },
      { icon: <FileImage size={18} />, label: "จัดการภาพสลิป", path: "/slips" },
    ],
  },
  {
    label: "ระบบแจ้งเตือน",
    items: [
      { icon: <Settings size={18} />, label: "ตั้งค่า LINE Bot", path: "/line-bot" },
      { icon: <Play size={18} />, label: "รันงาน Cloud Functions", path: "/system-tools" },
      { icon: <MessageSquare size={18} />, label: "จัดการข้อความตอบกลับ", path: "/reply-rules" },
      { icon: <Users size={18} />, label: "ลูกค้า LINE", path: "/line-customers" },
      { icon: <Send size={18} />, label: "ส่งบอร์ดแคสต์ LINE", path: "/broadcast" },
    ],
  },
]

interface AppSidebarProps {
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
}

export function AppSidebar({ isOpen, onClose, onLogout }: AppSidebarProps) {
  const location = useLocation()
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full w-72 flex-col border-r border-gold-500/10",
          "bg-gradient-to-b from-[#0D0A1F] via-[#1D1A39] to-[#0F0C22]",
          "transition-transform duration-300",
          "md:relative md:translate-x-0 md:w-64 lg:w-72",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand header */}
        <div className="relative border-b border-gold-500/10 px-4 py-5">
          <div className="absolute inset-0 bg-gradient-to-r from-gold-500/5 via-transparent to-transparent" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 to-gold-800 shadow-lg shadow-gold-500/20">
              <span className="text-lg">🕉️</span>
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide text-gold-500">ศรีคเนศ เทวาลัย</h2>
              <p className="text-[10px] tracking-[0.15em] text-gold-100/30 uppercase">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {menuGroups.map((group) => (
            <div key={group.label}>
              {group.label && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex w-full items-center gap-1.5 px-3 py-2 text-[11px] font-medium tracking-widest text-gold-100/30 hover:text-gold-100/50 uppercase transition-colors"
                >
                  {collapsedGroups.has(group.label) ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  {group.label}
                </button>
              )}

              {!collapsedGroups.has(group.label) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 group",
                          isActive
                            ? "bg-gold-500/12 text-gold-500 font-medium border border-gold-500/15 shadow-inner shadow-gold-500/5"
                            : "text-white/55 hover:bg-white/[0.03] hover:text-white/80"
                        )}
                      >
                        <span className={cn(
                          "flex-shrink-0 transition-colors",
                          isActive ? "text-gold-500" : "text-gold-100/25 group-hover:text-gold-100/50"
                        )}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-gold-500 shadow-sm shadow-gold-500/50" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-gold-500/10 px-3 py-3 space-y-1">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/40 hover:bg-white/[0.03] hover:text-gold-500/70 transition-colors">
            <Key size={16} />
            เปลี่ยนรหัสผ่าน
          </button>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-500/40 hover:bg-rose-500/5 hover:text-rose-400 transition-colors"
          >
            <LogOut size={16} />
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  )
}