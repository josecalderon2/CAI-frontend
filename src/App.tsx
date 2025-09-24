import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import type { ReactNode } from 'react';

import { Header } from './components/Header';
import LoginForm from './components/LoginForm';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminDashboard from './components/AdminDashboard';

// Helpers de auth
function getUser() {
  const raw = localStorage.getItem('user');
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function isAuthenticated() {
  return !!localStorage.getItem('access_token');
}
function clearAuth() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}

// Dashboard de prueba (usuarios que no son admin)
function Dashboard() {
  const u = getUser();
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">
        Bienvenido, {u?.nombre ?? 'Usuario'}
      </h2>
      <p className="text-gray-600">Rol: {u?.role ?? '—'}</p>
    </div>
  );
}

// Shell (Header + rutas)
function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isLogin = location.pathname === '/login';
  const hasSession = isAuthenticated();
  const user = getUser();

  const mapRoleToFront = (r?: string) => {
    if (r === 'Admin') return 'admin';
    if (r === 'P.A') return 'administrativo';
    if (r === 'Orientador') return 'docente';
    return 'docente';
  };

  const uiUser =
    user && hasSession
      ? {
          id: String(user.id),
          name: user.nombre ?? user.email,
          email: user.email,
          role: mapRoleToFront(user.role) as
            | 'admin'
            | 'docente'
            | 'administrativo',
        }
      : null;

  const currentSection = location.pathname.replace('/', '') || 'dashboard';

  const handleNavigate = (section: string) => {
    navigate(section === 'dashboard' ? '/' : `/${section}`);
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {!isLogin && hasSession && uiUser && (
        <Header
          user={uiUser}
          currentSection={currentSection}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}
      {children}
    </>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  const raw = getUser();

  if (!raw || raw.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  const uiUser = {
    id: String(raw.id),
    name: raw.nombre ?? raw.email,
    email: raw.email,
    role: 'admin' as const,
  };

  const onNavigate = (section: string) =>
    navigate(section === 'dashboard' ? '/' : `/${section}`);

  return <AdminDashboard user={uiUser} onNavigate={onNavigate} />;
}

function AppRoutes() {
  return (
    <Shell>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
