"use client"

import { useOnboardingStore, type OnboardingCurrency } from "@/store/use-onboarding-store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CURRENCY_LABELS: Record<OnboardingCurrency, string> = {
  USD: "USD ($)",
  KHR: "KHR (៛)",
}

export function StepPreferences() {
  const currency = useOnboardingStore((s) => s.currency)
  const setCurrency = useOnboardingStore((s) => s.setCurrency)
  const waterRate = useOnboardingStore((s) => s.waterRate)
  const setWaterRate = useOnboardingStore((s) => s.setWaterRate)
  const electricRate = useOnboardingStore((s) => s.electricRate)
  const setElectricRate = useOnboardingStore((s) => s.setElectricRate)
  const invoiceNoteTemplate = useOnboardingStore((s) => s.invoiceNoteTemplate)
  const setInvoiceNoteTemplate = useOnboardingStore((s) => s.setInvoiceNoteTemplate)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="default-currency">Default currency</Label>
        <Select value={currency} onValueChange={(v) => setCurrency(v as OnboardingCurrency)}>
          <SelectTrigger id="default-currency" className="h-11 w-full sm:w-64">
            <SelectValue>
              {(value: OnboardingCurrency | null) => (value ? CURRENCY_LABELS[value] : "Select a currency")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {(Object.keys(CURRENCY_LABELS) as OnboardingCurrency[]).map((c) => (
                <SelectItem key={c} value={c}>
                  {CURRENCY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="water-rate">Water rate ($/m³)</Label>
          <Input
            id="water-rate"
            type="number"
            min={0}
            step="any"
            className="h-11 w-full"
            value={waterRate}
            onChange={(e) => setWaterRate(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="electric-rate">Electricity rate ($/kW)</Label>
          <Input
            id="electric-rate"
            type="number"
            min={0}
            step="any"
            className="h-11 w-full"
            value={electricRate}
            onChange={(e) => setElectricRate(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invoice-note">Invoice payment note template</Label>
        <Textarea
          id="invoice-note"
          rows={5}
          value={invoiceNoteTemplate}
          onChange={(e) => setInvoiceNoteTemplate(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Shown on every invoice you generate unless you override it for a specific invoice.
        </p>
      </div>
    </div>
  )
}
