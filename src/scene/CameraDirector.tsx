import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { usePlacements } from './PlacementsContext';
import { useMuseumStore } from '../store/useMuseumStore';
import { CAMERA_EYE_HEIGHT, CORRIDOR_WIDTH, HALL_LENGTH, HUB_RADIUS, PORTAL_DEPTH } from './constants';
import type { FramePlacement } from '../types';
import { HALL_DEFINITION_MAP } from './halls';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const up = new Vector3(0, 1, 0);

const corridorHalf = CORRIDOR_WIDTH / 2 - 0.6;
const minHallDistance = HUB_RADIUS - PORTAL_DEPTH * 0.2;
const maxHallDistance = HUB_RADIUS + HALL_LENGTH - 1.5;

const buildTargetPose = (placement: FramePlacement) => {
  const [frameX, frameY, frameZ] = placement.position;
  const hallConfig = HALL_DEFINITION_MAP[placement.hallId];
  const forward = new Vector3(0, 0, 1).applyAxisAngle(up, hallConfig.rotation).normalize();
  const right = new Vector3().crossVectors(up, forward).normalize();

  const base = new Vector3(frameX, frameY, frameZ);
  const backDistance = placement.side === 'center' ? 1.6 : 1.1;
  const lateral = placement.side === 'left' ? -1.05 : placement.side === 'right' ? 1.05 : 0;

  const position = base
    .clone()
    .add(forward.clone().multiplyScalar(-backDistance))
    .add(right.clone().multiplyScalar(lateral));

  position.y = CAMERA_EYE_HEIGHT;

  const localX = position.dot(right);
  const clampedX = clamp(localX, -corridorHalf, corridorHalf);
  if (clampedX !== localX) {
    position.add(right.clone().multiplyScalar(clampedX - localX));
  }

  const localZ = position.dot(forward);
  const clampedZ = clamp(localZ, minHallDistance, maxHallDistance);
  if (clampedZ !== localZ) {
    position.add(forward.clone().multiplyScalar(clampedZ - localZ));
  }

  const lookAt = new Vector3(frameX, frameY, frameZ);
  const orientation = new Quaternion().setFromRotationMatrix(
    new Matrix4().lookAt(position.clone(), lookAt, up),
  );

  return { position, orientation };
};

const CameraDirector = () => {
  const placements = usePlacements();
  const { camera } = useThree();
  const selectedPortraitId = useMuseumStore((state) => state.selectedPortraitId);
  const isInfoPanelOpen = useMuseumStore((state) => state.isInfoPanelOpen);
  const unlockPointer = useMuseumStore((state) => state.pointerLock.unlock);
  const autopilot = useRef({
    active: false,
    elapsed: 0,
    duration: 1.6,
    startPosition: new Vector3(),
    startOrientation: new Quaternion(),
    targetPosition: new Vector3(),
    targetOrientation: new Quaternion(),
  });
  const lastTargetId = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedPortraitId || !isInfoPanelOpen) {
      autopilot.current.active = false;
      lastTargetId.current = null;
      return;
    }

    if (!placements.length) return;
    if (selectedPortraitId === lastTargetId.current) return;

    const placement = placements.find((entry) => entry.portrait.person_id === selectedPortraitId);
    if (!placement) return;

    const { position, orientation } = buildTargetPose(placement);
    const startPosition = camera.position.clone();
    const startOrientation = camera.quaternion.clone();
    const distance = startPosition.distanceTo(position);
    const duration = clamp(distance / 2.4, 1.2, 2.4);

    autopilot.current = {
      active: true,
      elapsed: 0,
      duration,
      startPosition,
      startOrientation,
      targetPosition: position,
      targetOrientation: orientation,
    };
    lastTargetId.current = selectedPortraitId;

    unlockPointer?.();
  }, [camera, isInfoPanelOpen, placements, selectedPortraitId, unlockPointer]);

  useFrame((_, delta) => {
    if (!autopilot.current.active) return;

    autopilot.current.elapsed += delta;
    const progress = clamp(autopilot.current.elapsed / autopilot.current.duration, 0, 1);
    const eased = easeOutCubic(progress);

    camera.position.lerpVectors(
      autopilot.current.startPosition,
      autopilot.current.targetPosition,
      eased,
    );
    camera.quaternion.slerpQuaternions(
      autopilot.current.startOrientation,
      autopilot.current.targetOrientation,
      eased,
    );

    if (progress >= 1) {
      camera.position.copy(autopilot.current.targetPosition);
      camera.quaternion.copy(autopilot.current.targetOrientation);
      autopilot.current.active = false;
    }
  });

  return null;
};

export default CameraDirector;
