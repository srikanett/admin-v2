import { useState, useEffect, useMemo, useCallback } from "react"
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  limit,
  type DocumentSnapshot,
  type DocumentData,
} from "firebase/firestore"
import { getDbInstance, isInitialized } from "@/lib/firebase"
import { COLLECTIONS } from "@/lib/constants"
import { readField_ } from "@/lib/helpers"
import { GlassPanel } from "@/components/ui/glass-panel"
import { GoldButton } from "@/components/ui/gold-button"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Search,
  MessageCircle,
  ShoppingBag,
  Clock,
  Tag,
  User,
  Hash,
  MessageSquareText,
  ExternalLink,
  X,
} from "lucide-react"

// ── Types ──

interface LineCustomer {
  id: string
  displayName: string
  pictureUrl: string
  userId: string
  statusMessage: string
  lastInteraction: string
  orderCount: number
  tags: string[]
}

// ── Transform Firestore doc → LineCustomer ──

function transformLineCustomer(
  doc: DocumentSnapshot<DocumentData>
): LineCustomer {
  const data = doc.data() ?? {}
  const lastInteractionRaw = readField_(doc, ["lastInteraction", "lastInteractionTime"], null)

  let lastInteraction = ""
  if (lastInteractionRaw) {
    try {
      // Firestore Timestamp
      const raw = lastInteractionRaw as Record<string, unknown>
      if (typeof raw === "object" && raw !== null && "toDate" in raw && typeof (raw as { toDate: unknown }).toDate === "function") {
        lastInteraction = (raw as { toDate: () => Date }).toDate().toLocaleString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      } else if (typeof lastInteractionRaw === "string") {
        lastInteraction = new Date(lastInteractionRaw).toLocaleString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      }
    } catch {
      lastInteraction = String(lastInteractionRaw)
    }
  }

  const tags = data.tags ?? []
  const tagsArray = Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",").map((t: string) => t.trim()).filter(Boolean) : []

  return {
    id: doc.id,
    displayName: readField_(doc, ["displayName", "display_name", "name"], "ไม่ทราบชื่อ")!,
    pictureUrl: readField_(doc, ["pictureUrl", "picture_url", "avatarUrl", "photoUrl"], "")!,
    userId: readField_(doc, ["userId", "user_id", "lineUserId", "lineUserId"], "")!,
    statusMessage: readField_(doc, ["statusMessage", "status_message", "bio"], "")!,
    lastInteraction,
    orderCount: readField_<number>(doc, ["orderCount", "order_count"], 0) ?? 0,
    tags: tagsArray,
  }
}

// ── Get initials from display name ──

function getInitials(name: string): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// ── Relative time helper ──

function relativeTime(dateStr: string): string {
  if (!dateStr) return "ไม่ทราบ"
  try {
    const date = new Date(dateStr.split(" ")[0].split("/").reverse().join("-"))
    if (isNaN(date.getTime())) return dateStr

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "เมื่อสักครู่"
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} สัปดาห์ที่แล้ว`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} เดือนที่แล้ว`
    return `${Math.floor(diffDays / 365)} ปีที่แล้ว`
  } catch {
    return dateStr
  }
}

// ── Main Component ──

