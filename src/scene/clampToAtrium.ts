import { Vector3 } from 'three';
import { CORRIDOR_WIDTH, HALL_LENGTH, HUB_RADIUS } from './constants';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const corridorHalf = CORRIDOR_WIDTH / 2 - 0.6;
const outerRadius = HUB_RADIUS + HALL_LENGTH - 0.6;
const hubRadius = HUB_RADIUS - 0.4;
const corridorStart = HUB_RADIUS - 0.4;
const corridorEnd = HUB_RADIUS + HALL_LENGTH - 0.8;

export const clampToAtrium = (position: Vector3) => {
  const originalY = position.y;
  let radial = Math.hypot(position.x, position.z);
  if (radial > outerRadius) {
    const scale = outerRadius / radial;
    position.x *= scale;
    position.z *= scale;
    radial = outerRadius;
  }

  if (radial <= hubRadius) {
    position.y = originalY;
    return position;
  }

  let bestCandidate: Vector3 | null = null;
  let smallestDelta = Infinity;

  const corridors = [
    { axis: 'z' as const, sign: 1 },
    { axis: 'z' as const, sign: -1 },
    { axis: 'x' as const, sign: 1 },
    { axis: 'x' as const, sign: -1 },
  ];

  corridors.forEach(({ axis, sign }) => {
    const forward = axis === 'z' ? sign * position.z : sign * position.x;
    const lateral = axis === 'z' ? position.x : position.z;

    const clampedForward = clamp(forward, corridorStart, corridorEnd);
    const clampedLateral = clamp(lateral, -corridorHalf, corridorHalf);

    const candidate =
      axis === 'z'
        ? new Vector3(clampedLateral, originalY, sign * clampedForward)
        : new Vector3(sign * clampedForward, originalY, clampedLateral);

    const delta = candidate.distanceToSquared(position);
    if (delta < smallestDelta) {
      smallestDelta = delta;
      bestCandidate = candidate;
    }
  });

  if (bestCandidate) {
    position.copy(bestCandidate);
  } else if (radial > hubRadius) {
    const scale = hubRadius / radial;
    position.x *= scale;
    position.z *= scale;
  }

  position.y = originalY;
  return position;
};
