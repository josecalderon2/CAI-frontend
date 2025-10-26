import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

import {
  User,
  BookOpen,
  Activity,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { asistenciaService } from '../api/services/asistenciaService';
import { cursosService } from '../api/services/cursosService';
import { historialAsistenciasService } from '../api/services/historialAsistenciasService';
import type {
  HistorialAsistenciaResponse,
  AccionHistorial,
} from '../api/services/historialAsistenciasService';
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  FileText,
  Search,
  Download,
  Eye,
  AlertCircle,
  UserCheck,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

// --- Interfaces ---
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'docente' | 'administrativo';
}

interface AsistenciaModuleProps {
  user: User;
}

interface AlumnoResponse {
  id_alumno: number;
  nombre: string;
  apellido: string;
  rut: string;
}

interface CursoResponse {
  id_curso: number;
  nombre: string;
  seccion?: string;
  descripcion?: string;
  id_grado_academico?: number;
  id_orientador?: number;
  cupo?: number;
  aula?: string;
  activo?: boolean;
  gradoAcademico?: {
    id_grado_academico: number;
    nombre: string;
  };
  asignatura?: {
    id_asignatura: number;
    nombre: string;
  };
}

interface AsistenciaData {
  id_alumno: number;
  id_asignatura: number;
  id_orientador: number;
  fecha: string;
  estado: 'P' | 'E' | 'SP' | 'A';
  observacion?: string;
  anio_academico?: string; // String, no number (según schema de BD)
  trimestre?: number;
}

// Helpers de fechas (ISO local) y normalización de filtros
const toLocalISODate = (d: Date) => {
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 10); // YYYY-MM-DD
};

const endOfDayISO = (yyyyMmDd: string | undefined) => {
  if (!yyyyMmDd) return undefined;
  const [y, m, day] = yyyyMmDd.split('-').map(Number);
  const local = new Date(y, m - 1, day, 23, 59, 59, 999);
  return local.toISOString();
};

const startOfDayISO = (yyyyMmDd: string | undefined) => {
  if (!yyyyMmDd) return undefined;
  const [y, m, day] = yyyyMmDd.split('-').map(Number);
  const local = new Date(y, m - 1, day, 0, 0, 0, 0);
  return local.toISOString();
};

const LOG_PREFIX = '[AsistenciaModule]';

