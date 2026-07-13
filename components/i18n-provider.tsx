"use client"

import { createContext, useContext, useMemo } from "react"

import { dictionaries, localeMap, type TranslationKey } from "@/lib/i18n"
import type { Language } from "@/lib/types"
import { useInvoiceStore } from "@/store/use-invoice-store"

interface I18nContextValue {
  language: Language
  locale: string
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = useInvoiceStore((s) => s.draft.language)

  const value = useMemo<I18nContextValue>(() => {
    const dict = dictionaries[language] ?? dictionaries.en
    return {
      language,
      locale: localeMap[language] ?? "en-US",
      t: (key) => dict[key] ?? key,
    }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return ctx
}
