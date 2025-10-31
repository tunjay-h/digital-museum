export type HallId = 'presidents' | 'founders1' | 'founders2' | 'founders3';

export interface Portrait {
  order: number;
  person_id: string;
  hall_id: HallId;
  name_az: string;
  name_en: string;
  image_src: string;
  short_desc_en: string;
  short_desc_az: string;
  description_en: string;
  description_az: string;
  term_start?: string;
  term_end?: string;
  birth?: string;
  death?: string;
  role?: string;
  audio_az?: string;
  audio_en?: string;
  tts_text_en?: string;
  tts_text_az?: string;
}

export type FrameSide = 'left' | 'right' | 'center';

export interface FramePlacement {
  portrait: Portrait;
  hallId: HallId;
  position: [number, number, number];
  rotation: [number, number, number];
  side: FrameSide;
}
