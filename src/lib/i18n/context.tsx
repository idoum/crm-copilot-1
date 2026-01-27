'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getDictionary, dictionaries, type Locale, type Dictionary } from './dictionaries'

const LOCALE_COOKIE = 'locale'
const DEFAULT_LOCALE: Locale = 'fr'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Dictionary
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Read locale from cookie on mount
    const savedLocale = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${LOCALE_COOKIE}=`))
      ?.split('=')[1] as Locale | undefined

    // Use requestAnimationFrame to avoid calling setState synchronously in effect
    requestAnimationFrame(() => {
      if (savedLocale && savedLocale in dictionaries) {
        setLocaleState(savedLocale)
      }
      setMounted(true)
    })
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    // Save to cookie (expires in 1 year)
    document.cookie = `${LOCALE_COOKIE}=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`
  }

  const t = getDictionary(locale)

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <I18nContext.Provider value={{ locale: DEFAULT_LOCALE, setLocale, t: getDictionary(DEFAULT_LOCALE) }}>
        {children}
      </I18nContext.Provider>
    )
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export function useTranslations() {
  const { t } = useI18n()
  return t
}
