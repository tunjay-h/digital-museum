import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import azUi from '../data/i18n/az/ui.json';
import enUi from '../data/i18n/en/ui.json';
import azMuseum from '../data/i18n/az/museum.json';
import enMuseum from '../data/i18n/en/museum.json';
import presidents from '../data/presidents';

type President = (typeof presidents)[number];

type BiosNamespace = Record<string, string>;

const buildBios = (locale: 'az' | 'en'): BiosNamespace => {
  return presidents.reduce((acc, president: President) => {
    acc[president.person_id] =
      locale === 'az' ? president.short_desc_az : president.short_desc_en;
    return acc;
  }, {} as BiosNamespace);
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      az: {
        ui: azUi,
        museum: azMuseum,
        bios: buildBios('az'),
      },
      en: {
        ui: enUi,
        museum: enMuseum,
        bios: buildBios('en'),
      },
    },
    lng: 'az',
    fallbackLng: 'en',
    ns: ['ui', 'museum', 'bios'],
    defaultNS: 'ui',
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

export default i18n;
