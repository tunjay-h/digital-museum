import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useMuseumStore } from '../store/useMuseumStore';
import { CAMERA_EYE_HEIGHT } from './constants';
import { clampToAtrium } from './clampToAtrium';

const clampAngle = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

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

  useEffect(() => {
    camera.position.set(0, CAMERA_EYE_HEIGHT, 2.8);
    yaw.current = camera.rotation.y;
    pitch.current = camera.rotation.x;
  }, [camera]);

  useFrame((_, delta) => {
    const sensitivity = settings.lookSensitivity * 1.2;
    yaw.current -= mobileLook.x * sensitivity * delta * 2.2;
    pitch.current -= mobileLook.y * sensitivity * delta * 1.6;
    pitch.current = clampAngle(pitch.current, -Math.PI / 2 + 0.2, Math.PI / 2 - 0.2);

    camera.rotation.set(pitch.current, yaw.current, 0);

    forward.current.set(Math.sin(yaw.current), 0, Math.cos(yaw.current)).normalize();
    right.current
      .set(Math.sin(yaw.current + Math.PI / 2), 0, Math.cos(yaw.current + Math.PI / 2))
      .normalize();

    const forwardSpeed = 3.6 + Math.abs(mobileMove.y) * 1.2;
    const strafeSpeed = 3.2 + Math.abs(mobileMove.x) * 0.8;
    camera.position.addScaledVector(forward.current, -mobileMove.y * forwardSpeed * delta);
    camera.position.addScaledVector(right.current, mobileMove.x * strafeSpeed * delta);

    clampToAtrium(camera.position);
    camera.position.y = CAMERA_EYE_HEIGHT;

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
