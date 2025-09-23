import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

function isAuthenticated() {
  return !!localStorage.getItem('access_token');
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
