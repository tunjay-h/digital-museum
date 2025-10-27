import type { TTSProvider, TTSRequest, TTSResponse } from './types';

export const googleProvider: TTSProvider = {
  id: 'google',
  label: 'Google Cloud TTS (stub)',
  isAvailable: () => false,
  synthesize: async (_request: TTSRequest): Promise<TTSResponse | null> => {
    void _request;
    console.info('Google Cloud TTS provider stub invoked. Configure credentials to enable.');
    return null;
  },
};

export default googleProvider;
