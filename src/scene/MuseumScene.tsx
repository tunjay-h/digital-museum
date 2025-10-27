import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import ControlsDesktop from './ControlsDesktop';
import ControlsMobile from './ControlsMobile';
import HallLayout from './HallLayout';
import { PlacementsProvider } from './PlacementsContext';
import FocusManager from './FocusManager';
import { useMuseumStore } from '../store/useMuseumStore';
import { CAMERA_EYE_HEIGHT } from './constants';

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
      shadows={false}
      camera={{ position: [0, CAMERA_EYE_HEIGHT, 2.8], fov: 60 }}
      dpr={dpr}
      gl={{ antialias: !settings.reduceEffects }}
      style={{ background: '#060709' }}
    >
      <color attach="background" args={['#060709']} />
      <fog attach="fog" args={['#060709', 12, 80]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 5, 2]} intensity={settings.reduceEffects ? 0.6 : 0.9} />
      <pointLight position={[0, 4, -12]} intensity={settings.reduceEffects ? 0.4 : 0.7} />
      <Suspense fallback={null}>
        <PlacementsProvider>
          <HallLayout />
          <FocusManager />
        </PlacementsProvider>
      </Suspense>
      {isMobile ? <ControlsMobile /> : <ControlsDesktop />}
      <Preload all />
    </Canvas>
  );
};

export default MuseumScene;
