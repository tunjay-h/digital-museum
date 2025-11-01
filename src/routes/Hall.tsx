import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MuseumScene from '../scene/MuseumScene';
import HUD from '../ui/HUD';
import InfoPanel from '../ui/InfoPanel';
import MobileOrientationPrompt from '../ui/MobileOrientationPrompt';
import MobileControlsOverlay from '../ui/MobileControlsOverlay';
import FallbackGallery from '../ui/FallbackGallery';
import MuseumOverlay from '../ui/MuseumOverlay';
import LoadingOverlay from '../ui/LoadingOverlay';
import { isMobileLandscapeRequired, isTouchDevice } from '../lib/device';
import { isWebGLSupported } from '../lib/webgl';
import { useMuseumStore } from '../store/useMuseumStore';
import portraits from '../data/portraits';

const Hall = () => {
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
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

  useEffect(() => {
    document.title = `${t('appTitle')} — Hallway`;
  }, [t]);

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
    if (!location.search) return;
    const params = new URLSearchParams(location.search);
    const legacyPortraitId = params.get('p');
    if (legacyPortraitId) {
      navigate(`/hall/art/${legacyPortraitId}`, { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    if (!id) {
      closeInfoPanel();
      return;
    }

    const exists = portraits.some((portrait) => portrait.person_id === id);
    if (exists) {
      openInfoPanel(id);
      return;
    }

    closeInfoPanel();
    navigate('/hall', { replace: true });
  }, [closeInfoPanel, id, navigate, openInfoPanel]);

  if (webglSupported === false) {
    return <FallbackGallery />;
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {webglSupported && <MuseumScene isMobile={isMobile} />}
      <LoadingOverlay />
      <HUD isMobile={isMobile} />
      <InfoPanel />
      <MuseumOverlay isMobile={isMobile} />
      {isMobile && <MobileControlsOverlay />}
      {isMobile && <MobileOrientationPrompt visible={landscapePrompt} />}
    </div>
  );
};

export default Hall;
