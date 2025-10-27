import type { TTSProvider, TTSRequest, TTSResponse } from './types';

export const elevenLabsProvider: TTSProvider = {
  id: 'elevenlabs',
  label: 'ElevenLabs (stub)',
  isAvailable: () => false,
  synthesize: async (_request: TTSRequest): Promise<TTSResponse | null> => {
    void _request;
    console.info('ElevenLabs TTS provider stub invoked. Configure API key to enable.');
    return null;
  },
};

export default elevenLabsProvider;
