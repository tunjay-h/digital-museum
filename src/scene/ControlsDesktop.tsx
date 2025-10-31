import { useCallback, useEffect, useRef, useState } from 'react';
import { PointerLockControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useMuseumStore } from '../store/useMuseumStore';
import { CAMERA_EYE_HEIGHT, CORRIDOR_WIDTH, END_Z } from './constants';
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib';

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
  const cursorOverlayRef = useRef<HTMLDivElement | null>(null);
  const cursorDotRef = useRef<HTMLDivElement | null>(null);
  const cursorPositionRef = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  });

  const applyCursorPosition = useCallback(() => {
    const cursor = cursorDotRef.current;
    if (!cursor) return;
    const { x, y } = cursorPositionRef.current;
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
  }, []);

  const setCursorPosition = useCallback(
    (x: number, y: number) => {
      cursorPositionRef.current.x = clamp(x, 0, window.innerWidth);
      cursorPositionRef.current.y = clamp(y, 0, window.innerHeight);
      applyCursorPosition();
    },
    [applyCursorPosition],
  );

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
      setCursorPosition(window.innerWidth / 2, window.innerHeight / 2);
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
  }, [setCursorPosition]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'none';

    const cursor = document.createElement('div');
    cursor.style.position = 'absolute';
    cursor.style.width = '18px';
    cursor.style.height = '18px';
    cursor.style.borderRadius = '999px';
    cursor.style.border = '2px solid rgba(232, 200, 140, 0.9)';
    cursor.style.background = 'rgba(232, 200, 140, 0.15)';
    cursor.style.boxShadow = '0 0 8px rgba(232, 200, 140, 0.45)';
    cursor.style.transform = 'translate(-50%, -50%)';

    overlay.appendChild(cursor);
    document.body.appendChild(overlay);

    cursorOverlayRef.current = overlay;
    cursorDotRef.current = cursor;
    setCursorPosition(window.innerWidth / 2, window.innerHeight / 2);

    return () => {
      cursorOverlayRef.current = null;
      cursorDotRef.current = null;
      overlay.remove();
    };
  }, [setCursorPosition]);

  useEffect(() => {
    const overlay = cursorOverlayRef.current;
    if (!overlay) return;
    overlay.style.display = isPointerLocked ? 'block' : 'none';
  }, [isPointerLocked]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isPointerLocked) {
        setCursorPosition(
          cursorPositionRef.current.x + event.movementX,
          cursorPositionRef.current.y + event.movementY,
        );
      } else {
        setCursorPosition(event.clientX, event.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isPointerLocked, setCursorPosition]);

  useEffect(() => {
    if (!isPointerLocked) return;
    const handleResize = () => {
      setCursorPosition(window.innerWidth / 2, window.innerHeight / 2);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isPointerLocked, setCursorPosition]);

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
