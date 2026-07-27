export type ShareResult = "shared" | "cancelled" | "whatsapp" | "copied" | "unavailable"

// Tries the native Web Share sheet first (lets the user pick WhatsApp,
// Telegram, SMS, etc. themselves — the richest option on mobile). Falls
// back to a pre-filled wa.me link when a phone number is on file, since
// WhatsApp is the default channel landlords use in this market. Last
// resort: copy the summary to the clipboard.
export async function shareInvoiceSummary(params: {
  roomNumber: string
  tenantName: string
  phone: string | null
  amountLabel: string
  dueLabel: string
}): Promise<ShareResult> {
  const message = `Hi ${params.tenantName || "there"}, this is a reminder that your rent for ${params.roomNumber} — ${params.amountLabel} — is ${params.dueLabel}. Thank you!`

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: `Invoice — ${params.roomNumber}`, text: message })
      return "shared"
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "cancelled"
      // Any other share failure falls through to the WhatsApp/clipboard path below.
    }
  }

  if (params.phone) {
    const digits = params.phone.replace(/[^\d]/g, "")
    if (digits) {
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer")
      return "whatsapp"
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(message)
    return "copied"
  }

  return "unavailable"
}
