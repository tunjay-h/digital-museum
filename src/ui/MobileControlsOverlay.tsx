import type { PointerEvent as ReactPointerEvent } from 'react';
import { useRef } from 'react';
import { useMuseumStore } from '../store/useMuseumStore';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const MobileControlsOverlay = () => {
  const setMobileMove = useMuseumStore((state) => state.setMobileMove);
  const setMobileLook = useMuseumStore((state) => state.setMobileLook);
  const movePointerId = useRef<number | null>(null);
  const lookPointerId = useRef<number | null>(null);
  const moveOrigin = useRef({ x: 0, y: 0 });

  const handleMoveStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (movePointerId.current !== null) return;
    movePointerId.current = event.pointerId;
    moveOrigin.current = { x: event.clientX, y: event.clientY };
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    setMobileMove({ x: 0, y: 0 });
  };

  const handleMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (movePointerId.current !== event.pointerId) return;
    const dx = event.clientX - moveOrigin.current.x;
    const dy = event.clientY - moveOrigin.current.y;
    const radius = 70;
    const nx = clamp(dx / radius, -1, 1);
    const ny = clamp(dy / radius, -1, 1);
    setMobileMove({ x: nx, y: ny });
  };

  const handleMoveEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (movePointerId.current !== event.pointerId) return;
    movePointerId.current = null;
    setMobileMove({ x: 0, y: 0 });
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
  };

  const handleLookStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lookPointerId.current !== null) return;
    lookPointerId.current = event.pointerId;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handleLookMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lookPointerId.current !== event.pointerId) return;
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    setMobileLook({ x: movementX / 80, y: movementY / 80 });
  };

  const handleLookEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lookPointerId.current !== event.pointerId) return;
    lookPointerId.current = null;
    setMobileLook({ x: 0, y: 0 });
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
        onPointerDown={handleMoveStart}
        onPointerMove={handleMove}
        onPointerUp={handleMoveEnd}
        onPointerCancel={handleMoveEnd}
        style={{
          width: '40%',
          height: '100%',
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
      />
      <div
        onPointerDown={handleLookStart}
        onPointerMove={handleLookMove}
        onPointerUp={handleLookEnd}
        onPointerCancel={handleLookEnd}
        style={{
          width: '40%',
          height: '100%',
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
      />
    </div>
  );
};

export default MobileControlsOverlay;
