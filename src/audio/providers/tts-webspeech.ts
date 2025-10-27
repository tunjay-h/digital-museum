import type { TTSProvider, TTSRequest, TTSResponse } from './types';

const synthesizeWithWebSpeech = async (request: TTSRequest): Promise<TTSResponse | null> => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }
  const utterance = new SpeechSynthesisUtterance(request.text);
  utterance.lang = request.locale === 'az' ? 'az-AZ' : 'en-US';
  if (request.voice) {
    const voice = window.speechSynthesis
      .getVoices()
      .find((item) => item.name === request.voice);
    if (voice) {
      utterance.voice = voice;
    }
  }
  window.speechSynthesis.speak(utterance);
  return {
    audioUrl: '',
    provider: 'webspeech',
  };
};

export const webSpeechProvider: TTSProvider = {
  id: 'webspeech',
  label: 'Web Speech API',
  isAvailable: () => typeof window !== 'undefined' && 'speechSynthesis' in window,
  synthesize: synthesizeWithWebSpeech,
};

export default webSpeechProvider;
