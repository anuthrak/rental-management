"use client"

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Plus, ShieldCheck, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { UNITS, type Currency, type LineItem, type Unit } from "@/lib/types"
import type { TranslationKey } from "@/lib/i18n"
import { lineAmount, SECURITY_FEE_ID } from "@/lib/calc"
import { formatCurrency, formatNumber } from "@/lib/currency"
import { useI18n } from "@/components/i18n-provider"
import { useInvoiceStore } from "@/store/use-invoice-store"
import { AdvancedSection } from "@/components/simple-mode/advanced-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Preset {
  key: string
  label: string
  unit: Unit
}

export function LineItemTable() {
  const { t, locale } = useI18n()
  const lineItems = useInvoiceStore((s) => s.draft.lineItems)
  const currency = useInvoiceStore((s) => s.draft.currency)
  const addLineItem = useInvoiceStore((s) => s.addLineItem)
  const updateLineItem = useInvoiceStore((s) => s.updateLineItem)
  const removeLineItem = useInvoiceStore((s) => s.removeLineItem)
  const moveLineItem = useInvoiceStore((s) => s.moveLineItem)
  const toggleSecurityFee = useInvoiceStore((s) => s.toggleSecurityFee)

  const hasSecurityFee = lineItems.some((item) => item.id === SECURITY_FEE_ID)

  const presets: Preset[] = [
    { key: "presetRoom", label: t("presetRoom"), unit: "month" },
    { key: "presetWater", label: t("presetWater"), unit: "m³" },
    { key: "presetElectricity", label: t("presetElectricity"), unit: "kW" },
    { key: "presetWaste", label: t("presetWaste"), unit: "unit" },
    { key: "presetSanitation", label: t("presetSanitation"), unit: "unit" },
    { key: "presetWifi", label: t("presetWifi"), unit: "month" },
  ]

  // Pointer (mouse/trackpad) drags start after a small move so a plain click
  // still works; touch drags wait for a brief press-and-hold so a quick
  // swipe keeps scrolling the page instead of being hijacked into a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = lineItems.findIndex((item) => item.id === active.id)
    const toIndex = lineItems.findIndex((item) => item.id === over.id)
    if (fromIndex === -1 || toIndex === -1) return
    moveLineItem(fromIndex, toIndex)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {t("quickAdd")}
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.key}
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                addLineItem({ label: preset.label, unit: preset.unit })
              }
            >
              <Plus data-icon="inline-start" />
              {preset.label}
            </Button>
          ))}
          <Button
            type="button"
            variant={hasSecurityFee ? "default" : "outline"}
            size="sm"
            aria-pressed={hasSecurityFee}
            onClick={() => toggleSecurityFee(t("securityFee"))}
          >
            <ShieldCheck data-icon="inline-start" />
            {t("includeSecurityFee")}
          </Button>
        </div>
      </div>

      <AdvancedSection className="flex flex-col gap-3">
      {/* Column headers (desktop) */}
      {lineItems.length > 0 && (
        <div className="hidden items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground md:flex">
          <span className="sr-only size-4 shrink-0">{t("dragToReorder")}</span>
          <div className="grid flex-1 grid-cols-[1fr_5rem_5.5rem_6rem_6rem_2rem] gap-2">
            <span>{t("label")}</span>
            <span className="text-right">{t("quantity")}</span>
            <span>{t("unit")}</span>
            <span className="text-right">{t("rate")}</span>
            <span className="text-right">{t("amount")}</span>
            <span className="sr-only">Remove</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 md:gap-2">
        {lineItems.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {t("noLineItems")}
          </p>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={lineItems.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {lineItems.map((item, index) => (
              <SortableLineItemRow
                key={item.id}
                item={item}
                index={index}
                currency={currency}
                locale={locale}
                t={t}
                updateLineItem={updateLineItem}
                removeLineItem={removeLineItem}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => addLineItem()}
        >
          <Plus data-icon="inline-start" />
          {t("addLineItem")}
        </Button>
      </div>
      </AdvancedSection>
    </div>
  )
}

function SortableLineItemRow({
  item,
  index,
  currency,
  locale,
  t,
  updateLineItem,
  removeLineItem,
}: {
  item: LineItem
  index: number
  currency: Currency
  locale: string
  t: (key: TranslationKey) => string
  updateLineItem: (id: string, patch: Partial<LineItem>) => void
  removeLineItem: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  // Lock horizontal movement — this is a vertical list, so only the y-axis
  // offset from dnd-kit should move the row.
  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString({ ...transform, x: 0 }) : undefined,
    transition,
    zIndex: isDragging ? 10 : undefined,
  }

  const amount = lineAmount(item)
  const isUtilityItem = item.unit === "m³" || item.unit === "kW"
  // Electricity is stored internally as "kW" (see lib/types.ts) but
  // is always presented to the user as "kWh".
  const lockedUnitLabel = item.unit === "kW" ? "kWh" : item.unit

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-[box-shadow,opacity,transform] duration-150 md:rounded-none md:border-0 md:p-0",
        isDragging && "scale-[1.02] opacity-90 shadow-lg",
      )}
    >
      <div className="flex items-start gap-1.5 md:items-center">
      <button
        type="button"
        className={cn(
          "flex h-8 shrink-0 touch-none items-center justify-center text-muted-foreground",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
        aria-label={t("dragToReorder")}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="grid flex-1 grid-cols-2 gap-2 md:grid-cols-[1fr_5rem_5.5rem_6rem_6rem_2rem] md:items-center">
      <div className="col-span-2 md:col-span-1">
        <Label
          htmlFor={`label-${item.id}`}
          className="mb-1 text-xs text-muted-foreground md:hidden"
        >
          {t("label")}
        </Label>
        <Input
          id={`label-${item.id}`}
          value={item.label}
          placeholder={`${t("labelPlaceholder")} #${index + 1}`}
          onChange={(e) =>
            updateLineItem(item.id, { label: e.target.value })
          }
        />
      </div>

      <div>
        <Label
          htmlFor={`qty-${item.id}`}
          className="mb-1 text-xs text-muted-foreground md:hidden"
        >
          {t("quantity")}
        </Label>
        {isUtilityItem ? (
          <span
            id={`qty-${item.id}`}
            className="flex h-8 items-center justify-end px-2.5 text-sm text-muted-foreground tabular-nums"
            title="Derived from Previous/Recent Meter below"
          >
            {formatNumber(item.quantity, locale)}
          </span>
        ) : (
          <Input
            id={`qty-${item.id}`}
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            className="text-right"
            value={item.quantity}
            onChange={(e) =>
              updateLineItem(item.id, {
                quantity: e.target.value === "" ? 0 : Number(e.target.value),
              })
            }
          />
        )}
      </div>

      <div>
        <Label
          htmlFor={`unit-${item.id}`}
          className="mb-1 text-xs text-muted-foreground md:hidden"
        >
          {t("unit")}
        </Label>
        {isUtilityItem ? (
          <span
            id={`unit-${item.id}`}
            className="flex h-8 items-center px-2.5 text-sm text-muted-foreground"
            title="Locked to the standard utility unit"
          >
            {lockedUnitLabel}
          </span>
        ) : (
          <Select
            value={item.unit}
            onValueChange={(value) =>
              updateLineItem(item.id, { unit: value as Unit })
            }
          >
            <SelectTrigger className="w-full" aria-label={t("unit")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>

      <div>
        <Label
          htmlFor={`rate-${item.id}`}
          className="mb-1 text-xs text-muted-foreground md:hidden"
        >
          {t("rate")}
        </Label>
        {isUtilityItem ? (
          <span
            id={`rate-${item.id}`}
            className="flex h-8 items-center justify-end px-2.5 text-sm text-muted-foreground tabular-nums"
            title="Locked to the established system rate"
          >
            {formatNumber(item.rate, locale)}
          </span>
        ) : (
          <Input
            id={`rate-${item.id}`}
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            className="text-right"
            value={item.rate}
            onChange={(e) =>
              updateLineItem(item.id, {
                rate: e.target.value === "" ? 0 : Number(e.target.value),
              })
            }
          />
        )}
      </div>

      <div className="flex flex-col md:items-end">
        <Label className="mb-1 text-xs text-muted-foreground md:hidden">
          {t("amount")}
        </Label>
        <span className="flex h-8 items-center font-medium tabular-nums md:justify-end">
          {formatCurrency(amount, currency, locale)}
        </span>
      </div>

      <div className="col-span-2 flex justify-end md:col-span-1 md:justify-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11"
          aria-label={`Remove ${item.label || "line item"}`}
          onClick={() => removeLineItem(item.id)}
        >
          <Trash2 className="text-destructive" />
        </Button>
      </div>
      </div>
      </div>

      {isUtilityItem && (
        <div className="grid grid-cols-2 gap-2 md:pl-9">
          <div>
            <Label
              htmlFor={`prev-meter-${item.id}`}
              className="mb-1 text-xs text-muted-foreground"
            >
              {t("previousMeterLabel")}
            </Label>
            {item.previousMeterLocked ? (
              <span
                id={`prev-meter-${item.id}`}
                className="flex h-8 items-center px-2.5 text-sm text-muted-foreground tabular-nums"
                title="Locked to the room's latest recorded meter reading"
              >
                {formatNumber(item.previousMeter ?? 0, locale)}
              </span>
            ) : (
              <Input
                id={`prev-meter-${item.id}`}
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={item.previousMeter ?? 0}
                onChange={(e) =>
                  updateLineItem(item.id, {
                    previousMeter: e.target.value === "" ? 0 : Number(e.target.value),
                  })
                }
              />
            )}
          </div>
          <div>
            <Label
              htmlFor={`recent-meter-${item.id}`}
              className="mb-1 text-xs text-muted-foreground"
            >
              {t("recentMeterLabel")}
            </Label>
            <Input
              id={`recent-meter-${item.id}`}
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={item.recentMeter ?? 0}
              onChange={(e) =>
                updateLineItem(item.id, {
                  recentMeter: e.target.value === "" ? 0 : Number(e.target.value),
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
