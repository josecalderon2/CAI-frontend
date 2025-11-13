import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  ClipboardList,
  BookOpen,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  evaluacionesService,
  type Evaluacion,
  type AsignaturaEvaluacion,
} from '../api/services/evaluacionesService';
import { GrupoTrimestreCard } from './GrupoTrimestreCard';
import { type TipoEvaluacion } from '../api/services/tiposEvaluacionService';
import {
  asignaturasService,
  type Asignatura,
} from '../api/services/asignaturasService';

// Interfaz para evaluaciones agrupadas por mes dentro de un trimestre
interface EvaluacionPorMes {
  mes: number;
  evaluaciones: Evaluacion[];
  porcentajeTotal: number;
  tiposFaltantes: TipoEvaluacion[];
  tiposExistentes: Map<number, Evaluacion>;
  estaCompleto: boolean;
}

// Interfaz para evaluaciones agrupadas por trimestre/periodo
interface EvaluacionAgrupada {
  asignatura: AsignaturaEvaluacion;
  trimestre: number | null;
  periodo: number | null;
  evaluacionesMensuales: EvaluacionPorMes[]; // Evaluaciones agrupadas por mes
  evaluacionesTrimestrales: Evaluacion[]; // Evaluaciones del trimestre completo
  porcentajeTotalTrimestral: number;
  tiposFaltantesTrimestral: TipoEvaluacion[];
  estaCompleto: boolean;
}

// Interfaz para nueva evaluación
interface NuevaEvaluacionForm {
  nombre: string;
  puntaje_maximo: number;
  puntaje_minimo: number;
  id_tipo_evaluacion: number;
  id_asignatura: number;
  trimestre: number | null;
  periodo: number | null;
  mes: number | null;
}

