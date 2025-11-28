import { Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Splash from './routes/Splash';
import Hall from './routes/Hall';
import { useMuseumStore } from './store/useMuseumStore';
import LanguageSync from './components/LanguageSync';
import MuseumHub from './routes/MuseumHub';
import MuseumHall from './routes/MuseumHall';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppRoutes = () => {
  const setCurrentPath = useMuseumStore((state) => state.setCurrentPath);
  const location = useLocation();

  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname, setCurrentPath]);

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/museum" element={<MuseumHub />} />
        <Route path="/museum/hall/:hallId" element={<MuseumHall />} />
        <Route path="/museum/hall/:hallId/art/:artId" element={<MuseumHall />} />
        <Route path="/hall" element={<Hall />} />
        <Route path="/hall/art/:id" element={<Hall />} />
        <Route path="*" element={<Navigate to="/museum" replace />} />
      </Routes>
    </Suspense>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <LanguageSync />
      <ScrollToTop />
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
