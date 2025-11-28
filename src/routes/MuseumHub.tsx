import React from 'react';
import { Link } from 'react-router-dom';
import useMuseumConfig from '../hooks/useMuseumConfig';
import type { HallConfig } from '../types/museum';

const portalPosition = (index: number, total: number, radius: number) => {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  return { x, y };
};

const HallPortal = ({ hall, index, total }: { hall: HallConfig; index: number; total: number }) => {
  const radius = Math.max(120, Math.min(240, 260 - total * 8));
  const { x, y } = portalPosition(index, total, radius);

  return (
    <Link
      to={`/museum/hall/${hall.id}`}
      className="hall-portal"
      style={{ transform: `translate(${x}px, ${y}px)`, '--x': `${x}px`, '--y': `${y}px` } as React.CSSProperties}
    >
      <span className="icon">{hall.icon ?? 'hall'}</span>
      <span className="label">{hall.title}</span>
      {hall.summary && <span className="summary">{hall.summary}</span>}
    </Link>
  );
};

const MuseumHub = () => {
  const { config, loading, error } = useMuseumConfig();

  if (loading || !config) {
    return (
      <div className="museum-shell">
        <div className="hub-hero">
          <p>Loading ANAS museum...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="museum-shell">
        <div className="hub-hero">
          <p style={{ color: '#f28f85' }}>{error}</p>
        </div>
      </div>
    );
  }

  const { hub, halls } = config;
  const validHalls = halls ?? [];

  return (
    <div className="museum-shell">
      <section className="hub-hero">
        <div className="hub-header">
          <img src={hub.flagSrc} alt="Azerbaijan flag" className="flag" />
          <div>
            <h1>{hub.title}</h1>
            {hub.subtitle && <p>{hub.subtitle}</p>}
          </div>
        </div>
        <div className="hub-plane">
          <div className="hub-circle">
            <div className="hub-emblem" aria-label="ANAS Emblem">
              <img src={hub.emblemSrc} alt="ANAS emblem" />
            </div>
            <div className="hub-flag-stand" aria-hidden>
              <div className="pole" />
              <img src={hub.flagSrc} alt="Azerbaijan flag" />
            </div>
            {validHalls.map((hall, index) => (
              <HallPortal key={hall.id} hall={hall} index={index} total={validHalls.length} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MuseumHub;
