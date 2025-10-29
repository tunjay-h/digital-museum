import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { usePlacements } from './PlacementsContext';
import { useMuseumStore } from '../store/useMuseumStore';
import { CAMERA_EYE_HEIGHT, CORRIDOR_WIDTH, END_Z } from './constants';
import type { FramePlacement } from '../types';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const up = new Vector3(0, 1, 0);

const buildTargetPose = (placement: FramePlacement) => {
  const [frameX, frameY, frameZ] = placement.position;
  const lateralOffset = placement.side === 'left' ? 1.05 : placement.side === 'right' ? -1.05 : 0;
  const depthOffset = placement.side === 'end' ? 1.4 : 0.75;

  const position = new Vector3(
    clamp(frameX + lateralOffset, -CORRIDOR_WIDTH / 2 + 0.6, CORRIDOR_WIDTH / 2 - 0.6),
    CAMERA_EYE_HEIGHT,
    clamp(frameZ + depthOffset, END_Z - 2, 4),
  );

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

    const placement = placements.find((entry) => entry.president.person_id === selectedPortraitId);
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
