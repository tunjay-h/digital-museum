import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import presidents from '../data/presidents';
import { useMuseumStore } from '../store/useMuseumStore';
import type { President } from '../types';

const panelRoot = () => document.getElementById('root');

const extractYear = (value: string) => {
  const match = value.match(/\d{4}/);
  return match ? match[0] : value;
};

const formatTerm = (president: President, t: TFunction) => {
  const start = extractYear(president.term_start);
  const endValue = president.term_end.toLowerCase();

  if (endValue === 'present') {
    return `${start} — ${t('museum:info.termPresent')}`;
  }

  return `${start} — ${extractYear(president.term_end)}`;
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
  const [isCompactLayout, setIsCompactLayout] = useState(false);

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

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      const { innerWidth, innerHeight } = window;
      setIsCompactLayout(innerWidth <= 900 || innerHeight <= 520);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  if (!isOpen || !president) {
    return null;
  }

  const name = language === 'az' ? president.name_az : president.name_en;
  const description = language === 'az' ? president.description_az : president.description_en;
  const term = formatTerm(president, t);
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
        inset: isCompactLayout ? 'auto 1rem 1rem 1rem' : 'auto 2rem 2rem auto',
        width: isCompactLayout ? 'min(340px, 92vw)' : 'min(420px, 90vw)',
        padding: isCompactLayout ? '1.5rem' : '2rem',
        pointerEvents: 'auto',
        maxHeight: isCompactLayout ? '70vh' : '80vh',
        overflowY: 'auto',
      }}
    >
      <button
        className="ghost"
        onClick={closeInfoPanel}
        style={{ position: 'absolute', right: '1.25rem', top: '1.25rem' }}
      >
        {t('close')}
      </button>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isCompactLayout ? '0.75rem' : '1rem',
        }}
      >
        <div>
          <span style={{ opacity: 0.6, fontSize: isCompactLayout ? '0.75rem' : '0.8rem' }}>
            {t('museum:info.term')}
          </span>
          <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600 }}>{term}</p>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: isCompactLayout ? '1.5rem' : '1.8rem' }}>{name}</h3>
          <p style={{ opacity: 0.7, fontSize: isCompactLayout ? '0.9rem' : '0.95rem' }}>{description}</p>
        </div>
        <div className="hud-panel" style={{ padding: isCompactLayout ? '0.85rem' : '1rem' }}>
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
        <div
          className="hud-panel"
          style={{
            padding: isCompactLayout ? '0.75rem 0.9rem' : '0.85rem 1rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          <button className="ghost" onClick={handleCopy}>
            {linkCopied ? t('linkCopied') : t('copyLink')}
          </button>
          <span
            style={{
              opacity: 0.5,
              fontSize: '0.75rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {shareUrl}
          </span>
        </div>
      </div>
    </div>,
    panelRoot()!,
  );
};

export default InfoPanel;
