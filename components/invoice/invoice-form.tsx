"use client"

import { Building2, CalendarRange, Droplets, NotebookPen, ReceiptText, User } from "lucide-react"

import { CURRENCIES, type Currency } from "@/lib/types"
import { electricCost, usdToKhr, waterCost } from "@/lib/calc"
import { formatCurrency, formatKHR } from "@/lib/currency"
import { addDaysDateOnly, monthBounds, todayDateOnly } from "@/lib/date"
import { useI18n } from "@/components/i18n-provider"
import { useInvoiceStore } from "@/store/use-invoice-store"
import { useSimpleModeStore } from "@/store/use-simple-mode-store"
import { AdvancedSection } from "@/components/simple-mode/advanced-section"
import { LineItemTable } from "@/components/invoice/line-item-table"
import { InvoiceTotals } from "@/components/invoice/invoice-totals"
import { FormActions } from "@/components/invoice/form-actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <Icon className="size-4" />
      </span>
      <h3 className="font-heading text-sm font-medium">{children}</h3>
    </div>
  )
}

const CURRENCY_LABELS: Record<Currency, string> = {
  USD: "USD ($)",
  KHR: "KHR (៛)",
}

function FieldError({ id }: { id: string }) {
  const message = useInvoiceStore((s) => s.errors[id])
  if (!message) return null
  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  )
}

export function FormField({
  id,
  label,
  placeholder,
  type = "text",
}: {
  id: keyof ReturnType<typeof useInvoiceStore.getState>["draft"]
  label: string
  placeholder?: string
  type?: string
}) {
  const value = useInvoiceStore((s) => s.draft[id] as string)
  const updateDraft = useInvoiceStore((s) => s.updateDraft)
  const error = useInvoiceStore((s) => s.errors[id])

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={!!error}
        onChange={(e) => updateDraft({ [id]: e.target.value })}
      />
      <FieldError id={id} />
    </div>
  )
}

