import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MuseumScene from '../scene/MuseumScene';
import HUD from '../ui/HUD';
import InfoPanel from '../ui/InfoPanel';
import MobileOrientationPrompt from '../ui/MobileOrientationPrompt';
import MobileControlsOverlay from '../ui/MobileControlsOverlay';
import FallbackGallery from '../ui/FallbackGallery';
import MuseumOverlay from '../ui/MuseumOverlay';
import { isMobileLandscapeRequired, isTouchDevice } from '../lib/device';
import { isWebGLSupported } from '../lib/webgl';
import { useMuseumStore } from '../store/useMuseumStore';
import presidents from '../data/presidents';

const Hall = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('ui');
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [landscapePrompt, setLandscapePrompt] = useState(false);
  const isMobile = useMemo(() => isTouchDevice(), []);
  const enteredMuseum = useMuseumStore((state) => state.enteredMuseum);
  const setEnteredMuseum = useMuseumStore((state) => state.setEnteredMuseum);
  const openInfoPanel = useMuseumStore((state) => state.openInfoPanel);
  const closeInfoPanel = useMuseumStore((state) => state.closeInfoPanel);
  const toggleOverlay = useMuseumStore((state) => state.toggleOverlay);
  const hasSeenOverlay = useMuseumStore((state) => state.hasSeenOverlay);

  useEffect(() => {
    document.title = `${t('appTitle')} — Hallway`;
  }, [t]);

  useEffect(() => {
    if (!hasSeenOverlay) {
      toggleOverlay(true);
    }
  }, [hasSeenOverlay, toggleOverlay]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === 'KeyH') {
        event.preventDefault();
        toggleOverlay();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [toggleOverlay]);

  useEffect(() => {
    setWebglSupported(isWebGLSupported());
  }, []);

  useEffect(() => {
    if (!enteredMuseum) {
      setEnteredMuseum(true);
    }
  }, [enteredMuseum, setEnteredMuseum]);

  useEffect(() => {
    if (!isMobile) return;
    const checkOrientation = () => {
      setLandscapePrompt(isMobileLandscapeRequired());
    };
    checkOrientation();
    window.addEventListener('orientationchange', checkOrientation);
    window.addEventListener('resize', checkOrientation);
    return () => {
      window.removeEventListener('orientationchange', checkOrientation);
      window.removeEventListener('resize', checkOrientation);
    };
  }, [isMobile]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const portraitId = params.get('p');
    if (portraitId) {
      const exists = presidents.some((president) => president.person_id === portraitId);
      if (exists) {
        openInfoPanel(portraitId);
      } else {
        closeInfoPanel();
      }
    } else {
      closeInfoPanel();
    }
  }, [closeInfoPanel, location.search, openInfoPanel]);

  useEffect(() => {
    if (location.pathname !== '/hall') {
      navigate('/hall', { replace: true });
    }
  }, [location.pathname, navigate]);

  if (webglSupported === false) {
    return <FallbackGallery />;
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {webglSupported && <MuseumScene isMobile={isMobile} />}
      <HUD isMobile={isMobile} />
      <InfoPanel />
      <MuseumOverlay isMobile={isMobile} />
      {isMobile && <MobileControlsOverlay />}
      {isMobile && <MobileOrientationPrompt visible={landscapePrompt} />}
    </div>
  );
};

export default Hall;
