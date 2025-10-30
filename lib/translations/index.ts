
import { en } from './en'
import { nl } from './nl'
import { ar } from './ar'

export const translations = {
  en,
  nl,
  ar,
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof en

export const languages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English' },
  { code: 'nl' as Language, name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'ar' as Language, name: 'Arabic', nativeName: 'العربية' },
]
