// Calendar-date helpers.
//
// `new Date("YYYY-MM-DD")` parses the string as UTC midnight, and then any
// local-timezone read (toLocaleDateString, Intl.DateTimeFormat without an
// explicit timeZone, getDate/getMonth/getFullYear) re-renders it relative to
// the viewer's offset, silently shifting the calendar date by a day. These
// helpers never round-trip a plain calendar date through that UTC step, so
// the date a user picked is always the date that gets displayed.

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})/

/**
 * Parses a "YYYY-MM-DD" string into a Date representing local midnight for
 * that calendar day, so `.getDate()/.getMonth()/.getFullYear()` on the
 * result always match the digits that were typed in — no UTC round-trip.
 */
export function parseDateOnly(value: string): Date | null {
  const match = DATE_ONLY_RE.exec(value)
  if (!match) return null
  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Formats a calendar date as DD/MM/YYYY.
 *
 * Accepts either a "YYYY-MM-DD" date-only string (e.g. invoice draft
 * dates from a native `<input type="date">`, formatted directly from its
 * digits — no Date object involved) or a Date object (e.g. a Prisma
 * DateTime that was stored from a date-only value, read back with UTC
 * getters so it reflects the same calendar day it was saved as).
 */
export function formatDateDMY(value: string | Date | null | undefined): string {
  if (!value) return "—"

  if (typeof value === "string") {
    const match = DATE_ONLY_RE.exec(value)
    if (!match) return "—"
    const [, year, month, day] = match
    return `${day}/${month}/${year}`
  }

  if (Number.isNaN(value.getTime())) return "—"
  const day = String(value.getUTCDate()).padStart(2, "0")
  const month = String(value.getUTCMonth() + 1).padStart(2, "0")
  const year = value.getUTCFullYear()
  return `${day}/${month}/${year}`
}

// Today's calendar date as "YYYY-MM-DD", read from local getters — never
// round-trips through UTC, so it can't drift a day near local midnight.
export function todayDateOnly(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// Adds `days` (may be negative) to a "YYYY-MM-DD" date-only string, staying
// in local calendar-date arithmetic throughout — never round-trips through
// UTC/ISO, so it can't be shifted by the viewer's timezone.
export function addDaysDateOnly(value: string, days: number): string {
  const date = parseDateOnly(value)
  if (!date) return value
  date.setDate(date.getDate() + days)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// Given a "YYYY-MM" value from a native <input type="month">, returns the
// first and last calendar day of that month as "YYYY-MM-DD" strings.
export function monthBounds(yearMonth: string): { start: string; end: string } {
  const match = /^(\d{4})-(\d{2})$/.exec(yearMonth)
  if (!match) return { start: yearMonth, end: yearMonth }
  const [, yStr, mStr] = match
  const y = Number(yStr)
  const m = Number(mStr)
  const start = `${yStr}-${mStr}-01`
  const lastDay = new Date(y, m, 0).getDate()
  const end = `${yStr}-${mStr}-${String(lastDay).padStart(2, "0")}`
  return { start, end }
}
