import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Vector3 } from 'three';
import { useMuseumStore } from '../store/useMuseumStore';
import { CAMERA_EYE_HEIGHT, CORRIDOR_WIDTH, END_Z } from './constants';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const ControlsMobile = () => {
  const { camera } = useThree();
  const settings = useMuseumStore((state) => state.settings);
  const mobileMove = useMuseumStore((state) => state.mobileMove);
  const mobileLook = useMuseumStore((state) => state.mobileLook);
  const setMobileLook = useMuseumStore((state) => state.setMobileLook);
  const bobPhase = useRef(0);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const forward = useRef(new Vector3());
  const right = useRef(new Vector3());

  useEffect(() => {
    camera.position.set(0, CAMERA_EYE_HEIGHT, 2.8);
    yaw.current = camera.rotation.y;
    pitch.current = camera.rotation.x;
  }, [camera]);

  useFrame((_, delta) => {
    const sensitivity = settings.lookSensitivity * 1.2;
    const yawRateLimit = Math.PI; // ~180deg/s
    const lookScale = 8;

    const yawRate = clamp(mobileLook.x * sensitivity * lookScale, -yawRateLimit, yawRateLimit);
    const pitchRate = mobileLook.y * sensitivity * lookScale;

    yaw.current -= yawRate * delta;
    pitch.current -= pitchRate * delta;
    pitch.current = clamp(
      pitch.current,
      MathUtils.degToRad(-60),
      MathUtils.degToRad(45),
    );

    if (mobileLook.x !== 0 || mobileLook.y !== 0) {
      setMobileLook({ x: 0, y: 0 });
    }

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
