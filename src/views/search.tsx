import { GlassPanel } from "@/components/ui/glass-panel"
import { Search } from "lucide-react"

export function searchView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15"><Search size={22} className="text-gold-500" /></div><h1 className="text-xl md:text-2xl font-heading text-gold-500">ค้นหา</h1></div>
      <GlassPanel><div className="flex flex-col items-center py-20 text-gold-100/55"><Search size={48} className="mb-3" /><p className="font-heading">ฟีเจอร์อยู่ระหว่างพัฒนา</p><p className="text-sm mt-1">ระบบค้นหาข้อมูลทั้งหมด</p></div></GlassPanel>
    </div>
  )
}