export function AsistenciaModule({ user }: AsistenciaModuleProps) {
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [activeTab, setActiveTab] = useState<
    'tomar-asistencia' | 'historial' | 'reportes'
  >('tomar-asistencia');
  const [busquedaAlumno, setBusquedaAlumno] = useState('');
  const [asistenciaGuardada, setAsistenciaGuardada] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Datos API
  const [cursosAsignados, setCursosAsignados] = useState<CursoResponse[]>([]);
  const [alumnosPorCurso, setAlumnosPorCurso] = useState<
    Record<string, AlumnoResponse[]>
  >({});
  const [asistenciaActual, setAsistenciaActual] = useState<
    Record<string, { estado: 'P' | 'E' | 'SP' | 'A'; observacion: string }>
  >({});
  const [historialAsistencias, setHistorialAsistencias] = useState<
    HistorialAsistenciaResponse[]
  >([]);

  const [filtroHistorial, setFiltroHistorial] = useState({
    desde: '',
    hasta: '',
    idAsignatura: '',
    accion: '' as AccionHistorial | '',
    quickRange: 'none' as 'none' | '7d' | '30d' | 'trim',
    alumnoNombre: '',
  });

  // Meta/paginación
  const [meta, setMeta] = useState({
    itemCount: 0,
    totalItems: 0,
    itemsPerPage: 20,
    totalPages: 1,
    currentPage: 1,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Modal detalle
  const [detalleModal, setDetalleModal] =
    useState<HistorialAsistenciaResponse | null>(null);

  // Estado para historial agrupado y registro seleccionado
  const [historialAgrupado, setHistorialAgrupado] = useState<
    Record<number, HistorialAsistenciaResponse[]>
  >({});
  const [registroSeleccionado, setRegistroSeleccionado] = useState<number | null>(null);
  
  // Paginación para el historial expandido
  const [paginaHistorialExpandido, setPaginaHistorialExpandido] = useState<Record<number, number>>({});
  const itemsPorPaginaHistorial = 10; // Mostrar 10 registros por página (5 filas de 2 columnas)

  // Debounce helper
  const useDebounce = <T,>(value: T, delay = 400) => {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const t = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
  };
  const debouncedFiltro = useDebounce(filtroHistorial, 400);

  // Cargar historial cuando cambien filtros (y cuando entras a la pestaña historial)
  useEffect(() => {
    if (activeTab === 'historial') {
      cargarHistorialConFiltros(1, limit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFiltro, activeTab]);

  // Cargar cursos y alumnos
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      console.log(`${LOG_PREFIX} Cargando cursos para user`, user);
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const cursos = await cursosService.findCursosAsignadosDocente(
          parseInt(user.id)
        );
        
        console.log(`${LOG_PREFIX} Cursos recibidos del backend:`, cursos);
        
        // Mapear cursos según la estructura que devuelve el backend
        // Backend devuelve: { id, nombre, nivel, asignatura, alumnos }
        const cursosResponse: CursoResponse[] = (cursos as any[])
          .filter((curso: any) => curso?.id != null)
          .map((curso: any) => {
            console.log(`${LOG_PREFIX} Procesando curso:`, curso);
            return {
              id_curso: parseInt(curso.id, 10), // Backend envía id como string
              nombre: curso.nombre,
              seccion: curso.nivel ?? '', // Backend usa "nivel" en lugar de "seccion"
              cupo: curso.alumnos ?? 0, // Backend usa "alumnos" en lugar de "cupo"
              descripcion: '',
              id_grado_academico: undefined,
              id_orientador: undefined,
              aula: '',
              activo: true,
              gradoAcademico: undefined,
              asignatura: curso.asignatura
                ? {
                    id_asignatura: curso.asignatura.id_asignatura,
                    nombre: curso.asignatura.nombre,
                  }
                : undefined,
            };
          })
          .filter((curso) => curso.asignatura != null); // Solo cursos con asignatura válida

        console.log(`${LOG_PREFIX} Cursos procesados:`, cursosResponse);
        setCursosAsignados(cursosResponse);

        // Cargar alumnos para cada curso
        const alumnosPorCursoTemp: Record<string, AlumnoResponse[]> = {};
        for (const curso of cursosResponse) {
          if (curso.id_curso) {
            try {
              const alumnosData = await cursosService.getAlumnosPorCurso(
                curso.id_curso
              );
              
              console.log(`${LOG_PREFIX} Alumnos para curso ${curso.id_curso}:`, alumnosData);
              
              // Backend devuelve: { id, nombre, apellido, cursoId }
              alumnosPorCursoTemp[curso.id_curso.toString()] = (
                alumnosData as any[]
              ).map((a: any) => ({
                id_alumno: parseInt(a.id, 10), // Backend envía "id" como string
                nombre: a.nombre,
                apellido: a.apellido,
                rut: 'N/A', // Backend no devuelve rut en este endpoint
              }));
            } catch (e) {
              console.error(`${LOG_PREFIX} Error cargando alumnos para curso ${curso.id_curso}:`, e);
              alumnosPorCursoTemp[curso.id_curso.toString()] = [];
            }
          }
        }
        setAlumnosPorCurso(alumnosPorCursoTemp);
        
        console.log(`${LOG_PREFIX} Alumnos por curso:`, alumnosPorCursoTemp);
      } catch (e) {
        console.error(`${LOG_PREFIX} Error al cargar datos iniciales:`, e);
        toast.error('Error al cargar los datos iniciales');
      } finally {
        setIsLoading(false);
      }
    };
    cargarDatosIniciales();
  }, [user?.id]);

  // Cargar historial con filtros
  const cargarHistorialConFiltros = async (toPage = page, toLimit = limit) => {
    setIsLoading(true);
    try {
      // Normalizar rango
      let { desde, hasta } = debouncedFiltro;
      if (desde && hasta && desde > hasta) [desde, hasta] = [hasta, desde];

      // Quick ranges
      if (debouncedFiltro.quickRange !== 'none') {
        const today = new Date();
        let d1 = new Date();
        if (debouncedFiltro.quickRange === '7d')
          d1.setDate(today.getDate() - 7);
        if (debouncedFiltro.quickRange === '30d')
          d1.setDate(today.getDate() - 30);
        if (debouncedFiltro.quickRange === 'trim') {
          const m = today.getMonth();
          const startMonth = m - (m % 3);
          d1 = new Date(today.getFullYear(), startMonth, 1);
        }
        desde = toLocalISODate(d1);
        hasta = toLocalISODate(today);
      }

      const resultado = await historialAsistenciasService.search({
        desde: startOfDayISO(desde || undefined),
        hasta: endOfDayISO(hasta || undefined),
        id_asignatura: debouncedFiltro.idAsignatura
          ? parseInt(debouncedFiltro.idAsignatura)
          : undefined,
        accion: debouncedFiltro.accion || undefined,
        page: toPage,
        limit: toLimit,
      });

      // Agrupar por id_asistencia
      const agrupado: Record<number, HistorialAsistenciaResponse[]> = {};
      resultado.items.forEach((item) => {
        if (item.id_asistencia) {
          if (!agrupado[item.id_asistencia]) {
            agrupado[item.id_asistencia] = [];
          }
          agrupado[item.id_asistencia].push(item);
        }
      });

      // Ordenar cada grupo por fecha de creación (más antiguo primero)
      Object.keys(agrupado).forEach((key) => {
        agrupado[parseInt(key)].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      setHistorialAgrupado(agrupado);
      
      // Mostrar el ÚLTIMO registro de cada grupo (el más reciente)
      const ultimosRegistros = Object.values(agrupado)
        .map((grupo) => grupo[grupo.length - 1]) // Último elemento del array
        .filter((item) => item != null);
      
      setHistorialAsistencias(ultimosRegistros);
      setMeta(resultado.meta);
      setPage(resultado.meta.currentPage);
      setLimit(resultado.meta.itemsPerPage);
    } catch (e) {
      toast.error('Error al cargar el historial de asistencias');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // (Eliminado el segundo useEffect redundante que cargaba historial al cambiar activeTab)

  // Cargar asistencias del día
  useEffect(() => {
    const cargarAsistenciasDiarias = async () => {
      if (!(cursoSeleccionado && fechaSeleccionada)) return;
      
      setIsLoading(true);
      setAsistenciaGuardada(false); // Reset del mensaje de guardado al cambiar curso/fecha
      
      try {
        const curso = cursosAsignados.find(
          (c) => c.id_curso === parseInt(cursoSeleccionado)
        );
        if (!curso?.asignatura?.id_asignatura) {
          console.warn(`${LOG_PREFIX} Curso sin asignatura asignada`);
          setAsistenciaActual({});
          return;
        }
        const idAsignatura = curso.asignatura.id_asignatura;
        
        console.log(`${LOG_PREFIX} Cargando asistencias para asignatura ${idAsignatura}, fecha ${fechaSeleccionada}`);
        
        const asistencias = await asistenciaService.findByAsignaturaAndFecha(
          idAsignatura,
          fechaSeleccionada
        );
        
        console.log(`${LOG_PREFIX} Asistencias cargadas:`, asistencias);
        
        const nuevaAsistencia: Record<
          string,
          { estado: 'P' | 'E' | 'SP' | 'A'; observacion: string }
        > = {};
        asistencias.forEach((a: any) => {
          nuevaAsistencia[a.id_alumno.toString()] = {
            estado: a.estado as 'P' | 'E' | 'SP' | 'A',
            observacion: a.observacion || '',
          };
        });
        setAsistenciaActual(nuevaAsistencia);
        
        if (asistencias.length > 0) {
          console.log(`${LOG_PREFIX} ${asistencias.length} asistencias cargadas`);
        }
      } catch (e: any) {
        // Si es un 404, no es un error real (simplemente no hay asistencias aún)
        if (e?.response?.status === 404) {
          console.log(`${LOG_PREFIX} No hay asistencias previas para esta fecha`);
          setAsistenciaActual({});
        } else {
          console.error(`${LOG_PREFIX} Error al cargar asistencias:`, e);
          toast.error('Error al cargar las asistencias del día');
        }
      } finally {
        setIsLoading(false);
      }
    };
    cargarAsistenciasDiarias();
  }, [cursoSeleccionado, fechaSeleccionada, cursosAsignados]);

  // Derivados
  const alumnosDelCurso = cursoSeleccionado
    ? alumnosPorCurso[cursoSeleccionado] || []
    : [];
  const alumnosFiltrados = alumnosDelCurso.filter(
    (al) =>
      `${al.nombre} ${al.apellido}`
        .toLowerCase()
        .includes(busquedaAlumno.toLowerCase()) ||
      al.rut.includes(busquedaAlumno)
  );
  const cursoActual = cursosAsignados.find(
    (c) => c.id_curso === parseInt(cursoSeleccionado)
  );

  // Handlers
  const handleEstadoChange = (
    alumnoId: number,
    estado: 'P' | 'E' | 'SP' | 'A'
  ) => {
    setAsistenciaActual((prev) => ({
      ...prev,
      [alumnoId]: { estado, observacion: prev[alumnoId]?.observacion || '' },
    }));
  };

  const handleObservacionesChange = (alumnoId: number, observacion: string) => {
    setAsistenciaActual((prev) => ({
      ...prev,
      [alumnoId]: { estado: prev[alumnoId]?.estado || 'P', observacion },
    }));
  };

  const handleGuardarAsistencia = async () => {
    if (!cursoSeleccionado || !cursoActual?.asignatura?.id_asignatura) {
      toast.error('Debe seleccionar un curso con asignatura válida');
      return;
    }
    if (cursoActual.asignatura.id_asignatura === 0) {
      toast.error(
        'El backend no está proporcionando un ID de asignatura válido.'
      );
      return;
    }

    // Verificar que haya al menos un alumno con asistencia marcada
    if (Object.keys(asistenciaActual).length === 0) {
      toast.error('Debe marcar la asistencia de al menos un alumno');
      return;
    }

    setIsLoading(true);
    try {
      const asistenciasAGuardar: AsistenciaData[] = Object.entries(
        asistenciaActual
      ).map(([alumnoId, datos]) => ({
        id_alumno: parseInt(alumnoId),
        id_asignatura: cursoActual.asignatura!.id_asignatura,
        id_orientador: parseInt(user.id),
        fecha: fechaSeleccionada,
        estado: datos.estado,
        observacion: datos.observacion || '',
        anio_academico: new Date().getFullYear().toString(), // String, no number
        trimestre: Math.floor(new Date().getMonth() / 3) + 1,
      }));

      console.log(`${LOG_PREFIX} Guardando ${asistenciasAGuardar.length} asistencias`, asistenciasAGuardar);
      
      const response = await asistenciaService.create(asistenciasAGuardar);
      console.log(`${LOG_PREFIX} Respuesta del backend:`, response);
      
      setAsistenciaGuardada(true);
      
      // Auto-ocultar el mensaje de éxito después de 5 segundos
      setTimeout(() => setAsistenciaGuardada(false), 5000);
      
      toast.success(`Asistencia guardada correctamente (${asistenciasAGuardar.length} alumnos)`);

      // Recargar las asistencias para sincronizar con el backend
      const asistenciasActualizadas =
        await asistenciaService.findByAsignaturaAndFecha(
          cursoActual.asignatura.id_asignatura,
          fechaSeleccionada
        );

      const nuevaAsistencia: Record<
        string,
        { estado: 'P' | 'E' | 'SP' | 'A'; observacion: string }
      > = {};
      asistenciasActualizadas.forEach((a: any) => {
        nuevaAsistencia[a.id_alumno.toString()] = {
          estado: a.estado as 'P' | 'E' | 'SP' | 'A',
          observacion: a.observacion || '',
        };
      });
      setAsistenciaActual(nuevaAsistencia);
    } catch (e: any) {
      console.error(`${LOG_PREFIX} Error al guardar asistencias:`, e);
      
      // Extraer información detallada del error
      let errorMsg = 'Error desconocido';
      let errorDetails = '';
      
      if (e?.response) {
        // El servidor respondió con un código de error
        console.error(`${LOG_PREFIX} Error del servidor:`, {
          status: e.response.status,
          statusText: e.response.statusText,
          data: e.response.data,
        });
        
        errorMsg = e.response.data?.message || e.response.statusText || `Error ${e.response.status}`;
        
        // Si hay errores de validación, mostrarlos
        if (e.response.data?.errors) {
          errorDetails = '\n' + JSON.stringify(e.response.data.errors, null, 2);
        }
      } else if (e?.request) {
        // La petición se hizo pero no hubo respuesta
        errorMsg = 'No se recibió respuesta del servidor';
        console.error(`${LOG_PREFIX} Sin respuesta del servidor:`, e.request);
      } else {
        // Error al configurar la petición
        errorMsg = e?.message || 'Error al configurar la petición';
      }
      
      toast.error(`Error al guardar las asistencias: ${errorMsg}${errorDetails}`, {
        duration: 8000, // Más tiempo para leer el error
      });
    } finally {
      setIsLoading(false);
    }
  };

  const marcarTodosPresentes = () => {
    const nuevaAsistencia: Record<
      string,
      { estado: 'P' | 'E' | 'SP' | 'A'; observacion: string }
    > = {};
    alumnosDelCurso.forEach((alumno) => {
      nuevaAsistencia[alumno.id_alumno.toString()] = {
        estado: 'P',
        observacion: '',
      };
    });
    setAsistenciaActual(nuevaAsistencia);
    toast.success('Todos los alumnos marcados como presentes');
  };

  const contarEstados = () => {
    const estados = Object.values(asistenciaActual);
    return {
      presentes: estados.filter((a) => a.estado === 'P' || a.estado === 'E')
        .length,
      ausentes: estados.filter((a) => a.estado === 'A').length,
      tardes: estados.filter((a) => a.estado === 'SP').length,
      sinMarcar: alumnosDelCurso.length - estados.length,
    };
  };
  const estadosCount = contarEstados();

  // UI: Tomar asistencia (sin cambios sustantivos)
  const renderTomarAsistencia = () => (
    <div className="space-y-6">
      {isLoading && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600 animate-pulse" />
          <AlertDescription className="text-blue-800">
            Cargando datos...
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Configuración de Asistencia</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cursosAsignados.length === 0 && !isLoading && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                No tienes cursos asignados. Contacta al administrador para que te asigne cursos y asignaturas.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="curso">Curso</Label>
              <Select
                value={cursoSeleccionado}
                onValueChange={setCursoSeleccionado}
                disabled={isLoading || cursosAsignados.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    cursosAsignados.length === 0 
                      ? "No hay cursos disponibles" 
                      : "Seleccionar curso"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {cursosAsignados.map((curso) => (
                    <SelectItem
                      key={curso.id_curso}
                      value={curso.id_curso.toString()}
                    >
                      {curso.nombre} - {curso.asignatura?.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {!!cursoSeleccionado && cursoActual && (
            <Alert className={alumnosDelCurso.length === 0 ? "border-red-200 bg-red-50" : ""}>
              <AlertCircle className={`h-4 w-4 ${alumnosDelCurso.length === 0 ? "text-red-600" : ""}`} />
              <AlertDescription className={alumnosDelCurso.length === 0 ? "text-red-800" : ""}>
                <div className="space-y-1">
                  <div>
                    Curso: <strong>{cursoActual.nombre}</strong> — {cursoActual.asignatura?.nombre}
                  </div>
                  <div className="text-sm">
                    Asignatura ID: {cursoActual.asignatura?.id_asignatura} | 
                    Alumnos: {alumnosDelCurso.length} |
                    Fecha: {fechaSeleccionada}
                  </div>
                  {alumnosDelCurso.length === 0 && (
                    <div className="text-sm font-medium mt-1">
                      ⚠️ Este curso no tiene alumnos inscritos
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {!!cursoSeleccionado && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {alumnosDelCurso.length}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Presentes</p>
                    <p className="text-2xl font-bold text-green-600">
                      {estadosCount.presentes}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Ausentes</p>
                    <p className="text-2xl font-bold text-red-600">
                      {estadosCount.ausentes}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tardes</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {estadosCount.tardes}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-gray-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Sin marcar</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {estadosCount.sinMarcar}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5" />
                <span>Controles Rápidos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={marcarTodosPresentes}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar Todos Presentes
                </Button>
                <Button
                  onClick={handleGuardarAsistencia}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isLoading || Object.keys(asistenciaActual).length === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Guardando...' : 'Guardar Asistencia'}
                </Button>
              </div>
              {estadosCount.sinMarcar > 0 && (
                <p className="text-sm text-orange-600 mt-2">
                  ⚠️ Quedan {estadosCount.sinMarcar} alumnos sin marcar asistencia
                </p>
              )}
              {Object.keys(asistenciaActual).length === 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  📝 Marca la asistencia de al menos un alumno para poder guardar
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Lista de Alumnos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar alumno..."
                      value={busquedaAlumno}
                      onChange={(e) => setBusquedaAlumno(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alumnosFiltrados.map((alumno) => {
                  const estadoActual =
                    asistenciaActual[alumno.id_alumno.toString()];
                  return (
                    <div
                      key={alumno.id_alumno}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {alumno.nombre} {alumno.apellido}
                        </p>
                        <p className="text-sm text-gray-600">
                          RUT: {alumno.rut}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant={
                              estadoActual?.estado === 'P'
                                ? 'default'
                                : 'outline'
                            }
                            onClick={() =>
                              handleEstadoChange(alumno.id_alumno, 'P')
                            }
                            className={
                              estadoActual?.estado === 'P'
                                ? 'bg-green-600 hover:bg-green-700'
                                : ''
                            }
                            title="Presente"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              estadoActual?.estado === 'A'
                                ? 'default'
                                : 'outline'
                            }
                            onClick={() =>
                              handleEstadoChange(alumno.id_alumno, 'A')
                            }
                            className={
                              estadoActual?.estado === 'A'
                                ? 'bg-red-600 hover:bg-red-700'
                                : ''
                            }
                            title="Ausente"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              estadoActual?.estado === 'SP'
                                ? 'default'
                                : 'outline'
                            }
                            onClick={() =>
                              handleEstadoChange(alumno.id_alumno, 'SP')
                            }
                            className={
                              estadoActual?.estado === 'SP'
                                ? 'bg-orange-600 hover:bg-orange-700'
                                : ''
                            }
                            title="Sin Permiso"
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              estadoActual?.estado === 'E'
                                ? 'default'
                                : 'outline'
                            }
                            onClick={() =>
                              handleEstadoChange(alumno.id_alumno, 'E')
                            }
                            className={
                              estadoActual?.estado === 'E'
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : ''
                            }
                            title="Eximido"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </Button>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <FileText className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Observaciones - {alumno.nombre}{' '}
                                {alumno.apellido}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="observaciones">
                                  Observaciones
                                </Label>
                                <Textarea
                                  id="observaciones"
                                  placeholder="Ingrese observaciones sobre la asistencia..."
                                  value={estadoActual?.observacion || ''}
                                  onChange={(e) =>
                                    handleObservacionesChange(
                                      alumno.id_alumno,
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <Button
                                onClick={() =>
                                  toast.success('Observaciones guardadas')
                                }
                              >
                                Guardar Observaciones
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {asistenciaGuardada && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                La asistencia del {fechaSeleccionada} para {cursoActual?.nombre}{' '}
                ha sido guardada correctamente.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );

  // HISTORIAL (filtros ordenados + buscador por nombre)
  const renderHistorial = () => {
    const acciones: AccionHistorial[] = [
      'CREATE',
      'UPDATE',
      'DELETE',
      'BULK_IMPORT',
      'RECTIFY',
      'ROLLBACK',
    ];

    const short = (str?: string | null, n = 60) =>
      (str ?? '').length > n ? (str ?? '').slice(0, n) + '…' : (str ?? '');

    const badgeForAccion = (a: AccionHistorial) => {
      const base = 'px-2 py-0.5 text-xs font-medium';
      switch (a) {
        case 'CREATE':
          return (
            <Badge className={`${base} bg-green-600 hover:bg-green-700`}>
              CREATE
            </Badge>
          );
        case 'UPDATE':
          return (
            <Badge
              variant="outline"
              className={`${base} border-blue-600 text-blue-600 bg-blue-50`}
            >
              UPDATE
            </Badge>
          );
        case 'DELETE':
          return (
            <Badge variant="destructive" className={base}>
              DELETE
            </Badge>
          );
        case 'BULK_IMPORT':
          return (
            <Badge variant="secondary" className={base}>
              BULK_IMPORT
            </Badge>
          );
        case 'RECTIFY':
          return (
            <Badge
              variant="outline"
              className={`${base} border-yellow-600 text-yellow-700 bg-yellow-50`}
            >
              RECTIFY
            </Badge>
          );
        case 'ROLLBACK':
          return (
            <Badge
              variant="outline"
              className={`${base} border-red-600 text-red-600 bg-red-50`}
            >
              ROLLBACK
            </Badge>
          );
      }
    };

    const goPage = (p: number) => {
      if (p < 1 || p > meta.totalPages || p === page) return;
      cargarHistorialConFiltros(p, limit);
    };

    // Asignaturas únicas desde cursos + historial (sin duplicados)
    const asignaturasMap = new Map<
      number,
      { id_asignatura: number; nombre: string }
    >();
    for (const c of cursosAsignados) {
      const a = c.asignatura;
      if (a && a.id_asignatura != null) {
        asignaturasMap.set(a.id_asignatura, {
          id_asignatura: a.id_asignatura,
          nombre: a.nombre,
        });
      }
    }
    for (const h of historialAsistencias) {
      const a = h.asignatura;
      if (a && a.id_asignatura != null) {
        asignaturasMap.set(a.id_asignatura, {
          id_asignatura: a.id_asignatura,
          nombre: a.nombre,
        });
      }
    }
    const asignaturasUnicas = Array.from(asignaturasMap.values());

    // 🔎 Filtro client-side por alumno (nombre o apellido)
    const listaFiltradaPorNombre = historialAsistencias.filter((h) => {
      const q = filtroHistorial.alumnoNombre.trim().toLowerCase();
      if (!q) return true;
      const full = h.alumno
        ? `${h.alumno.nombre} ${h.alumno.apellido}`.toLowerCase()
        : '';
      return full.includes(q);
    });

    // Determinar colores según el estado
    const getEstadoColor = (estado: string) => {
      switch (estado?.toUpperCase()) {
        case 'P':
        case 'PRESENTE':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'A':
        case 'AUSENTE':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'SP':
        case 'SIN PERMISO':
        case 'TARDANZA':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'E':
        case 'EXIMIDO':
        case 'JUSTIFICADO':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getEstadoLabel = (estado: string) => {
      const estadoMap: Record<string, string> = {
        P: 'Presente',
        A: 'Ausente',
        SP: 'Sin Permiso',
        E: 'Eximido',
      };
      return estadoMap[estado?.toUpperCase()] || estado;
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Historial de Asistencia</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Fila 1: Rango rápido + fechas */}
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Rango</Label>
                <Select
                  value={filtroHistorial.quickRange}
                  onValueChange={(v) =>
                    setFiltroHistorial((p) => ({ ...p, quickRange: v as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rango rápido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Personalizado</SelectItem>
                    <SelectItem value="7d">Últimos 7 días</SelectItem>
                    <SelectItem value="30d">Últimos 30 días</SelectItem>
                    <SelectItem value="trim">Trimestre actual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <Input
                  type="date"
                  value={filtroHistorial.desde}
                  onChange={(e) =>
                    setFiltroHistorial((prev) => ({
                      ...prev,
                      desde: e.target.value,
                      quickRange: 'none',
                    }))
                  }
                  disabled={filtroHistorial.quickRange !== 'none'}
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <Input
                  type="date"
                  value={filtroHistorial.hasta}
                  min={filtroHistorial.desde || undefined}
                  onChange={(e) =>
                    setFiltroHistorial((prev) => ({
                      ...prev,
                      hasta: e.target.value,
                      quickRange: 'none',
                    }))
                  }
                  disabled={filtroHistorial.quickRange !== 'none'}
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  Asignatura
                </Label>
                <Select
                  value={filtroHistorial.idAsignatura || 'all'}
                  onValueChange={(v) =>
                    setFiltroHistorial((prev) => ({
                      ...prev,
                      idAsignatura: v === 'all' ? '' : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar asignatura" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las asignaturas</SelectItem>
                    {asignaturasUnicas.map((a) => (
                      <SelectItem
                        key={a.id_asignatura}
                        value={a.id_asignatura.toString()}
                      >
                        {a.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Acción</Label>
                <Select
                  value={filtroHistorial.accion || 'all'}
                  onValueChange={(v) =>
                    setFiltroHistorial((prev) => ({
                      ...prev,
                      accion: v === 'all' ? '' : (v as AccionHistorial),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Acción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las acciones</SelectItem>
                    {acciones.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fila 2: Alumno por nombre + límite + acciones */}
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-2">
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Alumno (nombre o apellido)
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    className="pl-9"
                    placeholder="Ej: Ruth Lemus"
                    value={filtroHistorial.alumnoNombre}
                    onChange={(e) =>
                      setFiltroHistorial((prev) => ({
                        ...prev,
                        alumnoNombre: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  Tamaño de página
                </Label>
                <Select
                  value={String(limit)}
                  onValueChange={(v) => {
                    const newLimit = parseInt(v, 10);
                    setLimit(newLimit);
                    cargarHistorialConFiltros(1, newLimit);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Límite" />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} / pág.
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  onClick={() => cargarHistorialConFiltros(1, limit)}
                  variant="outline"
                  size="sm"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Filtrar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFiltroHistorial({
                      desde: '',
                      hasta: '',
                      idAsignatura: '',
                      accion: '',
                      quickRange: 'none',
                      alumnoNombre: '',
                    });
                    cargarHistorialConFiltros(1, limit);
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </div>

            {/* Tabla mejorada */}
            <div className="rounded-lg border overflow-hidden mt-4 bg-white shadow-sm">
              {/* Header con resumen */}
              {meta.totalItems > 0 && (
                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700">
                        {listaFiltradaPorNombre.length} asistencias (estado actual)
                      </span>
                    </div>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <span className="text-xs text-gray-600">
                      Haz clic en un registro para ver todo su historial de cambios
                    </span>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Última Actualización
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Alumno
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Asignatura
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Estado Actual
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Observación
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4" />
                          Docente
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Historial
                        </div>
                      </TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {listaFiltradaPorNombre.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                              <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium">
                                No se encontraron resultados
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Intenta ajustar los filtros de búsqueda
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {listaFiltradaPorNombre.map((h) => {
                      const fecha = new Date(h.created_at);
                      const fechaFormato = fecha.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                      const horaFormato = fecha.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      const nombreAlumno = h.alumno
                        ? `${h.alumno.nombre} ${h.alumno.apellido}`
                        : `ID ${h.id_alumno}`;
                      const nombreAsignatura =
                        h.asignatura?.nombre ?? `ID ${h.id_asignatura}`;
                      const nombreDocente = h.orientador
                        ? `${h.orientador.nombre} ${h.orientador.apellido}`
                        : `ID ${h.id_orientador_registro}`;

                      // Obtener el historial completo de este registro
                      const historialCompleto = h.id_asistencia
                        ? historialAgrupado[h.id_asistencia] || []
                        : [];
                      const totalCambios = historialCompleto.length; // Total de cambios incluyendo el CREATE
                      const estaExpandido = registroSeleccionado === h.id_asistencia;

                      return (
                        <React.Fragment key={h.id}>
                        <TableRow
                          className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                          onClick={() => {
                            const nuevoEstado = estaExpandido ? null : h.id_asistencia || null;
                            setRegistroSeleccionado(nuevoEstado);
                            // Resetear la página del historial al cerrar
                            if (estaExpandido && h.id_asistencia) {
                              setPaginaHistorialExpandido(prev => ({
                                ...prev,
                                [h.id_asistencia!]: 1
                              }));
                            }
                          }}
                        >
                          {/* Fecha/Hora */}
                          <TableCell className="font-medium">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  {fechaFormato}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {horaFormato}
                              </div>
                            </div>
                          </TableCell>

                          {/* Alumno */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                {nombreAlumno
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900 whitespace-nowrap">
                                {nombreAlumno}
                              </span>
                            </div>
                          </TableCell>

                          {/* Asignatura */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                              <span className="text-sm text-gray-700 whitespace-nowrap">
                                {nombreAsignatura}
                              </span>
                            </div>
                          </TableCell>

                          {/* Estado Actual */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs px-2 py-0.5 ${getEstadoColor(
                                h.estado_nuevo || h.estado_anterior || ''
                              )}`}
                            >
                              {getEstadoLabel(h.estado_nuevo || h.estado_anterior || '')}
                            </Badge>
                          </TableCell>

                          {/* Observación */}
                          <TableCell className="max-w-[250px]">
                            <div className="group/obs relative">
                              {h.observacion_nueva || h.observacion_anterior ? (
                                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                  {short(
                                    h.observacion_nueva ?? h.observacion_anterior
                                  )}
                                </p>
                              ) : (
                                <span className="text-xs text-gray-400 italic">
                                  Sin observación
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Docente */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                {nombreDocente
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <span className="text-sm text-gray-700 whitespace-nowrap">
                                {nombreDocente}
                              </span>
                            </div>
                          </TableCell>

                          {/* Cambios */}
                          <TableCell>
                            {totalCambios > 1 ? (
                              <Badge
                                variant="outline"
                                className="bg-orange-50 text-orange-700 border-orange-200"
                              >
                                {totalCambios} registro{totalCambios > 1 ? 's' : ''}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-400">
                                Registro inicial
                              </span>
                            )}
                          </TableCell>

                          {/* Acciones */}
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                const nuevoEstado = estaExpandido ? null : h.id_asistencia || null;
                                setRegistroSeleccionado(nuevoEstado);
                                // Resetear la página del historial al abrir/cerrar
                                if (h.id_asistencia) {
                                  setPaginaHistorialExpandido(prev => ({
                                    ...prev,
                                    [h.id_asistencia!]: 1
                                  }));
                                }
                              }}
                            >
                              {estaExpandido ? (
                                <>
                                  <ChevronLeft className="w-4 h-4 mr-2" />
                                  Ocultar
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver historial
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
{/* Fila expandible con el historial de cambios */}
                        {estaExpandido && totalCambios > 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-gray-50 p-0">
                              <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    <h4 className="font-semibold text-gray-900">
                                      Historial Completo ({totalCambios} registro{totalCambios > 1 ? 's' : ''})
                                    </h4>
                                  </div>
                                  {totalCambios > itemsPorPaginaHistorial && (
                                    <div className="text-xs text-gray-500">
                                      Página {(paginaHistorialExpandido[h.id_asistencia!] || 1)} de {Math.ceil(totalCambios / itemsPorPaginaHistorial)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                  {(() => {
                                    const paginaActual = paginaHistorialExpandido[h.id_asistencia!] || 1;
                                    const inicio = (paginaActual - 1) * itemsPorPaginaHistorial;
                                    const fin = inicio + itemsPorPaginaHistorial;
                                    const registrosPaginados = historialCompleto.slice(inicio, fin);
                                    
                                    return registrosPaginados.map((cambio) => {
                                      const fechaCambio = new Date(cambio.created_at);
                                      return (
                                        <div
                                          key={cambio.id}
                                          style={{ width: '320px', height: '208px' }}
                                          className="flex-shrink-0 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-4 flex flex-col overflow-hidden"
                                        >
                                          {/* Header con badge y fecha */}
                                          <div className="flex items-center justify-between mb-3 gap-2 min-w-0">
                                            <div className="flex-shrink-0">
                                              {badgeForAccion(cambio.accion)}
                                            </div>
                                            <div className="text-xs text-gray-500 flex-shrink-0 text-right whitespace-nowrap">
                                              {fechaCambio.toLocaleDateString('es-ES', { 
                                                day: '2-digit', 
                                                month: 'short'
                                              })}, {fechaCambio.toLocaleTimeString('es-ES', { 
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </div>
                                          </div>
                                          
                                          {/* Estados */}
                                          <div className="flex items-center gap-2 mb-3 min-h-[28px] overflow-hidden">
                                            {cambio.estado_anterior && (
                                              <Badge
                                                variant="outline"
                                                className={`text-xs flex-shrink-0 ${getEstadoColor(
                                                  cambio.estado_anterior
                                                )}`}
                                              >
                                                {getEstadoLabel(cambio.estado_anterior)}
                                              </Badge>
                                            )}
                                            {cambio.estado_anterior && cambio.estado_nuevo && (
                                              <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            )}
                                            {cambio.estado_nuevo && (
                                              <Badge
                                                variant="outline"
                                                className={`text-xs flex-shrink-0 ${getEstadoColor(
                                                  cambio.estado_nuevo
                                                )}`}
                                              >
                                                {getEstadoLabel(cambio.estado_nuevo)}
                                              </Badge>
                                            )}
                                          </div>
                                          
                                          {/* Observación */}
                                          <div className="text-sm text-gray-600 mb-3 flex-1 overflow-hidden min-w-0">
                                            {cambio.observacion_anterior && cambio.observacion_nueva ? (
                                              <div className="space-y-1 h-full overflow-hidden">
                                                <div className="line-through text-gray-400 text-xs truncate">
                                                  {cambio.observacion_anterior}
                                                </div>
                                                <div 
                                                  className="font-medium overflow-hidden text-ellipsis"
                                                  style={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    wordBreak: 'break-all',
                                                    overflowWrap: 'anywhere'
                                                  }}
                                                >
                                                  {cambio.observacion_nueva}
                                                </div>
                                              </div>
                                            ) : (cambio.observacion_nueva || cambio.observacion_anterior) ? (
                                              <div 
                                                className="overflow-hidden h-full text-ellipsis"
                                                style={{
                                                  display: '-webkit-box',
                                                  WebkitLineClamp: 4,
                                                  WebkitBoxOrient: 'vertical',
                                                  wordBreak: 'break-all',
                                                  overflowWrap: 'anywhere'
                                                }}
                                              >
                                                {cambio.observacion_nueva || cambio.observacion_anterior}
                                              </div>
                                            ) : (
                                              <span className="text-gray-400 italic">Sin observación</span>
                                            )}
                                          </div>
                                          
                                          {/* Docente */}
                                          <div className="flex items-center gap-2 text-sm text-gray-500 pt-3 border-t border-gray-100 mt-auto min-h-[44px] min-w-0">
                                            <UserCheck className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">
                                              {cambio.orientador
                                                ? `${cambio.orientador.nombre.split(' ')[0]} ${cambio.orientador.apellido.split(' ')[0]}`
                                                : `ID ${cambio.id_orientador_registro}`}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                                {/* Paginación del historial expandido */}
                                {totalCambios > itemsPorPaginaHistorial && (
                                  <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-gray-200">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const paginaActual = paginaHistorialExpandido[h.id_asistencia!] || 1;
                                        if (paginaActual > 1) {
                                          setPaginaHistorialExpandido(prev => ({
                                            ...prev,
                                            [h.id_asistencia!]: paginaActual - 1
                                          }));
                                        }
                                      }}
                                      disabled={(paginaHistorialExpandido[h.id_asistencia!] || 1) <= 1}
                                      className="h-8 w-8 p-0"
                                    >
                                      <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    
                                    <span className="text-sm text-gray-600 px-2">
                                      {paginaHistorialExpandido[h.id_asistencia!] || 1} / {Math.ceil(totalCambios / itemsPorPaginaHistorial)}
                                    </span>
                                    
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const paginaActual = paginaHistorialExpandido[h.id_asistencia!] || 1;
                                        const totalPaginas = Math.ceil(totalCambios / itemsPorPaginaHistorial);
                                        if (paginaActual < totalPaginas) {
                                          setPaginaHistorialExpandido(prev => ({
                                            ...prev,
                                            [h.id_asistencia!]: paginaActual + 1
                                          }));
                                        }
                                      }}
                                      disabled={(paginaHistorialExpandido[h.id_asistencia!] || 1) >= Math.ceil(totalCambios / itemsPorPaginaHistorial)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <ChevronRight className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Footer con paginación mejorada */}
              {meta.totalPages > 1 && (
                <div className="px-4 py-3 bg-gray-50 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        Mostrando{' '}
                        <span className="font-semibold">
                          {(meta.currentPage - 1) * limit + 1}
                        </span>{' '}
                        a{' '}
                        <span className="font-semibold">
                          {Math.min(meta.currentPage * limit, meta.totalItems)}
                        </span>{' '}
                        de{' '}
                        <span className="font-semibold">{meta.totalItems}</span>{' '}
                        registros
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goPage(1)}
                        disabled={page <= 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goPage(page - 1)}
                        disabled={page <= 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      {/* Números de página */}
                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.min(5, meta.totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (meta.totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (page <= 3) {
                              pageNum = i + 1;
                            } else if (page >= meta.totalPages - 2) {
                              pageNum = meta.totalPages - 4 + i;
                            } else {
                              pageNum = page - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  page === pageNum ? 'default' : 'outline'
                                }
                                size="sm"
                                onClick={() => goPage(pageNum)}
                                className="h-8 w-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goPage(page + 1)}
                        disabled={page >= meta.totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goPage(meta.totalPages)}
                        disabled={page >= meta.totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modal de detalle */}
        <Dialog
          open={!!detalleModal}
          onOpenChange={(isOpen) => !isOpen && setDetalleModal(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalle del cambio</DialogTitle>
            </DialogHeader>
            {detalleModal && (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div>{badgeForAccion(detalleModal.accion)}</div>
                    <div className="text-sm text-gray-600">
                      Creado:{' '}
                      {new Date(detalleModal.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div>
                      <span className="text-gray-600">ID Historial:</span>{' '}
                      {detalleModal.id}
                    </div>
                    <div>
                      <span className="text-gray-600">ID Asistencia:</span>{' '}
                      {detalleModal.id_asistencia ?? '—'}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">Alumno</p>
                    <p className="font-medium">
                      {detalleModal.alumno
                        ? `${detalleModal.alumno.nombre} ${detalleModal.alumno.apellido}`
                        : `ID ${detalleModal.id_alumno}`}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">Asignatura</p>
                    <p className="font-medium">
                      {detalleModal.asignatura?.nombre ??
                        `ID ${detalleModal.id_asignatura}`}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">Docente</p>
                    <p className="font-medium">
                      {detalleModal.orientador
                        ? `${detalleModal.orientador.nombre} ${detalleModal.orientador.apellido}`
                        : `ID ${detalleModal.id_orientador_registro}`}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">
                      Fecha de Asistencia
                    </p>
                    <p className="font-medium">
                      {new Date(detalleModal.fecha).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">
                      Estado Anterior
                    </p>
                    <Badge variant="outline">
                      {detalleModal.estado_anterior ?? '—'}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">Estado Nuevo</p>
                    <Badge variant="outline">
                      {detalleModal.estado_nuevo ?? '—'}
                    </Badge>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">
                      Observación Anterior
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {detalleModal.observacion_anterior ?? '—'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">
                      Observación Nueva
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {detalleModal.observacion_nueva ?? '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // Reportes (placeholder)
  const renderReportes = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Reportes de Asistencia</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="curso-reporte">Curso</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los cursos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los cursos</SelectItem>
                  {cursosAsignados.map((curso) => (
                    <SelectItem
                      key={curso.id_curso}
                      value={curso.id_curso.toString()}
                    >
                      {curso.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="periodo">Período</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Último mes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ultima-semana">Última semana</SelectItem>
                  <SelectItem value="ultimo-mes">Último mes</SelectItem>
                  <SelectItem value="ultimo-trimestre">
                    Último trimestre
                  </SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Descargar Excel
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Asistencia
          </h1>
          <p className="text-gray-600 mt-1">
            Control y seguimiento de asistencia por cursos
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Cargando...</span>
            </div>
          )}
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            <Calendar className="w-4 h-4 mr-1" />
            Docente
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            value="tomar-asistencia"
            className="flex items-center space-x-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>Tomar Asistencia</span>
          </TabsTrigger>
          <TabsTrigger
            value="historial"
            className="flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Historial</span>
          </TabsTrigger>
          <TabsTrigger value="reportes" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Reportes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tomar-asistencia">
          {renderTomarAsistencia()}
        </TabsContent>
        <TabsContent value="historial">{renderHistorial()}</TabsContent>
        <TabsContent value="reportes">{renderReportes()}</TabsContent>
      </Tabs>
    </div>
  );
}
