import { useEffect, useRef, useState } from 'react';
import { PointerLockControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useMuseumStore } from '../store/useMuseumStore';
import { CAMERA_EYE_HEIGHT, CORRIDOR_WIDTH, END_Z } from './constants';
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib';
import { createPortal } from 'react-dom';

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
  const controlsRef = useRef<PointerLockControlsImpl | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(() => ({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  }));

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

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleLock = () => {
      setIsPointerLocked(true);
      setCursorPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    };

    const handleUnlock = () => {
      setIsPointerLocked(false);
    };

    controls.addEventListener('lock', handleLock);
    controls.addEventListener('unlock', handleUnlock);

    return () => {
      controls.removeEventListener('lock', handleLock);
      controls.removeEventListener('unlock', handleUnlock);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isPointerLocked) {
        setCursorPosition((prev) => ({
          x: clamp(prev.x + event.movementX, 0, window.innerWidth),
          y: clamp(prev.y + event.movementY, 0, window.innerHeight),
        }));
      } else {
        setCursorPosition({ x: event.clientX, y: event.clientY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isPointerLocked]);

  useEffect(() => {
    if (!isPointerLocked) return;
    const handleResize = () => {
      setCursorPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isPointerLocked]);

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

  const cursorOverlay =
    isPointerLocked &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${cursorPosition.x}px`,
            top: `${cursorPosition.y}px`,
            transform: 'translate(-50%, -50%)',
            width: '18px',
            height: '18px',
            borderRadius: '999px',
            border: '2px solid rgba(232, 200, 140, 0.9)',
            background: 'rgba(232, 200, 140, 0.15)',
            boxShadow: '0 0 8px rgba(232, 200, 140, 0.45)',
          }}
        />
      </div>,
      document.body,
    );

  return (
    <>
      {cursorOverlay}
      <PointerLockControls
        ref={controlsRef}
        makeDefault
        selector="#museum-canvas"
        pointerSpeed={settings.lookSensitivity}
      />
    </>
  );
};

export default ControlsDesktop;
