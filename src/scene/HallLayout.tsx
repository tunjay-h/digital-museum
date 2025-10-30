import { useEffect, useMemo, useState, type DependencyList } from 'react';
import * as THREE from 'three';
import { useMuseumStore } from '../store/useMuseumStore';
import { useHallTextures } from './useHallTextures';
import { CORRIDOR_WIDTH, END_Z, FRAME_SPACING, START_Z } from './constants';
import Frame from './Frame';
import { usePlacements } from './PlacementsContext';

interface HallLayoutProps {
  isMobile: boolean;
}

const WALL_LOWER_HEIGHT = 1.85;
const WALL_TOTAL_HEIGHT = 4.4;
const TRIM_HEIGHT = 0.12;
const COLUMN_WIDTH = 0.36;

const assignUv2 = (geometry: THREE.BufferGeometry | null) => {
  if (!geometry) return;
  const uvAttribute = geometry.attributes.uv as THREE.BufferAttribute | undefined;
  if (!uvAttribute) return;
  if (!geometry.attributes.uv2) {
    const uv2 = new Float32Array(uvAttribute.array);
    geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(uv2, 2));
  }
};

const useConfiguredTexture = (
  texture: THREE.Texture | null | undefined,
  configure: (tex: THREE.Texture) => void,
  deps: DependencyList = [],
) => {
  const configured = useMemo(() => {
    if (!texture) return null;
    const clone = texture.clone();
    configure(clone);
    clone.needsUpdate = true;
    return clone;
  }, [texture, ...deps]);

  useEffect(() => () => configured?.dispose(), [configured]);

  return configured;
};

