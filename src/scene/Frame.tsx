import { useMemo, useState } from 'react';
import { MeshBasicMaterial } from 'three';
import { Html, useTexture } from '@react-three/drei';
import type { FramePlacement } from '../types';

interface FrameProps {
  placement: FramePlacement;
  isHighlighted: boolean;
  onSelect: (id: string) => void;
}

const Frame = ({ placement, isHighlighted, onSelect }: FrameProps) => {
  const { president, position, rotation, side } = placement;
  const portraitTexture = useTexture(president.image_src);
  const [hovered, setHovered] = useState(false);

  const frameMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: hovered || isHighlighted ? '#d4a35f' : '#7a5b36',
    });
    material.needsUpdate = true;
    return material;
  }, [hovered, isHighlighted]);

  const glow = isHighlighted ? 0.24 : hovered ? 0.16 : 0.08;

  return (
    <group
      position={position}
      rotation={rotation}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(president.person_id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[1.32, 1.72]} />
        <meshBasicMaterial
          color={`rgba(0, 0, 0, ${0.45 + glow})`}
          transparent
        />
      </mesh>
      <mesh>
        <planeGeometry args={[1.35, 1.85]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[1.12, 1.6]} />
        <meshBasicMaterial map={portraitTexture} />
      </mesh>
      <Html
        position={[0, -1.1, 0]}
        center
        distanceFactor={5}
        zIndexRange={[1, 10]}
      >
        <div
          className="hud-panel"
          style={{
            padding: '0.4rem 0.8rem',
            fontSize: '0.75rem',
            opacity: isHighlighted || hovered ? 1 : 0.75,
            transition: 'opacity 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          {president.name_en}
        </div>
      </Html>
      <mesh position={[0, -1.4, 0]}>
        <planeGeometry args={[1.6, 0.02]} />
        <meshBasicMaterial
          color={side === 'end' ? '#bca371' : '#7a5b36'}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
};

export default Frame;
