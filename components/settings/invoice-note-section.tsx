"use client"

import { useI18n } from "@/components/i18n-provider"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function InvoiceNoteSection({
  invoiceNoteTemplate,
  onInvoiceNoteTemplateChange,
}: {
  invoiceNoteTemplate: string
  onInvoiceNoteTemplateChange: (value: string) => void
}) {
  const { t } = useI18n()

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-base font-medium">{t("invoiceNoteSectionTitle")}</h2>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-invoice-note">{t("invoiceNoteTemplateField")}</Label>
        <Textarea
          id="settings-invoice-note"
          rows={5}
          value={invoiceNoteTemplate}
          onChange={(e) => onInvoiceNoteTemplateChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{t("invoiceNoteTemplateDesc")}</p>
      </div>
    </section>
  )
}
