"use client"

import { useMemo, useState } from "react"
import { Trash2, UserPlus } from "lucide-react"

import {
  createTenantDraft,
  resolveRooms,
  useOnboardingStore,
  type SecurityDepositStatus,
} from "@/store/use-onboarding-store"
import { formatCurrency } from "@/lib/currency"
import { AdvancedSection } from "@/components/simple-mode/advanced-section"
import { Button } from "@/components/ui/button"
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

const DEPOSIT_STATUS_LABELS: Record<SecurityDepositStatus, string> = {
  HELD: "Held",
  REFUNDED: "Refunded",
  APPLIED_TO_RENT: "Applied to rent",
}

export function StepTenants() {
  const pricingModel = useOnboardingStore((s) => s.pricingModel)
  const standardRoomCount = useOnboardingStore((s) => s.standardRoomCount)
  const standardBaseRate = useOnboardingStore((s) => s.standardBaseRate)
  const customRooms = useOnboardingStore((s) => s.customRooms)
  const rooms = useMemo(
    () => resolveRooms({ pricingModel, standardRoomCount, standardBaseRate, customRooms }),
    [pricingModel, standardRoomCount, standardBaseRate, customRooms],
  )
  const tenants = useOnboardingStore((s) => s.tenants)
  const addTenant = useOnboardingStore((s) => s.addTenant)
  const removeTenant = useOnboardingStore((s) => s.removeTenant)

  const assignedRoomIds = useMemo(() => new Set(tenants.map((t) => t.roomId)), [tenants])
  const availableRooms = rooms.filter((r) => !assignedRoomIds.has(r.id))

  const [draft, setDraft] = useState(() => createTenantDraft(""))

  function patchDraft(patch: Partial<typeof draft>) {
    setDraft((d) => ({ ...d, ...patch }))
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.roomId || !draft.fullName.trim() || !draft.agreedRent) return
    addTenant(draft)
    setDraft(createTenantDraft(""))
  }

  const roomLabel = (roomId: string) => rooms.find((r) => r.id === roomId)?.roomNumber ?? roomId

  return (
    <div className="flex flex-col gap-6">
      {tenants.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>Tenants added ({tenants.length})</Label>
          <div className="flex flex-col gap-2">
            {tenants.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {t.fullName || "Unnamed tenant"} · {roomLabel(t.roomId)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(t.agreedRent, "USD")}/mo · deposit{" "}
                    {formatCurrency(t.securityDeposit, "USD")} (
                    {DEPOSIT_STATUS_LABELS[t.securityDepositStatus]})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${t.fullName || "tenant"}`}
                  onClick={() => removeTenant(t.id)}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {rooms.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Go back to Step 1 and add at least one room before assigning tenants.
        </p>
      ) : availableRooms.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Every room has a tenant assigned. This step is optional — continue whenever you&apos;re
          ready.
        </p>
      ) : (
        <form onSubmit={handleAdd} className="flex flex-col gap-4 rounded-lg border border-border p-4">
          <h3 className="font-heading text-sm font-medium">Add a tenant</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tenant-room">Room</Label>
              <Select
                value={draft.roomId}
                onValueChange={(value) => {
                  const roomId = value ?? ""
                  const room = rooms.find((r) => r.id === roomId)
                  patchDraft({ roomId, agreedRent: room?.targetPrice ?? draft.agreedRent })
                }}
              >
                <SelectTrigger id="tenant-room" className="h-11 w-full">
                  <SelectValue>
                    {(value: string | null) =>
                      rooms.find((r) => r.id === value)?.roomNumber ?? "Select a room"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {availableRooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.roomNumber}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tenant-name">Full name</Label>
              <Input
                id="tenant-name"
                className="h-11 w-full"
                value={draft.fullName}
                onChange={(e) => patchDraft({ fullName: e.target.value })}
                placeholder="Jane Doe"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tenant-phone">Phone</Label>
              <Input
                id="tenant-phone"
                className="h-11 w-full"
                value={draft.phone}
                onChange={(e) => patchDraft({ phone: e.target.value })}
                placeholder="+855 12 345 678"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tenant-email">Email</Label>
              <Input
                id="tenant-email"
                type="email"
                className="h-11 w-full"
                value={draft.email}
                onChange={(e) => patchDraft({ email: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="tenant-id">National ID / Passport #</Label>
              <Input
                id="tenant-id"
                className="h-11 w-full"
                value={draft.nationalId}
                onChange={(e) => patchDraft({ nationalId: e.target.value })}
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lease-start">Lease start</Label>
              <Input
                id="lease-start"
                type="date"
                className="h-11 w-full"
                value={draft.leaseStartDate}
                onChange={(e) => patchDraft({ leaseStartDate: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lease-end">Lease end (optional)</Label>
              <Input
                id="lease-end"
                type="date"
                className="h-11 w-full"
                value={draft.leaseEndDate}
                onChange={(e) => patchDraft({ leaseEndDate: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agreed-rent">Agreed rent ($/mo)</Label>
              <Input
                id="agreed-rent"
                type="number"
                min={0}
                step="any"
                className="h-11 w-full"
                value={draft.agreedRent}
                onChange={(e) => patchDraft({ agreedRent: Number(e.target.value) })}
              />
            </div>
          </div>

          <AdvancedSection>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="deposit">Security deposit</Label>
                <Input
                  id="deposit"
                  type="number"
                  min={0}
                  step="any"
                  className="h-11 w-full"
                  value={draft.securityDeposit}
                  onChange={(e) => patchDraft({ securityDeposit: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="deposit-status">Deposit status</Label>
                <Select
                  value={draft.securityDepositStatus}
                  onValueChange={(v) => patchDraft({ securityDepositStatus: v as SecurityDepositStatus })}
                >
                  <SelectTrigger id="deposit-status" className="h-11 w-full">
                    <SelectValue>
                      {(value: SecurityDepositStatus | null) =>
                        value ? DEPOSIT_STATUS_LABELS[value] : "Select a status"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {(Object.keys(DEPOSIT_STATUS_LABELS) as SecurityDepositStatus[]).map((status) => (
                        <SelectItem key={status} value={status}>
                          {DEPOSIT_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="water-start">Initial water meter (m³)</Label>
                <Input
                  id="water-start"
                  type="number"
                  min={0}
                  step="any"
                  className="h-11 w-full"
                  value={draft.waterMeterStart}
                  onChange={(e) => patchDraft({ waterMeterStart: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="electric-start">Initial electric meter (kW)</Label>
                <Input
                  id="electric-start"
                  type="number"
                  min={0}
                  step="any"
                  className="h-11 w-full"
                  value={draft.electricMeterStart}
                  onChange={(e) => patchDraft({ electricMeterStart: Number(e.target.value) })}
                />
              </div>
            </div>
          </AdvancedSection>

          <Separator />

          <div>
            <Button
              type="submit"
              className="h-11 w-full sm:w-auto"
              disabled={!draft.roomId || !draft.fullName.trim()}
            >
              <UserPlus data-icon="inline-start" />
              Add tenant
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
