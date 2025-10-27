import { useMemo } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export const useHallTextures = () => {
  const gl = useThree((state) => state.gl);
  const [wallTexture, floorTexture] = useLoader(THREE.TextureLoader, [
    '/textures/hall-wall.png',
    '/textures/hall-floor.png',
  ]);

  return useMemo(() => {
    const maxAnisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());

    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(6, 2.5);
    wallTexture.anisotropy = maxAnisotropy;
    wallTexture.colorSpace = THREE.SRGBColorSpace;

    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(8, 16);
    floorTexture.anisotropy = maxAnisotropy;
    floorTexture.colorSpace = THREE.SRGBColorSpace;

    return { wallTexture, floorTexture };
  }, [floorTexture, gl, wallTexture]);
};
