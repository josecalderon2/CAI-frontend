import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  FileText,
  School,
  ClipboardList,
  UserPlus,
  Plus,
  BarChart3,
  Shield,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  administrativoDashboardService,
  type DashboardAdministrativoData,
} from '../api/services/administrativoDashboardService';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'docente' | 'administrativo';
}

interface AdministrativoDashboardProps {
  user: User;
  onNavigate: (section: string) => void;
}

export function AdministrativoDashboard({
  user,
  onNavigate,
}: AdministrativoDashboardProps) {
  // Estado para los datos del dashboard
  const [dashboardData, setDashboardData] =
    useState<DashboardAdministrativoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del dashboard al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        const data =
          await administrativoDashboardService.getDashboardData();

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
  }, []);

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

  // Extraer datos
  const { estadisticas, actividadesRecientes, resumenMensual, tareasPendientes } =
    dashboardData;

  // Construir las cards de estadísticas con datos reales
  const statsCards = [
    {
      title: 'Total Alumnos',
      value: estadisticas.totalAlumnos.toString(),
      change: `+${estadisticas.cambioAlumnos}`,
      changeType: 'positive' as const,
      icon: Users,
      description: 'Estudiantes activos',
    },
    {
      title: 'Cursos Activos',
      value: estadisticas.cursosActivos.toString(),
      change: `+${estadisticas.cambioCursos}`,
      changeType: 'positive' as const,
      icon: School,
      description: 'Cursos en funcionamiento',
    },
    {
      title: 'Asignaturas',
      value: estadisticas.asignaturasTotal.toString(),
      change: `+${estadisticas.cambioAsignaturas}`,
      changeType: 'positive' as const,
      icon: BookOpen,
      description: 'Materias registradas',
    },
    {
      title: 'Docentes',
      value: estadisticas.docentesActivos.toString(),
      change: `+${estadisticas.cambioDocentes}`,
      changeType: 'positive' as const,
      icon: GraduationCap,
      description: 'Profesores activos',
    },
  ];

  const quickActions = [
    {
      title: 'Registrar Alumno',
      description: 'Agregar nuevo estudiante al sistema',
      icon: UserPlus,
      action: () => onNavigate('alumnos'),
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Ver Conducta',
      description: 'Consultar infracciones de alumnos',
      icon: Shield,
      action: () => onNavigate('conductas'),
      color: 'bg-red-600 hover:bg-red-700',
    },
    {
      title: 'Crear Asignatura',
      description: 'Añadir nueva materia al plan de estudios',
      icon: BookOpen,
      action: () => onNavigate('asignaturas'),
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'Nuevo Curso',
      description: 'Configurar un nuevo curso',
      icon: School,
      action: () => onNavigate('cursos'),
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      title: 'Generar Reporte',
      description: 'Crear reportes académicos',
      icon: FileText,
      action: () => onNavigate('reportes'),
      color: 'bg-orange-600 hover:bg-orange-700',
    },
  ];

  // Mapear actividades recientes con iconos
  const getIconForActivity = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'alumno':
        return Users;
      case 'asignatura':
        return BookOpen;
      case 'curso':
        return School;
      case 'asignacion':
      case 'responsable':
        return ClipboardList;
      case 'nota':
      case 'calificacion':
        return FileText;
      default:
        return Calendar;
    }
  };

  const formatearTiempoRelativo = (fecha: string | Date) => {
    const ahora = new Date();
    const fechaActividad = new Date(fecha);
    const diffMs = ahora.getTime() - fechaActividad.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMin < 1) return 'Hace unos momentos';
    if (diffMin < 60) return `Hace ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
    if (diffHoras < 24) return `Hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    if (diffDias < 7) return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;
    return fechaActividad.toLocaleDateString('es-ES');
  };

  const recentActivities = actividadesRecientes.map((actividad) => ({
    type: actividad.entidad || 'general',
    message: actividad.descripcion,
    time: formatearTiempoRelativo(actividad.fecha),
    icon: getIconForActivity(actividad.entidad || 'general'),
  }));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return priority;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Panel Administrativo
          </h1>
          <p className="text-gray-600">Bienvenido, {user.name}</p>
        </div>
        <Badge
          variant="outline"
          className="bg-blue-100 text-blue-800 border-blue-200"
        >
          Personal Administrativo
        </Badge>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="border-l-4 border-l-blue-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <stat.icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Acciones Rápidas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={action.action}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {action.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tareas Pendientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ClipboardList className="w-5 h-5" />
              <span>Tareas Pendientes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tareasPendientes.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {task.task}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge
                        variant="outline"
                        className={getPriorityColor(task.priority)}
                      >
                        {getPriorityText(task.priority)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {task.count} pendientes
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividad Reciente */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Actividad Reciente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <activity.icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resumen Mensual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Resumen del Mes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Nuevos Alumnos</span>
                <span className="font-medium">{resumenMensual.nuevosAlumnos}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Asignaturas Creadas
                </span>
                <span className="font-medium">
                  {resumenMensual.asignaturasCreadas}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Cursos Configurados
                </span>
                <span className="font-medium">
                  {resumenMensual.cursosConfigurados}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Reportes Generados
                </span>
                <span className="font-medium">
                  {resumenMensual.reportesGenerados}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Módulos Principales */}
      <Card>
        <CardHeader>
          <CardTitle>Módulos Administrativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => onNavigate('alumnos')}
            >
              <Users className="w-6 h-6" />
              <span>Gestión de Alumnos</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => onNavigate('asignaturas')}
            >
              <BookOpen className="w-6 h-6" />
              <span>Asignaturas</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => onNavigate('cursos')}
            >
              <School className="w-6 h-6" />
              <span>Cursos</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => onNavigate('asignaciones')}
            >
              <ClipboardList className="w-6 h-6" />
              <span>Asignaciones</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => onNavigate('conductas')}
            >
              <Shield className="w-6 h-6" />
              <span>Conducta</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdministrativoDashboard;
