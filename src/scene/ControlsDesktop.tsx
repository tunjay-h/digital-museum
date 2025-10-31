import { useEffect, useRef } from 'react';
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
  const setPointerLockHandlers = useMuseumStore((state) => state.setPointerLockHandlers);
  const focusCandidateId = useMuseumStore((state) => state.focusCandidateId);
  const focusRef = useRef<string | null>(focusCandidateId);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const lookState = useRef<{
    active: boolean;
    pending: boolean;
    pointerId: number | null;
    lastX: number;
    lastY: number;
  }>({
    active: false,
    pending: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
  });

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
    yaw.current = camera.rotation.y;
    pitch.current = camera.rotation.x;
  }, [camera]);

  useEffect(() => {
    setPointerLockHandlers({ lock: null, unlock: null });
    return () => {
      setPointerLockHandlers({ lock: null, unlock: null });
    };
  }, [setPointerLockHandlers]);

  useEffect(() => {
    const canvas = document.getElementById('museum-canvas');
    if (!canvas) return;

    const detachGlobalHandlers = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      if (lookState.current.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - lookState.current.lastX;
      const deltaY = event.clientY - lookState.current.lastY;
      lookState.current.lastX = event.clientX;
      lookState.current.lastY = event.clientY;

      if (!lookState.current.active) {
        if (!lookState.current.pending) return;
        if (Math.abs(deltaX) < 2 && Math.abs(deltaY) < 2) {
          return;
        }
        lookState.current.active = true;
        lookState.current.pending = false;
      }

      const sensitivity = settings.lookSensitivity * 0.0022;
      yaw.current -= deltaX * sensitivity;
      pitch.current -= deltaY * sensitivity;
      pitch.current = clamp(pitch.current, -Math.PI / 2 + 0.2, Math.PI / 2 - 0.2);

      camera.rotation.set(pitch.current, yaw.current, 0);
    };

    const resetLookState = () => {
      lookState.current.active = false;
      lookState.current.pending = false;
      lookState.current.pointerId = null;
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      if (lookState.current.pointerId !== event.pointerId) return;
      detachGlobalHandlers();
      resetLookState();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      if (event.button !== 0) return;

      lookState.current.pointerId = event.pointerId;
      lookState.current.lastX = event.clientX;
      lookState.current.lastY = event.clientY;
      lookState.current.pending = true;
      lookState.current.active = false;

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    };

    canvas.addEventListener('pointerdown', handlePointerDown);

    return () => {
      detachGlobalHandlers();
      canvas.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [camera, settings.lookSensitivity]);

  useFrame((_, delta) => {
    if (!lookState.current.active) {
      yaw.current = camera.rotation.y;
      pitch.current = camera.rotation.x;
    } else {
      camera.rotation.set(pitch.current, yaw.current, 0);
    }

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

  return null;
};

export default ControlsDesktop;
