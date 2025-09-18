import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import ExampleComponent from './components/ExampleComponent/ExampleComponent';
import Navbar from './components/Navbar/Navbar';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/example" element={<ExampleComponent />} />
        {/* Ejemplo de ruta protegida:
            Para proteger una ruta, crea un componente "ProtectedRoute" que verifique la autenticación.
            Ejemplo:

            import ProtectedRoute from './components/ProtectedRoute';

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            El componente ProtectedRoute debe validar si el usuario está autenticado y redirigir si no lo está.
        */}
        {/* Agrega aquí más rutas según crezcas el proyecto */}
      </Routes>
    </Router>
  );
}

export default App;
