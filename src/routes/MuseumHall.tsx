import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import useMuseumConfig from '../hooks/useMuseumConfig';
import PeopleGalleryHall from '../components/PeopleGalleryHall';

const MuseumHall = () => {
  const { hallId } = useParams<{ hallId: string }>();
  const { config, loading, error } = useMuseumConfig();

  useEffect(() => {
    if (hallId) {
      document.title = `ANAS Museum — ${hallId}`;
    }
  }, [hallId]);

  if (loading || !config) {
    return <div className="museum-shell" style={{ padding: '2rem' }}>Loading hall...</div>;
  }

  if (error) {
    return (
      <div className="museum-shell" style={{ padding: '2rem', color: '#f28f85' }}>
        {error}
      </div>
    );
  }

  const hall = config.halls.find((entry) => entry.id === hallId);

  if (!hall) {
    return <Navigate to="/museum" replace />;
  }

  switch (hall.type) {
    case 'people_gallery':
      return <PeopleGalleryHall hall={hall} />;
    default:
      return <Navigate to="/museum" replace />;
  }
};

export default MuseumHall;
