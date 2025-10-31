import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePreloadAssets } from '../hooks/usePreloadAssets';
import { useMuseumStore } from '../store/useMuseumStore';
import LanguageSwitch from '../ui/LanguageSwitch';
import portraits from '../data/portraits';

const heroImage = '/images/ismailiyya-palace.jpeg';

const Splash = () => {
  const { t } = useTranslation(['ui']);
  const navigate = useNavigate();
  const { progress, isComplete } = usePreloadAssets();
  const [entering, setEntering] = useState(false);
  const setEnteredMuseum = useMuseumStore((state) => state.setEnteredMuseum);
  const language = useMuseumStore((state) => state.language);
  const enteredMuseum = useMuseumStore((state) => state.enteredMuseum);

  useEffect(() => {
    document.title = `${t('appTitle')} — ${t('splashTagline')}`;
  }, [language, t]);

  useEffect(() => {
    if (enteredMuseum) {
      navigate('/hall', { replace: true });
    }
  }, [enteredMuseum, navigate]);

  const featuredNames = useMemo(() => {
    return portraits
      .filter((portrait) => portrait.hall_id === 'presidents')
      .slice(0, 3)
      .map((portrait) => portrait.name_en)
      .join(' • ');
  }, []);

  const handleEnter = () => {
    if (!isComplete || entering) return;
    setEntering(true);
    setTimeout(() => {
      setEnteredMuseum(true);
      navigate('/hall');
    }, 900);
  };

  return (
    <div
      style={{
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(180deg, rgba(18, 16, 24, 0.38), rgba(12, 10, 18, 0.64)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'saturate(1.05) brightness(1.02)',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          padding: '2.5rem',
          maxWidth: '720px',
        }}
      >
        <LanguageSwitch />
        <div>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            {t('appTitle')}
          </h1>
          <p style={{ opacity: 0.82, fontSize: '1.1rem', margin: 0 }}>{t('splashTagline')}</p>
        </div>
        <div
          className="hud-panel"
          style={{
            width: '100%',
            padding: '1.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span>{t('loading')}</span>
            <span>{progress}%</span>
          </div>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '8px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #b68845, #f5d38b)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <p style={{ opacity: 0.6, fontSize: '0.85rem', margin: 0 }}>{t('loadingHint')}</p>
        </div>
        <button
          className="primary"
          onClick={handleEnter}
          disabled={!isComplete}
          aria-live="polite"
        >
          {entering ? t('entering') : t('enterMuseum')}
        </button>
        <p style={{ opacity: 0.45, fontSize: '0.8rem', margin: 0 }}>{featuredNames}</p>
      </div>
    </div>
  );
};

export default Splash;
