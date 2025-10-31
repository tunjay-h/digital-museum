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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lookMode = useRef<'free' | 'locked'>('free');
  const pointerLockActive = useRef(false);
  const freeLook = useRef({
    inside: false,
    offsetX: 0,
    offsetY: 0,
    edgeYaw: 0,
  });
  const crosshairRef = useRef<HTMLDivElement | null>(null);
  const lookSensitivityRef = useRef(settings.lookSensitivity);

  useEffect(() => {
    lookSensitivityRef.current = settings.lookSensitivity;
  }, [settings.lookSensitivity]);

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
        case 'KeyL':
          {
            const canvas = canvasRef.current;
            if (!canvas) break;

            if (document.pointerLockElement === canvas) {
              document.exitPointerLock();
            } else {
              canvas.requestPointerLock();
            }
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
    const canvas = document.getElementById('museum-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    canvasRef.current = canvas;

    const createCrosshair = () => {
      const element = document.createElement('div');
      element.style.position = 'fixed';
      element.style.top = '50%';
      element.style.left = '50%';
      element.style.width = '18px';
      element.style.height = '18px';
      element.style.marginLeft = '-9px';
      element.style.marginTop = '-9px';
      element.style.borderRadius = '999px';
      element.style.border = '1px solid rgba(255,255,255,0.75)';
      element.style.boxShadow = '0 0 10px rgba(228, 181, 100, 0.65)';
      element.style.opacity = '0.85';
      element.style.pointerEvents = 'none';
      element.style.zIndex = '1200';
      element.style.display = 'none';
      document.body.appendChild(element);
      crosshairRef.current = element;
    };

    createCrosshair();

    const applyPointerLockState = (active: boolean) => {
      pointerLockActive.current = active;
      lookMode.current = active ? 'locked' : 'free';

      if (active) {
        canvas.style.cursor = 'none';
        freeLook.current.inside = false;
        freeLook.current.offsetX = 0;
        freeLook.current.offsetY = 0;
        freeLook.current.edgeYaw = 0;
        if (crosshairRef.current) {
          crosshairRef.current.style.display = 'block';
        }
      } else {
        canvas.style.cursor = 'default';
        if (crosshairRef.current) {
          crosshairRef.current.style.display = 'none';
        }
      }
    };

    const handlePointerLockChange = () => {
      applyPointerLockState(document.pointerLockElement === canvas);
    };

    const handlePointerLockError = () => {
      applyPointerLockState(false);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;

      if (pointerLockActive.current) {
        const sensitivity = lookSensitivityRef.current * 0.0022;
        yaw.current -= event.movementX * sensitivity;
        pitch.current -= event.movementY * sensitivity;
        pitch.current = clamp(pitch.current, -Math.PI / 2 + 0.2, Math.PI / 2 - 0.2);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      freeLook.current.inside = inside;

      if (!inside) {
        freeLook.current.offsetX = 0;
        freeLook.current.offsetY = 0;
        freeLook.current.edgeYaw = 0;
        return;
      }

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const normalizedX = clamp((event.clientX - centerX) / (rect.width / 2), -1, 1);
      const normalizedY = clamp((event.clientY - centerY) / (rect.height / 2), -1, 1);

      freeLook.current.offsetX = normalizedX;
      freeLook.current.offsetY = normalizedY;

      const edgeThreshold = 32;
      const distanceLeft = event.clientX - rect.left;
      const distanceRight = rect.right - event.clientX;
      if (distanceLeft <= edgeThreshold) {
        freeLook.current.edgeYaw = 1;
      } else if (distanceRight <= edgeThreshold) {
        freeLook.current.edgeYaw = -1;
      } else {
        freeLook.current.edgeYaw = 0;
      }
    };

    const handlePointerLeave = () => {
      if (pointerLockActive.current) return;
      freeLook.current.inside = false;
      freeLook.current.offsetX = 0;
      freeLook.current.offsetY = 0;
      freeLook.current.edgeYaw = 0;
    };

    const handleWindowBlur = () => {
      if (pointerLockActive.current) {
        document.exitPointerLock();
      }
      freeLook.current.inside = false;
      freeLook.current.offsetX = 0;
      freeLook.current.offsetY = 0;
      freeLook.current.edgeYaw = 0;
    };

    const requestLock = () => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      }
    };

    const exitLock = () => {
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
    };

    applyPointerLockState(document.pointerLockElement === canvas);
    setPointerLockHandlers({ lock: requestLock, unlock: exitLock });

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);
    window.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
      window.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('blur', handleWindowBlur);
      setPointerLockHandlers({ lock: null, unlock: null });
      if (crosshairRef.current) {
        document.body.removeChild(crosshairRef.current);
        crosshairRef.current = null;
      }
      canvas.style.cursor = 'default';
    };
  }, [setPointerLockHandlers]);

  useFrame((_, delta) => {
    if (lookMode.current === 'free') {
      if (freeLook.current.inside) {
        const yawSpeed = freeLook.current.offsetX * settings.lookSensitivity * 1.8;
        const pitchSpeed = freeLook.current.offsetY * settings.lookSensitivity * 1.4;
        yaw.current -= yawSpeed * delta;
        pitch.current -= pitchSpeed * delta;
      }

      if (freeLook.current.edgeYaw !== 0) {
        const edgeSpeed = settings.lookSensitivity * 0.75;
        yaw.current += freeLook.current.edgeYaw * edgeSpeed * delta;
      }
    }

    pitch.current = clamp(pitch.current, -Math.PI / 2 + 0.2, Math.PI / 2 - 0.2);
    camera.rotation.set(pitch.current, yaw.current, 0);

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
