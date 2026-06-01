import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import Header from './components/Header';
import Footer from './components/Footer';

import Home        from './pages/Home';
import AboutPage   from './pages/About';
import ServicesPage from './pages/ServicesPage';
import ContactPage  from './pages/Contact';
import DonatePage   from './pages/Donate';
import OurWork      from './pages/OurWork';

import AdminLogin     from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import ProtectedRoute from './admin/ProtectedRoute';

// 404 page
const NotFound = () => (
  <div style={{ padding: '4em', textAlign: 'center', color: '#f00' }}>
    <h1>404 – Page Not Found</h1>
    <p>The page you&apos;re looking for does not exist.</p>
  </div>
);

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function App() {
  return (
    <Router>
      <div className="app dark-mode">
        <ScrollToTop />
        <Header />
        <main>
          <Routes>
            {/* Public pages */}
            <Route path="/"        element={<Home />} />
            <Route path="/about"   element={<AboutPage />} />
            {/* BUG FIX: /services now renders ServicesPage (was same as OurWork) */}
            <Route path="/services"  element={<ServicesPage />} />
            <Route path="/our-work"  element={<OurWork />} />
            <Route path="/contact"   element={<ContactPage />} />
            <Route path="/donate"    element={<DonatePage />} />

            {/* Admin routes */}
            <Route path="/admin/login"     element={<AdminLogin />} />
            {/* BUG FIX: redirect was /admin (not /admin/login); route is now correct */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
