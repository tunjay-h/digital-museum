import type { PointerEvent as ReactPointerEvent } from 'react';
import { useRef, useState } from 'react';
import { useMuseumStore } from '../store/useMuseumStore';

const MOVE_RADIUS = 70;
const LOOK_RADIUS = 60;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const MobileControlsOverlay = () => {
  const setMobileMove = useMuseumStore((state) => state.setMobileMove);
  const setMobileLook = useMuseumStore((state) => state.setMobileLook);
  const toggleOverlay = useMuseumStore((state) => state.toggleOverlay);
  const movePointerId = useRef<number | null>(null);
  const lookPointerId = useRef<number | null>(null);
  const moveOrigin = useRef({ x: 0, y: 0 });
  const [moveVisual, setMoveVisual] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [lookVisual, setLookVisual] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [moveActive, setMoveActive] = useState(false);
  const [lookActive, setLookActive] = useState(false);

  const handleMoveStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (movePointerId.current !== null) return;
    movePointerId.current = event.pointerId;
    moveOrigin.current = { x: event.clientX, y: event.clientY };
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    setMobileMove({ x: 0, y: 0 });
    setMoveVisual({ x: 0, y: 0 });
    setMoveActive(true);
  };

  const handleMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (movePointerId.current !== event.pointerId) return;
    const dx = event.clientX - moveOrigin.current.x;
    const dy = event.clientY - moveOrigin.current.y;
    const nx = clamp(dx / MOVE_RADIUS, -1, 1);
    const ny = clamp(dy / MOVE_RADIUS, -1, 1);
    setMoveVisual({ x: nx, y: ny });
    setMobileMove({ x: nx, y: -ny });
  };

  const handleMoveEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (movePointerId.current !== event.pointerId) return;
    movePointerId.current = null;
    setMobileMove({ x: 0, y: 0 });
    setMoveVisual({ x: 0, y: 0 });
    setMoveActive(false);
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
  };

  const applyLookDelta = (x: number, y: number) => {
    const current = useMuseumStore.getState().mobileLook;

    if (x === 0 && y === 0) {
      if (current.x !== 0 || current.y !== 0) {
        setMobileLook({ x: 0, y: 0 });
      }
      return;
    }

    setMobileLook({ x: current.x + x, y: current.y + y });
  };

  const handleLookStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lookPointerId.current !== null) return;
    lookPointerId.current = event.pointerId;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    setLookVisual({ x: 0, y: 0 });
    setLookActive(true);
  };

  const curve = (value: number) =>
    Math.sign(value) * Math.pow(Math.abs(value) * 0.0015, 0.85);

  const handleLookMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lookPointerId.current !== event.pointerId) return;

    if (event.pressure === 0) {
      applyLookDelta(0, 0);
      setLookActive(false);
      setLookVisual({ x: 0, y: 0 });
      return;
    }

    const movementX = event.movementX ?? 0;
    const movementY = event.movementY ?? 0;
    const deltaX = curve(movementX);
    const deltaY = curve(movementY);

    applyLookDelta(deltaX, deltaY);
    setLookVisual((prev) => {
      const nextX = clamp(prev.x + deltaX * 8, -1, 1);
      const nextY = clamp(prev.y + deltaY * 8, -1, 1);
      return { x: nextX, y: nextY };
    });
  };

  const handleLookEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lookPointerId.current !== event.pointerId) return;
    lookPointerId.current = null;
    applyLookDelta(0, 0);
    setLookVisual({ x: 0, y: 0 });
    setLookActive(false);
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        justifyContent: 'space-between',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '50%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
          padding: '0 0 1.75rem 1.5rem',
          pointerEvents: 'none',
        }}
      >
        <div
          onPointerDown={handleMoveStart}
          onPointerMove={handleMove}
          onPointerUp={handleMoveEnd}
          onPointerCancel={handleMoveEnd}
          style={{
            position: 'relative',
            width: `${MOVE_RADIUS * 2}px`,
            height: `${MOVE_RADIUS * 2}px`,
            borderRadius: '999px',
            background: moveActive
              ? 'rgba(255,255,255,0.12)'
              : 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.18)',
            pointerEvents: 'auto',
            touchAction: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '56px',
              height: '56px',
              borderRadius: '999px',
              background: 'rgba(228, 181, 100, 0.55)',
              transform: `translate(calc(-50% + ${moveVisual.x * (MOVE_RADIUS - 28)}px), calc(-50% + ${
                moveVisual.y * (MOVE_RADIUS - 28)
              }px))`,
              transition: moveActive ? 'none' : 'transform 0.18s ease-out',
              boxShadow: '0 0 14px rgba(228, 181, 100, 0.45)',
            }}
          />
        </div>
      </div>
      <div
        style={{
          width: '50%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          padding: '0 1.5rem 1.75rem 0',
          pointerEvents: 'none',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={() => toggleOverlay(true)}
          style={{
            position: 'absolute',
            right: '1.5rem',
            bottom: `${LOOK_RADIUS * 2 + 48}px`,
            width: '54px',
            height: '54px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.22)',
            background: 'rgba(12,12,12,0.7)',
            color: '#f4f3ef',
            fontSize: '1.35rem',
            fontWeight: 600,
            pointerEvents: 'auto',
          }}
          aria-label="Open help and settings"
        >
          H
        </button>
        <div
          onPointerDown={handleLookStart}
          onPointerMove={handleLookMove}
          onPointerUp={handleLookEnd}
          onPointerCancel={handleLookEnd}
          style={{
            position: 'relative',
            width: `${LOOK_RADIUS * 2}px`,
            height: `${LOOK_RADIUS * 2}px`,
            borderRadius: '999px',
            background: lookActive
              ? 'rgba(255,255,255,0.12)'
              : 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.18)',
            pointerEvents: 'auto',
            touchAction: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '48px',
              height: '48px',
              borderRadius: '999px',
              background: 'rgba(228, 181, 100, 0.4)',
              transform: `translate(calc(-50% + ${lookVisual.x * (LOOK_RADIUS - 24)}px), calc(-50% + ${
                lookVisual.y * (LOOK_RADIUS - 24)
              }px))`,
              transition: lookActive ? 'none' : 'transform 0.18s ease-out',
              boxShadow: '0 0 12px rgba(228, 181, 100, 0.35)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MobileControlsOverlay;
