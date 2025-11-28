import { useEffect, useState } from 'react';
import type { MuseumConfig } from '../types/museum';

interface UseMuseumConfigResult {
  config: MuseumConfig | null;
  loading: boolean;
  error: string | null;
}

let cachedConfig: MuseumConfig | null = null;

const useMuseumConfig = (): UseMuseumConfigResult => {
  const [config, setConfig] = useState<MuseumConfig | null>(cachedConfig);
  const [loading, setLoading] = useState<boolean>(!cachedConfig);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedConfig) return;

    const controller = new AbortController();

    const loadConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/museum.json', { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load museum.json (${response.status})`);
        }
        const json = (await response.json()) as MuseumConfig;
        cachedConfig = json;
        setConfig(json);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Unable to load museum configuration');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadConfig();

    return () => controller.abort();
  }, []);

  return { config, loading, error };
};

export default useMuseumConfig;
