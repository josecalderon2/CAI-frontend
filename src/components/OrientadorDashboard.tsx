import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  BookOpen,
  ClipboardList,
  FileText,
  Users,
  BarChart3,
  PlusCircle,
  Edit,
  Download,
  UserCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  orientadorDashboardService,
  type DashboardOrientadorData,
} from '../api/services/orientadorDashboardService';

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
  // Estado para los datos del dashboard
  const [dashboardData, setDashboardData] =
    useState<DashboardOrientadorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del dashboard al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener el ID del orientador del usuario
        const orientadorId = parseInt(user.id);
        
        // Cargar todos los datos del dashboard
        const data = await orientadorDashboardService.getDashboardData(
          orientadorId
        );
        
        setDashboardData(data);
      } catch (err) {
        console.error('Error cargando datos del dashboard:', err);
        setError(
          'No se pudieron cargar los datos del dashboard. Por favor, intenta de nuevo.'
        );
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [user.id]);

  // Mostrar loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error || !dashboardData) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-red-700">
                  {error || 'No se pudieron cargar los datos del dashboard'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extraer datos del dashboard
  const { estadisticas, cursosAsignados, evaluacionesRecientes } =
    dashboardData;

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
      action: () => onNavigate('calificaciones'),
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
                  {estadisticas.cursosAsignados}
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
                  {estadisticas.alumnosTotal}
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
                  {estadisticas.evaluacionesCreadas}
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
                  {estadisticas.notasPendientes}
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
              {cursosAsignados.length > 0 ? (
                cursosAsignados.map((curso) => (
                  <div
                    key={curso.id_curso}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium">
                        {curso.nombre}
                        {curso.seccion ? ` - Sección ${curso.seccion}` : ''}
                      </p>
                      <p className="text-sm text-gray-600">
                        {curso.asignaturas && curso.asignaturas.length > 0
                          ? curso.asignaturas
                              .map((a) => a.nombre)
                              .join(', ')
                          : 'Sin asignaturas'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {curso.alumnosCount || 0} alumnos
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          curso.activo
                            ? 'text-xs bg-green-50 text-green-700'
                            : 'text-xs'
                        }
                      >
                        {curso.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No tienes cursos asignados
                </p>
              )}
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
              {evaluacionesRecientes.length > 0 ? (
                evaluacionesRecientes.map((evaluacion) => (
                  <div
                    key={evaluacion.id_evaluacion}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{evaluacion.nombre}</p>
                      <p className="text-sm text-gray-600">
                        {evaluacion.asignatura.nombre}
                        {evaluacion.asignatura.curso
                          ? ` - ${evaluacion.asignatura.curso.nombre}`
                          : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(evaluacion.createdAt).toLocaleDateString(
                          'es-ES'
                        )}
                      </p>
                      {evaluacion.notasIngresadas !== undefined &&
                        evaluacion.totalAlumnos !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            {evaluacion.notasIngresadas} /{' '}
                            {evaluacion.totalAlumnos} calificaciones
                          </p>
                        )}
                    </div>
                    <Badge
                      variant={
                        evaluacion.estadoProgreso === 'Completada'
                          ? 'default'
                          : 'outline'
                      }
                      className={
                        evaluacion.estadoProgreso === 'Completada'
                          ? 'bg-green-100 text-green-800'
                          : evaluacion.estadoProgreso === 'En Progreso'
                            ? 'bg-blue-100 text-blue-800'
                            : evaluacion.estadoProgreso === 'Pendiente'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {evaluacion.estadoProgreso || 'Pendiente'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay evaluaciones recientes
                </p>
              )}
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
              onClick={() => onNavigate('calificaciones')}
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
