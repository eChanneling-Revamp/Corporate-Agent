import { useState, useEffect, useContext, createContext } from 'react'

// Language Context
interface LanguageContextType {
  currentLanguage: string
  setLanguage: (lang: string) => void
  t: (key: string, defaultText?: string) => string
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Language Provider Component
export function LanguageProvider({ 
  children, 
  defaultLanguage = 'en' 
}: { 
  children: React.ReactNode
  defaultLanguage?: string 
}) {
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage)
  const [translations, setTranslations] = useState<Record<string, any>>({})

  // Load translations when language changes
  useEffect(() => {
    loadTranslations(currentLanguage)
  }, [currentLanguage])

  const loadTranslations = async (language: string) => {
    try {
      // Load common translations first
      const commonResponse = await fetch(`/api/translations?language=${language}&module=common`)
      const commonData = await commonResponse.json()

      // Load other modules
      const modules = ['appointments', 'payments', 'corporate', 'reports', 'notifications', 'validation', 'datetime']
      const modulePromises = modules.map(module => 
        fetch(`/api/translations?language=${language}&module=${module}`)
          .then(res => res.json())
          .then(data => ({ module, data: data.success ? data.data.translations : {} }))
          .catch(() => ({ module, data: {} }))
      )

      const moduleResults = await Promise.all(modulePromises)
      
      // Combine all translations
      const allTranslations = {
        common: commonData.success ? commonData.data.translations : {},
        ...moduleResults.reduce((acc, { module, data }) => {
          acc[module] = data
          return acc
        }, {} as Record<string, any>)
      }

      setTranslations(allTranslations)

      // Save to localStorage for offline access
      localStorage.setItem(`translations_${language}`, JSON.stringify(allTranslations))
      localStorage.setItem('preferredLanguage', language)

    } catch (error) {
      console.error('Failed to load translations:', error)
      // Try to load from localStorage as fallback
      const savedTranslations = localStorage.getItem(`translations_${language}`)
      if (savedTranslations) {
        setTranslations(JSON.parse(savedTranslations))
      }
    }
  }

  // Translation function
  const t = (key: string, defaultText?: string): string => {
    const [module, ...keyParts] = key.split('.')
    const translationKey = keyParts.join('.')

    if (!module || !translationKey) {
      return defaultText || key
    }

    const moduleTranslations = translations[module]
    if (!moduleTranslations) {
      return defaultText || key
    }

    const translation = moduleTranslations[translationKey]
    return translation?.value || defaultText || key
  }

  const setLanguage = (lang: string) => {
    setCurrentLanguage(lang)
    // Update document direction for RTL languages
    document.documentElement.dir = ['ar', 'he'].includes(lang) ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }

  const isRTL = ['ar', 'he'].includes(currentLanguage)

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      setLanguage,
      t,
      isRTL
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

// Custom hook to use translations
export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}

// Translation component for JSX
export function T({ 
  k, 
  defaultText, 
  values = {} 
}: { 
  k: string
  defaultText?: string
  values?: Record<string, any> 
}) {
  const { t } = useTranslation()
  
  let text = t(k, defaultText)
  
  // Replace placeholders with values
  Object.entries(values).forEach(([key, value]) => {
    text = text.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
  })
  
  return <>{text}</>
}

// Language selector component
export function LanguageSelector({ 
  className = '' 
}: { 
  className?: string 
}) {
  const { currentLanguage, setLanguage } = useTranslation()

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' }
  ]

  return (
    <select 
      value={currentLanguage}
      onChange={(e) => setLanguage(e.target.value)}
      className={`language-selector ${className}`}
      aria-label="Select language"
    >
      {languages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  )
}

// Utility functions for formatting
export const formatters = {
  // Format currency based on language
  currency: (amount: number, language: string = 'en') => {
    const formatters = {
      en: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR' }),
      si: new Intl.NumberFormat('si-LK', { style: 'currency', currency: 'LKR' }),
      ta: new Intl.NumberFormat('ta-LK', { style: 'currency', currency: 'LKR' })
    }
    
    return formatters[language as keyof typeof formatters]?.format(amount) || 
           formatters.en.format(amount)
  },

  // Format date based on language
  date: (date: Date, language: string = 'en') => {
    const formatters = {
      en: new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      }),
      si: new Intl.DateTimeFormat('si-LK', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      }),
      ta: new Intl.DateTimeFormat('ta-LK', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      })
    }
    
    return formatters[language as keyof typeof formatters]?.format(date) || 
           formatters.en.format(date)
  },

  // Format time based on language
  time: (date: Date, language: string = 'en') => {
    const formatters = {
      en: new Intl.DateTimeFormat('en-US', { 
        hour: 'numeric', minute: '2-digit', hour12: true 
      }),
      si: new Intl.DateTimeFormat('si-LK', { 
        hour: 'numeric', minute: '2-digit', hour12: true 
      }),
      ta: new Intl.DateTimeFormat('ta-LK', { 
        hour: 'numeric', minute: '2-digit', hour12: true 
      })
    }
    
    return formatters[language as keyof typeof formatters]?.format(date) || 
           formatters.en.format(date)
  },

  // Format numbers based on language
  number: (num: number, language: string = 'en') => {
    const formatters = {
      en: new Intl.NumberFormat('en-US'),
      si: new Intl.NumberFormat('si-LK'),
      ta: new Intl.NumberFormat('ta-LK')
    }
    
    return formatters[language as keyof typeof formatters]?.format(num) || 
           formatters.en.format(num)
  }
}

// Translation validation utility
export function validateTranslations(translations: Record<string, any>) {
  const issues: string[] = []
  
  Object.entries(translations).forEach(([key, translation]) => {
    // Check if all required languages are present
    const requiredLangs = ['en', 'si', 'ta']
    const presentLangs = Object.keys(translation)
    
    const missingLangs = requiredLangs.filter(lang => !presentLangs.includes(lang))
    if (missingLangs.length > 0) {
      issues.push(`Translation key '${key}' missing languages: ${missingLangs.join(', ')}`)
    }
    
    // Check for empty translations
    Object.entries(translation).forEach(([lang, value]) => {
      if (!value || String(value).trim() === '') {
        issues.push(`Translation key '${key}' has empty value for language '${lang}'`)
      }
    })
    
    // Check for placeholder consistency
    const enText = translation.en || ''
    const placeholders = enText.match(/{{[^}]+}}/g) || []
    
    Object.entries(translation).forEach(([lang, value]) => {
      if (lang === 'en') return
      
      const langPlaceholders = String(value).match(/{{[^}]+}}/g) || []
      if (placeholders.length !== langPlaceholders.length) {
        issues.push(`Translation key '${key}' has placeholder mismatch in '${lang}'`)
      }
    })
  })
  
  return issues
}

// Initialize translations from localStorage on app load
export function initializeTranslations() {
  if (typeof window === 'undefined') return 'en' // SSR fallback
  
  const savedLanguage = localStorage.getItem('preferredLanguage')
  return savedLanguage || 'en'
}