export function EvaluacionesModule() {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [tiposEvaluacionFiltrados, setTiposEvaluacionFiltrados] = useState<
    TipoEvaluacion[]
  >([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filtros
  const [filterAsignatura, setFilterAsignatura] = useState<string>('todas');
  const [filterTrimestre, setFilterTrimestre] = useState<string>('todos');
  const [filterAnio, setFilterAnio] = useState<string>('todos');

  // Estado para eliminar
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingEvaluacion, setDeletingEvaluacion] =
    useState<Evaluacion | null>(null);

  // Estado para agregar nueva evaluación
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [nuevaEvaluacion, setNuevaEvaluacion] = useState<NuevaEvaluacionForm>({
    nombre: '',
    puntaje_maximo: 10,
    puntaje_minimo: 0,
    id_tipo_evaluacion: 0,
    id_asignatura: 0,
    trimestre: null,
    periodo: null,
    mes: null,
  });

  // Cargar catálogos
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const asignaturasData = await asignaturasService.findMisAsignaturas();
        setAsignaturas(asignaturasData);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
        toast.error('No se pudieron cargar los catálogos base');
      }
    };

    fetchCatalogos();
  }, []);

  // Cargar tipos de evaluación cuando cambia la asignatura seleccionada O el mes
  useEffect(() => {
    const fetchTiposEvaluacion = async () => {
      if (nuevaEvaluacion.id_asignatura === 0) {
        setTiposEvaluacionFiltrados([]);
        return;
      }

      try {
        setLoadingTipos(true);
        const tipos = await evaluacionesService.getTiposEvaluacionByAsignatura(
          nuevaEvaluacion.id_asignatura
        );

        // Asegurar que tipos sea un array
        const tiposArray = Array.isArray(tipos) ? tipos : [];

        // Filtrar según si hay mes seleccionado (evaluaciones mensuales) o no (trimestrales)
        // Los tipos mensuales suelen ser: Laboratorio, Tarea, Revisión de Cuaderno
        // Los tipos trimestrales: Examen Trimestral, Actividad Integradora, Autoevaluación
        const tiposMensuales = ['Laboratorio', 'Tarea', 'Revisión de Cuaderno'];
        const tiposTrimestrales = [
          'Examen Trimestral',
          'Actividad Integradora',
          'Autoevaluación',
        ];

        let tiposFiltrados = tiposArray;

        // Si es periodo (bachillerato), mostrar todos los tipos sin filtrar
        // porque bachillerato no tiene evaluaciones mensuales
        if (nuevaEvaluacion.periodo !== null) {
          tiposFiltrados = tiposArray;
        } else if (
          nuevaEvaluacion.mes !== null &&
          nuevaEvaluacion.mes !== undefined
        ) {
          // Si hay mes seleccionado, mostrar solo tipos mensuales
          tiposFiltrados = tiposArray.filter((tipo) =>
            tiposMensuales.some((nombre) => tipo.nombre.includes(nombre))
          );
        } else if (nuevaEvaluacion.trimestre !== null) {
          // Si hay trimestre pero NO mes, mostrar solo tipos trimestrales
          tiposFiltrados = tiposArray.filter((tipo) =>
            tiposTrimestrales.some((nombre) => tipo.nombre.includes(nombre))
          );
        }

        setTiposEvaluacionFiltrados(tiposFiltrados);
      } catch (err) {
        console.error('Error cargando tipos de evaluación:', err);
        toast.error('No se pudieron cargar los tipos de evaluación');
        setTiposEvaluacionFiltrados([]);
      } finally {
        setLoadingTipos(false);
      }
    };

    fetchTiposEvaluacion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    nuevaEvaluacion.id_asignatura,
    nuevaEvaluacion.mes,
    nuevaEvaluacion.trimestre,
    nuevaEvaluacion.periodo,
  ]);

  // Cargar evaluaciones
  const fetchEvaluaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await evaluacionesService.findByMisAsignaturas();
      setEvaluaciones(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Error al cargar evaluaciones.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluaciones();
  }, []);

  // Obtener años únicos de las evaluaciones
  const aniosDisponibles = Array.from(
    new Set(evaluaciones.map((e) => e.anio_academico))
  ).sort((a, b) => b.localeCompare(a));

  // Función auxiliar para obtener nombre del mes
  const getNombreMes = (mes: number | null): string => {
    if (!mes) return '';
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
    return meses[mes - 1] || '';
  };

  // Función para agrupar evaluaciones
  const agruparEvaluaciones = (): EvaluacionAgrupada[] => {
    const grupos = new Map<string, EvaluacionAgrupada>();

    // IDs de las asignaturas del orientador logueado
    const asignaturasDelOrientador = new Set(
      asignaturas.map((a) => a.id_asignatura)
    );

    // Crear grupos vacíos para todas las asignaturas del orientador
    asignaturas.forEach((asignatura) => {
      const nivelAcademico =
        asignatura.curso?.gradoAcademico?.nombre.toLowerCase();
      const esBachillerato = nivelAcademico?.includes('bachillerato');

      if (esBachillerato) {
        // Crear 4 periodos para bachillerato
        for (let periodo = 1; periodo <= 4; periodo++) {
          const key = `${asignatura.id_asignatura}-PERIODO-${periodo}`;
          grupos.set(key, {
            asignatura: {
              id_asignatura: asignatura.id_asignatura,
              nombre: asignatura.nombre,
            } as AsignaturaEvaluacion,
            trimestre: null,
            periodo: periodo,
            evaluacionesMensuales: [],
            evaluacionesTrimestrales: [],
            porcentajeTotalTrimestral: 0,
            tiposFaltantesTrimestral: [],
            estaCompleto: false,
          });
        }
      } else {
        // Crear 3 trimestres para básica
        for (let trimestre = 1; trimestre <= 3; trimestre++) {
          const key = `${asignatura.id_asignatura}-TRIMESTRE-${trimestre}`;
          grupos.set(key, {
            asignatura: {
              id_asignatura: asignatura.id_asignatura,
              nombre: asignatura.nombre,
            } as AsignaturaEvaluacion,
            trimestre: trimestre,
            periodo: null,
            evaluacionesMensuales: [],
            evaluacionesTrimestrales: [],
            porcentajeTotalTrimestral: 0,
            tiposFaltantesTrimestral: [],
            estaCompleto: false,
          });
        }
      }
    });

    // Filtrar evaluaciones para solo incluir las del orientador
    const evaluacionesDelOrientador = evaluaciones.filter((ev) =>
      asignaturasDelOrientador.has(ev.asignatura.id_asignatura)
    );

    evaluacionesDelOrientador.forEach((evaluacion) => {
      // Determinar la clave del grupo principal (por trimestre o periodo)
      const key = evaluacion.periodo
        ? `${evaluacion.asignatura.id_asignatura}-PERIODO-${evaluacion.periodo}`
        : `${evaluacion.asignatura.id_asignatura}-TRIMESTRE-${evaluacion.trimestre || 'null'}`;

      // Si el grupo ya existe (debería existir), agregar la evaluación
      if (grupos.has(key)) {
        const grupo = grupos.get(key)!;

        // Actualizar información de la asignatura con datos completos de la evaluación
        grupo.asignatura = evaluacion.asignatura;

        // Clasificar evaluación como mensual o trimestral
        const esMensual =
          evaluacion.mes !== null && evaluacion.mes !== undefined;

        if (esMensual) {
          // Agregar a evaluaciones mensuales
          grupo.evaluacionesMensuales.push({
            mes: evaluacion.mes!,
            evaluaciones: [evaluacion],
            porcentajeTotal: 0,
            tiposFaltantes: [],
            tiposExistentes: new Map(),
            estaCompleto: false,
          });
        } else {
          // Agregar a evaluaciones trimestrales
          grupo.evaluacionesTrimestrales.push(evaluacion);
        }
      }
    });

    // Procesar cada grupo
    grupos.forEach((grupo) => {
      // 1. Agrupar evaluaciones mensuales por mes
      const mesesMap = new Map<number, EvaluacionPorMes>();

      grupo.evaluacionesMensuales.forEach((item) => {
        if (!mesesMap.has(item.mes)) {
          mesesMap.set(item.mes, {
            mes: item.mes,
            evaluaciones: [],
            porcentajeTotal: 0,
            tiposFaltantes: [],
            tiposExistentes: new Map(),
            estaCompleto: false,
          });
        }
        mesesMap.get(item.mes)!.evaluaciones.push(...item.evaluaciones);
      });

      // 2. Calcular porcentajes para cada mes
      mesesMap.forEach((mes) => {
        const tiposExistentes = new Map<number, Evaluacion>();
        let porcentajeTotal = 0;

        // Contar cuántas evaluaciones hay de cada tipo
        const conteoPorTipo = new Map<number, number>();
        mes.evaluaciones.forEach((ev) => {
          const idTipo = ev.tipoEvaluacion.id_tipo_evaluacion;
          conteoPorTipo.set(idTipo, (conteoPorTipo.get(idTipo) || 0) + 1);
        });

        // Ajustar el porcentaje de cada evaluación según la cantidad del mismo tipo
        mes.evaluaciones = mes.evaluaciones.map((ev) => {
          const idTipo = ev.tipoEvaluacion.id_tipo_evaluacion;
          const cantidad = conteoPorTipo.get(idTipo) || 1;
          const porcentajeIndividual = ev.tipoEvaluacion.porcentaje / cantidad;

          return {
            ...ev,
            tipoEvaluacion: {
              ...ev.tipoEvaluacion,
              porcentaje: porcentajeIndividual,
            },
          };
        });

        // Calcular porcentaje total sumando el porcentaje base de cada TIPO (no de cada evaluación)
        const tiposSumados = new Set<number>();
        mes.evaluaciones.forEach((ev) => {
          const idTipo = ev.tipoEvaluacion.id_tipo_evaluacion;

          // Solo sumar el porcentaje del tipo una vez
          if (!tiposSumados.has(idTipo)) {
            // Buscar la evaluación original para obtener el porcentaje base
            const evaluacionOriginal = mes.evaluaciones.find(
              (e) => e.tipoEvaluacion.id_tipo_evaluacion === idTipo
            );
            if (evaluacionOriginal) {
              tiposExistentes.set(idTipo, evaluacionOriginal);
              porcentajeTotal +=
                evaluacionOriginal.tipoEvaluacion.porcentaje *
                (conteoPorTipo.get(idTipo) || 1);
            }
            tiposSumados.add(idTipo);
          }
        });

        mes.tiposExistentes = tiposExistentes;
        mes.porcentajeTotal = porcentajeTotal;
        mes.estaCompleto = Math.abs(porcentajeTotal - 35) < 0.01; // 35% del trimestre

        // Encontrar tipos faltantes para este mes
        const tiposDelContexto = new Set<number>();
        const tiposVistos = new Map<number, TipoEvaluacion>();

        // Buscar todos los tipos mensuales que se han usado en esta asignatura
        evaluaciones.forEach((ev) => {
          if (
            ev.asignatura.id_asignatura === grupo.asignatura.id_asignatura &&
            ev.mes !== null &&
            ev.mes !== undefined
          ) {
            tiposDelContexto.add(ev.tipoEvaluacion.id_tipo_evaluacion);
            tiposVistos.set(
              ev.tipoEvaluacion.id_tipo_evaluacion,
              ev.tipoEvaluacion
            );
          }
        });

        mes.tiposFaltantes = Array.from(tiposVistos.values()).filter(
          (tipo) => !tiposExistentes.has(tipo.id_tipo_evaluacion)
        );
      });

      // Convertir a array y ordenar por mes
      grupo.evaluacionesMensuales = Array.from(mesesMap.values()).sort(
        (a, b) => (b.mes || 0) - (a.mes || 0)
      );

      // 3. Calcular porcentajes para evaluaciones trimestrales
      const tiposExistentesTrim = new Map<number, Evaluacion>();
      let porcentajeTotalTrim = 0;

      grupo.evaluacionesTrimestrales.forEach((ev) => {
        tiposExistentesTrim.set(ev.tipoEvaluacion.id_tipo_evaluacion, ev);
        porcentajeTotalTrim += ev.tipoEvaluacion.porcentaje;
      });

      grupo.porcentajeTotalTrimestral = porcentajeTotalTrim;

      // Encontrar tipos faltantes trimestrales
      const tiposDelContextoTrim = new Map<number, TipoEvaluacion>();

      evaluaciones.forEach((ev) => {
        if (
          ev.asignatura.id_asignatura === grupo.asignatura.id_asignatura &&
          ev.trimestre === grupo.trimestre &&
          ev.mes === null
        ) {
          tiposDelContextoTrim.set(
            ev.tipoEvaluacion.id_tipo_evaluacion,
            ev.tipoEvaluacion
          );
        }
      });

      grupo.tiposFaltantesTrimestral = Array.from(
        tiposDelContextoTrim.values()
      ).filter((tipo) => !tiposExistentesTrim.has(tipo.id_tipo_evaluacion));

      // 4. Verificar si está completo
      // Para BASICA: Debe tener los 3 meses del trimestre completos (cada uno al 35%) + trimestrales al 65%
      // Para BACHILLERATO: Solo verificar que trimestrales estén al 100%

      let estaCompletoMensuales = true;

      if (grupo.trimestre) {
        // BASICA - Verificar que TODOS los 3 meses del trimestre estén completos
        const mesesDelTrimestre =
          grupo.trimestre === 1
            ? [2, 3, 4] // Febrero, Marzo, Abril
            : grupo.trimestre === 2
              ? [5, 6, 7] // Mayo, Junio, Julio
              : [8, 9, 10]; // Agosto, Septiembre, Octubre

        // Verificar que todos los meses existan y estén completos
        estaCompletoMensuales = mesesDelTrimestre.every((numMes) => {
          const mesEncontrado = grupo.evaluacionesMensuales.find(
            (m) => m.mes === numMes
          );
          return mesEncontrado && mesEncontrado.estaCompleto;
        });
      }

      // El trimestre está completo si:
      // - Las evaluaciones mensuales están completas (para BASICA) o no hay trimestre (BACHILLERATO)
      // - Las evaluaciones trimestrales están completas (65% para BASICA, 100% para BACHILLERATO)
      const porcentajeEsperadoTrimestral = grupo.trimestre ? 65 : 100;
      const estaCompletoTrimestrales =
        Math.abs(porcentajeTotalTrim - porcentajeEsperadoTrimestral) < 0.01;

      grupo.estaCompleto = estaCompletoMensuales && estaCompletoTrimestrales;
    });

    return Array.from(grupos.values())
      .filter((grupo) => {
        // Aplicar filtro de asignatura
        const matchesAsignatura =
          filterAsignatura === 'todas' ||
          grupo.asignatura.id_asignatura.toString() === filterAsignatura;

        // Aplicar filtro de trimestre/periodo
        const matchesTrimestre =
          filterTrimestre === 'todos' ||
          (grupo.trimestre && grupo.trimestre.toString() === filterTrimestre) ||
          (grupo.periodo && grupo.periodo.toString() === filterTrimestre);

        return matchesAsignatura && matchesTrimestre;
      })
      .sort((a, b) => {
        if (a.asignatura.nombre !== b.asignatura.nombre) {
          return a.asignatura.nombre.localeCompare(b.asignatura.nombre);
        }
        if ((a.trimestre || 0) !== (b.trimestre || 0)) {
          return (b.trimestre || 0) - (a.trimestre || 0);
        }
        return (b.periodo || 0) - (a.periodo || 0);
      });
  };

  const grupos = agruparEvaluaciones();

  // Detectar si el orientador tiene asignaturas de bachillerato o básica
  const tieneAsignaturasBachillerato = asignaturas.some((a) =>
    a.curso?.gradoAcademico?.nombre.toLowerCase().includes('bachillerato')
  );
  const tieneAsignaturasBasica = asignaturas.some(
    (a) =>
      !a.curso?.gradoAcademico?.nombre.toLowerCase().includes('bachillerato')
  );

  // Abrir diálogo con datos precargados (desde botón en tarjeta)
  const handleOpenAddDialogWithData = (
    asignatura: number,
    trimestre: number | null,
    periodo: number | null,
    mes: number | null
  ) => {
    setNuevaEvaluacion({
      nombre: '',
      puntaje_maximo: 10,
      puntaje_minimo: 0,
      id_tipo_evaluacion: 0,
      id_asignatura: asignatura,
      trimestre: trimestre,
      periodo: periodo,
      mes: mes,
    });
    setIsAddDialogOpen(true);
  };

  // Guardar nueva evaluación
  const handleSaveEvaluacion = async () => {
    // Validaciones
    if (!nuevaEvaluacion.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (nuevaEvaluacion.id_asignatura === 0) {
      toast.error('Debe seleccionar una asignatura');
      return;
    }

    if (nuevaEvaluacion.id_tipo_evaluacion === 0) {
      toast.error('Debe seleccionar un tipo de evaluación');
      return;
    }

    if (
      nuevaEvaluacion.trimestre === null &&
      nuevaEvaluacion.periodo === null
    ) {
      toast.error('Debe seleccionar un trimestre o periodo');
      return;
    }

    try {
      setSaving(true);

      // Guardar la posición actual del scroll
      const currentScrollPosition = window.scrollY;

      await evaluacionesService.create({
        nombre: nuevaEvaluacion.nombre,
        puntaje_maximo: nuevaEvaluacion.puntaje_maximo,
        puntaje_minimo: nuevaEvaluacion.puntaje_minimo,
        id_tipo_evaluacion: nuevaEvaluacion.id_tipo_evaluacion,
        id_asignatura: nuevaEvaluacion.id_asignatura,
        trimestre: nuevaEvaluacion.trimestre || undefined,
        periodo: nuevaEvaluacion.periodo || undefined,
        mes: nuevaEvaluacion.mes || undefined,
      });

      toast.success('Evaluación creada correctamente');
      await fetchEvaluaciones();
      setIsAddDialogOpen(false);

      // Restaurar la posición del scroll después de un pequeño delay
      setTimeout(() => {
        window.scrollTo({
          top: currentScrollPosition,
          behavior: 'smooth',
        });
      }, 100);
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message || 'Error al crear la evaluación.';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  // Determinar el tipo de evaluación según el grado académico
  const getAsignaturaSeleccionada = () => {
    return asignaturas.find(
      (a) => a.id_asignatura === nuevaEvaluacion.id_asignatura
    );
  };

  const getNivelAcademico = (): 'BASICA' | 'BACHILLERATO' | null => {
    const asignatura = getAsignaturaSeleccionada();
    if (!asignatura?.curso?.gradoAcademico?.nombre) return null;

    const nombreGrado = asignatura.curso.gradoAcademico.nombre.toLowerCase();

    // Bachillerato incluye: "Primer Año de Bachillerato", "Segundo Año de Bachillerato"
    if (nombreGrado.includes('bachillerato')) {
      return 'BACHILLERATO';
    }

    // Todo lo demás es Básica (Primaria y Secundaria)
    return 'BASICA';
  };

  // Confirmar eliminación
  const handleDeleteClick = (evaluacion: Evaluacion) => {
    setDeletingEvaluacion(evaluacion);
    setIsDeleteDialogOpen(true);
  };

  // Eliminar
  const handleDelete = async () => {
    if (!deletingEvaluacion) return;

    try {
      setDeleting(true);

      // Guardar la posición actual del scroll
      const currentScrollPosition = window.scrollY;

      await evaluacionesService.remove(deletingEvaluacion.id_evaluacion);
      toast.success('Evaluación eliminada correctamente');
      await fetchEvaluaciones();
      setIsDeleteDialogOpen(false);
      setDeletingEvaluacion(null);

      // Restaurar la posición del scroll después de un pequeño delay
      setTimeout(() => {
        window.scrollTo({
          top: currentScrollPosition,
          behavior: 'smooth',
        });
      }, 100);
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message || 'Error al eliminar la evaluación.';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setDeleting(false);
    }
  };

  // Estados de carga
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando evaluaciones...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <p className="text-red-600 font-medium">{error}</p>
        <Button
          onClick={fetchEvaluaciones}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  // Vista principal
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Evaluaciones
          </h1>
          <p className="text-gray-600">
            Gestiona evaluaciones por asignatura y trimestre/periodo
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Evaluaciones</p>
                <p className="text-2xl font-bold text-blue-600">
                  {evaluaciones.length}
                </p>
              </div>
              <ClipboardList className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Grupos Completos</p>
                <p className="text-2xl font-bold text-green-600">
                  {grupos.filter((g) => g.estaCompleto).length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Grupos Incompletos</p>
                <p className="text-2xl font-bold text-orange-600">
                  {grupos.filter((g) => !g.estaCompleto).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Asignaturas</p>
                <p className="text-2xl font-bold text-purple-600">
                  {asignaturas.length}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Select
              value={filterAsignatura}
              onValueChange={setFilterAsignatura}
            >
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Filtrar por asignatura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las asignaturas</SelectItem>
                {asignaturas.map((asignatura) => (
                  <SelectItem
                    key={asignatura.id_asignatura}
                    value={asignatura.id_asignatura.toString()}
                  >
                    {asignatura.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterTrimestre} onValueChange={setFilterTrimestre}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue
                  placeholder={
                    tieneAsignaturasBachillerato && !tieneAsignaturasBasica
                      ? 'Filtrar por periodo'
                      : tieneAsignaturasBasica && !tieneAsignaturasBachillerato
                        ? 'Filtrar por trimestre'
                        : 'Filtrar por trimestre/periodo'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">
                  {tieneAsignaturasBachillerato && !tieneAsignaturasBasica
                    ? 'Todos los periodos'
                    : tieneAsignaturasBasica && !tieneAsignaturasBachillerato
                      ? 'Todos los trimestres'
                      : 'Todos'}
                </SelectItem>
                {tieneAsignaturasBasica && (
                  <>
                    <SelectItem value="1">Trimestre 1</SelectItem>
                    <SelectItem value="2">Trimestre 2</SelectItem>
                    <SelectItem value="3">Trimestre 3</SelectItem>
                  </>
                )}
                {tieneAsignaturasBachillerato && (
                  <>
                    <SelectItem value="1">Periodo 1</SelectItem>
                    <SelectItem value="2">Periodo 2</SelectItem>
                    <SelectItem value="3">Periodo 3</SelectItem>
                    <SelectItem value="4">Periodo 4</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            <Select value={filterAnio} onValueChange={setFilterAnio}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los años</SelectItem>
                {aniosDisponibles.map((anio) => (
                  <SelectItem key={anio} value={anio}>
                    {anio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grupos de evaluaciones */}
      <div className="space-y-4">
        {grupos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="font-medium">No hay evaluaciones registradas</p>
              <p className="text-sm">
                Comienza agregando evaluaciones a tus asignaturas
              </p>
            </CardContent>
          </Card>
        ) : (
          grupos.map((grupo) => (
            <GrupoTrimestreCard
              key={`${grupo.asignatura.id_asignatura}-${grupo.trimestre || 'null'}-${grupo.periodo || 'null'}`}
              grupo={grupo}
              onDelete={handleDeleteClick}
              onAddEvaluacion={handleOpenAddDialogWithData}
              getNombreMes={getNombreMes}
            />
          ))
        )}
      </div>

      {/* Dialog para agregar evaluación */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {nuevaEvaluacion.id_asignatura > 0
                ? 'Agregar Evaluación Rápida'
                : 'Agregar Nueva Evaluación'}
            </DialogTitle>
            <DialogDescription>
              {nuevaEvaluacion.id_asignatura > 0
                ? 'Complete solo el tipo, nombre y puntaje de la evaluación'
                : 'Complete los datos de la nueva evaluación'}
            </DialogDescription>
          </DialogHeader>

          {/* Nota informativa según nivel académico */}
          {nuevaEvaluacion.id_asignatura > 0 && getNivelAcademico() && (
            <div
              className={`p-3 rounded-md text-sm ${
                getNivelAcademico() === 'BASICA'
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : 'bg-purple-50 text-purple-800 border border-purple-200'
              }`}
            >
              {getNivelAcademico() === 'BASICA' ? (
                <>
                  <strong>📚 Sistema BÁSICA (2 niveles):</strong>
                  <ul className="mt-1 ml-4 list-disc space-y-1">
                    <li>
                      Evaluaciones Mensuales: 35% del trimestre (normalizado a
                      100% internamente)
                    </li>
                    <li>Evaluaciones Trimestrales: 65% del trimestre</li>
                    <li>Total del trimestre: 100%</li>
                  </ul>
                </>
              ) : (
                <>
                  <strong>🎓 Sistema BACHILLERATO (1 nivel):</strong>
                  <ul className="mt-1 ml-4 list-disc space-y-1">
                    <li>Evaluaciones por Periodo: 100%</li>
                    <li>No hay evaluaciones mensuales</li>
                  </ul>
                </>
              )}
            </div>
          )}

          <div className="space-y-4 py-4">
            {/* Mostrar información precargada si existe */}
            {nuevaEvaluacion.id_asignatura > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">
                    {
                      asignaturas.find(
                        (a) => a.id_asignatura === nuevaEvaluacion.id_asignatura
                      )?.nombre
                    }
                  </span>
                </div>
                {nuevaEvaluacion.trimestre && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-800">
                      Trimestre {nuevaEvaluacion.trimestre}
                    </span>
                    {nuevaEvaluacion.mes && (
                      <span className="text-blue-600">
                        → {getNombreMes(nuevaEvaluacion.mes)} (Mensual 35%)
                      </span>
                    )}
                    {!nuevaEvaluacion.mes && (
                      <span className="text-blue-600">
                        → Evaluación Trimestral (65%)
                      </span>
                    )}
                  </div>
                )}
                {nuevaEvaluacion.periodo && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-800">
                      Periodo {nuevaEvaluacion.periodo} (100%)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Asignatura - Solo si no está precargada */}
            {nuevaEvaluacion.id_asignatura === 0 && (
              <div className="space-y-2">
                <Label htmlFor="asignatura">Asignatura *</Label>
                <Select
                  value={nuevaEvaluacion.id_asignatura.toString()}
                  onValueChange={(value) =>
                    setNuevaEvaluacion({
                      ...nuevaEvaluacion,
                      id_asignatura: parseInt(value),
                      id_tipo_evaluacion: 0, // Resetear tipo de evaluación
                      trimestre: null, // Resetear trimestre
                      periodo: null, // Resetear periodo
                      mes: null, // Resetear mes
                    })
                  }
                >
                  <SelectTrigger id="asignatura">
                    <SelectValue placeholder="Seleccione una asignatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {asignaturas.map((asignatura) => (
                      <SelectItem
                        key={asignatura.id_asignatura}
                        value={asignatura.id_asignatura.toString()}
                      >
                        {asignatura.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Trimestre o Periodo - Condicional según nivel académico */}
            {nuevaEvaluacion.id_asignatura > 0 && (
              <>
                {getNivelAcademico() === 'BASICA' ? (
                  /* BÁSICA - Mostrar solo Trimestres */
                  <div className="space-y-2">
                    <Label htmlFor="trimestre">Trimestre *</Label>
                    <Select
                      value={nuevaEvaluacion.trimestre?.toString() || ''}
                      onValueChange={(value) =>
                        setNuevaEvaluacion({
                          ...nuevaEvaluacion,
                          trimestre: value ? parseInt(value) : null,
                          periodo: null,
                        })
                      }
                    >
                      <SelectTrigger id="trimestre">
                        <SelectValue placeholder="Seleccione trimestre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Trimestre 1</SelectItem>
                        <SelectItem value="2">Trimestre 2</SelectItem>
                        <SelectItem value="3">Trimestre 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : getNivelAcademico() === 'BACHILLERATO' ? (
                  /* BACHILLERATO - Mostrar solo Periodos */
                  <div className="space-y-2">
                    <Label htmlFor="periodo">Periodo *</Label>
                    <Select
                      value={nuevaEvaluacion.periodo?.toString() || ''}
                      onValueChange={(value) =>
                        setNuevaEvaluacion({
                          ...nuevaEvaluacion,
                          periodo: value ? parseInt(value) : null,
                          trimestre: null,
                        })
                      }
                    >
                      <SelectTrigger id="periodo">
                        <SelectValue placeholder="Seleccione periodo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Periodo 1</SelectItem>
                        <SelectItem value="2">Periodo 2</SelectItem>
                        <SelectItem value="3">Periodo 3</SelectItem>
                        <SelectItem value="4">Periodo 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  /* Nivel académico no detectado - Mostrar Trimestre por defecto */
                  <div className="space-y-2">
                    <Label htmlFor="trimestre">Trimestre *</Label>
                    <Select
                      value={nuevaEvaluacion.trimestre?.toString() || ''}
                      onValueChange={(value) =>
                        setNuevaEvaluacion({
                          ...nuevaEvaluacion,
                          trimestre: value ? parseInt(value) : null,
                          periodo: null,
                        })
                      }
                    >
                      <SelectTrigger id="trimestre">
                        <SelectValue placeholder="Seleccione trimestre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Trimestre 1</SelectItem>
                        <SelectItem value="2">Trimestre 2</SelectItem>
                        <SelectItem value="3">Trimestre 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {!nuevaEvaluacion.id_asignatura && (
              <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-md">
                Seleccione una asignatura primero
              </div>
            )}

            {/* Mes (solo si hay trimestre Y es BÁSICA) */}
            {nuevaEvaluacion.trimestre && getNivelAcademico() === 'BASICA' && (
              <div className="space-y-2">
                <Label htmlFor="mes">Tipo de evaluación</Label>
                <Select
                  value={nuevaEvaluacion.mes?.toString() || 'none'}
                  onValueChange={(value) =>
                    setNuevaEvaluacion({
                      ...nuevaEvaluacion,
                      mes: value === 'none' ? null : parseInt(value),
                      id_tipo_evaluacion: 0, // Resetear tipo al cambiar mes/trimestral
                    })
                  }
                >
                  <SelectTrigger id="mes">
                    <SelectValue placeholder="Seleccione el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Trimestral (65%)</SelectItem>
                    {nuevaEvaluacion.trimestre === 1 && (
                      <>
                        <SelectItem value="2">
                          Febrero - Mensual (35%)
                        </SelectItem>
                        <SelectItem value="3">Marzo - Mensual (35%)</SelectItem>
                        <SelectItem value="4">Abril - Mensual (35%)</SelectItem>
                      </>
                    )}
                    {nuevaEvaluacion.trimestre === 2 && (
                      <>
                        <SelectItem value="5">Mayo - Mensual (35%)</SelectItem>
                        <SelectItem value="6">Junio - Mensual (35%)</SelectItem>
                        <SelectItem value="7">Julio - Mensual (35%)</SelectItem>
                      </>
                    )}
                    {nuevaEvaluacion.trimestre === 3 && (
                      <>
                        <SelectItem value="8">
                          Agosto - Mensual (35%)
                        </SelectItem>
                        <SelectItem value="9">
                          Septiembre - Mensual (35%)
                        </SelectItem>
                        <SelectItem value="10">
                          Octubre - Mensual (35%)
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {nuevaEvaluacion.mes
                    ? '📝 Evaluaciones mensuales: Laboratorio, Tarea, Revisión de Cuaderno'
                    : '📚 Evaluaciones trimestrales: Examen Trimestral, Actividad Integradora, Autoevaluación'}
                </p>
              </div>
            )}

            {/* Tipo de Evaluación */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Evaluación *</Label>
              <Select
                value={nuevaEvaluacion.id_tipo_evaluacion.toString()}
                onValueChange={(value) => {
                  const tipoSeleccionado = tiposEvaluacionFiltrados.find(
                    (t) => t.id_tipo_evaluacion === parseInt(value)
                  );

                  // Si NO hay mes (es trimestral), autocompletar nombre con el tipo
                  const nuevoNombre =
                    !nuevaEvaluacion.mes && tipoSeleccionado
                      ? tipoSeleccionado.nombre
                      : nuevaEvaluacion.nombre;

                  setNuevaEvaluacion({
                    ...nuevaEvaluacion,
                    id_tipo_evaluacion: parseInt(value),
                    nombre: nuevoNombre,
                  });
                }}
                disabled={nuevaEvaluacion.id_asignatura === 0 || loadingTipos}
              >
                <SelectTrigger id="tipo">
                  <SelectValue
                    placeholder={
                      nuevaEvaluacion.id_asignatura === 0
                        ? 'Seleccione primero una asignatura'
                        : loadingTipos
                          ? 'Cargando tipos...'
                          : 'Seleccione un tipo'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {!Array.isArray(tiposEvaluacionFiltrados) ||
                  tiposEvaluacionFiltrados.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      {loadingTipos
                        ? 'Cargando...'
                        : 'No hay tipos de evaluación disponibles'}
                    </div>
                  ) : (
                    tiposEvaluacionFiltrados.map((tipo) => (
                      <SelectItem
                        key={tipo.id_tipo_evaluacion}
                        value={tipo.id_tipo_evaluacion.toString()}
                      >
                        {tipo.nombre} ({tipo.porcentaje}%)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre de la Evaluación{' '}
                {nuevaEvaluacion.mes ? '*' : '(Autocompletado)'}
              </Label>
              <Input
                id="nombre"
                placeholder={
                  nuevaEvaluacion.mes
                    ? 'Ej: Tarea 1, Laboratorio 2, etc.'
                    : 'Se usará el nombre del tipo de evaluación'
                }
                value={nuevaEvaluacion.nombre}
                onChange={(e) =>
                  setNuevaEvaluacion({
                    ...nuevaEvaluacion,
                    nombre: e.target.value,
                  })
                }
                disabled={!nuevaEvaluacion.mes}
                className={
                  !nuevaEvaluacion.mes ? 'bg-gray-100 cursor-not-allowed' : ''
                }
              />
              {!nuevaEvaluacion.mes && (
                <p className="text-xs text-blue-600">
                  💡 Para evaluaciones trimestrales, el nombre se toma
                  automáticamente del tipo
                </p>
              )}
            </div>

            {/* Puntajes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="puntaje_minimo">Puntaje Mínimo</Label>
                <Input
                  id="puntaje_minimo"
                  type="number"
                  step="0.1"
                  min="0"
                  value={nuevaEvaluacion.puntaje_minimo}
                  onChange={(e) =>
                    setNuevaEvaluacion({
                      ...nuevaEvaluacion,
                      puntaje_minimo: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="puntaje_maximo">Puntaje Máximo</Label>
                <Input
                  id="puntaje_maximo"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={nuevaEvaluacion.puntaje_maximo}
                  onChange={(e) =>
                    setNuevaEvaluacion({
                      ...nuevaEvaluacion,
                      puntaje_maximo: parseFloat(e.target.value) || 10,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEvaluacion}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la evaluación "
              {deletingEvaluacion?.nombre}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EvaluacionesModule;
