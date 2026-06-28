import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  Home,
  Camera,
  Zap,
  Search,
  Printer,
  FileText,
  MapPin,
  Cake,
  FolderOpen,
  BarChart3,
  Package,
  ScrollText,
  Truck,
  Receipt,
  Image,
  IdCard,
  FileImage,
  Settings,
  Play,
  MessageSquare,
  Users,
  Send,
  Key,
  LogOut,
  LogIn,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// ── Menu Structure ──
interface MenuGroup {
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
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-72 overflow-y-auto border-r border-gold-500/10 bg-purple-900/95 backdrop-blur-xl transition-transform duration-300",
          "md:relative md:translate-x-0 md:w-64 lg:w-72",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-gold-500/10 px-4 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gold-500 to-gold-800 text-sm font-bold text-black font-heading">
            ศ
          </div>
          <div>
            <h2 className="text-sm font-heading font-bold text-gold-500">
              ศรีคเนศ เทวาลัย
            </h2>
            <p className="text-[10px] text-gold-100/50">SRIKANETT DHEVALAI</p>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-0.5 p-3">
          {menuGroups.map((group) => (
            <div key={group.label} className="mb-1">
              {group.label && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex w-full items-center gap-1 px-3 py-1.5 text-[11px] font-heading font-medium text-gold-100/40 uppercase tracking-wider hover:text-gold-100/60 transition-colors"
                >
                  {collapsedGroups.has(group.label) ? (
                    <ChevronRight size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                  {group.label}
                </button>
              )}

              {!collapsedGroups.has(group.label) && (
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                          isActive
                            ? "bg-gold-500/15 text-gold-500 font-medium border border-gold-500/20"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <span
                          className={cn(
                            "flex-shrink-0",
                            isActive ? "text-gold-500" : "text-gold-100/40"
                          )}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-gold-500/10 px-4 py-3 mt-auto">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gold-100/50 hover:text-gold-500 hover:bg-gold-500/10"
          >
            <Key size={16} className="mr-2" />
            เปลี่ยนรหัสผ่าน
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="w-full justify-start text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/10"
          >
            <LogOut size={16} className="mr-2" />
            ออกจากระบบ
          </Button>
        </div>
      </aside>
    </>
  )
}