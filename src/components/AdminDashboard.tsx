import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Users,
  GraduationCap,
  BookOpen,
  School,
  FileText,
  BarChart3,
  UserPlus,
  Calendar,
  Target,
  HardDrive,
  Shield,
  Search,
  Loader2,
  Cloud,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/axiosConfig';
import {
  obtenerEstadisticasPersonal,
  obtenerTotalAlumnos,
  obtenerTotalCursos,
  obtenerTotalAsignaturas,
  obtenerActividadReciente,
} from '../api/services/dashboardService';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'orientador' | 'pa';
}

interface AdminDashboardProps {
  user: User;
  onNavigate: (section: string) => void;
}

interface Stats {
  totalUsuarios: number;
  totalAlumnos: number;
  totalCursos: number;
  totalAsignaturas: number;
  evaluacionesPendientes: number;
  reportesGenerados: number;
}

export function AdminDashboard({ user, onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalUsuarios: 0,
    totalAlumnos: 0,
    totalCursos: 0,
    totalAsignaturas: 0,
    evaluacionesPendientes: 0,
    reportesGenerados: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del modal de backups
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupResult, setBackupResult] = useState<
    | { success: true; url?: string }
    | { success: false; error?: string }
    | null
  >(null);

  const abrirModalBackup = () => {
    setBackupResult(null);
    setBackupModalOpen(true);
  };

  const ejecutarBackup = async () => {
    setBackupLoading(true);
    setBackupResult(null);
    try {
      const { data } = await api.post('/backup/ejecutar');
      const result = (data ?? {}) as { success?: boolean; url?: string; error?: string };
      if (result.success) {
        setBackupResult({ success: true, url: result.url });
      } else {
        setBackupResult({ success: false, error: result.error || 'Error al ejecutar el respaldo' });
      }
    } catch (e) {
      setBackupResult({ success: false, error: 'Error de conexión al ejecutar el respaldo' });
    } finally {
      setBackupLoading(false);
    }
  };

  useEffect(() => {
    const cargarDatosDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        // Cargamos todos los datos necesarios en paralelo para mayor eficiencia
        const [personalData, totalAlumnos, totalCursos, totalAsignaturas] =
          await Promise.all([
            obtenerEstadisticasPersonal(),
            obtenerTotalAlumnos(),
            obtenerTotalCursos(),
            obtenerTotalAsignaturas(),
          ]);

        // Actualizamos el estado con los datos reales
        setStats({
          totalUsuarios:
            (personalData as { totalUsuariosRegistrados?: number })
              ?.totalUsuariosRegistrados || 0,
          totalAlumnos: typeof totalAlumnos === 'number' ? totalAlumnos : 0,
          totalCursos: typeof totalCursos === 'number' ? totalCursos : 0,
          totalAsignaturas:
            typeof totalAsignaturas === 'number' ? totalAsignaturas : 0,
          evaluacionesPendientes: 0, // Este dato podría requerirse de otro endpoint
          reportesGenerados: 0, // Este dato podría requerirse de otro endpoint
        });
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('Error al cargar datos. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatosDashboard();
  }, []);

  const quickActions = [
    {
      title: 'Gestión de Usuarios',
      description: 'Crear, editar y administrar usuarios del sistema',
      icon: Users,
      color: 'bg-blue-600',
      action: () => onNavigate('usuarios'),
      stats: `${stats.totalUsuarios} usuarios activos`,
    },
    {
      title: 'Gestión de Alumnos',
      description: 'Registrar y administrar información de estudiantes',
      icon: GraduationCap,
      color: 'bg-green-600',
      action: () => onNavigate('alumnos'),
      stats: `${stats.totalAlumnos} alumnos registrados`,
    },
    {
      title: 'Gestión de Asignaturas',
      description: 'Crear y administrar materias del plan de estudios',
      icon: BookOpen,
      color: 'bg-purple-600',
      action: () => onNavigate('asignaturas'),
      stats: `${stats.totalAsignaturas} asignaturas activas`,
    },
    {
      title: 'Gestión de Cursos',
      description: 'Administrar cursos, grados y secciones',
      icon: School,
      color: 'bg-orange-600',
      action: () => onNavigate('cursos'),
      stats: `${stats.totalCursos} cursos configurados`,
    },
    {
      title: 'Asignaciones',
      description: 'Asignar docentes a cursos y asignaturas',
      icon: Target,
      color: 'bg-red-600',
      action: () => onNavigate('asignaciones'),
      stats: 'Gestionar asignaciones',
    },
    {
      title: 'Catálogo de Conductas',
      description: 'Gestionar infracciones y catálogo de conducta',
      icon: Shield,
      color: 'bg-red-600',
      action: () => onNavigate('conductas'),
      stats: 'Gestionar catálogo',
    },
    {
      title: 'Consultar Evaluaciones',
      description: 'Ver evaluaciones, calificaciones y promedios de cursos',
      icon: Search,
      color: 'bg-blue-600',
      action: () => onNavigate('consultar-evaluaciones'),
      stats: 'Solo lectura',
    },
    {
      title: 'Reportes',
      description: 'Generar reportes académicos en PDF y Excel',
      icon: FileText,
      color: 'bg-indigo-600',
      action: () => onNavigate('reportes'),
      stats: `${stats.reportesGenerados} reportes generados`,
    },
    {
      title: 'Respaldos (Backups)',
      description: 'Gestión de respaldos de la base de datos',
      icon: HardDrive,
      color: 'bg-orange-600',
      action: () => abrirModalBackup(),
      stats: 'Sistema de respaldos automático',
    },
  ];

  const [actividadReciente, setActividadReciente] = useState([
    {
      action: 'Nuevo alumno registrado',
      time: 'Hace 2 horas',
      type: 'success' as const,
    },
    {
      action: 'Usuario creado: Prof. Ana Martínez',
      time: 'Hace 4 horas',
      type: 'info' as const,
    },
    {
      action: 'Reporte generado: Notas 3er Grado',
      time: 'Hace 6 horas',
      type: 'warning' as const,
    },
    {
      action: 'Asignatura creada: Ciencias Naturales',
      time: 'Hace 1 día',
      type: 'success' as const,
    },
  ]);

  // Cargar actividad reciente
  useEffect(() => {
    const cargarActividad = async () => {
      try {
        const actividadData = await obtenerActividadReciente();
        if (actividadData && actividadData.length > 0) {
          const actividadFormateada = actividadData.map((act: any) => ({
            action: act.descripcion || act.accion || 'Actividad registrada',
            time: act.fecha
              ? new Date(act.fecha).toLocaleString('es', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: 'numeric',
                  month: 'short',
                })
              : 'Fecha desconocida',
            type: (act.tipo || 'info') as 'success' | 'info' | 'warning',
          }));
          setActividadReciente(actividadFormateada);
        }
      } catch (err) {
        console.error('Error al cargar actividad reciente:', err);
      }
    };

    cargarActividad();
  }, []);

  // Usar la actividad reciente cargada o la predeterminada si está vacía
  const recentActivity = actividadReciente;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Administrativo
          </h1>
          <p className="text-gray-600 mt-1">Bienvenido/a, {user.name}</p>
          {loading && (
            <p className="text-blue-500 text-sm mt-1 flex items-center">
              <span className="animate-pulse mr-2">⚪</span> Cargando datos...
            </p>
          )}
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          Administrador
        </Badge>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalUsuarios}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Alumnos</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalAlumnos}
                </p>
              </div>
              <GraduationCap className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cursos</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalCursos}
                </p>
              </div>
              <School className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Asignaturas</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.totalAsignaturas}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Módulos del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={action.action}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {action.icon && (
                    <div
                      className={`${action.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}
                    >
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {action.description}
                    </p>
                    <p className="text-xs text-gray-500">{action.stats}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Actividad Reciente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div
              className="h-[180px] overflow-y-auto"
              style={{
                overflowY: 'auto',
                maxHeight: '180px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {recentActivity.slice(0, 4).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.type === 'success'
                        ? 'bg-green-500'
                        : activity.type === 'info'
                          ? 'bg-blue-500'
                          : 'bg-yellow-500'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Accesos Rápidos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate('usuarios')}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Crear Nuevo Usuario
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate('alumnos')}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Registrar Alumno
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate('reportes')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Generar Reporte
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate('asignaciones')}
            >
              <Target className="w-4 h-4 mr-2" />
              Gestionar Asignaciones
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal de confirmación de Backups */}
      <Dialog open={backupModalOpen} onOpenChange={setBackupModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ejecutar Respaldo (Backup)</DialogTitle>
            <DialogDescription>
              Se generará un respaldo completo de la base de datos y se subirá
              automáticamente a Google Drive. Este proceso puede tardar
              varios segundos y no debes cerrar la ventana.
            </DialogDescription>
          </DialogHeader>

          {backupResult ? (
            <div
              className={
                backupResult.success
                  ? 'bg-green-50 border border-green-200 rounded-md p-3'
                  : 'bg-red-50 border border-red-200 rounded-md p-3'
              }
            >
              {backupResult.success ? (
                <div className="text-green-800 text-sm">
                  Respaldo generado y subido correctamente.
                  {backupResult.url ? (
                    <div className="mt-2">
                      <a
                        href={backupResult.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center"
                      >
                        <Cloud className="w-4 h-4 mr-1" /> Ver en Google Drive
                      </a>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-red-800 text-sm">{backupResult.error}</div>
              )}
            </div>
          ) : null}

          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              disabled={backupLoading}
              onClick={() => setBackupModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={ejecutarBackup}
              disabled={backupLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {backupLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ejecutando...
                </>
              ) : (
                'Aceptar y Ejecutar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDashboard;
