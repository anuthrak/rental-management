"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Receipt } from "lucide-react"
import { toast } from "sonner"

import type { DashboardRoom } from "@/lib/db/queries"
import { formatCurrency } from "@/lib/currency"
import { useInvoiceStore, newLineItem } from "@/store/use-invoice-store"
import {
  assignTenant,
  createInvoiceRecord,
  endLease,
  markInvoicePaid,
  updateRoomTargetPrice,
} from "@/app/dashboard/actions"
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
  const [isPending, startTransition] = useTransition()

  const [cachedRoom, setCachedRoom] = useState(room)
  const [editingPrice, setEditingPrice] = useState(false)
  const [priceInput, setPriceInput] = useState("")

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

  function handleMarkPaid(invoiceId: string) {
    startTransition(async () => {
      await markInvoicePaid(invoiceId)
      toast.success("Invoice marked as paid")
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

      const store = useInvoiceStore.getState()
      store.resetDraft()
      store.updateDraft({
        roomNumber: activeRoom!.roomNumber,
        guestName: activeRoom!.tenant!.fullName,
        lineItems: [
          newLineItem({ label: "Monthly Rent", quantity: 1, unit: "month", rate: amount }),
        ],
      })
      router.push("/")
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader className="border-b">
          <div className="flex items-center justify-between gap-2 pr-8">
            <SheetTitle>{activeRoom.roomNumber}</SheetTitle>
            <Badge variant={activeRoom.status === "OCCUPIED" ? "default" : "secondary"}>
              {activeRoom.status}
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
                  <span className="text-xs font-normal text-muted-foreground">/mo target price</span>
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
              <h3 className="font-heading text-sm font-medium">Assign a tenant</h3>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tenant-name">Full name</Label>
                <Input
                  id="tenant-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tenant-phone">Phone</Label>
                <Input
                  id="tenant-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+855 12 345 678"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tenant-rent">Agreed monthly rent</Label>
                <Input
                  id="tenant-rent"
                  type="number"
                  min="0"
                  step="1"
                  value={agreedRent}
                  onChange={(e) => setAgreedRent(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isPending}>
                Assign tenant &amp; mark occupied
              </Button>
            </form>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <h3 className="font-heading text-sm font-medium">Tenant</h3>
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
                    <h3 className="font-heading text-sm font-medium">Invoices</h3>
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
                                Due {new Date(invoice.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={isPaid ? "secondary" : invoice.isOverdue ? "destructive" : "outline"}>
                                {isPaid ? "Paid" : invoice.isOverdue ? "Overdue" : "Unpaid"}
                              </Badge>
                              {!isPaid && (
                                <Button
                                  size="sm"
                                  disabled={isPending}
                                  onClick={() => handleMarkPaid(invoice.id)}
                                >
                                  Mark as Paid
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {showInvoiceForm ? (
                <form onSubmit={handleGenerateInvoice} className="flex flex-col gap-4">
                  <h3 className="font-heading text-sm font-medium">Generate invoice</h3>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="invoice-amount">Invoice total</Label>
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
                    <Label htmlFor="invoice-due">Due date</Label>
                    <Input
                      id="invoice-due"
                      type="date"
                      value={invoiceDueDate}
                      onChange={(e) => setInvoiceDueDate(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isPending} className="flex-1">
                      <Receipt data-icon="inline-start" />
                      Continue to invoice
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowInvoiceForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button onClick={() => setShowInvoiceForm(true)}>
                    <Receipt data-icon="inline-start" />
                    Generate Invoice
                  </Button>
                  <AlertDialog open={endLeaseConfirmOpen} onOpenChange={setEndLeaseConfirmOpen}>
                    <Button variant="outline" onClick={() => setEndLeaseConfirmOpen(true)}>
                      End Lease / Mark Vacant
                    </Button>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>End this lease?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {activeRoom.tenant.fullName} will be removed from {activeRoom.roomNumber} and the
                          room will be marked vacant. Past invoices are kept.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
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
