import { useEffect, useRef } from 'react';
import { PointerLockControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useMuseumStore } from '../store/useMuseumStore';
import { CAMERA_EYE_HEIGHT, CORRIDOR_WIDTH, END_Z } from './constants';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const ControlsDesktop = () => {
  const { camera } = useThree();
  const movement = useRef({ forward: false, backward: false, left: false, right: false, sprint: false });
  const velocity = useRef(new Vector3());
  const bobPhase = useRef(0);
  const settings = useMuseumStore((state) => state.settings);
  const openInfoPanel = useMuseumStore((state) => state.openInfoPanel);
  const toggleHelp = useMuseumStore((state) => state.toggleHelp);
  const focusCandidateId = useMuseumStore((state) => state.focusCandidateId);
  const focusRef = useRef<string | null>(focusCandidateId);

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
        case 'Slash':
          if (event.shiftKey) {
            toggleHelp(true);
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
  }, [openInfoPanel, toggleHelp]);

  useEffect(() => {
    camera.position.set(0, CAMERA_EYE_HEIGHT, 2.8);
  }, [camera]);

  useFrame((_, delta) => {
    const speed = movement.current.sprint ? 3.2 : 1.8;
    const acceleration = speed * delta * 2.4;
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

    const minX = -CORRIDOR_WIDTH / 2 + 0.6;
    const maxX = CORRIDOR_WIDTH / 2 - 0.6;
    const maxZ = 4;
    const minZ = END_Z - 2;

    camera.position.set(
      clamp(camera.position.x, minX, maxX),
      CAMERA_EYE_HEIGHT,
      clamp(camera.position.z, minZ, maxZ),
    );

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
      makeDefault
      selector="#root"
      pointerSpeed={settings.lookSensitivity}
    />
  );
};

export default ControlsDesktop;
