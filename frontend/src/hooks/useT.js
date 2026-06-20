import { useUIStore } from '../store';
import { translations } from '../locales/translations';

export function useT() {
  const lang = useUIStore((s) => s.language || 'fr');
  const dict = translations[lang] || translations.fr;
  return (key, fallback) => dict[key] || fallback || key;
}

export function useLang() {
  const lang = useUIStore((s) => s.language || 'fr');
  const setLanguage = useUIStore((s) => s.setLanguage);
  return { lang, setLanguage, isFr: lang === 'fr', isEn: lang === 'en' };
}
