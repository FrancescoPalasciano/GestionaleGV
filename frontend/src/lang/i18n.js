import it from './it/messages.js'
import en from './en/messages.js'

export const dictionaries = {
  it,
  en,
}

export function getTranslation(lang = 'it') {
  return dictionaries[lang] || dictionaries.it
}
