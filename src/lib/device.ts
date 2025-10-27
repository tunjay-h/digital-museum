export const isMobileLandscapeRequired = () => {
  if (typeof window === 'undefined') return false;
  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  if (!isMobile) return false;
  const { orientation } = window.screen;
  if (orientation && 'type' in orientation) {
    return !orientation.type.includes('landscape');
  }
  return window.innerWidth < window.innerHeight;
};

export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};
