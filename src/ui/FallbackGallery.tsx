import { useTranslation } from 'react-i18next';
import presidents from '../data/presidents';
import { useMuseumStore } from '../store/useMuseumStore';

const FallbackGallery = () => {
  const { t } = useTranslation('ui');
  const language = useMuseumStore((state) => state.language);

  return (
    <div style={{ padding: '3rem 5vw', maxWidth: '960px', margin: '0 auto' }}>
      <h1>{t('fallbackTitle')}</h1>
      <p style={{ opacity: 0.7 }}>{t('fallbackDescription')}</p>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '2rem', display: 'grid', gap: '1.2rem' }}>
        {presidents.map((president) => (
          <li
            key={president.person_id}
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
              src={president.image_src}
              alt={language === 'az' ? president.name_az : president.name_en}
              style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '12px' }}
            />
            <div>
              <h3 style={{ margin: 0 }}>
                {language === 'az' ? president.name_az : president.name_en}
              </h3>
              <p style={{ margin: '0.3rem 0', opacity: 0.7 }}>
                {president.term_start} — {president.term_end}
              </p>
              <p style={{ margin: 0, opacity: 0.8 }}>
                {language === 'az' ? president.short_desc_az : president.short_desc_en}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FallbackGallery;
