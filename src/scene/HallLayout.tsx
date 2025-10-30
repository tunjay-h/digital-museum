import { useEffect, useMemo, useState, type DependencyList } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
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
const COLUMN_RADIUS = 0.28;
const ARCH_TUBE_RADIUS = 0.16;
const ATRIUM_RADIUS = 5.2;
const ATRIUM_RING_WIDTH = 0.2;
const HUB_CENTER_Z = 5;
const ARCH_RISE = 1.25;

const assignUv2 = (geometry: THREE.BufferGeometry | null) => {
  if (!geometry) return;
  const uvAttribute = geometry.attributes.uv as THREE.BufferAttribute | undefined;
  if (!uvAttribute) return;
  if (!geometry.attributes.uv2) {
    const uv2 = new Float32Array(uvAttribute.array);
    geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(uv2, 2));
  }
};

/* eslint-disable react-hooks/exhaustive-deps */
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
  }, [texture, configure, ...deps]);

  useEffect(() => () => configured?.dispose(), [configured]);

  return configured;
};
/* eslint-enable react-hooks/exhaustive-deps */

const HallLayout = ({ isMobile }: HallLayoutProps) => {
  const placements = usePlacements();
  const highlightedId = useMuseumStore((state) =>
    state.focusCandidateId ?? state.selectedPortraitId ?? null,
  );
  const openInfoPanel = useMuseumStore((state) => state.openInfoPanel);
  const { floor, trimTexture, columnTexture, archTexture, skylightTexture, wallLower, wallUpper, ceiling, panelColor } =
    useHallTextures();

  const { gl } = useThree();

  const maxAnisotropy = useMemo(
    () => Math.min(12, gl.capabilities.getMaxAnisotropy()),
    [gl],
  );

  const hallLength = Math.abs(END_Z) + 6;
  const floorLength = hallLength + 12;

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

  const columnSurfaceTexture = useConfiguredTexture(
    columnTexture,
    (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1.2, WALL_TOTAL_HEIGHT / 1.6);
      tex.anisotropy = maxAnisotropy;
    },
    [maxAnisotropy],
  );

  const archSurfaceTexture = useConfiguredTexture(
    archTexture,
    (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2.4, 0.8);
      tex.anisotropy = maxAnisotropy;
    },
    [maxAnisotropy],
  );

  const atriumFloorMap = useConfiguredTexture(
    floor.baseColor,
    (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(ATRIUM_RADIUS / 1.6, ATRIUM_RADIUS / 1.6);
      tex.anisotropy = maxAnisotropy;
    },
    [maxAnisotropy],
  );

  const atriumFloorNormal = useConfiguredTexture(
    floor.normal,
    (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(ATRIUM_RADIUS / 1.6, ATRIUM_RADIUS / 1.6);
      tex.anisotropy = maxAnisotropy;
    },
    [maxAnisotropy],
  );

  const atriumFloorRoughness = useConfiguredTexture(
    floor.roughness,
    (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(ATRIUM_RADIUS / 1.6, ATRIUM_RADIUS / 1.6);
      tex.anisotropy = maxAnisotropy;
    },
    [maxAnisotropy],
  );

  const atriumFloorAo = useConfiguredTexture(
    floor.ao,
    (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(ATRIUM_RADIUS / 1.6, ATRIUM_RADIUS / 1.6);
      tex.anisotropy = maxAnisotropy;
    },
    [maxAnisotropy],
  );

  const atriumTrimTexture = useConfiguredTexture(
    trimTexture,
    (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.repeat.set((ATRIUM_RADIUS * Math.PI * 2) / 0.32, 1);
      tex.anisotropy = maxAnisotropy;
    },
    [maxAnisotropy],
  );

  const archPositions = useMemo(() => {
    const positions: number[] = [];
    for (let z = START_Z - 0.6; z > END_Z - 1.2; z -= FRAME_SPACING) {
      positions.push(z);
    }
    return positions;
  }, []);

  const columnOffsetX = useMemo(
    () => CORRIDOR_WIDTH / 2 - COLUMN_RADIUS - 0.08,
    [],
  );

  const archPoints = useMemo(() => {
    const controlOffset = columnOffsetX * 0.55;
    return [
      new THREE.Vector3(-columnOffsetX, 0, 0),
      new THREE.Vector3(-controlOffset, ARCH_RISE * 0.6, 0),
      new THREE.Vector3(0, ARCH_RISE, 0),
      new THREE.Vector3(controlOffset, ARCH_RISE * 0.6, 0),
      new THREE.Vector3(columnOffsetX, 0, 0),
    ];
  }, [columnOffsetX]);

  const archCurve = useMemo(
    () => new THREE.CatmullRomCurve3(archPoints, false, 'catmullrom', 0),
    [archPoints],
  );

  const archGeometry = useMemo(
    () => new THREE.TubeGeometry(archCurve, 64, ARCH_TUBE_RADIUS, 24, false),
    [archCurve],
  );

  useEffect(() => () => archGeometry.dispose(), [archGeometry]);

  const flagTexture = useTexture('/textures/flag_azerbaijan.webp');
  const logoTexture = useTexture('/textures/anas_logo.webp');

  useEffect(() => {
    [flagTexture, logoTexture].forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.anisotropy = maxAnisotropy;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
    });
  }, [flagTexture, logoTexture, maxAnisotropy]);

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
          color="#f3d4a8"
          map={floor.baseColor ?? undefined}
          normalMap={floor.normal ?? undefined}
          roughnessMap={floor.roughness ?? undefined}
          aoMap={floor.ao ?? undefined}
          aoMapIntensity={0.75}
          metalness={0.05}
          roughness={0.58}
          normalScale={floorNormalScale}
        />
      </mesh>

      {/* Central hub atrium */}
      <group position={[0, 0, HUB_CENTER_Z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} receiveShadow>
          <circleGeometry args={[ATRIUM_RADIUS, 96]} onUpdate={assignUv2} />
          <meshStandardMaterial
            color="#f4d7ab"
            map={atriumFloorMap ?? undefined}
            normalMap={atriumFloorNormal ?? undefined}
            roughnessMap={atriumFloorRoughness ?? undefined}
            aoMap={atriumFloorAo ?? undefined}
            aoMapIntensity={0.7}
            metalness={0.06}
            roughness={0.55}
            normalScale={floorNormalScale}
          />
        </mesh>
        {atriumTrimTexture && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
            <ringGeometry args={[ATRIUM_RADIUS - ATRIUM_RING_WIDTH, ATRIUM_RADIUS, 128]} />
            <meshStandardMaterial
              map={atriumTrimTexture}
              transparent
              opacity={0.96}
              roughness={0.32}
              metalness={0.18}
            />
          </mesh>
        )}
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.9, 0.9, 0.32, 48]} />
          <meshStandardMaterial color="#e8ceb0" roughness={0.64} metalness={0.08} />
        </mesh>
        <mesh position={[0, 1.24, 0]}>
          <cylinderGeometry args={[0.2, 0.22, 1.9, 32]} />
          <meshStandardMaterial color="#f6e7d2" roughness={0.52} metalness={0.12} />
        </mesh>
        <group position={[0, 2.15, 0]}>
          <mesh rotation={[0, Math.PI, 0]} position={[0, 0, -0.04]}>
            <planeGeometry args={[2.4, 1.36]} />
            <meshStandardMaterial
              map={flagTexture}
              side={THREE.DoubleSide}
              transparent
              opacity={0.98}
              roughness={0.38}
              metalness={0.14}
            />
          </mesh>
          <mesh position={[0, 0.82, 0.06]}>
            <planeGeometry args={[1.35, 1.35]} />
            <meshStandardMaterial
              map={logoTexture}
              side={THREE.DoubleSide}
              transparent
              opacity={0.98}
              roughness={0.32}
              metalness={0.22}
              emissive="#ffffff"
              emissiveIntensity={0.2}
            />
          </mesh>
        </group>
      </group>

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

      {/* Columns and arches */}
      {archPositions.map((zPosition) => (
        <group key={zPosition} position={[0, 0, zPosition]}>
          {[-1, 1].map((direction) => {
            const x = direction * columnOffsetX;
            return (
              <group key={direction}>
                <mesh position={[x, WALL_TOTAL_HEIGHT / 2, 0]} castShadow>
                  <cylinderGeometry
                    args={[COLUMN_RADIUS * 1.04, COLUMN_RADIUS * 0.96, WALL_TOTAL_HEIGHT, 48, 1, false]}
                  />
                  <meshStandardMaterial
                    color="#e8d8c2"
                    map={columnSurfaceTexture ?? undefined}
                    roughness={0.76}
                    metalness={0.08}
                    envMapIntensity={0.3}
                  />
                </mesh>
                <mesh position={[x, 0.12, 0]}>
                  <cylinderGeometry args={[COLUMN_RADIUS + 0.18, COLUMN_RADIUS + 0.22, 0.26, 32]} />
                  <meshStandardMaterial color="#d7c2a8" roughness={0.62} metalness={0.12} />
                </mesh>
                <mesh position={[x, WALL_TOTAL_HEIGHT - 0.12, 0]}>
                  <cylinderGeometry args={[COLUMN_RADIUS + 0.24, COLUMN_RADIUS + 0.08, 0.28, 32]} />
                  <meshStandardMaterial color="#ddcbb1" roughness={0.58} metalness={0.14} />
                </mesh>
              </group>
            );
          })}
          <mesh position={[0, WALL_TOTAL_HEIGHT - 0.2, 0]}>
            <primitive object={archGeometry} attach="geometry" />
            <meshStandardMaterial
              color="#eadbc5"
              map={archSurfaceTexture ?? undefined}
              roughness={0.64}
              metalness={0.16}
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
