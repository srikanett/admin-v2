# ROADMAP — admin-v2 (ศรีคเนศ เทวาลัย Order System)
> **Repo:** https://github.com/srikanett/admin-v2  
> **Deploy:** https://admin-v2-rho.vercel.app  
> **DB:** Firestore `srikanett-order` (34 collections — ห้ามเปลี่ยน schema)  
> **Backend:** Cloud Functions Gen 1 (เอา `asia-southeast1` — ห้ามแก้)  
> **Design:** SRIKANETT DHEVALAI Brand System (`DESIGN.md`)

---

## 🧬 Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Client (Browser) — admin-v2-rho.vercel.app              │
│  ┌──────────────────────────────────────────────────┐    │
│  │  React 19 + Vite + TypeScript 6                  │    │
│  │  Tailwind CSS v4 + shadcn/ui                     │    │
│  │  Zustand (state) + React Router v7 (hash)        │    │
│  │  Firebase JS SDK v9 (lazy-init)                  │    │
│  └──────────────────┬───────────────────────────────┘    │
│                     │                                    │
│         ┌───────────┴───────────┐                        │
│         │                       │                        │
│    ┌────▼─────┐          ┌──────▼──────────┐             │
│    │ Firestore │          │ Cloud Functions  │             │
│    │ (34 coll)│          │ Gen 1 — asia-se1 │             │
│    └──────────┘          │ /adminFastLogin  │             │
│                          │ /ordercusApi     │             │
│                          │ /beamWebhook     │             │
│                          │ /lineWebhook     │             │
│                          │ + 15 callables   │             │
│                          └──────────────────┘             │
│                                                          │
│  ระบบเก่า (v1) — Netlify — ใช้ Firestore ตัวเดียวกัน       │
│  ✅ Production — ไม่แตะต้อง                                │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 Current File Structure

```
src/
├── main.tsx                          ✅ Entry point
├── App.tsx                           ✅ Root + TooltipProvider
├── index.css                         ✅ Tailwind + design tokens + glassmorphism
│
├── lib/
│   ├── firebase.ts                   ✅ Lazy-init Firebase + getDbInstance()
│   ├── constants.ts                  ✅ COLLECTIONS, CF_BASE_URL, STORAGE_FOLDERS
│   ├── utils.ts                      ✅ cn() helper
│   ├── helpers.ts                    ✅ readField_, calcItemPrice, formatThaiCurrency, normalizePhone
│   └── api.ts                        ✅ CF wrappers (adminFastLogin, updateOrderStatus, beam)
│
├── types/
│   └── index.ts                      ✅ Order, OrderItem, Customer, Product, Ceremony, Bank, etc.
│
├── stores/
│   └── auth.ts                       ✅ Zustand: PIN login → customToken → onAuthStateChanged
│
├── hooks/
│   └── use-firestore.ts              ✅ useProducts, useCustomers, useBanks, useCeremonies, useSearchCustomers
│
├── router/
│   └── index.tsx                     ✅ createHashRouter — 25 routes + lazy loading
│
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx             ✅ Main layout wrapper
│   │   ├── app-header.tsx            ✅ Header + bot selector
│   │   └── app-sidebar.tsx           ✅ Sidebar with all 25 menu items
│   ├── ui/
│   │   ├── glass-panel.tsx           ✅ Glassmorphism panel (6 variants)
│   │   ├── gold-button.tsx           ✅ Gold/purple/ghost button
│   │   ├── status-badge.tsx          ✅ Color-coded status
│   │   ├── placeholder-view.tsx      ✅ Generic placeholder
│   │   ├── button.tsx ← shadcn       ✅
│   │   ├── card.tsx ← shadcn         ✅
│   │   ├── dialog.tsx ← shadcn       ✅
│   │   ├── input.tsx ← shadcn        ✅
│   │   ├── select.tsx ← shadcn       ✅
│   │   ├── sheet.tsx ← shadcn        ✅
│   │   ├── table.tsx ← shadcn        ✅
│   │   ├── badge.tsx ← shadcn        ✅
│   │   ├── avatar.tsx ← shadcn       ✅
│   │   ├── separator.tsx ← shadcn    ✅
│   │   ├── scroll-area.tsx ← shadcn  ✅
│   │   ├── toggle.tsx ← shadcn       ✅
│   │   ├── tooltip.tsx ← shadcn      ✅
│   │   ├── dropdown-menu.tsx ← shadcn ✅
│   │   ├── popover.tsx ← shadcn      ✅
│   │   └── tabs.tsx ← shadcn         ✅
│   └── orders/
│       ├── order-form.tsx            ✅ Full create order form
│       ├── product-row.tsx           ✅ 1 product line item
│       ├── product-section.tsx       ✅ 1-20 items manager
│       ├── bank-picker.tsx           ✅ Bank selection grid
│       └── ceremony-section.tsx      ✅ Ceremony mode toggle
│
└── views/
    ├── login.tsx                     ✅ PIN login page
    ├── create-order.tsx              ✅ Create order view (wraps OrderForm)
    ├── manage-orders.tsx             🟡 Placeholder — need table
    ├── quick-order.tsx               🟡 Placeholder
    ├── scanner.tsx                   🟡 Placeholder
    ├── search.tsx                    🟡 Placeholder
    ├── print-receipt.tsx             🟡 Placeholder
    ├── print-quick-order.tsx         🟡 Placeholder
    ├── customers.tsx                 🟡 Placeholder
    ├── participants.tsx              🟡 Placeholder
    ├── sheets.tsx                    🟡 Placeholder
    ├── inventory.tsx                 🟡 Placeholder
    ├── products.tsx                  🟡 Placeholder
    ├── ceremonies.tsx                🟡 Placeholder
    ├── shipping.tsx                  🟡 Placeholder
    ├── reports.tsx                   🟡 Placeholder
    ├── bills.tsx                     🟡 Placeholder
    ├── payments.tsx                  🟡 Placeholder
    ├── gallery.tsx                   🟡 Placeholder
    ├── ceremony-cards.tsx            🟡 Placeholder
    ├── slips.tsx                     🟡 Placeholder
    ├── line-bot.tsx                  🟡 Placeholder
    ├── system-tools.tsx              🟡 Placeholder
    ├── reply-rules.tsx               🟡 Placeholder
    ├── line-customers.tsx            🟡 Placeholder
    └── broadcast.tsx                 🟡 Placeholder
```

