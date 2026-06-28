import { useState, useEffect } from "react"
import { listAll, ref, getDownloadURL } from "firebase/storage"
import { getStorageInstance, isInitialized } from "@/lib/firebase"
import { STORAGE_FOLDERS } from "@/lib/constants"
import { GlassPanel } from "@/components/ui/glass-panel"
import { Image, Loader2, ExternalLink } from "lucide-react"

export function galleryView() {
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isInitialized()) { setLoading(false); return }
    try {
      const storage = getStorageInstance()
      const folders = [STORAGE_FOLDERS.GALLERY, STORAGE_FOLDERS.CEREMONY, STORAGE_FOLDERS.SLIPS]
      Promise.all(folders.map(async (folder) => {
        const folderRef = ref(storage, folder)
        try {
          const res = await listAll(folderRef)
          return await Promise.all(res.items.map(item => getDownloadURL(item)))
        } catch { return [] as string[] }
      })).then(results => {
        setImages(results.flat())
        setLoading(false)
      }).catch(() => setLoading(false))
    } catch { setLoading(false) }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15"><Image size={22} className="text-gold-500" /></div>
        <h1 className="text-xl md:text-2xl font-heading text-gold-500">แกลเลอรี่</h1>
      </div>
      <GlassPanel>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-gold-500" /></div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gold-100/30"><Image size={48} className="mb-3" /><p className="font-heading">ยังไม่มีรูปภาพ</p></div>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group aspect-square rounded-xl overflow-hidden border border-gold-500/10 bg-black/30 hover:border-gold-500/30 transition-all">
                <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" loading="lazy" />
              </a>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  )
}