import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { ToastProvider } from './components/feedback.jsx';
import TopBar from './components/TopBar.jsx';
import { GameProvider } from './context/GameContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import GameScreen from './screens/GameScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import CommunityScreen from './screens/CommunityScreen.jsx';
import HowToPlayScreen from './screens/HowToPlayScreen.jsx';
import LoginScreen from './screens/LoginScreen.jsx';
import OfflineModesScreen from './screens/OfflineModesScreen.jsx';
import ProfileScreen from './screens/ProfileScreen.jsx';
import ResultsScreen from './screens/ResultsScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import SetupScreen from './screens/SetupScreen.jsx';
import SignupScreen from './screens/SignupScreen.jsx';
import StatsScreen from './screens/StatsScreen.jsx';
import { Spinner } from './components/ui.jsx';

// Online play (and the Supabase client) loads only when someone opens it.
const OnlineScreen = lazy(() => import('./screens/OnlineScreen.jsx'));
const RoomScreen = lazy(() => import('./screens/RoomScreen.jsx'));
const loading = (
  <div className="center-stack">
    <Spinner />
  </div>
);

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
      <ToastProvider>
        <GameProvider>
          <Router {...routerProps} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <div className="app">
              <Routes>
                <Route element={<WithTopBar />}>
                  <Route path="/" element={<HomeScreen />} />
                  <Route path="/offline" element={<OfflineModesScreen />} />
                  <Route path="/offline/:modeId" element={<SetupScreen />} />
                  <Route
                    path="/online"
                    element={
                      <Suspense fallback={loading}>
                        <OnlineScreen />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/room/:code"
                    element={
                      <Suspense fallback={loading}>
                        <RoomScreen />
                      </Suspense>
                    }
                  />
                  <Route path="/results" element={<ResultsScreen />} />
                  <Route path="/stats" element={<StatsScreen />} />
                  <Route path="/settings" element={<SettingsScreen />} />
                  <Route path="/how-to-play" element={<HowToPlayScreen />} />
                  <Route path="/profile" element={<ProfileScreen />} />
                  <Route path="/community" element={<CommunityScreen />} />
                </Route>
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/signup" element={<SignupScreen />} />
                <Route path="/play" element={<GameScreen />} />
                <Route path="/setup/:modeId" element={<LegacySetupRedirect />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </GameProvider>
      </ToastProvider>
    </SettingsProvider>
  );
}
