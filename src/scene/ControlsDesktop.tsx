import { useEffect, useRef } from 'react';
import { PointerLockControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useMuseumStore } from '../store/useMuseumStore';
import { CAMERA_EYE_HEIGHT } from './constants';
import { clampToAtrium } from './clampToAtrium';
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib';

const ControlsDesktop = () => {
  const { camera } = useThree();
  const movement = useRef({ forward: false, backward: false, left: false, right: false, sprint: false });
  const velocity = useRef(new Vector3());
  const bobPhase = useRef(0);
  const settings = useMuseumStore((state) => state.settings);
  const openInfoPanel = useMuseumStore((state) => state.openInfoPanel);
  const setPointerLockHandlers = useMuseumStore((state) => state.setPointerLockHandlers);
  const focusCandidateId = useMuseumStore((state) => state.focusCandidateId);
  const focusRef = useRef<string | null>(focusCandidateId);
  const controlsRef = useRef<PointerLockControlsImpl | null>(null);

  useEffect(() => {
    focusRef.current = focusCandidateId;
  }, [focusCandidateId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          movement.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          movement.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          movement.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          movement.current.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          movement.current.sprint = true;
          break;
        case 'KeyF':
          if (focusRef.current) {
            openInfoPanel(focusRef.current);
          }
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          movement.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          movement.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          movement.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          movement.current.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          movement.current.sprint = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [openInfoPanel]);

  useEffect(() => {
    camera.position.set(0, CAMERA_EYE_HEIGHT, 2.8);
    camera.rotation.set(0, 0, 0);
  }, [camera]);

  useEffect(() => {
    setPointerLockHandlers({
      lock: () => controlsRef.current?.lock(),
      unlock: () => controlsRef.current?.unlock(),
    });
    return () => {
      setPointerLockHandlers({ lock: null, unlock: null });
    };
  }, [setPointerLockHandlers]);

  useFrame((_, delta) => {
    const speed = movement.current.sprint ? 20 : 15;
    const acceleration = speed * delta * 2.6;
    const damping = Math.pow(0.88, delta * 60);

    const direction = new Vector3();
    if (movement.current.forward) direction.z -= 1;
    if (movement.current.backward) direction.z += 1;
    if (movement.current.left) direction.x -= 1;
    if (movement.current.right) direction.x += 1;

    if (direction.lengthSq() > 0) {
      direction.normalize();
      direction.applyQuaternion(camera.quaternion);
      velocity.current.addScaledVector(direction, acceleration);
    }

    velocity.current.multiplyScalar(damping);

    camera.position.addScaledVector(velocity.current, delta);

    clampToAtrium(camera.position);
    camera.position.y = CAMERA_EYE_HEIGHT;

    const moving = velocity.current.lengthSq() > 0.0004;
    if (settings.cameraBob && moving) {
      bobPhase.current += delta * 6;
      camera.position.y = CAMERA_EYE_HEIGHT + Math.sin(bobPhase.current) * 0.04;
    } else {
      bobPhase.current = 0;
      camera.position.y = CAMERA_EYE_HEIGHT;
    }
  });

  return (
    <PointerLockControls
      ref={controlsRef}
      makeDefault
      selector="#museum-canvas"
      pointerSpeed={settings.lookSensitivity}
    />
  );
};

export default ControlsDesktop;
