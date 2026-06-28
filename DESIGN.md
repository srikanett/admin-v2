# DESIGN.md — SRIKANETT DHEVALAI v2.0
> **Theme:** Sacred Luxury — Gold + Purple + Glassmorphism  
> **Brand:** ศรีคเนศ เทวาลัย (SRIKANETT DHEVALAI)  
> **Philosophy:** "Every design should feel like a sacred luxury brand, where modern elegance meets timeless spirituality."

---

## 🎨 Color System

### Primary — Luxury Sacred Gold (70%)
| Token | HEX | CSS |
|-------|-----|-----|
| gold-900 | `#3B2506` | `--color-gold-900` |
| gold-800 | `#6B4410` | `--color-gold-800` |
| gold-600 | `#A06A1B` | `--color-gold-600` |
| gold-500 | `#D4952A` | `--color-gold-500` |
| gold-300 | `#E8BF6A` | `--color-gold-300` |
| gold-100 | `#F5E6C8` | `--color-gold-100` |

### Secondary — Sacred Purple & Rose (25%)
| Token | HEX | CSS |
|-------|-----|-----|
| purple-900 | `#1D1A39` | `--color-purple-900` |
| purple-800 | `#451952` | `--color-purple-800` |
| purple-700 | `#662549` | `--color-purple-700` |
| purple-500 | `#804A8A` | `--color-purple-500` |
| rose-600 | `#AE445A` | `--color-rose-600` |
| rose-500 | `#C72895` | `--color-rose-500` |
| rose-400 | `#DD6FB4` | `--color-rose-400` |
| rose-200 | `#EFB5D7` | `--color-rose-200` |

### Accent (5%)
`success=#22B573` `danger=#C62828` `info=#335DFF`

---

## 🖌️ Glassmorphism Spec

```
Background:  rgba(69, 25, 82, 0.15)
Border:      rgba(212, 149, 42, 0.10)
Blur:        24px (default) / 32px (large)
Radius:      1rem
Shadow:      0 8px 32px rgba(29, 26, 57, 0.4)
```

**Section Variants:**
- `.glass-panel` — default gold border
- `.panel-customer` — gold border 강조
- `.panel-order` — red border
- `.panel-product` — rose border
- `.panel-ceremony` — purple border
- `.panel-note` — cyan border

---

## 🧩 Components

### Buttons
| Variant | Gradient | Usage |
|---------|----------|-------|
| `.btn-gold` | `#F5E6C8 → #D4952A → #A06A1B` | Primary CTA |
| `.btn-purple` | `#451952 → #AE445A` | Secondary |
| `.btn-ghost` | transparent + gold border | Low emphasis |

### Status Badges
```
สร้างออร์เดอร์    gray    #9A9A9A
ชำระเงินสำเร็จ    emerald #22B573
รอตรวจสอบ        amber   #EAB308
รอจัดส่ง          orange  #F97316
สำเร็จ            green   #22C55E
ยกเลิก            red     #EF4444
```

---

## 📐 Responsive Rules

### Mobile (`<768px`)
- ❌ No backdrop-blur
- ❌ No hover animations
- ❌ No aurora effects
- ✅ Touch targets ≥ 44px

### Desktop (`≥768px`)
- ✅ Full glassmorphism
- ✅ Hover lift animations

---

## ⛔ Anti-Patterns
1. ❌ White/cream backgrounds
2. ❌ Neon/bright colors
3. ❌ Rainbow gradients
4. ❌ Flat design
5. ❌ Cartoon/plastic look

---

**Last Updated:** 2026-06-28