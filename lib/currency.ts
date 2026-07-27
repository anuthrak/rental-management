export function formatCurrency(
  amount: number,
  currency: string,
  locale = "en-US",
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0)
  } catch {
    return `${currency} ${(amount || 0).toFixed(2)}`
  }
}

export function formatNumber(value: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(value || 0)
}

// Riel is conventionally shown with no decimal places.
export function formatKHR(amountKhr: number): string {
  try {
    return new Intl.NumberFormat("km-KH", {
      style: "currency",
      currency: "KHR",
      maximumFractionDigits: 0,
    }).format(amountKhr || 0)
  } catch {
    return `KHR ${Math.round(amountKhr || 0)}`
  }
}
