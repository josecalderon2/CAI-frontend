import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
import {
  ClipboardList,
  Save,
  Search,
  Award,
  Users,
  Loader2,
  AlertCircle,
  BookOpen,
  CheckCircle,
  Edit,
  X,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  calificacionesService,
  type CreateCalificacionDTO,
} from '../api/services/calificacionesService';
import {
  evaluacionesService,
  type Evaluacion,
  type AlumnoConCalificacion,
} from '../api/services/evaluacionesService';
import {
  asignaturasService,
  type Asignatura,
} from '../api/services/asignaturasService';
import {
  promediosService,
  type VerificacionCierreResponseDto,
} from '../api/services/promediosService';

export function CalificacionesModule() {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] =
    useState<string>('');
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] =
    useState<string>('');
  const [trimestreSeleccionado, setTrimestreSeleccionado] =
    useState<string>('');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>('');
  const [mesSeleccionado, setMesSeleccionado] = useState<string>('');
  const [alumnos, setAlumnos] = useState<AlumnoConCalificacion[]>([]);
  const [totalAlumnos, setTotalAlumnos] = useState(0);
  const [alumnosCalificados, setAlumnosCalificados] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAlumno, setSavingAlumno] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [alumnosEnEdicion, setAlumnosEnEdicion] = useState<Set<number>>(
    new Set()
  );

  // Map para guardar el estado de cada evaluación (total y calificados)
  const [evaluacionesEstado, setEvaluacionesEstado] = useState<
    Map<number, { total: number; calificados: number }>
  >(new Map());

  // Estados para cerrar calificaciones
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [verificacionCierre, setVerificacionCierre] =
    useState<VerificacionCierreResponseDto | null>(null);
  const [loadingVerificacion, setLoadingVerificacion] = useState(false);
  const [closingGrades, setClosingGrades] = useState(false);
  const [asignaturaInfo, setAsignaturaInfo] = useState<{
    id_asignatura: number;
    nombre: string;
    trimestre?: number;
    periodo?: number;
    cerrada?: boolean;
  } | null>(null);

  // Cargar evaluaciones del orientador y sus estados
  useEffect(() => {
    const fetchEvaluaciones = async () => {
      try {
        setLoading(true);
        const asignaturasData = await asignaturasService.findMisAsignaturas();
        setAsignaturas(asignaturasData);

        const data = await evaluacionesService.findByMisAsignaturas();
        setEvaluaciones(data);

        // Cargar el estado de cada evaluación
        const estadosMap = new Map<
          number,
          { total: number; calificados: number }
        >();
        for (const evaluacion of data) {
          try {
            const estadoData =
              await evaluacionesService.getAlumnosConCalificaciones(
                evaluacion.id_evaluacion
              );
            estadosMap.set(evaluacion.id_evaluacion, {
              total: estadoData.total_alumnos,
              calificados: estadoData.alumnos_calificados,
            });
          } catch (err) {
            console.error(
              `Error cargando estado de evaluación ${evaluacion.id_evaluacion}:`,
              err
            );
          }
        }
        setEvaluacionesEstado(estadosMap);
      } catch (err) {
        console.error('Error cargando evaluaciones:', err);
        toast.error('No se pudieron cargar las evaluaciones');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluaciones();
  }, []);

  // Configurar asignaturaInfo cuando se selecciona una asignatura
  useEffect(() => {
    if (!asignaturaSeleccionada || asignaturaSeleccionada === 'todas') {
      setAsignaturaInfo(null);
      return;
    }

    // Buscar la primera evaluación de esta asignatura para obtener info
    const primeraEvaluacion = evaluaciones.find(
      (e) => e.asignatura.id_asignatura.toString() === asignaturaSeleccionada
    );

    if (primeraEvaluacion) {
      // Verificar si está cerrada
      const verificarEstadoCierre = async () => {
        try {
          const anioAcademico = new Date().getFullYear().toString();
          const verificacion =
            await promediosService.verificarEstadoParaCierreAsignatura(
              primeraEvaluacion.asignatura.id_asignatura,
              anioAcademico,
              primeraEvaluacion.trimestre,
              primeraEvaluacion.periodo
            );

          console.log('Verificación de cierre:', verificacion);

          setAsignaturaInfo({
            id_asignatura: primeraEvaluacion.asignatura.id_asignatura,
            nombre: primeraEvaluacion.asignatura.nombre,
            trimestre: primeraEvaluacion.trimestre,
            periodo: primeraEvaluacion.periodo,
            cerrada: verificacion.estaCerrado || false,
          });
        } catch (err) {
          console.error('Error verificando estado de cierre:', err);
          setAsignaturaInfo({
            id_asignatura: primeraEvaluacion.asignatura.id_asignatura,
            nombre: primeraEvaluacion.asignatura.nombre,
            trimestre: primeraEvaluacion.trimestre,
            periodo: primeraEvaluacion.periodo,
            cerrada: false,
          });
        }
      };

      verificarEstadoCierre();
    }
  }, [asignaturaSeleccionada, evaluaciones]);

  // Cargar alumnos y calificaciones cuando se selecciona una evaluación
  useEffect(() => {
    if (!evaluacionSeleccionada) {
      setAlumnos([]);
      setTotalAlumnos(0);
      setAlumnosCalificados(0);
      setAlumnosEnEdicion(new Set());
      return;
    }
    fetchData();
  }, [evaluacionSeleccionada]);

  // Filtrar alumnos por búsqueda
  const alumnosFiltrados = alumnos.filter((alumno) =>
    `${alumno.nombre} ${alumno.apellido}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Actualizar calificación de un alumno con validación
  const handleCalificacionChange = (idAlumno: number, value: string) => {
    if (value === '') {
      setAlumnos((prev) =>
        prev.map((alumno) =>
          alumno.id_alumno === idAlumno
            ? { ...alumno, calificacion: undefined }
            : alumno
        )
      );
      return;
    }

    const nota = Number(value);

    // Validar que esté en el rango 0-10
    if (nota < 0 || nota > 10) {
      toast.error('La calificación debe estar entre 0 y 10');
      return;
    }

    setAlumnos((prev) =>
      prev.map((alumno) =>
        alumno.id_alumno === idAlumno
          ? { ...alumno, calificacion: nota }
          : alumno
      )
    );
  };

  // Habilitar edición de una nota ya calificada
  const handleHabilitarEdicion = (idAlumno: number) => {
    setAlumnosEnEdicion((prev) => {
      const newSet = new Set(prev);
      newSet.add(idAlumno);
      return newSet;
    });
  };

  // Cancelar edición
  const handleCancelarEdicion = (idAlumno: number) => {
    setAlumnosEnEdicion((prev) => {
      const newSet = new Set(prev);
      newSet.delete(idAlumno);
      return newSet;
    });
    // Recargar datos originales
    fetchData();
  };

  const fetchData = async () => {
    if (!evaluacionSeleccionada) return;

    try {
      setLoading(true);
      const data = await evaluacionesService.getAlumnosConCalificaciones(
        Number(evaluacionSeleccionada)
      );
      setAlumnos(data.alumnos);
      setTotalAlumnos(data.total_alumnos);
      setAlumnosCalificados(data.alumnos_calificados);

      // Extraer información de la asignatura para el cierre de calificaciones
      // AsignaturaInfo ya se configura en el useEffect cuando se selecciona la asignatura
      // No es necesario volver a configurarlo aquí basado en la evaluación específica
    } catch (err) {
      console.error('Error cargando datos:', err);
      toast.error('No se pudieron cargar los alumnos');
    } finally {
      setLoading(false);
    }
  };

  // Guardar calificación individual de un alumno
  const handleGuardarIndividual = async (alumno: AlumnoConCalificacion) => {
    if (!evaluacionSeleccionada) {
      toast.error('Debe seleccionar una evaluación');
      return;
    }

    if (alumno.calificacion === undefined || alumno.calificacion === null) {
      toast.error('Debe ingresar una calificación');
      return;
    }

    const evaluacion = evaluaciones.find(
      (e) => e.id_evaluacion.toString() === evaluacionSeleccionada
    );

    if (!evaluacion) return;

    // Validar que esté en el rango 0-10
    if (alumno.calificacion < 0 || alumno.calificacion > 10) {
      toast.error('La calificación debe estar entre 0 y 10');
      return;
    }

    // Validar rango de la evaluación
    if (
      alumno.calificacion < evaluacion.puntaje_minimo ||
      alumno.calificacion > evaluacion.puntaje_maximo
    ) {
      toast.error(
        `La calificación debe estar entre ${evaluacion.puntaje_minimo} y ${evaluacion.puntaje_maximo}`
      );
      return;
    }

    try {
      setSavingAlumno(alumno.id_alumno);

      if (alumno.id_nota) {
        // Actualizar calificación existente
        await calificacionesService.update(alumno.id_nota, {
          calificacion: alumno.calificacion,
        });
        toast.success(
          `Calificación de ${alumno.nombre} ${alumno.apellido} actualizada correctamente`
        );
      } else {
        // Crear nueva calificación
        const payload: CreateCalificacionDTO = {
          id_evaluacion: Number(evaluacionSeleccionada),
          id_alumno: alumno.id_alumno,
          calificacion: alumno.calificacion,
        };
        await calificacionesService.create(payload);
        toast.success(
          `Calificación de ${alumno.nombre} ${alumno.apellido} guardada correctamente`
        );
      }

      // Recargar datos
      const data = await evaluacionesService.getAlumnosConCalificaciones(
        Number(evaluacionSeleccionada)
      );

      setAlumnos(data.alumnos);
      setTotalAlumnos(data.total_alumnos);
      setAlumnosCalificados(data.alumnos_calificados);

      // Quitar del modo edición
      setAlumnosEnEdicion((prev) => {
        const newSet = new Set(prev);
        newSet.delete(alumno.id_alumno);
        return newSet;
      });

      // Actualizar el estado de la evaluación en el map
      setEvaluacionesEstado((prev) => {
        const newMap = new Map(prev);
        newMap.set(Number(evaluacionSeleccionada), {
          total: data.total_alumnos,
          calificados: data.alumnos_calificados,
        });
        return newMap;
      });
    } catch (err: any) {
      console.error('Error guardando calificación:', err);
      toast.error(
        err.response?.data?.message || 'Error al guardar la calificación'
      );
    } finally {
      setSavingAlumno(null);
    }
  };

  // Guardar todas las calificaciones
  const handleGuardarCalificaciones = async () => {
    if (!evaluacionSeleccionada) {
      toast.error('Debe seleccionar una evaluación');
      return;
    }

    try {
      setSaving(true);

      const evaluacion = evaluaciones.find(
        (e) => e.id_evaluacion.toString() === evaluacionSeleccionada
      );

      if (!evaluacion) return;

      // Procesar cada alumno
      let actualizados = 0;
      let creados = 0;

      for (const alumno of alumnos) {
        // Solo procesar si tiene calificación y cumple una de estas condiciones:
        // 1. No tiene id_nota (es nuevo)
        // 2. Tiene id_nota Y está en modo edición (se está editando)
        const debeGuardar =
          alumno.calificacion !== undefined &&
          (!alumno.id_nota || alumnosEnEdicion.has(alumno.id_alumno));

        if (debeGuardar) {
          // Validar que esté en el rango 0-10
          if (alumno.calificacion! < 0 || alumno.calificacion! > 10) {
            toast.error(
              `La calificación de ${alumno.nombre} ${alumno.apellido} debe estar entre 0 y 10`
            );
            continue;
          }

          // Validar rango de la evaluación
          if (
            alumno.calificacion! < evaluacion.puntaje_minimo ||
            alumno.calificacion! > evaluacion.puntaje_maximo
          ) {
            toast.error(
              `La calificación de ${alumno.nombre} ${alumno.apellido} debe estar entre ${evaluacion.puntaje_minimo} y ${evaluacion.puntaje_maximo}`
            );
            continue;
          }

          if (alumno.id_nota) {
            // Actualizar calificación existente
            await calificacionesService.update(alumno.id_nota, {
              calificacion: alumno.calificacion!,
            });
            actualizados++;
          } else {
            // Crear nueva calificación
            const payload: CreateCalificacionDTO = {
              id_evaluacion: Number(evaluacionSeleccionada),
              id_alumno: alumno.id_alumno,
              calificacion: alumno.calificacion!,
            };
            await calificacionesService.create(payload);
            creados++;
          }
        }
      }

      const mensaje = [];
      if (creados > 0)
        mensaje.push(
          `${creados} calificación${creados > 1 ? 'es' : ''} creada${creados > 1 ? 's' : ''}`
        );
      if (actualizados > 0)
        mensaje.push(
          `${actualizados} calificación${actualizados > 1 ? 'es' : ''} actualizada${actualizados > 1 ? 's' : ''}`
        );

      if (mensaje.length === 0) {
        toast.info('No hay cambios para guardar');
        setSaving(false);
        return;
      }

      toast.success(mensaje.join(' y '));

      // Recargar datos completos usando el nuevo endpoint
      const data = await evaluacionesService.getAlumnosConCalificaciones(
        Number(evaluacionSeleccionada)
      );

      setAlumnos(data.alumnos);
      setTotalAlumnos(data.total_alumnos);
      setAlumnosCalificados(data.alumnos_calificados);

      // Limpiar alumnos en edición
      setAlumnosEnEdicion(new Set());

      // Actualizar el estado de la evaluación en el map
      setEvaluacionesEstado((prev) => {
        const newMap = new Map(prev);
        newMap.set(Number(evaluacionSeleccionada), {
          total: data.total_alumnos,
          calificados: data.alumnos_calificados,
        });
        return newMap;
      });
    } catch (err: any) {
      console.error('Error guardando calificaciones:', err);
      const msg =
        err?.response?.data?.message || 'Error al guardar las calificaciones';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  // Verificar estado antes de cerrar
  const handleVerificarCierre = async () => {
    if (!asignaturaInfo) {
      toast.error(
        'No hay información de la asignatura disponible. Por favor, seleccione una asignatura.'
      );
      return;
    }

    try {
      setLoadingVerificacion(true);
      const anioAcademico = new Date().getFullYear().toString();

      // Verificar TODA la asignatura (sin filtrar por trimestre/periodo específico)
      const verificacion =
        await promediosService.verificarEstadoParaCierreAsignatura(
          asignaturaInfo.id_asignatura,
          anioAcademico,
          undefined, // No filtrar por trimestre
          undefined // No filtrar por periodo
        );

      setVerificacionCierre(verificacion);
      setShowCloseDialog(true);
    } catch (err: any) {
      console.error('Error verificando estado:', err);
      toast.error(
        err.response?.data?.message ||
          'No se pudo verificar el estado de las calificaciones de la asignatura. Por favor, intente nuevamente.'
      );
    } finally {
      setLoadingVerificacion(false);
    }
  };

  // Cerrar calificaciones de la asignatura
  const handleCerrarCalificaciones = async (forzar: boolean = false) => {
    if (!asignaturaInfo) {
      toast.error('No hay información de la asignatura disponible');
      return;
    }

    try {
      setClosingGrades(true);
      const anioAcademico = new Date().getFullYear().toString();

      // Cerrar TODA la asignatura (sin filtrar por trimestre/periodo específico)
      const resultado = await promediosService.cerrarCalificacionesAsignatura(
        asignaturaInfo.id_asignatura,
        anioAcademico,
        undefined, // No filtrar por trimestre
        undefined, // No filtrar por periodo
        forzar
      );

      setShowCloseDialog(false);

      // Actualizar el estado de asignaturaInfo para marcarla como cerrada
      if (asignaturaInfo) {
        setAsignaturaInfo({ ...asignaturaInfo, cerrada: true });
      }

      if (resultado.alumnosCerrados === resultado.totalAlumnos) {
        toast.success(
          `Calificaciones de ${asignaturaInfo.nombre} cerradas exitosamente para ${resultado.alumnosCerrados} alumno${resultado.alumnosCerrados !== 1 ? 's' : ''}`
        );
      } else {
        toast.warning(
          `Se cerraron ${resultado.alumnosCerrados} de ${resultado.totalAlumnos} alumnos en ${asignaturaInfo.nombre}. ${resultado.alumnosConError} alumno${resultado.alumnosConError !== 1 ? 's' : ''} presentaron errores.`
        );
      }
    } catch (err: any) {
      console.error('Error cerrando calificaciones:', err);
      toast.error(
        err.response?.data?.message ||
          'No se pueden cerrar las calificaciones ya que faltan evaluaciones por calificar'
      );
    } finally {
      setClosingGrades(false);
    }
  };

  // Función helper para obtener estado de evaluación
  const getEstadoEvaluacion = (idEvaluacion: number) => {
    const estado = evaluacionesEstado.get(idEvaluacion);
    if (!estado) return { estado: 'sin-datos', porcentaje: 0 };

    const porcentaje =
      estado.total > 0
        ? Math.round((estado.calificados / estado.total) * 100)
        : 0;

    if (estado.calificados === 0)
      return { estado: 'no-calificado', porcentaje: 0 };
    if (estado.calificados === estado.total)
      return { estado: 'calificado', porcentaje: 100 };
    return { estado: 'parcial', porcentaje };
  };

  // Función para determinar si es básica o bachillerato
  const getTipoNivel = (): 'BASICA' | 'BACHILLERATO' | null => {
    if (!asignaturaSeleccionada || asignaturaSeleccionada === 'todas')
      return null;

    // Buscar una evaluación de la asignatura seleccionada que tenga información de trimestre o periodo
    const evaluacionAsignatura = evaluaciones.find(
      (e) => e.asignatura.id_asignatura.toString() === asignaturaSeleccionada
    );

    if (!evaluacionAsignatura) return null;

    // Si tiene periodo, es bachillerato; si tiene trimestre, es básica
    if (
      evaluacionAsignatura.periodo !== null &&
      evaluacionAsignatura.periodo !== undefined
    ) {
      return 'BACHILLERATO';
    }
    if (
      evaluacionAsignatura.trimestre !== null &&
      evaluacionAsignatura.trimestre !== undefined
    ) {
      return 'BASICA';
    }

    return null;
  };

  // Render de evaluación pendiente con badges (Periodo/Trimestre/Mes)
  const renderEvaluacionPendienteItem = (ev: any) => {
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    if (typeof ev === 'string') return <span>{ev}</span>;

    const tipo =
      ev?.tipoEvaluacion ??
      ev?.tipo ??
      ev?.nombre ??
      ev?.titulo ??
      'Evaluación';

    const toArray = (v: any) => (Array.isArray(v) ? v : v != null ? [v] : []);
    const periodos = toArray(ev?.periodo);
    const trimestres = toArray(ev?.trimestre);
    const mesesValores = toArray(ev?.mes);

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium text-gray-800">{tipo}</span>
        {trimestres.map((t: any) => (
          <Badge
            key={`t-${t}`}
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Trimestre {t}
          </Badge>
        ))}
        {periodos.map((p: any) => (
          <Badge
            key={`p-${p}`}
            variant="outline"
            className="bg-indigo-50 text-indigo-700 border-indigo-200"
          >
            Periodo {p}
          </Badge>
        ))}
        {mesesValores.map((m: any) => {
          const num = Number(m);
          const nombreMes = !Number.isNaN(num) ? meses[num - 1] || m : m;
          return (
            <Badge
              key={`m-${m}`}
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200"
            >
              Mes {nombreMes}
            </Badge>
          );
        })}
      </div>
    );
  };

  // Filtrar evaluaciones por asignatura seleccionada, trimestre/periodo y mes
  const evaluacionesFiltradas = evaluaciones.filter((e) => {
    // Filtro por asignatura
    if (asignaturaSeleccionada) {
      if (e.asignatura.id_asignatura.toString() !== asignaturaSeleccionada) {
        return false;
      }
    }

    // Filtro por trimestre (para básica) - solo filtrar si NO es '0' y NO es vacío
    if (
      trimestreSeleccionado &&
      trimestreSeleccionado !== '0' &&
      trimestreSeleccionado !== ''
    ) {
      if (e.trimestre?.toString() !== trimestreSeleccionado) {
        return false;
      }
    }

    // Filtro por periodo (para bachillerato) - solo filtrar si NO es '0' y NO es vacío
    if (
      periodoSeleccionado &&
      periodoSeleccionado !== '0' &&
      periodoSeleccionado !== ''
    ) {
      if (e.periodo?.toString() !== periodoSeleccionado) {
        return false;
      }
    }

    // Filtro por mes (solo para básica) - solo filtrar si NO es '0' y NO es vacío
    if (mesSeleccionado && mesSeleccionado !== '0' && mesSeleccionado !== '') {
      if (e.mes?.toString() !== mesSeleccionado) {
        return false;
      }
    }

    return true;
  });

  // Calcular estadísticas
  const stats = {
    total: totalAlumnos,
    conNota: alumnosCalificados,
    sinNota: totalAlumnos - alumnosCalificados,
    promedio:
      alumnosCalificados > 0
        ? (
            alumnos.reduce((sum, a) => sum + (a.calificacion || 0), 0) /
            alumnosCalificados
          ).toFixed(2)
        : '0.00',
  };

  // Resetear filtros cuando cambie la asignatura
  useEffect(() => {
    setEvaluacionSeleccionada('');
    setTrimestreSeleccionado('');
    setPeriodoSeleccionado('');
    setMesSeleccionado('');
  }, [asignaturaSeleccionada]);

  const evaluacionActual = evaluaciones.find(
    (e) => e.id_evaluacion.toString() === evaluacionSeleccionada
  );

  if (loading && evaluaciones.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando evaluaciones...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Calificaciones
          </h1>
          <p className="text-gray-600">
            Registra y administra las notas de tus alumnos
          </p>
        </div>
        {asignaturaSeleccionada &&
          asignaturaSeleccionada !== 'todas' &&
          asignaturaInfo && (
            <>
              {asignaturaInfo.cerrada ? (
                <Badge className="bg-green-600 text-white px-4 py-2">
                  <Lock className="w-4 h-4 mr-2" />
                  Calificaciones Cerradas
                </Badge>
              ) : (
                <Button
                  onClick={handleVerificarCierre}
                  disabled={loadingVerificacion}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loadingVerificacion ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Cerrar Calificaciones
                    </>
                  )}
                </Button>
              )}
            </>
          )}
      </div>

      {/* Selección de evaluación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ClipboardList className="w-5 h-5" />
            <span>Seleccionar Evaluación</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Selector de Asignatura */}
            <div className="lg:col-span-2">
              <Label>Asignatura</Label>
              <Select
                value={asignaturaSeleccionada}
                onValueChange={setAsignaturaSeleccionada}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una asignatura" />
                </SelectTrigger>
                <SelectContent>
                  {asignaturas.map((asignatura) => (
                    <SelectItem
                      key={asignatura.id_asignatura}
                      value={asignatura.id_asignatura.toString()}
                    >
                      {asignatura.curso
                        ? `${asignatura.nombre} - ${asignatura.curso.nombre} ${asignatura.curso.seccion || ''}`.trim()
                        : asignatura.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de Trimestre (solo para básica) */}
            {getTipoNivel() === 'BASICA' && (
              <div>
                <Label>Trimestre</Label>
                <Select
                  value={trimestreSeleccionado}
                  onValueChange={setTrimestreSeleccionado}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Todos los trimestres</SelectItem>
                    <SelectItem value="1">Trimestre 1</SelectItem>
                    <SelectItem value="2">Trimestre 2</SelectItem>
                    <SelectItem value="3">Trimestre 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Selector de Periodo (solo para bachillerato) */}
            {getTipoNivel() === 'BACHILLERATO' && (
              <div>
                <Label>Periodo</Label>
                <Select
                  value={periodoSeleccionado}
                  onValueChange={setPeriodoSeleccionado}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Todos los periodos</SelectItem>
                    <SelectItem value="1">Periodo 1</SelectItem>
                    <SelectItem value="2">Periodo 2</SelectItem>
                    <SelectItem value="3">Periodo 3</SelectItem>
                    <SelectItem value="4">Periodo 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Selector de Mes (solo para básica) */}
            {getTipoNivel() === 'BASICA' && (
              <div>
                <Label>Mes</Label>
                <Select
                  value={mesSeleccionado}
                  onValueChange={setMesSeleccionado}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Todos los meses</SelectItem>
                    <SelectItem value="2">Febrero</SelectItem>
                    <SelectItem value="3">Marzo</SelectItem>
                    <SelectItem value="4">Abril</SelectItem>
                    <SelectItem value="5">Mayo</SelectItem>
                    <SelectItem value="6">Junio</SelectItem>
                    <SelectItem value="7">Julio</SelectItem>
                    <SelectItem value="8">Agosto</SelectItem>
                    <SelectItem value="9">Septiembre</SelectItem>
                    <SelectItem value="10">Octubre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Selector de Evaluación */}
            <div
              className={
                getTipoNivel() === 'BASICA'
                  ? 'lg:col-span-2'
                  : getTipoNivel() === 'BACHILLERATO'
                    ? ''
                    : 'lg:col-span-2'
              }
            >
              <Label>Evaluación</Label>
              <Select
                value={evaluacionSeleccionada}
                onValueChange={setEvaluacionSeleccionada}
                disabled={!asignaturaSeleccionada}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una evaluación" />
                </SelectTrigger>
                <SelectContent>
                  {evaluacionesFiltradas.map((evaluacion) => {
                    const { estado, porcentaje } = getEstadoEvaluacion(
                      evaluacion.id_evaluacion
                    );
                    const estadoInfo = evaluacionesEstado.get(
                      evaluacion.id_evaluacion
                    );

                    // Construir etiqueta informativa
                    const mesesNombres = [
                      '',
                      '',
                      'Feb',
                      'Mar',
                      'Abr',
                      'May',
                      'Jun',
                      'Jul',
                      'Ago',
                      'Sep',
                      'Oct',
                    ];
                    let infoExtra = '';

                    if (evaluacion.trimestre) {
                      infoExtra = `T${evaluacion.trimestre}`;
                      if (evaluacion.mes) {
                        infoExtra += ` - ${mesesNombres[evaluacion.mes]}`;
                      }
                    } else if (evaluacion.periodo) {
                      infoExtra = `P${evaluacion.periodo}`;
                    }

                    return (
                      <SelectItem
                        key={evaluacion.id_evaluacion}
                        value={evaluacion.id_evaluacion.toString()}
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {evaluacion.nombre}
                            </span>
                            {infoExtra && (
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                                {infoExtra}
                              </span>
                            )}
                          </div>
                          {estadoInfo && (
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                estado === 'calificado'
                                  ? 'bg-green-100 text-green-700'
                                  : estado === 'no-calificado'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              {estado === 'calificado' && '✓ Calificado'}
                              {estado === 'no-calificado' && '✗ Sin calificar'}
                              {estado === 'parcial' && `${porcentaje}%`}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {evaluacionActual && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <BookOpen className="w-3 h-3 mr-1" />
                {evaluacionActual.asignatura.nombre}
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                {evaluacionActual.tipoEvaluacion.nombre} (
                {evaluacionActual.tipoEvaluacion.porcentaje}%)
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <Award className="w-3 h-3 mr-1" />
                {evaluacionActual.puntaje_minimo} -{' '}
                {evaluacionActual.puntaje_maximo} pts
              </Badge>

              {/* Badge de trimestre si aplica */}
              {evaluacionActual.trimestre && (
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700"
                >
                  Trimestre {evaluacionActual.trimestre}
                </Badge>
              )}

              {/* Badge de periodo si aplica */}
              {evaluacionActual.periodo && (
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700"
                >
                  Periodo {evaluacionActual.periodo}
                </Badge>
              )}

              {/* Badge de mes si aplica */}
              {evaluacionActual.mes && (
                <Badge variant="outline" className="bg-cyan-50 text-cyan-700">
                  {
                    [
                      '',
                      '',
                      'Febrero',
                      'Marzo',
                      'Abril',
                      'Mayo',
                      'Junio',
                      'Julio',
                      'Agosto',
                      'Septiembre',
                      'Octubre',
                    ][evaluacionActual.mes]
                  }
                </Badge>
              )}

              {(() => {
                const { estado, porcentaje } = getEstadoEvaluacion(
                  evaluacionActual.id_evaluacion
                );
                if (estado === 'calificado') {
                  return (
                    <Badge className="bg-green-600 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Calificado (100%)
                    </Badge>
                  );
                } else if (estado === 'no-calificado') {
                  return (
                    <Badge className="bg-red-600 text-white">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      No Calificado
                    </Badge>
                  );
                } else if (estado === 'parcial') {
                  return (
                    <Badge className="bg-orange-600 text-white">
                      <Loader2 className="w-3 h-3 mr-1" />
                      Parcial ({porcentaje}%)
                    </Badge>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* Resumen de filtros activos */}
          {((trimestreSeleccionado && trimestreSeleccionado !== '0') ||
            (periodoSeleccionado && periodoSeleccionado !== '0') ||
            (mesSeleccionado && mesSeleccionado !== '0')) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Filtros activos:
              </p>
              <div className="flex flex-wrap gap-2">
                {trimestreSeleccionado && trimestreSeleccionado !== '0' && (
                  <Badge
                    variant="secondary"
                    className="bg-indigo-100 text-indigo-800"
                  >
                    📅 Trimestre {trimestreSeleccionado}
                  </Badge>
                )}
                {periodoSeleccionado && periodoSeleccionado !== '0' && (
                  <Badge
                    variant="secondary"
                    className="bg-indigo-100 text-indigo-800"
                  >
                    📅 Periodo {periodoSeleccionado}
                  </Badge>
                )}
                {mesSeleccionado && mesSeleccionado !== '0' && (
                  <Badge
                    variant="secondary"
                    className="bg-cyan-100 text-cyan-800"
                  >
                    📆{' '}
                    {
                      [
                        '',
                        '',
                        'Febrero',
                        'Marzo',
                        'Abril',
                        'Mayo',
                        'Junio',
                        'Julio',
                        'Agosto',
                        'Septiembre',
                        'Octubre',
                      ][parseInt(mesSeleccionado)]
                    }
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {evaluacionSeleccionada && (
        <>
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Alumnos</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.total}
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
                    <p className="text-sm text-gray-600">Con Nota</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.conNota}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Sin Nota</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.sinNota}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Promedio</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.promedio}
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de calificaciones */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Lista de Alumnos ({alumnosFiltrados.length})</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar alumno..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button
                    onClick={handleGuardarCalificaciones}
                    disabled={saving || loading}
                    className="bg-green-600 hover:bg-green-700"
                    title="Guardar todas las calificaciones modificadas"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Todas
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">
                    Cargando alumnos...
                  </span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Alumno</TableHead>
                      <TableHead className="w-48">Calificación</TableHead>
                      <TableHead className="w-32 text-center">Estado</TableHead>
                      <TableHead className="w-40 text-center">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alumnosFiltrados.length > 0 ? (
                      alumnosFiltrados.map((alumno, index) => (
                        <TableRow key={alumno.id_alumno}>
                          <TableCell className="font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {alumno.apellido}, {alumno.nombre}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={10}
                              step="0.1"
                              value={alumno.calificacion ?? ''}
                              onChange={(e) =>
                                handleCalificacionChange(
                                  alumno.id_alumno,
                                  e.target.value
                                )
                              }
                              placeholder="0 - 10"
                              className="w-full"
                              disabled={
                                asignaturaInfo?.cerrada ||
                                (alumno.tiene_calificacion &&
                                  !alumnosEnEdicion.has(alumno.id_alumno))
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {alumno.tiene_calificacion ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Calificado
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-red-50 text-red-700"
                              >
                                <AlertCircle className="w-3 h-3 mr-1" />
                                No Calificado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Botón de Guardar individual */}
                              {alumno.calificacion !== undefined &&
                                alumno.calificacion !== null &&
                                (!alumno.tiene_calificacion ||
                                  alumnosEnEdicion.has(alumno.id_alumno)) &&
                                !asignaturaInfo?.cerrada && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleGuardarIndividual(alumno)
                                    }
                                    disabled={savingAlumno === alumno.id_alumno}
                                    className="text-green-600 hover:text-green-900 hover:bg-green-50"
                                    title="Guardar calificación"
                                  >
                                    {savingAlumno === alumno.id_alumno ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Save className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}

                              {/* Botón de Editar/Cancelar */}
                              {alumno.tiene_calificacion &&
                                !asignaturaInfo?.cerrada &&
                                (alumnosEnEdicion.has(alumno.id_alumno) ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleCancelarEdicion(alumno.id_alumno)
                                    }
                                    className="text-gray-600 hover:text-gray-900"
                                    title="Cancelar edición"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleHabilitarEdicion(alumno.id_alumno)
                                    }
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Editar calificación"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                ))}

                              {/* Placeholder cuando no hay acciones disponibles */}
                              {!alumno.tiene_calificacion &&
                                (alumno.calificacion === undefined ||
                                  alumno.calificacion === null) && (
                                  <span className="text-gray-400 text-sm">
                                    -
                                  </span>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-gray-500 py-8"
                        >
                          No se encontraron alumnos
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!evaluacionSeleccionada && (
        <Card>
          <CardContent className="p-8 text-center">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Selecciona una evaluación para comenzar a registrar calificaciones
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de verificación y cierre */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        {/* Hacemos el modal más ancho y anulamos sm:max-w-* por defecto */}
        <DialogContent className="w-[95vw] sm:max-w-[95vw] md:max-w-[1100px] lg:max-w-[1280px] xl:max-w-[1440px] 2xl:max-w-[1600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <span>
                Cerrar Calificaciones de{' '}
                {asignaturaInfo?.nombre || 'la Asignatura'}
              </span>
            </DialogTitle>
            <DialogDescription>{verificacionCierre?.mensaje}</DialogDescription>
          </DialogHeader>

          {verificacionCierre && (
            <div className="space-y-4">
              {/* Estadísticas */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Estadísticas del Curso
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-blue-600 font-medium">
                      Total de Alumnos
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {verificacionCierre.estadisticas.totalAlumnos}
                    </p>
                  </div>
                  <div>
                    <p className="text-green-600 font-medium">
                      Con Todas las Notas
                    </p>
                    <p className="text-2xl font-bold text-green-700">
                      {verificacionCierre.estadisticas.alumnosConTodasLasNotas}
                    </p>
                  </div>
                  <div>
                    <p className="text-orange-600 font-medium">
                      Sin Algunas Notas
                    </p>
                    <p className="text-2xl font-bold text-orange-700">
                      {verificacionCierre.estadisticas.alumnosSinNotas}
                    </p>
                  </div>
                  <div>
                    <p className="text-purple-600 font-medium">
                      Calificaciones
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {
                        verificacionCierre.estadisticas
                          .totalCalificacionesRegistradas
                      }
                      /
                      {
                        verificacionCierre.estadisticas
                          .totalCalificacionesEsperadas
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Advertencias */}
              {verificacionCierre.advertencias.length > 0 && (
                <div className="space-y-3">
                  {verificacionCierre.advertencias.map((advertencia, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-4 ${
                        advertencia.tipo === 'ALUMNOS_SIN_CALIFICAR'
                          ? 'bg-orange-50 border border-orange-200'
                          : 'bg-yellow-50 border border-yellow-200'
                      }`}
                    >
                      <h4 className="font-semibold flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{advertencia.mensaje}</span>
                      </h4>

                      {/* Alumnos sin calificar */}
                      {advertencia.alumnosSinCalificar &&
                        advertencia.alumnosSinCalificar.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm font-medium text-gray-700">
                              Alumnos con evaluaciones pendientes:
                            </p>
                            <div className="max-h-[65vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                              {advertencia.alumnosSinCalificar.map(
                                (alumno, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-white rounded p-3 border border-orange-100"
                                  >
                                    <p className="font-medium text-gray-900">
                                      {alumno.nombreCompleto}
                                    </p>
                                    <ul className="mt-2 text-sm text-gray-700 space-y-1">
                                      {alumno.evaluacionesPendientes.map(
                                        (evaluacion, evalIdx) => (
                                          <li
                                            key={evalIdx}
                                            className="list-none"
                                          >
                                            {renderEvaluacionPendienteItem(
                                              evaluacion
                                            )}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Evaluaciones faltantes */}
                      {advertencia.evaluacionesFaltantes &&
                        advertencia.evaluacionesFaltantes.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Evaluaciones faltantes por crear:
                            </p>
                            <div className="space-y-1">
                              {advertencia.evaluacionesFaltantes.map(
                                (evaluacion, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-center bg-white rounded p-2 border border-yellow-100"
                                  >
                                    <span className="font-medium text-gray-900">
                                      {evaluacion.tipoEvaluacion}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="bg-yellow-100"
                                    >
                                      {evaluacion.creadas} de{' '}
                                      {evaluacion.esperadas} creadas
                                    </Badge>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}

              {/* Mensaje de éxito si no hay advertencias */}
              {verificacionCierre.puedesCerrar &&
                verificacionCierre.advertencias.length === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <p className="font-semibold">
                        ¡Todo en orden! Puedes cerrar las calificaciones de{' '}
                        <strong>{asignaturaInfo?.nombre}</strong> de forma
                        segura.
                      </p>
                    </div>
                  </div>
                )}
            </div>
          )}

          <DialogFooter className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setShowCloseDialog(false)}
              disabled={closingGrades}
            >
              Cancelar
            </Button>
            <div className="space-x-2">
              {verificacionCierre && !verificacionCierre.puedesCerrar && (
                <Button
                  onClick={() => handleCerrarCalificaciones(true)}
                  disabled={closingGrades}
                  variant="destructive"
                >
                  {closingGrades ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cerrando...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Forzar Cierre
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={() => handleCerrarCalificaciones(false)}
                disabled={closingGrades}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {closingGrades ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cerrando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Cerrar Calificaciones
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CalificacionesModule;
