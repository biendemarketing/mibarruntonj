import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'mb-lang';
const EVENT_NAME = 'mb-lang-change';

/**
 * Detecta el idioma preferido del dispositivo ('es' o 'en').
 * Prioriza la elección manual guardada en localStorage; si no existe,
 * lee navigator.language / navigator.languages del dispositivo.
 */
export function getDeviceLanguage() {
  if (typeof window === 'undefined') return 'es';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'es' || saved === 'en') {
      return saved;
    }
  } catch {}

  try {
    const navLang =
      (Array.isArray(navigator.languages) && navigator.languages[0]) ||
      navigator.language ||
      navigator.userLanguage ||
      'es';
    if (String(navLang).toLowerCase().startsWith('en')) {
      return 'en';
    }
  } catch {}

  return 'es';
}

export function setAppLanguage(nextLang) {
  const valid = nextLang === 'en' ? 'en' : 'es';
  try {
    localStorage.setItem(STORAGE_KEY, valid);
  } catch {}
  if (typeof document !== 'undefined') {
    document.documentElement.lang = valid;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: valid }));
  }
}

export function useLanguage() {
  const [lang, setLangState] = useState(() => getDeviceLanguage());

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    const handleLangChange = (e) => {
      if (e.detail === 'es' || e.detail === 'en') {
        setLangState(e.detail);
      }
    };
    window.addEventListener(EVENT_NAME, handleLangChange);
    return () => window.removeEventListener(EVENT_NAME, handleLangChange);
  }, [lang]);

  const setLang = useCallback((next) => {
    setAppLanguage(next);
  }, []);

  const toggleLang = useCallback(() => {
    setAppLanguage(lang === 'es' ? 'en' : 'es');
  }, [lang]);

  return { lang, isEn: lang === 'en', setLang, toggleLang };
}

