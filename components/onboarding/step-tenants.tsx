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
import type { TranslationKey } from "@/lib/i18n"
import { useI18n } from "@/components/i18n-provider"
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

const DEPOSIT_STATUS_KEYS: Record<SecurityDepositStatus, TranslationKey> = {
  HELD: "depositStatusHeld",
  REFUNDED: "depositStatusRefunded",
  APPLIED_TO_RENT: "depositStatusAppliedToRent",
}

function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden>
      {" "}
      *
    </span>
  )
}

export function StepTenants() {
  const { t } = useI18n()
  const pricingModel = useOnboardingStore((s) => s.pricingModel)
  const standardRoomCount = useOnboardingStore((s) => s.standardRoomCount)
  const standardBaseRate = useOnboardingStore((s) => s.standardBaseRate)
  const standardWaterMeterStart = useOnboardingStore((s) => s.standardWaterMeterStart)
  const standardElectricMeterStart = useOnboardingStore((s) => s.standardElectricMeterStart)
  const customRooms = useOnboardingStore((s) => s.customRooms)
  const rooms = useMemo(
    () =>
      resolveRooms({
        pricingModel,
        standardRoomCount,
        standardBaseRate,
        standardWaterMeterStart,
        standardElectricMeterStart,
        customRooms,
      }),
    [
      pricingModel,
      standardRoomCount,
      standardBaseRate,
      standardWaterMeterStart,
      standardElectricMeterStart,
      customRooms,
    ],
  )
  const tenants = useOnboardingStore((s) => s.tenants)
  const addTenant = useOnboardingStore((s) => s.addTenant)
  const removeTenant = useOnboardingStore((s) => s.removeTenant)

  const assignedRoomIds = useMemo(() => new Set(tenants.map((tn) => tn.roomId)), [tenants])
  const availableRooms = rooms.filter((r) => !assignedRoomIds.has(r.id))

  const [draft, setDraft] = useState(() => createTenantDraft(""))

  function patchDraft(patch: Partial<typeof draft>) {
    setDraft((d) => ({ ...d, ...patch }))
  }

  function canSubmit(): boolean {
    return Boolean(
      draft.roomId &&
        draft.fullName.trim() &&
        draft.nationalId.trim() &&
        draft.leaseStartDate &&
        draft.leaseEndDate &&
        draft.agreedRent > 0,
    )
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit()) return
    addTenant(draft)
    setDraft(createTenantDraft(""))
  }

  const roomLabel = (roomId: string) => rooms.find((r) => r.id === roomId)?.roomNumber ?? roomId

  return (
    <div className="flex flex-col gap-6">
      {tenants.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>
            {t("tenantsAddedLabel")} ({tenants.length})
          </Label>
          <div className="flex flex-col gap-2">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {tenant.fullName || t("unnamedTenantLabel")} · {roomLabel(tenant.roomId)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(tenant.agreedRent, "USD")}/mo · {t("depositWordLabel")}{" "}
                    {formatCurrency(tenant.securityDeposit, "USD")} (
                    {t(DEPOSIT_STATUS_KEYS[tenant.securityDepositStatus])})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`${t("removeAction")} ${tenant.fullName || ""}`}
                  onClick={() => removeTenant(tenant.id)}
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
          {t("noRoomsForTenantsText")}
        </p>
      ) : availableRooms.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {t("allRoomsAssignedText")}
        </p>
      ) : (
        <form onSubmit={handleAdd} className="flex flex-col gap-4 rounded-lg border border-border p-4">
          <h3 className="font-heading text-sm font-medium">{t("addTenantTitle")}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tenant-room">
                {t("roomLabel")}
                <RequiredMark />
              </Label>
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
                      rooms.find((r) => r.id === value)?.roomNumber ?? t("selectRoomPlaceholder")
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
              <Label htmlFor="tenant-name">
                {t("fullNameField")}
                <RequiredMark />
              </Label>
              <Input
                id="tenant-name"
                className="h-11 w-full"
                value={draft.fullName}
                onChange={(e) => patchDraft({ fullName: e.target.value })}
                placeholder={t("tenantNamePlaceholder")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tenant-phone">{t("phoneField")}</Label>
              <Input
                id="tenant-phone"
                className="h-11 w-full"
                value={draft.phone}
                onChange={(e) => patchDraft({ phone: e.target.value })}
                placeholder={t("phoneNumberPlaceholder")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tenant-email">{t("authEmailLabel")}</Label>
              <Input
                id="tenant-email"
                type="email"
                className="h-11 w-full"
                value={draft.email}
                onChange={(e) => patchDraft({ email: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="tenant-id">
                {t("nationalIdPassportField")}
                <RequiredMark />
              </Label>
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
              <Label htmlFor="lease-start">
                {t("dateInField")}
                <RequiredMark />
              </Label>
              <Input
                id="lease-start"
                type="date"
                className="h-11 w-full"
                value={draft.leaseStartDate}
                onChange={(e) => patchDraft({ leaseStartDate: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lease-end">
                {t("dateOutField")}
                <RequiredMark />
              </Label>
              <Input
                id="lease-end"
                type="date"
                className="h-11 w-full"
                value={draft.leaseEndDate}
                onChange={(e) => patchDraft({ leaseEndDate: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agreed-rent">
                {t("agreedRentDollarField")}
                <RequiredMark />
              </Label>
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
                <Label htmlFor="deposit">{t("securityDepositField")}</Label>
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
                <Label htmlFor="deposit-status">{t("depositStatusField")}</Label>
                <Select
                  value={draft.securityDepositStatus}
                  onValueChange={(v) => patchDraft({ securityDepositStatus: v as SecurityDepositStatus })}
                >
                  <SelectTrigger id="deposit-status" className="h-11 w-full">
                    <SelectValue>
                      {(value: SecurityDepositStatus | null) =>
                        value ? t(DEPOSIT_STATUS_KEYS[value]) : t("selectStatusPlaceholder")
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {(Object.keys(DEPOSIT_STATUS_KEYS) as SecurityDepositStatus[]).map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(DEPOSIT_STATUS_KEYS[status])}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AdvancedSection>

          <Separator />

          <div>
            <Button
              type="submit"
              className="h-11 w-full sm:w-auto"
              disabled={!canSubmit()}
            >
              <UserPlus data-icon="inline-start" />
              {t("addTenantAction")}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
