// src/App.jsx
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import Header from './components/Header';
import Footer from './components/Footer';

import Home         from './pages/Home';
import AboutPage    from './pages/About';
import ServicesPage from './pages/ServicesPage';
import ContactPage  from './pages/Contact';
import DonatePage   from './pages/Donate';
import OurWork      from './pages/OurWork';
import Volunteer    from './pages/Volunteer';

import AdminLogin     from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import ProtectedRoute from './admin/ProtectedRoute';

const NotFound = () => (
  <div style={{ padding: '6em 2em', textAlign: 'center', color: '#ccc' }}>
    <h1 style={{ fontSize: '3rem', color: '#00c8ff' }}>404</h1>
    <p style={{ fontSize: '1.2rem' }}>Page not found.</p>
    <a href="/" style={{ color: '#00c8ff', textDecoration: 'underline' }}>Go Home</a>
  </div>
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppLayout() {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <div className="app dark-mode">
      <ScrollToTop />
      {!isAdminRoute && <Header />}
      <main>
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/about"       element={<AboutPage />} />
          <Route path="/services"    element={<ServicesPage />} />
          <Route path="/our-work"    element={<OurWork />} />
          <Route path="/contact"     element={<ContactPage />} />
          <Route path="/donate"      element={<DonatePage />} />
          <Route path="/volunteer"   element={<Volunteer />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
