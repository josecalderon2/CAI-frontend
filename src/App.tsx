import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom';

import { Header } from './components/Header';
import LoginForm from './components/LoginForm';

// Este componente vive bajo el Router y controla el Header + Rutas
function AppWrapper() {
  const navigate = useNavigate();
  const location = useLocation();

  // Usuario falso de prueba
  const user = {
    id: '1',
    name: 'Miguel',
    email: 'miguel@example.com',
    role: 'admin' as const,
  };

  // Manejo de navegación desde el Header
  const handleNavigate = (section: string) => {
    navigate(section === 'dashboard' ? '/' : `/${section}`);
  };

  const handleLogout = () => {
    alert('Sesión cerrada ✅');
    navigate('/');
  };

  // Marca la sección actual según la URL
  const currentSection = location.pathname.replace('/', '') || 'dashboard';

  return (
    <>
      <Header
        user={user}
        currentSection={currentSection}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      {/*Todas las rutas */}
      <Routes>
             <Route path="/" element={<LoginForm />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
