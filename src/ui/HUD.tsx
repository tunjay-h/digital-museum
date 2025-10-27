import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMuseumStore } from '../store/useMuseumStore';
import LanguageSwitch from './LanguageSwitch';
import presidents from '../data/presidents';

interface HUDProps {
  isMobile: boolean;
}

const HUD = ({ isMobile }: HUDProps) => {
  const { t } = useTranslation(['ui', 'museum']);
  const toggleSettings = useMuseumStore((state) => state.toggleSettings);
  const toggleHelp = useMuseumStore((state) => state.toggleHelp);
  const focusCandidateId = useMuseumStore((state) => state.focusCandidateId);
  const selectedPortraitId = useMuseumStore((state) => state.selectedPortraitId);
  const settings = useMuseumStore((state) => state.settings);
  const language = useMuseumStore((state) => state.language);

  const focusEntry = useMemo(() => {
    return presidents.find((president) => president.person_id === focusCandidateId) ?? null;
  }, [focusCandidateId]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.5rem',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="hud-panel" style={{ padding: '1rem 1.5rem', maxWidth: '360px' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{t('museum:hud.title')}</h2>
          <p style={{ margin: 0, marginTop: '0.35rem', opacity: 0.65, fontSize: '0.9rem' }}>
            {t('museum:hud.subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <LanguageSwitch compact />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', pointerEvents: 'auto' }}>
            <button className="ghost" onClick={() => toggleHelp(true)}>
              {t('help')}
            </button>
            <button className="ghost" onClick={() => toggleSettings(true)}>
              {t('settings')}
            </button>
          </div>
        </div>
      </header>
      <div style={{ alignSelf: 'center' }}>
        {settings.showCrosshair && (
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.55)',
              boxShadow: '0 0 10px rgba(228, 181, 100, 0.5)',
              opacity: 0.7,
            }}
          />
        )}
        {!isMobile && focusEntry && !selectedPortraitId && (
          <div
            className="hud-panel"
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              fontSize: '0.8rem',
              maxWidth: '340px',
              textAlign: 'center',
            }}
          >
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
              {language === 'az' ? focusEntry.name_az : focusEntry.name_en}
            </strong>
            <span style={{ opacity: 0.7 }}>{t('focus')}</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
        <div className="hud-panel" style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', maxWidth: '320px' }}>
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span>{t('museum:help.mobile.title')}</span>
              <span style={{ opacity: 0.6 }}>{t('museum:help.mobile.joystick')}</span>
              <span style={{ opacity: 0.6 }}>{t('museum:help.mobile.drag')}</span>
              <span style={{ opacity: 0.6 }}>{t('museum:help.mobile.tap')}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span>{t('museum:help.desktop.title')}</span>
              <span style={{ opacity: 0.6 }}>{t('museum:help.desktop.movement')}</span>
              <span style={{ opacity: 0.6 }}>{t('museum:help.desktop.look')}</span>
              <span style={{ opacity: 0.6 }}>{t('museum:help.desktop.focus')}</span>
              <span style={{ opacity: 0.6 }}>{t('museum:help.desktop.sprint')}</span>
            </div>
          )}
        </div>
        <div
          className="hud-panel"
          style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', maxWidth: '220px', textAlign: 'right' }}
        >
          <span style={{ display: 'block', opacity: 0.7 }}>{t('credits')}</span>
          <span style={{ opacity: 0.55 }}>{t('museum:credits.placeholder')}</span>
        </div>
      </div>
    </div>
  );
};

export default HUD;
