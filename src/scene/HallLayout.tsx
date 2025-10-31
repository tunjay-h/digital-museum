import { useEffect, useMemo, useRef, useState, type DependencyList } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useMuseumStore } from '../store/useMuseumStore';
import { useHallTextures } from './useHallTextures';
import {
  CAMERA_EYE_HEIGHT,
  CEILING_HEIGHT,
  CORRIDOR_WIDTH,
  HUB_RADIUS,
  HUB_RING_WIDTH,
  HALL_LENGTH,
  PORTAL_DEPTH,
} from './constants';
import Frame from './Frame';
import { usePlacements } from './PlacementsContext';
import type { FramePlacement, HallId } from '../types';
import { HALL_DEFINITIONS } from './halls';

const WALL_LOWER_HEIGHT = 1.85;
const WALL_TOTAL_HEIGHT = CEILING_HEIGHT;
const TRIM_HEIGHT = 0.12;
const COLUMN_RADIUS = 0.32;
const ARCH_TUBE_RADIUS = 0.16;
const ARCH_HEIGHT = 3.8;
const ARCH_WIDTH = CORRIDOR_WIDTH - 0.4;

const SPOTLIGHT_NEAR_COLOR = new THREE.Color('#ffe9d1');
const SPOTLIGHT_DEEP_COLOR = new THREE.Color('#ffd7b1');
const PORTAL_FAR_COLOR = new THREE.Color('#fff7ec');
const PORTAL_NEAR_COLOR = new THREE.Color('#ffe3c2');

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

const createArchGeometry = () => {
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-ARCH_WIDTH / 2, 0, 0),
    new THREE.Vector3(0, ARCH_HEIGHT, 0),
    new THREE.Vector3(ARCH_WIDTH / 2, 0, 0),
  );
  const pathPoints = curve.getPoints(32);
  const path = new THREE.CatmullRomCurve3(pathPoints);
  return new THREE.TubeGeometry(path, 64, ARCH_TUBE_RADIUS, 24, false);
};

const FloatingEmblem = ({ flag, emblem }: { flag: THREE.Texture | null; emblem: THREE.Texture | null }) => {
  const groupRef = useRef<THREE.Group>(null);
  const pivotRef = useRef<THREE.Group>(null);
  useFrame(({ clock, camera }) => {
    if (!groupRef.current || !pivotRef.current) return;
    const t = clock.getElapsedTime();
    const baseY = 2.25;
    groupRef.current.position.y = baseY + Math.sin(t * 1.6) * 0.15;
    pivotRef.current.rotation.y = t * 0.25;

    const { position } = groupRef.current;
    const target = new THREE.Vector3(camera.position.x, position.y, camera.position.z);
    groupRef.current.lookAt(target);
  });

  return (
    <group ref={groupRef} position={[0, 2.25, 0]}>
      <group ref={pivotRef}>
        {flag && (
          <mesh position={[0, 0, -0.04]}>
            <planeGeometry args={[2.6, 1.48]} />
            <meshStandardMaterial
              map={flag}
              side={THREE.DoubleSide}
              transparent
              opacity={0.98}
              roughness={0.35}
              metalness={0.12}
            />
          </mesh>
        )}
        {emblem && (
          <mesh position={[0, 0.9, 0.04]}>
            <planeGeometry args={[1.45, 1.45]} />
            <meshStandardMaterial
              map={emblem}
              side={THREE.DoubleSide}
              transparent
              opacity={0.98}
              roughness={0.28}
              metalness={0.24}
              emissive="#ffffff"
              emissiveIntensity={0.35}
            />
          </mesh>
        )}
      </group>
    </group>
  );
};