---

## 🗺️ Phase Map

```
Phase 1  ✅ Foundation: Auth + Layout + 25 routes           [DONE]
Phase 2  ✅ Create Order UI: Form + Product + Bank + Ceremony [DONE]
Phase 2b 🔜 Create Order: Save + OrderID + Beam QR + Share
Phase 3  🔜 Manage Order: Table + Filter + Status + Detail
Phase 4  🔜 CRUD: Customer + Product + Ceremony
Phase 5  🔜 LINE: Reply Rules + Broadcast + Customers
Phase 6  🔜 Media + Reports + Admin Tools
Phase 7  🔜 Polish: Mobile + Perf + Ship
```

---

## 🔥 PHASE 2b — Create Order: Save & Share

### 🎯 Goal
กด "บันทึกออร์เดอร์" → ข้อมูลลง Firestore `orders` หรือ `ceremonyOrders` → สร้าง Order ID → Beam QR → LINE Share

### 📐 Business Rules
```
1. Order ID: DDMMYY-NNN (product) / CO-DDMMYY-NNN (ceremony)
   — ใช้ orderIdLedger collection แบบ transaction
2. Status เริ่มต้น: "สร้างออร์เดอร์"
3. Date: Thai format "DD/MM/YYYY : HH:mm"
4. Fields เก็บตาม Order Schema (SPEC.md):
   OrderID, Date, CustomerName, CustomerPhone, CustomerAddress?
   CustomerBirthday?, Status, TotalPrice, ShippingFee, Note?
   PaymentMethod, Bank_Name?, Bank_Account?, Bank_Holder?
   PromptPay_Id?, PromptPay_Type?, LineChannelID?
   Item1Name-Item20Name, Item1Price-Item20Price, 
   Item1Qty-Item20Qty, Item1UnitPrice-Item20UnitPrice
   Item1Discount-Item20Discount
   DueDate?, CollectAddress?, CollectBirthday?
   // Ceremony only:
   CeremonyOrderID, OrderType:"ceremony", CeremonyName
   CeremonyDate?, CostSnapshot, TotalCost, 
   ParticipantName?, ParticipantBirthday?
   ParticipantName2?, ParticipantBirthday2?
5. Generate ID: scan orderIdLedger today → increment → claim atomically
6. After save → createBeamCharge → show QR image
7. After save → show shareModal (sendOrderToCustomer)
8. Edit mode: ?edit=ORDER_ID → prefill → update instead of create
```

