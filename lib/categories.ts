import { ELECTRIC_RATE_USD, SECURITY_FEE_AMOUNT, SECURITY_FEE_ID, WATER_RATE_USD } from "@/lib/calc"
import { dictionaries, type TranslationKey } from "@/lib/i18n"
import type { Language, LineItem, Unit } from "@/lib/types"

// Canonical, dual-language default invoice categories. This is the single
// source of truth for every place that pre-loads categories — demo state
// (store/use-invoice-store.ts), the invoice generator's quick-add presets
// (components/invoice/line-item-table.tsx), and the room-drawer's
// "Generate Invoice" seed items (components/dashboard/room-drawer.tsx) — so
// a label/unit only ever needs to change in one place.
export type CategoryId =
  | "roomRate"
  | "deposit"
  | "water"
  | "electricity"
  | "waste"
  | "sanitation"
  | "wifi"
  | "securityFee"

export interface InvoiceCategoryDefault {
  id: CategoryId
  translationKey: TranslationKey
  unit: Unit
  // Security Fee is a fixed flat charge toggled on/off rather than a
  // quantity × rate line the user fills in — see toggleSecurityFee in
  // store/use-invoice-store.ts.
  isFlatFee?: boolean
  flatFeeAmount?: number
  // Water/electricity quantity is derived from previousMeter/recentMeter
  // rather than entered directly — see meterUsage in lib/types.ts.
  isMetered?: boolean
  defaultRate?: number
}

export const DEFAULT_INVOICE_CATEGORIES: InvoiceCategoryDefault[] = [
  { id: "roomRate", translationKey: "presetRoom", unit: "month" },
  { id: "deposit", translationKey: "presetDeposit", unit: "unit" },
  {
    id: "water",
    translationKey: "presetWater",
    unit: "m³",
    isMetered: true,
    defaultRate: WATER_RATE_USD,
  },
  {
    id: "electricity",
    translationKey: "presetElectricity",
    unit: "kW",
    isMetered: true,
    defaultRate: ELECTRIC_RATE_USD,
  },
  { id: "waste", translationKey: "presetWaste", unit: "unit" },
  { id: "sanitation", translationKey: "presetSanitation", unit: "unit" },
  { id: "wifi", translationKey: "presetWifi", unit: "month" },
  {
    id: "securityFee",
    translationKey: "securityFee",
    unit: "$",
    isFlatFee: true,
    flatFeeAmount: SECURITY_FEE_AMOUNT,
  },
]

const CATEGORY_BY_ID = new Map(DEFAULT_INVOICE_CATEGORIES.map((c) => [c.id, c]))

export function categoryLabel(id: CategoryId, language: Language): string {
  const category = CATEGORY_BY_ID.get(id)
  if (!category) return id
  const dict = dictionaries[language] ?? dictionaries.en
  return dict[category.translationKey]
}

// Builds a ready-to-use line item initializer for a category, covering the
// three shapes categories come in: a fixed flat fee (Security Fee, keyed to
// SECURITY_FEE_ID so the toggle button can find/remove it), a metered item
// (Water/Electricity, quantity driven by meter readings), or a plain
// quantity × rate line (everything else). Centralized here so every
// pre-load site — the invoice generator's default draft
// (store/use-invoice-store.ts) and the room-drawer's "Generate Invoice"
// seed items (components/dashboard/room-drawer.tsx) — stays in sync.
export function defaultCategoryLineItem(
  category: InvoiceCategoryDefault,
  language: Language,
): Partial<LineItem> {
  const label = categoryLabel(category.id, language)
  if (category.isFlatFee) {
    return {
      id: SECURITY_FEE_ID,
      label,
      quantity: 1,
      unit: category.unit,
      rate: category.flatFeeAmount ?? 0,
    }
  }
  if (category.isMetered) {
    return {
      label,
      quantity: 0,
      unit: category.unit,
      rate: category.defaultRate ?? 0,
      previousMeter: 0,
      recentMeter: 0,
    }
  }
  return { label, quantity: 1, unit: category.unit, rate: category.defaultRate ?? 0 }
}
