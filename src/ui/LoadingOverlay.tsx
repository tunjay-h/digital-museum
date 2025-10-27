import { useProgress } from '@react-three/drei';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LoadingOverlay = () => {
  const { active, progress } = useProgress();
  const { t } = useTranslation('ui');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!active && progress === 100) {
      const timeout = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(timeout);
    }
    setVisible(true);
    return undefined;
  }, [active, progress]);

  if (!visible) return null;

  return (
    <div
      className="hud-panel"
      style={{
        position: 'absolute',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '1rem 1.5rem',
        pointerEvents: 'none',
      }}
    >
      <span style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
        {t('loadingPercent', { value: progress.toFixed(0) })}
      </span>
      <div
        style={{
          width: '240px',
          height: '6px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Math.round(progress))}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #b68845, #f5d38b)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};

export default LoadingOverlay;
