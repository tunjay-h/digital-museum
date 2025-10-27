import { Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Splash from './routes/Splash';
import Hall from './routes/Hall';
import { useMuseumStore } from './store/useMuseumStore';
import LanguageSync from './components/LanguageSync';

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
        <Route path="/hall" element={<Hall />} />
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