export function lineCustomersView() {
  const [customers, setCustomers] = useState<LineCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<LineCustomer | null>(null)

  // ── Realtime Firestore subscription ──
  useEffect(() => {
    if (!isInitialized()) {
      setLoading(false)
      return
    }
    const db = getDbInstance()
    const q = query(
      collection(db, COLLECTIONS.LINE_CUSTOMERS),
      orderBy("displayName"),
      limit(500)
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setCustomers(snap.docs.map(transformLineCustomer))
        setLoading(false)
      },
      (err) => {
        console.error("lineCustomers onSnapshot error:", err)
        setLoading(false)
      }
    )
    return unsub
  }, [])

  // ── Filtered list ──
  const filtered = useMemo(() => {
    if (!search.trim()) return customers
    const s = search.toLowerCase()
    return customers.filter(
      (c) =>
        c.displayName.toLowerCase().includes(s) ||
        c.userId.toLowerCase().includes(s)
    )
  }, [customers, search])

  // ── Open detail view ──
  const openDetail = useCallback((c: LineCustomer) => {
    setSelectedCustomer(c)
  }, [])

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/15">
            <MessageCircle size={22} className="text-green-400" />
          </div>
          <div>
            <h1 className="aurora-heading text-xl md:text-2xl">ลูกค้า LINE</h1>
            <p className="text-gold-100/30 text-sm mt-0.5">
              จัดการลูกค้าที่เชื่อมต่อผ่าน LINE
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-gold-500/15 text-gold-300 border-gold-500/20 px-3 py-1.5 text-xs">
            <Users size={12} />
            {filtered.length} คน
          </Badge>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-100/30 pointer-events-none"
        />
        <input
          className="themed-input pl-10"
          placeholder="ค้นหาด้วยชื่อ, LINE User ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-100/30 hover:text-gold-100/60 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <GlassPanel className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-8 w-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
            <p className="text-gold-100/30 text-sm">กำลังโหลดข้อมูล...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={48} className="text-gold-100/15 mb-3" />
            <p className="text-gold-100/30 text-sm">
              {search ? "ไม่พบลูกค้าที่ค้นหา" : "ยังไม่มีลูกค้า LINE"}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-2 text-xs text-gold-400 hover:text-gold-300 transition-colors"
              >
                ล้างการค้นหา
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[56px]"></TableHead>
                  <TableHead className="w-[200px]">ชื่อที่แสดง</TableHead>
                  <TableHead className="w-[180px]">LINE User ID</TableHead>
                  <TableHead className="w-[80px] text-center">ออเดอร์</TableHead>
                  <TableHead className="w-[150px]">โต้ตอบล่าสุด</TableHead>
                  <TableHead className="w-[100px]">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-gold-500/5 transition-colors"
                    onClick={() => openDetail(c)}
                  >
                    <TableCell>
                      <Avatar size="sm" className="ring-2 ring-gold-500/20">
                        {c.pictureUrl ? (
                          <AvatarImage src={c.pictureUrl} alt={c.displayName} />
                        ) : null}
                        <AvatarFallback className="bg-purple-800/60 text-gold-300 text-xs font-bold">
                          {getInitials(c.displayName)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium text-gold-100/90">
                      {c.displayName}
                    </TableCell>
                    <TableCell className="text-gold-100/50 text-xs font-mono">
                      {c.userId || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.orderCount > 0
                            ? "bg-gold-500/15 text-gold-300"
                            : "bg-gold-100/5 text-gold-100/30"
                        }`}
                      >
                        <ShoppingBag size={11} />
                        {c.orderCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-gold-100/40 text-xs">
                      {c.lastInteraction ? (
                        <span title={c.lastInteraction}>
                          {relativeTime(c.lastInteraction)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {c.orderCount > 0 ? (
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] px-1.5 py-0">
                          มีออเดอร์
                        </Badge>
                      ) : (
                        <Badge className="bg-gold-100/5 text-gold-100/30 border-gold-100/10 text-[10px] px-1.5 py-0">
                          ใหม่
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassPanel>

      {/* ═══ Detail Dialog ═══ */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="sr-only">
                  รายละเอียดลูกค้า {selectedCustomer.displayName}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  ข้อมูลลูกค้า LINE
                </DialogDescription>
              </DialogHeader>

              {/* ── Profile Header ── */}
              <div className="flex flex-col items-center gap-4 pt-2">
                <Avatar size="lg" className="ring-4 ring-gold-500/30 shadow-lg shadow-gold-500/10">
                  {selectedCustomer.pictureUrl ? (
                    <AvatarImage
                      src={selectedCustomer.pictureUrl}
                      alt={selectedCustomer.displayName}
                    />
                  ) : null}
                  <AvatarFallback className="bg-purple-800/80 text-gold-300 text-xl font-bold">
                    {getInitials(selectedCustomer.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-lg font-bold text-gold-100 font-heading">
                    {selectedCustomer.displayName}
                  </h2>
                  {selectedCustomer.userId && (
                    <p className="text-gold-100/40 text-xs font-mono mt-1">
                      {selectedCustomer.userId}
                    </p>
                  )}
                </div>
                {selectedCustomer.statusMessage && (
                  <div className="w-full text-center">
                    <p className="text-gold-100/50 text-sm italic bg-gold-500/5 rounded-xl px-4 py-2 border border-gold-500/10">
                      <MessageSquareText size={14} className="inline mr-1.5 text-gold-400" />
                      {selectedCustomer.statusMessage}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-gold-500/10" />

              {/* ── Stats Grid ── */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-panel p-4 text-center">
                  <ShoppingBag size={20} className="mx-auto text-gold-400 mb-1.5" />
                  <p className="text-2xl font-bold text-gold-100 font-heading">
                    {selectedCustomer.orderCount}
                  </p>
                  <p className="text-gold-100/40 text-xs mt-0.5">ออเดอร์ทั้งหมด</p>
                </div>
                <div className="glass-panel p-4 text-center">
                  <Clock size={20} className="mx-auto text-gold-400 mb-1.5" />
                  <p className="text-sm font-medium text-gold-100 font-heading">
                    {selectedCustomer.lastInteraction ? relativeTime(selectedCustomer.lastInteraction) : "ไม่ทราบ"}
                  </p>
                  <p className="text-gold-100/40 text-xs mt-0.5">โต้ตอบล่าสุด</p>
                </div>
              </div>

              {/* ── Detail Info ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User size={16} className="text-gold-400 flex-shrink-0" />
                  <span className="text-gold-100/40 w-28 flex-shrink-0">ชื่อที่แสดง</span>
                  <span className="text-gold-100/80">{selectedCustomer.displayName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Hash size={16} className="text-gold-400 flex-shrink-0" />
                  <span className="text-gold-100/40 w-28 flex-shrink-0">LINE User ID</span>
                  <span className="text-gold-100/80 font-mono text-xs">
                    {selectedCustomer.userId || "-"}
                  </span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MessageSquareText size={16} className="text-gold-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gold-100/40 w-28 flex-shrink-0">ข้อความสถานะ</span>
                  <span className="text-gold-100/80">
                    {selectedCustomer.statusMessage || "-"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={16} className="text-gold-400 flex-shrink-0" />
                  <span className="text-gold-100/40 w-28 flex-shrink-0">โต้ตอบล่าสุด</span>
                  <span className="text-gold-100/80">
                    {selectedCustomer.lastInteraction || "ไม่ทราบ"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShoppingBag size={16} className="text-gold-400 flex-shrink-0" />
                  <span className="text-gold-100/40 w-28 flex-shrink-0">จำนวนออเดอร์</span>
                  <span className="text-gold-100/80">{selectedCustomer.orderCount} ออเดอร์</span>
                </div>
              </div>

              {/* ── Tags ── */}
              {selectedCustomer.tags.length > 0 && (
                <>
                  <div className="border-t border-gold-500/10" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gold-100/40">
                      <Tag size={14} />
                      แท็ก
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCustomer.tags.map((tag, idx) => (
                        <Badge
                          key={idx}
                          className="bg-purple-800/30 text-gold-300 border-purple-700/30 text-xs px-2 py-0.5"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── Actions ── */}
              <div className="border-t border-gold-500/10 pt-2 flex justify-end gap-2">
                <GoldButton variant="ghost" onClick={() => setSelectedCustomer(null)}>
                  ปิด
                </GoldButton>
                {selectedCustomer.userId && (
                  <GoldButton
                    variant="purple"
                    icon={<ExternalLink size={14} />}
                    onClick={() => {
                      // Open LINE chat if possible
                      window.open(`https://line.me/ti/p/~${selectedCustomer.userId}`, "_blank")
                    }}
                  >
                    เปิดแชท LINE
                  </GoldButton>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}