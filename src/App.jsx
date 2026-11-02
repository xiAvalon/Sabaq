import { useEffect } from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { GameProvider } from './context/GameContext.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import SetupScreen from './screens/SetupScreen.jsx';
import GameScreen from './screens/GameScreen.jsx';
import ResultsScreen from './screens/ResultsScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import HowToPlayScreen from './screens/HowToPlayScreen.jsx';
import StatsScreen from './screens/StatsScreen.jsx';

// The hosted single-file demo uses an in-memory router; the normal build uses real URLs.
// eslint-disable-next-line no-undef
const Router = typeof __ROUTER__ !== 'undefined' && __ROUTER__ === 'memory' ? MemoryRouter : BrowserRouter;

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <SettingsProvider>
      <GameProvider>
        <Router basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <div className="app">
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/setup/:modeId" element={<SetupScreen />} />
              <Route path="/play" element={<GameScreen />} />
              <Route path="/results" element={<ResultsScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/how-to-play" element={<HowToPlayScreen />} />
              <Route path="/stats" element={<StatsScreen />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </GameProvider>
    </SettingsProvider>
  );
}