export function InvoiceForm({
  previewRef,
}: {
  previewRef: React.RefObject<HTMLDivElement | null>
}) {
  const { t, locale } = useI18n()
  const simpleMode = useSimpleModeStore((s) => s.simpleMode)
  const currency = useInvoiceStore((s) => s.draft.currency)
  const startDate = useInvoiceStore((s) => s.draft.startDate)
  const updateDraft = useInvoiceStore((s) => s.updateDraft)
  const waterUsageM3 = useInvoiceStore((s) => s.draft.waterUsageM3)
  const electricUsageKWh = useInvoiceStore((s) => s.draft.electricUsageKWh)
  const waterRateUsd = useInvoiceStore((s) => s.draft.waterRateUsd)
  const electricRateUsd = useInvoiceStore((s) => s.draft.electricRateUsd)
  const setUtilityRate = useInvoiceStore((s) => s.setUtilityRate)
  const notes = useInvoiceStore((s) => s.draft.notes)

  function displayUtilityAmount(amountUsd: number): string {
    return currency === "KHR"
      ? formatCurrency(usdToKhr(amountUsd), "KHR", locale)
      : formatCurrency(amountUsd, "USD", locale)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Business */}
      <section className="flex flex-col gap-4">
        <SectionHeading icon={Building2}>{t("companyInfo")}</SectionHeading>
        <AdvancedSection>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="companyName"
              label={t("companyName")}
              placeholder={t("companyNamePlaceholder")}
            />
            <FormField
              id="invoiceNumber"
              label={t("invoiceNumber")}
              placeholder="#0001"
            />
            <div className="sm:col-span-2">
              <FormField
                id="companyAddress"
                label={t("companyAddress")}
                placeholder={t("companyAddressPlaceholder")}
              />
            </div>
          </div>
        </AdvancedSection>
      </section>

      <Separator />

      {/* Tenant */}
      <section className="flex flex-col gap-4">
        <SectionHeading icon={User}>{t("tenantInfo")}</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="guestName"
            label={t("guestName")}
            placeholder={t("guestNamePlaceholder")}
          />
          <FormField
            id="roomNumber"
            label={t("roomNumber")}
            placeholder={t("roomNumberPlaceholder")}
          />
          <FormField
            id="nationalId"
            label={t("nationalId")}
            placeholder={t("nationalIdPlaceholder")}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currency">{t("currency")}</Label>
            <Select
              value={currency}
              onValueChange={(value) =>
                updateDraft({ currency: value as Currency })
              }
            >
              <SelectTrigger id="currency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CURRENCY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <Separator />

      {/* Billing period */}
      <section className="flex flex-col gap-4">
        <SectionHeading icon={CalendarRange}>
          {t("billingPeriod")}
        </SectionHeading>
        {simpleMode ? (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="billingMonth">{t("billingMonthLabel")}</Label>
              <Input
                id="billingMonth"
                type="month"
                className="min-h-11"
                value={startDate.slice(0, 7)}
                onChange={(e) => {
                  if (!e.target.value) return
                  const { start, end } = monthBounds(e.target.value)
                  const issueDate = todayDateOnly()
                  updateDraft({
                    startDate: start,
                    endDate: end,
                    issueDate,
                    dueDate: addDaysDateOnly(issueDate, 7),
                  })
                }}
              />
            </div>
            <AdvancedSection>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="startDate" label={t("startDate")} type="date" />
                <FormField id="endDate" label={t("endDate")} type="date" />
                <FormField id="issueDate" label={t("issueDate")} type="date" />
                <FormField id="dueDate" label={t("dueDateField")} type="date" />
              </div>
            </AdvancedSection>
          </>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="startDate" label={t("startDate")} type="date" />
            <FormField id="endDate" label={t("endDate")} type="date" />
            <FormField id="issueDate" label={t("issueDate")} type="date" />
            <FormField id="dueDate" label={t("dueDateField")} type="date" />
          </div>
        )}
      </section>

      <Separator />

      {/* Utility usage (excluded from the grand total) */}
      <section className="flex flex-col gap-4">
        <SectionHeading icon={Droplets}>{t("utilityUsage")}</SectionHeading>

        <AdvancedSection className="flex flex-col gap-4">
        {/* Base unit rates — editable, USD-anchored with a live KHR reference */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="waterRate">{t("waterRateField")}</Label>
            <Input
              id="waterRate"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={waterRateUsd}
              onChange={(e) =>
                setUtilityRate("water", e.target.value === "" ? 0 : Number(e.target.value))
              }
            />
            <span className="text-xs text-muted-foreground">
              ({formatKHR(usdToKhr(waterRateUsd))})
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="electricRate">{t("electricRateField")}</Label>
            <Input
              id="electricRate"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={electricRateUsd}
              onChange={(e) =>
                setUtilityRate("electric", e.target.value === "" ? 0 : Number(e.target.value))
              }
            />
            <span className="text-xs text-muted-foreground">
              ({formatKHR(usdToKhr(electricRateUsd))})
            </span>
          </div>
        </div>

        {/* Aggregate usage for this invoice — informational only */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="waterUsage">{t("waterUsageLabel")}</Label>
            <Input
              id="waterUsage"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={waterUsageM3}
              onChange={(e) =>
                updateDraft({
                  waterUsageM3: e.target.value === "" ? 0 : Number(e.target.value),
                })
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="electricUsage">{t("electricUsageLabel")}</Label>
            <Input
              id="electricUsage"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={electricUsageKWh}
              onChange={(e) =>
                updateDraft({
                  electricUsageKWh: e.target.value === "" ? 0 : Number(e.target.value),
                })
              }
            />
          </div>
        </div>
        {(waterUsageM3 > 0 || electricUsageKWh > 0) && (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            {waterUsageM3 > 0 && (
              <>
                {t("waterCostNote")}: {displayUtilityAmount(waterCost(waterUsageM3, waterRateUsd))}
                {electricUsageKWh > 0 && " · "}
              </>
            )}
            {electricUsageKWh > 0 && (
              <>
                {t("electricCostNote")}:{" "}
                {displayUtilityAmount(electricCost(electricUsageKWh, electricRateUsd))}
              </>
            )}
            {" — "}
            {t("utilityNoteTitle")}
          </p>
        )}
        </AdvancedSection>
      </section>

      <Separator />

      {/* Line items */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <SectionHeading icon={ReceiptText}>{t("lineItems")}</SectionHeading>
        </div>
        <LineItemTable />
        <LineItemsError />
      </section>

      <InvoiceTotals />

      {/* Notes */}
      <section className="flex flex-col gap-4">
        <SectionHeading icon={NotebookPen}>{t("notesLabel")}</SectionHeading>
        <AdvancedSection>
          <Textarea
            id="notes"
            rows={5}
            value={notes}
            onChange={(e) => updateDraft({ notes: e.target.value })}
          />
        </AdvancedSection>
      </section>

      <FormActions previewRef={previewRef} />
    </div>
  )
}

function LineItemsError() {
  const error = useInvoiceStore((s) => s.errors["lineItems"])
  if (!error) return null
  return (
    <p className="text-xs text-destructive" role="alert">
      {error}
    </p>
  )
}