### 📁 Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| **NEW** | `src/lib/order-id.ts` | `generateOrderId(isCeremony): Promise<string>` |
| **NEW** | `src/components/orders/share-modal.tsx` | Share dialog: bot picker + plan picker + send |
| **NEW** | `src/components/orders/beam-qr.tsx` | Beam QR display component |
| **MODIFY** | `src/components/orders/order-form.tsx` | Add `handleSave()` → Firestore write |
| **MODIFY** | `src/lib/api.ts` | Add `generateOrderId()`, `createBeamCharge()` wrappers |
| **MODIFY** | `src/views/create-order.tsx` | Handle `?edit=` param |

### 🔗 API / CF Reference

| Function | Method | Input | Output |
|----------|--------|-------|--------|
| `createBeamCharge` | POST `/createBeamCharge` | `{orderId, amount, customerPhone?}` | `{qrImage, paymentLink, chargeId}` |
| `sendOrderToCustomer` | Callable | `{orderId, planName, botId}` | `{status}` |
| `notifyOrderSubmitted` | POST `/notifyOrderSubmitted` | `{orderId}` | `{status}` |

### 🤖 AI Prompt (copy-paste into Cursor)

```
@DESIGN.md @ROADMAP.md

เราอยู่ที่ Phase 2b — สร้าง Order Save & Share

## งานที่ต้องทำ:
1. **สร้าง src/lib/order-id.ts**
   - generateOrderId(isCeremony: boolean): Promise<string>
   - Logic: ดึง orderIdLedger ใน Firestore → filter today's IDs → increment → write back (transaction)
   - Format: product = "DDMMYY-NNN", ceremony = "CO-DDMMYY-NNN"

2. **สร้าง src/components/orders/beam-qr.tsx**
   - Component: แสดง QR code จาก createBeamCharge response
   - Props: orderId, totalPrice, onComplete
   - Flow: เรียก POST /createBeamCharge → แสดง QR image + payment link
   - UI: glass-panel, แสดง QR, link ก๊อปได้, polling status

3. **สร้าง src/components/orders/share-modal.tsx**
   - Component: modal สำหรับส่งลิงก์ให้ลูกค้า
   - Props: orderId, onClose
   - Content: 
     - Bot picker (Bot 1 / Bot 2 dropdown)
     - Plan picker (customerPendingReview, adminSubmitFlex, etc.)
     - LineNotify toggle + schedule
     - Preview area (placeholder — Phase 5 จะมี Flex preview)
     - ปุ่มส่ง → sendOrderToCustomer callable
   - UI: aurora-modal, gold button

4. **แก้ไข src/components/orders/order-form.tsx**
   - เพิ่ม handleSave():
     1. Validate: at least 1 item, customer name required
     2. Generate OrderID → order-id.ts
     3. Build order object (ตาม Order Schema ใน SPEC.md)
     4. ถ้า ceremony: capture CostSnapshot + TotalCost
     5. Set Date = Thai format
     6. Set Status = "สร้างออร์เดอร์"
     7. Write to Firestore: orders/ceremonyOrders
     8. ถ้า payment=โอน → เปิด BeamQR modal
     9. เปิด ShareModal
     10. Clear form
   - Loading state + error toast
   
5. **แก้ไข src/views/create-order.tsx**
   - Handle query param ?edit=ORDER_ID
   - ถ้ามี edit → fetch order from Firestore → prefill OrderForm
   - Save = update (ไม่ generate ID ใหม่)
   - Status change: เรียก updateOrderStatus CF

## Validation Rules:
- อย่างน้อย 1 item ที่มีชื่อ
- Customer name ห้ามว่าง
- Price > 0
- Ceremony: CostSnapshot at save time (ไม่ใช่ real-time — ป้องกัน retroactive changes)
- COD + ceremony = ❌ (force โอน)
- itemPrice = max(0, (unitPrice - discount) * qty)

## ห้าม:
- สร้าง Cloud Function ใหม่
- สร้าง Firestore collection ใหม่
- เปลี่ยนชื่อ field ใน schema
- ใช้ Firebase Admin SDK (client SDK เท่านั้น)

## Verify After:
- [ ] กดบันทึก → order ปรากฏใน Firestore orders collection
- [ ] OrderID format: DDMMYY-NNN (e.g., 280626-001)
- [ ] Ceremony: CO-DDMMYY-NNN
- [ ] เปิด admin.srikanett.com (v1) → เห็น order ที่ v2 สร้าง
- [ ] Beam QR แสดงหลังบันทึก (เฉพาะ payment=โอน)
- [ ] ShareModal เปิดได้
- [ ] Edit mode: แก้ไข order เก่า → update ไม่สร้างใหม่
```

