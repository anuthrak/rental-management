"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import type { AttentionRoom } from "@/lib/needs-attention"
import type { Currency } from "@/lib/types"
import { useI18n } from "@/components/i18n-provider"
import { setInvoiceStatus } from "@/app/actions/dashboard"
import { NeedsAttentionCard } from "@/components/dashboard/needs-attention-card"

export function NeedsAttentionView({
  attentionRooms,
  currency,
  onOpenRoom,
}: {
  attentionRooms: AttentionRoom[]
  currency: Currency
  onOpenRoom: (roomId: string) => void
}) {
  const { t } = useI18n()
  const [isPending, startTransition] = useTransition()

  function handleMarkPaid(invoiceId: string) {
    startTransition(async () => {
      await setInvoiceStatus(invoiceId, "PAID")
      toast.success(t("invoiceMarkedPaidToast"))
    })
  }

  if (attentionRooms.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        {t("noAttentionRooms")}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {attentionRooms.map((attention) => (
        <NeedsAttentionCard
          key={attention.room.id}
          attention={attention}
          currency={currency}
          isPending={isPending}
          onMarkPaid={() => handleMarkPaid(attention.invoice.id)}
          onOpen={() => onOpenRoom(attention.room.id)}
        />
      ))}
    </div>
  )
}
