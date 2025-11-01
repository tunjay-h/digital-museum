import { useEffect, useMemo, useState } from 'react';
import portraits from '../data/portraits';

const loadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });

export const usePreloadAssets = (count = 4) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const assets = useMemo(() => {
    return portraits
      .slice(0, count)
      .map((portrait) => portrait.image_src);
  }, [count]);

  useEffect(() => {
    let cancelled = false;
    const total = assets.length;
    if (total === 0) {
      setProgress(100);
      setIsComplete(true);
      return;
    }
    let loaded = 0;

    assets.forEach((asset) => {
      loadImage(asset).then(() => {
        if (cancelled) return;
        loaded += 1;
        setProgress(Math.min(100, Math.round((loaded / total) * 100)));
        if (loaded === total) {
          setIsComplete(true);
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [assets]);

  return { progress, isComplete } as const;
};
