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
  type ActividadEvaluacion 
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
}

interface NotaFormulario {
  actividades: ActividadFormulario[];
  examen_mensual: string;
}

const NotasModule: React.FC = () => {
  // Estados principales
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<number | null>(null);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<number | null>(null);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState<number | null>(null);
  const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(null);
  
  // Estados de formato de evaluación
  const [formatoEvaluacion, setFormatoEvaluacion] = useState<any>(null);
  
  // Estados de formulario
  const [notas, setNotas] = useState<NotaFormulario>({
    actividades: [],
    examen_mensual: '',
  });
  
  const [notaActual, setNotaActual] = useState<NotaMensualResponse | null>(null);
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
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
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
  }, [alumnoSeleccionado, asignaturaSeleccionada, mesActual, formatoEvaluacion]);

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
      const asignaturasData = await asignacionesService.getAsignaturasPorCurso(cursoId);
      setAsignaturas(asignaturasData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las asignaturas');
      console.error('Error cargando asignaturas:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarNotasExistentes = async () => {
    if (!alumnoSeleccionado || !asignaturaSeleccionada) return;

    try {
      setLoading(true);
      setError(null);
      
      const notasData = await notasService.getNotasMensuales({
        id_alumno: alumnoSeleccionado,
        id_asignatura: asignaturaSeleccionada,
        mes: mesActual,
        anio: anioActual,
      });

      if (notasData && notasData.length > 0) {
        const nota = notasData[0];
        setNotaActual(nota);
        setNotas({
          tarea_1: nota.tarea_1?.toString() || '',
          revision_libros_cuadernos: nota.revision_libros_cuadernos?.toString() || '',
          tarea_2: nota.tarea_2?.toString() || '',
          laboratorio_escrito: nota.laboratorio_escrito?.toString() || '',
          examen_mensual: nota.examen_mensual?.toString() || '',
        });
        setModoEdicion(false);
      } else {
        limpiarFormulario();
        setNotaActual(null);
        setModoEdicion(false);
      }
    } catch (err: any) {
      // Si el error es 404 o no hay notas, simplemente limpiamos el formulario
      // No mostramos error porque es normal que no haya notas aún
      console.log('No hay notas previas para este alumno y asignatura');
      limpiarFormulario();
      setNotaActual(null);
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setNotas({
      tarea_1: '',
      revision_libros_cuadernos: '',
      tarea_2: '',
      laboratorio_escrito: '',
      examen_mensual: '',
    });
  };

  const handleNotaChange = (campo: keyof NotaFormulario, valor: string) => {
    // Validar que sea un número válido entre 0 y 10
    if (valor === '') {
      setNotas(prev => ({ ...prev, [campo]: '' }));
      return;
    }

    const numero = parseFloat(valor);
    if (!isNaN(numero) && numero >= 0 && numero <= 10) {
      setNotas(prev => ({ ...prev, [campo]: valor }));
    }
  };

  const validarNotas = (): boolean => {
    // Al menos una nota debe estar ingresada
    const hayAlgunaNota = Object.values(notas).some(nota => nota !== '');
    
    if (!hayAlgunaNota) {
      setError('Debe ingresar al menos una nota');
      return false;
    }

    // Validar que las notas ingresadas estén en el rango correcto
    for (const [campo, valor] of Object.entries(notas)) {
      if (valor !== '') {
        const numero = parseFloat(valor);
        if (isNaN(numero) || numero < 0 || numero > 10) {
          setError(`La nota de ${campo.replace(/_/g, ' ')} debe estar entre 0 y 10`);
          return false;
        }
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

      // Convertir las notas a números, solo incluir las que tienen valores
      const notasDto: any = {};
      if (notas.tarea_1) notasDto.tarea_1 = parseFloat(notas.tarea_1);
      if (notas.revision_libros_cuadernos) notasDto.revision_libros_cuadernos = parseFloat(notas.revision_libros_cuadernos);
      if (notas.tarea_2) notasDto.tarea_2 = parseFloat(notas.tarea_2);
      if (notas.laboratorio_escrito) notasDto.laboratorio_escrito = parseFloat(notas.laboratorio_escrito);
      if (notas.examen_mensual) notasDto.examen_mensual = parseFloat(notas.examen_mensual);

      let resultado: NotaMensualResponse;

      if (notaActual?.id_nota_mensual) {
        // Actualizar nota existente
        resultado = await notasService.updateNotaMensual(notaActual.id_nota_mensual, notasDto);
        setSuccess('Notas actualizadas correctamente');
      } else {
        // Crear nueva nota
        const createDto: CreateNotaMensualDto = {
          id_alumno: alumnoSeleccionado,
          id_asignatura: asignaturaSeleccionada,
          mes: mesActual,
          anio: anioActual,
          ...notasDto,
        };
        
        console.log('Datos a enviar:', createDto);
        resultado = await notasService.createNotaMensual(createDto);
        setSuccess('Notas guardadas correctamente');
      }

      setNotaActual(resultado);
      setModoEdicion(false);

      // Actualizar el formulario con los datos guardados
      setNotas({
        tarea_1: resultado.tarea_1?.toString() || '',
        revision_libros_cuadernos: resultado.revision_libros_cuadernos?.toString() || '',
        tarea_2: resultado.tarea_2?.toString() || '',
        laboratorio_escrito: resultado.laboratorio_escrito?.toString() || '',
        examen_mensual: resultado.examen_mensual?.toString() || '',
      });

    } catch (err: any) {
      // Extraer mensaje de error más detallado del backend
      let errorMessage = 'Error al guardar las notas';
      
      if (err.response?.data?.message) {
        // Si el backend envía un mensaje específico
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
      setNotas({
        tarea_1: notaActual.tarea_1?.toString() || '',
        revision_libros_cuadernos: notaActual.revision_libros_cuadernos?.toString() || '',
        tarea_2: notaActual.tarea_2?.toString() || '',
        laboratorio_escrito: notaActual.laboratorio_escrito?.toString() || '',
        examen_mensual: notaActual.examen_mensual?.toString() || '',
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
            Registro de evaluaciones del mes de {nombresMeses[mesActual - 1]} {anioActual}
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
                  {curso.gradoAcademico ? ` (${curso.gradoAcademico.nombre})` : ''}
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
                  const value = e.target.value ? parseInt(e.target.value) : null;
                  setAsignaturaSeleccionada(value);
                }}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={loading || asignaturas.length === 0}
              >
                <option value="">-- Seleccione una asignatura --</option>
                {asignaturas.map((asignatura) => (
                  <option key={asignatura.id_asignatura} value={asignatura.id_asignatura}>
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
                  const value = e.target.value ? parseInt(e.target.value) : null;
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
      {alumnoSeleccionado && asignaturaSeleccionada && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Evaluaciones - {nombresMeses[mesActual - 1]} {anioActual}
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
            {/* Tarea 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tarea 1
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={notas.tarea_1}
                onChange={(e) => handleNotaChange('tarea_1', e.target.value)}
                disabled={!puedeEditar || loading}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="0.00 - 10.00"
              />
            </div>

            {/* Revisión de Libros y Cuadernos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Revisión de Libros y Cuadernos
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={notas.revision_libros_cuadernos}
                onChange={(e) => handleNotaChange('revision_libros_cuadernos', e.target.value)}
                disabled={!puedeEditar || loading}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="0.00 - 10.00"
              />
            </div>

            {/* Tarea 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tarea 2
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={notas.tarea_2}
                onChange={(e) => handleNotaChange('tarea_2', e.target.value)}
                disabled={!puedeEditar || loading}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="0.00 - 10.00"
              />
            </div>

            {/* Laboratorio Escrito */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Laboratorio Escrito
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={notas.laboratorio_escrito}
                onChange={(e) => handleNotaChange('laboratorio_escrito', e.target.value)}
                disabled={!puedeEditar || loading}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="0.00 - 10.00"
              />
            </div>

            {/* Examen Mensual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Examen Mensual
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={notas.examen_mensual}
                onChange={(e) => handleNotaChange('examen_mensual', e.target.value)}
                disabled={!puedeEditar || loading}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="0.00 - 10.00"
              />
            </div>

            {/* Promedio */}
            {notaActual?.promedio !== undefined && notaActual?.promedio !== null && (
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Promedio:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {notaActual.promedio.toFixed(2)}
                  </span>
                </div>
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
                    <Save className="h-4 w-4" />
                    {loading ? 'Guardando...' : 'Guardar Notas'}
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
    </div>
  );
};

export default NotasModule;
