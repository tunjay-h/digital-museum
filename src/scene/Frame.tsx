import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { SRGBColorSpace, Vector2 } from 'three';
import { Text, useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { FramePlacement } from '../types';
import { useMuseumStore } from '../store/useMuseumStore';

interface FrameProps {
  placement: FramePlacement;
  isHighlighted: boolean;
  onSelect: (id: string) => void;
  panelColor: string;
  isMobile: boolean;
}

const extractYear = (value?: string) => {
  if (!value) return undefined;
  const match = value.match(/\d{4}/);
  return match ? match[0] : value;
};

const Frame = ({ placement, isHighlighted, onSelect, panelColor, isMobile }: FrameProps) => {
  const { portrait, position, rotation, side } = placement;
  const { gl } = useThree();
  const portraitTexture = useTexture(portrait.image_src);
  const frameTexture = useTexture('/textures/frame_gilded.webp');
  const panelTexture = useTexture('/textures/mounting_panel.webp');
  const plaqueTexture = useTexture('/textures/plaque_base.webp');
  const [hovered, setHovered] = useState(false);
  const language = useMuseumStore((state) => state.language);

  portraitTexture.colorSpace = SRGBColorSpace;
  frameTexture.colorSpace = SRGBColorSpace;
  panelTexture.colorSpace = SRGBColorSpace;
  plaqueTexture.colorSpace = SRGBColorSpace;

  useEffect(() => {
    const maxAnisotropy = Math.min(12, gl.capabilities.getMaxAnisotropy());
    [portraitTexture, frameTexture, panelTexture, plaqueTexture].forEach((texture) => {
      texture.anisotropy = maxAnisotropy;
      texture.needsUpdate = true;
    });
    frameTexture.wrapS = frameTexture.wrapT = THREE.ClampToEdgeWrapping;
    panelTexture.wrapS = panelTexture.wrapT = THREE.ClampToEdgeWrapping;
    plaqueTexture.wrapS = plaqueTexture.wrapT = THREE.ClampToEdgeWrapping;
  }, [frameTexture, gl, panelTexture, plaqueTexture, portraitTexture]);

  const mountingTone = isHighlighted ? '#ceb394' : hovered ? '#c7ad8f' : panelColor;
  const labelName = language === 'az' ? portrait.name_az : portrait.name_en;

  const presentLabel = language === 'az' ? 'indiki' : 'present';
  const timeline = useMemo(() => {
    if (portrait.term_start && portrait.term_end) {
      const normalizedEnd = portrait.term_end.toLowerCase();
      const displayEnd = normalizedEnd === 'present' ? presentLabel : portrait.term_end;
      return `${portrait.term_start} – ${displayEnd}`;
    }

    if (portrait.birth && portrait.death) {
      const start = extractYear(portrait.birth);
      const end = extractYear(portrait.death);
      if (start && end) {
        return `${start} – ${end}`;
      }
    }

    return undefined;
  }, [portrait.birth, portrait.death, portrait.term_end, portrait.term_start, presentLabel]);

  const subtitle = portrait.role ?? timeline ?? '';
  const secondLine = timeline ?? subtitle;
  const plaqueText = secondLine ? `${labelName}\n${secondLine}` : labelName;

  const plaqueFontSize = useMemo(() => (isMobile ? 0.085 : 0.09), [isMobile]);
  const portraitNormalScale = useMemo(() => new Vector2(0.6, 0.6), []);

  return (
    <group
      position={position}
      rotation={rotation}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(portrait.person_id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 0, -0.045]}>
        <planeGeometry args={[1.4, 1.9]} />
        <meshStandardMaterial
          color={mountingTone}
          map={panelTexture}
          roughness={0.68}
          metalness={0.05}
        />
      </mesh>
      <mesh>
        <planeGeometry args={[1.35, 1.85]} />
        <meshStandardMaterial
          color={hovered || isHighlighted ? '#f0d49a' : '#c49452'}
          map={frameTexture}
          metalness={0.82}
          roughness={0.36}
          emissive="#fbe1a4"
          emissiveIntensity={hovered || isHighlighted ? 0.38 : 0.16}
        />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[1.12, 1.6]} />
        <meshStandardMaterial
          map={portraitTexture}
          roughness={0.52}
          metalness={0.02}
          normalScale={portraitNormalScale}
        />
      </mesh>
      {!isMobile && (
        <group position={[0, -1.12, 0.06]}>
          <mesh>
            <planeGeometry args={[0.95, 0.28]} />
            <meshStandardMaterial
              map={plaqueTexture}
              transparent
              opacity={0.92}
              roughness={0.45}
              metalness={0.18}
            />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            color="#f6ecdd"
            fontSize={plaqueFontSize}
            maxWidth={0.78}
            lineHeight={1.18}
            letterSpacing={0.04}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
          >
            {plaqueText}
          </Text>
        </group>
      )}
      <mesh position={[0, -1.4, 0]}>
        <planeGeometry args={[1.6, 0.02]} />
        <meshStandardMaterial
          color={side === 'center' ? '#ceb58b' : '#8c6a3d'}
          transparent
          opacity={0.55}
          roughness={0.4}
          metalness={0.18}
        />
      </mesh>
    </group>
  );
};

export default Frame;
