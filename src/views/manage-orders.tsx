import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
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
import { readField_, formatThaiCurrency } from "@/lib/helpers"
import { updateOrder } from "@/hooks/use-orders"
import { ORDER_STATUS, STATUS_CONFIG, type OrderStatus } from "@/types"
import type { Order } from "@/types"
import { StatusBadge } from "@/components/ui/status-badge"
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
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Package,
  Search,
  Eye,
  Edit3,
  ChevronLeft,
  ChevronRight,
  XCircle,
  AlertTriangle,
  Filter,
} from "lucide-react"

// ── Status transitions ──
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [ORDER_STATUS.CREATED]: [ORDER_STATUS.PAID_SUCCESS, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PAID_SUCCESS]: [ORDER_STATUS.PENDING_REVIEW, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PENDING_REVIEW]: [ORDER_STATUS.SHIPPING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPING]: [ORDER_STATUS.DONE, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.DONE]: [],
  [ORDER_STATUS.CANCELLED]: [],
}

const ALL_STATUSES = Object.values(ORDER_STATUS)

// ── Transform Firestore doc → Order ──
function transformOrder(doc: DocumentSnapshot<DocumentData>): Order & { _docId: string } {
  return {
    _docId: doc.id,
    id: doc.id,
    OrderID: readField_(doc, ["OrderID", "orderID", "orderId"], "")!,
    Date: readField_(doc, ["Date", "date"], "")!,
    CustomerName: readField_(doc, ["CustomerName", "customerName", "customer_name"], "")!,
    CustomerPhone: readField_(doc, ["CustomerPhone", "customerPhone", "customer_phone"], "")!,
    CustomerAddress: readField_(doc, ["CustomerAddress", "customerAddress"], ""),
    CustomerBirthday: readField_(doc, ["CustomerBirthday", "customerBirthday"], ""),
    Status: readField_(doc, ["Status", "status"], ORDER_STATUS.CREATED)!,
    TotalPrice: readField_(doc, ["TotalPrice", "totalPrice"], 0)!,
    ShippingFee: readField_(doc, ["ShippingFee", "shippingFee"], 0)!,
    ShippingRateName: readField_(doc, ["ShippingRateName", "shippingRateName"], ""),
    DueDate: readField_(doc, ["DueDate", "dueDate"], ""),
    Note: readField_(doc, ["Note", "note"], ""),
    SlipURL: readField_(doc, ["SlipURL", "slipURL", "slipUrl"], ""),
    PaymentMethod: readField_(doc, ["PaymentMethod", "paymentMethod"], "โอน")!,
    Bank_Name: readField_(doc, ["Bank_Name", "bankName"], ""),
    Bank_Account: readField_(doc, ["Bank_Account", "bankAccount"], ""),
    Bank_Holder: readField_(doc, ["Bank_Holder", "bankHolder"], ""),
    PromptPay_Id: readField_(doc, ["PromptPay_Id", "promptPayId"], ""),
    PromptPay_Type: readField_(doc, ["PromptPay_Type", "promptPayType"], ""),
    LineChannelID: readField_(doc, ["LineChannelID", "lineChannelID"], ""),
    isArchived: readField_(doc, ["isArchived", "IsArchived"], false),
  }
}

// ── Helper: extract item fields from flat Firestore doc ──
interface OrderItemData {
  name: string
  unitPrice: number
  quantity: number
  discount: number
  price: number
}

function extractItems(order: Order & { _docId: string }): OrderItemData[] {
  const items: OrderItemData[] = []
  for (let i = 1; i <= 20; i++) {
    const nameKey = `Item${i}Name`
    const name = (order as Record<string, unknown>)[nameKey] as string | undefined
    if (!name || !name.trim()) continue
    const unitPrice = ((order as Record<string, unknown>)[`Item${i}UnitPrice`] as number) ?? 0
    const quantity = ((order as Record<string, unknown>)[`Item${i}Qty`] as number) ?? 0
    const discount = ((order as Record<string, unknown>)[`Item${i}Discount`] as number) ?? 0
    const price = ((order as Record<string, unknown>)[`Item${i}Price`] as number) ?? 0
    items.push({ name, unitPrice, quantity, discount, price })
  }
  return items
}

