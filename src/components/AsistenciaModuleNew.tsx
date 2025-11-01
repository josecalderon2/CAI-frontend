import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  FileText,
  Search,
  AlertCircle,
  UserCheck,
  BarChart3,
  AlertTriangle,
  Award,
  Download,
  Plus,
  Edit,
  Trash2,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { generarExcelResumenTrimestral } from '../utils/excelResumenTrimestral';
import { generarExcelResumenMensual } from '../utils/excelResumenMensual';
import { generarPDFResumenMensual } from '../utils/pdfResumenMensual';
import { generarPDFResumenTrimestral } from '../utils/pdfResumenTrimestral';

// Importar servicios refactorizados
import {
  asistenciaService,
  conductaService,
  resumenService,
  type EstadoAsistencia,
  type BulkAsistenciaDto,
  type ResumenMensualDto,
  type ResumenMensualResponse,
  type ResumenTrimestralDto,
  type ResumenTrimestralResponse,
  type InfraccionCatalogoResponse,
  type InfraccionResumen,
  type CreateInfraccionCatalogoDto,
  type CategoriaInfraccion,
  type ConductaConRelaciones,
} from '../api/services/asistenciaService';
import { cursosService } from '../api/services/cursosService';

// Interfaces
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
}

interface CursoResponse {
  id_curso: number;
  nombre: string;
  seccion?: string;
  descripcion?: string;
  id_grado_academico?: number | null;
  id_orientador?: number | null;
  cupo?: number | null;
  aula?: string | null;
  activo?: boolean;
  gradoAcademico?: {
    id_grado_academico: number;
    nombre: string;
  } | null;
  asignatura?: {
    id_asignatura: number;
    nombre: string;
  } | null;
}

