import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useMuseumStore } from '../store/useMuseumStore';

const HelpOverlay = ({ isMobile }: { isMobile: boolean }) => {
  const { t } = useTranslation(['ui', 'museum']);
  const isHelpOpen = useMuseumStore((state) => state.isHelpOpen);
  const toggleHelp = useMuseumStore((state) => state.toggleHelp);

  useEffect(() => {
    if (!isHelpOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        toggleHelp(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isHelpOpen, toggleHelp]);

  if (!isHelpOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="hud-panel"
      style={{
        position: 'absolute',
        inset: '12% 10% auto 10%',
        padding: '2rem',
        pointerEvents: 'auto',
        maxHeight: '76vh',
        overflowY: 'auto',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{t('help')}</h2>
        <button className="ghost" onClick={() => toggleHelp(false)}>
          {t('close')}
        </button>
      </header>
      <section style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
        {!isMobile ? (
          <div>
            <h3 style={{ margin: 0 }}>{t('museum:help.desktop.title')}</h3>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', opacity: 0.8 }}>
              <li>{t('museum:help.desktop.movement')}</li>
              <li>{t('museum:help.desktop.look')}</li>
              <li>{t('museum:help.desktop.focus')}</li>
              <li>{t('museum:help.desktop.sprint')}</li>
              <li>{t('togglePointer')}</li>
            </ul>
          </div>
        ) : (
          <div>
            <h3 style={{ margin: 0 }}>{t('museum:help.mobile.title')}</h3>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', opacity: 0.8 }}>
              <li>{t('museum:help.mobile.joystick')}</li>
              <li>{t('museum:help.mobile.drag')}</li>
              <li>{t('museum:help.mobile.tap')}</li>
            </ul>
          </div>
        )}
        <div>
          <h3 style={{ margin: 0 }}>{t('accessibility')}</h3>
          <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>{t('museum:settings.cameraBobHelp')}</p>
          <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>{t('museum:settings.reduceEffectsHelp')}</p>
        </div>
      </section>
    </div>,
    document.getElementById('root')!,
  );
};

export default HelpOverlay;
