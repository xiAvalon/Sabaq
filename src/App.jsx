import { useEffect } from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom';
import TopBar from './components/TopBar.jsx';
import { GameProvider } from './context/GameContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import GameScreen from './screens/GameScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import HowToPlayScreen from './screens/HowToPlayScreen.jsx';
import OfflineModesScreen from './screens/OfflineModesScreen.jsx';
import OnlineScreen from './screens/OnlineScreen.jsx';
import ResultsScreen from './screens/ResultsScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import SetupScreen from './screens/SetupScreen.jsx';
import StatsScreen from './screens/StatsScreen.jsx';

// The hosted single-file demo uses an in-memory router; the normal build uses real URLs.
// eslint-disable-next-line no-undef
const IS_MEMORY = typeof __ROUTER__ !== 'undefined' && __ROUTER__ === 'memory';
const Router = IS_MEMORY ? MemoryRouter : BrowserRouter;
const routerProps = IS_MEMORY ? {} : { basename: import.meta.env.BASE_URL };

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function WithTopBar() {
  return (
    <>
      <TopBar />
      <Outlet />
    </>
  );
}

function LegacySetupRedirect() {
  const { modeId } = useParams();
  return <Navigate to={`/offline/${modeId}`} replace />;
}

export default function App() {
  return (
    <SettingsProvider>
      <GameProvider>
        <Router {...routerProps} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <div className="app">
            <Routes>
              <Route element={<WithTopBar />}>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/offline" element={<OfflineModesScreen />} />
                <Route path="/offline/:modeId" element={<SetupScreen />} />
                <Route path="/online" element={<OnlineScreen />} />
                <Route path="/results" element={<ResultsScreen />} />
                <Route path="/stats" element={<StatsScreen />} />
                <Route path="/settings" element={<SettingsScreen />} />
                <Route path="/how-to-play" element={<HowToPlayScreen />} />
              </Route>
              <Route path="/play" element={<GameScreen />} />
              <Route path="/setup/:modeId" element={<LegacySetupRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </GameProvider>
    </SettingsProvider>
  );
}
