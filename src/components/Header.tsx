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
  Settings,
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
} from 'lucide-react';

import logo from '../../public/logoCai.png';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'docente' | 'administrativo';
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
    { id: 'cursos', label: 'Cursos', icon: School },
    { id: 'asignaciones', label: 'Asignaciones', icon: ClipboardList },
    { id: 'reportes', label: 'Reportes', icon: FileText },
  ];

  const docenteMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'evaluaciones', label: 'Evaluaciones', icon: Calendar },
    { id: 'notas', label: 'Notas', icon: Edit },
    { id: 'reportes', label: 'Reportes', icon: FileText },
  ];

  const administrativoMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'alumnos', label: 'Alumnos', icon: GraduationCap },
    { id: 'asignaturas', label: 'Asignaturas', icon: BookOpen },
    { id: 'cursos', label: 'Cursos', icon: School },
    { id: 'asignaciones', label: 'Asignaciones', icon: ClipboardList },
    { id: 'reportes', label: 'Reportes', icon: FileText },
  ];

  const getMenuItems = () => {
    switch (user.role) {
      case 'admin':
        return adminMenuItems;
      case 'docente':
        return docenteMenuItems;
      case 'administrativo':
        return administrativoMenuItems;
      default:
        return docenteMenuItems;
    }
  };

  const menuItems = getMenuItems();

  const getCurrentSectionTitle = () => {
    const section = menuItems.find((item) => item.id === currentSection);
    if (section) return section.label;

    switch (currentSection) {
      case 'perfil':
        return 'Perfil';
      case 'configuracion':
        return 'Configuración';
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
                  Colegio Amigos de Israel
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
                    {user.role === 'administrativo'
                      ? 'Personal Administrativo'
                      : user.role}
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
              {user.role === 'admin' && (
                <DropdownMenuItem onClick={() => onNavigate('configuracion')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración
                </DropdownMenuItem>
              )}
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
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={currentSection === item.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onNavigate(item.id)}
              className={
                currentSection === item.id ? 'bg-blue-600 text-white' : ''
              }
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
            </Button>
          ))}
        </div>
      </nav>

      {/* Menú móvil */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200">
          <nav className="px-4 py-2 space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={currentSection === item.id ? 'default' : 'ghost'}
                size="sm"
                className={`w-full justify-start ${currentSection === item.id ? 'bg-blue-600 text-white' : ''}`}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