---

## 🔥 PHASE 3 — Manage Order

### 🎯 Goal
ตารางออร์เดอร์ครบ + filter/search + เปลี่ยนสถานะ + ดูรายละเอียด + จัดการออร์เดอร์ทั้งหมด

### 📐 Business Rules
```
Status Flow:
  สร้างออร์เดอร์ → ชำระเงินสำเร็จ → รอตรวจสอบ → รอจัดส่ง → สำเร็จ
  ยกเลิก → จากทุกสถานะได้

Archiving:
  สำเร็จ / ยกเลิก → isArchived = true, closedAt = now
  กลับมา active → isArchived = false

Status Change:
  เรียก updateOrderStatus CF → POST /updateOrderStatus
  CF auto-handles: dedup flag clear + archiving
```

### 📁 Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| **REPLACE** | `src/views/manage-orders.tsx` | Full order management page |
| **NEW** | `src/components/orders/order-table.tsx` | Table + sort + cursor pagination |
| **NEW** | `src/components/orders/order-filters.tsx` | Status + search + date range filter bar |
| **NEW** | `src/components/orders/order-detail-modal.tsx` | Full order detail + actions |
| **NEW** | `src/components/orders/order-actions.tsx` | Row actions (edit/status/delete/share) |
| **NEW** | `src/hooks/use-orders.ts` | useOrders(filters) hook with onSnapshot |

### 🤖 AI Prompt

```
@DESIGN.md @ROADMAP.md

เราอยู่ที่ Phase 3 — Manage Order

## งาน:

1. **สร้าง src/hooks/use-orders.ts**
   - useOrders(filters): onSnapshot → real-time orders list
   - Support: status filter, search term, date range, archived toggle
   - Cursor-based pagination: pageSize=20, startAfter/limit
   - Transform: ใช้ readField_() รองรับ field name variants

2. **สร้าง src/components/orders/order-filters.tsx**
   - Status dropdown (ทั้งหมด / 6 statuses)
   - Search input (ชื่อ/เบอร์/OrderID)
   - Date range picker
   - Toggle: show archived?
   - Clear all button
   - Props: filters, onFiltersChange

3. **สร้าง src/components/orders/order-table.tsx**
   - คอลัมน์: OrderID, วันที่, ชื่อลูกค้า, ยอดรวม (THB), สถานะ (StatusBadge), Action
   - Sort: วันที่ (latest first)
   - Pagination: "ก่อนหน้า" / "ถัดไป" with page info
   - Real-time: onSnapshot → row updates live
   - Click row → open order-detail-modal
   - Mobile: card view (ไม่ใช่ table)
   - Empty state: "ไม่พบออร์เดอร์"

4. **สร้าง src/components/orders/order-detail-modal.tsx**
   - Dialog (shadcn Sheet บน mobile, Dialog บน desktop)
   - Sections:
     - Header: OrderID + StatusBadge + วันที่
     - Customer card (.panel-customer): ชื่อ/เบอร์/ที่อยู่/วันเกิด
     - Items table: ชื่อ × จำนวน = ราคา
     - Payment: วิธีจ่าย + รูปสลิป (ถ้ามี) + ธนาคาร
     - Ceremony (ถ้ามี): ชื่อพิธี, ผู้ร่วม, CostSnapshot
     - Note
   - Actions:
     - ✏️ แก้ไข → navigate /create-order#?edit=ID
     - 🔄 เปลี่ยนสถานะ → dropdown status ใหม่ → confirm
     - 📤 แชร์ → share-modal
     - 🗑️ ยกเลิก → confirm → updateOrderStatus("ยกเลิก")

5. **สร้าง src/components/orders/order-actions.tsx**
   - Dropdown menu (shadcn DropdownMenu)
   - Actions: ดู, แก้ไข, เปลี่ยนสถานะ, แชร์, ยกเลิก

6. **REPLACE src/views/manage-orders.tsx**
   - Full page: OrderFilters + OrderTable + OrderDetailModal
   - State: filters, selectedOrder, isDetailOpen
   - GlassPanel layout

## Business Rules:
- Status change ตาม flow เท่านั้น (ห้ามข้าม)
- confirmed → pending = ❌
- ยกเลิกได้จากทุกสถานะ
- Archived orders → separate tab/filter
- Price display: Thai locale toFixed(2)

## Verify:
- [ ] ออร์เดอร์จาก v1 ปรากฏใน v2
- [ ] Status เปลี่ยนจาก v1 → v2 เห็น real-time
- [ ] Status เปลี่ยนจาก v2 → v1 เห็น real-time
- [ ] Search + filter ทำงาน
- [ ] Pagination cursor-based (ไม่ skip)
- [ ] Mobile: card view, touch targets ≥ 44px
```

