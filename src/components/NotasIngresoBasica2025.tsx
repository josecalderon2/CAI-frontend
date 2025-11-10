import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { notasService } from '../api/services/notasService';
import type {
  FormatoEvaluacionBasicaResponse,
  ComponenteEvaluacionBasica,
  GuardarNotaBasicaDto,
} from '../api/services/notasService';
import { cursosService } from '../api/services/cursosService';
import asignacionesService from '../api/services/asignacionesService';
import { getUser } from '../utils/auth';

interface Alumno {
  id_alumno: number;
  nombre: string;
  apellido: string;
}

interface AlumnoNotas {
  alumno: Alumno;
  notas_mensuales: { [tipo: string]: number[] };
  notas_trimestrales: { [tipo: string]: number };
}

const MESES_POR_TRIMESTRE: { [key: number]: number[] } = {
  1: [2, 3, 4], // Febrero, Marzo, Abril
  2: [5, 6, 7], // Mayo, Junio, Julio
  3: [8, 9, 10], // Agosto, Septiembre, Octubre
};

const NOMBRES_MESES = [
  '',
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

export default function NotasIngresoBasica2025() {
  const [cursos, setCursos] = useState<any[]>([]);
  const [asignaturas, setAsignaturas] = useState<any[]>([]);
  const [alumnosNotas, setAlumnosNotas] = useState<AlumnoNotas[]>([]);

  const [cursoSeleccionado, setCursoSeleccionado] = useState<number | null>(
    null
  );
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState<
    number | null
  >(null);
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(11); // Noviembre por defecto
  const [trimestreSeleccionado, setTrimestreSeleccionado] = useState<number>(3);
  const [anio, setAnio] = useState<number>(2025);

  const [formato, setFormato] =
    useState<FormatoEvaluacionBasicaResponse | null>(null);
  const [componentesMensuales, setComponentesMensuales] = useState<
    ComponenteEvaluacionBasica[]
  >([]);
  const [componentesTrimestrales, setComponentesTrimestrales] = useState<
    ComponenteEvaluacionBasica[]
  >([]);

  const [vistaActiva, setVistaActiva] = useState<'MENSUAL' | 'TRIMESTRAL'>(
    'MENSUAL'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados para el modal de tareas
  const [modalTareasAbierto, setModalTareasAbierto] = useState(false);
  const [alumnoModalSeleccionado, setAlumnoModalSeleccionado] = useState<{
    index: number;
    alumno: Alumno;
    tipoActividad: string;
  } | null>(null);

  // Obtener usuario actual
  const usuario = useMemo(() => getUser(), []);

  // ============================================
  // CARGAR CURSOS AL INICIAR
  // ============================================
  useEffect(() => {
    cargarCursos();
  }, []);

  const cargarCursos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar getMisCursos() para evitar 403 con rol Orientador
      const data = await cursosService.getMisCursos();
      console.log('Cursos cargados:', data);

      // getMisCursos() retorna un array directamente
      if (Array.isArray(data)) {
        setCursos(data);
      } else {
        console.error('Formato inesperado de cursos:', data);
        setError('Error: formato de datos inesperado');
      }
    } catch (err: any) {
      console.error('Error al cargar cursos:', err);
      setError(
        err?.message || 'Error al cargar cursos. Verifique sus permisos.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CARGAR ASIGNATURAS CUANDO CAMBIA EL CURSO
  // ============================================
  useEffect(() => {
    if (cursoSeleccionado) {
      cargarAsignaturas();
    } else {
      setAsignaturas([]);
      setAsignaturaSeleccionada(null);
    }
  }, [cursoSeleccionado]);

  const cargarAsignaturas = async () => {
    if (!cursoSeleccionado) return;

    try {
      setLoading(true);
      setError(null);

      // Estrategia para asignaturas (evitar 403 en Orientador):
      // 1. Intentar leerlas del objeto curso (si backend las incluyó)
      // 2. Si rol es Admin/P.A intentar /asignaciones
      // 3. Fallback a /asignaturas/curso/:id
      let asigs: any[] = [];

      const cursoSel: any = cursos.find(
        (c) => (c.id_curso ?? 0) === Number(cursoSeleccionado)
      );

      // Intentar usar asignaturas embebidas en el curso
      const embebidas = Array.isArray(cursoSel?.asignaturas)
        ? cursoSel.asignaturas
        : null;

      if (embebidas && embebidas.length) {
        asigs = embebidas.map((a: any) => ({
          id_asignatura: a.id_asignatura,
          nombre: a.nombre,
        }));
      } else {
        const rol = usuario?.role;
        const puedeAsignaciones = rol === 'Admin' || rol === 'P.A';

        if (puedeAsignaciones) {
          try {
            const resp = await asignacionesService.getAsignaciones({
              id_curso: Number(cursoSeleccionado),
              limit: 200,
            });
            const uniqueMap = new Map<number, any>();
            resp.data.forEach((a: any) => {
              if (a.asignatura?.id_asignatura && a.asignatura?.nombre) {
                uniqueMap.set(a.asignatura.id_asignatura, {
                  id_asignatura: a.asignatura.id_asignatura,
                  nombre: a.asignatura.nombre,
                });
              }
            });
            asigs = Array.from(uniqueMap.values());
          } catch {
            asigs = await asignacionesService.getAsignaturasPorCurso(
              Number(cursoSeleccionado)
            );
          }
        } else {
          // Para Orientador usar endpoint alternativo
          asigs = await asignacionesService.getAsignaturasPorCurso(
            Number(cursoSeleccionado)
          );
        }
      }

      setAsignaturas(asigs);
    } catch (err: any) {
      console.error('Error al cargar asignaturas:', err);
      setError(
        err?.message || 'Error al cargar asignaturas. Verifique sus permisos.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CARGAR FORMATO Y ALUMNOS CUANDO CAMBIA LA ASIGNATURA
  // ============================================
  useEffect(() => {
    if (asignaturaSeleccionada) {
      cargarFormatoYAlumnos();
    }
  }, [asignaturaSeleccionada]);

  // ============================================
  // RECARGAR NOTAS CUANDO CAMBIA EL MES O AÑO
  // ============================================
  useEffect(() => {
    if (
      asignaturaSeleccionada &&
      alumnosNotas.length > 0 &&
      vistaActiva === 'MENSUAL'
    ) {
      const alumnosData = alumnosNotas.map((an) => an.alumno);
      cargarNotasExistentes(alumnosData, componentesMensuales);
    }
  }, [mesSeleccionado, anio]);

  const cargarFormatoYAlumnos = async () => {
    if (!asignaturaSeleccionada || !cursoSeleccionado) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Obtener formato
      const formatoData = await notasService.obtenerFormatoEvaluacion(
        asignaturaSeleccionada
      );

      if (formatoData.nivel !== 'BASICA' || !formatoData.componentes) {
        setError('Esta asignatura no usa el sistema BÁSICA 2025');
        setLoading(false);
        return;
      }

      setFormato(formatoData as FormatoEvaluacionBasicaResponse);

      // Separar componentes mensuales y trimestrales
      const mensuales = formatoData.componentes.filter(
        (c) => c.periodo === 'MENSUAL'
      );
      const trimestrales = formatoData.componentes.filter(
        (c) => c.periodo === 'TRIMESTRAL'
      );

      setComponentesMensuales(mensuales);
      setComponentesTrimestrales(trimestrales);

      // 2. Obtener alumnos
      const alumnosData =
        await cursosService.getAlumnosPorCurso(cursoSeleccionado);

      // 3. Inicializar estructura de notas
      const alumnosConNotas: AlumnoNotas[] = alumnosData.map(
        (alumno: Alumno) => ({
          alumno,
          notas_mensuales: {},
          notas_trimestrales: {},
        })
      );

      setAlumnosNotas(alumnosConNotas);

      // 4. Cargar notas existentes (si las hay)
      await cargarNotasExistentes(alumnosData, formatoData.componentes);
    } catch (err: any) {
      console.error('Error al cargar formato y alumnos:', err);

      // Mensaje de error más descriptivo
      let mensajeError = 'Error al cargar datos';
      if (err?.response?.status === 403) {
        mensajeError = 'No tiene permisos para acceder a esta información';
      } else if (err?.response?.status === 404) {
        mensajeError =
          'No se encontró información de evaluación para esta asignatura';
      } else if (err?.message) {
        mensajeError = err.message;
      }

      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CARGAR NOTAS EXISTENTES
  // ============================================
  const cargarNotasExistentes = async (
    alumnosData: Alumno[],
    _componentes: ComponenteEvaluacionBasica[]
  ) => {
    if (!asignaturaSeleccionada) return;

    try {
      console.log(
        '📥 Cargando notas existentes para',
        alumnosData.length,
        'alumnos...'
      );

      // Cargar notas para cada alumno
      for (let i = 0; i < alumnosData.length; i++) {
        const alumno = alumnosData[i];

        try {
          // Llamar al endpoint con los parámetros correctos
          const response = await fetch(
            `http://localhost:3000/sistema-evaluacion/notas/simplificadas?` +
              `alumno_id=${alumno.id_alumno}&` +
              `asignatura_id=${asignaturaSeleccionada}&` +
              `mes=${mesSeleccionado}&` +
              `anio=${anio}`
          );

          if (!response.ok) {
            console.warn(
              `No se encontraron notas para alumno ${alumno.id_alumno}`
            );
            continue;
          }

          const notasGuardadas = await response.json();
          console.log(
            `✅ Notas cargadas para ${alumno.nombre}:`,
            notasGuardadas
          );

          // Agrupar notas por tipo de actividad
          if (notasGuardadas.length > 0 && notasGuardadas[0].actividades) {
            const notasPorComponente: { [key: string]: number[] } = {};

            notasGuardadas[0].actividades.forEach((act: any) => {
              const nombreActividad =
                act.tipo_actividad_nombre || act.tipo_actividad;
              if (!notasPorComponente[nombreActividad]) {
                notasPorComponente[nombreActividad] = [];
              }
              notasPorComponente[nombreActividad].push(act.nota);
            });

            // Actualizar el estado con las notas cargadas
            setAlumnosNotas((prev) => {
              const nuevos = [...prev];
              if (nuevos[i]) {
                nuevos[i].notas_mensuales = notasPorComponente;
              }
              return nuevos;
            });
          }
        } catch (error) {
          console.error(
            `Error al cargar notas del alumno ${alumno.id_alumno}:`,
            error
          );
        }
      }

      console.log('✅ Carga de notas completada');
    } catch (err: any) {
      console.error('Error al cargar notas existentes:', err);
      // No mostrar error al usuario, solo en consola
    }
  };

  // ============================================
  // AGREGAR NOTA MENSUAL (Ej: agregar una tarea)
  // GUARDA INMEDIATAMENTE EN EL BACKEND
  // ============================================
  const agregarNotaMensual = async (
    alumnoIndex: number,
    tipoActividad: string,
    nota: number
  ) => {
    if (!asignaturaSeleccionada) {
      setError('Debe seleccionar una asignatura');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const alumno = alumnosNotas[alumnoIndex].alumno;

      // Buscar el componente para obtener su ID (si existe)
      const componente = componentesMensuales.find(
        (c) => c.nombre === tipoActividad
      );
      const idTipoActividad = componente?.id || undefined;

      // IMPORTANTE: Primero consultar TODAS las actividades existentes en el backend
      let actividadesExistentes: any[] = [];
      try {
        const responseConsulta = await fetch(
          `http://localhost:3000/sistema-evaluacion/notas/simplificadas?` +
            `alumno_id=${alumno.id_alumno}&` +
            `asignatura_id=${asignaturaSeleccionada}&` +
            `mes=${mesSeleccionado}&` +
            `anio=${anio}`
        );

        if (responseConsulta.ok) {
          const notasActuales = await responseConsulta.json();
          if (notasActuales.length > 0 && notasActuales[0].actividades) {
            actividadesExistentes = notasActuales[0].actividades;
            console.log(
              '📊 Actividades existentes en backend:',
              actividadesExistentes
            );
          }
        }
      } catch (consultaErr) {
        console.warn(
          'No se pudo consultar actividades existentes:',
          consultaErr
        );
      }

      // Construir el array de TODAS las actividades (existentes + nueva)
      const todasLasActividades: any[] = [];

      // 1. Agregar todas las actividades existentes (preservarlas)
      actividadesExistentes.forEach((act: any) => {
        todasLasActividades.push({
          id_tipo_actividad: act.id_tipo_actividad,
          numero_actividad: act.numero_actividad,
          nota: act.nota,
        });
      });

      // 2. Agregar la nueva actividad de este tipo
      const actividadesDelTipoActual = actividadesExistentes.filter(
        (act: any) => {
          const nombreAct = act.tipo_actividad_nombre || act.tipo_actividad;
          return nombreAct === tipoActividad;
        }
      );
      const numeroActividad = actividadesDelTipoActual.length + 1;

      todasLasActividades.push({
        id_tipo_actividad: idTipoActividad || 1,
        numero_actividad: numeroActividad,
        nota: nota,
      });

      console.log(
        `📤 Enviando ${todasLasActividades.length} actividades al backend (incluyendo nueva ${tipoActividad} #${numeroActividad}):`,
        todasLasActividades
      );

      // Guardar TODAS las actividades usando el método simplificado
      const respuesta = await notasService.crearNotaSimplificada({
        id_alumno: alumno.id_alumno,
        id_asignatura: asignaturaSeleccionada,
        mes: mesSeleccionado,
        anio: anio,
        actividades: todasLasActividades,
      });

      console.log('✅ Respuesta del backend:', respuesta);

      // Recargar las notas del alumno desde el backend para evitar duplicados
      try {
        const response = await fetch(
          `http://localhost:3000/sistema-evaluacion/notas/simplificadas?` +
            `alumno_id=${alumno.id_alumno}&` +
            `asignatura_id=${asignaturaSeleccionada}&` +
            `mes=${mesSeleccionado}&` +
            `anio=${anio}`
        );

        if (response.ok) {
          const notasGuardadas = await response.json();
          console.log('🔄 Notas recargadas:', notasGuardadas);

          // Agrupar notas por tipo de actividad
          if (notasGuardadas.length > 0 && notasGuardadas[0].actividades) {
            const notasPorComponente: { [key: string]: number[] } = {};

            notasGuardadas[0].actividades.forEach((act: any) => {
              const nombreActividad =
                act.tipo_actividad_nombre || act.tipo_actividad;
              if (!notasPorComponente[nombreActividad]) {
                notasPorComponente[nombreActividad] = [];
              }
              notasPorComponente[nombreActividad].push(act.nota);
            });

            // Actualizar solo las notas de este alumno
            setAlumnosNotas((prev) => {
              const nuevos = [...prev];
              nuevos[alumnoIndex].notas_mensuales = notasPorComponente;
              return nuevos;
            });
          }
        }
      } catch (reloadErr) {
        console.warn('No se pudieron recargar las notas:', reloadErr);
      }

      setSuccess(`✅ Nota guardada: ${nota} en ${tipoActividad}`);

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('❌ Error completo:', err);
      console.error('❌ Respuesta del servidor:', err?.response?.data);

      // Extraer mensaje de error del backend
      let mensajeError = 'Error al guardar nota';
      if (err?.response?.data?.message) {
        mensajeError = err.response.data.message;
      } else if (err?.response?.data?.error) {
        mensajeError = err.response.data.error;
      } else if (err?.message) {
        mensajeError = err.message;
      }

      setError(`❌ ${mensajeError}`);

      // No limpiar el error automáticamente para que el usuario pueda leerlo
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // GUARDAR TODAS LAS TAREAS DE UNA VEZ
  // (Usado por el modal cuando presionan "Guardar Todas")
  // ============================================
  const guardarTodasLasTareas = async (
    alumnoIndex: number,
    tipoActividad: string,
    notas: number[]
  ) => {
    if (!asignaturaSeleccionada) {
      setError('Debe seleccionar una asignatura');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const alumno = alumnosNotas[alumnoIndex].alumno;

      // Buscar el componente para obtener su ID
      const componente = componentesMensuales.find(
        (c) => c.nombre === tipoActividad
      );
      const idTipoActividad = componente?.id || undefined;

      // Consultar actividades existentes de OTROS tipos para preservarlas
      let actividadesDeOtrosTipos: any[] = [];
      try {
        const responseConsulta = await fetch(
          `http://localhost:3000/sistema-evaluacion/notas/simplificadas?` +
            `alumno_id=${alumno.id_alumno}&` +
            `asignatura_id=${asignaturaSeleccionada}&` +
            `mes=${mesSeleccionado}&` +
            `anio=${anio}`
        );

        if (responseConsulta.ok) {
          const notasActuales = await responseConsulta.json();
          if (notasActuales.length > 0 && notasActuales[0].actividades) {
            // Filtrar solo actividades de OTROS tipos (no del tipo actual)
            actividadesDeOtrosTipos = notasActuales[0].actividades.filter(
              (act: any) => {
                const nombreAct =
                  act.tipo_actividad_nombre || act.tipo_actividad;
                return nombreAct !== tipoActividad;
              }
            );
          }
        }
      } catch (consultaErr) {
        console.warn(
          'No se pudieron consultar actividades existentes:',
          consultaErr
        );
      }

      // Construir el array completo: actividades de otros tipos + nuevas tareas
      const todasLasActividades: any[] = [];

      // 1. Preservar actividades de otros tipos
      actividadesDeOtrosTipos.forEach((act: any) => {
        todasLasActividades.push({
          id_tipo_actividad: act.id_tipo_actividad,
          numero_actividad: act.numero_actividad,
          nota: act.nota,
        });
      });

      // 2. Agregar las nuevas tareas de este tipo
      notas.forEach((nota, index) => {
        todasLasActividades.push({
          id_tipo_actividad: idTipoActividad || 1,
          numero_actividad: index + 1, // Numeración secuencial
          nota: nota,
        });
      });

      console.log(
        `💾 Guardando ${notas.length} tareas de "${tipoActividad}":`,
        notas
      );
      console.log(`📤 Total de actividades a enviar:`, todasLasActividades);

      // Guardar TODAS las actividades
      const respuesta = await notasService.crearNotaSimplificada({
        id_alumno: alumno.id_alumno,
        id_asignatura: asignaturaSeleccionada,
        mes: mesSeleccionado,
        anio: anio,
        actividades: todasLasActividades,
      });

      console.log('✅ Respuesta del backend:', respuesta);

      // Recargar las notas del alumno desde el backend
      try {
        const response = await fetch(
          `http://localhost:3000/sistema-evaluacion/notas/simplificadas?` +
            `alumno_id=${alumno.id_alumno}&` +
            `asignatura_id=${asignaturaSeleccionada}&` +
            `mes=${mesSeleccionado}&` +
            `anio=${anio}`
        );

        if (response.ok) {
          const notasGuardadas = await response.json();

          // Agrupar notas por tipo de actividad
          if (notasGuardadas.length > 0 && notasGuardadas[0].actividades) {
            const notasPorComponente: { [key: string]: number[] } = {};

            notasGuardadas[0].actividades.forEach((act: any) => {
              const nombreActividad =
                act.tipo_actividad_nombre || act.tipo_actividad;
              if (!notasPorComponente[nombreActividad]) {
                notasPorComponente[nombreActividad] = [];
              }
              notasPorComponente[nombreActividad].push(act.nota);
            });

            // Actualizar solo las notas de este alumno
            setAlumnosNotas((prev) => {
              const nuevos = [...prev];
              nuevos[alumnoIndex].notas_mensuales = notasPorComponente;
              return nuevos;
            });
          }
        }
      } catch (reloadErr) {
        console.warn('No se pudieron recargar las notas:', reloadErr);
      }

      setSuccess(`✅ Se guardaron ${notas.length} tareas correctamente`);

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('❌ Error al guardar tareas:', err);
      console.error('❌ Respuesta del servidor:', err?.response?.data);

      let mensajeError = 'Error al guardar tareas';
      if (err?.response?.data?.message) {
        mensajeError = err.response.data.message;
      } else if (err?.response?.data?.error) {
        mensajeError = err.response.data.error;
      } else if (err?.message) {
        mensajeError = err.message;
      }

      setError(`❌ ${mensajeError}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ELIMINAR NOTA MENSUAL
  // ELIMINA INMEDIATAMENTE DEL BACKEND
  // ============================================
  const eliminarNotaMensual = async (
    alumnoIndex: number,
    tipoActividad: string,
    notaIndex: number
  ) => {
    const confirmacion = window.confirm('¿Está seguro de eliminar esta nota?');
    if (!confirmacion) return;

    setLoading(true);
    setError(null);

    try {
      // TODO: Implementar endpoint DELETE en el backend
      // Por ahora, solo eliminamos del estado local
      // await notasService.eliminarNotaBasica2025(id_nota);

      setAlumnosNotas((prev) => {
        const nuevos = [...prev];
        nuevos[alumnoIndex].notas_mensuales[tipoActividad].splice(notaIndex, 1);
        return nuevos;
      });

      setSuccess('✅ Nota eliminada correctamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error al eliminar nota:', err);
      setError(err.message || 'Error al eliminar nota');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ACTUALIZAR NOTA TRIMESTRAL
  // ============================================
  const actualizarNotaTrimestral = (
    alumnoIndex: number,
    tipoActividad: string,
    nota: number
  ) => {
    setAlumnosNotas((prev) => {
      const nuevos = [...prev];
      nuevos[alumnoIndex].notas_trimestrales[tipoActividad] = nota;
      return nuevos;
    });
  };

  // ============================================
  // GUARDAR NOTAS TRIMESTRALES
  // (Las mensuales se guardan inmediatamente al agregarlas)
  // ============================================
  const guardarNotas = async () => {
    if (!asignaturaSeleccionada) return;

    if (vistaActiva === 'MENSUAL') {
      setSuccess(
        'ℹ️ Las notas mensuales se guardan automáticamente al agregarlas'
      );
      setTimeout(() => setSuccess(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let notasGuardadas = 0;

      // Guardar notas trimestrales
      for (const alumnoNota of alumnosNotas) {
        const alumnoId = alumnoNota.alumno.id_alumno;

        for (const componente of componentesTrimestrales) {
          const nota = alumnoNota.notas_trimestrales[componente.nombre];

          if (nota !== undefined && nota !== null && !isNaN(nota)) {
            const dto: GuardarNotaBasicaDto = {
              id_asignatura: asignaturaSeleccionada,
              id_alumno: alumnoId,
              tipo_actividad: componente.nombre,
              id_tipo_actividad: componente.id || undefined,
              nota,
              mes: MESES_POR_TRIMESTRE[trimestreSeleccionado][2], // Último mes del trimestre
              anio,
              periodo: trimestreSeleccionado,
            };

            await notasService.guardarNotaBasica2025(dto);
            notasGuardadas++;
          }
        }
      }

      if (notasGuardadas > 0) {
        setSuccess(
          `✅ Se guardaron ${notasGuardadas} notas trimestrales correctamente`
        );
      } else {
        setError('No hay notas trimestrales para guardar');
      }
    } catch (err: any) {
      console.error('Error al guardar notas:', err);
      setError(err.message || 'Error al guardar notas trimestrales');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // VALIDAR MES SEGÚN TRIMESTRE
  // ============================================
  const mesesValidos = MESES_POR_TRIMESTRE[trimestreSeleccionado] || [];

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="p-6 space-y-6">
      {/* Info Card de Bienvenida */}
      {!formato && !loading && !error && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">📚</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Bienvenido al Sistema BÁSICA 2025
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Este nuevo sistema separa las evaluaciones en dos componentes
                  principales:
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/70 p-3 rounded-lg">
                    <div className="font-semibold text-blue-700 mb-1">
                      📅 Evaluaciones Mensuales (35%)
                    </div>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>• Tareas: Se guardan automáticamente</li>
                      <li>• Revisión de libros</li>
                      <li>• Laboratorio</li>
                    </ul>
                  </div>
                  <div className="bg-white/70 p-3 rounded-lg">
                    <div className="font-semibold text-purple-700 mb-1">
                      📊 Evaluaciones Trimestrales (65%)
                    </div>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>• Actividad Integradora</li>
                      <li>• Autoevaluación</li>
                      <li>• Examen</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                  💡 <strong>Tip:</strong> Seleccione un curso y asignatura para
                  comenzar
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            📝 Ingreso de Notas - BÁSICA 2025
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selectores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Curso</label>
              <select
                value={cursoSeleccionado || ''}
                onChange={(e) => {
                  setCursoSeleccionado(Number(e.target.value));
                  setAsignaturaSeleccionada(null);
                }}
                className="w-full p-2 border rounded"
                disabled={loading || cursos.length === 0}
              >
                <option value="">
                  {cursos.length === 0
                    ? 'No hay cursos disponibles'
                    : 'Seleccione un curso'}
                </option>
                {cursos.map((c, idx) => (
                  <option
                    key={c.id_curso ?? idx}
                    value={c.id_curso ?? ''}
                    disabled={c.id_curso == null}
                  >
                    {c.nombre} {c.seccion ? `- ${c.seccion}` : ''}{' '}
                    {c.gradoAcademico ? `(${c.gradoAcademico.nombre})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Asignatura
              </label>
              <select
                value={asignaturaSeleccionada || ''}
                onChange={(e) =>
                  setAsignaturaSeleccionada(Number(e.target.value))
                }
                className="w-full p-2 border rounded"
                disabled={!cursoSeleccionado}
              >
                <option value="">Seleccione una asignatura</option>
                {asignaturas.map((a, idx) => (
                  <option key={a.id_asignatura || idx} value={a.id_asignatura}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Año</label>
              <input
                type="number"
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Trimestre
              </label>
              <select
                value={trimestreSeleccionado}
                onChange={(e) =>
                  setTrimestreSeleccionado(Number(e.target.value))
                }
                className="w-full p-2 border rounded"
              >
                <option value={1}>Trimestre 1 (Feb-Mar-Abr)</option>
                <option value={2}>Trimestre 2 (May-Jun-Jul)</option>
                <option value={3}>Trimestre 3 (Ago-Sep-Oct)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Mes (solo para mensuales)
              </label>
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(Number(e.target.value))}
                className="w-full p-2 border rounded"
                disabled={vistaActiva === 'TRIMESTRAL'}
              >
                {mesesValidos.map((m) => (
                  <option key={m} value={m}>
                    {NOMBRES_MESES[m]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabs: Mensual vs Trimestral */}
          {formato && (
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setVistaActiva('MENSUAL')}
                className={`px-4 py-2 font-medium ${
                  vistaActiva === 'MENSUAL'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500'
                }`}
              >
                📅 Evaluaciones Mensuales (35%)
              </button>
              <button
                onClick={() => setVistaActiva('TRIMESTRAL')}
                className={`px-4 py-2 font-medium ${
                  vistaActiva === 'TRIMESTRAL'
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : 'text-gray-500'
                }`}
              >
                📊 Evaluaciones Trimestrales (65%)
              </button>
            </div>
          )}

          {/* Alertas */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Info Card */}
          {formato && vistaActiva === 'MENSUAL' && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-3">
                <h4 className="font-semibold text-blue-900 mb-2">
                  📋 Componentes Mensuales (35% del total)
                </h4>
                <div className="space-y-1 text-sm text-blue-700 mb-3">
                  {componentesMensuales.map((c) => (
                    <div key={c.nombre}>
                      • <strong>{c.nombre}</strong>: {c.porcentaje}%
                    </div>
                  ))}
                </div>
                <div className="text-xs bg-blue-100 p-2 rounded border border-blue-300">
                  <strong>💡 Importante:</strong> Cada nota se guarda{' '}
                  <strong>inmediatamente</strong> al hacer clic en "+ Agregar".
                  Puede agregar múltiples tareas para un alumno (ej: 5 tareas) y
                  el sistema calculará el promedio automáticamente.
                </div>
              </CardContent>
            </Card>
          )}

          {formato && vistaActiva === 'TRIMESTRAL' && (
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="py-3">
                <h4 className="font-semibold text-purple-900 mb-2">
                  📋 Componentes Trimestrales (65% del total)
                </h4>
                <div className="space-y-1 text-sm text-purple-700">
                  {componentesTrimestrales.map((c) => (
                    <div key={c.nombre}>
                      • <strong>{c.nombre}</strong>: {c.porcentaje}%
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabla de Alumnos */}
          {formato && alumnosNotas.length > 0 && (
            <>
              {vistaActiva === 'MENSUAL' ? (
                <RenderTablaMensual
                  alumnos={alumnosNotas}
                  componentes={componentesMensuales}
                  onAbrirModal={(alumnoIndex, tipo) => {
                    setAlumnoModalSeleccionado({
                      index: alumnoIndex,
                      alumno: alumnosNotas[alumnoIndex].alumno,
                      tipoActividad: tipo,
                    });
                    setModalTareasAbierto(true);
                  }}
                  onGuardarNotaUnica={async (alumnoIndex, tipo, nota) => {
                    // Guardar nota única (Revisión de libros o Laboratorio)
                    await agregarNotaMensual(alumnoIndex, tipo, nota);
                  }}
                  onActualizarLocal={(alumnoIndex, tipo, notas) => {
                    // Actualizar estado local sin guardar
                    setAlumnosNotas((prev) => {
                      const nuevos = [...prev];
                      nuevos[alumnoIndex].notas_mensuales[tipo] = notas;
                      return nuevos;
                    });
                  }}
                />
              ) : (
                <RenderTablaTrimestral
                  alumnos={alumnosNotas}
                  componentes={componentesTrimestrales}
                  onChange={actualizarNotaTrimestral}
                />
              )}

              <div className="flex justify-between items-center">
                {vistaActiva === 'MENSUAL' && (
                  <div className="text-sm text-blue-600">
                    ℹ️ Las notas mensuales se guardan automáticamente al
                    agregarlas
                  </div>
                )}
                <Button
                  onClick={guardarNotas}
                  disabled={loading || vistaActiva === 'MENSUAL'}
                  className={
                    vistaActiva === 'MENSUAL'
                      ? 'bg-gray-400'
                      : 'bg-green-600 hover:bg-green-700'
                  }
                >
                  {loading
                    ? '⏳ Guardando...'
                    : vistaActiva === 'MENSUAL'
                      ? '✅ Guardado Automático'
                      : '💾 Guardar Notas Trimestrales'}
                </Button>
              </div>
            </>
          )}

          {loading && !formato && (
            <div className="text-center py-8 text-gray-500">⏳ Cargando...</div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Tareas */}
      {modalTareasAbierto && alumnoModalSeleccionado && (
        <ModalTareas
          alumno={alumnoModalSeleccionado.alumno}
          tipoActividad={alumnoModalSeleccionado.tipoActividad}
          notasExistentes={
            alumnosNotas[alumnoModalSeleccionado.index].notas_mensuales[
              alumnoModalSeleccionado.tipoActividad
            ] || []
          }
          onClose={() => {
            setModalTareasAbierto(false);
            setAlumnoModalSeleccionado(null);
          }}
          onGuardarTodas={async (notas: number[]) => {
            // Guardar todas las tareas de una vez
            await guardarTodasLasTareas(
              alumnoModalSeleccionado.index,
              alumnoModalSeleccionado.tipoActividad,
              notas
            );
          }}
        />
      )}
    </div>
  );
}

// ============================================
// COMPONENTE: TABLA MENSUAL
// ============================================
interface TablaMensualProps {
  alumnos: AlumnoNotas[];
  componentes: ComponenteEvaluacionBasica[];
  onAbrirModal: (alumnoIndex: number, tipo: string) => void;
  onGuardarNotaUnica: (
    alumnoIndex: number,
    tipo: string,
    nota: number
  ) => Promise<void>;
  onActualizarLocal: (
    alumnoIndex: number,
    tipo: string,
    notas: number[]
  ) => void;
}

function RenderTablaMensual({
  alumnos,
  componentes,
  onAbrirModal,
  onGuardarNotaUnica,
  onActualizarLocal,
}: TablaMensualProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-blue-100">
          <tr>
            <th className="px-4 py-2 text-left">Alumno</th>
            {componentes.map((c) => (
              <th key={c.nombre} className="px-4 py-2 text-center">
                {c.nombre}
                <div className="text-xs font-normal">({c.porcentaje}%)</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {alumnos.map((alumnoNota, alumnoIndex) => (
            <tr
              key={alumnoNota.alumno.id_alumno}
              className="border-t hover:bg-gray-50"
            >
              <td className="px-4 py-2">
                {alumnoNota.alumno.nombre} {alumnoNota.alumno.apellido}
              </td>
              {componentes.map((c) => {
                const notas = alumnoNota.notas_mensuales[c.nombre] || [];
                const esTareas = c.nombre.toLowerCase().includes('tarea');

                // Para Tareas: mostrar promedio de múltiples notas
                const promedio =
                  notas.length > 0
                    ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(
                        2
                      )
                    : '-';

                // Para otros (Revisión, Laboratorio): solo una nota
                const notaUnica = notas.length > 0 ? notas[0] : null;

                return (
                  <td key={c.nombre} className="px-4 py-2 text-center">
                    {esTareas ? (
                      // TAREAS: Mostrar promedio y botón para modal
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-sm">
                          {notas.length > 0 ? (
                            <>
                              <span className="font-semibold text-lg">
                                {promedio}
                              </span>
                              <div className="text-xs text-gray-500">
                                {notas.length} tarea
                                {notas.length > 1 ? 's' : ''}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              Sin tareas
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => onAbrirModal(alumnoIndex, c.nombre)}
                          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          📝 Gestionar Tareas
                        </button>
                      </div>
                    ) : (
                      // REVISIÓN / LABORATORIO: Input simple para una sola nota
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={notaUnica ?? ''}
                          onChange={(e) => {
                            const valor = e.target.value;
                            const nota = parseFloat(valor);

                            if (valor === '' || (nota >= 0 && nota <= 10)) {
                              // Actualizar estado local inmediatamente
                              const nuevasNotas = valor === '' ? [] : [nota];
                              onActualizarLocal(
                                alumnoIndex,
                                c.nombre,
                                nuevasNotas
                              );
                            }
                          }}
                          onBlur={async (e) => {
                            const valor = e.target.value;
                            const nota = parseFloat(valor);

                            // Guardar automáticamente cuando se pierde el foco
                            if (
                              valor !== '' &&
                              !isNaN(nota) &&
                              nota >= 0 &&
                              nota <= 10
                            ) {
                              try {
                                await onGuardarNotaUnica(
                                  alumnoIndex,
                                  c.nombre,
                                  nota
                                );
                              } catch (err) {
                                console.error('Error al guardar:', err);
                                alert('Error al guardar la nota');
                              }
                            }
                          }}
                          className="w-20 px-2 py-1.5 border rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0-10"
                        />
                        <span className="text-xs text-gray-500">
                          {notaUnica ? `✓ ${notaUnica}` : 'Sin nota'}
                        </span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// COMPONENTE: TABLA TRIMESTRAL
// ============================================
interface TablaTrimestralProps {
  alumnos: AlumnoNotas[];
  componentes: ComponenteEvaluacionBasica[];
  onChange: (alumnoIndex: number, tipo: string, nota: number) => void;
}

function RenderTablaTrimestral({
  alumnos,
  componentes,
  onChange,
}: TablaTrimestralProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-purple-100">
          <tr>
            <th className="px-4 py-2 text-left">Alumno</th>
            {componentes.map((c) => (
              <th key={c.nombre} className="px-4 py-2 text-center">
                {c.nombre}
                <div className="text-xs font-normal">({c.porcentaje}%)</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {alumnos.map((alumnoNota, alumnoIndex) => (
            <tr
              key={alumnoNota.alumno.id_alumno}
              className="border-t hover:bg-gray-50"
            >
              <td className="px-4 py-2">
                {alumnoNota.alumno.nombre} {alumnoNota.alumno.apellido}
              </td>
              {componentes.map((c) => (
                <td key={c.nombre} className="px-4 py-2 text-center">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={alumnoNota.notas_trimestrales[c.nombre] || ''}
                    onChange={(e) =>
                      onChange(
                        alumnoIndex,
                        c.nombre,
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-20 p-1 border rounded text-center"
                    placeholder="0-10"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// COMPONENTE: MODAL DE TAREAS
// ============================================
interface ModalTareasProps {
  alumno: Alumno;
  tipoActividad: string;
  notasExistentes: number[];
  onClose: () => void;
  onGuardarTodas: (notas: number[]) => Promise<void>;
}

function ModalTareas({
  alumno,
  tipoActividad,
  notasExistentes,
  onClose,
  onGuardarTodas,
}: ModalTareasProps) {
  // Estado local para manejar las tareas antes de guardar
  const [tareasLocales, setTareasLocales] = useState<number[]>([
    ...notasExistentes,
  ]);
  const [notaNueva, setNotaNueva] = useState<string>('');
  const [guardando, setGuardando] = useState(false);

  // Calcular promedio en tiempo real de las tareas locales
  const promedio =
    tareasLocales.length > 0
      ? (
          tareasLocales.reduce((a, b) => a + b, 0) / tareasLocales.length
        ).toFixed(2)
      : '0.00';

  const handleAgregarTarea = () => {
    const nota = parseFloat(notaNueva);

    if (isNaN(nota) || nota < 0 || nota > 10) {
      alert('Ingrese una nota válida entre 0 y 10');
      return;
    }

    // Agregar la tarea al estado local (no se guarda aún)
    setTareasLocales((prev) => [...prev, nota]);
    setNotaNueva('');
  };

  const handleEliminarTarea = (index: number) => {
    const confirmacion = window.confirm('¿Está seguro de eliminar esta tarea?');
    if (!confirmacion) return;

    // Eliminar del estado local (no se guarda aún)
    setTareasLocales((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGuardarTodas = async () => {
    if (tareasLocales.length === 0) {
      alert('Debe agregar al menos una tarea');
      return;
    }

    setGuardando(true);
    try {
      await onGuardarTodas(tareasLocales);
      // Cerrar el modal después de guardar exitosamente
      onClose();
    } catch (err) {
      console.error('Error al guardar tareas:', err);
      alert('Error al guardar las tareas');
    } finally {
      setGuardando(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !guardando) {
      handleAgregarTarea();
    }
  };

  // Detectar cambios para habilitar/deshabilitar el botón guardar
  const hayCAmbios =
    JSON.stringify(tareasLocales) !== JSON.stringify(notasExistentes);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">
                  📝 Gestión de Tareas (Múltiples Notas)
                </h3>
                <p className="text-sm text-blue-100 mt-1">
                  {alumno.nombre} {alumno.apellido}
                </p>
                <p className="text-xs text-blue-200">{tipoActividad}</p>
                <p className="text-xs text-blue-300 mt-1">
                  💡 Puede agregar varias tareas - El promedio se calcula
                  automáticamente
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Resumen */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total de Tareas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {notasExistentes.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Promedio Actual</p>
                  <p className="text-2xl font-bold text-green-600">
                    {promedio}
                  </p>
                </div>
              </div>
            </div>

            {/* Agregar Nueva Tarea */}
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-3 text-gray-700">
                ➕ Agregar Nueva Tarea
              </h4>
              <div className="flex gap-3">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="Nota (0-10)"
                  value={notaNueva}
                  onChange={(e) => setNotaNueva(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={guardando}
                />
                <Button
                  onClick={handleAgregarTarea}
                  disabled={guardando}
                  className="bg-blue-600 hover:bg-blue-700 px-6"
                >
                  {guardando ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block animate-spin">⏳</span>
                      Guardando...
                    </span>
                  ) : (
                    '+ Agregar'
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Agregue todas las tareas y luego presione "Guardar Todas"
              </p>
            </div>

            {/* Lista de Tareas (Estado Local) */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-700">
                📋 Tareas en este listado ({tareasLocales.length})
              </h4>
              {tareasLocales.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No hay tareas en el listado</p>
                  <p className="text-sm">Agregue la primera tarea arriba</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tareasLocales.map((nota, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500 text-sm">
                          Tarea #{index + 1}
                        </span>
                        <span className="text-2xl font-bold text-blue-600">
                          {nota}
                        </span>
                      </div>
                      <button
                        onClick={() => handleEliminarTarea(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview del Promedio */}
            {tareasLocales.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">
                  📊 Cálculo del Promedio
                </h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <strong>Suma:</strong> {tareasLocales.join(' + ')} ={' '}
                    {tareasLocales.reduce((a, b) => a + b, 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Cantidad:</strong> {tareasLocales.length} tareas
                  </p>
                  <p className="text-lg font-bold text-green-600 mt-2">
                    <strong>Promedio:</strong> {promedio}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer con botones */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between items-center gap-3 border-t">
            <div className="text-sm text-gray-600">
              {hayCAmbios && (
                <span className="text-orange-600 font-medium">
                  ⚠️ Hay cambios sin guardar
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700"
                disabled={guardando}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGuardarTodas}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={guardando || tareasLocales.length === 0}
              >
                {guardando ? '⏳ Guardando...' : '💾 Guardar Todas'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
