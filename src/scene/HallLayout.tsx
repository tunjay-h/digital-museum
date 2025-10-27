import { DoubleSide } from 'three';
import { useMuseumStore } from '../store/useMuseumStore';
import { useHallTextures } from './useHallTextures';
import { CORRIDOR_WIDTH, END_Z } from './constants';
import Frame from './Frame';
import { usePlacements } from './PlacementsContext';

const HallLayout = () => {
  const placements = usePlacements();
  const highlightedId = useMuseumStore((state) =>
    state.focusCandidateId ?? state.selectedPortraitId ?? null,
  );
  const openInfoPanel = useMuseumStore((state) => state.openInfoPanel);
  const { wallTexture, floorTexture } = useHallTextures();

  const hallLength = Math.abs(END_Z) + 6;

  return (
    <group>
      <mesh position={[0, 0, -hallLength / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CORRIDOR_WIDTH, hallLength + 8]} />
        <meshBasicMaterial map={floorTexture} color="#f5f0e6" />
      </mesh>
      <mesh position={[-CORRIDOR_WIDTH / 2, 2.1, -hallLength / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[hallLength + 8, 5]} />
        <meshBasicMaterial map={wallTexture} side={DoubleSide} color="#f2e9dc" />
      </mesh>
      <mesh position={[CORRIDOR_WIDTH / 2, 2.1, -hallLength / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[hallLength + 8, 5]} />
        <meshBasicMaterial map={wallTexture} side={DoubleSide} color="#f2e9dc" />
      </mesh>
      <mesh position={[0, 2.1, END_Z - 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CORRIDOR_WIDTH, 5]} />
        <meshBasicMaterial map={wallTexture} side={DoubleSide} color="#f2e9dc" />
      </mesh>
      {placements.map((placement) => (
        <Frame
          key={placement.president.person_id}
          placement={placement}
          isHighlighted={highlightedId === placement.president.person_id}
          onSelect={(id) => openInfoPanel(id)}
        />
      ))}
    </group>
  );
};

export default HallLayout;
