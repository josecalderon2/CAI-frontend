import { Navigate } from 'react-router-dom';
import React from 'react';

// Simulación de autenticación (reemplaza por tu lógica real)
const isAuthenticated = () => {
  // Por ejemplo, verifica si hay un token en localStorage
  // return !!localStorage.getItem('token');
  return false; // Cambia esto por tu lógica real
};

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    // Si no está autenticado, redirige al login
    return <Navigate to="/" replace />;
  }
  // Si está autenticado, muestra el contenido protegido
  return <>{children}</>;
}
