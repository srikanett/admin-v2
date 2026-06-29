import { useState, useEffect, useMemo, useCallback } from "react"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
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
import { parseCustomerData } from "@/lib/api"
import type { Customer } from "@/types"
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
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Users,
  Search,
  Plus,
  Edit3,
  Trash2,
  Sparkles,
  AlertTriangle,
  MapPin,
  Phone,
  CakeSlice,
} from "lucide-react"

// ── Transform Firestore doc → Customer ──
function transformCustomer(doc: DocumentSnapshot<DocumentData>): Customer {
  return {
    id: doc.id,
    name: readField_(doc, ["name", "Name", "customerName"], "")!,
    phone: readField_(doc, ["phone", "Phone", "customerPhone"], "")!,
    address: readField_(doc, ["address", "Address", "customerAddress"], ""),
    birthday: readField_(doc, ["birthday", "Birthday", "customerBirthday"], ""),
    lineUserId: readField_(doc, ["lineUserId", "LineUserID", "lineUserID"], ""),
    notes: readField_(doc, ["notes", "Notes", "note"], ""),
  }
}

const EMPTY_CUSTOMER: Customer = {
  id: "",
  name: "",
  phone: "",
  address: "",
  birthday: "",
  lineUserId: "",
  notes: "",
}

export function manageCustomerAddressView() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Customer>(EMPTY_CUSTOMER)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [parseInput, setParseInput] = useState("")
  const [parsing, setParsing] = useState(false)

  // ── Realtime Firestore subscription ──
  useEffect(() => {
    if (!isInitialized()) {
      setLoading(false)
      return
    }
    const db = getDbInstance()
    const q = query(collection(db, COLLECTIONS.CUSTOMERS), orderBy("name"), limit(500))
    const unsub = onSnapshot(q, (snap) => {
      setCustomers(snap.docs.map(transformCustomer))
      setLoading(false)
    })
    return unsub
  }, [])

  // ── Filtered list ──
  const filtered = useMemo(() => {
    if (!search.trim()) return customers
    const s = search.toLowerCase()
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.phone.includes(s) ||
        (c.address && c.address.toLowerCase().includes(s)) ||
        (c.notes && c.notes.toLowerCase().includes(s))
    )
  }, [customers, search])

  // ── Open modal ──
  const openAdd = () => {
    setEditing(EMPTY_CUSTOMER)
    setParseInput("")
    setModalOpen(true)
  }

  const openEdit = (c: Customer) => {
    setEditing(c)
    setParseInput("")
    setModalOpen(true)
  }

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (!editing.name.trim() || !editing.phone.trim()) return
    setSaving(true)
    try {
      const db = getDbInstance()
      const data: Record<string, unknown> = {
        name: editing.name.trim(),
        phone: editing.phone.trim(),
        address: editing.address?.trim() ?? "",
        birthday: editing.birthday?.trim() ?? "",
        lineUserId: editing.lineUserId?.trim() ?? "",
        notes: editing.notes?.trim() ?? "",
      }
      if (editing.id) {
        await updateDoc(doc(db, COLLECTIONS.CUSTOMERS, editing.id), data)
      } else {
        await addDoc(collection(db, COLLECTIONS.CUSTOMERS), data)
      }
      setModalOpen(false)
      setEditing(EMPTY_CUSTOMER)
    } catch (err) {
      console.error("Save customer error:", err)
    }
    setSaving(false)
  }, [editing])

  // ── Delete ──
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const db = getDbInstance()
      await deleteDoc(doc(db, COLLECTIONS.CUSTOMERS, deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      console.error("Delete customer error:", err)
    }
    setDeleting(false)
  }, [deleteTarget])

  // ── Gemini AI Parse ──
  const handleParse = useCallback(async () => {
    if (!parseInput.trim()) return
    setParsing(true)
    try {
      const result = (await parseCustomerData(parseInput)) as { data?: Partial<Customer> }
      if (result?.data) {
        setEditing((prev) => ({
          ...prev,
          name: result.data?.name || prev.name,
          phone: result.data?.phone || prev.phone,
          address: result.data?.address || prev.address,
          birthday: result.data?.birthday || prev.birthday,
          notes: result.data?.notes || prev.notes,
        }))
      }
    } catch (err) {
      console.error("Parse error:", err)
    }
    setParsing(false)
  }, [parseInput])

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15">
            <Users size={22} className="text-gold-500" />
          </div>
          <h1 className="aurora-heading text-xl md:text-2xl">จัดการข้อมูลลูกค้า</h1>
        </div>
        <GoldButton icon={<Plus size={16} />} onClick={openAdd}>
          เพิ่มลูกค้า
        </GoldButton>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-100/55 pointer-events-none"
        />
        <input
          className="themed-input pl-10"
          placeholder="ค้นหาด้วยชื่อ, เบอร์โทร, ที่อยู่..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Table ── */}
      <GlassPanel className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={48} className="text-gold-100/35 mb-3" />
            <p className="text-gold-100/55 text-sm">
              {search ? "ไม่พบลูกค้าที่ค้นหา" : "ยังไม่มีข้อมูลลูกค้า"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">ชื่อ</TableHead>
                  <TableHead className="w-[130px]">เบอร์โทร</TableHead>
                  <TableHead>ที่อยู่</TableHead>
                  <TableHead className="w-[100px]">วันเกิด</TableHead>
                  <TableHead className="w-[150px]">LINE ID</TableHead>
                  <TableHead className="w-[100px] text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-gold-100/90">{c.name}</TableCell>
                    <TableCell className="text-gold-100/75">{c.phone}</TableCell>
                    <TableCell className="text-gold-100/80 max-w-[200px] truncate">
                      {c.address || "-"}
                    </TableCell>
                    <TableCell className="text-gold-100/80">{c.birthday || "-"}</TableCell>
                    <TableCell className="text-gold-100/65 text-xs">{c.lineUserId || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-2 rounded-lg hover:bg-gold-500/10 text-gold-100/65 hover:text-gold-400 transition-colors"
                          title="แก้ไข"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-gold-100/65 hover:text-red-400 transition-colors"
                          title="ลบ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassPanel>

      {/* ═══ Add/Edit Modal ═══ */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gold-100 aurora-heading text-lg">
              {editing.id ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มลูกค้าใหม่"}
            </DialogTitle>
            <DialogDescription className="text-gold-100/65 text-sm">
              กรอกข้อมูลลูกค้าให้ครบถ้วน
            </DialogDescription>
          </DialogHeader>

          {/* ── Gemini AI Parse ── */}
          <div className="space-y-2">
            <label className="text-xs text-gold-100/65 font-medium">
              <Sparkles size={12} className="inline mr-1" />
              วางข้อความจากแชท (Gemini AI จะช่วยกรอกฟอร์ม)
            </label>
            <div className="flex gap-2">
              <textarea
                className="themed-input min-h-[60px] resize-none"
                placeholder="วางข้อความภาษาไทย เช่น: คุณสมชาย เบอร์ 0812345678 อยู่กรุงเทพฯ เกิด 15/08/2535..."
                value={parseInput}
                onChange={(e) => setParseInput(e.target.value)}
                rows={3}
              />
              <GoldButton
                variant="purple"
                className="flex-shrink-0 self-start"
                icon={<Sparkles size={14} />}
                isLoading={parsing}
                onClick={handleParse}
              >
                วิเคราะห์
              </GoldButton>
            </div>
          </div>

          <div className="border-t border-gold-500/10 my-2" />

          {/* ── Form Fields ── */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gold-100/80 mb-1 font-medium">ชื่อ-นามสกุล *</label>
              <Input
                className="themed-input"
                placeholder="ชื่อลูกค้า"
                value={editing.name}
                onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gold-100/80 mb-1 font-medium">
                  <Phone size={12} className="inline mr-1" />
                  เบอร์โทร *
                </label>
                <Input
                  className="themed-input"
                  placeholder="08xxxxxxxx"
                  value={editing.phone}
                  onChange={(e) => setEditing((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-gold-100/80 mb-1 font-medium">
                  <CakeSlice size={12} className="inline mr-1" />
                  วันเกิด
                </label>
                <Input
                  className="themed-input"
                  placeholder="DD/MM/YYYY"
                  value={editing.birthday || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, birthday: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gold-100/80 mb-1 font-medium">
                <MapPin size={12} className="inline mr-1" />
                ที่อยู่
              </label>
              <Input
                className="themed-input"
                placeholder="ที่อยู่จัดส่ง"
                value={editing.address || ""}
                onChange={(e) => setEditing((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gold-100/80 mb-1 font-medium">LINE User ID</label>
                <Input
                  className="themed-input"
                  placeholder="Uxxxxx..."
                  value={editing.lineUserId || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, lineUserId: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-gold-100/80 mb-1 font-medium">หมายเหตุ</label>
                <Input
                  className="themed-input"
                  placeholder="บันทึกเพิ่มเติม"
                  value={editing.notes || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <GoldButton variant="ghost" onClick={() => setModalOpen(false)}>
              ยกเลิก
            </GoldButton>
            <GoldButton
              isLoading={saving}
              disabled={!editing.name.trim() || !editing.phone.trim()}
              onClick={handleSave}
            >
              {editing.id ? "บันทึก" : "เพิ่มลูกค้า"}
            </GoldButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Confirm Modal ═══ */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gold-100">
              <AlertTriangle size={20} className="text-red-400" />
              ยืนยันการลบ
            </DialogTitle>
            <DialogDescription className="text-gold-100/80">
              คุณต้องการลบลูกค้า <span className="text-gold-200 font-semibold">"{deleteTarget?.name}"</span> ใช่หรือไม่?
              <br />
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <GoldButton variant="ghost" onClick={() => setDeleteTarget(null)}>
              ยกเลิก
            </GoldButton>
            <GoldButton
              variant="purple"
              className="!bg-red-500/20 !text-red-300 hover:!bg-red-500/30 !border-red-500/30"
              isLoading={deleting}
              onClick={handleDelete}
            >
              ลบลูกค้า
            </GoldButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