---

## 🔥 PHASE 4 — Customer & Product CRUD

### 🎯 Goal
หน้าจัดการลูกค้า, สินค้า, พิธี — CRUD เต็ม + Gemini AI

### 📁 Files

| Action | File | Purpose |
|--------|------|---------|
| **REPLACE** | `src/views/customers.tsx` | Customer table + search + modal |
| **NEW** | `src/components/customers/customer-modal.tsx` | Add/edit customer + Gemini parse |
| **REPLACE** | `src/views/products.tsx` | Product table + CRUD |
| **NEW** | `src/components/products/product-modal.tsx` | Product form with image upload |
| **REPLACE** | `src/views/ceremonies.tsx` | Ceremony CRUD |
| **REPLACE** | `src/views/quick-order.tsx` | Quick order (simplified form) |

### 🤖 AI Prompt

```
@DESIGN.md @ROADMAP.md

เราอยู่ที่ Phase 4 — Customer & Product CRUD

## งาน:

### 4.1 Customer Management
1. **REPLACE src/views/customers.tsx**
   - ตารางลูกค้าทั้งหมด (real-time, capped 500 recent)
   - Search: ชื่อ/เบอร์/ที่อยู่
   - Click row → customer-modal
   - GlassPanel layout with search bar

2. **NEW src/components/customers/customer-modal.tsx**
   - Dialog: เพิ่ม/แก้ไขลูกค้า
   - Fields: ชื่อ*, เบอร์*, ที่อยู่, วันเกิด, LINE User ID, หมายเหตุ
   - Gemini AI button: "แปลงจากข้อความ"
     - Input textarea → parseCustomerData callable
     - Show extracted: name, phone, address
     - Confirm → fill form
   - Save → customers collection
   - Delete (confirm)
   - Panel-variant: .panel-customer

### 4.2 Product Management
3. **REPLACE src/views/products.tsx**
   - ตารางสินค้า: ชื่อ, ราคา, หมวดหมู่, สต็อก, active
   - Search + filter by category
   - Click → product-modal

4. **NEW src/components/products/product-modal.tsx**
   - Fields: ชื่อ*, ราคา*, ต้นทุน, หมวดหมู่, หน่วย, สต็อก, แจ้งเตือนสต็อก
   - Image upload (Firebase Storage: products/{id})
     - Size limit: 1.2MB
     - Auto-compress: canvas API, max 2048px
     - Format: JPEG
   - Save → products collection
   - Panel-variant: .panel-product

### 4.3 Ceremony Management
5. **REPLACE src/views/ceremonies.tsx**
   - ตารางพิธี: ชื่อ, ราคาฐาน, จำนวนผู้ร่วม
   - Click → inline edit

### 4.4 Quick Order
6. **REPLACE src/views/quick-order.tsx**
   - Simplified create order form
   - Customer name only (autocomplete)
   - Product picker: item picker modal (grid view)
   - Quick save (skip ceremony, skip bank picker — default to โอน + first bank)

## Verify:
- [ ] เพิ่มลูกค้า → search หาเจอใน create-order autocomplete
- [ ] Gemini parse: ข้อความ "คุณสมชาย 0812345678 กรุงเทพ" → เติมฟอร์ม
- [ ] เพิ่มสินค้า → ปรากฏใน product picker ตอนสร้างออร์เดอร์
- [ ] Upload รูปสินค้า → < 1.2MB, JPEG, แสดงใน modal
- [ ] Quick order: สร้าง order ได้ใน 3 ขั้นตอน
```