export function AsistenciaModuleNew({ user }: AsistenciaModuleProps) {
  // Estados globales
  const [activeTab, setActiveTab] = useState<
    | 'asistencia'
    | 'conducta'
    | 'historial'
    | 'resumen-mensual'
    | 'resumen-trimestral'
  >('asistencia');
  const [isLoading, setIsLoading] = useState(false);
  const [cursosAsignados, setCursosAsignados] = useState<CursoResponse[]>([]);

  // Estados para Toma de Asistencia
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [alumnosPorCurso, setAlumnosPorCurso] = useState<
    Record<string, AlumnoResponse[]>
  >({});
  const [asistenciaActual, setAsistenciaActual] = useState<
    Record<string, { estado: EstadoAsistencia }>
  >({});
  const [busquedaAlumno, setBusquedaAlumno] = useState('');
  const [mostrarEstados, setMostrarEstados] = useState(false);

  // Estados para edición de asistencia
  const [asistenciasGuardadas, setAsistenciasGuardadas] = useState<
    Record<
      string,
      {
        id_asistencia: string;
        estado: EstadoAsistencia;
        observacion: string | null;
      }
    >
  >({});
  const [modalEdicion, setModalEdicion] = useState(false);
  const [asistenciaEditando, setAsistenciaEditando] = useState<{
    id_asistencia: string;
    id_alumno: number;
    nombreAlumno: string;
    estadoActual: EstadoAsistencia;
    observacionActual: string;
  } | null>(null);

  // Estados para Conducta
  const [catalogoInfracciones, setCatalogoInfracciones] = useState<
    InfraccionCatalogoResponse[]
  >([]);
  const [modalInfraccion, setModalInfraccion] = useState(false);
  const [modalConducta, setModalConducta] = useState(false);
  const [catalogoColapsado, setCatalogoColapsado] = useState(true); // Colapsado por defecto
  const [categoriaFiltro, setCategoriaFiltro] = useState<
    CategoriaInfraccion | 'TODAS'
  >('TODAS');
  const [busquedaAlumnoConducta, setBusquedaAlumnoConducta] = useState('');
  const [nuevaInfraccion, setNuevaInfraccion] =
    useState<CreateInfraccionCatalogoDto>({
      categoria: 'MENOS_GRAVE',
      articulo: '',
      descripcion: '',
      puntos: 0,
    });
  const [nuevaConducta, setNuevaConducta] = useState<{
    id_alumno: string;
    id_infracciones: string[];
    fecha: string;
  }>({
    id_alumno: '',
    id_infracciones: [],
    fecha: new Date().toISOString().split('T')[0],
  });
  const [modoEdicionInfraccion, setModoEdicionInfraccion] = useState(false);
  const [infraccionEditando, setInfraccionEditando] =
    useState<InfraccionCatalogoResponse | null>(null);

  // Estados para Listado de Registros de Conducta
  const [registrosConducta, setRegistrosConducta] = useState<any[]>([]);
  const [modalEditarConducta, setModalEditarConducta] = useState(false);
  const [conductaEditando, setConductaEditando] = useState<{
    id_conducta: string;
    id_alumno: number;
    nombreAlumno: string;
    id_infraccion: string;
    fecha: string;
    observacion: string;
  } | null>(null);
  const [busquedaRegistroConducta, setBusquedaRegistroConducta] = useState('');

  // Estados para Detalle de Alumno con Infracciones
  const [modalDetalleAlumno, setModalDetalleAlumno] = useState(false);
  const [alumnoDetalleSeleccionado, setAlumnoDetalleSeleccionado] =
    useState<AlumnoResponse | null>(null);
  const [infraccionesAlumno, setInfraccionesAlumno] = useState<any[]>([]);

  // Estados para Historial
  const [historialAsistencias, setHistorialAsistencias] = useState<any[]>([]);
  const [filtroHistorial, setFiltroHistorial] = useState({
    cursoId: 0,
    fechaDesde: '',
    fechaHasta: '',
  });
  const [modalEdicionHistorial, setModalEdicionHistorial] = useState(false);
  const [asistenciaHistorialEditando, setAsistenciaHistorialEditando] =
    useState<{
      id_asistencia: string;
      id_alumno: number;
      nombreAlumno: string;
      fecha: string;
      estadoActual: EstadoAsistencia;
    } | null>(null);

  // Estados para Resúmenes
  const [resumenMensual, setResumenMensual] = useState<
    ResumenMensualResponse[] | null
  >(null);
  const [resumenTrimestral, setResumenTrimestral] = useState<
    ResumenTrimestralResponse[] | null
  >(null);
  const [filtroResumenMensual, setFiltroResumenMensual] =
    useState<ResumenMensualDto>({
      cursoId: 0,
      mes: new Date().getMonth() + 1,
      anio: new Date().getFullYear(),
    });
  const [filtroResumenTrimestral, setFiltroResumenTrimestral] =
    useState<ResumenTrimestralDto>({
      cursoId: 0,
      trimestre: Math.floor(new Date().getMonth() / 4) + 1,
      anio: new Date().getFullYear(),
    });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
    if (activeTab === 'conducta') {
      cargarCatalogoInfracciones();
    }
  }, [user?.id, activeTab]);

  // Resetear fecha a hoy cuando se entra al tab de asistencia
  useEffect(() => {
    if (activeTab === 'asistencia') {
      const hoy = new Date();
      const year = hoy.getFullYear();
      const month = String(hoy.getMonth() + 1).padStart(2, '0');
      const day = String(hoy.getDate()).padStart(2, '0');
      setFechaSeleccionada(`${year}-${month}-${day}`);
    }
  }, [activeTab]);

  // Cargar registros de conducta cuando cambie el curso
  useEffect(() => {
    if (activeTab === 'conducta' && cursoSeleccionado) {
      cargarRegistrosConducta();
    }
  }, [cursoSeleccionado, activeTab]);

  // Cargar asistencias guardadas cuando cambia curso o fecha
  useEffect(() => {
    if (cursoSeleccionado && fechaSeleccionada) {
      console.log('🔄 Ejecutando carga de asistencias...', {
        curso: cursoSeleccionado,
        fecha: fechaSeleccionada,
      });
      cargarAsistenciasGuardadas();
    } else {
      // Si no hay curso o fecha seleccionada, limpiar estados
      setAsistenciasGuardadas({});
      setAsistenciaActual({});
    }
  }, [cursoSeleccionado, fechaSeleccionada]);

  const cargarDatosIniciales = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      let cursosResponse: CursoResponse[] = [];
      let cursosRaw: any[] = [];

      // ✅ Usar endpoint seguro /cursos/mis-cursos (valida con token JWT)
      try {
        const cursos = await cursosService.getMisCursos();
        cursosRaw = Array.isArray(cursos) ? cursos : [];
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message || err.message || 'Error desconocido';
        const statusCode = err?.response?.status;

        if (statusCode === 401) {
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        } else if (statusCode === 403) {
          toast.error('No tienes permisos para acceder a esta información.');
        } else {
          toast.error(`Error al cargar cursos: ${errorMsg}`);
        }

        setIsLoading(false);
        return;
      }

      // Procesar cursos encontrados
      if (cursosRaw.length > 0) {
        const cursosConAsignaturas = cursosRaw
          .filter((curso: any) => curso?.id_curso != null || curso?.id != null)
          .map((curso: any) => {
            // El backend retorna asignaturas como array, necesitamos mapearlo
            const asignaturasArray = curso.asignaturas || [];
            const primeraAsignatura =
              asignaturasArray.length > 0 ? asignaturasArray[0] : null;

            const cursoMapeado = {
              id_curso: curso.id_curso
                ? parseInt(curso.id_curso, 10)
                : parseInt(curso.id, 10),
              nombre: curso.nombre,
              seccion: curso.seccion ?? curso.nivel ?? '',
              cupo: curso.cupo ?? curso.alumnos ?? 0,
              descripcion: curso.descripcion ?? '',
              id_grado_academico: curso.id_grado_academico,
              id_orientador: curso.id_orientador,
              aula: curso.aula ?? '',
              activo: curso.activo ?? true,
              gradoAcademico: curso.gradoAcademico,
              // Usar la primera asignatura del array (el backend retorna asignaturas[] no asignatura)
              asignatura: primeraAsignatura
                ? {
                    id_asignatura: primeraAsignatura.id_asignatura,
                    nombre: primeraAsignatura.nombre,
                  }
                : null,
            };

            return cursoMapeado;
          });

        // ✅ CAMBIO: Ya no filtramos por asignatura - asistencia es por CURSO
        cursosResponse = cursosConAsignaturas as CursoResponse[];
      }

      if (cursosResponse.length === 0) {
        toast.warning(
          'No se encontraron cursos asignados. Verifica que tengas cursos como orientador.'
        );
      } else {
        toast.success(
          `${cursosResponse.length} curso(s) cargado(s) correctamente`
        );
      }

      setCursosAsignados(cursosResponse);

      // Cargar alumnos para cada curso
      const alumnosPorCursoTemp: Record<string, AlumnoResponse[]> = {};
      for (const curso of cursosResponse) {
        if (curso.id_curso) {
          try {
            const alumnosData = await cursosService.getAlumnosPorCurso(
              curso.id_curso
            );
            alumnosPorCursoTemp[curso.id_curso.toString()] = (
              alumnosData as any[]
            ).map((a: any) => ({
              id_alumno: a.id_alumno ?? parseInt(a.id, 10),
              nombre: a.nombre,
              apellido: a.apellido,
            }));
          } catch (err) {
            alumnosPorCursoTemp[curso.id_curso.toString()] = [];
          }
        }
      }
      setAlumnosPorCurso(alumnosPorCursoTemp);
    } catch (e) {
      toast.error('Error al cargar los datos iniciales');
    } finally {
      setIsLoading(false);
    }
  };

  const cargarCatalogoInfracciones = async () => {
    try {
      const catalogo = await conductaService.getAllCatalogo();
      setCatalogoInfracciones(catalogo);
    } catch (e) {
      toast.error('Error al cargar el catálogo de infracciones');
    }
  };

  const cargarAsistenciasGuardadas = async () => {
    if (!cursoSeleccionado || !fechaSeleccionada) return;

    try {
      const cursoActual = cursosAsignados.find(
        (c) => c.id_curso === parseInt(cursoSeleccionado)
      );

      if (!cursoActual?.id_curso) return;

      console.log('🔄 Cargando asistencias para:', {
        curso: cursoActual.nombre,
        fecha: fechaSeleccionada,
      });

      // Buscar asistencias del curso en la fecha seleccionada
      const asistencias = await asistenciaService.buscarConFiltros({
        cursoId: cursoActual.id_curso,
        fecha: fechaSeleccionada,
      });

      console.log('📊 Asistencias encontradas:', asistencias);

      // Mapear asistencias por id_alumno
      const asistenciasMap: Record<
        string,
        {
          id_asistencia: string;
          estado: EstadoAsistencia;
          observacion: string | null;
        }
      > = {};

      asistencias.forEach((asist: any) => {
        // ✅ CORREGIDO: Asegurar que id_alumno sea string para consistencia
        const alumnoId = String(asist.id_alumno);
        const asistenciaId = String(asist.id_asistencia);

        asistenciasMap[alumnoId] = {
          id_asistencia: asistenciaId,
          estado: asist.estado,
          observacion: asist.observacion || null,
        };
      });

      setAsistenciasGuardadas(asistenciasMap);

      // Limpiar cualquier estado actual que pueda interferir
      setAsistenciaActual({});
    } catch (e: any) {
      console.error('❌ Error al cargar asistencias guardadas:', e);
      console.error('📋 Detalles del error:', {
        status: e?.response?.status,
        data: e?.response?.data,
        message: e?.message,
      });

      // Mostrar mensaje específico según el error
      const errorMsg = e?.response?.data?.message || e.message;
      const statusCode = e?.response?.status;

      if (statusCode === 500) {
        console.error('🔴 Error 500 del servidor. Posibles causas:');
        console.error('   - El backend no está corriendo');
        console.error('   - Error en la base de datos');
        console.error('   - Error en el código del servicio backend');
        toast.error(
          'Error del servidor al cargar asistencias guardadas. Puedes marcar asistencia normalmente y guardar.',
          { duration: 6000 }
        );
      } else if (statusCode === 404) {
        // No hay asistencias guardadas para esta fecha (normal)
        console.log('ℹ️ No hay asistencias guardadas para esta fecha');
        toast.info('No hay asistencias previas para esta fecha');
      } else {
        toast.warning(`Error al cargar asistencias previas: ${errorMsg}`);
      }

      // Limpiar estados pero no bloquear la funcionalidad
      setAsistenciasGuardadas({});
      // NO limpiar asistenciaActual para que se mantengan los cambios del usuario
    }
  };

  const handleEditarAsistencia = (alumno: AlumnoResponse) => {
    const asistenciaGuardada =
      asistenciasGuardadas[alumno.id_alumno.toString()];

    if (!asistenciaGuardada) return;

    // Pre-cargar el estado actual en el modal para que se vea seleccionado
    setAsistenciaActual((prev) => ({
      ...prev,
      [alumno.id_alumno]: {
        estado: asistenciaGuardada.estado,
      },
    }));

    setAsistenciaEditando({
      id_asistencia: asistenciaGuardada.id_asistencia,
      id_alumno: alumno.id_alumno,
      nombreAlumno: `${alumno.nombre} ${alumno.apellido}`,
      estadoActual: asistenciaGuardada.estado,
      observacionActual: asistenciaGuardada.observacion || '',
    });
    setModalEdicion(true);
  };

  const handleGuardarEdicion = async () => {
    if (!asistenciaEditando) return;

    const estadoActual = asistenciaActual[asistenciaEditando.id_alumno];

    if (!estadoActual) {
      toast.error('Debe seleccionar un estado');
      return;
    }

    setIsLoading(true);
    try {
      await asistenciaService.update(asistenciaEditando.id_asistencia, {
        estado: estadoActual.estado,
        id_orientador: parseInt(user.id), // Registrar quién hizo la modificación
      });

      toast.success('Asistencia actualizada correctamente');

      // Actualizar el registro en memoria
      setAsistenciasGuardadas((prev) => ({
        ...prev,
        [asistenciaEditando.id_alumno]: {
          id_asistencia: asistenciaEditando.id_asistencia,
          estado: estadoActual.estado,
          observacion: null,
        },
      }));

      // Limpiar el estado actual para que no aparezca como "modificado"
      setAsistenciaActual((prev) => {
        const nuevo = { ...prev };
        delete nuevo[asistenciaEditando.id_alumno];
        return nuevo;
      });

      setModalEdicion(false);
      setAsistenciaEditando(null);
    } catch (e: any) {
      const errorMsg =
        e?.response?.data?.message || 'Error al actualizar la asistencia';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers para Asistencia
  const handleEstadoChange = (alumnoId: number, estado: EstadoAsistencia) => {
    setAsistenciaActual((prev) => ({
      ...prev,
      [alumnoId]: { estado },
    }));
  };

  const handleGuardarAsistencia = async () => {
    if (!cursoSeleccionado) {
      toast.error('Debe seleccionar un curso');
      return;
    }

    const cursoActual = cursosAsignados.find(
      (c) => c.id_curso === parseInt(cursoSeleccionado)
    );

    // ✅ CAMBIO: Ya no validamos asignatura - ahora la asistencia es por CURSO
    if (!cursoActual) {
      toast.error('El curso seleccionado no es válido');
      return;
    }

    if (Object.keys(asistenciaActual).length === 0) {
      toast.error('Debe marcar la asistencia de al menos un alumno');
      return;
    }

    setIsLoading(true);
    try {
      // Calcular trimestre basado en la fecha
      const fecha = new Date(fechaSeleccionada);
      const mes = fecha.getMonth() + 1;
      const trimestre = Math.ceil(mes / 4); // 1-4 = T1, 5-8 = T2, 9-12 = T3

      // Separar registros nuevos y modificaciones
      const registrosNuevos = Object.entries(asistenciaActual)
        .filter(([alumnoId]) => !asistenciasGuardadas[alumnoId])
        .map(([alumnoId, datos]) => ({
          id_alumno: parseInt(alumnoId),
          // ✅ CAMBIO: id_asignatura ahora es OPCIONAL - se omite para asistencia por curso
          // id_asignatura: cursoActual.asignatura!.id_asignatura, // ❌ YA NO SE ENVIA
          id_orientador: parseInt(user.id),
          fecha: fechaSeleccionada,
          estado: datos.estado,
          anio_academico: new Date().getFullYear().toString(),
          trimestre: trimestre,
        }));

      // Identificar modificaciones (registros que ya existen pero tienen estado diferente)
      const modificaciones = Object.entries(asistenciaActual).filter(
        ([alumnoId, datos]) => {
          const guardado = asistenciasGuardadas[alumnoId];
          return guardado && guardado.estado !== datos.estado;
        }
      );

      if (registrosNuevos.length === 0 && modificaciones.length === 0) {
        toast.warning('No hay cambios para guardar');
        return;
      }

      // Guardar registros nuevos
      if (registrosNuevos.length > 0) {
        const bulkData: BulkAsistenciaDto = { registros: registrosNuevos };
        await asistenciaService.createBulk(bulkData);
      }

      // Actualizar modificaciones
      if (modificaciones.length > 0) {
        await Promise.all(
          modificaciones.map(([alumnoId, datos]) => {
            const guardado = asistenciasGuardadas[alumnoId];
            return asistenciaService.update(guardado.id_asistencia, {
              estado: datos.estado,
              id_orientador: parseInt(user.id), // Registrar quién hizo la modificación
            });
          })
        );
      }

      toast.success(
        `Asistencia guardada correctamente (${registrosNuevos.length} nuevo${registrosNuevos.length !== 1 ? 's' : ''}, ${modificaciones.length} modificado${modificaciones.length !== 1 ? 's' : ''})`
      );

      // Recargar asistencias guardadas
      await cargarAsistenciasGuardadas();

      // Limpiar estados actuales ya guardados
      setAsistenciaActual({});
    } catch (e: any) {
      const errorMsg =
        e?.response?.data?.message || 'Error al guardar las asistencias';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const marcarTodosPresentes = () => {
    const alumnosDelCurso = cursoSeleccionado
      ? alumnosPorCurso[cursoSeleccionado] || []
      : [];

    // Verificar si todos los alumnos ya están marcados (guardados o en estado actual)
    const todosEstanMarcados = alumnosDelCurso.every((alumno) => {
      const idAlumno = alumno.id_alumno.toString();
      return asistenciaActual[idAlumno] || asistenciasGuardadas[idAlumno];
    });

    if (todosEstanMarcados) {
      // Si todos están marcados, desmarcar todos (limpiar estado actual)
      setAsistenciaActual({});
      toast.success('Asistencias desmarcadas');
    } else {
      // Si no todos están marcados, marcar todos como presentes
      const nuevaAsistencia: Record<string, { estado: EstadoAsistencia }> = {};
      alumnosDelCurso.forEach((alumno) => {
        nuevaAsistencia[alumno.id_alumno.toString()] = {
          estado: 'P',
        };
      });
      setAsistenciaActual(nuevaAsistencia);
      toast.success('Todos los alumnos marcados como presentes');
    }
  };

  // Handlers para Conducta
  const handleCrearInfraccion = async () => {
    if (!nuevaInfraccion.articulo || !nuevaInfraccion.descripcion) {
      toast.error('Debe completar artículo y descripción');
      return;
    }

    if (nuevaInfraccion.puntos <= 0) {
      toast.error('Los puntos deben ser mayor a 0');
      return;
    }

    setIsLoading(true);
    try {
      if (modoEdicionInfraccion && infraccionEditando) {
        // MODO EDICIÓN
        await conductaService.updateCatalogo(
          infraccionEditando.id_infraccion,
          nuevaInfraccion
        );
        toast.success('Infracción actualizada correctamente');
      } else {
        // MODO CREACIÓN
        await conductaService.createCatalogo(nuevaInfraccion);
        toast.success('Infracción creada correctamente en el catálogo');
      }

      setModalInfraccion(false);
      setModoEdicionInfraccion(false);
      setInfraccionEditando(null);
      setNuevaInfraccion({
        categoria: 'MENOS_GRAVE',
        articulo: '',
        descripcion: '',
        puntos: 1,
      });
      cargarCatalogoInfracciones();
    } catch (e: any) {
      const errorMsg =
        e?.response?.data?.message ||
        `Error al ${modoEdicionInfraccion ? 'actualizar' : 'crear'} la infracción`;
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbrirEditarInfraccion = (
    infraccion: InfraccionCatalogoResponse
  ) => {
    setNuevaInfraccion({
      categoria: infraccion.categoria,
      articulo: infraccion.articulo,
      descripcion: infraccion.descripcion,
      puntos: infraccion.puntos,
    });

    setInfraccionEditando(infraccion);
    setModoEdicionInfraccion(true);
    setModalInfraccion(true);
  };

  const handleEliminarInfraccion = async (idInfraccion: string) => {
    if (
      !confirm(
        '¿Estás seguro de eliminar esta infracción del catálogo?\n\nADVERTENCIA: Si hay registros de conducta asociados a esta infracción, no podrá eliminarse.'
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await conductaService.deleteCatalogo(idInfraccion);
      toast.success('Infracción eliminada correctamente del catálogo');
      await cargarCatalogoInfracciones();
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        'Error al eliminar la infracción. Puede que existan registros de conducta asociados.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones para gestión de registros de conducta
  const cargarRegistrosConducta = async () => {
    if (!cursoSeleccionado) return;

    setIsLoading(true);
    try {
      const registros = await conductaService.getAll();

      console.log('📋 DEBUG - Registros de conducta del backend:', registros);
      console.log('📋 DEBUG - Primer registro:', registros[0]);

      // Filtrar registros por los alumnos del curso seleccionado
      const alumnosIds = alumnosDelCurso.map((a) => a.id_alumno);
      const registrosFiltrados = registros.filter((r) =>
        alumnosIds.includes(parseInt(r.id_alumno))
      );

      console.log(
        '📋 DEBUG - Registros filtrados por curso:',
        registrosFiltrados.length
      );
      setRegistrosConducta(registrosFiltrados);
    } catch (e: any) {
      console.error('Error al cargar registros de conducta:', e);
      toast.error('Error al cargar registros de conducta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbrirEditarConducta = (registro: any) => {
    const alumno = alumnosDelCurso.find(
      (a) => a.id_alumno === parseInt(registro.id_alumno)
    );

    setConductaEditando({
      id_conducta: registro.id_conducta,
      id_alumno: parseInt(registro.id_alumno),
      nombreAlumno: alumno
        ? `${alumno.nombre} ${alumno.apellido}`
        : 'Desconocido',
      id_infraccion: registro.id_infraccion,
      fecha: registro.fecha,
      observacion: registro.observacion || '',
    });
    setModalEditarConducta(true);
  };

  const handleGuardarEdicionConducta = async () => {
    if (!conductaEditando) return;

    if (!conductaEditando.id_infraccion) {
      toast.error('Por favor selecciona una infracción');
      return;
    }

    setIsLoading(true);
    try {
      await conductaService.update(conductaEditando.id_conducta, {
        id_infraccion: conductaEditando.id_infraccion,
      });

      toast.success('Registro de conducta actualizado correctamente');
      setModalEditarConducta(false);
      setConductaEditando(null);

      // Recargar la lista general de registros de conducta
      await cargarRegistrosConducta();

      // Si estamos viendo el detalle del alumno, recargar sus infracciones
      if (alumnoDetalleSeleccionado) {
        await handleVerDetalleAlumno(alumnoDetalleSeleccionado);
      }
    } catch (e: any) {
      const errorMsg =
        e?.response?.data?.message ||
        'Error al actualizar el registro de conducta';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEliminarConducta = async (idConducta: string) => {
    if (
      !confirm(
        '¿Estás seguro de eliminar este registro de conducta?\n\nEsta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await conductaService.delete(idConducta);
      toast.success('Registro de conducta eliminado correctamente');

      // Actualizar inmediatamente el estado local del modal de detalle
      if (modalDetalleAlumno && infraccionesAlumno.length > 0) {
        // Filtrar la infracción eliminada del estado local
        setInfraccionesAlumno((prev) =>
          prev.filter((inf) => inf.id_conducta !== idConducta)
        );
      }

      // Recargar la lista general de registros de conducta
      await cargarRegistrosConducta();

      // Si estamos viendo el detalle del alumno, recargar sus infracciones desde el servidor
      if (alumnoDetalleSeleccionado) {
        try {
          const infraccionesActualizadas = await conductaService.getByAlumno(
            alumnoDetalleSeleccionado.id_alumno.toString()
          );
          setInfraccionesAlumno(infraccionesActualizadas);
        } catch (e) {
          console.error('Error al recargar infracciones del alumno:', e);
          // Si hay error, al menos mantener el estado filtrado localmente
        }
      }
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        'Error al eliminar el registro de conducta';
      toast.error(errorMsg);

      // Si hay error, recargar el modal para mostrar el estado correcto
      if (alumnoDetalleSeleccionado) {
        try {
          const infraccionesActualizadas = await conductaService.getByAlumno(
            alumnoDetalleSeleccionado.id_alumno.toString()
          );
          setInfraccionesAlumno(infraccionesActualizadas);
        } catch (e) {
          console.error('Error al recargar infracciones después de error:', e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Función para abrir el detalle de un alumno y cargar sus infracciones
  const handleVerDetalleAlumno = async (alumno: AlumnoResponse) => {
    setAlumnoDetalleSeleccionado(alumno);
    setIsLoading(true);

    try {
      const infracciones = await conductaService.getByAlumno(
        alumno.id_alumno.toString()
      );
      console.log(
        `📋 Infracciones de ${alumno.nombre} ${alumno.apellido}:`,
        infracciones
      );
      setInfraccionesAlumno(infracciones);
      setModalDetalleAlumno(true);
    } catch (e: any) {
      console.error('Error al cargar infracciones del alumno:', e);
      toast.error('Error al cargar infracciones del alumno');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrarConducta = async () => {
    if (
      !nuevaConducta.id_alumno ||
      nuevaConducta.id_infracciones.length === 0
    ) {
      toast.error('Debe seleccionar un alumno y al menos una infracción');
      return;
    }

    if (!nuevaConducta.fecha) {
      toast.error('Debe seleccionar una fecha');
      return;
    }

    setIsLoading(true);
    try {
      // Validar que los IDs sean números válidos
      const idAlumno = parseInt(nuevaConducta.id_alumno, 10);
      const idOrientador = parseInt(user.id, 10);

      if (isNaN(idAlumno) || isNaN(idOrientador)) {
        toast.error(
          'Error al procesar los datos. Por favor, intenta nuevamente.'
        );
        return;
      }

      // Calcular trimestre y año académico automáticamente
      const fechaConducta = new Date(nuevaConducta.fecha);
      const mesConducta = fechaConducta.getMonth() + 1;
      const trimestreConducta = Math.ceil(mesConducta / 4);
      const anioAcademicoConducta = fechaConducta.getFullYear().toString();

      // Crear un registro de conducta por cada infracción seleccionada
      const promesas = nuevaConducta.id_infracciones.map(
        async (idInfraccionStr) => {
          const idInfraccion = parseInt(idInfraccionStr, 10);

          if (isNaN(idInfraccion)) {
            throw new Error('ID de infracción inválido');
          }

          // Buscar la infracción para obtener la descripción
          const infraccionSeleccionada = catalogoInfracciones.find(
            (i) => String(i.id_infraccion) === String(idInfraccionStr)
          );

          if (!infraccionSeleccionada) {
            throw new Error('Infracción no encontrada');
          }

          // Construir el objeto con los campos obligatorios
          const conductaData: any = {
            id_alumno: idAlumno,
            id_infraccion: idInfraccion,
            id_orientador: idOrientador,
            fecha: new Date(nuevaConducta.fecha).toISOString(),
            descripcion: infraccionSeleccionada.descripcion,
            trimestre: trimestreConducta,
            anio_academico: anioAcademicoConducta,
          };

          return conductaService.create(conductaData);
        }
      );

      // Ejecutar todas las promesas en paralelo
      await Promise.all(promesas);

      const alumno = alumnosDelCurso.find(
        (a) => a.id_alumno.toString() === nuevaConducta.id_alumno
      );

      toast.success(
        `${nuevaConducta.id_infracciones.length} conducta(s) registrada(s) para ${alumno?.nombre} ${alumno?.apellido}`
      );

      setModalConducta(false);
      setNuevaConducta({
        id_alumno: '',
        id_infracciones: [],
        fecha: new Date().toISOString().split('T')[0],
      });
      setBusquedaAlumnoConducta('');
    } catch (e: any) {
      const errorMsg =
        e?.response?.data?.message || 'Error al registrar las conductas';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers para Historial
  const handleCargarHistorial = async () => {
    if (!filtroHistorial.cursoId || filtroHistorial.cursoId === 0) {
      toast.error('Debe seleccionar un curso');
      return;
    }

    setIsLoading(true);
    try {
      const cursoActual = cursosAsignados.find(
        (c) => c.id_curso === filtroHistorial.cursoId
      );

      if (!cursoActual?.id_curso) {
        toast.error('Curso no encontrado');
        return;
      }

      const params: any = {
        cursoId: cursoActual.id_curso,
      };

      // Enviar fechas en formato ISO UTC para evitar problemas de zona horaria
      if (filtroHistorial.fechaDesde) {
        // Crear fecha en zona horaria local y enviar en formato YYYY-MM-DD
        params.fechaDesde = filtroHistorial.fechaDesde;
      }
      if (filtroHistorial.fechaHasta) {
        // Crear fecha en zona horaria local y enviar en formato YYYY-MM-DD
        params.fechaHasta = filtroHistorial.fechaHasta;
      }

      console.log('📅 Filtros de fecha enviados:', params);

      const asistencias = await asistenciaService.buscarConFiltros(params);

      console.log('📊 Asistencias recibidas:', asistencias.length);
      if (asistencias.length > 0) {
        console.log('📊 Primera asistencia:', asistencias[0]);
      }

      setHistorialAsistencias(asistencias);
      toast.success(`${asistencias.length} registro(s) encontrado(s)`);
    } catch (e: any) {
      console.error('❌ Error al cargar historial:', e);
      toast.error('Error al cargar el historial de asistencias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditarAsistenciaHistorial = (asist: any) => {
    setAsistenciaHistorialEditando({
      id_asistencia: asist.id_asistencia,
      id_alumno: asist.id_alumno,
      nombreAlumno: `${asist.alumno.nombre} ${asist.alumno.apellido}`,
      fecha: new Date(asist.fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      estadoActual: asist.estado,
    });
    // Pre-cargar el estado actual
    setAsistenciaActual({
      [asist.id_alumno]: {
        estado: asist.estado,
      },
    });
    setModalEdicionHistorial(true);
  };

  const handleGuardarEdicionHistorial = async () => {
    if (!asistenciaHistorialEditando) return;

    const nuevoEstado = asistenciaActual[asistenciaHistorialEditando.id_alumno];

    if (!nuevoEstado) {
      toast.error('Debe seleccionar un estado');
      return;
    }

    // Verificar si realmente cambió el estado
    if (nuevoEstado.estado === asistenciaHistorialEditando.estadoActual) {
      toast.warning('No se detectaron cambios en el estado');
      return;
    }

    setIsLoading(true);
    try {
      await asistenciaService.update(
        asistenciaHistorialEditando.id_asistencia,
        {
          estado: nuevoEstado.estado,
          id_orientador: parseInt(user.id),
        }
      );

      toast.success('Asistencia actualizada correctamente');

      // Recargar el historial
      await handleCargarHistorial();

      // Cerrar modal y limpiar estados
      setModalEdicionHistorial(false);
      setAsistenciaHistorialEditando(null);
      setAsistenciaActual({});
    } catch (e: any) {
      const errorMsg =
        e?.response?.data?.message || 'Error al actualizar la asistencia';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers para Resúmenes
  const handleGenerarResumenMensual = async () => {
    if (!filtroResumenMensual.cursoId || filtroResumenMensual.cursoId === 0) {
      toast.error('Debe seleccionar un curso');
      return;
    }

    setIsLoading(true);
    try {
      const resumen =
        await resumenService.getResumenMensual(filtroResumenMensual);
      setResumenMensual(resumen);
      toast.success('Resumen mensual generado correctamente');
    } catch (e: any) {
      toast.error('Error al generar el resumen mensual');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerarResumenTrimestral = async () => {
    if (
      !filtroResumenTrimestral.cursoId ||
      filtroResumenTrimestral.cursoId === 0
    ) {
      toast.error('Debe seleccionar un curso');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📊 === RESUMEN TRIMESTRAL - DEBUG ===');
      console.log('📊 Filtros enviados:', filtroResumenTrimestral);

      const resumen = await resumenService.getResumenTrimestral(
        filtroResumenTrimestral
      );

      console.log('📊 Resumen recibido del backend:', resumen);
      console.log('📊 Total de alumnos:', resumen.length);

      if (resumen.length > 0) {
        console.log('📊 Primer alumno completo:', resumen[0]);
        console.log('📊 Estructura del primer alumno:', {
          id_alumno: resumen[0].id_alumno,
          nombre: resumen[0].nombre,
          apellido: resumen[0].apellido,
          justificadas: resumen[0].justificadas,
          injustificadas: resumen[0].injustificadas,
          infracciones: resumen[0].infracciones,
          puntajeConducta: resumen[0].puntajeConducta,
        });

        if (resumen[0].infracciones && resumen[0].infracciones.length > 0) {
          console.log('📊 Primera infracción:', resumen[0].infracciones[0]);
        }
      }

      setResumenTrimestral(resumen);

      if (resumen.length === 0) {
        toast.warning('No se encontraron registros para este trimestre');
      } else {
        toast.success(
          `Resumen trimestral generado: ${resumen.length} alumno(s)`
        );
      }
    } catch (e: any) {
      console.error('❌ Error al generar resumen trimestral:', e);
      console.error('❌ Detalles del error:', {
        message: e.message,
        response: e.response?.data,
        status: e.response?.status,
      });
      toast.error(
        `Error al generar el resumen trimestral: ${e.message || 'Error desconocido'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Utiles
  const alumnosDelCurso = cursoSeleccionado
    ? alumnosPorCurso[cursoSeleccionado] || []
    : [];
  const alumnosFiltrados = alumnosDelCurso.filter((al) =>
    `${al.nombre} ${al.apellido}`
      .toLowerCase()
      .includes(busquedaAlumno.toLowerCase())
  );

  const contarEstados = () => {
    let presentes = 0;
    let ausentes = 0;
    let tardes = 0;
    let marcados = 0;

    console.log('📊 DEBUG contarEstados:');
    console.log('   - Total alumnos del curso:', alumnosDelCurso.length);
    console.log(
      '   - Total asistencias guardadas:',
      Object.keys(asistenciasGuardadas).length
    );
    console.log(
      '   - Total asistencias actuales:',
      Object.keys(asistenciaActual).length
    );

    alumnosDelCurso.forEach((alumno, index) => {
      const idAlumno = alumno.id_alumno.toString();
      const estadoActual = asistenciaActual[idAlumno];
      const asistenciaGuardada = asistenciasGuardadas[idAlumno];

      // Determinar el estado a mostrar (prioridad: actual > guardado)
      const estadoAMostrar = estadoActual || asistenciaGuardada;

      if (index < 3) {
        console.log(`   👤 Alumno ${index + 1}:`, {
          id: idAlumno,
          estadoActual,
          asistenciaGuardada,
          estadoAMostrar,
        });
      }

      if (estadoAMostrar) {
        marcados++;
        if (estadoAMostrar.estado === 'P' || estadoAMostrar.estado === 'E') {
          presentes++;
        } else if (estadoAMostrar.estado === 'A') {
          ausentes++;
        } else if (estadoAMostrar.estado === 'SP') {
          tardes++;
        }
      }
    });

    return {
      presentes,
      ausentes,
      tardes,
      sinMarcar: alumnosDelCurso.length - marcados,
    };
  };

  const estadosCount = contarEstados();

  const getBadgeColor = (categoria: CategoriaInfraccion) => {
    switch (categoria) {
      case 'MENOS_GRAVE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'GRAVE':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MUY_GRAVE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoriaLabel = (categoria: CategoriaInfraccion) => {
    switch (categoria) {
      case 'MENOS_GRAVE':
        return 'Menos Grave';
      case 'GRAVE':
        return 'Grave';
      case 'MUY_GRAVE':
        return 'Muy Grave';
      default:
        return categoria;
    }
  };

  const getCategoriaIcon = (categoria: CategoriaInfraccion) => {
    switch (categoria) {
      case 'MENOS_GRAVE':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'GRAVE':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'MUY_GRAVE':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getPuntosPorCategoria = (categoria: CategoriaInfraccion) => {
    switch (categoria) {
      case 'MENOS_GRAVE':
        return 1;
      case 'GRAVE':
        return 2;
      case 'MUY_GRAVE':
        return 3;
      default:
        return 0;
    }
  };

  // Agrupar infracciones por categoría
  const infraccionesPorCategoria = {
    MENOS_GRAVE: catalogoInfracciones.filter(
      (inf) => inf.categoria === 'MENOS_GRAVE'
    ),
    GRAVE: catalogoInfracciones.filter((inf) => inf.categoria === 'GRAVE'),
    MUY_GRAVE: catalogoInfracciones.filter(
      (inf) => inf.categoria === 'MUY_GRAVE'
    ),
  };

  // Filtrar alumnos en modal de conducta
  const alumnosFiltradosConducta = alumnosDelCurso.filter((al) =>
    `${al.nombre} ${al.apellido}`
      .toLowerCase()
      .includes(busquedaAlumnoConducta.toLowerCase())
  );

  // Obtener infracciones seleccionadas
  const infraccionesSeleccionadas = catalogoInfracciones.filter((inf) =>
    nuevaConducta.id_infracciones.includes(String(inf.id_infraccion))
  );

  // Handler para toggle de selección de infracción
  const toggleInfraccion = (idInfraccion: string) => {
    const infracciones = [...nuevaConducta.id_infracciones];
    const index = infracciones.indexOf(idInfraccion);

    if (index > -1) {
      // Ya está seleccionada, removerla
      infracciones.splice(index, 1);
    } else {
      // No está seleccionada, agregarla
      infracciones.push(idInfraccion);
    }

    setNuevaConducta({
      ...nuevaConducta,
      id_infracciones: infracciones,
    });
  };

  // Helper para obtener resumen de infracciones de un alumno
  const obtenerResumenInfraccionesAlumno = (idAlumno: number) => {
    const conductasAlumno = registrosConducta.filter(
      (r) => parseInt(r.id_alumno) === idAlumno
    );

    const conteo = {
      total: conductasAlumno.length,
      menosGraves: 0,
      graves: 0,
      muyGraves: 0,
    };

    conductasAlumno.forEach((conducta) => {
      if (conducta.infraccion) {
        switch (conducta.infraccion.categoria) {
          case 'MENOS_GRAVE':
            conteo.menosGraves++;
            break;
          case 'GRAVE':
            conteo.graves++;
            break;
          case 'MUY_GRAVE':
            conteo.muyGraves++;
            break;
        }
      }
    });

    return conteo;
  };

  // Render tabs
  const renderTomarAsistencia = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Configuración de Asistencia</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="curso">Curso</Label>
              <Select
                value={cursoSeleccionado}
                onValueChange={setCursoSeleccionado}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el curso para tomar asistencia" />
                </SelectTrigger>
                <SelectContent>
                  {cursosAsignados.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      No hay cursos disponibles
                    </div>
                  ) : (
                    cursosAsignados.map((curso) => (
                      <SelectItem
                        key={curso.id_curso}
                        value={curso.id_curso.toString()}
                      >
                        {curso.nombre}
                        {curso.seccion ? ` - ${curso.seccion}` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!cursoSeleccionado && (
                <p className="text-xs text-gray-500 mt-1">
                  Primero selecciona un curso para comenzar
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="fecha-asistencia">Fecha de Registro</Label>
              <Input
                id="fecha-asistencia"
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                max={(() => {
                  const hoy = new Date();
                  const year = hoy.getFullYear();
                  const month = String(hoy.getMonth() + 1).padStart(2, '0');
                  const day = String(hoy.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                })()}
                className="h-10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Selecciona la fecha para tomar asistencia. Si olvidaste tomar
                asistencia de un día anterior, cámbiala aquí. El historial es
                para corregir estados de asistencias ya guardadas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!!cursoSeleccionado && (
        <>
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
                  {(() => {
                    const todosEstanMarcados = alumnosDelCurso.every(
                      (alumno) => {
                        const idAlumno = alumno.id_alumno.toString();
                        return (
                          asistenciaActual[idAlumno] ||
                          asistenciasGuardadas[idAlumno]
                        );
                      }
                    );

                    return todosEstanMarcados ? (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Desmarcar Todos
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marcar Todos Presentes
                      </>
                    );
                  })()}
                </Button>
                <Button
                  onClick={handleGuardarAsistencia}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={
                    isLoading || Object.keys(asistenciaActual).length === 0
                  }
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading
                    ? 'Guardando...'
                    : (() => {
                        const nuevos = Object.entries(asistenciaActual).filter(
                          ([id]) => !asistenciasGuardadas[id]
                        ).length;
                        const modificados = Object.entries(
                          asistenciaActual
                        ).filter(([id]) => {
                          const guardado = asistenciasGuardadas[id];
                          const actual = asistenciaActual[id];
                          return (
                            guardado &&
                            actual &&
                            guardado.estado !== actual.estado
                          );
                        }).length;

                        const partes = [];
                        if (nuevos > 0)
                          partes.push(
                            `${nuevos} nuevo${nuevos !== 1 ? 's' : ''}`
                          );
                        if (modificados > 0)
                          partes.push(
                            `${modificados} modificado${modificados !== 1 ? 's' : ''}`
                          );

                        return `Guardar (${partes.join(', ')})`;
                      })()}
                </Button>
                <Button
                  onClick={() => setMostrarEstados(!mostrarEstados)}
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {mostrarEstados ? 'Ocultar' : 'Ver'} Estados de Asistencia
                </Button>
              </div>
            </CardContent>
          </Card>

          {mostrarEstados && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 text-base">
                    Estados de Asistencia
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start space-x-3 bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold text-sm">
                          P
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          Presente
                        </p>
                        <p className="text-xs text-gray-600">
                          Alumno asistió normalmente
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-bold text-sm">
                          A
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          Atraso
                        </p>
                        <p className="text-xs text-gray-600">
                          Llegó tarde a clase
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-bold text-xs">
                          SP
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          Sin Permiso
                        </p>
                        <p className="text-xs text-gray-600">
                          Ausente sin justificación (-0.2 pts)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">
                          E
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          Con Permiso
                        </p>
                        <p className="text-xs text-gray-600">
                          Ausente justificada (no afecta)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-700">
                      <span className="font-semibold text-gray-900">
                        Fórmula de Conducta:
                      </span>{' '}
                      10 - (SP × 0.2) - (Menos Graves × 1) - (Graves × 2) - (Muy
                      Graves × 3)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Lista de Alumnos</span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar alumno..."
                    value={busquedaAlumno}
                    onChange={(e) => setBusquedaAlumno(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alumnosFiltrados.map((alumno) => {
                  // Verificar estados
                  const alumnoIdStr = alumno.id_alumno.toString();
                  const asistenciaGuardada = asistenciasGuardadas[alumnoIdStr];
                  const estadoActual = asistenciaActual[alumnoIdStr];

                  // CORREGIDO: Determinar el estado a mostrar correctamente
                  // Prioridad: estado temporal > estado guardado > sin estado
                  const estadoAMostrar = estadoActual
                    ? estadoActual
                    : asistenciaGuardada
                      ? {
                          estado: asistenciaGuardada.estado,
                          observacion: asistenciaGuardada.observacion || '',
                        }
                      : null;

                  // Detectar tipos de cambios
                  const esNuevo = estadoActual && !asistenciaGuardada;
                  const hayModificacion =
                    estadoActual &&
                    asistenciaGuardada &&
                    estadoActual.estado !== asistenciaGuardada.estado;
                  const estaGuardado = asistenciaGuardada && !estadoActual;

                  // ✅ NUEVO: Determinar si los botones deben estar bloqueados
                  const botonesBloqueados = !!asistenciaGuardada;

                  // Función para obtener el color del borde y fondo del card según el estado
                  const getCardBorderColor = () => {
                    if (hayModificacion) {
                      return 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100 shadow-sm';
                    }
                    if (esNuevo) {
                      return 'bg-blue-50 border-blue-200 hover:bg-blue-100 shadow-sm';
                    }
                    if (estaGuardado) {
                      // ✅ Colorear toda la fila según el estado guardado (más visible)
                      switch (asistenciaGuardada.estado) {
                        case 'P':
                          return 'bg-green-100 border-green-300 hover:bg-green-200 shadow-sm';
                        case 'A':
                          return 'bg-orange-100 border-orange-300 hover:bg-orange-200 shadow-sm';
                        case 'SP':
                          return 'bg-red-100 border-red-300 hover:bg-red-200 shadow-sm';
                        case 'E':
                          return 'bg-blue-100 border-blue-300 hover:bg-blue-200 shadow-sm';
                        default:
                          return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
                      }
                    }
                    return 'bg-white border-gray-200 hover:bg-gray-50';
                  };
                  return (
                    <div
                      key={alumno.id_alumno}
                      className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 border-2 ${getCardBorderColor()}`}
                    >
                      <div className="flex-1 flex items-center gap-3">
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          {alumno.nombre} {alumno.apellido}
                          {botonesBloqueados && (
                            <span
                              className="text-gray-500 text-sm"
                              title="Registro guardado - Usa 'Editar' para modificar"
                            >
                              🔒
                            </span>
                          )}
                        </p>

                        {/* Badges solo para estados de cambio (modificado/nuevo) */}
                        {hayModificacion && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-100 text-yellow-800 border-yellow-400 text-xs font-semibold animate-pulse"
                          >
                            ⚠ Modificado
                          </Badge>
                        )}
                        {esNuevo && (
                          <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-800 border-blue-300 text-xs font-semibold"
                          >
                            📝 Nuevo
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant={
                              estadoAMostrar?.estado === 'P'
                                ? 'default'
                                : 'outline'
                            }
                            onClick={() =>
                              !botonesBloqueados &&
                              handleEstadoChange(alumno.id_alumno, 'P')
                            }
                            disabled={botonesBloqueados}
                            className={`transition-all duration-200 ${
                              estadoAMostrar?.estado === 'P'
                                ? 'bg-green-600 hover:bg-green-700 text-white border-2 border-green-800 shadow-lg scale-105 font-bold'
                                : 'border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 hover:scale-105'
                            } ${botonesBloqueados ? 'opacity-95 cursor-not-allowed hover:scale-100' : ''}`}
                            title={
                              botonesBloqueados
                                ? 'Usa el botón "Editar" para modificar'
                                : 'Presente'
                            }
                          >
                            <CheckCircle
                              className={`w-4 h-4 ${estadoAMostrar?.estado === 'P' ? 'animate-pulse' : ''}`}
                            />
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              estadoAMostrar?.estado === 'A'
                                ? 'default'
                                : 'outline'
                            }
                            onClick={() =>
                              !botonesBloqueados &&
                              handleEstadoChange(alumno.id_alumno, 'A')
                            }
                            disabled={botonesBloqueados}
                            className={`transition-all duration-200 ${
                              estadoAMostrar?.estado === 'A'
                                ? 'bg-orange-600 hover:bg-orange-700 text-white border-2 border-orange-800 shadow-lg scale-105 font-bold'
                                : 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 hover:scale-105'
                            } ${botonesBloqueados ? 'opacity-95 cursor-not-allowed hover:scale-100' : ''}`}
                            title={
                              botonesBloqueados
                                ? 'Usa el botón "Editar" para modificar'
                                : 'Atraso/Tarde'
                            }
                          >
                            <Clock
                              className={`w-4 h-4 ${estadoAMostrar?.estado === 'A' ? 'animate-pulse' : ''}`}
                            />
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              estadoAMostrar?.estado === 'SP'
                                ? 'default'
                                : 'outline'
                            }
                            onClick={() =>
                              !botonesBloqueados &&
                              handleEstadoChange(alumno.id_alumno, 'SP')
                            }
                            disabled={botonesBloqueados}
                            className={`transition-all duration-200 ${
                              estadoAMostrar?.estado === 'SP'
                                ? 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-800 shadow-lg scale-105 font-bold'
                                : 'border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 hover:scale-105'
                            } ${botonesBloqueados ? 'opacity-95 cursor-not-allowed hover:scale-100' : ''}`}
                            title={
                              botonesBloqueados
                                ? 'Usa el botón "Editar" para modificar'
                                : 'Ausente Sin Permiso'
                            }
                          >
                            <XCircle
                              className={`w-4 h-4 ${estadoAMostrar?.estado === 'SP' ? 'animate-pulse' : ''}`}
                            />
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              estadoAMostrar?.estado === 'E'
                                ? 'default'
                                : 'outline'
                            }
                            onClick={() =>
                              !botonesBloqueados &&
                              handleEstadoChange(alumno.id_alumno, 'E')
                            }
                            disabled={botonesBloqueados}
                            className={`transition-all duration-200 ${
                              estadoAMostrar?.estado === 'E'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-800 shadow-lg scale-105 font-bold'
                                : 'border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 hover:scale-105'
                            } ${botonesBloqueados ? 'opacity-95 cursor-not-allowed hover:scale-100' : ''}`}
                            title={
                              botonesBloqueados
                                ? 'Usa el botón "Editar" para modificar'
                                : 'Ausente Justificado/Con Permiso'
                            }
                          >
                            <Shield
                              className={`w-4 h-4 ${estadoAMostrar?.estado === 'E' ? 'animate-pulse' : ''}`}
                            />
                          </Button>
                        </div>

                        {/* Botón de edición - solo aparece si ya hay asistencia guardada */}
                        {asistenciaGuardada && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditarAsistencia(alumno)}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            title="Editar asistencia guardada"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Modal de edición de asistencia */}
      <Dialog open={modalEdicion} onOpenChange={setModalEdicion}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5 text-blue-600" />
              <span>Editar Asistencia</span>
            </DialogTitle>
          </DialogHeader>
          {asistenciaEditando && (
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  Editando asistencia de{' '}
                  <strong>{asistenciaEditando.nombreAlumno}</strong>
                  <br />
                  <span className="text-xs text-gray-600">
                    Estado anterior:{' '}
                    <Badge variant="outline" className="ml-1">
                      {asistenciaEditando.estadoActual === 'P' && 'Presente'}
                      {asistenciaEditando.estadoActual === 'E' && 'Con Permiso'}
                      {asistenciaEditando.estadoActual === 'SP' &&
                        'Sin Permiso'}
                      {asistenciaEditando.estadoActual === 'A' && 'Atraso'}
                    </Badge>
                  </span>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Nuevo Estado</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={
                      asistenciaActual[asistenciaEditando.id_alumno]?.estado ===
                      'P'
                        ? 'default'
                        : 'outline'
                    }
                    onClick={() =>
                      handleEstadoChange(asistenciaEditando.id_alumno, 'P')
                    }
                    className={
                      asistenciaActual[asistenciaEditando.id_alumno]?.estado ===
                      'P'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    }
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Presente
                  </Button>
                  <Button
                    variant={
                      asistenciaActual[asistenciaEditando.id_alumno]?.estado ===
                      'E'
                        ? 'default'
                        : 'outline'
                    }
                    onClick={() =>
                      handleEstadoChange(asistenciaEditando.id_alumno, 'E')
                    }
                    className={
                      asistenciaActual[asistenciaEditando.id_alumno]?.estado ===
                      'E'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                    }
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Con Permiso
                  </Button>
                  <Button
                    variant={
                      asistenciaActual[asistenciaEditando.id_alumno]?.estado ===
                      'SP'
                        ? 'default'
                        : 'outline'
                    }
                    onClick={() =>
                      handleEstadoChange(asistenciaEditando.id_alumno, 'SP')
                    }
                    className={
                      asistenciaActual[asistenciaEditando.id_alumno]?.estado ===
                      'SP'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'border-red-300 text-red-700 hover:bg-red-50'
                    }
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Sin Permiso
                  </Button>
                  <Button
                    variant={
                      asistenciaActual[asistenciaEditando.id_alumno]?.estado ===
                      'A'
                        ? 'default'
                        : 'outline'
                    }
                    onClick={() =>
                      handleEstadoChange(asistenciaEditando.id_alumno, 'A')
                    }
                    className={
                      asistenciaActual[asistenciaEditando.id_alumno]?.estado ===
                      'A'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'border-orange-300 text-orange-700 hover:bg-orange-50'
                    }
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Atraso
                  </Button>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setModalEdicion(false);
                    setAsistenciaEditando(null);
                    // Restaurar estado anterior
                    if (
                      asistenciasGuardadas[
                        asistenciaEditando.id_alumno.toString()
                      ]
                    ) {
                      const guardada =
                        asistenciasGuardadas[
                          asistenciaEditando.id_alumno.toString()
                        ];
                      setAsistenciaActual((prev) => ({
                        ...prev,
                        [asistenciaEditando.id_alumno]: {
                          estado: guardada.estado,
                        },
                      }));
                    }
                  }}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGuardarEdicion}
                  disabled={
                    isLoading ||
                    !asistenciaActual[asistenciaEditando.id_alumno]?.estado
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderConducta = () => (
    <div className="space-y-6">
      {/* Registro de Conductas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Registrar Conducta a Alumno</span>
            </div>
            <Dialog open={modalConducta} onOpenChange={setModalConducta}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </DialogTrigger>
              <DialogContent
                className="!max-w-none max-h-[90vh] overflow-y-auto"
                style={{ width: '95vw', maxWidth: '95vw' }}
              >
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Registrar Conducta de Alumno</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Selección de Curso */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="curso-conducta"
                      className="text-base font-semibold"
                    >
                      1. Seleccionar Curso
                    </Label>
                    <Select
                      value={cursoSeleccionado}
                      onValueChange={(v) => {
                        setCursoSeleccionado(v);
                        setNuevaConducta({ ...nuevaConducta, id_alumno: '' });
                        setBusquedaAlumnoConducta('');
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccionar curso..." />
                      </SelectTrigger>
                      <SelectContent>
                        {cursosAsignados.map((curso) => (
                          <SelectItem
                            key={curso.id_curso}
                            value={curso.id_curso.toString()}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {curso.nombre}
                              </span>
                              {curso.seccion && (
                                <Badge variant="outline" className="text-xs">
                                  {curso.seccion}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selección de Alumno con búsqueda */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="alumno-conducta"
                      className="text-base font-semibold"
                    >
                      2. Seleccionar Alumno
                    </Label>
                    {cursoSeleccionado ? (
                      <>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="Buscar alumno por nombre..."
                            value={busquedaAlumnoConducta}
                            onChange={(e) =>
                              setBusquedaAlumnoConducta(e.target.value)
                            }
                            className="h-11 pl-10"
                            disabled={!cursoSeleccionado}
                          />
                        </div>
                        <Select
                          value={nuevaConducta.id_alumno}
                          onValueChange={(v) =>
                            setNuevaConducta({ ...nuevaConducta, id_alumno: v })
                          }
                          disabled={!cursoSeleccionado}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Seleccionar alumno..." />
                          </SelectTrigger>
                          <SelectContent>
                            {alumnosFiltradosConducta.length > 0 ? (
                              alumnosFiltradosConducta.map((alumno) => (
                                <SelectItem
                                  key={alumno.id_alumno}
                                  value={alumno.id_alumno.toString()}
                                >
                                  {alumno.nombre} {alumno.apellido}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-6 text-center text-sm text-gray-500">
                                No se encontraron alumnos
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </>
                    ) : (
                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertTitle>Primero selecciona un curso</AlertTitle>
                      </Alert>
                    )}
                  </div>

                  {/* Filtro por categoría */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      3. Seleccionar Infracción
                    </Label>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant={
                          categoriaFiltro === 'TODAS' ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => setCategoriaFiltro('TODAS')}
                      >
                        Todas ({catalogoInfracciones.length})
                      </Button>
                      <Button
                        type="button"
                        variant={
                          categoriaFiltro === 'MENOS_GRAVE'
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() => setCategoriaFiltro('MENOS_GRAVE')}
                        className={
                          categoriaFiltro === 'MENOS_GRAVE'
                            ? '!bg-yellow-600 hover:!bg-yellow-700 !text-white'
                            : ''
                        }
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Menos Grave (
                        {infraccionesPorCategoria.MENOS_GRAVE.length})
                      </Button>
                      <Button
                        type="button"
                        variant={
                          categoriaFiltro === 'GRAVE' ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => setCategoriaFiltro('GRAVE')}
                        className={
                          categoriaFiltro === 'GRAVE'
                            ? '!bg-orange-600 hover:!bg-orange-700 !text-white'
                            : ''
                        }
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Grave ({infraccionesPorCategoria.GRAVE.length})
                      </Button>
                      <Button
                        type="button"
                        variant={
                          categoriaFiltro === 'MUY_GRAVE'
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() => setCategoriaFiltro('MUY_GRAVE')}
                        className={
                          categoriaFiltro === 'MUY_GRAVE'
                            ? '!bg-red-600 hover:!bg-red-700 !text-white'
                            : ''
                        }
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Muy Grave ({infraccionesPorCategoria.MUY_GRAVE.length})
                      </Button>
                    </div>
                  </div>

                  {/* Lista de infracciones por categoría */}
                  <div className="space-y-3 max-h-[500px] overflow-y-auto border rounded-lg p-4 bg-gray-50">
                    {categoriaFiltro === 'TODAS' ? (
                      // Mostrar todas agrupadas por categoría
                      <>
                        {(
                          [
                            'MENOS_GRAVE',
                            'GRAVE',
                            'MUY_GRAVE',
                          ] as CategoriaInfraccion[]
                        ).map((cat) => {
                          const infracciones = infraccionesPorCategoria[cat];
                          if (infracciones.length === 0) return null;

                          return (
                            <div key={cat} className="space-y-2">
                              <div className="flex items-center space-x-2 pb-2 border-b">
                                {getCategoriaIcon(cat)}
                                <h4 className="font-semibold text-sm">
                                  {getCategoriaLabel(cat)}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getBadgeColor(cat)}`}
                                >
                                  -{getPuntosPorCategoria(cat)} pts
                                </Badge>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                {infracciones.map((infraccion) => {
                                  const isSelected =
                                    nuevaConducta.id_infracciones.includes(
                                      String(infraccion.id_infraccion)
                                    );
                                  return (
                                    <button
                                      key={infraccion.id_infraccion}
                                      type="button"
                                      onClick={() =>
                                        toggleInfraccion(
                                          String(infraccion.id_infraccion)
                                        )
                                      }
                                      className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                                        isSelected
                                          ? 'border-blue-500 bg-blue-50 shadow-md'
                                          : 'border-gray-200 hover:border-gray-300 bg-white'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <Badge
                                              variant="outline"
                                              className="text-xs font-mono"
                                            >
                                              {infraccion.articulo}
                                            </Badge>
                                            <Badge
                                              className={`text-xs ${getBadgeColor(infraccion.categoria)}`}
                                            >
                                              -{infraccion.puntos} pts
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-gray-700">
                                            {infraccion.descripcion}
                                          </p>
                                        </div>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {}}
                                          className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2 cursor-pointer"
                                        />
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      // Mostrar solo la categoría filtrada
                      <div className="grid grid-cols-4 gap-2">
                        {infraccionesPorCategoria[categoriaFiltro].length >
                        0 ? (
                          infraccionesPorCategoria[categoriaFiltro].map(
                            (infraccion) => {
                              const isSelected =
                                nuevaConducta.id_infracciones.includes(
                                  String(infraccion.id_infraccion)
                                );
                              return (
                                <button
                                  key={infraccion.id_infraccion}
                                  type="button"
                                  onClick={() =>
                                    toggleInfraccion(
                                      String(infraccion.id_infraccion)
                                    )
                                  }
                                  className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                                    isSelected
                                      ? 'border-blue-500 bg-blue-50 shadow-md'
                                      : 'border-gray-200 hover:border-gray-300 bg-white'
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <Badge
                                          variant="outline"
                                          className="text-xs font-mono"
                                        >
                                          {infraccion.articulo}
                                        </Badge>
                                        <Badge
                                          className={`text-xs ${getBadgeColor(infraccion.categoria)}`}
                                        >
                                          -{infraccion.puntos} pts
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-700">
                                        {infraccion.descripcion}
                                      </p>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {}}
                                      className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2 cursor-pointer"
                                    />
                                  </div>
                                </button>
                              );
                            }
                          )
                        ) : (
                          <div className="col-span-2 text-center py-8 text-gray-500">
                            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                              No hay infracciones en esta categoría
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Resumen de infracciones seleccionadas */}
                  {infraccionesSeleccionadas.length > 0 && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg py-3 px-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-base text-blue-900">
                              {infraccionesSeleccionadas.length} infracción(es)
                              seleccionada(s)
                            </span>
                            <Badge variant="outline" className="text-sm">
                              Total: -
                              {infraccionesSeleccionadas.reduce(
                                (acc, inf) => acc + inf.puntos,
                                0
                              )}{' '}
                              pts
                            </Badge>
                          </div>

                          {/* Vista compacta con scroll si hay muchas */}
                          {infraccionesSeleccionadas.length <= 3 ? (
                            // Mostrar todas si son pocas
                            <div className="flex flex-wrap gap-2">
                              {infraccionesSeleccionadas.map((infraccion) => (
                                <div
                                  key={infraccion.id_infraccion}
                                  className="flex items-center gap-2 bg-white rounded px-2 py-1 border border-gray-200"
                                >
                                  <Badge
                                    variant="outline"
                                    className="font-mono text-xs"
                                  >
                                    {infraccion.articulo}
                                  </Badge>
                                  <span className="text-xs text-gray-700 max-w-[300px] truncate">
                                    {infraccion.descripcion}
                                  </span>
                                  <Badge
                                    className={`${getBadgeColor(infraccion.categoria)} text-xs ml-auto`}
                                  >
                                    -{infraccion.puntos} pts
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // Vista compacta con scroll si son muchas
                            <div className="max-h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                              {infraccionesSeleccionadas.map((infraccion) => (
                                <div
                                  key={infraccion.id_infraccion}
                                  className="flex items-center gap-2 bg-white rounded px-2 py-1.5 border border-gray-200 text-xs"
                                >
                                  <Badge
                                    variant="outline"
                                    className="font-mono text-[10px] flex-shrink-0"
                                  >
                                    {infraccion.articulo}
                                  </Badge>
                                  <span className="text-gray-700 flex-1 truncate">
                                    {infraccion.descripcion}
                                  </span>
                                  <Badge
                                    className={`${getBadgeColor(infraccion.categoria)} text-[10px] flex-shrink-0`}
                                  >
                                    -{infraccion.puntos}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fecha del Incidente */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fecha-conducta">
                        4. Fecha del Incidente
                      </Label>
                      <Input
                        id="fecha-conducta"
                        type="date"
                        value={nuevaConducta.fecha}
                        onChange={(e) =>
                          setNuevaConducta({
                            ...nuevaConducta,
                            fecha: e.target.value,
                          })
                        }
                        className="h-11"
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-500">
                        Trimestre calculado
                      </Label>
                      <div className="h-11 flex items-center px-3 bg-gray-100 rounded-md border">
                        <Badge variant="outline">
                          Trimestre{' '}
                          {Math.ceil(
                            (new Date(nuevaConducta.fecha).getMonth() + 1) / 4
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Botón de guardar */}
                  <div className="flex space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setModalConducta(false);
                        setNuevaConducta({
                          id_alumno: '',
                          id_infracciones: [],
                          fecha: new Date().toISOString().split('T')[0],
                        });
                        setBusquedaAlumnoConducta('');
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleRegistrarConducta}
                      disabled={
                        isLoading ||
                        !nuevaConducta.id_alumno ||
                        nuevaConducta.id_infracciones.length === 0 ||
                        !nuevaConducta.fecha
                      }
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Registrando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Registrar Conducta
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Registrar Conducta:</strong> Usa el botón "Nuevo Registro"
              para asignar una o más infracciones del catálogo a un alumno
              específico. Primero selecciona el curso, luego busca al alumno y
              finalmente elige las infracciones que aplican.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Listado de Alumnos con Infracciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Alumnos del Curso - Registro de Infracciones</span>
            </div>
            {cursoSeleccionado && alumnosDelCurso.length > 0 && (
              <Badge variant="outline" className="text-sm">
                {
                  alumnosDelCurso.filter((alumno) => {
                    const resumen = obtenerResumenInfraccionesAlumno(
                      alumno.id_alumno
                    );
                    return resumen.total > 0;
                  }).length
                }{' '}
                alumno(s) con infracciones
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!cursoSeleccionado ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Selecciona un curso para ver los alumnos y sus infracciones.
              </AlertDescription>
            </Alert>
          ) : alumnosDelCurso.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No hay alumnos inscritos en este curso.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por alumno..."
                    value={busquedaRegistroConducta}
                    onChange={(e) =>
                      setBusquedaRegistroConducta(e.target.value)
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alumno</TableHead>
                      <TableHead className="text-center">
                        Total Infracciones
                      </TableHead>
                      <TableHead className="text-center">
                        Menos Graves
                      </TableHead>
                      <TableHead className="text-center">Graves</TableHead>
                      <TableHead className="text-center">Muy Graves</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alumnosDelCurso
                      .filter((alumno) => {
                        // Primero filtrar por búsqueda
                        if (busquedaRegistroConducta) {
                          const nombreCompleto =
                            `${alumno.nombre} ${alumno.apellido}`.toLowerCase();
                          if (
                            !nombreCompleto.includes(
                              busquedaRegistroConducta.toLowerCase()
                            )
                          ) {
                            return false;
                          }
                        }

                        // Luego filtrar solo alumnos con infracciones
                        const resumen = obtenerResumenInfraccionesAlumno(
                          alumno.id_alumno
                        );
                        return resumen.total > 0;
                      })
                      .map((alumno) => {
                        const resumen = obtenerResumenInfraccionesAlumno(
                          alumno.id_alumno
                        );

                        return (
                          <TableRow key={alumno.id_alumno}>
                            <TableCell className="font-medium">
                              {alumno.nombre} {alumno.apellido}
                            </TableCell>
                            <TableCell className="text-center">
                              {resumen.total > 0 ? (
                                <Badge variant="destructive">
                                  {resumen.total}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {resumen.menosGraves > 0 ? (
                                <Badge className="bg-yellow-500 hover:bg-yellow-600">
                                  {resumen.menosGraves}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {resumen.graves > 0 ? (
                                <Badge className="bg-orange-500 hover:bg-orange-600">
                                  {resumen.graves}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {resumen.muyGraves > 0 ? (
                                <Badge className="bg-red-600 hover:bg-red-700">
                                  {resumen.muyGraves}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVerDetalleAlumno(alumno)}
                                disabled={isLoading}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Ver Detalle
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {alumnosDelCurso.filter((alumno) => {
                      // Filtrar por búsqueda
                      if (busquedaRegistroConducta) {
                        const nombreCompleto =
                          `${alumno.nombre} ${alumno.apellido}`.toLowerCase();
                        if (
                          !nombreCompleto.includes(
                            busquedaRegistroConducta.toLowerCase()
                          )
                        ) {
                          return false;
                        }
                      }

                      // Filtrar solo alumnos con infracciones
                      const resumen = obtenerResumenInfraccionesAlumno(
                        alumno.id_alumno
                      );
                      return resumen.total > 0;
                    }).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-gray-500">
                            <AlertCircle className="w-8 h-8" />
                            <p className="font-medium">
                              {busquedaRegistroConducta
                                ? 'No se encontraron alumnos con infracciones que coincidan con la búsqueda'
                                : 'No hay alumnos con infracciones registradas en este curso'}
                            </p>
                            <p className="text-sm">
                              Los alumnos sin infracciones no se muestran en
                              esta lista
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalle del Alumno con sus Infracciones */}
      <Dialog open={modalDetalleAlumno} onOpenChange={setModalDetalleAlumno}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>
                Detalle de Infracciones - {alumnoDetalleSeleccionado?.nombre}{' '}
                {alumnoDetalleSeleccionado?.apellido}
              </span>
            </DialogTitle>
          </DialogHeader>

          {alumnoDetalleSeleccionado && (
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Total de Infracciones:</strong>{' '}
                  {infraccionesAlumno.length}
                  {infraccionesAlumno.length === 0 &&
                    ' - Este alumno no tiene infracciones registradas.'}
                </AlertDescription>
              </Alert>

              {infraccionesAlumno.length > 0 ? (
                <div className="grid gap-4">
                  {infraccionesAlumno.map((conducta) => {
                    const infraccion = conducta.infraccion;

                    return (
                      <Card
                        key={conducta.id_conducta}
                        className="border-l-4"
                        style={{
                          borderLeftColor:
                            infraccion?.categoria === 'MUY_GRAVE'
                              ? '#dc2626'
                              : infraccion?.categoria === 'GRAVE'
                                ? '#ea580c'
                                : '#eab308',
                        }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                {infraccion && (
                                  <Badge
                                    className={getBadgeColor(
                                      infraccion.categoria
                                    )}
                                  >
                                    {getCategoriaIcon(infraccion.categoria)}
                                    <span className="ml-1">
                                      {getCategoriaLabel(infraccion.categoria)}
                                    </span>
                                  </Badge>
                                )}
                                <Badge variant="outline">
                                  {infraccion?.puntos} puntos
                                </Badge>
                              </div>
                              <h4 className="font-semibold text-lg">
                                {infraccion?.articulo ||
                                  'Artículo no disponible'}
                              </h4>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleAbrirEditarConducta(conducta)
                                }
                                disabled={isLoading}
                                title="Editar infracción"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleEliminarConducta(conducta.id_conducta)
                                }
                                disabled={isLoading}
                                title="Eliminar infracción"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium text-gray-700">
                                Descripción:
                              </span>
                              <p className="text-sm text-gray-600 mt-1">
                                {infraccion?.descripcion || 'Sin descripción'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(conducta.fecha).toLocaleDateString(
                                    'es-ES',
                                    {
                                      day: '2-digit',
                                      month: 'long',
                                      year: 'numeric',
                                    }
                                  )}
                                </span>
                              </div>
                              {conducta.observacion && (
                                <div className="flex-1">
                                  <span className="font-medium">
                                    Observación:
                                  </span>{' '}
                                  {conducta.observacion}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">
                    Este alumno no tiene infracciones registradas
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setModalDetalleAlumno(false);
                    setAlumnoDetalleSeleccionado(null);
                    setInfraccionesAlumno([]);
                  }}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edición de Registro de Conducta */}
      <Dialog open={modalEditarConducta} onOpenChange={setModalEditarConducta}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5 text-blue-600" />
              <span>Editar Registro de Conducta</span>
            </DialogTitle>
          </DialogHeader>
          {conductaEditando && (
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Editando registro de conducta para{' '}
                  <strong>{conductaEditando.nombreAlumno}</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Infracción</Label>
                <Select
                  value={conductaEditando.id_infraccion}
                  onValueChange={(v) =>
                    setConductaEditando({
                      ...conductaEditando,
                      id_infraccion: v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar infracción..." />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogoInfracciones.map((infraccion) => (
                      <SelectItem
                        key={infraccion.id_infraccion}
                        value={infraccion.id_infraccion}
                      >
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={getBadgeColor(infraccion.categoria)}
                            variant="outline"
                          >
                            {getCategoriaLabel(infraccion.categoria)}
                          </Badge>
                          <span className="font-medium">
                            {infraccion.articulo}
                          </span>
                          <span className="text-sm text-gray-500">
                            - {infraccion.descripcion}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setModalEditarConducta(false);
                    setConductaEditando(null);
                  }}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGuardarEdicionConducta}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Catálogo de Infracciones - Colapsable */}
      <Card className="border-2">
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors select-none"
          onClick={() => setCatalogoColapsado(!catalogoColapsado)}
          title={
            catalogoColapsado ? 'Click para expandir' : 'Click para colapsar'
          }
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Catálogo de Infracciones</span>
              <Badge variant="secondary" className="ml-2">
                {catalogoInfracciones.length}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              {user.role === 'admin' && !catalogoColapsado && (
                <Dialog
                  open={modalInfraccion}
                  onOpenChange={setModalInfraccion}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={(e) => e.stopPropagation()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Infracción
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        {modoEdicionInfraccion ? (
                          <>
                            <Edit className="w-5 h-5 text-blue-600" />
                            <span>Editar Infracción del Catálogo</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-5 h-5" />
                            <span>Crear Nueva Infracción en el Catálogo</span>
                          </>
                        )}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription>
                          {modoEdicionInfraccion
                            ? 'Modifica los datos de la infracción. Los cambios se aplicarán al catálogo.'
                            : 'Las infracciones creadas aquí estarán disponibles para registrar conductas de alumnos.'}
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <Label
                          htmlFor="categoria"
                          className="text-base font-semibold"
                        >
                          1. Categoría de la Infracción
                        </Label>
                        <Select
                          value={nuevaInfraccion.categoria}
                          onValueChange={(v: CategoriaInfraccion) => {
                            const puntosDefault = getPuntosPorCategoria(v);
                            setNuevaInfraccion({
                              ...nuevaInfraccion,
                              categoria: v,
                              puntos: puntosDefault,
                            });
                          }}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MENOS_GRAVE">
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                                <span>Menos Grave</span>
                                <Badge
                                  variant="outline"
                                  className="ml-2 bg-yellow-100 text-yellow-800"
                                >
                                  -1 pt
                                </Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="GRAVE">
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                                <span>Grave</span>
                                <Badge
                                  variant="outline"
                                  className="ml-2 bg-orange-100 text-orange-800"
                                >
                                  -2 pts
                                </Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="MUY_GRAVE">
                              <div className="flex items-center space-x-2">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <span>Muy Grave</span>
                                <Badge
                                  variant="outline"
                                  className="ml-2 bg-red-100 text-red-800"
                                >
                                  -3 pts
                                </Badge>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                          {nuevaInfraccion.categoria === 'MENOS_GRAVE' &&
                            'Faltas leves que afectan mínimamente la conducta'}
                          {nuevaInfraccion.categoria === 'GRAVE' &&
                            'Faltas que requieren atención y seguimiento'}
                          {nuevaInfraccion.categoria === 'MUY_GRAVE' &&
                            'Faltas graves que requieren intervención inmediata'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="articulo"
                          className="text-base font-semibold"
                        >
                          2. Artículo o Código
                        </Label>
                        <Input
                          id="articulo"
                          placeholder="Ej: Art. 10, Código 3.1, etc."
                          value={nuevaInfraccion.articulo}
                          onChange={(e) =>
                            setNuevaInfraccion({
                              ...nuevaInfraccion,
                              articulo: e.target.value,
                            })
                          }
                          className="h-11 font-mono"
                        />
                        <p className="text-xs text-gray-500">
                          Identificador del reglamento interno
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="descripcion"
                          className="text-base font-semibold"
                        >
                          3. Descripción de la Infracción
                        </Label>
                        <Textarea
                          id="descripcion"
                          placeholder="Ej: Uso de celular en clase sin autorización, no traer materiales, falta de respeto a compañeros..."
                          value={nuevaInfraccion.descripcion}
                          onChange={(e) =>
                            setNuevaInfraccion({
                              ...nuevaInfraccion,
                              descripcion: e.target.value,
                            })
                          }
                          rows={4}
                        />
                        <p className="text-xs text-gray-500">
                          Describe claramente la falta que comete el alumno
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="puntos"
                          className="text-base font-semibold"
                        >
                          4. Puntos Negativos
                        </Label>
                        <div className="flex items-center space-x-3">
                          <Input
                            id="puntos"
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={nuevaInfraccion.puntos}
                            onChange={(e) =>
                              setNuevaInfraccion({
                                ...nuevaInfraccion,
                                puntos: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="h-11"
                          />
                          <Badge
                            className={`${getBadgeColor(nuevaInfraccion.categoria)} px-4 py-2`}
                          >
                            -{nuevaInfraccion.puntos} pts
                          </Badge>
                        </div>
                        <Alert className="bg-yellow-50 border-yellow-200">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-xs">
                            <strong>Recomendado:</strong> Menos Grave (1 pt),
                            Grave (2 pts), Muy Grave (3 pts)
                          </AlertDescription>
                        </Alert>
                      </div>

                      {/* Preview */}
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Vista previa:
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="font-mono">
                              {nuevaInfraccion.articulo || 'Art. XX'}
                            </Badge>
                            <Badge
                              className={`${getBadgeColor(nuevaInfraccion.categoria)} flex items-center gap-1`}
                            >
                              {getCategoriaIcon(nuevaInfraccion.categoria)}
                              {getCategoriaLabel(nuevaInfraccion.categoria)} • -
                              {nuevaInfraccion.puntos} pts
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {nuevaInfraccion.descripcion ||
                              'Descripción de la infracción...'}
                          </p>
                        </div>
                      </div>

                      <div className="flex space-x-3 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setModalInfraccion(false);
                            setModoEdicionInfraccion(false);
                            setInfraccionEditando(null);
                            setNuevaInfraccion({
                              categoria: 'MENOS_GRAVE',
                              articulo: '',
                              descripcion: '',
                              puntos: 0,
                            });
                          }}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleCrearInfraccion}
                          disabled={
                            isLoading ||
                            !nuevaInfraccion.articulo ||
                            !nuevaInfraccion.descripcion ||
                            nuevaInfraccion.puntos <= 0
                          }
                          className="flex-1"
                        >
                          {isLoading ? (
                            <>
                              <Clock className="w-4 h-4 mr-2 animate-spin" />
                              {modoEdicionInfraccion
                                ? 'Actualizando...'
                                : 'Creando...'}
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {modoEdicionInfraccion
                                ? 'Actualizar Infracción'
                                : 'Crear Infracción'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setCatalogoColapsado(!catalogoColapsado);
                }}
                className="ml-2"
              >
                {catalogoColapsado ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronUp className="w-5 h-5" />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        {!catalogoColapsado && (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Artículo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Puntos</TableHead>
                  {user.role === 'admin' && (
                    <TableHead className="text-right">Acciones</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalogoInfracciones.map((infraccion) => (
                  <TableRow key={infraccion.id_infraccion}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getBadgeColor(infraccion.categoria)}
                      >
                        {infraccion.categoria.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {infraccion.articulo}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {infraccion.descripcion}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        -{infraccion.puntos} pts
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {user.role === 'admin' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleAbrirEditarInfraccion(infraccion)
                            }
                            disabled={isLoading}
                            title="Editar infracción"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleEliminarInfraccion(infraccion.id_infraccion)
                            }
                            disabled={isLoading}
                            title="Eliminar infracción"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {catalogoInfracciones.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-500"
                    >
                      No hay infracciones registradas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </div>
  );

  const renderHistorialAsistencias = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Historial de Asistencias</span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Consulta y revisa todas las asistencias registradas por curso y
            rango de fechas
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Curso</Label>
              <Select
                value={filtroHistorial.cursoId?.toString() || ''}
                onValueChange={(v) =>
                  setFiltroHistorial({
                    ...filtroHistorial,
                    cursoId: parseInt(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursosAsignados.map((curso) => (
                    <SelectItem
                      key={curso.id_curso}
                      value={curso.id_curso.toString()}
                    >
                      {curso.nombre}
                      {curso.seccion ? ` - ${curso.seccion}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha Desde</Label>
              <Input
                type="date"
                value={filtroHistorial.fechaDesde}
                onChange={(e) =>
                  setFiltroHistorial({
                    ...filtroHistorial,
                    fechaDesde: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Fecha Hasta</Label>
              <Input
                type="date"
                value={filtroHistorial.fechaHasta}
                onChange={(e) =>
                  setFiltroHistorial({
                    ...filtroHistorial,
                    fechaHasta: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <Button
            onClick={handleCargarHistorial}
            disabled={isLoading || !filtroHistorial.cursoId}
          >
            <Search className="w-4 h-4 mr-2" />
            {isLoading ? 'Buscando...' : 'Buscar Asistencias'}
          </Button>
          {!filtroHistorial.cursoId && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Selecciona un curso para ver el historial de asistencias
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {historialAsistencias.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Registros Encontrados ({historialAsistencias.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 hover:bg-gray-100">
                    <TableHead className="font-bold text-gray-900">
                      Fecha
                    </TableHead>
                    <TableHead className="font-bold text-gray-900">
                      Alumno
                    </TableHead>
                    <TableHead className="text-center font-bold text-gray-900">
                      Estado
                    </TableHead>
                    <TableHead className="font-bold text-gray-900">
                      Registrado por
                    </TableHead>
                    <TableHead className="text-center font-bold text-gray-900">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historialAsistencias.map((asist: any, index) => (
                    <TableRow
                      key={asist.id_asistencia}
                      className={
                        index % 2 === 0
                          ? 'bg-white hover:bg-gray-50'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }
                    >
                      <TableCell className="font-medium">
                        {new Date(asist.fecha).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        {asist.alumno.nombre} {asist.alumno.apellido}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            asist.estado === 'P'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : asist.estado === 'E'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : asist.estado === 'SP'
                                  ? 'bg-red-100 text-red-800 border-red-300'
                                  : asist.estado === 'A'
                                    ? 'bg-orange-100 text-orange-800 border-orange-300'
                                    : 'bg-gray-100 text-gray-800 border-gray-300'
                          }
                        >
                          {asist.estado === 'P' && 'Presente'}
                          {asist.estado === 'E' && 'Con Permiso'}
                          {asist.estado === 'SP' && 'Sin Permiso'}
                          {asist.estado === 'A' && 'Atraso'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {asist.orientador.nombre} {asist.orientador.apellido}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditarAsistenciaHistorial(asist)}
                          disabled={isLoading}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de edición de asistencia del historial */}
      <Dialog
        open={modalEdicionHistorial}
        onOpenChange={setModalEdicionHistorial}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5 text-blue-600" />
              <span>Editar Asistencia</span>
            </DialogTitle>
          </DialogHeader>
          {asistenciaHistorialEditando && (
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Modificar asistencia registrada</strong>
                  <p className="text-sm mt-1">
                    Cambia el estado si el alumno presentó justificación médica,
                    constancia u otra documentación válida.
                  </p>
                </AlertDescription>
              </Alert>

              <div>
                <Label className="text-sm font-medium">Alumno</Label>
                <p className="text-base font-semibold text-gray-900 mt-1">
                  {asistenciaHistorialEditando.nombreAlumno}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Fecha</Label>
                <p className="text-base text-gray-700 mt-1">
                  {asistenciaHistorialEditando.fecha}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Estado Actual</Label>
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className={
                      asistenciaHistorialEditando.estadoActual === 'P'
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : asistenciaHistorialEditando.estadoActual === 'E'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : asistenciaHistorialEditando.estadoActual === 'SP'
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'bg-orange-100 text-orange-800 border-orange-300'
                    }
                  >
                    {asistenciaHistorialEditando.estadoActual === 'P' &&
                      'Presente'}
                    {asistenciaHistorialEditando.estadoActual === 'E' &&
                      'Con Permiso'}
                    {asistenciaHistorialEditando.estadoActual === 'SP' &&
                      'Sin Permiso'}
                    {asistenciaHistorialEditando.estadoActual === 'A' &&
                      'Atraso'}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Cambiar a:
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={
                      asistenciaActual[asistenciaHistorialEditando.id_alumno]
                        ?.estado === 'P'
                        ? 'default'
                        : 'outline'
                    }
                    className={
                      asistenciaActual[asistenciaHistorialEditando.id_alumno]
                        ?.estado === 'P'
                        ? 'bg-green-600 hover:bg-green-700'
                        : ''
                    }
                    onClick={() =>
                      handleEstadoChange(
                        asistenciaHistorialEditando.id_alumno,
                        'P'
                      )
                    }
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Presente
                  </Button>
                  <Button
                    variant={
                      asistenciaActual[asistenciaHistorialEditando.id_alumno]
                        ?.estado === 'E'
                        ? 'default'
                        : 'outline'
                    }
                    className={
                      asistenciaActual[asistenciaHistorialEditando.id_alumno]
                        ?.estado === 'E'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : ''
                    }
                    onClick={() =>
                      handleEstadoChange(
                        asistenciaHistorialEditando.id_alumno,
                        'E'
                      )
                    }
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Con Permiso
                  </Button>
                  <Button
                    variant={
                      asistenciaActual[asistenciaHistorialEditando.id_alumno]
                        ?.estado === 'SP'
                        ? 'default'
                        : 'outline'
                    }
                    className={
                      asistenciaActual[asistenciaHistorialEditando.id_alumno]
                        ?.estado === 'SP'
                        ? 'bg-red-600 hover:bg-red-700'
                        : ''
                    }
                    onClick={() =>
                      handleEstadoChange(
                        asistenciaHistorialEditando.id_alumno,
                        'SP'
                      )
                    }
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Sin Permiso
                  </Button>
                  <Button
                    variant={
                      asistenciaActual[asistenciaHistorialEditando.id_alumno]
                        ?.estado === 'A'
                        ? 'default'
                        : 'outline'
                    }
                    className={
                      asistenciaActual[asistenciaHistorialEditando.id_alumno]
                        ?.estado === 'A'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : ''
                    }
                    onClick={() =>
                      handleEstadoChange(
                        asistenciaHistorialEditando.id_alumno,
                        'A'
                      )
                    }
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Atraso
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setModalEdicionHistorial(false);
                    setAsistenciaHistorialEditando(null);
                    setAsistenciaActual({});
                  }}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGuardarEdicionHistorial}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderResumenMensual = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Resumen Mensual de Asistencia</span>
            </div>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Consulta las asistencias justificadas, injustificadas y atrasos por
            alumno en un mes específico
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Curso</Label>
              <Select
                value={filtroResumenMensual.cursoId?.toString() || ''}
                onValueChange={(v) =>
                  setFiltroResumenMensual({
                    ...filtroResumenMensual,
                    cursoId: parseInt(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursosAsignados.map((curso) => (
                    <SelectItem
                      key={curso.id_curso}
                      value={curso.id_curso.toString()}
                    >
                      {curso.nombre}
                      {curso.seccion ? ` - ${curso.seccion}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mes</Label>
              <Select
                value={filtroResumenMensual.mes.toString()}
                onValueChange={(v) =>
                  setFiltroResumenMensual({
                    ...filtroResumenMensual,
                    mes: parseInt(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2000, i, 1).toLocaleDateString('es-ES', {
                        month: 'long',
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Año</Label>
              <Input
                type="number"
                value={filtroResumenMensual.anio}
                onChange={(e) =>
                  setFiltroResumenMensual({
                    ...filtroResumenMensual,
                    anio: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <Button
            onClick={handleGenerarResumenMensual}
            disabled={isLoading || !filtroResumenMensual.cursoId}
          >
            <Download className="w-4 h-4 mr-2" />
            {isLoading ? 'Generando...' : 'Generar Resumen'}
          </Button>
          {!filtroResumenMensual.cursoId && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Selecciona un curso, mes y año para generar el resumen mensual
                de asistencia
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {resumenMensual && resumenMensual.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resultado - Resumen Mensual</span>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    generarPDFResumenMensual({
                      resumen: resumenMensual,
                      nombreCurso:
                        cursosAsignados.find(
                          (c) => c.id_curso === filtroResumenMensual.cursoId
                        )?.nombre || 'Curso',
                      mes: filtroResumenMensual.mes,
                      anio: filtroResumenMensual.anio,
                    });
                    toast.success('PDF generado y descargado correctamente');
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar a PDF
                </Button>
                <Button
                  onClick={() => {
                    generarExcelResumenMensual({
                      resumen: resumenMensual,
                      nombreCurso:
                        cursosAsignados.find(
                          (c) => c.id_curso === filtroResumenMensual.cursoId
                        )?.nombre || 'Curso',
                      mes: filtroResumenMensual.mes,
                      anio: filtroResumenMensual.anio,
                    });
                    toast.success('Excel generado y descargado correctamente');
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar a Excel
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Curso:{' '}
              {cursosAsignados.find(
                (c) => c.id_curso === filtroResumenMensual.cursoId
              )?.nombre || filtroResumenMensual.cursoId}{' '}
              | Mes: {filtroResumenMensual.mes} | Año:{' '}
              {filtroResumenMensual.anio}
            </p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 hover:bg-gray-100">
                    <TableHead className="font-bold text-gray-900">
                      Alumno
                    </TableHead>
                    <TableHead className="text-center font-bold text-gray-900 bg-green-50">
                      Justificadas (E)
                    </TableHead>
                    <TableHead className="text-center font-bold text-gray-900 bg-orange-50">
                      Injustificadas (SP)
                    </TableHead>
                    <TableHead className="text-center font-bold text-gray-900 bg-red-50">
                      Atrasos (A)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumenMensual.map((est: ResumenMensualResponse, index) => (
                    <TableRow
                      key={est.id_alumno}
                      className={
                        index % 2 === 0
                          ? 'bg-white hover:bg-gray-50'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }
                    >
                      <TableCell className="font-semibold text-gray-900">
                        {est.nombre} {est.apellido}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                          {est.justificadas}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                          {est.injustificadas}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800 border border-red-200">
                          {est.atrasos}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderResumenTrimestral = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5" />
              <span>Resumen Trimestral con Nota de Conducta</span>
            </div>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Consulta el resumen completo de asistencia e infracciones con el
            cálculo automático de la nota de conducta
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Curso</Label>
              <Select
                value={filtroResumenTrimestral.cursoId?.toString() || ''}
                onValueChange={(v) =>
                  setFiltroResumenTrimestral({
                    ...filtroResumenTrimestral,
                    cursoId: parseInt(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursosAsignados.map((curso) => (
                    <SelectItem
                      key={curso.id_curso}
                      value={curso.id_curso.toString()}
                    >
                      {curso.nombre}
                      {curso.seccion ? ` - ${curso.seccion}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Trimestre</Label>
              <Select
                value={filtroResumenTrimestral.trimestre.toString()}
                onValueChange={(v) =>
                  setFiltroResumenTrimestral({
                    ...filtroResumenTrimestral,
                    trimestre: parseInt(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Primer Trimestre</SelectItem>
                  <SelectItem value="2">Segundo Trimestre</SelectItem>
                  <SelectItem value="3">Tercer Trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Año</Label>
              <Input
                type="number"
                value={filtroResumenTrimestral.anio}
                onChange={(e) =>
                  setFiltroResumenTrimestral({
                    ...filtroResumenTrimestral,
                    anio: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <Button
            onClick={handleGenerarResumenTrimestral}
            disabled={isLoading || !filtroResumenTrimestral.cursoId}
          >
            <Download className="w-4 h-4 mr-2" />
            {isLoading ? 'Generando...' : 'Generar Resumen'}
          </Button>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p>
                  <strong>Fórmula de conducta:</strong> 10 - (SP × 0.2) - (Menos
                  Graves × 1) - (Graves × 2) - (Muy Graves × 3)
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  SP = Ausencias Sin Permiso | Infracciones según gravedad:
                  Menos Grave (-1), Grave (-2), Muy Grave (-3)
                </p>
              </div>
            </AlertDescription>
          </Alert>
          {!filtroResumenTrimestral.cursoId && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Selecciona un curso, trimestre y año para generar el resumen con
                la nota de conducta
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {resumenTrimestral && resumenTrimestral.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-1">
                  RESUMEN TRIMESTRAL -{' '}
                  {cursosAsignados
                    .find((c) => c.id_curso === filtroResumenTrimestral.cursoId)
                    ?.nombre?.toUpperCase() || 'CURSO'}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {filtroResumenTrimestral.trimestre === 1 &&
                    'PRIMER TRIMESTRE (ENERO - ABRIL)'}
                  {filtroResumenTrimestral.trimestre === 2 &&
                    'SEGUNDO TRIMESTRE (MAYO - AGOSTO)'}
                  {filtroResumenTrimestral.trimestre === 3 &&
                    'TERCER TRIMESTRE (SEPTIEMBRE - DICIEMBRE)'}
                  {' • AÑO LECTIVO '}
                  {filtroResumenTrimestral.anio}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    generarPDFResumenTrimestral({
                      resumen: resumenTrimestral,
                      nombreCurso:
                        cursosAsignados.find(
                          (c) => c.id_curso === filtroResumenTrimestral.cursoId
                        )?.nombre || 'Curso',
                      trimestre: filtroResumenTrimestral.trimestre,
                      anio: filtroResumenTrimestral.anio,
                    });
                    toast.success('PDF generado y descargado correctamente');
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-red-50 border-red-300 text-red-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar a PDF
                </Button>
                <Button
                  onClick={() => {
                    generarExcelResumenTrimestral({
                      resumen: resumenTrimestral,
                      nombreCurso:
                        cursosAsignados.find(
                          (c) => c.id_curso === filtroResumenTrimestral.cursoId
                        )?.nombre || 'Curso',
                      trimestre: filtroResumenTrimestral.trimestre,
                      anio: filtroResumenTrimestral.anio,
                    });
                    toast.success('Excel generado y descargado correctamente');
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-green-50 border-green-300 text-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar a Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {/* Fila 1: Categorías principales */}
                  <TableRow className="bg-gradient-to-r from-green-100 to-green-50 border-b-2 border-green-300">
                    <TableHead
                      rowSpan={2}
                      className="text-center font-bold text-gray-900 border-r-2 border-green-300 w-12"
                    >
                      No
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="text-center font-bold text-gray-900 border-r-2 border-green-300 min-w-[200px]"
                    >
                      NOMBRE
                    </TableHead>
                    <TableHead
                      colSpan={2}
                      className="text-center font-bold text-gray-900 border-r-2 border-green-300 bg-blue-100"
                    >
                      INASISTENCIAS
                    </TableHead>
                    <TableHead
                      colSpan={6}
                      className="text-center font-bold text-gray-900 border-r-2 border-green-300 bg-yellow-50"
                    >
                      FALTAS
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="text-center font-bold text-gray-900 bg-purple-50 min-w-[100px]"
                    >
                      CÁLCULO
                      <br />
                      CONDUCTA
                    </TableHead>
                  </TableRow>
                  {/* Fila 2: Subcategorías */}
                  <TableRow className="bg-gradient-to-r from-green-100 to-green-50 border-b-2 border-green-300">
                    <TableHead className="text-center font-bold text-gray-900 border-r border-green-200 bg-blue-50 w-16">
                      P
                    </TableHead>
                    <TableHead className="text-center font-bold text-gray-900 border-r-2 border-green-300 bg-blue-50 w-16">
                      SP
                    </TableHead>
                    <TableHead
                      colSpan={2}
                      className="text-center font-bold text-gray-900 border-r-2 border-green-300 bg-yellow-100"
                    >
                      Menos Graves
                    </TableHead>
                    <TableHead
                      colSpan={2}
                      className="text-center font-bold text-gray-900 border-r-2 border-green-300 bg-orange-100"
                    >
                      Graves
                    </TableHead>
                    <TableHead
                      colSpan={2}
                      className="text-center font-bold text-gray-900 border-r-2 border-green-300 bg-red-100"
                    >
                      Muy Graves
                    </TableHead>
                  </TableRow>
                  {/* Fila 3: Columnas de datos específicos */}
                  <TableRow className="bg-gray-100 border-b-2 border-gray-300">
                    <TableHead className="text-center text-xs font-semibold text-gray-700 border-r-2 border-gray-300"></TableHead>
                    <TableHead className="text-center text-xs font-semibold text-gray-700 border-r-2 border-gray-300"></TableHead>
                    <TableHead className="text-center text-xs font-semibold text-gray-700 border-r border-gray-200"></TableHead>
                    <TableHead className="text-center text-xs font-semibold text-gray-700 border-r-2 border-gray-300"></TableHead>
                    <TableHead className="text-center text-xs font-semibold text-gray-700 border-r border-gray-200 bg-yellow-50 w-16">
                      Cant.
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold text-gray-700 border-r-2 border-gray-300 bg-yellow-50 min-w-[250px]">
                      Artículo
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold text-gray-700 border-r border-gray-200 bg-orange-50 w-16">
                      Cant.
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold text-gray-700 border-r-2 border-gray-300 bg-orange-50 min-w-[250px]">
                      Artículo
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold text-gray-700 border-r border-gray-200 bg-red-50 w-16">
                      Cant.
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold text-gray-700 border-r-2 border-gray-300 bg-red-50 min-w-[250px]">
                      Artículo
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold text-gray-700 bg-purple-50"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumenTrimestral.map(
                    (est: ResumenTrimestralResponse, index) => {
                      // Agrupar infracciones por categoría
                      const infraccionesPorCategoria: Record<
                        CategoriaInfraccion,
                        InfraccionResumen[]
                      > = {
                        MENOS_GRAVE: [],
                        GRAVE: [],
                        MUY_GRAVE: [],
                      };

                      est.infracciones.forEach((inf) => {
                        infraccionesPorCategoria[inf.categoria].push(inf);
                      });

                      // Calcular cantidades y formatear artículos con descripción
                      const menosGravesCount =
                        infraccionesPorCategoria.MENOS_GRAVE.reduce(
                          (sum, inf) => sum + (inf.cantidad ?? 1),
                          0
                        );
                      const menosGravesArticulos =
                        infraccionesPorCategoria.MENOS_GRAVE.map(
                          (inf) => `${inf.articulo} ${inf.descripcion}`
                        ).join(' | ') || '-';

                      const gravesCount = infraccionesPorCategoria.GRAVE.reduce(
                        (sum, inf) => sum + (inf.cantidad ?? 1),
                        0
                      );
                      const gravesArticulos =
                        infraccionesPorCategoria.GRAVE.map(
                          (inf) => `${inf.articulo} ${inf.descripcion}`
                        ).join(' | ') || '-';

                      const muyGravesCount =
                        infraccionesPorCategoria.MUY_GRAVE.reduce(
                          (sum, inf) => sum + (inf.cantidad ?? 1),
                          0
                        );
                      const muyGravesArticulos =
                        infraccionesPorCategoria.MUY_GRAVE.map(
                          (inf) => `${inf.articulo} ${inf.descripcion}`
                        ).join(' | ') || '-';

                      const rowBgColor =
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50';

                      return (
                        <TableRow
                          key={est.id_alumno}
                          className={`${rowBgColor} hover:bg-blue-50 transition-colors border-b border-gray-200`}
                        >
                          <TableCell className="text-center font-medium text-gray-900 border-r-2 border-gray-300">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-semibold text-gray-900 border-r-2 border-gray-300">
                            {est.nombre} {est.apellido}
                          </TableCell>
                          <TableCell className="text-center border-r border-gray-200">
                            <span className="inline-flex items-center justify-center px-2 py-1 text-sm font-semibold text-green-800">
                              {est.justificadas}
                            </span>
                          </TableCell>
                          <TableCell className="text-center border-r-2 border-gray-300">
                            <span
                              className={`inline-flex items-center justify-center px-2 py-1 text-sm font-semibold ${
                                est.injustificadas > 0
                                  ? 'text-red-700'
                                  : 'text-gray-500'
                              }`}
                            >
                              {est.injustificadas}
                            </span>
                          </TableCell>
                          <TableCell className="text-center border-r border-gray-200 bg-yellow-50">
                            {menosGravesCount > 0 ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-200 text-yellow-900 font-bold text-sm">
                                {menosGravesCount}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-left text-xs border-r-2 border-gray-300 bg-yellow-50">
                            <span
                              className={
                                menosGravesArticulos === '-'
                                  ? 'text-gray-400'
                                  : 'text-yellow-900 font-medium'
                              }
                            >
                              {menosGravesArticulos}
                            </span>
                          </TableCell>
                          <TableCell className="text-center border-r border-gray-200 bg-orange-50">
                            {gravesCount > 0 ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-200 text-orange-900 font-bold text-sm">
                                {gravesCount}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-left text-xs border-r-2 border-gray-300 bg-orange-50">
                            <span
                              className={
                                gravesArticulos === '-'
                                  ? 'text-gray-400'
                                  : 'text-orange-900 font-medium'
                              }
                            >
                              {gravesArticulos}
                            </span>
                          </TableCell>
                          <TableCell className="text-center border-r border-gray-200 bg-red-50">
                            {muyGravesCount > 0 ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-200 text-red-900 font-bold text-sm">
                                {muyGravesCount}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-left text-xs border-r-2 border-gray-300 bg-red-50">
                            <span
                              className={
                                muyGravesArticulos === '-'
                                  ? 'text-gray-400'
                                  : 'text-red-900 font-medium'
                              }
                            >
                              {muyGravesArticulos}
                            </span>
                          </TableCell>
                          <TableCell className="text-center bg-purple-50">
                            <Badge
                              variant={
                                (est.puntajeConducta ?? 10) >= 8
                                  ? 'default'
                                  : (est.puntajeConducta ?? 10) >= 6
                                    ? 'secondary'
                                    : 'destructive'
                              }
                              className={`text-base font-bold px-3 py-1 ${
                                (est.puntajeConducta ?? 10) >= 8
                                  ? 'bg-green-600 hover:bg-green-700'
                                  : (est.puntajeConducta ?? 10) >= 6
                                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                    : 'bg-red-600 hover:bg-red-700'
                              }`}
                            >
                              {(est.puntajeConducta ?? 10).toFixed(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Asistencia y Conducta
        </h1>
        <p className="text-gray-600 mt-2">
          Sistema integral de registro y seguimiento académico
        </p>
      </div>

      {/* Tarjetas informativas - Solo en tab de asistencia con curso seleccionado */}
      {activeTab === 'asistencia' && cursoSeleccionado && (
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
                  <p className="text-sm text-gray-600">Atrasos</p>
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
      )}

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <div className="space-y-2">
          <TabsList className="grid w-full grid-cols-3 gap-2 h-auto p-2">
            <TabsTrigger
              value="asistencia"
              className="flex items-center gap-2 py-3"
            >
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Tomar Asistencia</span>
            </TabsTrigger>
            <TabsTrigger
              value="conducta"
              className="flex items-center gap-2 py-3"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Conducta</span>
            </TabsTrigger>
            <TabsTrigger
              value="historial"
              className="flex items-center gap-2 py-3"
            >
              <FileText className="w-4 h-4" />
              <span className="font-medium">Historial</span>
            </TabsTrigger>
          </TabsList>

          <TabsList className="grid w-full grid-cols-2 gap-2 h-auto p-2">
            <TabsTrigger
              value="resumen-mensual"
              className="flex items-center gap-2 py-3"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="font-medium">Resumen Conductual</span>
            </TabsTrigger>
            <TabsTrigger
              value="resumen-trimestral"
              className="flex items-center gap-2 py-3"
            >
              <Award className="w-4 h-4" />
              <span className="font-medium">Resumen Trimestral</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6">
          <TabsContent value="asistencia">
            {renderTomarAsistencia()}
          </TabsContent>
          <TabsContent value="conducta">{renderConducta()}</TabsContent>
          <TabsContent value="historial">
            {renderHistorialAsistencias()}
          </TabsContent>
          <TabsContent value="resumen-mensual">
            {renderResumenMensual()}
          </TabsContent>
          <TabsContent value="resumen-trimestral">
            {renderResumenTrimestral()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
