"use client"

import { Plus, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { UNITS, type Unit } from "@/lib/types"
import { lineAmount } from "@/lib/calc"
import { formatCurrency } from "@/lib/currency"
import { useI18n } from "@/components/i18n-provider"
import { useInvoiceStore } from "@/store/use-invoice-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Preset {
  key: string
  label: string
  unit: Unit
}

export function LineItemTable() {
  const { t, locale } = useI18n()
  const lineItems = useInvoiceStore((s) => s.draft.lineItems)
  const currency = useInvoiceStore((s) => s.draft.currency)
  const addLineItem = useInvoiceStore((s) => s.addLineItem)
  const updateLineItem = useInvoiceStore((s) => s.updateLineItem)
  const removeLineItem = useInvoiceStore((s) => s.removeLineItem)

  const presets: Preset[] = [
    { key: "presetRoom", label: t("presetRoom"), unit: "month" },
    { key: "presetWater", label: t("presetWater"), unit: "m³" },
    { key: "presetElectricity", label: t("presetElectricity"), unit: "kW" },
    { key: "presetWaste", label: t("presetWaste"), unit: "unit" },
    { key: "presetSanitation", label: t("presetSanitation"), unit: "unit" },
    { key: "presetWifi", label: t("presetWifi"), unit: "month" },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {t("quickAdd")}
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.key}
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                addLineItem({ label: preset.label, unit: preset.unit })
              }
            >
              <Plus data-icon="inline-start" />
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Column headers (desktop) */}
      {lineItems.length > 0 && (
        <div className="hidden grid-cols-[1fr_5rem_5.5rem_6rem_6rem_2rem] items-center gap-2 px-1 text-xs font-medium text-muted-foreground md:grid">
          <span>{t("label")}</span>
          <span className="text-right">{t("quantity")}</span>
          <span>{t("unit")}</span>
          <span className="text-right">{t("rate")}</span>
          <span className="text-right">{t("amount")}</span>
          <span className="sr-only">Remove</span>
        </div>
      )}

      <div className="flex flex-col gap-3 md:gap-2">
        {lineItems.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {t("noLineItems")}
          </p>
        )}

        {lineItems.map((item, index) => {
          const amount = lineAmount(item)
          return (
            <div
              key={item.id}
              className={cn(
                "grid grid-cols-2 gap-2 rounded-lg border border-border p-3 md:grid-cols-[1fr_5rem_5.5rem_6rem_6rem_2rem] md:items-center md:rounded-none md:border-0 md:p-0",
              )}
            >
              <div className="col-span-2 md:col-span-1">
                <Label
                  htmlFor={`label-${item.id}`}
                  className="mb-1 text-xs text-muted-foreground md:hidden"
                >
                  {t("label")}
                </Label>
                <Input
                  id={`label-${item.id}`}
                  value={item.label}
                  placeholder={`${t("labelPlaceholder")} #${index + 1}`}
                  onChange={(e) =>
                    updateLineItem(item.id, { label: e.target.value })
                  }
                />
              </div>

              <div>
                <Label
                  htmlFor={`qty-${item.id}`}
                  className="mb-1 text-xs text-muted-foreground md:hidden"
                >
                  {t("quantity")}
                </Label>
                <Input
                  id={`qty-${item.id}`}
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  className="text-right"
                  value={item.quantity}
                  onChange={(e) =>
                    updateLineItem(item.id, {
                      quantity: e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label className="mb-1 text-xs text-muted-foreground md:hidden">
                  {t("unit")}
                </Label>
                <Select
                  value={item.unit}
                  onValueChange={(value) =>
                    updateLineItem(item.id, { unit: value as Unit })
                  }
                >
                  <SelectTrigger className="w-full" aria-label={t("unit")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor={`rate-${item.id}`}
                  className="mb-1 text-xs text-muted-foreground md:hidden"
                >
                  {t("rate")}
                </Label>
                <Input
                  id={`rate-${item.id}`}
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  className="text-right"
                  value={item.rate}
                  onChange={(e) =>
                    updateLineItem(item.id, {
                      rate: e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="flex flex-col md:items-end">
                <Label className="mb-1 text-xs text-muted-foreground md:hidden">
                  {t("amount")}
                </Label>
                <span className="flex h-8 items-center font-medium tabular-nums md:justify-end">
                  {formatCurrency(amount, currency, locale)}
                </span>
              </div>

              <div className="col-span-2 flex justify-end md:col-span-1 md:justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${item.label || "line item"}`}
                  onClick={() => removeLineItem(item.id)}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => addLineItem()}
        >
          <Plus data-icon="inline-start" />
          {t("addLineItem")}
        </Button>
      </div>
    </div>
  )
}
