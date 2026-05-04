// === FILE: client/src/App.jsx ===
import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import JoinSession from './pages/JoinSession';
import LiveSession from './pages/LiveSession';
import StudentApp from './pages/StudentApp';
import FacultyApp from './pages/FacultyApp';
import ProtectedRoute from './components/ProtectedRoute';
import SplashIntro from './components/SplashIntro';

const SPLASH_KEY = 'eduscope_splash_shown';

export default function App() {
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(() => {
    if (location.pathname !== '/') return false;
    return !sessionStorage.getItem(SPLASH_KEY);
  });

  useEffect(() => {
    document.body.style.overflow = showSplash ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showSplash]);

  const done = () => { sessionStorage.setItem(SPLASH_KEY, '1'); setShowSplash(false); };

  return (
    <>
      <AnimatePresence>{showSplash && <SplashIntro key="splash" onComplete={done}/>}</AnimatePresence>
      <Routes>
        <Route path="/"              element={<Landing/>}/>
        <Route path="/auth"          element={<Auth/>}/>
        <Route path="/join"          element={<JoinSession/>}/>
        <Route path="/live-session"  element={<LiveSession/>}/>
        <Route path="/student/*"     element={<ProtectedRoute role="student"><StudentApp/></ProtectedRoute>}/>
        <Route path="/faculty/*"     element={<ProtectedRoute role="faculty"><FacultyApp/></ProtectedRoute>}/>
        <Route path="*"              element={<Landing/>}/>
      </Routes>
    </>
  );
}
