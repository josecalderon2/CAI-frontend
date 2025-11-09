import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { cursosService, type Curso } from '../api/services/cursosService';
import asignacionesService from '../api/services/asignacionesService';
import {
  notasService,
  type NotaMensualResponse,
  type CreateNotaSimplificadaDto,
  type ActividadEvaluacion,
  type FormatoEvaluacionResponse,
  type TipoActividad,
  type ComponenteEvaluacion,
} from '../api/services/notasService';
import {
  BookOpen,
  Save,
  Edit2,
  AlertCircle,
  CheckCircle,
  Calendar,
  Users,
  FileText,
  Loader2,
} from 'lucide-react';

interface Alumno {
  id_alumno: number;
  nombre: string;
  apellido: string;
  rut?: string;
}

interface Asignatura {
  id_asignatura: number;
  nombre: string;
  orden_en_reporte?: string | null;
}

interface ActividadFormulario {
  id_tipo_actividad: number;
  nombre: string;
  numero_actividad?: number;
  nota: string;
  categoria?: string; // Para agrupar en bachillerato
}

interface NotaFormulario {
  actividades: ActividadFormulario[];
  examen_mensual: string;
  examen_parcial: string; // Para bachillerato
}

const NotasModuleNew: React.FC = () => {
  // Estados principales
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<number | null>(
    null
  );
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<number | null>(
    null
  );
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState<
    number | null
  >(null);
  const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(null);

  // Estados de formato de evaluación
  const [formatoEvaluacion, setFormatoEvaluacion] =
    useState<FormatoEvaluacionResponse | null>(null);

  // Estados de formulario
  const [notas, setNotas] = useState<NotaFormulario>({
    actividades: [],
    examen_mensual: '',
    examen_parcial: '',
  });

  const [notaActual, setNotaActual] = useState<NotaMensualResponse | null>(
    null
  );
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Obtener mes y año actual
  const fechaActual = new Date();
  const mesRealActual = fechaActual.getMonth() + 1; // 1-12
  const anioActual = fechaActual.getFullYear();

  // Usar el mes seleccionado por el usuario o el mes actual
  const mesActual = mesSeleccionado || mesRealActual;

  const nombresMeses = [
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

  // Todos los meses están permitidos (1-12)
  const mesesPermitidos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Cargar cursos asignados al orientador al montar el componente
  useEffect(() => {
    cargarCursos();
  }, []);

  // Cargar alumnos cuando se selecciona un curso
  useEffect(() => {
    if (cursoSeleccionado) {
      cargarAlumnos(cursoSeleccionado);
      cargarAsignaturas(cursoSeleccionado);
    } else {
      setAlumnos([]);
      setAsignaturas([]);
      setAlumnoSeleccionado(null);
      setAsignaturaSeleccionada(null);
    }
  }, [cursoSeleccionado]);

  // Cargar formato de evaluación cuando se selecciona asignatura
  useEffect(() => {
    if (asignaturaSeleccionada) {
      cargarFormatoEvaluacion(asignaturaSeleccionada);
    } else {
      setFormatoEvaluacion(null);
      limpiarFormulario();
    }
  }, [asignaturaSeleccionada]);

  // Cargar notas cuando se selecciona alumno, asignatura o mes
  useEffect(() => {
    if (alumnoSeleccionado && asignaturaSeleccionada && formatoEvaluacion) {
      cargarNotasExistentes();
    } else if (formatoEvaluacion && !alumnoSeleccionado) {
      limpiarFormulario();
      setNotaActual(null);
    }
  }, [alumnoSeleccionado, asignaturaSeleccionada, mesActual]);

  const cargarCursos = async () => {
    try {
      setLoading(true);
      setError(null);
      const cursosData = await cursosService.getMisCursos();
      setCursos(cursosData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los cursos');
      console.error('Error cargando cursos:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarAlumnos = async (cursoId: number) => {
    try {
      setLoading(true);
      setError(null);
      const alumnosData = await cursosService.getAlumnosPorCurso(cursoId);
      setAlumnos(alumnosData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los alumnos');
      console.error('Error cargando alumnos:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarAsignaturas = async (cursoId: number) => {
    try {
      setLoading(true);
      setError(null);
      const asignaturasData =
        await asignacionesService.getAsignaturasPorCurso(cursoId);
      setAsignaturas(asignaturasData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las asignaturas');
      console.error('Error cargando asignaturas:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarFormatoEvaluacion = async (idAsignatura: number) => {
    try {
      setLoading(true);
      setError(null);
      const formato = await notasService.obtenerFormatoEvaluacion(idAsignatura);
      setFormatoEvaluacion(formato);

      // Inicializar actividades según el formato
      if (formato.nivel === 'BASICA') {
        // Para Básica: actividades continuas + examen mensual
        const actividadesIniciales: ActividadFormulario[] = (
          formato.actividades || []
        ).map((act: TipoActividad) => ({
          id_tipo_actividad: act.id_tipo_actividad,
          nombre: act.nombre,
          numero_actividad: act.numero_actividad,
          nota: '',
        }));
        setNotas({
          actividades: actividadesIniciales,
          examen_mensual: '',
          examen_parcial: '',
        });
      } else {
        // Para Bachillerato: 6 componentes con sus actividades
        const actividadesIniciales: ActividadFormulario[] = [];
        (formato.componentes || []).forEach((comp: ComponenteEvaluacion) => {
          comp.actividades.forEach((act: TipoActividad) => {
            actividadesIniciales.push({
              id_tipo_actividad: act.id_tipo_actividad,
              nombre: act.nombre,
              numero_actividad: act.numero_actividad,
              nota: '',
              categoria: comp.nombre, // Guardar la categoría para agrupar visualmente
            });
          });
        });
        setNotas({
          actividades: actividadesIniciales,
          examen_mensual: '',
          examen_parcial: '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar el formato de evaluación');
      console.error('Error cargando formato:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarNotasExistentes = async () => {
    if (!alumnoSeleccionado || !asignaturaSeleccionada) return;

    try {
      setLoading(true);
      setError(null);

      const notasData = await notasService.consultarNotasSimplificadas({
        id_alumno: alumnoSeleccionado,
        id_asignatura: asignaturaSeleccionada,
        mes: mesActual,
        anio: anioActual,
      });

      if (notasData && notasData.length > 0) {
        const nota = notasData[0];
        setNotaActual(nota);

        // Actualizar formulario con las notas existentes
        const actividadesActualizadas = notas.actividades.map((act) => {
          const actividadExistente = nota.actividades?.find(
            (a) =>
              a.id_tipo_actividad === act.id_tipo_actividad &&
              a.numero_actividad === act.numero_actividad
          );
          return {
            ...act,
            nota: actividadExistente?.nota?.toString() || '',
          };
        });

        setNotas({
          actividades: actividadesActualizadas,
          examen_mensual: nota.examen_mensual?.toString() || '',
          examen_parcial: (nota as any).examen_parcial?.toString() || '',
        });
        setModoEdicion(false);
      } else {
        limpiarFormulario();
        setNotaActual(null);
        setModoEdicion(false);
      }
    } catch (err: any) {
      console.log('No hay notas previas para este alumno y asignatura');
      limpiarFormulario();
      setNotaActual(null);
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setNotas((prev) => ({
      actividades: prev.actividades.map((act) => ({ ...act, nota: '' })),
      examen_mensual: '',
      examen_parcial: '',
    }));
  };

  const handleActividadChange = (index: number, valor: string) => {
    if (valor === '') {
      setNotas((prev) => ({
        ...prev,
        actividades: prev.actividades.map((act, i) =>
          i === index ? { ...act, nota: '' } : act
        ),
      }));
      return;
    }

    const numero = parseFloat(valor);
    if (!isNaN(numero) && numero >= 0 && numero <= 10) {
      setNotas((prev) => ({
        ...prev,
        actividades: prev.actividades.map((act, i) =>
          i === index ? { ...act, nota: valor } : act
        ),
      }));
    }
  };

  const handleExamenChange = (valor: string) => {
    if (valor === '') {
      setNotas((prev) => ({ ...prev, examen_mensual: '' }));
      return;
    }

    const numero = parseFloat(valor);
    if (!isNaN(numero) && numero >= 0 && numero <= 10) {
      setNotas((prev) => ({ ...prev, examen_mensual: valor }));
    }
  };

  const handleExamenParcialChange = (valor: string) => {
    if (valor === '') {
      setNotas((prev) => ({ ...prev, examen_parcial: '' }));
      return;
    }

    const numero = parseFloat(valor);
    if (!isNaN(numero) && numero >= 0 && numero <= 10) {
      setNotas((prev) => ({ ...prev, examen_parcial: valor }));
    }
  };

  const validarNotas = (): boolean => {
    // Al menos una nota debe estar ingresada
    const hayActividades = notas.actividades.some((act) => act.nota !== '');
    const hayExamen = notas.examen_mensual !== '';

    if (!hayActividades && !hayExamen) {
      setError('Debe ingresar al menos una nota');
      return false;
    }

    // Validar que las notas ingresadas estén en el rango correcto
    for (const actividad of notas.actividades) {
      if (actividad.nota !== '') {
        const numero = parseFloat(actividad.nota);
        if (isNaN(numero) || numero < 0 || numero > 10) {
          setError(`La nota de ${actividad.nombre} debe estar entre 0 y 10`);
          return false;
        }
      }
    }

    if (notas.examen_mensual !== '') {
      const numero = parseFloat(notas.examen_mensual);
      if (isNaN(numero) || numero < 0 || numero > 10) {
        setError('El examen mensual debe estar entre 0 y 10');
        return false;
      }
    }

    return true;
  };

  const handleGuardar = async () => {
    if (!alumnoSeleccionado || !asignaturaSeleccionada) {
      setError('Debe seleccionar un alumno y una asignatura');
      return;
    }

    if (!validarNotas()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Convertir actividades al formato requerido
      const actividadesDto: ActividadEvaluacion[] = notas.actividades
        .filter((act) => act.nota !== '')
        .map((act) => ({
          id_tipo_actividad: act.id_tipo_actividad,
          numero_actividad: act.numero_actividad,
          nota: parseFloat(act.nota),
        }));

      const createDto: CreateNotaSimplificadaDto = {
        id_alumno: alumnoSeleccionado,
        id_asignatura: asignaturaSeleccionada,
        mes: mesActual,
        anio: anioActual,
        actividades: actividadesDto,
        examen_mensual: notas.examen_mensual
          ? parseFloat(notas.examen_mensual)
          : undefined,
        examen_parcial: notas.examen_parcial
          ? parseFloat(notas.examen_parcial)
          : undefined,
      };

      console.log('Datos a enviar:', createDto);
      console.log('Nivel educativo:', formatoEvaluacion?.nivel);

      const resultado = await notasService.crearNotaSimplificada(createDto);
      setSuccess(
        notaActual
          ? 'Notas actualizadas correctamente'
          : 'Notas guardadas correctamente'
      );

      setNotaActual(resultado);
      setModoEdicion(false);

      // Actualizar el formulario con los datos guardados
      const actividadesActualizadas = notas.actividades.map((act) => {
        const actividadGuardada = resultado.actividades?.find(
          (a) =>
            a.id_tipo_actividad === act.id_tipo_actividad &&
            a.numero_actividad === act.numero_actividad
        );
        return {
          ...act,
          nota: actividadGuardada?.nota?.toString() || act.nota,
        };
      });

      setNotas({
        actividades: actividadesActualizadas,
        examen_mensual: resultado.examen_mensual?.toString() || '',
        examen_parcial: (resultado as any).examen_parcial?.toString() || '',
      });
    } catch (err: any) {
      let errorMessage = 'Error al guardar las notas';

      if (err.response?.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          errorMessage = err.response.data.message.join(', ');
        } else {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.error('Error guardando notas:', err);
      console.error('Detalles del error:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const habilitarEdicion = () => {
    setModoEdicion(true);
    setSuccess(null);
    setError(null);
  };

  const cancelarEdicion = () => {
    if (notaActual) {
      // Restaurar los valores originales
      const actividadesOriginales = notas.actividades.map((act) => {
        const actividadOriginal = notaActual.actividades?.find(
          (a) =>
            a.id_tipo_actividad === act.id_tipo_actividad &&
            a.numero_actividad === act.numero_actividad
        );
        return {
          ...act,
          nota: actividadOriginal?.nota?.toString() || '',
        };
      });

      setNotas({
        actividades: actividadesOriginales,
        examen_mensual: notaActual.examen_mensual?.toString() || '',
        examen_parcial: (notaActual as any).examen_parcial?.toString() || '',
      });
    } else {
      limpiarFormulario();
    }
    setModoEdicion(false);
    setError(null);
  };

  const puedeEditar = !notaActual || modoEdicion;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            Ingreso de Notas Mensuales
          </h1>
          <p className="text-gray-600 mt-1">
            Registro de evaluaciones del mes de {nombresMeses[mesActual - 1]}{' '}
            {anioActual}
          </p>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 text-green-700 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Selección de Curso y Mes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Seleccionar Curso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={cursoSeleccionado || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : null;
                setCursoSeleccionado(value);
                setAlumnoSeleccionado(null);
                setAsignaturaSeleccionada(null);
              }}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">-- Seleccione un curso --</option>
              {cursos.map((curso) => (
                <option key={curso.id_curso} value={curso.id_curso}>
                  {curso.nombre} {curso.seccion ? `- ${curso.seccion}` : ''}
                  {curso.gradoAcademico
                    ? ` (${curso.gradoAcademico.nombre})`
                    : ''}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Selector de Mes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={mesActual}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setMesSeleccionado(value);
              }}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {mesesPermitidos.map((mes) => (
                <option key={mes} value={mes}>
                  {nombresMeses[mes - 1]} {anioActual}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Seleccione el mes para ingresar o consultar notas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Selección de Asignatura y Alumno */}
      {cursoSeleccionado && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Selección de Asignatura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Asignatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={asignaturaSeleccionada || ''}
                onChange={(e) => {
                  const value = e.target.value
                    ? parseInt(e.target.value)
                    : null;
                  setAsignaturaSeleccionada(value);
                }}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={loading || asignaturas.length === 0}
              >
                <option value="">-- Seleccione una asignatura --</option>
                {asignaturas.map((asignatura) => (
                  <option
                    key={asignatura.id_asignatura}
                    value={asignatura.id_asignatura}
                  >
                    {asignatura.nombre}
                  </option>
                ))}
              </select>
              {asignaturas.length === 0 && cursoSeleccionado && (
                <p className="text-sm text-gray-500 mt-2">
                  No hay asignaturas disponibles para este curso
                </p>
              )}
            </CardContent>
          </Card>

          {/* Selección de Alumno */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Alumno
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={alumnoSeleccionado || ''}
                onChange={(e) => {
                  const value = e.target.value
                    ? parseInt(e.target.value)
                    : null;
                  setAlumnoSeleccionado(value);
                }}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={loading || alumnos.length === 0}
              >
                <option value="">-- Seleccione un alumno --</option>
                {alumnos.map((alumno) => (
                  <option key={alumno.id_alumno} value={alumno.id_alumno}>
                    {alumno.apellido}, {alumno.nombre}
                  </option>
                ))}
              </select>
              {alumnos.length === 0 && cursoSeleccionado && (
                <p className="text-sm text-gray-500 mt-2">
                  No hay alumnos matriculados en este curso
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Formulario de Notas */}
      {alumnoSeleccionado && asignaturaSeleccionada && formatoEvaluacion && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Evaluaciones - {nombresMeses[mesActual - 1]} {anioActual}
              {formatoEvaluacion && (
                <span className="text-sm font-normal text-gray-500">
                  (
                  {formatoEvaluacion.nivel === 'BASICA'
                    ? 'Educación Básica'
                    : 'Bachillerato'}
                  )
                </span>
              )}
            </CardTitle>
            {notaActual && !modoEdicion && (
              <Button
                onClick={habilitarEdicion}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Editar
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mostrar actividades según el nivel educativo */}
            {formatoEvaluacion.nivel === 'BASICA' ? (
              // EDUCACIÓN BÁSICA: Actividades continuas simples
              <>
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Actividades Continuas (70%)
                  </h3>
                  {notas.actividades.map((actividad, index) => (
                    <div
                      key={`${actividad.id_tipo_actividad}-${actividad.numero_actividad || 0}`}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {actividad.nombre}
                        {actividad.numero_actividad &&
                          ` ${actividad.numero_actividad}`}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={actividad.nota}
                        onChange={(e) =>
                          handleActividadChange(index, e.target.value)
                        }
                        disabled={!puedeEditar || loading}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="0.00 - 10.00"
                      />
                    </div>
                  ))}
                </div>

                {/* Examen Mensual para Básica (30%) */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Examen Mensual (30%)
                  </h3>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={notas.examen_mensual}
                    onChange={(e) => handleExamenChange(e.target.value)}
                    disabled={!puedeEditar || loading}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="0.00 - 10.00"
                  />
                </div>
              </>
            ) : (
              // BACHILLERATO: Componentes agrupados
              <>
                {/* Agrupar actividades por categoría */}
                {formatoEvaluacion.componentes?.map((componente, compIndex) => (
                  <div
                    key={compIndex}
                    className="space-y-3 p-4 bg-gray-50 rounded-lg"
                  >
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {componente.nombre} ({componente.porcentaje}%)
                    </h3>
                    {notas.actividades
                      .filter((act) => act.categoria === componente.nombre)
                      .map((actividad) => {
                        const actIndex = notas.actividades.findIndex(
                          (a) =>
                            a.id_tipo_actividad ===
                              actividad.id_tipo_actividad &&
                            a.numero_actividad === actividad.numero_actividad
                        );
                        return (
                          <div
                            key={`${actividad.id_tipo_actividad}-${actividad.numero_actividad || 0}`}
                          >
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {actividad.nombre}
                              {actividad.numero_actividad &&
                                ` ${actividad.numero_actividad}`}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="10"
                              value={actividad.nota}
                              onChange={(e) =>
                                handleActividadChange(actIndex, e.target.value)
                              }
                              disabled={!puedeEditar || loading}
                              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                              placeholder="0.00 - 10.00"
                            />
                          </div>
                        );
                      })}
                  </div>
                ))}

                {/* Examen Parcial para Bachillerato */}
                {formatoEvaluacion.incluye_examen_parcial && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-gray-700 mb-3">
                      Examen Parcial (25%)
                    </h3>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={notas.examen_parcial}
                      onChange={(e) =>
                        handleExamenParcialChange(e.target.value)
                      }
                      disabled={!puedeEditar || loading}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="0.00 - 10.00"
                    />
                  </div>
                )}

                {/* Examen de Periodo para Bachillerato */}
                {formatoEvaluacion.incluye_examen_periodo && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-gray-700 mb-3">
                      Examen de Periodo (30%)
                    </h3>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={notas.examen_mensual}
                      onChange={(e) => handleExamenChange(e.target.value)}
                      disabled={!puedeEditar || loading}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="0.00 - 10.00"
                    />
                  </div>
                )}
              </>
            )}

            {/* Promedio y Detalles */}
            {notaActual && (
              <div className="pt-4 border-t space-y-2">
                {notaActual.promedio_puro_actividades !== undefined && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Promedio Actividades:</span>
                    <span className="font-semibold">
                      {notaActual.promedio_puro_actividades?.toFixed(2)}
                    </span>
                  </div>
                )}
                {notaActual.nota_mensual !== undefined && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-lg font-semibold text-gray-700">
                      {formatoEvaluacion.nivel === 'BASICA'
                        ? 'Nota Mensual:'
                        : 'Nota del Periodo:'}
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {notaActual.nota_mensual?.toFixed(2)}
                    </span>
                  </div>
                )}
                {notaActual.aporte_al_trimestre !== undefined &&
                  formatoEvaluacion.nivel === 'BASICA' && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        Aporte al Trimestre:
                      </span>
                      <span className="font-semibold text-blue-600">
                        {notaActual.aporte_al_trimestre?.toFixed(2)}
                      </span>
                    </div>
                  )}
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              {puedeEditar && (
                <>
                  <Button
                    onClick={handleGuardar}
                    disabled={loading}
                    className="flex items-center gap-2 flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar Notas
                      </>
                    )}
                  </Button>
                  {modoEdicion && (
                    <Button
                      onClick={cancelarEdicion}
                      variant="outline"
                      disabled={loading}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no hay selección */}
      {!cursoSeleccionado && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Seleccione un curso para comenzar</p>
          </CardContent>
        </Card>
      )}

      {/* Loading spinner cuando se carga formato */}
      {loading && asignaturaSeleccionada && !formatoEvaluacion && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Loader2 className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-spin" />
            <p>Cargando formato de evaluación...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotasModuleNew;
