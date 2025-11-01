import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Vector3 } from 'three';
import { usePlacements } from './PlacementsContext';
import { useMuseumStore } from '../store/useMuseumStore';
import type { FramePlacement } from '../types';

const FocusManager = () => {
  const placements = usePlacements();
  const setFocusCandidateId = useMuseumStore((state) => state.setFocusCandidateId);
  const { camera } = useThree();
  const tempDirection = new Vector3();
  const toFrame = new Vector3();

  useFrame(() => {
    if (!placements.length) return;
    camera.getWorldDirection(tempDirection);
    let bestId: string | null = null;
    let bestScore = Infinity;

    placements.forEach((placement: FramePlacement) => {
      toFrame.set(...placement.position).sub(camera.position);
      const distance = toFrame.length();
      if (distance > 4.5) return;
      const angle = tempDirection.angleTo(toFrame.clone().normalize());
      if (angle > MathUtils.degToRad(10)) return;
      const score = distance + angle * 10;
      if (score < bestScore) {
        bestScore = score;
        bestId = placement.portrait.person_id;
      }
    });

    const current = useMuseumStore.getState().focusCandidateId;
    if (current !== bestId) {
      setFocusCandidateId(bestId);
    }
  });

  return null;
};

export default FocusManager;
