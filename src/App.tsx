import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

// Toaster
import { Toaster } from 'sonner';
import Snowfall from 'react-snowfall'; // Efecto de nieve`

import { Header } from './components/Header';
import LoginForm from './components/LoginForm';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminDashboard from './components/AdminDashboard';
import { UsuariosModule } from './components/UsuariosModule';
import { AlumnosModule } from './components/AlumnosModule';
import { OrientadorDashboard } from './components/OrientadorDashboard';
import ResetPassword from './components/ResetPassword';
import { AdministrativoDashboard } from './components/AdministrativoDashboard';
import { GradosAcademicosModule } from './components/GradosAcademicosModule';
import { CursosModule } from './components/CursosModule';
import { AsignaturasModule } from './components/AsignaturasModule';
import { AsignacionesModule } from './components/AsignacionesModule';
import { PerfilModule } from './components/PerfilModule';
import { AsistenciaModuleNew } from './components/AsistenciaModuleNew';
import { ConductaModule } from './components/ConductaModule';
import { CalificacionesModule } from './components/CalificacionesModule';
import { ConsultarEvaluacionesModule } from './components/ConsultarEvaluacionesModule';
import { EvaluacionesModule } from './components/EvaluacionesModule';
import { ReportesModule } from './components/ReportesModule';
import { BackupsModule } from './components/BackupsModule';

// ================= Helpers de auth =================
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

// ============== Home por rol (como el no oficial) ==============
function homeForRole(r?: string) {
  switch (r) {
    case 'Admin':
      return '/admin';
    case 'P.A':
      return '/pa';
    default:
      return '/';
  }
}

// ================== Dashboard genérico ==================
function Dashboard() {
  const u = getUser();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Solo redirigir si estamos en la ruta raíz
    if (location.pathname === '/') {
      // Redirigir según el rol del usuario
      if (u?.role === 'Admin') {
        navigate('/admin', { replace: true });
      } else if (u?.role === 'Orientador' || u?.role === 'orientador') {
        navigate('/orientador', { replace: true });
      } else if (u?.role === 'P.A') {
        navigate('/pa', { replace: true });
      }
    }
    if (u?.role === 'P.A' && location.pathname === '/') {
      navigate('/pa', { replace: true });
    }
  }, [u, location, navigate]);

  // No renderizar nada si el usuario va a ser redirigido
  if (u?.role === 'Admin' || u?.role === 'Orientador' || u?.role === 'P.A')
    return null;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">
        Bienvenido, {u?.nombre ?? 'Usuario'}
      </h2>
      <p className="text-gray-600">Rol: {u?.role ?? '—'}</p>
    </div>
  );
}

// ================= Wrapper para AsistenciaModule con location =================
function AsistenciaModuleWithLocation() {
  const location = useLocation();
  const user = getUser();

  // Usar location.search como key para forzar re-render cuando cambien los query params
  return <AsistenciaModuleNew key={location.search} user={user} />;
}

