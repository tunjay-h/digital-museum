import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import portraits from '../data/portraits';
import type { FramePlacement, HallId, Portrait } from '../types';
import { CORRIDOR_WIDTH, FRAME_HEIGHT, FRAME_SPACING, HALL_ENTRY_OFFSET } from './constants';
import { HALL_DEFINITION_MAP, HALL_DEFINITIONS, type HallDefinition } from './halls';

const PlacementsContext = createContext<FramePlacement[]>([]);

const createPlacement = (
  portrait: Portrait,
  hallConfig: HallDefinition,
  rowIndex: number,
  side: 'left' | 'right' | 'center',
): FramePlacement => {
  const localZ = HALL_ENTRY_OFFSET + rowIndex * FRAME_SPACING;
  let localX = 0;
  let rotationY = 0;

  if (side === 'left') {
    localX = -CORRIDOR_WIDTH / 2 + 0.55;
    rotationY = Math.PI / 2;
  } else if (side === 'right') {
    localX = CORRIDOR_WIDTH / 2 - 0.55;
    rotationY = -Math.PI / 2;
  } else {
    localX = 0;
    rotationY = Math.PI;
  }

  const cos = Math.cos(hallConfig.rotation);
  const sin = Math.sin(hallConfig.rotation);

  const worldX = localX * cos + localZ * sin;
  const worldZ = -localX * sin + localZ * cos;

  return {
    portrait,
    hallId: hallConfig.hallId,
    position: [worldX, FRAME_HEIGHT, worldZ],
    rotation: [0, rotationY + hallConfig.rotation, 0],
    side,
  };
};

const buildPlacements = () => {
  const groups = portraits.reduce<Record<HallId, Portrait[]>>(
    (acc, portrait) => {
      const hallId = portrait.hall_id;
      acc[hallId] = acc[hallId] ?? [];
      acc[hallId].push(portrait);
      return acc;
    },
    HALL_DEFINITIONS.reduce<Record<HallId, Portrait[]>>((acc, definition) => {
      acc[definition.hallId] = [];
      return acc;
    }, {} as Record<HallId, Portrait[]>),
  );

  const all: FramePlacement[] = [];

  HALL_DEFINITIONS.forEach((definition) => {
    const hallId = definition.hallId;
    const hallConfig = HALL_DEFINITION_MAP[hallId];
    const entries = groups[hallId].slice().sort((a, b) => a.order - b.order);
    let rowIndex = 0;
    for (let i = 0; i < entries.length; ) {
      const remaining = entries.length - i;
      if (remaining === 1) {
        const portrait = entries[i];
        all.push(createPlacement(portrait, hallConfig, rowIndex, 'center'));
        rowIndex += 1;
        i += 1;
      } else {
        const leftPortrait = entries[i];
        const rightPortrait = entries[i + 1];
        all.push(createPlacement(leftPortrait, hallConfig, rowIndex, 'left'));
        all.push(createPlacement(rightPortrait, hallConfig, rowIndex, 'right'));
        rowIndex += 1;
        i += 2;
      }
    }
  });

  return all;
};

export const PlacementsProvider = ({ children }: { children: ReactNode }) => {
  const placements = useMemo(() => buildPlacements(), []);
  return <PlacementsContext.Provider value={placements}>{children}</PlacementsContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePlacements = () => useContext(PlacementsContext);
