import { useEffect } from 'react';
import { useMuseumStore } from '../store/useMuseumStore';
import i18n from '../i18n';

export const LanguageSync = () => {
  const language = useMuseumStore((state) => state.language);

  useEffect(() => {
    i18n.changeLanguage(language).catch((error) => {
      console.error('Failed to change language', error);
    });
  }, [language]);

  return null;
};

export default LanguageSync;
