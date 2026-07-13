"use client"

import { Building2, CalendarRange, ReceiptText, User } from "lucide-react"

import { CURRENCIES, type Currency } from "@/lib/types"
import { useI18n } from "@/components/i18n-provider"
import { useInvoiceStore } from "@/store/use-invoice-store"
import { LineItemTable } from "@/components/invoice/line-item-table"
import { InvoiceTotals } from "@/components/invoice/invoice-totals"
import { FormActions } from "@/components/invoice/form-actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
  const { t } = useI18n()
  const currency = useInvoiceStore((s) => s.draft.currency)
  const updateDraft = useInvoiceStore((s) => s.updateDraft)

  return (
    <div className="flex flex-col gap-6">
      {/* Business */}
      <section className="flex flex-col gap-4">
        <SectionHeading icon={Building2}>{t("companyInfo")}</SectionHeading>
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
                      {c}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="startDate" label={t("startDate")} type="date" />
          <FormField id="endDate" label={t("endDate")} type="date" />
        </div>
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
