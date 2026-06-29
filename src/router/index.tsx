import { lazy, Suspense } from "react"
import { createHashRouter, Navigate } from "react-router-dom"
import { AppShell } from "@/components/layout/app-shell"
import { LoginPage } from "@/views/login"

const Loader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
  </div>
)

// Use import.meta.glob for lazy loading — Vite resolves these at build time
const viewModules = import.meta.glob("../views/*.tsx") as Record<string, () => Promise<Record<string, React.ComponentType>>>

function LazyView(path: string, exportName: string) {
  const key = `../views/${path}.tsx`
  const loader = viewModules[key]
  if (!loader) {
    // Return a fallback component if module not found
    return () => (
      <div className="flex flex-col items-center justify-center py-20 text-gold-100/55">
        <p className="font-heading">ไม่พบหน้า: {path}</p>
      </div>
    )
  }
  return lazy(() => loader().then((m) => ({ default: m[exportName] || (() => <div>Export {exportName} not found</div>) })))
}

const CreateOrderView = LazyView("create-order", "createOrderView")
const ManageOrderView = LazyView("manage-orders", "manageOrderView")
const QuickAddOrderView = LazyView("quick-order", "quickAddOrderView")
const ScannerView = LazyView("scanner", "scannerView")
const SearchPageView = LazyView("search", "searchView")
const PrintReceiptView = LazyView("print-receipt", "printReceiptView")
const ManageQuickOrderView = LazyView("print-quick-order", "printQuickOrderView")
const ManageCustomerAddressView = LazyView("customers", "manageCustomerAddressView")
const ManageParticipantBirthdayView = LazyView("participants", "manageParticipantBirthdayView")
const ManageSheetView = LazyView("sheets", "sheetsView")
const InventoryDashboardView = LazyView("inventory", "inventoryView")
const ManageProductView = LazyView("products", "manageProductView")
const ManageCeremonyView = LazyView("ceremonies", "manageCeremonyView")
const ManageShippingRatesView = LazyView("shipping", "shippingView")
const ReportsView = LazyView("reports", "reportsView")
const ManageBillView = LazyView("bills", "billsView")
const BeamPaymentsView = LazyView("payments", "paymentsView")
const ImageGalleryView = LazyView("gallery", "galleryView")
const CeremonyCardView = LazyView("ceremony-cards", "ceremonyCardsView")
const SlipGalleryView = LazyView("slips", "slipsView")
const ManageLineBotView = LazyView("line-bot", "lineBotView")
const SystemToolsView = LazyView("system-tools", "systemToolsView")
const ReplyRulesView = LazyView("reply-rules", "replyRulesView")
const LineCustomersView = LazyView("line-customers", "lineCustomersView")
const BroadcastView = LazyView("broadcast", "broadcastView")

const Route = ({ C }: { C: React.ComponentType }) => (
  <Suspense fallback={<Loader />}><C /></Suspense>
)

export const router = createHashRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <AppShell />,
    children: [
      { path: "create-order", element: <Route C={CreateOrderView} /> },
      { path: "scanner", element: <Route C={ScannerView} /> },
      { path: "quick-order", element: <Route C={QuickAddOrderView} /> },
      { path: "search", element: <Route C={SearchPageView} /> },
      { path: "print-receipt", element: <Route C={PrintReceiptView} /> },
      { path: "print-quick-order", element: <Route C={ManageQuickOrderView} /> },
      { path: "customers", element: <Route C={ManageCustomerAddressView} /> },
      { path: "participants", element: <Route C={ManageParticipantBirthdayView} /> },
      { path: "sheets", element: <Route C={ManageSheetView} /> },
      { path: "inventory", element: <Route C={InventoryDashboardView} /> },
      { path: "products", element: <Route C={ManageProductView} /> },
      { path: "ceremonies", element: <Route C={ManageCeremonyView} /> },
      { path: "shipping", element: <Route C={ManageShippingRatesView} /> },
      { path: "reports", element: <Route C={ReportsView} /> },
      { path: "bills", element: <Route C={ManageBillView} /> },
      { path: "payments", element: <Route C={BeamPaymentsView} /> },
      { path: "gallery", element: <Route C={ImageGalleryView} /> },
      { path: "ceremony-cards", element: <Route C={CeremonyCardView} /> },
      { path: "slips", element: <Route C={SlipGalleryView} /> },
      { path: "line-bot", element: <Route C={ManageLineBotView} /> },
      { path: "system-tools", element: <Route C={SystemToolsView} /> },
      { path: "reply-rules", element: <Route C={ReplyRulesView} /> },
      { path: "line-customers", element: <Route C={LineCustomersView} /> },
      { path: "broadcast", element: <Route C={BroadcastView} /> },
      { path: "manage-orders", element: <Route C={ManageOrderView} /> },
      { path: "", element: <Navigate to="/create-order" replace /> },
      { path: "*", element: <Navigate to="/create-order" replace /> },
    ],
  },
])