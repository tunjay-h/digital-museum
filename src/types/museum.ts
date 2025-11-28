export type HallType = 'people_gallery' | 'timeline' | 'exhibits' | string;

export interface HubConfig {
  title: string;
  subtitle?: string;
  emblemSrc: string;
  flagSrc: string;
}

export interface HallConfig {
  id: string;
  title: string;
  type: HallType;
  icon?: string;
  dataSrc?: string;
  summary?: string;
}

export interface MuseumConfig {
  hub: HubConfig;
  halls: HallConfig[];
}

export interface PeopleGalleryPerson {
  id: string;
  name: string;
  role?: string;
  years?: string;
  image?: string;
  summary?: string;
  bio?: string;
}

export interface PeopleGalleryData {
  title?: string;
  subtitle?: string;
  people: PeopleGalleryPerson[];
}
