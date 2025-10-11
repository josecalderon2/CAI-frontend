//import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  BookOpen,
  ClipboardList,
  FileText,
  //Calendar,
  Users,
  BarChart3,
  PlusCircle,
  Edit,
  Download,
  //CheckCircle,
  UserCheck,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'docente';
}

interface OrientadorDashboardProps {
  user: User;
  onNavigate: (section: string) => void;
}

export function OrientadorDashboard({
  user,
  onNavigate,
}: OrientadorDashboardProps) {
  // Datos simulados para el dashboard del orientador
  const stats = {
    cursosAsignados: 4,
    evaluacionesCreadas: 12,
    notasPendientes: 6,
    alumnosTotal: 120,
    promedioGeneral: 7.8,
    evaluacionesEstesMes: 8,
  };

  const cursosAsignados = [
    { id: 1, nombre: '3° Básico A', asignatura: 'Matemáticas', alumnos: 30 },
    { id: 2, nombre: '4° Básico B', asignatura: 'Matemáticas', alumnos: 28 },
    { id: 3, nombre: '5° Básico A', asignatura: 'Ciencias', alumnos: 32 },
    { id: 4, nombre: '6° Básico C', asignatura: 'Ciencias', alumnos: 30 },
  ];

  const evaluacionesRecientes = [
    {
      id: 1,
      nombre: 'Prueba Unidad 3',
      curso: '3° Básico A',
      fecha: '2024-01-15',
      estado: 'Completada',
    },
    {
      id: 2,
      nombre: 'Evaluación Formativa',
      curso: '4° Básico B',
      fecha: '2024-01-18',
      estado: 'Pendiente',
    },
    {
      id: 3,
      nombre: 'Examen Semestral',
      curso: '5° Básico A',
      fecha: '2024-01-20',
      estado: 'En Progreso',
    },
    {
      id: 4,
      nombre: 'Trabajo Práctico',
      curso: '6° Básico C',
      fecha: '2024-01-22',
      estado: 'Planificada',
    },
  ];

  const quickActions = [
    {
      title: 'Tomar Asistencia',
      description: 'Registrar asistencia de alumnos por curso',
      icon: UserCheck,
      color: 'bg-blue-600',
      action: () => onNavigate('asistencia'),
    },
    {
      title: 'Crear Evaluación',
      description: 'Crear una nueva evaluación para tus cursos',
      icon: PlusCircle,
      color: 'bg-green-600',
      action: () => onNavigate('evaluaciones'),
    },
    {
      title: 'Ingresar Notas',
      description: 'Registrar calificaciones de evaluaciones',
      icon: Edit,
      color: 'bg-orange-600',
      action: () => onNavigate('notas'),
    },
    {
      title: 'Generar Reportes',
      description: 'Crear reportes de rendimiento académico',
      icon: FileText,
      color: 'bg-purple-600',
      action: () => onNavigate('reportes'),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Docente
          </h1>
          <p className="text-gray-600 mt-1">Bienvenido/a, {user.name}</p>
        </div>
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          Docente
        </Badge>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cursos Asignados</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.cursosAsignados}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Alumnos</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.alumnosTotal}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Evaluaciones</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.evaluacionesCreadas}
                </p>
              </div>
              <ClipboardList className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Notas Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.notasPendientes}
                </p>
              </div>
              <Edit className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={action.action}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div
                    className={`${action.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}
                  >
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {action.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cursos asignados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <span>Mis Cursos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cursosAsignados.map((curso) => (
                <div
                  key={curso.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium">{curso.nombre}</p>
                    <p className="text-sm text-gray-600">{curso.asignatura}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {curso.alumnos} alumnos
                    </p>
                    <Badge variant="outline" className="text-xs">
                      Activo
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Evaluaciones recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ClipboardList className="w-5 h-5" />
              <span>Evaluaciones Recientes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {evaluacionesRecientes.map((evaluacion) => (
                <div
                  key={evaluacion.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{evaluacion.nombre}</p>
                    <p className="text-sm text-gray-600">{evaluacion.curso}</p>
                    <p className="text-xs text-gray-500">{evaluacion.fecha}</p>
                  </div>
                  <Badge
                    variant={
                      evaluacion.estado === 'Completada' ? 'default' : 'outline'
                    }
                    className={
                      evaluacion.estado === 'Completada'
                        ? 'bg-green-100 text-green-800'
                        : evaluacion.estado === 'En Progreso'
                          ? 'bg-blue-100 text-blue-800'
                          : evaluacion.estado === 'Pendiente'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {evaluacion.estado}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accesos directos adicionales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Herramientas Rápidas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => onNavigate('asistencia')}
            >
              <div className="text-left">
                <div className="flex items-center space-x-2 mb-1">
                  <UserCheck className="w-4 h-4" />
                  <span className="font-medium">Tomar Asistencia</span>
                </div>
                <p className="text-xs text-gray-500">Registrar asistencia</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => onNavigate('evaluaciones')}
            >
              <div className="text-left">
                <div className="flex items-center space-x-2 mb-1">
                  <PlusCircle className="w-4 h-4" />
                  <span className="font-medium">Nueva Evaluación</span>
                </div>
                <p className="text-xs text-gray-500">Crear evaluación</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => onNavigate('notas')}
            >
              <div className="text-left">
                <div className="flex items-center space-x-2 mb-1">
                  <Edit className="w-4 h-4" />
                  <span className="font-medium">Ingresar Notas</span>
                </div>
                <p className="text-xs text-gray-500">
                  Registrar calificaciones
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => onNavigate('reportes')}
            >
              <div className="text-left">
                <div className="flex items-center space-x-2 mb-1">
                  <Download className="w-4 h-4" />
                  <span className="font-medium">Descargar Reportes</span>
                </div>
                <p className="text-xs text-gray-500">PDF y Excel</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
