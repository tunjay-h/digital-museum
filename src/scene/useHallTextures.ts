import { useMemo } from 'react';
import * as THREE from 'three';

const createGradientTexture = (
  colors: string[],
  horizontal = true,
): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create 2D context for texture');
  }
  const gradient = horizontal
    ? context.createLinearGradient(0, 0, canvas.width, 0)
    : context.createLinearGradient(0, 0, 0, canvas.height);
  const step = 1 / Math.max(1, colors.length - 1);
  colors.forEach((color, index) => {
    gradient.addColorStop(step * index, color);
  });
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(horizontal ? 4 : 2, horizontal ? 1 : 4);
  texture.anisotropy = 4;
  return texture;
};

const createPatternTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create 2D context for texture');
  }
  context.fillStyle = '#40352a';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(255, 224, 174, 0.08)';
  for (let i = 0; i < 32; i += 1) {
    context.fillRect(i * 4, 0, 2, canvas.height);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 8);
  texture.anisotropy = 4;
  return texture;
};

export const useHallTextures = () => {
  return useMemo(() => {
    const wallTexture = createGradientTexture(['#2f2a25', '#201b17', '#2f2a25'], false);
    const floorTexture = createPatternTexture();
    const ceilingTexture = createGradientTexture(['#1a1b20', '#101217'], false);
    return { wallTexture, floorTexture, ceilingTexture };
  }, []);
};
