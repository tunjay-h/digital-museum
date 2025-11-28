import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { HallConfig, PeopleGalleryData, PeopleGalleryPerson } from '../types/museum';

interface PeopleGalleryHallProps {
  hall: HallConfig;
}

const fetchGallery = async (dataSrc: string, signal: AbortSignal) => {
  const response = await fetch(dataSrc, { signal });
  if (!response.ok) {
    throw new Error(`Unable to load hall data (${response.status})`);
  }
  const json = (await response.json()) as PeopleGalleryData;
  return json;
};

const PeopleGalleryHall = ({ hall }: PeopleGalleryHallProps) => {
  const { artId } = useParams<{ artId?: string }>();
  const navigate = useNavigate();
  const [gallery, setGallery] = useState<PeopleGalleryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(hall.dataSrc));
  const [selectedId, setSelectedId] = useState<string | null>(artId ?? null);

  useEffect(() => {
    if (!hall.dataSrc) {
      setError('This hall requires a data source.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchGallery(hall.dataSrc, controller.signal)
      .then((data) => {
        setGallery(data);
        setSelectedId((current) => current ?? data.people?.[0]?.id ?? null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Unable to load hall data');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [hall.dataSrc, hall.id]);

  useEffect(() => {
    if (artId) {
      setSelectedId(artId);
    }
  }, [artId]);

  const selectedPerson: PeopleGalleryPerson | null = useMemo(() => {
    if (!gallery?.people) return null;
    return gallery.people.find((person) => person.id === selectedId) ?? null;
  }, [gallery?.people, selectedId]);

  const handleSelect = (person: PeopleGalleryPerson) => {
    setSelectedId(person.id);
    navigate(`/museum/hall/${hall.id}/art/${person.id}`, { replace: false });
  };

  return (
    <div className="museum-shell">
      <section className="gallery-shell">
        <div className="gallery-header">
          <Link to="/museum">← Back to atrium</Link>
          <h1>{gallery?.title ?? hall.title}</h1>
          <p>{gallery?.subtitle ?? hall.summary}</p>
        </div>

        {loading && <p>Loading {hall.title}...</p>}
        {error && <p style={{ color: '#f28f85' }}>{error}</p>}

        {gallery?.people && gallery.people.length > 0 && (
          <>
            <div className="gallery-grid">
              {gallery.people.map((person) => (
                <article
                  key={person.id}
                  className={`person-card ${selectedId === person.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(person)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleSelect(person);
                    }
                  }}
                >
                  <header>
                    {person.image ? (
                      <img src={person.image} alt={person.name} />
                    ) : (
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 12,
                          background: 'linear-gradient(135deg, #243447, #16202e)',
                          border: '1px solid rgba(255,255,255,0.12)',
                        }}
                        aria-hidden
                      />
                    )}
                    <div className="meta">
                      <span className="name">{person.name}</span>
                      {person.role && <span className="role">{person.role}</span>}
                      {person.years && <span className="years">{person.years}</span>}
                    </div>
                  </header>
                  {person.summary && <p className="summary">{person.summary}</p>}
                </article>
              ))}
            </div>

            {selectedPerson && (
              <div className="person-detail">
                <h2>{selectedPerson.name}</h2>
                {selectedPerson.role && <p>{selectedPerson.role}</p>}
                {selectedPerson.years && <p>{selectedPerson.years}</p>}
                {selectedPerson.bio && <p>{selectedPerson.bio}</p>}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default PeopleGalleryHall;
