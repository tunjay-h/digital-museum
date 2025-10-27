import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { FramePlacement, President } from '../types';
import presidents from '../data/presidents';
import { CORRIDOR_WIDTH, FRAME_HEIGHT, FRAME_SPACING, START_Z, END_Z } from './constants';

const PlacementsContext = createContext<FramePlacement[]>([]);

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

const endPlacement = (president: President): FramePlacement => ({
  president,
  position: [0, FRAME_HEIGHT, END_Z],
  rotation: [0, Math.PI, 0],
  side: 'end',
});

const buildPlacements = () => {
  const sorted = [...presidents].sort((a, b) => a.order - b.order);
  const left = sorted.slice(0, 6).map((president, index) => toPlacement(president, index, 'left'));
  const right = sorted
    .slice(6, 12)
    .map((president, index) => toPlacement(president, index, 'right'));
  const end = endPlacement(sorted[12]);
  return [...left, ...right, end];
};

export const PlacementsProvider = ({ children }: { children: ReactNode }) => {
  const placements = useMemo(() => buildPlacements(), []);
  return <PlacementsContext.Provider value={placements}>{children}</PlacementsContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePlacements = () => useContext(PlacementsContext);
