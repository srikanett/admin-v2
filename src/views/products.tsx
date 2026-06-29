import { useState, useEffect, useMemo, useCallback, useRef } from "react"
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getDbInstance, getStorageInstance, isInitialized } from "@/lib/firebase"
import { COLLECTIONS, STORAGE_FOLDERS, MAX_IMAGE_BYTES } from "@/lib/constants"
import { readField_, formatThaiCurrency } from "@/lib/helpers"
import type { Product } from "@/types"
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
  Package,
  Search,
  Plus,
  Edit3,
  Trash2,
  ImageIcon,
  AlertTriangle,
  Tag,
  Boxes,
} from "lucide-react"

// ── Category + Unit Options ──
const CATEGORIES = ["ทั้งหมด", "สินค้าบูชา", "พิธี", "ของขลัง", "เทวรูป", "แหวน", "อื่นๆ"]
const UNITS = ["องค์", "ชิ้น", "อัน", "วง", "ผืน", "แผ่น", "ชุด", "เส้น", "กล่อง"]

// ── Transform Firestore doc → Product ──
function transformProduct(doc: DocumentSnapshot<DocumentData>): Product {
  return {
    id: doc.id,
    name: readField_(doc, ["name", "Name", "productName"], "")!,
    price: readField_(doc, ["price", "unitPrice", "UnitPrice"], 0)!,
    cost: readField_(doc, ["cost", "Cost"], undefined),
    category: readField_(doc, ["category", "Category"], "สินค้าบูชา"),
    unit: readField_(doc, ["unit", "Unit"], "องค์"),
    stock: readField_(doc, ["stock", "Stock"], undefined),
    stockAlert: readField_(doc, ["stockAlert", "StockAlert"], undefined),
    imageUrl: readField_(doc, ["imageUrl", "ImageUrl", "imageURL"], ""),
    active: readField_(doc, ["active", "Active"], true),
  }
}

const EMPTY_PRODUCT: Product = {
  id: "",
  name: "",
  price: 0,
  cost: undefined,
  category: "สินค้าบูชา",
  unit: "องค์",
  stock: undefined,
  stockAlert: undefined,
  imageUrl: "",
  active: true,
}