---

## 🔥 PHASE 5 — LINE & Chat

### 🎯 Goal
ระบบแจ้งเตือน LINE: reply rules, broadcast, LINE customers, bot settings

### 📁 Files

| Action | File | Purpose |
|--------|------|---------|
| **REPLACE** | `src/views/reply-rules.tsx` | Auto-reply rule management |
| **NEW** | `src/components/line/reply-rule-editor.tsx` | Rule editor (keywords + blocks + buttons) |
| **NEW** | `src/components/line/chat-simulator.tsx` | Test chat simulator |
| **REPLACE** | `src/views/line-customers.tsx` | LINE customer list + chat history |
| **NEW** | `src/components/line/customer-chat.tsx` | Chat history viewer |
| **REPLACE** | `src/views/broadcast.tsx` | LINE broadcast composer |
| **REPLACE** | `src/views/line-bot.tsx` | Bot settings + feature flags |

### 🤖 AI Prompt

```
@DESIGN.md @ROADMAP.md

เราอยู่ที่ Phase 5 — LINE & Chat

## งาน:

### 5.1 Reply Rules
1. **REPLACE src/views/reply-rules.tsx**
   - ตารางกฎ: ชื่อ, keywords, status, last matched
   - จาก Firestore: reply_rules collection

2. **NEW src/components/line/reply-rule-editor.tsx**
   - Dialog (full-width on mobile)
   - Sections:
     - Rule name + keywords (comma-separated)
     - Message blocks: text, image (add/remove/reorder)
     - Quick reply buttons: up to 13, each with label + action
     - Button sub-menus (nested button editing)
   - Preview: how it looks in LINE
   - Panel-variant: .panel-note (cyan)

3. **NEW src/components/line/chat-simulator.tsx**
   - Input: typed message → match against rules
   - Output: show matched blocks in LINE-style bubbles
   - Highlight matching keywords

### 5.2 LINE Customers
4. **REPLACE src/views/line-customers.tsx**
   - Table/list: display name, picture, last message, bot
   - From: lineCustomers + line_contacts

5. **NEW src/components/line/customer-chat.tsx**
   - Chat history: line_contacts/{id}/messages subcollection
   - LINE-style bubbles (left=them, right=us)
   - Support: text, image, sticker, flex
   - Scroll to bottom, load more on scroll up
   - Auto-refresh

### 5.3 Broadcast
6. **REPLACE src/views/broadcast.tsx**
   - Composer: message type selector (text/image/flex)
   - Target: all / specific users / filter
   - Preview before send
   - Schedule: date/time or send now
   - Call: lineBroadcast CF
   - Sent history

### 5.4 LINE Bot Settings
7. **REPLACE src/views/line-bot.tsx**
   - Bot credentials (read-only from Firestore)
   - Feature flags:
     - NOTIFY_CUTOVER (0/1)
     - AUTO_ORDER_ENABLED (true/false)
   - Refresh profiles button
   - Quota status display

## Design Rules:
- LINE UI = cyan accent (.panel-note)
- Chat bubbles: LINE green for sent, gray for received
- Mobile-first: chat takes full screen
- Use shadcn Sheet for mobile modals

## Verify:
- [ ] Create rule → test in simulator → shows correct blocks
- [ ] LINE customer list loads from lineCustomers collection
- [ ] Chat history shows LINE-style bubbles
- [ ] Broadcast form sends (log only if NOTIFY_CUTOVER=0)
```

