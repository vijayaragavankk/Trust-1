import { useEffect } from 'react';
import Home from './Home';

// Renders Home and scrolls to the donate section after mount.
// This is the reliable approach with React Router BrowserRouter.
const DonatePage = () => {
  useEffect(() => {
    // Small delay to let the Home component fully render first
    const timer = setTimeout(() => {
      const el = document.getElementById('donate-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return <Home />;
};

export default DonatePage;