export function manageProductView() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product>(EMPTY_PRODUCT)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Realtime Firestore ──
  useEffect(() => {
    if (!isInitialized()) {
      setLoading(false)
      return
    }
    const db = getDbInstance()
    const q = query(collection(db, COLLECTIONS.PRODUCTS), orderBy("name"), limit(200))
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(transformProduct))
      setLoading(false)
    })
    return unsub
  }, [])

  // ── Filtered ──
  const filtered = useMemo(() => {
    let list = products
    if (activeCategory !== "ทั้งหมด") {
      list = list.filter((p) => p.category === activeCategory)
    }
    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter(
        (p) => p.name.toLowerCase().includes(s) || p.category?.toLowerCase().includes(s)
      )
    }
    return list
  }, [products, search, activeCategory])

  const openAdd = () => {
    setEditing(EMPTY_PRODUCT)
    setImagePreview(null)
    setModalOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setImagePreview(p.imageUrl || null)
    setModalOpen(true)
  }

  // ── Image Upload ──
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (file.size > MAX_IMAGE_BYTES) {
        alert("ไฟล์รูปใหญ่เกินไป (สูงสุด 1.2 MB)")
        return
      }
      setUploading(true)
      try {
        const storage = getStorageInstance()
        const ext = file.name.split(".").pop() || "jpg"
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const storageRef = ref(storage, `${STORAGE_FOLDERS.PRODUCTS}/${filename}`)
        const snapshot = await uploadBytes(storageRef, file)
        const url = await getDownloadURL(snapshot.ref)
        setEditing((p) => ({ ...p, imageUrl: url }))
        setImagePreview(url)
      } catch (err) {
        console.error("Upload error:", err)
        alert("อัปโหลดรูปไม่สำเร็จ")
      }
      setUploading(false)
    },
    []
  )

  const removeImage = () => {
    setEditing((p) => ({ ...p, imageUrl: "" }))
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (!editing.name.trim() || editing.price <= 0) return
    setSaving(true)
    try {
      const db = getDbInstance()
      const data: Record<string, unknown> = {
        name: editing.name.trim(),
        price: editing.price,
        cost: editing.cost ?? null,
        category: editing.category || "สินค้าบูชา",
        unit: editing.unit || "องค์",
        stock: editing.stock ?? null,
        stockAlert: editing.stockAlert ?? null,
        imageUrl: editing.imageUrl || "",
        active: editing.active !== false,
      }
      if (editing.id) {
        await updateDoc(doc(db, COLLECTIONS.PRODUCTS, editing.id), data)
      } else {
        await addDoc(collection(db, COLLECTIONS.PRODUCTS), data)
      }
      setModalOpen(false)
      setEditing(EMPTY_PRODUCT)
      setImagePreview(null)
    } catch (err) {
      console.error("Save product error:", err)
    }
    setSaving(false)
  }, [editing])

  // ── Delete ──
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const db = getDbInstance()
      await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      console.error("Delete product error:", err)
    }
    setDeleting(false)
  }, [deleteTarget])

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15">
            <Package size={22} className="text-gold-500" />
          </div>
          <h1 className="aurora-heading text-xl md:text-2xl">จัดการสินค้า</h1>
        </div>
        <GoldButton icon={<Plus size={16} />} onClick={openAdd}>
          เพิ่มสินค้า
        </GoldButton>
      </div>

      {/* ── Search + Category Tabs ── */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-100/55 pointer-events-none"
          />
          <input
            className="themed-input pl-10"
            placeholder="ค้นหาชื่อสินค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat
                  ? "bg-gold-500 text-black font-semibold shadow-gold"
                  : "glass-panel border-gold-500/10 text-gold-100/80 hover:text-gold-200 hover:border-gold-500/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Product Grid ── */}
      <GlassPanel className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package size={48} className="text-gold-100/35 mb-3" />
            <p className="text-gold-100/55 text-sm">
              {search || activeCategory !== "ทั้งหมด" ? "ไม่พบสินค้าที่ค้นหา" : "ยังไม่มีสินค้า"}
            </p>
          </div>
        ) : (
          <div className="p-4 md:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="glass-panel variant-product p-3 rounded-xl flex flex-col gap-2 group cursor-pointer hover:border-gold-500/30 transition-colors"
              >
                {/* Image */}
                <div className="w-full aspect-square rounded-lg bg-black/20 flex items-center justify-center overflow-hidden">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <ImageIcon size={36} className="text-gold-100/10" />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gold-100/90 truncate">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-heading text-gold-400">
                      ฿{formatThaiCurrency(p.price)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold-500/10 text-gold-100/65">
                      {p.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gold-100/65">
                    <span className="flex items-center gap-0.5">
                      <Tag size={10} /> {p.unit}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Boxes size={10} /> สต๊อก: {p.stock ?? "-"}
                    </span>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 pt-1 border-t border-gold-500/5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openEdit(p)
                    }}
                    className="flex-1 py-1.5 rounded-lg text-xs text-gold-100/80 hover:bg-gold-500/10 hover:text-gold-400 transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit3 size={12} /> แก้ไข
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTarget(p)
                    }}
                    className="flex-1 py-1.5 rounded-lg text-xs text-gold-100/80 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 size={12} /> ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Footer count */}
        <div className="px-4 py-3 border-t border-gold-500/10 text-xs text-gold-100/55">
          แสดง {filtered.length} จาก {products.length} รายการ
        </div>
      </GlassPanel>

      {/* ═══ Add/Edit Modal ═══ */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gold-100 aurora-heading text-lg">
              {editing.id ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
            </DialogTitle>
            <DialogDescription className="text-gold-100/65 text-sm">
              อัปโหลดรูปและกรอกรายละเอียดสินค้า
            </DialogDescription>
          </DialogHeader>

          {/* ── Image Upload ── */}
          <div>
            <label className="block text-xs text-gold-100/80 mb-2 font-medium">
              <ImageIcon size={12} className="inline mr-1" />
              รูปสินค้า
            </label>
            <div className="flex gap-3 items-start">
              <div className="w-28 h-28 rounded-lg bg-black/20 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gold-500/10">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon size={28} className="text-gold-100/10" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="text-xs text-gold-100/65 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-gold-500/15 file:text-gold-200 hover:file:bg-gold-500/25"
                />
                {imagePreview && (
                  <button
                    onClick={removeImage}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors text-left"
                  >
                    ลบรูป
                  </button>
                )}
                {uploading && (
                  <span className="text-xs text-gold-400 animate-pulse">กำลังอัปโหลด...</span>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gold-500/10 my-2" />

          {/* ── Form Fields ── */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gold-100/80 mb-1 font-medium">ชื่อสินค้า *</label>
              <Input
                className="themed-input"
                placeholder="ชื่อสินค้า"
                value={editing.name}
                onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gold-100/80 mb-1 font-medium">ราคา *</label>
                <Input
                  className="themed-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={editing.price || ""}
                  onChange={(e) =>
                    setEditing((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-gold-100/80 mb-1 font-medium">ต้นทุน</label>
                <Input
                  className="themed-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={editing.cost ?? ""}
                  onChange={(e) => {
                    const v = e.target.value
                    setEditing((p) => ({
                      ...p,
                      cost: v === "" ? undefined : parseFloat(v) || 0,
                    }))
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-gold-100/80 mb-1 font-medium">สต๊อก</label>
                <Input
                  className="themed-input"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={editing.stock ?? ""}
                  onChange={(e) => {
                    const v = e.target.value
                    setEditing((p) => ({
                      ...p,
                      stock: v === "" ? undefined : parseInt(v) || 0,
                    }))
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gold-100/80 mb-1 font-medium">หมวดหมู่</label>
                <select
                  className="themed-input"
                  value={editing.category || "สินค้าบูชา"}
                  onChange={(e) => setEditing((p) => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.filter((c) => c !== "ทั้งหมด").map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gold-100/80 mb-1 font-medium">หน่วย</label>
                <select
                  className="themed-input"
                  value={editing.unit || "องค์"}
                  onChange={(e) => setEditing((p) => ({ ...p, unit: e.target.value }))}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <GoldButton variant="ghost" onClick={() => setModalOpen(false)}>
              ยกเลิก
            </GoldButton>
            <GoldButton
              isLoading={saving || uploading}
              disabled={!editing.name.trim() || editing.price <= 0}
              onClick={handleSave}
            >
              {editing.id ? "บันทึก" : "เพิ่มสินค้า"}
            </GoldButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Confirm ═══ */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gold-100">
              <AlertTriangle size={20} className="text-red-400" />
              ยืนยันการลบสินค้า
            </DialogTitle>
            <DialogDescription className="text-gold-100/80">
              คุณต้องการลบสินค้า <span className="text-gold-200 font-semibold">"{deleteTarget?.name}"</span> ใช่หรือไม่?
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
              ลบสินค้า
            </GoldButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
