import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { FramePlacement, President } from '../types';
import presidents from '../data/presidents';
import { CORRIDOR_WIDTH, FRAME_HEIGHT, FRAME_SPACING, START_Z } from './constants';

interface PlacementsContextValue {
  placements: FramePlacement[];
  endZ: number;
}

const PlacementsContext = createContext<PlacementsContextValue>({
  placements: [],
  endZ: START_Z - FRAME_SPACING * 0.5,
});

const toPlacement = (
  president: President,
  index: number,
  side: 'left' | 'right',
): FramePlacement => {
  const offsetIndex = side === 'left' ? index : index + 0.5;
  const z = START_Z - offsetIndex * FRAME_SPACING;
  const x = side === 'left' ? -CORRIDOR_WIDTH / 2 + 0.55 : CORRIDOR_WIDTH / 2 - 0.55;
  const rotationY = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
  return {
    president,
    position: [x, FRAME_HEIGHT, z],
    rotation: [0, rotationY, 0],
    side,
  };
};

const endPlacement = (president: President, endZ: number): FramePlacement => ({
  president,
  position: [0, FRAME_HEIGHT, endZ],
  rotation: [0, 0, 0],
  side: 'end',
});

const buildPlacements = () => {
  const sorted = [...presidents].sort((a, b) => a.order - b.order);
  const pairCount = Math.floor(sorted.length / 2);
  const placements: FramePlacement[] = [];

  for (let i = 0; i < pairCount; i += 1) {
    const leftIndex = i * 2;
    const rightIndex = leftIndex + 1;
    placements.push(toPlacement(sorted[leftIndex], i, 'left'));
    placements.push(toPlacement(sorted[rightIndex], i, 'right'));
  }

  const hasEndPlacement = sorted.length % 2 === 1;
  const endZ = START_Z - FRAME_SPACING * (pairCount + 0.5);

  if (hasEndPlacement) {
    placements.push(endPlacement(sorted[sorted.length - 1], endZ));
  }

  return { placements, endZ };
};

export const PlacementsProvider = ({ children }: { children: ReactNode }) => {
  const layout = useMemo(() => buildPlacements(), []);
  return <PlacementsContext.Provider value={layout}>{children}</PlacementsContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePlacementsLayout = () => useContext(PlacementsContext);
