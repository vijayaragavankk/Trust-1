import { useEffect, useState } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const [user,     setUser]     = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // BUG FIX: was imported but auth/db/storage were missing from firebaseConfig exports
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setChecking(false);
    });
    return () => unsubscribe();
  }, []);

  if (checking) return <p style={{ padding: '2em', textAlign: 'center' }}>Checking auth…</p>;

  // BUG FIX: original redirected to '/admin' which doesn't exist as a route.
  // Correct target is '/admin/login'.
  if (!user) return <Navigate to="/admin/login" replace />;

  return children;
}

export default ProtectedRoute;
