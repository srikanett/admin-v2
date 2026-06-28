import { useEffect } from "react"
import { RouterProvider } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { router } from "@/router"
import { useAuthStore } from "@/stores/auth"

export default function App() {
  const { init } = useAuthStore()

  useEffect(() => {
    const unsub = init()
    return () => unsub()
  }, [init])

  return (
    <TooltipProvider delayDuration={300}>
      <RouterProvider router={router} />
    </TooltipProvider>
  )
}