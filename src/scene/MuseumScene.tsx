import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { Suspense, useEffect, useMemo } from 'react';
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

const CloudsBackground = () => {
  const texture = useLoader(THREE.TextureLoader, '/images/clouds.jpg');
  const { scene, gl } = useThree((state) => ({ scene: state.scene, gl: state.gl }));

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const previousBackground = scene.background;
    scene.background = texture;
    return () => {
      scene.background = previousBackground;
    };
  }, [gl, scene, texture]);

  return null;
};

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
      gl={{ antialias: !settings.reduceEffects }}
      style={{ background: '#dfe7f5' }}
    >
      <fog attach="fog" args={['#dfe7f5', 18, 90]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 5, 2]} intensity={settings.reduceEffects ? 0.6 : 0.9} />
      <pointLight position={[0, 4, -12]} intensity={settings.reduceEffects ? 0.4 : 0.7} />
      <Suspense fallback={null}>
        <CloudsBackground />
        <PlacementsProvider>
          <HallLayout />
          <FocusManager />
        </PlacementsProvider>
      </Suspense>
      {isMobile ? <ControlsMobile /> : <ControlsDesktop />}
      <CameraDirector />
      <Preload all />
    </Canvas>
  );
};

export default MuseumScene;
