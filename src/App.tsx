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
import { UsuariosModule } from './components/UsuariosModule';


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
import { useEffect } from 'react';
function Dashboard() {
  const u = getUser();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Si el usuario es admin y está en '/', redirige a /admin
    if (u?.role === 'Admin' && location.pathname === '/') {
      navigate('/admin', { replace: true });
    }
  }, [u, location, navigate]);

  // Si es admin, no renderiza nada aquí (será redirigido)
  if (u?.role === 'Admin') return null;

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

  const mapRoleToUserRole = (r?: string) => {
    if (r === 'Admin') return 'admin';
    if (r === 'P.A') return 'P.A';
    if (r === 'Orientador') return 'orientador';
    return 'orientador';
  };

  const uiUser =
    user && hasSession
      ? {
          id: String(user.id),
          name: user.nombre ?? user.email,
          email: user.email,
          role: mapRoleToUserRole(user.role) as 'admin' | 'orientador' | 'P.A',
        }
      : null;

  const currentSection = location.pathname.replace('/', '') || 'dashboard';

  const handleNavigate = (section: string) => {
    if (section === 'dashboard') {
      if (uiUser?.role === 'admin') {
        navigate('/admin');
      } else if (uiUser?.role === 'orientador') {
        navigate('/orientador');
      } else if (uiUser?.role === 'P.A') {
        navigate('/pa');
      } else {
        navigate('/');
      }
    } else {
      navigate(`/${section}`);
    }
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

function OrientadorDashboard() {
  const u = getUser();
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">
        Bienvenido, {u?.nombre ?? 'Orientador'}
      </h2>
      <p className="text-gray-600">Rol: Orientador</p>
      <p className="mt-4">Este es el dashboard para orientadores.</p>
    </div>
  );
}

function PADashboard() {
  const u = getUser();
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">
        Bienvenido, {u?.nombre ?? 'Personal Administrativo'}
      </h2>
      <p className="text-gray-600">Rol: Personal Administrativo</p>
      <p className="mt-4">Este es el dashboard para personal administrativo.</p>
    </div>
  );
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
        <Route
          path="/orientador"
          element={
            <ProtectedRoute>
              <OrientadorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pa"
          element={
            <ProtectedRoute>
              <PADashboard />
            </ProtectedRoute>
          }
        />
       <Route
        path="/usuarios"
        element={
          <ProtectedRoute>
            <UsuariosModule />
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
