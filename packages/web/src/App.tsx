import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/layout/Layout';
import Home from './pages/Home';

const TripBuilderWorking = lazy(() => import('./pages/TripBuilderWorking'));
const Settings = lazy(() => import('./pages/Settings'));
const WaypointsWorking = lazy(() => import('./pages/WaypointsWorking'));
const InviteAcceptance = lazy(() => import('./pages/InviteAcceptanceSimple'));

// Component to conditionally render with or without Layout
function AppContent() {
  const location = useLocation();

  // If it's an invitation route, render without Layout
  if (location.pathname.startsWith('/invite/')) {
    return (
      <Routes>
        <Route path="/invite/:token" element={<InviteAcceptance />} />
      </Routes>
    );
  }

  // Otherwise, render with Layout
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/trip-builder" element={<TripBuilderWorking />} />
        <Route path="/waypoints" element={<WaypointsWorking />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sea"></div>
        </div>
      }>
        <AppContent />
      </Suspense>
    </Router>
  );
}

export default App