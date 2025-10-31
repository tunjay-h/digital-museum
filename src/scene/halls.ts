import type { HallId } from '../types';

export interface HallDefinition {
  hallId: HallId;
  rotation: number;
  axis: 'x' | 'z';
  direction: 1 | -1;
}

export const HALL_DEFINITIONS: HallDefinition[] = [
  { hallId: 'presidents', rotation: 0, axis: 'z', direction: 1 },
  { hallId: 'founders1', rotation: Math.PI, axis: 'z', direction: -1 },
  { hallId: 'founders2', rotation: Math.PI / 2, axis: 'x', direction: -1 },
  { hallId: 'founders3', rotation: -Math.PI / 2, axis: 'x', direction: 1 },
];

export const HALL_DEFINITION_MAP = HALL_DEFINITIONS.reduce<Record<HallId, HallDefinition>>((acc, definition) => {
  acc[definition.hallId] = definition;
  return acc;
}, {} as Record<HallId, HallDefinition>);
