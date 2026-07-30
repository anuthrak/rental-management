"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Receipt } from "lucide-react"
import { toast } from "sonner"

import type { DashboardRoom } from "@/lib/db/queries"
import { ELECTRIC_RATE_USD, WATER_RATE_USD } from "@/lib/calc"
import { DEFAULT_INVOICE_CATEGORIES, categoryLabel, defaultCategoryLineItem } from "@/lib/categories"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/currency"
import { formatDateDMY } from "@/lib/date"
import { useMediaQuery } from "@/lib/use-media-query"
import { useI18n } from "@/components/i18n-provider"
import { useInvoiceStore, newLineItem } from "@/store/use-invoice-store"
import {
  assignTenant,
  createInvoiceRecord,
  endLease,
  setInvoiceStatus,
  updateRoomName,
  updateRoomTargetPrice,
} from "@/app/actions/dashboard"
import { MeterReadingSection } from "@/components/dashboard/meter-reading-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function nextMonthFirst(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 1, 1)
  return d.toISOString().slice(0, 10)
}

export function RoomDrawer({
  room,
  open,
  onOpenChange,
}: {
  room: DashboardRoom | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const { t, language } = useI18n()
  const [isPending, startTransition] = useTransition()
  const isDesktop = useMediaQuery("(min-width: 640px)")

  const [cachedRoom, setCachedRoom] = useState(room)
  const [editingPrice, setEditingPrice] = useState(false)
  const [priceInput, setPriceInput] = useState("")
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState("")

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [agreedRent, setAgreedRent] = useState("")

  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [invoiceAmount, setInvoiceAmount] = useState("")
  const [invoiceDueDate, setInvoiceDueDate] = useState(nextMonthFirst())
  const [endLeaseConfirmOpen, setEndLeaseConfirmOpen] = useState(false)

  useEffect(() => {
    if (!room) return
    setCachedRoom(room)
    setEditingPrice(false)
    setPriceInput(String(room.targetPrice))
    setEditingName(false)
    setNameInput(room.roomNumber)
    setFullName("")
    setPhone("")
    setAgreedRent(String(room.targetPrice))
    setShowInvoiceForm(false)
    setInvoiceAmount(room.lease ? String(room.lease.agreedRent) : "")
    setInvoiceDueDate(nextMonthFirst())
  }, [room])

  const activeRoom = room ?? cachedRoom
  if (!activeRoom) return null

  function handleSavePrice() {
    const value = Number(priceInput)
    if (!value || value <= 0) {
      toast.error("Enter a valid price")
      return
    }
    startTransition(async () => {
      await updateRoomTargetPrice(activeRoom!.id, value)
      toast.success("Target price updated")
      setEditingPrice(false)
    })
  }

  function handleSaveName() {
    if (!nameInput.trim()) {
      toast.error("Enter a valid room name")
      return
    }
    startTransition(async () => {
      const result = await updateRoomName(activeRoom!.id, nameInput)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Room name updated")
      setEditingName(false)
    })
  }

  function handleAssignTenant(e: React.FormEvent) {
    e.preventDefault()
    const rent = Number(agreedRent)
    if (!fullName.trim() || !phone.trim() || !rent || rent <= 0) {
      toast.error("Fill in all fields with a valid rent amount")
      return
    }
    startTransition(async () => {
      await assignTenant(activeRoom!.id, { fullName: fullName.trim(), phone: phone.trim(), agreedRent: rent })
      toast.success("Tenant assigned, room marked occupied")
    })
  }

  function handleEndLease() {
    if (!activeRoom!.lease || !activeRoom!.tenant) return
    startTransition(async () => {
      await endLease(activeRoom!.lease!.id, activeRoom!.id, activeRoom!.tenant!.id)
      toast.success("Lease ended, room marked vacant")
      setEndLeaseConfirmOpen(false)
    })
  }

  function handleToggleInvoiceStatus(invoiceId: string, isPaid: boolean) {
    startTransition(async () => {
      await setInvoiceStatus(invoiceId, isPaid ? "UNPAID" : "PAID")
      toast.success(isPaid ? t("invoiceMarkedUnpaidToast") : t("invoiceMarkedPaidToast"))
    })
  }

  function handleGenerateInvoice(e: React.FormEvent) {
    e.preventDefault()
    if (!activeRoom!.lease || !activeRoom!.tenant) return
    const amount = Number(invoiceAmount)
    if (!amount || amount <= 0) {
      toast.error("Enter a valid invoice amount")
      return
    }
    startTransition(async () => {
      await createInvoiceRecord({
        roomId: activeRoom!.id,
        tenantId: activeRoom!.tenant!.id,
        leaseId: activeRoom!.lease!.id,
        amountDue: amount,
        dueDate: invoiceDueDate,
      })

      const latestReading = activeRoom!.meterReadings[0] ?? null
      const lastWater = latestReading?.waterMeterValue ?? 0
      const lastElectric = latestReading?.electricMeterValue ?? 0
      const store = useInvoiceStore.getState()
      store.resetDraft()
      // Preload every default category, not just Room Rate/Electricity/Water
      // — Deposit/Waste/Sanitation/WiFi/Security Fee come from the same
      // canonical list (lib/categories.ts) so the tenant doesn't have to
      // quick-add them by hand; Room Rate/Electricity/Water stay
      // special-cased here since their rate/meter values come from the room.
      store.updateDraft({
        roomNumber: activeRoom!.roomNumber,
        guestName: activeRoom!.tenant!.fullName,
        lineItems: DEFAULT_INVOICE_CATEGORIES.map((category) => {
          if (category.id === "roomRate") {
            return newLineItem({
              label: categoryLabel("roomRate", language),
              quantity: 1,
              unit: "month",
              rate: amount,
            })
          }
          if (category.id === "electricity") {
            return newLineItem({
              label: categoryLabel("electricity", language),
              quantity: 0,
              unit: "kW",
              rate: ELECTRIC_RATE_USD,
              previousMeter: lastElectric,
              recentMeter: lastElectric,
              previousMeterLocked: true,
            })
          }
          if (category.id === "water") {
            return newLineItem({
              label: categoryLabel("water", language),
              quantity: 0,
              unit: "m³",
              rate: WATER_RATE_USD,
              previousMeter: lastWater,
              recentMeter: lastWater,
              previousMeterLocked: true,
            })
          }
          return newLineItem(defaultCategoryLineItem(category, language))
        }),
      })
      router.push("/invoice")
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className="data-[side=right]:w-full sm:data-[side=right]:w-3/4"
      >
        <SheetHeader className="border-b">
          <div className="flex items-center justify-between gap-2 pr-8">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              {/* Kept mounted (visually hidden while editing) so the sheet
                  always has an accessible title element. */}
              <SheetTitle className={cn("truncate", editingName && "sr-only")}>
                {activeRoom.roomNumber}
              </SheetTitle>
              {editingName ? (
                <>
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="h-8 min-w-0 flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName()
                      if (e.key === "Escape") setEditingName(false)
                    }}
                  />
                  <Button size="sm" disabled={isPending} onClick={handleSaveName}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingName(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Edit room name"
                  onClick={() => {
                    setNameInput(activeRoom.roomNumber)
                    setEditingName(true)
                  }}
                >
                  <Pencil />
                </Button>
              )}
            </div>
            <Badge variant={activeRoom.status === "OCCUPIED" ? "default" : "secondary"}>
              {activeRoom.status === "OCCUPIED"
                ? t("statusOccupied")
                : activeRoom.status === "VACANT"
                  ? t("statusVacant")
                  : t("statusMaintenance")}
            </Badge>
          </div>
          <SheetDescription>Room details and lease management.</SheetDescription>
          <div className="flex items-center gap-2 pt-1">
            {editingPrice ? (
              <>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="h-7 w-28"
                  autoFocus
                />
                <Button size="sm" disabled={isPending} onClick={handleSavePrice}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingPrice(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <span className="text-base font-medium text-foreground">
                  {formatCurrency(activeRoom.targetPrice, "USD")}
                  <span className="text-xs font-normal text-muted-foreground">
                    {t("targetPriceSuffix")}
                  </span>
                </span>
                <Button size="icon-xs" variant="ghost" onClick={() => setEditingPrice(true)}>
                  <Pencil />
                </Button>
              </>
            )}
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-4">
          {activeRoom.status === "VACANT" || !activeRoom.tenant ? (
            <form onSubmit={handleAssignTenant} className="flex flex-col gap-4">
              <h3 className="font-heading text-sm font-medium">{t("assignTenantTitle")}</h3>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tenant-name">{t("fullNameField")}</Label>
                <Input
                  id="tenant-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tenant-phone">{t("phoneField")}</Label>
                <Input
                  id="tenant-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+855 12 345 678"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tenant-rent">{t("agreedRentField")}</Label>
                <Input
                  id="tenant-rent"
                  type="number"
                  min="0"
                  step="1"
                  value={agreedRent}
                  onChange={(e) => setAgreedRent(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isPending} className="min-h-11">
                {t("assignTenantAction")}
              </Button>
            </form>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <h3 className="font-heading text-sm font-medium">{t("tenantSection")}</h3>
                <div className="rounded-lg border border-border p-3 text-sm">
                  <div className="font-medium">{activeRoom.tenant.fullName}</div>
                  {activeRoom.tenant.phone && (
                    <div className="text-muted-foreground">{activeRoom.tenant.phone}</div>
                  )}
                  {activeRoom.tenant.email && (
                    <div className="text-muted-foreground">{activeRoom.tenant.email}</div>
                  )}
                  {activeRoom.lease && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Agreed rent: {formatCurrency(activeRoom.lease.agreedRent, "USD")}/mo
                    </div>
                  )}
                </div>
              </div>

              {activeRoom.invoices.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <h3 className="font-heading text-sm font-medium">{t("invoicesSection")}</h3>
                    <div className="flex flex-col gap-2">
                      {activeRoom.invoices.map((invoice) => {
                        const isPaid = invoice.status === "PAID"
                        return (
                          <div
                            key={invoice.id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium tabular-nums">
                                {formatCurrency(invoice.amountDue, "USD")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Due {formatDateDMY(invoice.dueDate)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={isPaid ? "secondary" : invoice.isOverdue ? "destructive" : "outline"}>
                                {isPaid ? t("paidStatus") : invoice.isOverdue ? t("overdueStatus") : t("unpaidStatus")}
                              </Badge>
                              <Button
                                size="sm"
                                variant={isPaid ? "outline" : "default"}
                                disabled={isPending}
                                onClick={() => handleToggleInvoiceStatus(invoice.id, isPaid)}
                              >
                                {isPaid ? t("markUnpaidAction") : t("markPaidAction")}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <MeterReadingSection roomId={activeRoom.id} readings={activeRoom.meterReadings} />

              <Separator />

              {showInvoiceForm ? (
                <form onSubmit={handleGenerateInvoice} className="flex flex-col gap-4">
                  <h3 className="font-heading text-sm font-medium">Generate invoice</h3>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="invoice-amount">{t("invoiceTotalField")}</Label>
                    <Input
                      id="invoice-amount"
                      type="number"
                      min="0"
                      step="1"
                      value={invoiceAmount}
                      onChange={(e) => setInvoiceAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="invoice-due">{t("dueDateField")}</Label>
                    <Input
                      id="invoice-due"
                      type="date"
                      value={invoiceDueDate}
                      onChange={(e) => setInvoiceDueDate(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isPending} className="min-h-11 flex-1">
                      <Receipt data-icon="inline-start" />
                      {t("continueToInvoice")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11"
                      onClick={() => setShowInvoiceForm(false)}
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button className="min-h-11" onClick={() => setShowInvoiceForm(true)}>
                    <Receipt data-icon="inline-start" />
                    {t("generateInvoiceAction")}
                  </Button>
                  <AlertDialog open={endLeaseConfirmOpen} onOpenChange={setEndLeaseConfirmOpen}>
                    <Button
                      variant="outline"
                      className="min-h-11"
                      onClick={() => setEndLeaseConfirmOpen(true)}
                    >
                      {t("endLeaseAction")}
                    </Button>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("endLeaseTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {activeRoom.tenant.fullName} will be removed from {activeRoom.roomNumber} and the
                          room will be marked vacant. Past invoices are kept.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" disabled={isPending} onClick={handleEndLease}>
                          End lease
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
