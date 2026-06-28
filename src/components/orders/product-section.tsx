import { GoldButton } from "@/components/ui/gold-button"
import { GlassPanel } from "@/components/ui/glass-panel"
import { Plus, Trash2 } from "lucide-react"
import { ProductRow, type OrderItemData } from "./product-row"
import { calcItemPrice, formatThaiCurrency } from "@/lib/helpers"
import { useProducts } from "@/hooks/use-firestore"

interface ProductSectionProps {
  items: OrderItemData[]
  onItemsChange: (items: OrderItemData[]) => void
  maxItems?: number
}

export function ProductSection({
  items,
  onItemsChange,
  maxItems = 20,
}: ProductSectionProps) {
  const { data: products } = useProducts()
  const productNames = products.map((p) => p.name)

  const updateItem = (index: number, item: OrderItemData) => {
    const next = [...items]
    next[index] = item
    onItemsChange(next)
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    onItemsChange(items.filter((_, i) => i !== index))
  }

  const addItem = () => {
    if (items.length >= maxItems) return
    onItemsChange([
      ...items,
      { id: crypto.randomUUID(), name: "", unitPrice: 0, quantity: 1, discount: 0 },
    ])
  }

  const subtotal = items.reduce(
    (sum, item) => sum + calcItemPrice(item.unitPrice, item.discount, item.quantity),
    0
  )

  return (
    <GlassPanel variant="product" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="aurora-heading-rose text-lg">รายการสินค้า</h3>
        <span className="text-xs text-gold-100/40">
          {items.length}/{maxItems}
        </span>
      </div>

      {/* Product rows */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {items.map((item, i) => (
          <ProductRow
            key={item.id}
            index={i}
            item={item}
            onUpdate={updateItem}
            onRemove={removeItem}
            productNames={productNames}
          />
        ))}
      </div>

      {/* Add button */}
      <div className="flex items-center justify-between border-t border-gold-500/10 pt-3">
        <GoldButton
          variant="ghost"
          onClick={addItem}
          disabled={items.length >= maxItems}
          icon={<Plus size={16} />}
        >
          เพิ่มสินค้า
        </GoldButton>
        <div className="text-right">
          <span className="text-[11px] text-gold-100/40 block">
            รวมราคาสินค้า
          </span>
          <span className="text-xl font-heading font-bold text-gold-500">
            {formatThaiCurrency(subtotal)}
          </span>
        </div>
      </div>
    </GlassPanel>
  )
}