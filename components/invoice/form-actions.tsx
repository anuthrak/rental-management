"use client"

import { useState } from "react"
import { Download, FileText, RotateCcw, Save, Share2 } from "lucide-react"
import { toast } from "sonner"

import { useI18n } from "@/components/i18n-provider"
import { useInvoiceStore } from "@/store/use-invoice-store"
import { useSimpleModeStore } from "@/store/use-simple-mode-store"
import { exportAsImage, exportAsPdf, shareInvoice } from "@/lib/export"
import { AdvancedSection } from "@/components/simple-mode/advanced-section"
import { Button } from "@/components/ui/button"
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

export function FormActions({
  previewRef,
}: {
  previewRef: React.RefObject<HTMLDivElement | null>
}) {
  const { t } = useI18n()
  const simpleMode = useSimpleModeStore((s) => s.simpleMode)
  const validateDraft = useInvoiceStore((s) => s.validateDraft)
  const saveInvoice = useInvoiceStore((s) => s.saveInvoice)
  const resetDraft = useInvoiceStore((s) => s.resetDraft)
  const invoiceNumber = useInvoiceStore((s) => s.draft.invoiceNumber)

  const [resetOpen, setResetOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const fileName = `invoice-${invoiceNumber.replace(/[^a-z0-9]/gi, "")}`

  function handleSave() {
    if (!validateDraft()) {
      toast.error("Please fix the highlighted fields.")
      return
    }
    const saved = saveInvoice()
    toast.success(t("savedToast"), { description: saved.invoiceNumber })
  }

  async function runExport(fn: () => Promise<unknown>) {
    if (!previewRef.current) return
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      console.log("[v0] export error:", err)
      toast.error(t("exportError"))
    } finally {
      setBusy(false)
    }
  }

  function handleQuickShare() {
    if (!validateDraft()) {
      toast.error("Please fix the highlighted fields.")
      return
    }
    saveInvoice()
    runExport(async () => {
      const result = await shareInvoice(previewRef.current!, fileName)
      if (result === "downloaded") toast.info(t("shareUnsupported"))
    })
  }

  const advancedActions = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSave} className="min-h-11 flex-1 sm:flex-none">
          <Save data-icon="inline-start" />
          {t("save")}
        </Button>
        <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
          <Button variant="outline" className="min-h-11" onClick={() => setResetOpen(true)}>
            <RotateCcw data-icon="inline-start" />
            {t("reset")}
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("resetTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("resetDesc")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  resetDraft()
                  setResetOpen(false)
                  toast.success(t("resetToast"))
                }}
              >
                {t("confirmReset")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="min-h-11"
          disabled={busy}
          onClick={() =>
            runExport(() => exportAsImage(previewRef.current!, fileName))
          }
        >
          <Download data-icon="inline-start" />
          {t("exportImage")}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="min-h-11"
          disabled={busy}
          onClick={() =>
            runExport(() => exportAsPdf(previewRef.current!, fileName))
          }
        >
          <FileText data-icon="inline-start" />
          {t("exportPdf")}
        </Button>
        {!simpleMode && (
          <Button
            variant="secondary"
            size="sm"
            className="min-h-11"
            disabled={busy}
            onClick={() =>
              runExport(async () => {
                const result = await shareInvoice(previewRef.current!, fileName)
                if (result === "downloaded") toast.info(t("shareUnsupported"))
              })
            }
          >
            <Share2 data-icon="inline-start" />
            {t("share")}
          </Button>
        )}
      </div>
    </div>
  )

  if (simpleMode) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
        <Button onClick={handleQuickShare} disabled={busy} className="min-h-11">
          <Share2 data-icon="inline-start" />
          {t("shareInvoiceAction")}
        </Button>
        <AdvancedSection>{advancedActions}</AdvancedSection>
      </div>
    )
  }

  return <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">{advancedActions}</div>
}
