# DESIGN.md: Niagarupa Visual Identity & Design System

## 1. Identity & Brand Character
- **Product**: Niagarupa (*Karya Berdaya, Niaga Tertata*)
- **Audience**: Indonesian MSME owners (kuliner, kriya, fashion, desain), store cashiers/staff, and local buyers.
- **Personality**: Grounded, trustworthy, high-utility ledger & Nusantara storefront. Built for bright tropical daylight readability on low-to-mid-range phones and cashier tablets.
- **Dials**: `ENERGY 2 / RHYTHM 2 / MOTION 1`

## 2. Color Palette (WCAG AA Verified)
Limited to 2 core neutrals + 1 deliberate brand accent (`R-25`, `R-29`):
- **Surface Base (Light)**: `#FFFFFF` (`--background`) and `#F1F5F9` (`--muted`) for ledger separation.
- **Ink / Foreground (Light)**: `#090D16` (`--foreground`, 19.3:1 on white) and `#475569` (`--muted-foreground`, 6.92:1 on `#F1F5F9`).
- **Primary Brand Accent (Hijau Niaga)**: `#0E6F4E` (`hsl(158, 78%, 25%)`, 6.17:1 contrast with `#FFFFFF`) for primary actions and active ledger states.
- **Semantic Status**:
  - Warning / Low Stock: `#B45309` (`amber-700`, 5.02:1 on white)
  - Danger / Out of Stock / Expense: `#BE123C` (`rose-700`, 6.30:1 on white)

## 3. Typography & Hierarchy (`R-06`, `R-31`)
- **Primary Typeface**: `Inter` (`--font-inter`) chosen for high x-height legibility on dense financial tables, Indonesian currency formatting, and small mobile cashier screens.
- **Numeric Discipline**: Tabular numerals (`font-mono` / `tabular-nums`) strictly reserved for SKUs, Rupiah currency figures, stock counts, and invoice codes so columns align vertically.

## 4. Layout, Rhythm & Mobile Reflow (`R-03`, `R-05`, `R-20`)
- **Rhythm (Dial 2)**: Asymmetric editorial split on the public landing page (live ledger preview beside narrative copy, followed by a numbered operational workflow table rather than uniform 3-card templates).
- **Mobile Reflow**: Dashboard navigation collapses into a slide-over drawer + compact top bar on `<1024px` viewports with minimum `44x44px` tap targets.
- **Identity Motif**: Ledger ticket borders and tabular Rupiah badges repeated across POS receipts, storefront carts, and financial summaries.
