import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import TripBuilderWorking from './pages/TripBuilderWorking';
import Settings from './pages/Settings';
import AttractionsWorking from './pages/AttractionsWorking';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trip-builder" element={<TripBuilderWorking />} />
          <Route path="/attractions" element={<AttractionsWorking />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App