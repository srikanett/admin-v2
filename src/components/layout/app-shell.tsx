import { useState, useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { AppHeader } from "./app-header"
import { AppSidebar } from "./app-sidebar"
import { useAuthStore } from "@/stores/auth"
import type { BotId } from "@/types"

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedBot, setSelectedBot] = useState<BotId>("Bot 1 Sriganett99")
  const { logout, isAuthenticated, isLoading } = useAuthStore()
  const navigate = useNavigate()

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
          <p className="text-gold-100/60 text-sm font-heading">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    navigate("/login")
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          onMenuClick={() => setSidebarOpen(true)}
          selectedBot={selectedBot}
          onBotChange={setSelectedBot}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-desktop">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}