const HallLayout = ({ isMobile }: { isMobile: boolean }) => {
  const placements = usePlacements();
  const highlightedId = useMuseumStore((state) => state.focusCandidateId ?? state.selectedPortraitId ?? null);
  const openInfoPanel = useMuseumStore((state) => state.openInfoPanel);
  const { floor, trimTexture, columnTexture, archTexture, skylightTexture: rawSkylightTexture, wallLower, wallUpper, ceiling, panelColor } =
    useHallTextures();

  const { gl } = useThree();

  const maxAnisotropy = useMemo(() => Math.min(12, gl.capabilities.getMaxAnisotropy()), [gl]);

  const sideTrimTexture = useConfiguredTexture(
    trimTexture,
    (tex) => {
      tex.repeat.set((HALL_LENGTH + PORTAL_DEPTH) / 2.4, 1);
      tex.wrapS = THREE.RepeatWrapping;
    },
    [],
  );

  const endTrimTexture = useConfiguredTexture(
    trimTexture,
    (tex) => {
      tex.repeat.set(CORRIDOR_WIDTH / 0.32, 1);
      tex.wrapS = THREE.RepeatWrapping;
    },
    [],
  );

  const corridorSkylightTexture = useConfiguredTexture(
    rawSkylightTexture,
    (tex) => {
      tex.repeat.set(1, (HALL_LENGTH + PORTAL_DEPTH) / 3.2);
    },
    [],
  );

  const columnSurfaceTexture = useConfiguredTexture(
    columnTexture,
    (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1.2, CEILING_HEIGHT / 1.6);
      tex.anisotropy = maxAnisotropy;
    },
    [maxAnisotropy],
  );

  const archSurfaceTexture = useConfiguredTexture(
    archTexture,
    (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2.4, 0.8);
      tex.anisotropy = maxAnisotropy;
    },
    [maxAnisotropy],
  );

  const hubFloorMap = useConfiguredTexture(
    floor.baseColor,
    (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(HUB_RADIUS / 1.6, HUB_RADIUS / 1.6);
      tex.anisotropy = maxAnisotropy;
    },
    [maxAnisotropy],
  );

  const hubFloorNormal = useConfiguredTexture(
    floor.normal,
    (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(HUB_RADIUS / 1.6, HUB_RADIUS / 1.6);
      tex.anisotropy = maxAnisotropy;
    },
    [maxAnisotropy],
  );

  const hubFloorRoughness = useConfiguredTexture(
    floor.roughness,
    (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(HUB_RADIUS / 1.6, HUB_RADIUS / 1.6);
      tex.anisotropy = maxAnisotropy;
    },
    [maxAnisotropy],
  );

  const hubFloorAo = useConfiguredTexture(
    floor.ao,
    (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(HUB_RADIUS / 1.6, HUB_RADIUS / 1.6);
      tex.anisotropy = maxAnisotropy;
    },
    [maxAnisotropy],
  );

  const archGeometry = useMemo(() => createArchGeometry(), []);
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

  const floorNormalScale = useMemo(() => new THREE.Vector2(0.7, 0.7), []);
  const wallNormalScale = useMemo(() => new THREE.Vector2(0.4, 0.4), []);
  const ceilingNormalScale = useMemo(() => new THREE.Vector2(0.22, 0.22), []);

  const hallwayGeometries = useMemo(
    () =>
      HALL_DEFINITIONS.map((definition) => {
        const floorGeo = new THREE.PlaneGeometry(CORRIDOR_WIDTH, HALL_LENGTH + PORTAL_DEPTH);
        floorGeo.rotateX(-Math.PI / 2);
        floorGeo.translate(0, 0, (HALL_LENGTH + PORTAL_DEPTH) / 2);

        const lowerLeft = new THREE.PlaneGeometry(HALL_LENGTH + PORTAL_DEPTH, WALL_LOWER_HEIGHT);
        lowerLeft.rotateY(Math.PI / 2);
        lowerLeft.translate(-CORRIDOR_WIDTH / 2, WALL_LOWER_HEIGHT / 2, (HALL_LENGTH + PORTAL_DEPTH) / 2);

        const lowerRight = lowerLeft.clone();
        lowerRight.rotateY(Math.PI);
        lowerRight.translate(0, 0, 0);

        const upperLeft = new THREE.PlaneGeometry(
          HALL_LENGTH + PORTAL_DEPTH,
          WALL_TOTAL_HEIGHT - WALL_LOWER_HEIGHT,
        );
        upperLeft.rotateY(Math.PI / 2);
        upperLeft.translate(
          -CORRIDOR_WIDTH / 2,
          WALL_LOWER_HEIGHT + (WALL_TOTAL_HEIGHT - WALL_LOWER_HEIGHT) / 2,
          (HALL_LENGTH + PORTAL_DEPTH) / 2,
        );
        const upperRight = upperLeft.clone();
        upperRight.rotateY(Math.PI);
        upperRight.translate(0, 0, 0);

        const ceilingGeo = new THREE.PlaneGeometry(CORRIDOR_WIDTH, HALL_LENGTH + PORTAL_DEPTH);
        ceilingGeo.rotateX(Math.PI / 2);
        ceilingGeo.translate(0, WALL_TOTAL_HEIGHT - 0.2, (HALL_LENGTH + PORTAL_DEPTH) / 2);

        const mergedFloor = BufferGeometryUtils.mergeGeometries([floorGeo], false);
        const mergedLowerWalls = BufferGeometryUtils.mergeGeometries([lowerLeft, lowerRight], false);
        const mergedUpperWalls = BufferGeometryUtils.mergeGeometries([upperLeft, upperRight], false);
        const mergedCeiling = BufferGeometryUtils.mergeGeometries([ceilingGeo], false);

        const rotationMatrix = new THREE.Matrix4().makeRotationY(definition.rotation);
        mergedFloor.applyMatrix4(rotationMatrix);
        mergedLowerWalls.applyMatrix4(rotationMatrix);
        mergedUpperWalls.applyMatrix4(rotationMatrix);
        mergedCeiling.applyMatrix4(rotationMatrix);

        return { floor: mergedFloor, lowerWalls: mergedLowerWalls, upperWalls: mergedUpperWalls, ceilings: mergedCeiling };
      }),
    [],
  );

  useEffect(() => {
    return () => {
      hallwayGeometries.forEach((entry) => {
        entry.floor?.dispose();
        entry.lowerWalls?.dispose();
        entry.upperWalls?.dispose();
        entry.ceilings?.dispose();
      });
    };
  }, [hallwayGeometries]);

  const [skylightEmissive, setSkylightEmissive] = useState(0.3);
  useEffect(() => setSkylightEmissive(isMobile ? 0.24 : 0.35), [isMobile]);

  const placementsByHall = useMemo(() => {
    const grouped = HALL_DEFINITIONS.reduce<Record<HallId, FramePlacement[]>>((acc, definition) => {
      acc[definition.hallId] = [];
      return acc;
    }, {} as Record<HallId, FramePlacement[]>);

    placements.forEach((placement) => {
      grouped[placement.hallId]?.push(placement);
    });

    return grouped;
  }, [placements]);

  const hallGeometryRefs = useRef<Record<HallId, THREE.Group | null>>(
    HALL_DEFINITIONS.reduce<Record<HallId, THREE.Group | null>>((acc, definition) => {
      acc[definition.hallId] = null;
      return acc;
    }, {} as Record<HallId, THREE.Group | null>),
  );

  const hallFrameRefs = useRef<Record<HallId, THREE.Group | null>>(
    HALL_DEFINITIONS.reduce<Record<HallId, THREE.Group | null>>((acc, definition) => {
      acc[definition.hallId] = null;
      return acc;
    }, {} as Record<HallId, THREE.Group | null>),
  );

  const hallTrimRefs = useRef<Record<HallId, THREE.Group | null>>(
    HALL_DEFINITIONS.reduce<Record<HallId, THREE.Group | null>>((acc, definition) => {
      acc[definition.hallId] = null;
      return acc;
    }, {} as Record<HallId, THREE.Group | null>),
  );

  const spotLightRefs = useRef<Record<HallId, THREE.SpotLight | null>>(
    HALL_DEFINITIONS.reduce<Record<HallId, THREE.SpotLight | null>>((acc, definition) => {
      acc[definition.hallId] = null;
      return acc;
    }, {} as Record<HallId, THREE.SpotLight | null>),
  );

  const portalFadeRefs = useRef<Record<HallId, THREE.MeshBasicMaterial | null>>(
    HALL_DEFINITIONS.reduce<Record<HallId, THREE.MeshBasicMaterial | null>>((acc, definition) => {
      acc[definition.hallId] = null;
      return acc;
    }, {} as Record<HallId, THREE.MeshBasicMaterial | null>),
  );

  useFrame(({ camera }, delta) => {
    const { x, z } = camera.position;
    const hubDistance = Math.hypot(x, z);
    const nearHub = hubDistance <= HUB_RADIUS + 1.6;

    HALL_DEFINITIONS.forEach((definition) => {
      const cos = Math.cos(definition.rotation);
      const sin = Math.sin(definition.rotation);
      const localX = x * cos - z * sin;
      const localZ = x * sin + z * cos;

      const corridorHalf = CORRIDOR_WIDTH / 2 + 0.75;
      const entryThreshold = HUB_RADIUS - PORTAL_DEPTH * 0.45;
      const insideHall = localZ >= entryThreshold && Math.abs(localX) <= corridorHalf;

      const hallGroup = hallGeometryRefs.current[definition.hallId];
      if (hallGroup) {
        hallGroup.visible = nearHub || insideHall;
      }

      const frameGroup = hallFrameRefs.current[definition.hallId];
      if (frameGroup) {
        frameGroup.visible = nearHub || insideHall;
      }

      const trimGroup = hallTrimRefs.current[definition.hallId];
      if (trimGroup) {
        trimGroup.visible = nearHub || insideHall;
      }

      const spotlight = spotLightRefs.current[definition.hallId];
      if (spotlight) {
        const targetIntensity = insideHall ? 1.55 : nearHub ? 1.08 : 0.68;
        spotlight.intensity = THREE.MathUtils.damp(spotlight.intensity, targetIntensity, 6, delta);
        const colorMix = THREE.MathUtils.clamp((localZ - entryThreshold) / 9, 0, 1);
        spotlight.color.lerpColors(SPOTLIGHT_NEAR_COLOR, SPOTLIGHT_DEEP_COLOR, colorMix);
      }

      const fadeMaterial = portalFadeRefs.current[definition.hallId];
      if (fadeMaterial) {
        const fadeStart = HUB_RADIUS - PORTAL_DEPTH * 0.2;
        const fadeRange = 5.4;
        const fadeAmount = THREE.MathUtils.clamp((localZ - fadeStart) / fadeRange, 0, 1);
        const targetOpacity = nearHub ? 0.18 + fadeAmount * 0.28 : 0.12 + fadeAmount * 0.48;
        fadeMaterial.opacity = THREE.MathUtils.damp(fadeMaterial.opacity, targetOpacity, 4.5, delta);
        fadeMaterial.color.lerpColors(PORTAL_FAR_COLOR, PORTAL_NEAR_COLOR, fadeAmount);
      }
    });
  });

  return (
    <group>
      <pointLight position={[0, 4.5, 0]} intensity={2.2} color="#ffd9ba" distance={18} decay={1.2} />
      {HALL_DEFINITIONS.map((definition) => (
        <spotLight
          key={`hall-light-${definition.hallId}`}
          ref={(light) => {
            spotLightRefs.current[definition.hallId] = light;
          }}
          position={[Math.sin(definition.rotation) * (HUB_RADIUS + 4), 4.2, Math.cos(definition.rotation) * (HUB_RADIUS + 4)]}
          angle={Math.PI / 5}
          intensity={1.08}
          penumbra={0.35}
          color="#ffe9d1"
          distance={18}
          decay={1.35}
          target-position={[
            Math.sin(definition.rotation) * (HUB_RADIUS + HALL_LENGTH * 0.6),
            CAMERA_EYE_HEIGHT,
            Math.cos(definition.rotation) * (HUB_RADIUS + HALL_LENGTH * 0.6),
          ] as unknown as [number, number, number]}
        />
      ))}

      {/* Hub floor */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[HUB_RADIUS, 128]} onUpdate={assignUv2} />
          <meshStandardMaterial
            color="#f4d7ab"
            map={hubFloorMap ?? undefined}
            normalMap={hubFloorNormal ?? undefined}
            roughnessMap={hubFloorRoughness ?? undefined}
            aoMap={hubFloorAo ?? undefined}
            aoMapIntensity={0.7}
            metalness={0.06}
            roughness={0.55}
            normalScale={floorNormalScale}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
          <ringGeometry args={[HUB_RADIUS - HUB_RING_WIDTH, HUB_RADIUS, 128]} />
          <meshStandardMaterial
            map={trimTexture ?? undefined}
            transparent
            opacity={0.95}
            roughness={0.32}
            metalness={0.2}
          />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[1.05, 1.05, 0.36, 48]} />
          <meshStandardMaterial color="#e8ceb0" roughness={0.6} metalness={0.08} />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
          <cylinderGeometry args={[0.24, 0.28, 2.1, 48]} />
          <meshStandardMaterial color="#f5e7d4" roughness={0.48} metalness={0.14} />
        </mesh>
        <FloatingEmblem flag={flagTexture} emblem={logoTexture} />
      </group>

      {/* Arch portals */}
      {HALL_DEFINITIONS.map((definition) => (
        <group key={`portal-${definition.hallId}`} rotation={[0, definition.rotation, 0]} position={[0, 0, HUB_RADIUS - 0.2]}>
          <mesh position={[0, WALL_TOTAL_HEIGHT - 0.4, PORTAL_DEPTH * 0.5]}>
            <primitive object={archGeometry} attach="geometry" />
            <meshStandardMaterial
              color="#eadbc5"
              map={archSurfaceTexture ?? undefined}
              roughness={0.6}
              metalness={0.18}
            />
          </mesh>
          {[ -1, 1 ].map((direction) => (
            <mesh
              key={`portal-col-${definition.hallId}-${direction}`}
              position={[direction * (CORRIDOR_WIDTH / 2 - 0.45), CEILING_HEIGHT / 2, PORTAL_DEPTH * 0.2]}
            >
              <cylinderGeometry args={[COLUMN_RADIUS * 1.05, COLUMN_RADIUS * 0.95, CEILING_HEIGHT, 40, 1, false]} />
              <meshStandardMaterial
                color="#e8d8c2"
                map={columnSurfaceTexture ?? undefined}
                roughness={0.72}
                metalness={0.1}
              />
            </mesh>
          ))}
          <mesh position={[0, CEILING_HEIGHT * 0.55, PORTAL_DEPTH * 0.32]} renderOrder={-1}>
            <planeGeometry args={[CORRIDOR_WIDTH * 1.06, 3.6]} />
            <meshBasicMaterial
              ref={(material) => {
                portalFadeRefs.current[definition.hallId] = material;
              }}
              transparent
              opacity={0.18}
              color="#fff5e6"
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}

      {/* Hallway shells */}
      {hallwayGeometries.map((entry, index) => {
        const definition = HALL_DEFINITIONS[index];
        return (
          <group
            key={`hall-shell-${definition.hallId}`}
            ref={(group) => {
              hallGeometryRefs.current[definition.hallId] = group;
            }}
          >
            <mesh geometry={entry.floor ?? undefined} rotation={[0, 0, 0]} receiveShadow>
            <meshStandardMaterial
              color="#f3d4a8"
              map={floor.baseColor ?? undefined}
              normalMap={floor.normal ?? undefined}
              roughnessMap={floor.roughness ?? undefined}
              aoMap={floor.ao ?? undefined}
              aoMapIntensity={0.72}
              metalness={0.05}
              roughness={0.58}
              normalScale={floorNormalScale}
            />
            </mesh>
            <mesh geometry={entry.lowerWalls ?? undefined}>
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
            <mesh geometry={entry.upperWalls ?? undefined}>
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
            <mesh geometry={entry.ceilings ?? undefined}>
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
            {corridorSkylightTexture && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, CEILING_HEIGHT - 0.05, 0]}>
                <planeGeometry args={[CORRIDOR_WIDTH * 0.62, HALL_LENGTH + PORTAL_DEPTH]} />
                <meshStandardMaterial
                  map={corridorSkylightTexture}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.94}
                  metalness={0}
                  roughness={0.2}
                  emissive="#ffffff"
                  emissiveIntensity={skylightEmissive}
                  emissiveMap={corridorSkylightTexture}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Floor trims at hall entrances */}
      {HALL_DEFINITIONS.map((definition) => (
        <group
          key={`trim-${definition.hallId}`}
          ref={(group) => {
            hallTrimRefs.current[definition.hallId] = group;
          }}
          rotation={[0, definition.rotation, 0]}
          position={[0, 0, HUB_RADIUS + PORTAL_DEPTH]}
        >
          {sideTrimTexture && (
            <mesh position={[0, WALL_LOWER_HEIGHT, 0]}>
              <planeGeometry args={[HALL_LENGTH + PORTAL_DEPTH, TRIM_HEIGHT]} />
              <meshStandardMaterial
                map={sideTrimTexture}
                transparent
                opacity={0.96}
                side={THREE.DoubleSide}
                roughness={0.35}
                metalness={0.15}
              />
            </mesh>
          )}
          {endTrimTexture && (
            <mesh position={[0, WALL_LOWER_HEIGHT, HALL_LENGTH + PORTAL_DEPTH - 0.5]}>
              <planeGeometry args={[CORRIDOR_WIDTH, TRIM_HEIGHT]} />
              <meshStandardMaterial
                map={endTrimTexture}
                transparent
                opacity={0.96}
                side={THREE.DoubleSide}
                roughness={0.35}
                metalness={0.15}
              />
            </mesh>
          )}
        </group>
      ))}

      {HALL_DEFINITIONS.map((definition) => (
        <group
          key={`hall-frames-${definition.hallId}`}
          ref={(group) => {
            hallFrameRefs.current[definition.hallId] = group;
          }}
        >
          {placementsByHall[definition.hallId].map((placement) => (
            <Frame
              key={placement.portrait.person_id}
              placement={placement}
              isHighlighted={highlightedId === placement.portrait.person_id}
              onSelect={(id) => openInfoPanel(id)}
              panelColor={panelColor}
              isMobile={isMobile}
            />
          ))}
        </group>
      ))}
    </group>
  );
};

export default HallLayout;
