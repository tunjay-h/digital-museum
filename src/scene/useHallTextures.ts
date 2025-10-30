import { useMemo } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CORRIDOR_WIDTH, END_Z } from './constants';

interface MaterialTextureSet {
  baseColor: THREE.Texture | null;
  normal: THREE.Texture | null;
  roughness: THREE.Texture | null;
  ao?: THREE.Texture | null;
}

const PANEL_COLOR = '#b99a7a';

const configureColorTexture = (
  texture: THREE.Texture | null,
  maxAnisotropy: number,
  repeat: [number, number],
) => {
  if (!texture) return null;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.anisotropy = maxAnisotropy;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

const configureLinearTexture = (
  texture: THREE.Texture | null,
  maxAnisotropy: number,
  repeat: [number, number],
) => {
  if (!texture) return null;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.anisotropy = maxAnisotropy;
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

const configureStaticTexture = (
  texture: THREE.Texture | null,
  maxAnisotropy: number,
  colorSpace: THREE.ColorSpace,
) => {
  if (!texture) return null;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = maxAnisotropy;
  texture.colorSpace = colorSpace;
  texture.needsUpdate = true;
  return texture;
};

export const useHallTextures = () => {
  const gl = useThree((state) => state.gl);
  const [
    floorBase,
    floorNormal,
    floorRoughness,
    floorAo,
    wallLowerBase,
    wallLowerNormal,
    wallLowerRoughness,
    wallUpperBase,
    wallUpperNormal,
    wallUpperRoughness,
    ceilingBase,
    ceilingNormal,
    ceilingRoughness,
    trimTexture,
    columnTexture,
    archTexture,
    skylightTexture,
  ] = useLoader(THREE.TextureLoader, [
    '/textures/floor_baseColor.webp',
    '/textures/floor_normal.webp',
    '/textures/floor_roughness.webp',
    '/textures/floor_ao.webp',
    '/textures/wall_lower_baseColor.webp',
    '/textures/wall_lower_normal.webp',
    '/textures/wall_lower_roughness.webp',
    '/textures/wall_upper_baseColor.webp',
    '/textures/wall_upper_normal.webp',
    '/textures/wall_upper_roughness.webp',
    '/textures/ceiling_baseColor.webp',
    '/textures/ceiling_normal.webp',
    '/textures/ceiling_roughness.webp',
    '/textures/trim_strip.png',
    '/textures/column_plaster.webp',
    '/textures/arch_span.webp',
    '/textures/skylight_strip.webp',
  ]);

  return useMemo(() => {
    const maxAnisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    const hallLength = Math.abs(END_Z) + 6;
    const floorLength = hallLength + 12;

    const floor: MaterialTextureSet = {
      baseColor: configureColorTexture(floorBase, maxAnisotropy, [CORRIDOR_WIDTH / 1.8, floorLength / 1.8]),
      normal: configureLinearTexture(floorNormal, maxAnisotropy, [CORRIDOR_WIDTH / 1.8, floorLength / 1.8]),
      roughness: configureLinearTexture(floorRoughness, maxAnisotropy, [CORRIDOR_WIDTH / 1.8, floorLength / 1.8]),
      ao: configureLinearTexture(floorAo, maxAnisotropy, [CORRIDOR_WIDTH / 1.8, floorLength / 1.8]),
    };

    const wallLower: MaterialTextureSet = {
      baseColor: configureColorTexture(wallLowerBase, maxAnisotropy, [floorLength / 3.6, 1.8]),
      normal: configureLinearTexture(wallLowerNormal, maxAnisotropy, [floorLength / 3.6, 1.8]),
      roughness: configureLinearTexture(wallLowerRoughness, maxAnisotropy, [floorLength / 3.6, 1.8]),
    };

    const wallUpper: MaterialTextureSet = {
      baseColor: configureColorTexture(wallUpperBase, maxAnisotropy, [floorLength / 4.2, 1.8]),
      normal: configureLinearTexture(wallUpperNormal, maxAnisotropy, [floorLength / 4.2, 1.8]),
      roughness: configureLinearTexture(wallUpperRoughness, maxAnisotropy, [floorLength / 4.2, 1.8]),
    };

    const ceiling: MaterialTextureSet = {
      baseColor: configureColorTexture(ceilingBase, maxAnisotropy, [floorLength / 2.6, CORRIDOR_WIDTH / 1.2]),
      normal: configureLinearTexture(ceilingNormal, maxAnisotropy, [floorLength / 2.6, CORRIDOR_WIDTH / 1.2]),
      roughness: configureLinearTexture(ceilingRoughness, maxAnisotropy, [floorLength / 2.6, CORRIDOR_WIDTH / 1.2]),
    };

    const trim = configureColorTexture(trimTexture, maxAnisotropy, [floorLength / 2.4, 1]);
    const column = configureStaticTexture(columnTexture, maxAnisotropy, THREE.SRGBColorSpace);
    const arch = configureStaticTexture(archTexture, maxAnisotropy, THREE.SRGBColorSpace);

    const skylight = skylightTexture ? skylightTexture : null;
    if (skylight) {
      skylight.wrapS = THREE.ClampToEdgeWrapping;
      skylight.wrapT = THREE.RepeatWrapping;
      skylight.repeat.set(1, floorLength / 3.4);
      skylight.anisotropy = maxAnisotropy;
      skylight.colorSpace = THREE.SRGBColorSpace;
      skylight.needsUpdate = true;
    }

    return {
      floor,
      wallLower,
      wallUpper,
      ceiling,
      trimTexture: trim,
      columnTexture: column,
      archTexture: arch,
      skylightTexture: skylight,
      panelColor: PANEL_COLOR,
    };
  }, [
    archTexture,
    ceilingBase,
    ceilingNormal,
    ceilingRoughness,
    columnTexture,
    floorAo,
    floorBase,
    floorNormal,
    floorRoughness,
    gl,
    trimTexture,
    skylightTexture,
    wallLowerBase,
    wallLowerNormal,
    wallLowerRoughness,
    wallUpperBase,
    wallUpperNormal,
    wallUpperRoughness,
  ]);
};