// ── Status label mapper (for display in dropdowns) ──
function statusLabel(s: OrderStatus): string {
  return STATUS_CONFIG[s]?.label ?? s
}

export function manageOrderView() {
  const navigate = useNavigate()

  // ── State ──
  const [orders, setOrders] = useState<(Order & { _docId: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ทั้งหมด">("ทั้งหมด")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showArchived, setShowArchived] = useState(false)

  // Pagination
  const PAGE_SIZE = 20
  const [currentPage, setCurrentPage] = useState(0)

  // Modals
  const [viewOrder, setViewOrder] = useState<(Order & { _docId: string }) | null>(null)
  const [cancelOrder, setCancelOrder] = useState<(Order & { _docId: string }) | null>(null)
  const [saving, setSaving] = useState(false)
  const [statusChanging, setStatusChanging] = useState<string | null>(null)

  // ── Real-time Firestore subscription ──
  useEffect(() => {
    if (!isInitialized()) {
      setLoading(false)
      return
    }

    try {
      const db = getDbInstance()
      const colRef = collection(db, COLLECTIONS.ORDERS)
      // Fetch up to 500 most recent orders; filters applied client-side
      const q = query(colRef, orderBy("Date", "desc"), limit(500))

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          setOrders(snapshot.docs.map(transformOrder))
          setLoading(false)
          setError(null)
        },
        (err) => {
          console.error("Orders subscription error:", err)
          setError(err.message)
          setLoading(false)
        },
      )
      return () => unsub()
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }, [])

  // ── Client-side filtering ──
  const filteredOrders = useMemo(() => {
    let result = [...orders]

    // Archived filter
    result = result.filter((o) => (showArchived ? true : !o.isArchived))

    // Status filter
    if (statusFilter !== "ทั้งหมด") {
      result = result.filter((o) => o.Status === statusFilter)
    }

    // Search filter (OrderID / customer name / phone)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (o) =>
          o.OrderID.toLowerCase().includes(q) ||
          o.CustomerName.toLowerCase().includes(q) ||
          o.CustomerPhone.includes(q),
      )
    }

    // Date range filter (Date field format: "DD/MM/YYYY : HH:mm")
    if (dateFrom || dateTo) {
      result = result.filter((o) => {
        if (!o.Date) return true
        // Extract just the date part "DD/MM/YYYY"
        const datePart = o.Date.split(" : ")[0] ?? ""
        if (!datePart) return true
        // Convert DD/MM/YYYY → YYYY-MM-DD for comparison
        const parts = datePart.split("/")
        if (parts.length !== 3) return true
        const isoDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`
        if (dateFrom && isoDate < dateFrom) return false
        if (dateTo && isoDate > dateTo) return false
        return true
      })
    }

    return result
  }, [orders, searchQuery, statusFilter, dateFrom, dateTo, showArchived])

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const pagedOrders = useMemo(() => {
    const start = currentPage * PAGE_SIZE
    return filteredOrders.slice(start, start + PAGE_SIZE)
  }, [filteredOrders, currentPage])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0)
  }, [searchQuery, statusFilter, dateFrom, dateTo, showArchived])

  // ── Actions ──
  const handleStatusChange = useCallback(
    async (order: Order & { _docId: string }, newStatus: OrderStatus) => {
      if (order.Status === newStatus) return
      setStatusChanging(order._docId)
      try {
        await updateOrder(order._docId, { Status: newStatus } as Partial<import("@/types").OrderFields>)
      } catch (err) {
        console.error("Status update failed:", err)
        alert("ไม่สามารถเปลี่ยนสถานะได้: " + (err as Error).message)
      }
      setStatusChanging(null)
    },
    [],
  )

  const handleCancel = useCallback(async () => {
    if (!cancelOrder) return
    setSaving(true)
    try {
      await updateOrder(cancelOrder._docId, {
        Status: ORDER_STATUS.CANCELLED,
      } as Partial<import("@/types").OrderFields>)
    } catch (err) {
      console.error("Cancel failed:", err)
      alert("ไม่สามารถยกเลิกออร์เดอร์ได้: " + (err as Error).message)
    }
    setSaving(false)
    setCancelOrder(null)
  }, [cancelOrder])

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15">
          <Package size={22} className="text-gold-500" />
        </div>
        <h1 className="text-xl md:text-2xl font-heading text-gold-500">จัดการออร์เดอร์</h1>
      </div>

      {/* Filters */}
      <GlassPanel>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-100/65"
              />
              <input
                type="text"
                placeholder="ค้นหาจาก OrderID / ชื่อลูกค้า / เบอร์โทร..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="themed-input pl-10"
              />
            </div>

            {/* Status filter */}
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as OrderStatus | "ทั้งหมด")
                }
                className="themed-select"
              >
                <option value="ทั้งหมด">ทุกสถานะ</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </div>

            {/* Archived toggle */}
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                showArchived
                  ? "bg-gold-500/20 text-gold-300 border border-gold-500/40"
                  : "bg-black/30 text-gold-100/65 border border-gold-500/10 hover:border-gold-500/30 hover:text-gold-100/70"
              }`}
            >
              <Filter size={16} />
              {showArchived ? "รวมที่เก็บถาวร" : "ซ่อนที่เก็บถาวร"}
            </button>
          </div>

          {/* Date range */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <span className="text-sm text-gold-100/80 font-heading whitespace-nowrap">
              วันที่:
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="themed-input w-full md:w-auto"
            />
            <span className="text-gold-100/55 text-sm">ถึง</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="themed-input w-full md:w-auto"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("")
                  setDateTo("")
                }}
                className="text-xs text-gold-500 hover:text-gold-300 underline"
              >
                ล้างวันที่
              </button>
            )}
          </div>
        </div>
      </GlassPanel>

      {/* Table */}
      <GlassPanel className="!p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle size={32} className="text-danger mb-3" />
            <p className="text-danger font-heading">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
            <p className="text-gold-100/65 text-sm mt-1">{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package size={32} className="text-gold-100/40 mb-3" />
            <p className="text-gold-100/65 font-heading">ไม่พบออร์เดอร์</p>
            <p className="text-gold-100/65 text-sm mt-1">
              {orders.length > 0
                ? "ลองปรับตัวกรองหรือค้นหาด้วยคำอื่น"
                : "ยังไม่มีออร์เดอร์ในระบบ"}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OrderID</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ชื่อลูกค้า</TableHead>
                  <TableHead>ยอดรวม</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>แอคชั่น</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedOrders.map((order) => {
                  const transitions = STATUS_TRANSITIONS[order.Status] ?? []
                  return (
                    <TableRow key={order._docId}>
                      <TableCell className="font-mono text-gold-300 text-xs">
                        {order.OrderID}
                      </TableCell>
                      <TableCell className="text-gold-100/70 text-sm whitespace-nowrap">
                        {order.Date || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm text-white/90 font-heading">
                            {order.CustomerName || "-"}
                          </span>
                          <span className="text-xs text-gold-100/65">
                            {order.CustomerPhone || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-white/90 text-sm">
                        {formatThaiCurrency(order.TotalPrice)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.Status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {/* View */}
                          <button
                            onClick={() => setViewOrder(order)}
                            className="rounded-lg p-1.5 text-gold-100/80 hover:bg-gold-500/10 hover:text-gold-300 transition-colors"
                            title="ดูรายละเอียด"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() =>
                              navigate(`/create-order?edit=${order.OrderID}`)
                            }
                            className="rounded-lg p-1.5 text-gold-100/80 hover:bg-gold-500/10 hover:text-gold-300 transition-colors"
                            title="แก้ไขออร์เดอร์"
                          >
                            <Edit3 size={16} />
                          </button>

                          {/* Status change */}
                          {transitions.length > 0 && (
                            <select
                              value=""
                              onChange={(e) => {
                                const newStatus = e.target.value as OrderStatus
                                if (newStatus) handleStatusChange(order, newStatus)
                              }}
                              className="themed-select !w-auto !py-1 !px-1.5 !text-xs"
                              disabled={statusChanging === order._docId}
                            >
                              <option value="" disabled>
                                {statusChanging === order._docId ? "..." : "▾"}
                              </option>
                              {transitions.map((s) => (
                                <option key={s} value={s}>
                                  {statusLabel(s)}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Cancel */}
                          {order.Status !== ORDER_STATUS.CANCELLED && (
                            <button
                              onClick={() => setCancelOrder(order)}
                              className="rounded-lg p-1.5 text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                              title="ยกเลิกออร์เดอร์"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gold-500/10 px-4 py-3">
                <p className="text-sm text-gold-100/65">
                  หน้า {currentPage + 1} / {totalPages}{" "}
                  <span className="text-gold-100/65">
                    ({filteredOrders.length} รายการ)
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="rounded-lg p-2 text-gold-100/80 hover:bg-gold-500/10 hover:text-gold-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                    // Show pages around current
                    let pageNum: number
                    if (totalPages <= 7) {
                      pageNum = i
                    } else if (currentPage < 3) {
                      pageNum = i
                    } else if (currentPage > totalPages - 4) {
                      pageNum = totalPages - 7 + i
                    } else {
                      pageNum = currentPage - 3 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`rounded-lg w-8 h-8 text-sm font-heading transition-colors ${
                          pageNum === currentPage
                            ? "bg-gold-500/20 text-gold-300"
                            : "text-gold-100/80 hover:bg-gold-500/10 hover:text-gold-300"
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    )
                  })}
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={currentPage >= totalPages - 1}
                    className="rounded-lg p-2 text-gold-100/80 hover:bg-gold-500/10 hover:text-gold-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </GlassPanel>

      {/* ── View Order Modal ── */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="!max-w-2xl !max-h-[85vh] overflow-y-auto">
          {viewOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-gold-500 font-heading text-lg">
                  รายละเอียดออร์เดอร์ — {viewOrder.OrderID}
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="flex items-center gap-2 pt-1">
                    <StatusBadge status={viewOrder.Status} />
                    {viewOrder.isArchived && (
                      <span className="text-xs text-gold-100/55 ml-2">
                        (เก็บถาวร)
                      </span>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 text-sm">
                {/* Customer info */}
                <div className="bg-black/20 rounded-xl p-4 space-y-2">
                  <h4 className="font-heading text-gold-300 text-sm mb-2">
                    ข้อมูลลูกค้า
                  </h4>
                  <InfoRow label="ชื่อ" value={viewOrder.CustomerName} />
                  <InfoRow label="เบอร์โทร" value={viewOrder.CustomerPhone} />
                  <InfoRow
                    label="ที่อยู่"
                    value={viewOrder.CustomerAddress || "-"}
                  />
                  <InfoRow
                    label="วันเกิด"
                    value={viewOrder.CustomerBirthday || "-"}
                  />
                </div>

                {/* Order info */}
                <div className="bg-black/20 rounded-xl p-4 space-y-2">
                  <h4 className="font-heading text-gold-300 text-sm mb-2">
                    ข้อมูลออร์เดอร์
                  </h4>
                  <InfoRow label="วันที่" value={viewOrder.Date || "-"} />
                  <InfoRow
                    label="ช่องทางชำระเงิน"
                    value={viewOrder.PaymentMethod || "-"}
                  />
                  <InfoRow
                    label="ค่าจัดส่ง"
                    value={formatThaiCurrency(viewOrder.ShippingFee)}
                  />
                  <InfoRow
                    label="ยอดรวม"
                    value={formatThaiCurrency(viewOrder.TotalPrice)}
                    highlight
                  />
                  {viewOrder.Note && (
                    <InfoRow label="หมายเหตุ" value={viewOrder.Note} />
                  )}
                </div>

                {/* Bank info */}
                {(viewOrder.Bank_Name ||
                  viewOrder.Bank_Account ||
                  viewOrder.PromptPay_Id) && (
                  <div className="bg-black/20 rounded-xl p-4 space-y-2">
                    <h4 className="font-heading text-gold-300 text-sm mb-2">
                      ข้อมูลการชำระเงิน
                    </h4>
                    {viewOrder.Bank_Name && (
                      <InfoRow label="ธนาคาร" value={viewOrder.Bank_Name} />
                    )}
                    {viewOrder.Bank_Account && (
                      <InfoRow
                        label="เลขบัญชี"
                        value={viewOrder.Bank_Account}
                      />
                    )}
                    {viewOrder.Bank_Holder && (
                      <InfoRow
                        label="ชื่อบัญชี"
                        value={viewOrder.Bank_Holder}
                      />
                    )}
                    {viewOrder.PromptPay_Id && (
                      <InfoRow
                        label="พร้อมเพย์"
                        value={`${viewOrder.PromptPay_Id}${viewOrder.PromptPay_Type ? ` (${viewOrder.PromptPay_Type})` : ""}`}
                      />
                    )}
                  </div>
                )}

                {/* Items */}
                {(() => {
                  const items = extractItems(viewOrder)
                  if (items.length === 0) return null
                  return (
                    <div className="bg-black/20 rounded-xl p-4">
                      <h4 className="font-heading text-gold-300 text-sm mb-2">
                        รายการ ({items.length} รายการ)
                      </h4>
                      <div className="space-y-2">
                        {items.map((item, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-start border-b border-gold-500/5 pb-2 last:border-0 last:pb-0"
                          >
                            <div className="flex-1">
                              <p className="text-white/80 text-sm">
                                {item.name}
                              </p>
                              <p className="text-gold-100/65 text-xs">
                                {formatThaiCurrency(item.unitPrice)} ×{" "}
                                {item.quantity}
                                {item.discount > 0 &&
                                  ` (ส่วนลด ${formatThaiCurrency(item.discount)})`}
                              </p>
                            </div>
                            <p className="text-white/90 text-sm font-mono ml-4">
                              {formatThaiCurrency(item.price)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>

              <DialogFooter className="gap-2 !mt-4">
                <GoldButton
                  variant="purple"
                  onClick={() => {
                    setViewOrder(null)
                    navigate(`/create-order?edit=${viewOrder.OrderID}`)
                  }}
                  icon={<Edit3 size={16} />}
                >
                  แก้ไขออร์เดอร์
                </GoldButton>
                <DialogClose asChild>
                  <GoldButton variant="ghost">ปิด</GoldButton>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Cancel Confirm Dialog ── */}
      <Dialog open={!!cancelOrder} onOpenChange={() => setCancelOrder(null)}>
        <DialogContent className="!max-w-md">
          <DialogHeader>
            <DialogTitle className="text-danger font-heading">
              ยืนยันการยกเลิกออร์เดอร์
            </DialogTitle>
            <DialogDescription>
              คุณต้องการยกเลิกออร์เดอร์{" "}
              <span className="text-gold-300 font-mono">
                {cancelOrder?.OrderID}
              </span>{" "}
              ของ{" "}
              <span className="text-white/80">{cancelOrder?.CustomerName}</span>{" "}
              ใช่หรือไม่?
              <br />
              <span className="text-gold-100/65 text-xs mt-1 block">
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <GoldButton variant="ghost">ยกเลิก</GoldButton>
            </DialogClose>
            <GoldButton
              variant="purple"
              onClick={handleCancel}
              isLoading={saving}
              icon={<XCircle size={16} />}
              className="!bg-red-600/80 hover:!bg-red-600"
            >
              ยืนยันการยกเลิก
            </GoldButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Info row helper for view modal ──
function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span className="text-gold-100/80 text-xs whitespace-nowrap">{label}</span>
      <span
        className={`text-right text-sm ${highlight ? "font-heading text-gold-300 font-semibold" : "text-white/80"}`}
      >
        {value}
      </span>
    </div>
  )
}