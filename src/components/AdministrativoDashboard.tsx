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
  BarChart3
} from 'lucide-react';

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

export function AdministrativoDashboard({ user, onNavigate }: AdministrativoDashboardProps) {
  const statsCards = [
    {
      title: 'Total Alumnos',
      value: '450',
      change: '+12',
      changeType: 'positive' as const,
      icon: Users,
      description: 'Estudiantes activos'
    },
    {
      title: 'Cursos Activos',
      value: '18',
      change: '+2',
      changeType: 'positive' as const,
      icon: School,
      description: 'Cursos en funcionamiento'
    },
    {
      title: 'Asignaturas',
      value: '24',
      change: '+1',
      changeType: 'positive' as const,
      icon: BookOpen,
      description: 'Materias registradas'
    },
    {
      title: 'Docentes',
      value: '32',
      change: '+3',
      changeType: 'positive' as const,
      icon: GraduationCap,
      description: 'Profesores activos'
    }
  ];

  const quickActions = [
    {
      title: 'Registrar Alumno',
      description: 'Agregar nuevo estudiante al sistema',
      icon: UserPlus,
      action: () => onNavigate('alumnos'),
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Crear Asignatura',
      description: 'Añadir nueva materia al plan de estudios',
      icon: BookOpen,
      action: () => onNavigate('asignaturas'),
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Nuevo Curso',
      description: 'Configurar un nuevo curso',
      icon: School,
      action: () => onNavigate('cursos'),
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'Generar Reporte',
      description: 'Crear reportes académicos',
      icon: FileText,
      action: () => onNavigate('reportes'),
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ];

  const recentActivities = [
    {
      type: 'alumno',
      message: 'Nuevo alumno registrado: Juan Carlos Méndez',
      time: 'Hace 2 horas',
      icon: Users
    },
    {
      type: 'asignatura',
      message: 'Asignatura creada: Educación Física',
      time: 'Hace 4 horas',
      icon: BookOpen
    },
    {
      type: 'curso',
      message: 'Curso 9° Básico C configurado',
      time: 'Hace 1 día',
      icon: School
    },
    {
      type: 'asignacion',
      message: 'Asignación completada: Prof. Ana - Matemáticas',
      time: 'Hace 2 días',
      icon: ClipboardList
    }
  ];

  const pendingTasks = [
    {
      task: 'Revisar solicitudes de inscripción',
      priority: 'high' as const,
      count: 8
    },
    {
      task: 'Asignar docentes a nuevos cursos',
      priority: 'medium' as const,
      count: 3
    },
    {
      task: 'Actualizar información de asignaturas',
      priority: 'low' as const,
      count: 5
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return priority;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel Administrativo</h1>
          <p className="text-gray-600">Bienvenido, {user.name}</p>
        </div>
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
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
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <span className={`text-sm ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500">este mes</span>
                  </div>
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
                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={action.action}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{action.title}</h4>
                      <p className="text-sm text-gray-600">{action.description}</p>
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
              {pendingTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{task.task}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {getPriorityText(task.priority)}
                      </Badge>
                      <span className="text-xs text-gray-500">{task.count} pendientes</span>
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
            <div className="space-y-4">
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
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Asignaturas Creadas</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cursos Configurados</span>
                <span className="font-medium">2</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Reportes Generados</span>
                <span className="font-medium">25</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdministrativoDashboard;