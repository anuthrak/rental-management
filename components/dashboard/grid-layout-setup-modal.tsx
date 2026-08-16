"use client"

import { useState, useTransition } from "react"
import { LayoutGrid } from "lucide-react"
import { toast } from "sonner"

import { useI18n } from "@/components/i18n-provider"
import { resetFloorPlanLayout, setFloorPlanDimensions, setFloorCount as setFloorCountAction } from "@/app/actions/floor-plan"
import { formatFloorLabel } from "@/lib/rooms"
import {
  DEFAULT_DIMENSIONS,
  DEFAULT_FLOOR_COUNT,
  useFloorPlanLayoutStore,
  type FloorPlanDimensions,
} from "@/store/use-floor-plan-layout-store"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const MIN_DIMENSION = 1
const MAX_DIMENSION = 20
const MIN_FLOOR_COUNT = 1
const MAX_FLOOR_COUNT = 50

export function GridLayoutSetupModal({ floor, userId }: { floor: number; userId: string | null }) {
  const { t } = useI18n()
  const dimensions = useFloorPlanLayoutStore((s) => s.dimensionsByFloor[floor] ?? DEFAULT_DIMENSIONS)
  const floorCount = useFloorPlanLayoutStore((s) => s.floorCount ?? DEFAULT_FLOOR_COUNT)
  const setDimensions = useFloorPlanLayoutStore((s) => s.setDimensions)
  const setFloorCount = useFloorPlanLayoutStore((s) => s.setFloorCount)
  const resetLayout = useFloorPlanLayoutStore((s) => s.resetLayout)
  const [, startTransition] = useTransition()

  const [open, setOpen] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [rows, setRows] = useState(String(dimensions.rows))
  const [cols, setCols] = useState(String(dimensions.cols))
  const [floors, setFloors] = useState(String(floorCount))

  function handleOpenChange(next: boolean) {
    if (next) {
      setRows(String(dimensions.rows))
      setCols(String(dimensions.cols))
      setFloors(String(floorCount))
    }
    setOpen(next)
  }

  function persistDimensions(next: FloorPlanDimensions) {
    if (!userId) return
    startTransition(async () => {
      try {
        await setFloorPlanDimensions(floor, next.rows, next.cols)
      } catch {
        toast.error(t("gridSyncErrorToast"))
      }
    })
  }

  function persistFloorCount(next: number) {
    if (!userId) return
    startTransition(async () => {
      try {
        await setFloorCountAction(next)
      } catch {
        toast.error(t("gridSyncErrorToast"))
      }
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const rowsNum = Math.round(Number(rows))
    const colsNum = Math.round(Number(cols))
    const floorsNum = Math.round(Number(floors))
    if (
      !Number.isFinite(rowsNum) ||
      !Number.isFinite(colsNum) ||
      rowsNum < MIN_DIMENSION ||
      colsNum < MIN_DIMENSION ||
      rowsNum > MAX_DIMENSION ||
      colsNum > MAX_DIMENSION
    ) {
      toast.error(t("invalidGridDimensionsError"))
      return
    }
    if (!Number.isFinite(floorsNum) || floorsNum < MIN_FLOOR_COUNT || floorsNum > MAX_FLOOR_COUNT) {
      toast.error(t("invalidFloorCountError"))
      return
    }
    const next = { rows: rowsNum, cols: colsNum }
    setDimensions(floor, next)
    persistDimensions(next)
    if (floorsNum !== floorCount) {
      setFloorCount(floorsNum)
      persistFloorCount(floorsNum)
    }
    toast.success(t("gridLayoutUpdatedToast"))
    setOpen(false)
  }

  function handleReset() {
    resetLayout(floor)
    if (userId) {
      startTransition(async () => {
        try {
          await resetFloorPlanLayout(floor)
        } catch {
          toast.error(t("gridSyncErrorToast"))
        }
      })
    }
    toast.success(t("gridLayoutResetToast"))
    setResetConfirmOpen(false)
    setOpen(false)
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => handleOpenChange(true)}>
        <LayoutGrid />
        <span className="sr-only sm:not-sr-only">{t("setUpGridLayoutAction")}</span>
      </Button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="center">
          <SheetHeader className="border-b">
            <SheetTitle>{t("setUpGridLayoutTitle")}</SheetTitle>
            <SheetDescription>{t("setUpGridLayoutDesc")}</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 pb-4">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t("gridSizeSectionLabel")} — {formatFloorLabel(floor)}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="grid-rows">{t("gridRowsField")}</Label>
                  <Input
                    id="grid-rows"
                    type="number"
                    min={MIN_DIMENSION}
                    max={MAX_DIMENSION}
                    step={1}
                    value={rows}
                    onChange={(e) => setRows(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="grid-cols">{t("gridColsField")}</Label>
                  <Input
                    id="grid-cols"
                    type="number"
                    min={MIN_DIMENSION}
                    max={MAX_DIMENSION}
                    step={1}
                    value={cols}
                    onChange={(e) => setCols(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-border pt-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t("propertySectionLabel")}
              </p>
              <Label htmlFor="floor-count">{t("floorCountField")}</Label>
              <Input
                id="floor-count"
                type="number"
                min={MIN_FLOOR_COUNT}
                max={MAX_FLOOR_COUNT}
                step={1}
                value={floors}
                onChange={(e) => setFloors(e.target.value)}
                className="max-w-32"
              />
              <p className="text-xs text-muted-foreground">{t("floorCountHelp")}</p>
            </div>

            <Button type="submit" className="min-h-11">
              {t("applyGridLayoutAction")}
            </Button>
          </form>
          <SheetFooter className="border-t">
            <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetConfirmOpen(true)}
              >
                {t("resetGridLayoutAction")}
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("resetGridLayoutConfirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("resetGridLayoutConfirmDesc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={handleReset}>
                    {t("resetGridLayoutAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
