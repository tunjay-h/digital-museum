import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitch from './LanguageSwitch';
import { useMuseumStore } from '../store/useMuseumStore';

interface MuseumOverlayProps {
  isMobile: boolean;
}

const MuseumOverlay = ({ isMobile }: MuseumOverlayProps) => {
  const { t } = useTranslation(['ui', 'museum']);
  const isOverlayOpen = useMuseumStore((state) => state.isOverlayOpen);
  const toggleOverlay = useMuseumStore((state) => state.toggleOverlay);
  const settings = useMuseumStore((state) => state.settings);
  const updateSettings = useMuseumStore((state) => state.updateSettings);

  useEffect(() => {
    if (!isOverlayOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        toggleOverlay(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOverlayOpen, toggleOverlay]);

  if (!isOverlayOpen) return null;

  const helpContent = !isMobile
    ? [
        t('museum:help.desktop.movement'),
        t('museum:help.desktop.look'),
        t('museum:help.desktop.focus'),
        t('museum:help.desktop.sprint'),
        t('museum:help.desktop.unlock'),
      ]
    : [
        t('museum:help.mobile.joystick'),
        t('museum:help.mobile.drag'),
        t('museum:help.mobile.tap'),
      ];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="hud-panel"
      style={{
        position: 'absolute',
        inset: '8% 10% auto 10%',
        padding: '2.5rem',
        pointerEvents: 'auto',
        maxHeight: '80vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        zIndex: 30,
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>{t('museum:overlay.title')}</h2>
          <p style={{ margin: '0.35rem 0 0', opacity: 0.7 }}>{t('museum:overlay.subtitle')}</p>
          <p style={{ margin: '1rem 0 0', fontSize: '0.85rem', opacity: 0.65 }}>
            {t('pressHToOpenOverlay')}
          </p>
        </div>
        <div style={{ alignSelf: 'flex-start' }}>
          <LanguageSwitch />
        </div>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2rem',
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>
            {isMobile ? t('museum:help.mobile.title') : t('museum:help.desktop.title')}
          </h3>
          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.75rem', opacity: 0.8 }}>
            {helpContent.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 style={{ margin: 0 }}>{t('settings')}</h3>
          <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem' }}>
              {t('volume')}: {(settings.volume * 100).toFixed(0)}%
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.volume}
                onChange={(event) => updateSettings({ volume: Number(event.target.value) })}
                style={{ width: '100%', marginTop: '0.5rem' }}
              />
            </label>
            <label style={{ display: 'block', fontSize: '0.9rem' }}>
              {t('lookSensitivity')}: {settings.lookSensitivity.toFixed(2)}
              <input
                type="range"
                min={0.4}
                max={1.6}
                step={0.05}
                value={settings.lookSensitivity}
                onChange={(event) => updateSettings({ lookSensitivity: Number(event.target.value) })}
                style={{ width: '100%', marginTop: '0.5rem' }}
              />
              <span style={{ display: 'block', opacity: 0.6, fontSize: '0.75rem', marginTop: '0.35rem' }}>
                {t('museum:settings.sensitivityHelp')}
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={settings.reduceEffects}
                onChange={(event) => updateSettings({ reduceEffects: event.target.checked })}
              />
              <span>
                <strong style={{ display: 'block' }}>{t('reduceEffects')}</strong>
                <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>
                  {t('museum:settings.reduceEffectsHelp')}
                </span>
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={!settings.cameraBob}
                onChange={(event) => updateSettings({ cameraBob: !event.target.checked })}
              />
              <span>
                <strong style={{ display: 'block' }}>{t('cameraBob')}</strong>
                <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>
                  {t('museum:settings.cameraBobHelp')}
                </span>
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={settings.showCrosshair}
                onChange={(event) => updateSettings({ showCrosshair: event.target.checked })}
              />
              <span>
                <strong style={{ display: 'block' }}>{t('crosshair')}</strong>
                <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>
                  {t('museum:settings.crosshairHelp')}
                </span>
              </span>
            </label>
          </div>
        </div>
        <div>
          <h3 style={{ margin: 0 }}>{t('credits')}</h3>
          <p style={{ opacity: 0.7, fontSize: '0.9rem', marginTop: '0.75rem' }}>
            {t('museum:credits.placeholder')}
          </p>
        </div>
      </section>

      <footer style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="ghost" onClick={() => toggleOverlay(false)}>
          {t('close')}
        </button>
      </footer>
    </div>,
    document.getElementById('root')!,
  );
};

export default MuseumOverlay;
