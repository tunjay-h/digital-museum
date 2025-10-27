import type { ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useMuseumStore } from '../store/useMuseumStore';

const SettingsPanel = () => {
  const { t } = useTranslation(['ui', 'museum']);
  const isSettingsOpen = useMuseumStore((state) => state.isSettingsOpen);
  const toggleSettings = useMuseumStore((state) => state.toggleSettings);
  const settings = useMuseumStore((state) => state.settings);
  const updateSettings = useMuseumStore((state) => state.updateSettings);

  if (!isSettingsOpen) return null;

  const handleVolume = (event: ChangeEvent<HTMLInputElement>) => {
    updateSettings({ volume: Number(event.target.value) });
  };

  const handleSensitivity = (event: ChangeEvent<HTMLInputElement>) => {
    updateSettings({ lookSensitivity: Number(event.target.value) });
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="hud-panel"
      style={{
        position: 'absolute',
        inset: '10% auto auto 50%',
        transform: 'translateX(-50%)',
        width: 'min(520px, 92vw)',
        padding: '2rem',
        pointerEvents: 'auto',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{t('settings')}</h2>
        <button className="ghost" onClick={() => toggleSettings(false)}>
          {t('close')}
        </button>
      </header>
      <section style={{ marginTop: '1.5rem', display: 'grid', gap: '1.2rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>{t('audio')}</h3>
          <label style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.85rem' }}>
            {t('volume')}: {(settings.volume * 100).toFixed(0)}%
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={handleVolume}
              style={{ width: '100%', marginTop: '0.5rem' }}
            />
          </label>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>{t('motion')}</h3>
          <label style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.85rem' }}>
            {t('lookSensitivity')}: {settings.lookSensitivity.toFixed(2)}
            <input
              type="range"
              min={0.4}
              max={1.6}
              step={0.05}
              value={settings.lookSensitivity}
              onChange={handleSensitivity}
              style={{ width: '100%', marginTop: '0.5rem' }}
            />
            <span style={{ display: 'block', opacity: 0.6, marginTop: '0.35rem', fontSize: '0.75rem' }}>
              {t('museum:settings.sensitivityHelp')}
            </span>
          </label>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>{t('accessibility')}</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
            <input
              type="checkbox"
              checked={settings.reduceEffects}
              onChange={(event) => updateSettings({ reduceEffects: event.target.checked })}
            />
            <span>
              <strong style={{ display: 'block' }}>{t('reduceEffects')}</strong>
              <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>{t('museum:settings.reduceEffectsHelp')}</span>
            </span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
            <input
              type="checkbox"
              checked={!settings.cameraBob}
              onChange={(event) => updateSettings({ cameraBob: !event.target.checked })}
            />
            <span>
              <strong style={{ display: 'block' }}>{t('cameraBob')}</strong>
              <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>{t('museum:settings.cameraBobHelp')}</span>
            </span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
            <input
              type="checkbox"
              checked={settings.showCrosshair}
              onChange={(event) => updateSettings({ showCrosshair: event.target.checked })}
            />
            <span>
              <strong style={{ display: 'block' }}>{t('crosshair')}</strong>
              <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>{t('museum:settings.crosshairHelp')}</span>
            </span>
          </label>
        </div>
      </section>
    </div>,
    document.getElementById('root')!,
  );
};

export default SettingsPanel;
