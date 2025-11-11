import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  FileText,
  Search,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  Eye,
  BookOpen,
  Users,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner';
import { cursosService, type Curso } from '../api/services/cursosService';
import {
  adminConsultaNotasService,
  type EvaluacionesCursoResponse,
  type CalificacionesEvaluacionResponse,
  type PromediosCursoResponse,
} from '../api/services/adminConsultaNotasService';

type VistaActual = 'seleccion' | 'evaluaciones' | 'detalle' | 'promedios';

export function ConsultarEvaluacionesModule() {
  // Verificar permisos
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tienePermiso = user.role === 'Admin' || user.role === 'P.A';

  // Estados principales
  const [loading, setLoading] = useState(false);
  const [vistaActual, setVistaActual] = useState<VistaActual>('seleccion');

  // Filtros
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<number | null>(
    null
  );
  const [anioAcademico, setAnioAcademico] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [asignaturaFiltro, setAsignaturaFiltro] = useState<number | null>(null);

  // Datos de consultas
  const [datosEvaluaciones, setDatosEvaluaciones] =
    useState<EvaluacionesCursoResponse | null>(null);
  const [datosDetalle, setDatosDetalle] =
    useState<CalificacionesEvaluacionResponse | null>(null);
  const [datosPromedios, setDatosPromedios] =
    useState<PromediosCursoResponse | null>(null);

  useEffect(() => {
    if (!tienePermiso) {
      toast.error(
        'No tienes permisos para acceder a este módulo. Tu rol actual es: ' +
          user.role
      );
    } else {
      cargarCursos();
    }
  }, []);

  const cargarCursos = async () => {
    try {
      setLoading(true);
      const response = await cursosService.list({ activo: true });
      setCursos(response.items);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  };

  const handleConsultarEvaluaciones = async () => {
    if (!cursoSeleccionado) {
      toast.error('Debes seleccionar un curso');
      return;
    }

    try {
      setLoading(true);
      const datos = await adminConsultaNotasService.obtenerEvaluacionesCurso(
        cursoSeleccionado,
        anioAcademico,
        asignaturaFiltro || undefined
      );
      setDatosEvaluaciones(datos);
      setVistaActual('evaluaciones');
      toast.success('Evaluaciones cargadas exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalleEvaluacion = async (evaluacionId: number) => {
    try {
      setLoading(true);
      const datos =
        await adminConsultaNotasService.obtenerCalificacionesEvaluacion(
          evaluacionId,
          anioAcademico
        );
      setDatosDetalle(datos);
      setVistaActual('detalle');
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar detalle de evaluación');
    } finally {
      setLoading(false);
    }
  };

  const handleConsultarPromedios = async () => {
    if (!cursoSeleccionado) {
      toast.error('Debes seleccionar un curso');
      return;
    }

    try {
      setLoading(true);
      const datos = await adminConsultaNotasService.obtenerPromediosCurso(
        cursoSeleccionado,
        anioAcademico
      );
      setDatosPromedios(datos);
      setVistaActual('promedios');
      toast.success('Promedios cargados exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar promedios');
    } finally {
      setLoading(false);
    }
  };

  const volverASeleccion = () => {
    setVistaActual('seleccion');
    setDatosEvaluaciones(null);
    setDatosDetalle(null);
    setDatosPromedios(null);
  };

  // Verificar permisos
  if (!tienePermiso) {
    return (
      <div className="p-6">
        <Card className="border-red-500">
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                Acceso Denegado
              </h2>
              <p className="text-gray-700 mb-2">
                No tienes permisos para acceder a este módulo.
              </p>
              <p className="text-gray-600">
                Solo usuarios con rol <strong>Admin</strong> o{' '}
                <strong>Personal Administrativo</strong> pueden consultar
                evaluaciones.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Tu rol actual: <strong>{user.role || 'No definido'}</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && vistaActual === 'seleccion') {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando...</div>
        </div>
      </div>
    );
  }

  // Vista de Selección
  if (vistaActual === 'seleccion') {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Consultar Evaluaciones y Notas
          </h1>
          <p className="text-gray-600 mt-1">
            Consulta evaluaciones, calificaciones y promedios de cualquier curso
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="curso">
                  Curso <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={cursoSeleccionado?.toString() || ''}
                  onValueChange={(value) =>
                    setCursoSeleccionado(parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos.map((curso) => (
                      <SelectItem
                        key={curso.id_curso}
                        value={curso.id_curso!.toString()}
                      >
                        {curso.nombre}{' '}
                        {curso.seccion ? `- ${curso.seccion}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anio">
                  Año Académico <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="anio"
                  type="text"
                  value={anioAcademico}
                  onChange={(e) => setAnioAcademico(e.target.value)}
                  placeholder="2025"
                />
              </div>
            </div>

            {datosEvaluaciones && datosEvaluaciones.asignaturas.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="asignatura">Filtrar por Asignatura</Label>
                <Select
                  value={asignaturaFiltro?.toString() || 'todas'}
                  onValueChange={(value) =>
                    setAsignaturaFiltro(
                      value === 'todas' ? null : parseInt(value)
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las asignaturas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las asignaturas</SelectItem>
                    {datosEvaluaciones.asignaturas.map((asig) => (
                      <SelectItem
                        key={asig.asignatura.id}
                        value={asig.asignatura.id.toString()}
                      >
                        {asig.asignatura.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleConsultarEvaluaciones}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!cursoSeleccionado || loading}
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Ver Evaluaciones
              </Button>
              <Button
                onClick={handleConsultarPromedios}
                className="bg-green-600 hover:bg-green-700"
                disabled={!cursoSeleccionado || loading}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Ver Promedios
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tarjetas informativas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Evaluaciones
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    Consulta todas las evaluaciones y calificaciones
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Promedios
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    Revisa promedios finales del curso
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Estadísticas
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    Análisis detallado por evaluación
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Vista de Evaluaciones
  if (vistaActual === 'evaluaciones' && datosEvaluaciones) {
    return (
      <div className="p-6 space-y-6">
        {/* Header con breadcrumb */}
        <div className="space-y-4">
          <Button variant="outline" onClick={volverASeleccion} size="sm">
            ← Volver a búsqueda
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Evaluaciones del Curso
            </h1>
            <p className="text-gray-600 mt-1">
              {datosEvaluaciones.curso.nombre} -{' '}
              {datosEvaluaciones.curso.seccion} | Año{' '}
              {datosEvaluaciones.anioAcademico}
            </p>
          </div>
        </div>

        {/* Info del curso */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Alumnos
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {datosEvaluaciones.alumnos.length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Asignaturas
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {datosEvaluaciones.asignaturas.length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Evaluaciones Totales
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {datosEvaluaciones.asignaturas.reduce(
                      (sum, asig) => sum + asig.evaluaciones.length,
                      0
                    )}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <ClipboardList className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Evaluaciones por asignatura */}
        <div className="space-y-4">
          {datosEvaluaciones.asignaturas.map((asigData) => (
            <Card key={asigData.asignatura.id}>
              <CardHeader>
                <CardTitle>
                  {asigData.asignatura.nombre}
                  {asigData.asignatura.tipo && (
                    <Badge variant="outline" className="ml-2">
                      {asigData.asignatura.tipo}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {asigData.evaluaciones.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay evaluaciones registradas
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">Evaluación</th>
                          <th className="text-left py-2 px-3">Tipo</th>
                          <th className="text-center py-2 px-3">Periodo</th>
                          <th className="text-center py-2 px-3">Trimestre</th>
                          <th className="text-center py-2 px-3">Mes</th>
                          <th className="text-center py-2 px-3">Puntaje Máx</th>
                          <th className="text-center py-2 px-3">Calificados</th>
                          <th className="text-right py-2 px-3">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asigData.evaluaciones.map((evaluacion) => {
                          const calificados = evaluacion.notas.filter(
                            (n) => n.calificacion !== null
                          ).length;
                          const total = evaluacion.notas.length;

                          return (
                            <tr
                              key={evaluacion.id_evaluacion}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="py-2 px-3 font-medium">
                                {evaluacion.nombre}
                              </td>
                              <td className="py-2 px-3">
                                <Badge variant="outline">
                                  {evaluacion.tipo}
                                </Badge>
                              </td>
                              <td className="text-center py-2 px-3">
                                {evaluacion.periodo}
                              </td>
                              <td className="text-center py-2 px-3">
                                {evaluacion.trimestre || '-'}
                              </td>
                              <td className="text-center py-2 px-3">
                                {evaluacion.mes || '-'}
                              </td>
                              <td className="text-center py-2 px-3">
                                {evaluacion.puntajeMaximo}
                              </td>
                              <td className="text-center py-2 px-3">
                                <Badge
                                  className={
                                    calificados === total
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }
                                >
                                  {calificados}/{total}
                                </Badge>
                              </td>
                              <td className="text-right py-2 px-3">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleVerDetalleEvaluacion(
                                      evaluacion.id_evaluacion
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Vista de Detalle de Evaluación
  if (vistaActual === 'detalle' && datosDetalle) {
    const stats = datosDetalle.estadisticas;

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => setVistaActual('evaluaciones')}
            size="sm"
          >
            ← Volver a evaluaciones
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {datosDetalle.evaluacion.nombre}
            </h1>
            <p className="text-gray-600 mt-1">
              {datosDetalle.asignatura.nombre} | {datosDetalle.curso.nombre} -{' '}
              {datosDetalle.curso.seccion}
            </p>
          </div>
        </div>

        {/* Info de la evaluación */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Tipo</p>
              <p className="text-lg font-semibold">
                {datosDetalle.evaluacion.tipo}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Periodo</p>
              <p className="text-lg font-semibold">
                {datosDetalle.evaluacion.periodo}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Puntaje Máximo</p>
              <p className="text-lg font-semibold">
                {datosDetalle.evaluacion.puntajeMaximo}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Porcentaje</p>
              <p className="text-lg font-semibold">
                {datosDetalle.evaluacion.porcentaje}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas */}
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas del Grupo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {stats.totalAlumnos}
                </p>
                <p className="text-sm text-gray-600">Total Alumnos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {stats.alumnosCalificados}
                </p>
                <p className="text-sm text-gray-600">Calificados</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">
                  {stats.alumnosPendientes}
                </p>
                <p className="text-sm text-gray-600">Pendientes</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {stats.promedioGrupo?.toFixed(2) || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Promedio</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {stats.aprobados}
                </p>
                <p className="text-sm text-gray-600">Aprobados</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">
                  {stats.reprobados}
                </p>
                <p className="text-sm text-gray-600">Reprobados</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {stats.notaMaxima?.toFixed(2) || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Nota Máxima</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">
                  {stats.notaMinima?.toFixed(2) || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Nota Mínima</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de calificaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Calificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Alumno</th>
                    <th className="text-center py-3 px-4">Calificación</th>
                    <th className="text-center py-3 px-4">Estado</th>
                    <th className="text-left py-3 px-4">Fecha Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {datosDetalle.calificaciones.map((cal, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {cal.alumno.nombreCompleto ||
                          `${cal.alumno.nombre} ${cal.alumno.apellido}`}
                      </td>
                      <td className="text-center py-3 px-4 font-semibold">
                        {cal.calificacion !== null
                          ? cal.calificacion.toFixed(2)
                          : '-'}
                      </td>
                      <td className="text-center py-3 px-4">
                        {cal.calificacion !== null ? (
                          cal.aprobado ? (
                            <Badge className="bg-green-100 text-green-800">
                              Aprobado
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              Reprobado
                            </Badge>
                          )
                        ) : (
                          <Badge variant="outline">Pendiente</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {cal.fechaRegistro
                          ? new Date(cal.fechaRegistro).toLocaleDateString(
                              'es-SV'
                            )
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista de Promedios
  if (vistaActual === 'promedios' && datosPromedios) {
    const aprobados = datosPromedios.alumnos.filter(
      (a) => a.promedioGeneral?.estado === 'APROBADO'
    ).length;
    const reprobados = datosPromedios.alumnos.length - aprobados;
    const promedioGeneral =
      datosPromedios.alumnos.reduce(
        (sum, a) => sum + (a.promedioGeneral?.promedio || 0),
        0
      ) / datosPromedios.alumnos.length;

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="outline" onClick={volverASeleccion} size="sm">
            ← Volver a búsqueda
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Promedios del Curso
            </h1>
            <p className="text-gray-600 mt-1">
              {datosPromedios.curso.nombre} - {datosPromedios.curso.seccion} |
              Año {datosPromedios.anioAcademico}
            </p>
          </div>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {datosPromedios.alumnos.length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Total Alumnos</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{aprobados}</p>
                <p className="text-sm text-gray-600 mt-1">Aprobados</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{reprobados}</p>
                <p className="text-sm text-gray-600 mt-1">Reprobados</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {promedioGeneral.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 mt-1">Promedio General</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de promedios */}
        <Card>
          <CardHeader>
            <CardTitle>Promedios por Alumno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Alumno</th>
                    <th className="text-center py-3 px-4">Promedio General</th>
                    <th className="text-center py-3 px-4">Estado</th>
                    <th className="text-center py-3 px-4">
                      Asignaturas Reprobadas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {datosPromedios.alumnos.map((alumnoData, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {alumnoData.alumno.nombreCompleto ||
                          `${alumnoData.alumno.nombre} ${alumnoData.alumno.apellido}`}
                      </td>
                      <td className="text-center py-3 px-4 font-semibold">
                        {alumnoData.promedioGeneral
                          ? alumnoData.promedioGeneral.promedio.toFixed(2)
                          : '-'}
                      </td>
                      <td className="text-center py-3 px-4">
                        {alumnoData.promedioGeneral ? (
                          alumnoData.promedioGeneral.estado === 'APROBADO' ? (
                            <Badge className="bg-green-100 text-green-800">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Aprobado
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Reprobado
                            </Badge>
                          )
                        ) : (
                          <Badge variant="outline">Sin datos</Badge>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        {alumnoData.promedioGeneral ? (
                          <Badge
                            className={
                              alumnoData.promedioGeneral.asignaturasReprobadas >
                              0
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }
                          >
                            {alumnoData.promedioGeneral.asignaturasReprobadas}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Detalle por alumno (expandible) */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle por Asignatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {datosPromedios.alumnos.map((alumnoData, idx) => (
              <details key={idx} className="border rounded-lg p-4">
                <summary className="cursor-pointer font-semibold text-lg hover:text-blue-600">
                  {alumnoData.alumno.nombreCompleto ||
                    `${alumnoData.alumno.nombre} ${alumnoData.alumno.apellido}`}
                  {alumnoData.promedioGeneral && (
                    <span className="ml-2 text-sm text-gray-500">
                      Promedio: {alumnoData.promedioGeneral.promedio.toFixed(2)}
                    </span>
                  )}
                </summary>
                <div className="mt-4 overflow-x-auto">
                  {alumnoData.asignaturas.length === 0 ? (
                    <p className="text-gray-500">
                      No hay promedios de asignaturas
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">Asignatura</th>
                          <th className="text-center py-2 px-3">Promedio</th>
                          <th className="text-center py-2 px-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alumnoData.asignaturas.map((asig, asigIdx) => (
                          <tr key={asigIdx} className="border-b">
                            <td className="py-2 px-3">{asig.nombre}</td>
                            <td className="text-center py-2 px-3 font-semibold">
                              {asig.promedio.toFixed(2)}
                            </td>
                            <td className="text-center py-2 px-3">
                              {asig.aprobado ? (
                                <Badge className="bg-green-100 text-green-800">
                                  Aprobado
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">
                                  Reprobado
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </details>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
