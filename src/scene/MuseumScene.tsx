import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import ControlsDesktop from './ControlsDesktop';
import ControlsMobile from './ControlsMobile';
import HallLayout from './HallLayout';
import { PlacementsProvider } from './PlacementsContext';
import FocusManager from './FocusManager';
import { useMuseumStore } from '../store/useMuseumStore';
import { CAMERA_EYE_HEIGHT } from './constants';
import CameraDirector from './CameraDirector';

interface MuseumSceneProps {
  isMobile: boolean;
}

const MuseumScene = ({ isMobile }: MuseumSceneProps) => {
  const settings = useMuseumStore((state) => state.settings);
  const dpr = useMemo<[number, number]>(
    () => (isMobile ? [1, 1.5] : [1, settings.reduceEffects ? 1.4 : 2]),
    [isMobile, settings.reduceEffects],
  );

  return (
    <Canvas
      id="museum-canvas"
      shadows={false}
      camera={{ position: [0, CAMERA_EYE_HEIGHT, 2.8], fov: 60 }}
      dpr={dpr}
      gl={{
        antialias: !settings.reduceEffects,
        toneMapping: THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      style={{ background: '#f2e8dc' }}
    >
      <fog attach="fog" args={['#f3e9dd', 18, 90]} />
      <ambientLight intensity={0.38} color="#f7ede0" />
      <hemisphereLight args={[0xfaf5ec, 0xc9b38c, settings.reduceEffects ? 0.32 : 0.48]} position={[0, 8, 0]} />
      <directionalLight
        position={[0, 6.5, -8]}
        intensity={settings.reduceEffects ? 0.7 : 0.95}
        color="#f1f5ff"
        castShadow={false}
      />
      <pointLight position={[0, 1.2, -2]} intensity={settings.reduceEffects ? 0.25 : 0.38} color="#e0a96c" />
      <pointLight position={[0, 5, 2]} intensity={settings.reduceEffects ? 0.55 : 0.78} color="#ffe9c9" />
      <pointLight position={[0, 4, -12]} intensity={settings.reduceEffects ? 0.42 : 0.7} color="#fff1dc" />
      <Suspense fallback={null}>
        <PlacementsProvider>
          <HallLayout isMobile={isMobile} />
          <FocusManager />
          <CameraDirector />
        </PlacementsProvider>
        {!settings.reduceEffects && (
          <EffectComposer multisampling={isMobile ? 0 : 2} enableNormalPass={false}>
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            <Bloom
              intensity={isMobile ? 0.08 : 0.12}
              luminanceThreshold={0.72}
              luminanceSmoothing={0.68}
              mipmapBlur
            />
            <Vignette eskil={false} offset={0.42} darkness={0.32} />
          </EffectComposer>
        )}
      </Suspense>
      {isMobile ? <ControlsMobile /> : <ControlsDesktop />}
      <Preload all />
    </Canvas>
  );
};

export default MuseumScene;
