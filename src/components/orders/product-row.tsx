import { GoldButton } from "@/components/ui/gold-button"
import { X, Plus } from "lucide-react"
import { calcItemPrice, formatThaiCurrency } from "@/lib/helpers"

export interface OrderItemData {
  id: string
  name: string
  unitPrice: number
  quantity: number
  discount: number
}

interface ProductRowProps {
  index: number
  item: OrderItemData
  onUpdate: (index: number, item: OrderItemData) => void
  onRemove: (index: number) => void
  productNames: string[]
}

export function ProductRow({
  index,
  item,
  onUpdate,
  onRemove,
  productNames,
}: ProductRowProps) {
  const price = calcItemPrice(item.unitPrice, item.discount, item.quantity)

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-gold-500/10 bg-black/20 p-3">
      {/* Name autocomplete */}
      <div className="flex-1 min-w-[140px]">
        <label className="mb-1 block text-[11px] text-gold-100/80">
          สินค้า {index + 1}
        </label>
        <input
          list={`products-${index}`}
          value={item.name}
          onChange={(e) =>
            onUpdate(index, { ...item, name: e.target.value })
          }
          placeholder="ค้นหาสินค้า..."
          className="themed-input h-10 text-sm"
        />
        <datalist id={`products-${index}`}>
          {productNames.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>

      {/* Unit Price */}
      <div className="w-20 md:w-24">
        <label className="mb-1 block text-[11px] text-gold-100/80">
          ราคา/หน่วย
        </label>
        <input
          type="number"
          min={0}
          value={item.unitPrice || ""}
          onChange={(e) =>
            onUpdate(index, {
              ...item,
              unitPrice: Number(e.target.value) || 0,
            })
          }
          className="themed-input h-10 text-sm text-center"
        />
      </div>

      {/* Quantity */}
      <div className="w-16">
        <label className="mb-1 block text-[11px] text-gold-100/80">
          จำนวน
        </label>
        <input
          type="number"
          min={1}
          value={item.quantity || 1}
          onChange={(e) =>
            onUpdate(index, {
              ...item,
              quantity: Math.max(1, Number(e.target.value) || 1),
            })
          }
          className="themed-input h-10 text-sm text-center"
        />
      </div>

      {/* Discount */}
      <div className="w-20 md:w-24">
        <label className="mb-1 block text-[11px] text-gold-100/80">
          ส่วนลด
        </label>
        <input
          type="number"
          min={0}
          value={item.discount || ""}
          onChange={(e) =>
            onUpdate(index, {
              ...item,
              discount: Number(e.target.value) || 0,
            })
          }
          className="themed-input h-10 text-sm text-center"
        />
      </div>

      {/* Calculated price */}
      <div className="w-24">
        <label className="mb-1 block text-[11px] text-gold-100/80">
          รวม
        </label>
        <div className="flex h-10 items-center justify-end rounded-xl bg-gold-500/10 px-3 text-sm font-medium text-gold-500 font-heading">
          {formatThaiCurrency(price)}
        </div>
      </div>

      {/* Remove */}
      {index > 0 && (
        <button
          onClick={() => onRemove(index)}
          className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
          title="ลบรายการ"
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
}