const HallLayout = ({ isMobile }: HallLayoutProps) => {
  const placements = usePlacements();
  const highlightedId = useMuseumStore((state) =>
    state.focusCandidateId ?? state.selectedPortraitId ?? null,
  );
  const openInfoPanel = useMuseumStore((state) => state.openInfoPanel);
  const { floor, trimTexture, columnTexture, archTexture, skylightTexture, wallLower, wallUpper, ceiling, panelColor } =
    useHallTextures();

  const hallLength = Math.abs(END_Z) + 6;
  const floorLength = hallLength + 8;

  const sideTrimTexture = useConfiguredTexture(
    trimTexture,
    (tex) => {
      tex.repeat.set(floorLength / 2.4, 1);
      tex.wrapS = THREE.RepeatWrapping;
    },
    [floorLength],
  );

  const endTrimTexture = useConfiguredTexture(
    trimTexture,
    (tex) => {
      tex.repeat.set(CORRIDOR_WIDTH / 0.32, 1);
      tex.wrapS = THREE.RepeatWrapping;
    },
    [],
  );

  const skylightBandTexture = useConfiguredTexture(
    skylightTexture,
    (tex) => {
      tex.repeat.set(1, floorLength / 3.2);
    },
    [floorLength],
  );

  const archPositions = useMemo(() => {
    const positions: number[] = [];
    for (let z = START_Z - 0.6; z > END_Z - 1.2; z -= FRAME_SPACING) {
      positions.push(z);
    }
    return positions;
  }, []);

  const [skylightEmissive, setSkylightEmissive] = useState(0.3);

  useEffect(() => {
    setSkylightEmissive(isMobile ? 0.24 : 0.35);
  }, [isMobile]);

  const floorNormalScale = useMemo(() => new THREE.Vector2(0.7, 0.7), []);
  const wallNormalScale = useMemo(() => new THREE.Vector2(0.4, 0.4), []);
  const ceilingNormalScale = useMemo(() => new THREE.Vector2(0.22, 0.22), []);

  return (
    <group>
      <mesh position={[0, 0, -hallLength / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[CORRIDOR_WIDTH, floorLength]} onUpdate={assignUv2} />
        <meshStandardMaterial
          color="#f2d4a1"
          map={floor.baseColor ?? undefined}
          normalMap={floor.normal ?? undefined}
          roughnessMap={floor.roughness ?? undefined}
          aoMap={floor.ao ?? undefined}
          aoMapIntensity={0.75}
          metalness={0.05}
          roughness={0.62}
          normalScale={floorNormalScale}
        />
      </mesh>

      {/* Side walls */}
      {(['left', 'right'] as const).map((side) => {
        const isLeft = side === 'left';
        const rotationY = isLeft ? Math.PI / 2 : -Math.PI / 2;
        const xPosition = isLeft ? -CORRIDOR_WIDTH / 2 : CORRIDOR_WIDTH / 2;
        return (
          <group key={side} position={[xPosition, 0, -hallLength / 2]} rotation={[0, rotationY, 0]}>
            <mesh position={[0, WALL_LOWER_HEIGHT / 2, 0]} castShadow receiveShadow>
              <planeGeometry args={[floorLength, WALL_LOWER_HEIGHT]} onUpdate={assignUv2} />
              <meshStandardMaterial
                side={THREE.DoubleSide}
                color="#f0d6be"
                map={wallLower.baseColor ?? undefined}
                normalMap={wallLower.normal ?? undefined}
                roughnessMap={wallLower.roughness ?? undefined}
                normalScale={wallNormalScale}
                roughness={0.9}
                metalness={0.02}
              />
            </mesh>
            <mesh
              position={[0, WALL_LOWER_HEIGHT + (WALL_TOTAL_HEIGHT - WALL_LOWER_HEIGHT) / 2, 0]}
            >
              <planeGeometry args={[floorLength, WALL_TOTAL_HEIGHT - WALL_LOWER_HEIGHT]} onUpdate={assignUv2} />
              <meshStandardMaterial
                side={THREE.DoubleSide}
                color="#f7efe1"
                map={wallUpper.baseColor ?? undefined}
                normalMap={wallUpper.normal ?? undefined}
                roughnessMap={wallUpper.roughness ?? undefined}
                normalScale={wallNormalScale}
                roughness={0.92}
                metalness={0.01}
              />
            </mesh>
            {sideTrimTexture && (
              <mesh position={[0, WALL_LOWER_HEIGHT, 0]}>
                <planeGeometry args={[floorLength, TRIM_HEIGHT]} />
                <meshStandardMaterial
                  map={sideTrimTexture}
                  transparent
                  opacity={0.98}
                  side={THREE.DoubleSide}
                  roughness={0.35}
                  metalness={0.15}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* End wall */}
      <group position={[0, 0, END_Z - 1.6]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, WALL_LOWER_HEIGHT / 2, 0]} receiveShadow>
          <planeGeometry args={[CORRIDOR_WIDTH, WALL_LOWER_HEIGHT]} onUpdate={assignUv2} />
          <meshStandardMaterial
            side={THREE.DoubleSide}
            color="#f0d6be"
            map={wallLower.baseColor ?? undefined}
            normalMap={wallLower.normal ?? undefined}
            roughnessMap={wallLower.roughness ?? undefined}
            normalScale={wallNormalScale}
            roughness={0.9}
            metalness={0.02}
          />
        </mesh>
        <mesh position={[0, WALL_LOWER_HEIGHT + (WALL_TOTAL_HEIGHT - WALL_LOWER_HEIGHT) / 2, 0]}>
          <planeGeometry args={[CORRIDOR_WIDTH, WALL_TOTAL_HEIGHT - WALL_LOWER_HEIGHT]} onUpdate={assignUv2} />
          <meshStandardMaterial
            side={THREE.DoubleSide}
            color="#f7efe1"
            map={wallUpper.baseColor ?? undefined}
            normalMap={wallUpper.normal ?? undefined}
            roughnessMap={wallUpper.roughness ?? undefined}
            normalScale={wallNormalScale}
            roughness={0.92}
            metalness={0.01}
          />
        </mesh>
        {endTrimTexture && (
          <mesh position={[0, WALL_LOWER_HEIGHT, 0]}>
            <planeGeometry args={[CORRIDOR_WIDTH, TRIM_HEIGHT]} />
            <meshStandardMaterial
              map={endTrimTexture}
              transparent
              opacity={0.98}
              side={THREE.DoubleSide}
              roughness={0.35}
              metalness={0.15}
            />
          </mesh>
        )}
      </group>

      {/* Ceiling */}
      <group position={[0, WALL_TOTAL_HEIGHT - 0.2, -hallLength / 2]}>
        <mesh rotation={[Math.PI / 2.4, 0, 0]} position={[-CORRIDOR_WIDTH / 4, 0, 0]}>
          <planeGeometry args={[floorLength, CORRIDOR_WIDTH / 2]} onUpdate={assignUv2} />
          <meshStandardMaterial
            side={THREE.DoubleSide}
            color="#f0e6d6"
            map={ceiling.baseColor ?? undefined}
            normalMap={ceiling.normal ?? undefined}
            roughnessMap={ceiling.roughness ?? undefined}
            normalScale={ceilingNormalScale}
            roughness={0.85}
            metalness={0.02}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.4, 0, Math.PI]} position={[CORRIDOR_WIDTH / 4, 0, 0]}>
          <planeGeometry args={[floorLength, CORRIDOR_WIDTH / 2]} onUpdate={assignUv2} />
          <meshStandardMaterial
            side={THREE.DoubleSide}
            color="#f0e6d6"
            map={ceiling.baseColor ?? undefined}
            normalMap={ceiling.normal ?? undefined}
            roughnessMap={ceiling.roughness ?? undefined}
            normalScale={ceilingNormalScale}
            roughness={0.85}
            metalness={0.02}
          />
        </mesh>
        {skylightBandTexture && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.18, 0]}>
            <planeGeometry args={[CORRIDOR_WIDTH * 0.62, floorLength]} />
            <meshStandardMaterial
              map={skylightBandTexture}
              side={THREE.DoubleSide}
              transparent
              opacity={0.95}
              metalness={0}
              roughness={0.2}
              emissive="#ffffff"
              emissiveIntensity={skylightEmissive}
              emissiveMap={skylightBandTexture}
            />
          </mesh>
        )}
      </group>

      {/* Arches and ribs */}
      {archTexture && columnTexture &&
        archPositions.map((zPosition) => (
          <group key={zPosition} position={[0, 0, zPosition]}>
            <mesh position={[-CORRIDOR_WIDTH / 2 + COLUMN_WIDTH / 2, WALL_TOTAL_HEIGHT / 2, 0]}>
              <planeGeometry args={[COLUMN_WIDTH, WALL_TOTAL_HEIGHT]} />
              <meshStandardMaterial
                map={columnTexture}
                side={THREE.DoubleSide}
                transparent
                roughness={0.82}
                metalness={0.02}
              />
            </mesh>
            <mesh position={[CORRIDOR_WIDTH / 2 - COLUMN_WIDTH / 2, WALL_TOTAL_HEIGHT / 2, 0]}>
              <planeGeometry args={[COLUMN_WIDTH, WALL_TOTAL_HEIGHT]} />
              <meshStandardMaterial
                map={columnTexture}
                side={THREE.DoubleSide}
                transparent
                roughness={0.82}
                metalness={0.02}
              />
            </mesh>
            <mesh position={[0, WALL_TOTAL_HEIGHT - 0.3, 0]}>
              <planeGeometry args={[CORRIDOR_WIDTH - COLUMN_WIDTH * 0.8, 1.3]} />
              <meshStandardMaterial
                map={archTexture}
                side={THREE.DoubleSide}
                transparent
                roughness={0.7}
                metalness={0.12}
              />
            </mesh>
          </group>
        ))}

      {placements.map((placement) => (
        <Frame
          key={placement.president.person_id}
          placement={placement}
          isHighlighted={highlightedId === placement.president.person_id}
          onSelect={(id) => openInfoPanel(id)}
          panelColor={panelColor}
          isMobile={isMobile}
        />
      ))}
    </group>
  );
};

export default HallLayout;
