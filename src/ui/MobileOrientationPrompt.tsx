import { useTranslation } from 'react-i18next';

interface MobileOrientationPromptProps {
  visible: boolean;
}

const MobileOrientationPrompt = ({ visible }: MobileOrientationPromptProps) => {
  const { t } = useTranslation('ui');

  if (!visible) return null;

  return (
    <div
      className="hud-panel"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5,6,10,0.88)',
        textAlign: 'center',
        padding: '2rem',
        pointerEvents: 'auto',
        zIndex: 20,
      }}
    >
      <div>
        <h2 style={{ marginBottom: '0.75rem' }}>{t('landscapePrompt')}</h2>
        <p style={{ opacity: 0.7 }}>{t('tapInteract')}</p>
      </div>
    </div>
  );
};

export default MobileOrientationPrompt;