---

## 🔥 PHASE 6 — Media, Reports & Admin

### 📁 Files (12 views to implement)

| View | What it does |
|------|-------------|
| `scanner.tsx` | Slip scanner: upload image → Gemini Vision → parse tracking → match order |
| `print-receipt.tsx` | Print receipts: filter orders → printable view |
| `print-quick-order.tsx` | Quick order printing templates |
| `bills.tsx` | Bill/expense CRUD + print preview (A4/A5) |
| `reports.tsx` | Sales summary by date range |
| `inventory.tsx` | Stock overview dashboard |
| `payments.tsx` | Beam payment history |
| `gallery.tsx` | Firebase Storage image browser |
| `ceremony-cards.tsx` | Ceremony card image matching (Gemini) |
| `slips.tsx` | Slip image gallery |
| `system-tools.tsx` | Manual CF triggers |
| `sheets.tsx` | Legacy sheet management |

### 🤖 AI Prompt

```
@DESIGN.md @ROADMAP.md

เราอยู่ที่ Phase 6 — Media, Reports & Admin

สร้างทีละหน้า — 1 prompt ต่อ 1 หน้า:

## 1. scanner.tsx — สแกนสลิปขนส่ง
- Upload image → canvas compress → Gemini Vision scanSlip callable
- Result: tracking numbers, carrier, date
- Match with orders by name → auto-add tracking
- GlassPanel + image preview

## 2. print-receipt.tsx — พิมพ์รายรับ
- Filter orders by date range + status
- Preview: printable receipt format
- Print button → window.print()

## 3. bills.tsx — จัดการบิลรายจ่าย
- CRUD bills in bills collection
- Print preview modal: A4/A5 selector
- Thai number formatting

## 4. reports.tsx — รายงาน
- Date range picker
- Summary cards: total orders, total revenue, avg order
- Group by: day/week/month
- Table + export CSV

## 5. inventory.tsx — ภาพรวมสต็อก
- Cards: total products, low stock alert, out of stock
- Table of products with stock info
- Alert threshold indicator (red/yellow/green)

## 6. gallery.tsx — คลังภาพ
- Firebase Storage browser: by folder (products, slips, ceremonies)
- Grid view, click to enlarge
- Delete with confirm

## 7. system-tools.tsx — รัน CF
- Button list: masterNotifyShadow, processScheduledNotifications, purgeExpiredCancelledOrders
- Loading state + result display
- Manual trigger via HTTP

## General Rules:
- แต่ละหน้ารักษา Glassmorphism theme
- Mobile-first: single column → 2 columns on tablet
- Error handling + loading states ทุกหน้า
```

---

## 🔥 PHASE 7 — Polish & Ship

### 🎯 Goal
Mobile perfection + Performance + Deploy to production

### Checklist

| Category | Items |
|----------|-------|
| **Mobile** | No backdrop-blur, touch targets 44px+, hide hover, safe-area-inset |
| **Perf** | Lazy load all views, code split, Firestore detach on unmount, image lazy |
| **Error** | Toast notifications, offline banner, Thai error messages |
| **Access** | prefers-reduced-motion, keyboard nav, contrast ratio |
| **Deploy** | Custom domain, Firebase Hosting, cache headers, 404 fallback |
| **Quality** | ESLint clean, no console.log, TypeScript strict |

### 🤖 AI Prompt

```
@DESIGN.md @ROADMAP.md

เราอยู่ที่ Phase 7 — Polish & Ship

## Performance:
1. แก้ router → ใช้ lazy() แบบ static imports (ไม่ใช้ dynamic template string)
2. Detach Firestore listeners on unmount (ทุก hook)
3. Lazy load images: loading="lazy" + blur placeholder
4. Code split: view-level chunks

## Mobile:
1. Audit ทุก component: @media (max-width: 768px) → no blur, no hover
2. Touch targets: min-h-11 (44px) for all interactive elements
3. Safe area: pb-safe for bottom bars
4. Prevent zoom on input focus (iOS): maximum-scale=1

## Error Handling:
1. Toast system: success/error toast after every action
2. Offline detection: banner + auto-retry
3. Error boundaries: per-view
4. Firebase errors → Thai messages mapping

## Deploy:
1. Custom domain: admin-v2.srikanett.com
2. Firebase Hosting config
3. Cache headers: max-age=31536000 for /assets/*
4. 404.html → index.html (SPA fallback)
```

