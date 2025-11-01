import { useTranslation } from 'react-i18next';
import portraits from '../data/portraits';
import { useMuseumStore } from '../store/useMuseumStore';

const FallbackGallery = () => {
  const { t } = useTranslation('ui');
  const language = useMuseumStore((state) => state.language);

  return (
    <div style={{ padding: '3rem 5vw', maxWidth: '960px', margin: '0 auto' }}>
      <h1>{t('fallbackTitle')}</h1>
      <p style={{ opacity: 0.7 }}>{t('fallbackDescription')}</p>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '2rem', display: 'grid', gap: '1.2rem' }}>
        {portraits.map((portrait) => {
          const timeline = portrait.term_start && portrait.term_end
            ? `${portrait.term_start} — ${portrait.term_end}`
            : portrait.birth && portrait.death
              ? `${portrait.birth.substring(0, 4)} — ${portrait.death.substring(0, 4)}`
              : '';
          return (
          <li
            key={portrait.person_id}
            style={{
              background: 'rgba(8,8,10,0.6)',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'center',
            }}
          >
            <img
              src={portrait.image_src}
              alt={language === 'az' ? portrait.name_az : portrait.name_en}
              style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '12px' }}
            />
            <div>
              <h3 style={{ margin: 0 }}>
                {language === 'az' ? portrait.name_az : portrait.name_en}
              </h3>
              {timeline && (
                <p style={{ margin: '0.3rem 0', opacity: 0.7 }}>{timeline}</p>
              )}
              <p style={{ margin: 0, opacity: 0.8 }}>
                {language === 'az' ? portrait.short_desc_az : portrait.short_desc_en}
              </p>
            </div>
          </li>
          );
        })}
      </ul>
    </div>
  );
};

export default FallbackGallery;
