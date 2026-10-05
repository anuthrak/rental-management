"use client"

import type { Currency } from "@/lib/types"
import type { TranslationKey } from "@/lib/i18n"
import { useI18n } from "@/components/i18n-provider"
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

const CURRENCY_LABEL_KEYS: Record<Currency, TranslationKey> = {
  USD: "currencyUsdLabel",
  KHR: "currencyKhrLabel",
}

export function PropertyBusinessSection({
  businessName,
  onBusinessNameChange,
  currency,
  onCurrencyChange,
  disabled = false,
}: {
  businessName: string
  onBusinessNameChange: (value: string) => void
  currency: Currency
  onCurrencyChange: (value: Currency) => void
  disabled?: boolean
}) {
  const { t } = useI18n()

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-base font-medium">{t("propertyBusinessSectionTitle")}</h2>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-business-name">{t("propertyNameField")}</Label>
        <Input
          id="settings-business-name"
          className="h-11 w-full"
          value={businessName}
          onChange={(e) => onBusinessNameChange(e.target.value)}
          placeholder={t("propertyNamePlaceholder")}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-currency">{t("defaultCurrencyField")}</Label>
        <Select disabled={disabled} value={currency} onValueChange={(v) => onCurrencyChange(v as Currency)}>
          <SelectTrigger id="settings-currency" className="h-11 w-full sm:w-64">
            <SelectValue>
              {(value: Currency | null) =>
                value ? t(CURRENCY_LABEL_KEYS[value]) : t("selectCurrencyPlaceholder")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {(Object.keys(CURRENCY_LABEL_KEYS) as Currency[]).map((c) => (
                <SelectItem key={c} value={c}>
                  {t(CURRENCY_LABEL_KEYS[c])}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </section>
  )
}
