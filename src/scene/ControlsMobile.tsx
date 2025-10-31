import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useMuseumStore } from '../store/useMuseumStore';
import { CAMERA_EYE_HEIGHT, CORRIDOR_WIDTH, END_Z } from './constants';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const ControlsMobile = () => {
  const { camera } = useThree();
  const settings = useMuseumStore((state) => state.settings);
  const mobileMove = useMuseumStore((state) => state.mobileMove);
  const mobileLook = useMuseumStore((state) => state.mobileLook);
  const bobPhase = useRef(0);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const forward = useRef(new Vector3());
  const right = useRef(new Vector3());
  const yawBase = useRef(0);
  const lookWasActive = useRef(false);

  useEffect(() => {
    camera.position.set(0, CAMERA_EYE_HEIGHT, 2.8);
    yaw.current = camera.rotation.y;
    pitch.current = camera.rotation.x;
    yawBase.current = camera.rotation.y;
  }, [camera]);

  useFrame((_, delta) => {
    const sensitivity = settings.lookSensitivity * 1.2;
    const lookMagnitude = Math.sqrt(mobileLook.x * mobileLook.x + mobileLook.y * mobileLook.y);
    const lookActive = lookMagnitude > 0.02;

    if (lookActive && !lookWasActive.current) {
      yawBase.current = yaw.current;
    }

    if (!lookActive) {
      yawBase.current = yaw.current;
    }

    const maxYawOffset = Math.PI / 2;
    const targetYaw = clamp(
      yawBase.current + mobileLook.x * maxYawOffset,
      yawBase.current - maxYawOffset,
      yawBase.current + maxYawOffset,
    );
    const yawStepLimit = sensitivity * delta * 2.2 * Math.max(Math.abs(mobileLook.x), 0.3);
    const yawDelta = targetYaw - yaw.current;
    if (Math.abs(yawDelta) > 0.0001) {
      const step = clamp(yawDelta, -yawStepLimit, yawStepLimit);
      yaw.current += step;
    }

    pitch.current -= mobileLook.y * sensitivity * delta * 1.6;
    pitch.current = clamp(pitch.current, -Math.PI / 2 + 0.2, Math.PI / 2 - 0.2);

    lookWasActive.current = lookActive;

    camera.rotation.set(pitch.current, yaw.current, 0);

    forward.current.set(Math.sin(yaw.current), 0, Math.cos(yaw.current)).normalize();
    right.current
      .set(Math.sin(yaw.current + Math.PI / 2), 0, Math.cos(yaw.current + Math.PI / 2))
      .normalize();

    const forwardSpeed = 3.6 + Math.abs(mobileMove.y) * 1.2;
    const strafeSpeed = 3.2 + Math.abs(mobileMove.x) * 0.8;
    camera.position.addScaledVector(forward.current, -mobileMove.y * forwardSpeed * delta);
    camera.position.addScaledVector(right.current, mobileMove.x * strafeSpeed * delta);

    const minX = -CORRIDOR_WIDTH / 2 + 0.6;
    const maxX = CORRIDOR_WIDTH / 2 - 0.6;
    const maxZ = 4;
    const minZ = END_Z - 2;

    camera.position.set(
      clamp(camera.position.x, minX, maxX),
      CAMERA_EYE_HEIGHT,
      clamp(camera.position.z, minZ, maxZ),
    );

    const moving = Math.abs(mobileMove.x) > 0.01 || Math.abs(mobileMove.y) > 0.01;
    if (settings.cameraBob && moving) {
      bobPhase.current += delta * 6;
      camera.position.y = CAMERA_EYE_HEIGHT + Math.sin(bobPhase.current) * 0.035;
    } else {
      bobPhase.current = 0;
      camera.position.y = CAMERA_EYE_HEIGHT;
    }

  });

  return null;
};

export default ControlsMobile;
