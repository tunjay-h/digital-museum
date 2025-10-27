export const isWebGLSupported = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (error) {
    console.warn('WebGL support detection error', error);
    return false;
  }
};
