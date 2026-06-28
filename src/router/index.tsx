import { lazy, Suspense } from "react"
import { createHashRouter, Navigate } from "react-router-dom"
import { AppShell } from "@/components/layout/app-shell"
import { LoginPage } from "@/views/login"

const Loader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
  </div>
)

const Lazy = (path: string, name: string) =>
  lazy(() => import(`@/views/${path}`).then((m) => ({ default: m[name] })))

const CreateOrderView = Lazy("create-order", "createOrderView")
const ManageOrderView = Lazy("manage-orders", "manageOrderView")
const QuickAddOrderView = Lazy("quick-order", "quickAddOrderView")
const ScannerView = Lazy("scanner", "scannerView")
const SearchPageView = Lazy("search", "searchPageView")
const PrintReceiptView = Lazy("print-receipt", "printReceiptView")
const ManageQuickOrderView = Lazy("print-quick-order", "manageQuickOrderView")
const ManageCustomerAddressView = Lazy("customers", "manageCustomerAddressView")
const ManageParticipantBirthdayView = Lazy("participants", "manageParticipantBirthdayView")
const ManageSheetView = Lazy("sheets", "manageSheetView")
const InventoryDashboardView = Lazy("inventory", "inventoryDashboardView")
const ManageProductView = Lazy("products", "manageProductView")
const ManageCeremonyView = Lazy("ceremonies", "manageCeremonyView")
const ManageShippingRatesView = Lazy("shipping", "manageShippingRatesView")
const ReportsView = Lazy("reports", "reportsView")
const ManageBillView = Lazy("bills", "manageBillView")
const BeamPaymentsView = Lazy("payments", "beamPaymentsView")
const ImageGalleryView = Lazy("gallery", "imageGalleryView")
const CeremonyCardView = Lazy("ceremony-cards", "ceremonyCardView")
const SlipGalleryView = Lazy("slips", "slipGalleryView")
const ManageLineBotView = Lazy("line-bot", "manageLineBotView")
const SystemToolsView = Lazy("system-tools", "systemToolsView")
const ReplyRulesView = Lazy("reply-rules", "replyRulesView")
const LineCustomersView = Lazy("line-customers", "lineCustomersView")
const BroadcastView = Lazy("broadcast", "broadcastView")

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