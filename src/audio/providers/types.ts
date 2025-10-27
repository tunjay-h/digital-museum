export interface TTSRequest {
  text: string;
  locale: 'az' | 'en';
  voice?: string;
}

export interface TTSResponse {
  audioUrl: string;
  provider: string;
}

export interface TTSProvider {
  id: string;
  label: string;
  isAvailable: () => boolean;
  synthesize: (request: TTSRequest) => Promise<TTSResponse | null>;
}