// ================= Shell (Header + rutas) =================
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
      if (uiUser?.role === 'admin') navigate('/admin');
      else if (uiUser?.role === 'orientador') navigate('/orientador');
      else if (uiUser?.role === 'P.A') navigate('/pa');
      else navigate('/');
    } else {
      // Separar la ruta de los query parameters si existen
      const [path, queryString] = section.split('?');
      const fullPath = queryString ? `/${path}?${queryString}` : `/${path}`;
      navigate(fullPath);
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

// =================== Pages por rol ===================
function AdminPage() {
  const navigate = useNavigate();
  const raw = getUser();

  if (!raw || raw.role !== 'Admin') {
    return <Navigate to={homeForRole(raw?.role)} replace />;
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

function AdministrativoPage() {
  const navigate = useNavigate();
  const raw = getUser();

  if (!raw || raw.role !== 'P.A') {
    return <Navigate to={homeForRole(raw?.role)} replace />;
  }

  const uiUser = {
    id: String(raw.id),
    name: raw.nombre ?? raw.email,
    email: raw.email,
    role: 'administrativo' as const,
  };

  const onNavigate = (section: string) =>
    navigate(section === 'dashboard' ? '/' : `/${section}`);

  return <AdministrativoDashboard user={uiUser} onNavigate={onNavigate} />;
}

function OrientadorDashboardWrapper() {
  const u = getUser();
  const navigate = useNavigate();

  // Verificar que el usuario esté autenticado y tenga el rol adecuado
  if (!u) {
    return <Navigate to="/login" replace />;
  }

  // Permitir acceso tanto si tiene rol Orientador (backend) como orientador (UI)
  if (u.role !== 'Orientador' && u.role !== 'orientador') {
    console.log(
      `Usuario con rol ${u.role} intentando acceder al dashboard de orientador`
    );
    return <Navigate to="/" replace />;
  }

  const uiUser = {
    id: String(u.id),
    name: u.nombre ?? u.email,
    email: u.email,
    role: 'docente' as const, // El componente OrientadorDashboard espera 'admin' o 'docente' como rol
  };

  const onNavigate = (section: string) => {
    // Separar la ruta de los query parameters si existen
    const [path, queryString] = section.split('?');
    const fullPath = queryString ? `/${path}?${queryString}` : `/${path}`;
    navigate(fullPath);
  };

  return <OrientadorDashboard user={uiUser} onNavigate={onNavigate} />;
}

function ReportesModuleWrapper() {
  const navigate = useNavigate();

  const onNavigate = (section: string) => {
    // Separar la ruta de los query parameters si existen
    const [path, queryString] = section.split('?');
    const fullPath = queryString ? `/${path}?${queryString}` : `/${path}`;
    navigate(fullPath);
  };

  return <ReportesModule onNavigate={onNavigate} />;
}

// ===================== Rutas =====================
function AppRoutes() {
  return (
    <Shell>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/reset-password" element={<ResetPassword />} />

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
              <OrientadorDashboardWrapper />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pa"
          element={
            <ProtectedRoute>
              <AdministrativoPage />
            </ProtectedRoute>
          }
        />

        {/* Alias legacy: /administrativo → /pa */}
        <Route path="/administrativo" element={<Navigate to="/pa" replace />} />

        <Route
          path="/usuarios"
          element={
            <ProtectedRoute>
              <UsuariosModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="/alumnos"
          element={
            <ProtectedRoute>
              <AlumnosModule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grados-academicos"
          element={
            <ProtectedRoute>
              <GradosAcademicosModule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cursos"
          element={
            <ProtectedRoute>
              <CursosModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="/asignaturas"
          element={
            <ProtectedRoute>
              <AsignaturasModule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/asignaciones"
          element={
            <ProtectedRoute>
              <AsignacionesModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="/conductas"
          element={
            <ProtectedRoute>
              <ConductaModule
                user={getUser()}
                readOnly={getUser()?.role === 'P.A'}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/consultar-evaluaciones"
          element={
            <ProtectedRoute>
              <ConsultarEvaluacionesModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="/evaluaciones"
          element={
            <ProtectedRoute>
              <EvaluacionesModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="/calificaciones"
          element={
            <ProtectedRoute>
              <CalificacionesModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <PerfilModule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/asistencia"
          element={
            <ProtectedRoute>
              <AsistenciaModuleWithLocation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reportes"
          element={
            <ProtectedRoute>
              <ReportesModuleWrapper />
            </ProtectedRoute>
          }
        />

        <Route
          path="/backups"
          element={
            <ProtectedRoute>
              <BackupsModule />
            </ProtectedRoute>
          }
        />

        {/* Catch-all manda a home del rol */}
        <Route
          path="*"
          element={<Navigate to={homeForRole(getUser()?.role)} replace />}
        />
      </Routes>
    </Shell>
  );
}

export default function App() {
  // Mostrar nieve solo entre el 20 de noviembre y el 10 de enero
  const shouldShowSnow = () => {
    const now = new Date();
    const month = now.getMonth(); // 0 = enero, 10 = noviembre
    const day = now.getDate();

    // Noviembre (mes 10) desde el día 20 en adelante
    if (month === 10 && day >= 20) return true;

    // Todo diciembre (mes 11)
    if (month === 11) return true;

    // Enero (mes 0) hasta el día 10
    if (month === 0 && day <= 10) return true;

    return false;
  };

  return (
    <Router>
      {shouldShowSnow() && (
        <Snowfall
          color="#4A90E2"
          snowflakeCount={150}
          speed={[0.5, 1.5]}
          wind={[-0.5, 1.0]}
          radius={[0.5, 3.0]}
          style={{
            position: 'fixed',
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
          }}
        />
      )}
      <AppRoutes />
      <Toaster richColors position="top-right" />
    </Router>
  );
}
