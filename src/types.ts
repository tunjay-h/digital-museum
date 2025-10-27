export interface President {
  order: number;
  person_id: string;
  name_az: string;
  name_en: string;
  term_start: string;
  term_end: string;
  image_src: string;
  short_desc_en: string;
  short_desc_az: string;
  audio_az?: string;
  audio_en?: string;
  tts_text_en?: string;
  tts_text_az?: string;
  sources: string[];
}

export interface FramePlacement {
  president: President;
  position: [number, number, number];
  rotation: [number, number, number];
  side: 'left' | 'right' | 'end';
}
