import { useTranslation } from 'react-i18next';
import { useMuseumStore } from '../store/useMuseumStore';

interface LanguageSwitchProps {
  compact?: boolean;
}

const LanguageSwitch = ({ compact = false }: LanguageSwitchProps) => {
  const { t } = useTranslation('ui');
  const language = useMuseumStore((state) => state.language);
  const setLanguage = useMuseumStore((state) => state.setLanguage);

  return (
    <div
      className="hud-panel"
      style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        padding: compact ? '0.35rem 0.6rem' : '0.5rem 0.9rem',
      }}
    >
      <span style={{ fontSize: compact ? '0.75rem' : '0.85rem', opacity: 0.7 }}>
        {t('languageLabel')}
      </span>
      {(['az', 'en'] as const).map((locale) => (
        <button
          key={locale}
          className="ghost"
          onClick={() => setLanguage(locale)}
          style={{
            padding: compact ? '0.25rem 0.75rem' : '0.35rem 1.1rem',
            borderColor:
              language === locale ? 'rgba(228, 181, 100, 0.6)' : 'var(--hud-border)',
            background:
              language === locale ? 'rgba(228, 181, 100, 0.16)' : 'transparent',
            fontSize: compact ? '0.8rem' : '0.85rem',
          }}
          aria-pressed={language === locale}
        >
          {t(`language.${locale}`)}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitch;
