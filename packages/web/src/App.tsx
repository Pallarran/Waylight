import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/layout/Layout';
import Home from './pages/Home';

const TripBuilderWorking = lazy(() => import('./pages/TripBuilderWorking'));
const Settings = lazy(() => import('./pages/Settings'));
const WaypointsWorking = lazy(() => import('./pages/WaypointsWorking'));

function App() {
  return (
    <Router>
      <Layout>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sea"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/trip-builder" element={<TripBuilderWorking />} />
            <Route path="/waypoints" element={<WaypointsWorking />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}

export default App