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
        toneMappingExposure: 1.3,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      style={{ background: '#f2e8dc' }}
    >
      <fog attach="fog" args={['#f7ecdd', 22, 96]} />
      <ambientLight intensity={settings.reduceEffects ? 0.42 : 0.5} color="#f8eee2" />
      <hemisphereLight
        args={[0xfff7e8, 0xcaa67a, settings.reduceEffects ? 0.46 : 0.68]}
        position={[0, 9, 0]}
      />
      <directionalLight
        position={[2.4, 7.5, -10]}
        intensity={settings.reduceEffects ? 0.92 : 1.28}
        color="#f4f7ff"
        castShadow={false}
      />
      <directionalLight
        position={[-3.6, 8.5, 6]}
        intensity={settings.reduceEffects ? 0.55 : 0.82}
        color="#ffe9cd"
        castShadow={false}
      />
      <pointLight position={[0, 1.3, -1.8]} intensity={settings.reduceEffects ? 0.28 : 0.42} color="#e2aa72" />
      <pointLight position={[0, 5.2, 2.6]} intensity={settings.reduceEffects ? 0.6 : 0.86} color="#fff0d5" />
      <pointLight position={[0, 4.2, -12.5]} intensity={settings.reduceEffects ? 0.48 : 0.74} color="#fff5e3" />
      <Suspense fallback={null}>
        <PlacementsProvider>
          <HallLayout isMobile={isMobile} />
          <FocusManager />
          <CameraDirector />
        </PlacementsProvider>
        {!settings.reduceEffects && (
          <EffectComposer multisampling={isMobile ? 0 : 2} enableNormalPass={false}>
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} exposure={1.3} />
            <Bloom
              intensity={isMobile ? 0.1 : 0.16}
              luminanceThreshold={0.7}
              luminanceSmoothing={0.64}
              mipmapBlur
            />
            <Vignette eskil={false} offset={0.38} darkness={0.28} />
          </EffectComposer>
        )}
      </Suspense>
      {isMobile ? <ControlsMobile /> : <ControlsDesktop />}
      <Preload all />
    </Canvas>
  );
};

export default MuseumScene;
