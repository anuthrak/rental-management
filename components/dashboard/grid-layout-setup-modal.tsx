"use client"

import { useState } from "react"
import { LayoutGrid } from "lucide-react"
import { toast } from "sonner"

import { useI18n } from "@/components/i18n-provider"
import { useFloorPlanLayoutStore } from "@/store/use-floor-plan-layout-store"
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
const MAX_DIMENSION = 30

export function GridLayoutSetupModal() {
  const { t } = useI18n()
  const dimensions = useFloorPlanLayoutStore((s) => s.dimensions)
  const setDimensions = useFloorPlanLayoutStore((s) => s.setDimensions)
  const resetLayout = useFloorPlanLayoutStore((s) => s.resetLayout)

  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState(String(dimensions.rows))
  const [cols, setCols] = useState(String(dimensions.cols))

  function handleOpenChange(next: boolean) {
    if (next) {
      setRows(String(dimensions.rows))
      setCols(String(dimensions.cols))
    }
    setOpen(next)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const rowsNum = Math.round(Number(rows))
    const colsNum = Math.round(Number(cols))
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
    setDimensions({ rows: rowsNum, cols: colsNum })
    toast.success(t("gridLayoutUpdatedToast"))
    setOpen(false)
  }

  function handleReset() {
    resetLayout()
    toast.success(t("gridLayoutResetToast"))
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => handleOpenChange(true)}>
        <LayoutGrid />
        {t("setUpGridLayoutAction")}
      </Button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="center">
          <SheetHeader className="border-b">
            <SheetTitle>{t("setUpGridLayoutTitle")}</SheetTitle>
            <SheetDescription>{t("setUpGridLayoutDesc")}</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-4">
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
            <Button type="submit" className="min-h-11">
              {t("applyGridLayoutAction")}
            </Button>
          </form>
          <SheetFooter className="border-t">
            <Button type="button" variant="outline" onClick={handleReset}>
              {t("resetGridLayoutAction")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
