"use client"

import { CheckCircle2, Phone, Share2 } from "lucide-react"
import { toast } from "sonner"

import type { AttentionRoom } from "@/lib/needs-attention"
import { daysOverdue } from "@/lib/needs-attention"
import { usdToKhr } from "@/lib/calc"
import { formatCurrency } from "@/lib/currency"
import { formatDateDMY } from "@/lib/date"
import { shareInvoiceSummary } from "@/lib/share"
import type { Currency } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function NeedsAttentionCard({
  attention,
  currency,
  isPending,
  onMarkPaid,
  onOpen,
}: {
  attention: AttentionRoom
  currency: Currency
  isPending: boolean
  onMarkPaid: () => void
  onOpen: () => void
}) {
  const { t, locale } = useI18n()
  const { room, invoice } = attention
  const overdueDays = invoice.isOverdue ? daysOverdue(invoice.dueDate) : 0

  const amountLabel =
    currency === "KHR"
      ? formatCurrency(usdToKhr(invoice.amountDue), "KHR", locale)
      : formatCurrency(invoice.amountDue, "USD", locale)

  const overdueDaysDisplay = overdueDays > 99 ? "99+" : `${overdueDays}`
  const dueLabel = invoice.isOverdue
    ? `${overdueDaysDisplay} ${overdueDays === 1 ? t("dayOverdueLabelSingular") : t("daysOverdueLabel")}`
    : `${t("dueLabel")} ${formatDateDMY(invoice.dueDate)}`

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation()
    const result = await shareInvoiceSummary({
      roomNumber: room.roomNumber,
      tenantName: room.tenant?.fullName ?? "",
      phone: room.tenant?.phone ?? null,
      amountLabel,
      dueLabel,
    })
    if (result === "copied") toast.success(t("shareCopiedToast"))
  }

  function handleMarkPaid(e: React.MouseEvent) {
    e.stopPropagation()
    onMarkPaid()
  }

  return (
    <Card
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen()
      }}
      className={cn(
        "cursor-pointer border-l-4 transition-all hover:shadow-md active:scale-[0.98]",
        invoice.isOverdue ? "border-l-destructive" : "border-l-amber-500",
      )}
    >
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <span className="font-heading text-base font-semibold">{room.roomNumber}</span>
            <span className="truncate text-sm text-muted-foreground">
              {room.tenant?.fullName ?? t("noTenant")}
            </span>
            {room.tenant?.phone ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="size-3" />
                {room.tenant.phone}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/60">{t("noPhoneOnFile")}</span>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-lg font-semibold tabular-nums">{amountLabel}</span>
            <Badge variant={invoice.isOverdue ? "destructive" : "outline"} className="whitespace-nowrap">
              {dueLabel}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            className="min-h-11 flex-1"
            disabled={isPending}
            onClick={handleMarkPaid}
          >
            <CheckCircle2 data-icon="inline-start" />
            {t("markPaidAction")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 flex-1"
            onClick={handleShare}
          >
            <Share2 data-icon="inline-start" />
            {t("shareInvoiceAction")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
