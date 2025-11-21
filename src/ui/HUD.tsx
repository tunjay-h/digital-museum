import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMuseumStore } from '../store/useMuseumStore';
import presidents from '../data/presidents';

interface HUDProps {
  isMobile: boolean;
}

const HUD = ({ isMobile }: HUDProps) => {
  const { t } = useTranslation(['ui', 'museum']);
  const focusCandidateId = useMuseumStore((state) => state.focusCandidateId);
  const selectedPortraitId = useMuseumStore((state) => state.selectedPortraitId);
  const settings = useMuseumStore((state) => state.settings);
  const language = useMuseumStore((state) => state.language);
  const isOverlayOpen = useMuseumStore((state) => state.isOverlayOpen);
  const isInfoPanelOpen = useMuseumStore((state) => state.isInfoPanelOpen);

  const focusEntry = useMemo(() => {
    return presidents.find((president) => president.person_id === focusCandidateId) ?? null;
  }, [focusCandidateId]);

  const showHeader = !isOverlayOpen && (!isMobile || !isInfoPanelOpen);
  const titleSize = isMobile ? '1.1rem' : '1.4rem';
  const subtitleSize = isMobile ? '0.85rem' : '0.9rem';
  const helperSize = isMobile ? '0.8rem' : '0.85rem';
  const headerPadding = isMobile ? '0.85rem 1.1rem' : '1rem 1.5rem';
  const headerMaxWidth = isMobile ? '280px' : '360px';

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
        {showHeader && (
          <div className="hud-panel" style={{ padding: headerPadding, maxWidth: headerMaxWidth }}>
            <h2 style={{ margin: 0, fontSize: titleSize }}>{t('museum:hud.title')}</h2>
            <p style={{ margin: 0, marginTop: '0.35rem', opacity: 0.65, fontSize: subtitleSize }}>
              {t('museum:hud.subtitle')}
            </p>
            <p style={{ margin: '0.65rem 0 0', opacity: 0.55, fontSize: helperSize }}>{t('pressHForHelp')}</p>
          </div>
        )}
        <div style={{ pointerEvents: 'none' }} />
      </header>
      <div style={{ alignSelf: 'center' }}>
        {settings.showCrosshair && !isOverlayOpen && (
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
        {!isMobile &&
          focusEntry &&
          !selectedPortraitId &&
          !isOverlayOpen && (
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
      <div style={{ pointerEvents: 'none' }} />
    </div>
  );
};

export default HUD;
