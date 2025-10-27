import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import presidents from '../data/presidents';
import { useMuseumStore } from '../store/useMuseumStore';
import type { President } from '../types';

const panelRoot = () => document.getElementById('root');

const formatTerm = (president: President, language: 'az' | 'en') => {
  if (president.term_end.toLowerCase() === 'present') {
    return language === 'az'
      ? `${president.term_start} — ${president.term_end}`
      : `${president.term_start} — ${president.term_end}`;
  }
  return `${president.term_start} — ${president.term_end}`;
};

const InfoPanel = () => {
  const { t } = useTranslation(['ui', 'museum', 'bios']);
  const selectedPortraitId = useMuseumStore((state) => state.selectedPortraitId);
  const isOpen = useMuseumStore((state) => state.isInfoPanelOpen);
  const closeInfoPanel = useMuseumStore((state) => state.closeInfoPanel);
  const language = useMuseumStore((state) => state.language);
  const [linkCopied, setLinkCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const president = useMemo(
    () => presidents.find((entry) => entry.person_id === selectedPortraitId),
    [selectedPortraitId],
  );

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeInfoPanel();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeInfoPanel, isOpen]);

  if (!isOpen || !president) {
    return null;
  }

  const name = language === 'az' ? president.name_az : president.name_en;
  const description = language === 'az' ? president.short_desc_az : president.short_desc_en;
  const term = formatTerm(president, language);
  const audioSrc = language === 'az' ? president.audio_az : president.audio_en;
  const shareUrl = `${window.location.origin}/hall?p=${president.person_id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.warn('Clipboard error', error);
    }
  };

  const handleAudioToggle = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch((error) => console.error(error));
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="hud-panel"
      style={{
        position: 'absolute',
        inset: 'auto 2rem 2rem auto',
        width: 'min(420px, 90vw)',
        padding: '2rem',
        pointerEvents: 'auto',
      }}
    >
      <button
        className="ghost"
        onClick={closeInfoPanel}
        style={{ position: 'absolute', right: '1.25rem', top: '1.25rem' }}
      >
        {t('close')}
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>{t('museum:info.term')}</span>
          <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600 }}>{term}</p>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{name}</h3>
          <p style={{ opacity: 0.7, fontSize: '0.95rem' }}>{description}</p>
        </div>
        <div>
          <span style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', opacity: 0.6 }}>
            {t('ui:sources')}
          </span>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', opacity: 0.7 }}>
            {president.sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </div>
        <div className="hud-panel" style={{ padding: '1rem' }}>
          <span style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.6 }}>{t('audio')}</span>
          {audioSrc ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button className="ghost" onClick={handleAudioToggle}>
                {isPlaying ? t('pauseAudio') : t('playAudio')}
              </button>
              <audio ref={audioRef} src={audioSrc} preload="none" onEnded={() => setIsPlaying(false)} />
            </div>
          ) : (
            <div style={{ opacity: 0.5 }}>{t('audioUnavailable')}</div>
          )}
        </div>
        <div className="hud-panel" style={{ padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem' }}>
          <button className="ghost" onClick={handleCopy}>
            {linkCopied ? t('linkCopied') : t('copyLink')}
          </button>
          <span style={{ alignSelf: 'center', opacity: 0.5, fontSize: '0.75rem' }}>{shareUrl}</span>
        </div>
      </div>
    </div>,
    panelRoot()!,
  );
};

export default InfoPanel;