---

---

## 🤖 AI LOOPS — วิธีใช้ Cursor ให้เวิร์กที่สุด

### 🔁 AI Loop Pattern

```
┌─────────────────────────────────────────────────────┐
│  1. เปิด Cursor → เปิดโปรเจกต์ admin-v2               │
│  2. Copy-paste Prompt จาก ROADMAP.md                 │
│  3. AI generates code → review → test                 │
│  4. ไม่เวิร์ก? → แปะ error → AI fix                    │
│  5. เวิร์ก → git commit → ไป Phase ถัดไป               │
│  6. Repeat 🔁                                         │
└─────────────────────────────────────────────────────┘
```

### 📋 Checklist ก่อนเริ่มแต่ละ Phase

```
□ อ่าน ROADMAP.md section ของ Phase นั้น
□ เข้าใจ Business Rules (status flow, validations)
□ รู้ว่าไฟล์ไหนต้อง CREATE vs MODIFY
□ รู้ว่า CF ตัวไหนต้องเรียก (input/output)
□ รู้ว่าห้ามอะไร (สร้าง CF ใหม่, เปลี่ยน schema)
□ มี @DESIGN.md เปิดไว้ข้างๆ (สี, component specs)
```

### 🐛 Debug Loop

```
1. Build error? → npx tsc -b → อ่าน error → fix
2. Runtime error? → เปิด browser console → อ่าน stack trace
3. Firebase error? → เช็ค security rules → เช็ค field names
4. CF error? → curl ทดสอบ CF endpoint โดยตรง
5. UI ไม่สวย? → เทียบกับ DESIGN.md → แก้สี/border/blur
```

### 📝 Commit Template

```
git add -A
git commit -m "Phase X: [what was built]

- [file]: [what it does]
- [file]: [what it does]

Closes #[issue]"
git push origin main
```

---

## 🚨 CRITICAL RULES (อ่านก่อนเขียนโค้ดทุกครั้ง)

1. ❌ **ห้ามสร้าง Cloud Function ใหม่** — ใช้ของเดิมเท่านั้น
2. ❌ **ห้ามสร้าง Firestore collection ใหม่** — ใช้ 34 collections ที่มีอยู่
3. ❌ **ห้ามเปลี่ยน field name** — ใช้ `readField_()` รองรับ variants (ไทย/PascalCase/camelCase)
4. ❌ **ห้ามเปลี่ยน `ordercusApi` contract** — OrderCus ฝั่งลูกค้าต้องไม่พัง
5. ❌ **ห้ามใช้ Firebase Admin SDK** — client SDK เท่านั้น
6. ❌ **ห้าม deploy ทับของเก่า** — admin.srikanett.com = v1 (Netlify), admin-v2-rho.vercel.app = v2
7. ✅ **ใช้ `readField_()` เสมอ** — field names มีหลายแบบ (Name/name/NameThai)
8. ✅ **ใช้ constants** — `COLLECTIONS.*` ไม่ hardcode string
9. ✅ **CF response format** — unwrap `{status, data}` envelope
10. ✅ **Design** — Gold #D4952A on Purple #1D1A39, Glassmorphism blur 24px

---

## 📞 Quick Reference

| What | Value |
|------|-------|
| Repo | `https://github.com/srikanett/admin-v2` |
| Deploy | `https://admin-v2-rho.vercel.app` |
| Local | `cd /opt/data/admin-v2 && npm run dev` |
| Build | `npm run build` |
| Deploy | `npx vercel --prod --yes` |
| Firebase Project | `srikanett-order` |
| CF Base URL | `https://asia-southeast1-srikanett-order.cloudfunctions.net` |
| Design Theme | Sacred Luxury — Gold #D4952A on Purple #1D1A39 |
| PIN | `882882` |
| Branch | `main` |

---

**Last Updated:** 2026-06-28  
**Current Phase:** 2b (Create Order: Save & Share)  
**Next Action:** 🔥 เริ่ม Phase 2b — ทำให้กดบันทึกแล้วข้อมูลลง Firestore