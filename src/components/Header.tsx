import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  User as UserIcon,
  LogOut,
  Home,
  Menu,
  X,
  Users,
  GraduationCap,
  BookOpen,
  School,
  ClipboardList,
  FileText,
  Calendar,
  Edit,
  UserCheck,
  Award,
} from 'lucide-react';

import logo from '../../public/logoCai.png';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'orientador' | 'P.A';
}

interface HeaderProps {
  user: User;
  currentSection: string;
  onNavigate: (section: string) => void;
  onLogout: () => void;
}

export function Header({
  user,
  currentSection,
  onNavigate,
  onLogout,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'alumnos', label: 'Alumnos', icon: GraduationCap },
    { id: 'asignaturas', label: 'Asignaturas', icon: BookOpen },
    { id: 'grados-academicos', label: 'Grados', icon: Award },
    { id: 'cursos', label: 'Cursos', icon: School },
    { id: 'asignaciones', label: 'Asignaciones', icon: ClipboardList },
    { id: 'conductas', label: 'Conductas', icon: UserCheck },
    {
      id: 'consultar-evaluaciones',
      label: 'Consultar Evaluaciones',
      icon: Calendar,
    },
    { id: 'reportes', label: 'Reportes', icon: FileText },
  ];

  const orientadorMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'asistencia', label: 'Asistencia', icon: UserCheck },
    { id: 'evaluaciones', label: 'Evaluaciones', icon: Calendar },
    { id: 'notas', label: 'Notas', icon: Edit },
    { id: 'reportes', label: 'Reportes', icon: FileText },
  ];

  const paMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'alumnos', label: 'Alumnos', icon: GraduationCap },
    { id: 'asignaturas', label: 'Asignaturas', icon: BookOpen },
    { id: 'grados-academicos', label: 'Grados', icon: Award },
    { id: 'cursos', label: 'Cursos', icon: School },
    { id: 'asignaciones', label: 'Asignaciones', icon: ClipboardList },
    {
      id: 'consultar-evaluaciones',
      label: 'Consultar Evaluaciones',
      icon: Calendar,
    },
    { id: 'reportes', label: 'Reportes', icon: FileText },
  ];

  const getMenuItems = () => {
    switch (user.role) {
      case 'admin':
        return adminMenuItems;
      case 'orientador':
        return orientadorMenuItems;
      case 'P.A':
        return paMenuItems;
      default:
        return orientadorMenuItems;
    }
  };

  const menuItems = getMenuItems();

  const getCurrentSectionTitle = () => {
    const section = menuItems.find((item) => item.id === currentSection);
    if (section) return section.label;

    switch (currentSection) {
      case 'perfil':
        return 'Perfil';
      case 'asistencia':
        return 'Asistencia';
      case 'conductas':
        return 'Conductas';
      case 'consultar-evaluaciones':
        return 'Consultar Evaluaciones';
      default:
        return 'Dashboard';
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo y título */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img
                  src={logo}
                  alt="Colegio Amigos de Israel"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      'none';
                  }}
                />
                {/* Fallback si no hay logo */}
                {!logo && (
                  <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    SG
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">
                  Sistema de Gestión Académica
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">
                  Colegio Amigos de Israel <strong> - CAI </strong>
                </p>
              </div>
            </div>
          </div>

          {/* Sección actual (desktop) */}
          <div className="hidden lg:flex items-center space-x-2">
            <span className="text-gray-500">Módulo actual:</span>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              {getCurrentSectionTitle()}
            </Badge>
          </div>

          {/* Menú de usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-2 hover:bg-gray-100"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden md:block">
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.role === 'P.A'
                      ? 'Personal Administrativo'
                      : user.role === 'orientador'
                        ? 'Orientador'
                        : 'Administrador'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate('perfil')}>
                <UserIcon className="w-4 h-4 mr-2" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Navegación horizontal (desktop) */}
      <nav className="hidden lg:block bg-gray-50 border-b border-gray-200 px-4 py-2">
        <div className="flex space-x-1">
          {menuItems.map((item) => {
            // Detecta si el dashboard está activo según la ruta y el rol
            let isActive = false;
            if (item.id === 'dashboard') {
              if (
                (user.role === 'admin' &&
                  window.location.pathname === '/admin') ||
                (user.role === 'orientador' &&
                  window.location.pathname === '/orientador') ||
                (user.role === 'P.A' && window.location.pathname === '/pa')
              ) {
                isActive = true;
              }
            } else if (
              item.id === 'asistencia' &&
              window.location.pathname === '/asistencia'
            ) {
              isActive = true;
            } else if (
              item.id === 'conductas' &&
              window.location.pathname === '/conductas'
            ) {
              isActive = true;
            } else if (
              item.id === 'consultar-evaluaciones' &&
              window.location.pathname === '/consultar-evaluaciones'
            ) {
              isActive = true;
            } else {
              isActive = currentSection === item.id;
            }
            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onNavigate(item.id)}
                className={
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'hover:bg-gray-100'
                }
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Menú móvil */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200">
          <nav className="px-4 py-2 space-y-1">
            {menuItems.map((item) => {
              // Determinar si el ítem está activo
              let isActive = false;
              if (item.id === 'dashboard') {
                if (
                  (user.role === 'admin' &&
                    window.location.pathname === '/admin') ||
                  (user.role === 'orientador' &&
                    window.location.pathname === '/orientador') ||
                  (user.role === 'P.A' && window.location.pathname === '/pa')
                ) {
                  isActive = true;
                }
              } else if (
                item.id === 'asistencia' &&
                window.location.pathname === '/asistencia'
              ) {
                isActive = true;
              } else if (
                item.id === 'conductas' &&
                window.location.pathname === '/conductas'
              ) {
                isActive = true;
              } else if (
                item.id === 'consultar-evaluaciones' &&
                window.location.pathname === '/consultar-evaluaciones'
              ) {
                isActive = true;
              } else {
                isActive = currentSection === item.id;
              }

              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={`w-full justify-start ${isActive ? 'bg-blue-600 text-white' : ''}`}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
