import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { calificacionesService, type CreateCalificacionDTO } from '../api/services/calificacionesService';
import { evaluacionesService, type Evaluacion, type AlumnoConCalificacion } from '../api/services/evaluacionesService';

export function CalificacionesModule() {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState<string>('');
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<string>('');
  const [alumnos, setAlumnos] = useState<AlumnoConCalificacion[]>([]);
  const [totalAlumnos, setTotalAlumnos] = useState(0);
  const [alumnosCalificados, setAlumnosCalificados] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAlumno, setSavingAlumno] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [alumnosEnEdicion, setAlumnosEnEdicion] = useState<Set<number>>(new Set());
  
  // Map para guardar el estado de cada evaluación (total y calificados)
  const [evaluacionesEstado, setEvaluacionesEstado] = useState<Map<number, { total: number; calificados: number }>>(new Map());

  // Cargar evaluaciones del orientador y sus estados
  useEffect(() => {
    const fetchEvaluaciones = async () => {
      try {
        setLoading(true);
        const data = await evaluacionesService.findByMisAsignaturas();
        setEvaluaciones(data);
        
        // Cargar el estado de cada evaluación
        const estadosMap = new Map<number, { total: number; calificados: number }>();
        for (const evaluacion of data) {
          try {
            const estadoData = await evaluacionesService.getAlumnosConCalificaciones(evaluacion.id_evaluacion);
            estadosMap.set(evaluacion.id_evaluacion, {
              total: estadoData.total_alumnos,
              calificados: estadoData.alumnos_calificados
            });
          } catch (err) {
            console.error(`Error cargando estado de evaluación ${evaluacion.id_evaluacion}:`, err);
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
    `${alumno.nombre} ${alumno.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
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
    setAlumnosEnEdicion(prev => {
      const newSet = new Set(prev);
      newSet.add(idAlumno);
      return newSet;
    });
  };

  // Cancelar edición
  const handleCancelarEdicion = (idAlumno: number) => {
    setAlumnosEnEdicion(prev => {
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
    if (alumno.calificacion < evaluacion.puntaje_minimo || alumno.calificacion > evaluacion.puntaje_maximo) {
      toast.error(`La calificación debe estar entre ${evaluacion.puntaje_minimo} y ${evaluacion.puntaje_maximo}`);
      return;
    }

    try {
      setSavingAlumno(alumno.id_alumno);

      if (alumno.id_nota) {
        // Actualizar calificación existente
        await calificacionesService.update(alumno.id_nota, {
          calificacion: alumno.calificacion,
        });
        toast.success(`✅ Calificación de ${alumno.nombre} ${alumno.apellido} actualizada`);
      } else {
        // Crear nueva calificación
        const payload: CreateCalificacionDTO = {
          id_evaluacion: Number(evaluacionSeleccionada),
          id_alumno: alumno.id_alumno,
          calificacion: alumno.calificacion,
        };
        await calificacionesService.create(payload);
        toast.success(`✅ Calificación de ${alumno.nombre} ${alumno.apellido} guardada`);
      }

      // Recargar datos
      const data = await evaluacionesService.getAlumnosConCalificaciones(
        Number(evaluacionSeleccionada)
      );
      
      setAlumnos(data.alumnos);
      setTotalAlumnos(data.total_alumnos);
      setAlumnosCalificados(data.alumnos_calificados);
      
      // Quitar del modo edición
      setAlumnosEnEdicion(prev => {
        const newSet = new Set(prev);
        newSet.delete(alumno.id_alumno);
        return newSet;
      });
      
      // Actualizar el estado de la evaluación en el map
      setEvaluacionesEstado(prev => {
        const newMap = new Map(prev);
        newMap.set(Number(evaluacionSeleccionada), {
          total: data.total_alumnos,
          calificados: data.alumnos_calificados
        });
        return newMap;
      });

    } catch (err: any) {
      console.error('Error guardando calificación:', err);
      toast.error(err.response?.data?.message || 'Error al guardar la calificación');
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
        const debeGuardar = alumno.calificacion !== undefined && 
                           (!alumno.id_nota || alumnosEnEdicion.has(alumno.id_alumno));
        
        if (debeGuardar) {
          // Validar que esté en el rango 0-10
          if (alumno.calificacion! < 0 || alumno.calificacion! > 10) {
            toast.error(`La calificación de ${alumno.nombre} ${alumno.apellido} debe estar entre 0 y 10`);
            continue;
          }

          // Validar rango de la evaluación
          if (alumno.calificacion! < evaluacion.puntaje_minimo || alumno.calificacion! > evaluacion.puntaje_maximo) {
            toast.error(`La calificación de ${alumno.nombre} ${alumno.apellido} debe estar entre ${evaluacion.puntaje_minimo} y ${evaluacion.puntaje_maximo}`);
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
      if (creados > 0) mensaje.push(`${creados} calificación${creados > 1 ? 'es' : ''} creada${creados > 1 ? 's' : ''}`);
      if (actualizados > 0) mensaje.push(`${actualizados} calificación${actualizados > 1 ? 'es' : ''} actualizada${actualizados > 1 ? 's' : ''}`);
      
      if (mensaje.length === 0) {
        toast.info('No hay cambios para guardar');
        setSaving(false);
        return;
      }

      toast.success('✅ ' + mensaje.join(' y '));
      
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
      setEvaluacionesEstado(prev => {
        const newMap = new Map(prev);
        newMap.set(Number(evaluacionSeleccionada), {
          total: data.total_alumnos,
          calificados: data.alumnos_calificados
        });
        return newMap;
      });
      
    } catch (err: any) {
      console.error('Error guardando calificaciones:', err);
      const msg = err?.response?.data?.message || 'Error al guardar las calificaciones';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  // Función helper para obtener estado de evaluación
  const getEstadoEvaluacion = (idEvaluacion: number) => {
    const estado = evaluacionesEstado.get(idEvaluacion);
    if (!estado) return { estado: 'sin-datos', porcentaje: 0 };
    
    const porcentaje = estado.total > 0 ? Math.round((estado.calificados / estado.total) * 100) : 0;
    
    if (estado.calificados === 0) return { estado: 'no-calificado', porcentaje: 0 };
    if (estado.calificados === estado.total) return { estado: 'calificado', porcentaje: 100 };
    return { estado: 'parcial', porcentaje };
  };

  // Obtener lista única de asignaturas
  const asignaturasUnicas = evaluaciones.reduce((acc, evaluacion) => {
    const existe = acc.find(a => a.id_asignatura === evaluacion.asignatura.id_asignatura);
    if (!existe) {
      acc.push(evaluacion.asignatura);
    }
    return acc;
  }, [] as Array<{ id_asignatura: number; nombre: string }>);

  // Filtrar evaluaciones por asignatura seleccionada
  const evaluacionesFiltradas = asignaturaSeleccionada
    ? evaluaciones.filter(e => e.asignatura.id_asignatura.toString() === asignaturaSeleccionada)
    : evaluaciones;

  // Calcular estadísticas
  const stats = {
    total: totalAlumnos,
    conNota: alumnosCalificados,
    sinNota: totalAlumnos - alumnosCalificados,
    promedio: alumnosCalificados > 0
      ? (alumnos.reduce((sum, a) => sum + (a.calificacion || 0), 0) / alumnosCalificados).toFixed(2)
      : '0.00',
  };

  // Resetear evaluación cuando cambie la asignatura
  useEffect(() => {
    setEvaluacionSeleccionada('');
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selector de Asignatura */}
            <div>
              <Label>Asignatura</Label>
              <Select value={asignaturaSeleccionada} onValueChange={setAsignaturaSeleccionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una asignatura" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Seleccione una asignatura</SelectItem>
                  {asignaturasUnicas.map((asignatura) => (
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

            {/* Selector de Evaluación */}
            <div>
              <Label>Evaluación</Label>
            <Select 
              value={evaluacionSeleccionada} 
              onValueChange={setEvaluacionSeleccionada}
              disabled={!asignaturaSeleccionada || asignaturaSeleccionada === 'todas'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una evaluación" />
              </SelectTrigger>
              <SelectContent>
                {evaluacionesFiltradas.map((evaluacion) => {
                  const { estado, porcentaje } = getEstadoEvaluacion(evaluacion.id_evaluacion);
                  const estadoInfo = evaluacionesEstado.get(evaluacion.id_evaluacion);
                  
                  return (
                    <SelectItem
                      key={evaluacion.id_evaluacion}
                      value={evaluacion.id_evaluacion.toString()}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span>
                          {evaluacion.nombre} - {evaluacion.asignatura.nombre}
                        </span>
                        {estadoInfo && (
                          <span className="text-xs font-semibold">
                            {estado === 'calificado' && '✓ Calificado'}
                            {estado === 'no-calificado' && '✗ Sin calificar'}
                            {estado === 'parcial' && `${porcentaje}% calificado`}
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
                {evaluacionActual.tipoEvaluacion.nombre} ({evaluacionActual.tipoEvaluacion.porcentaje}%)
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <Award className="w-3 h-3 mr-1" />
                {evaluacionActual.puntaje_minimo} - {evaluacionActual.puntaje_maximo} pts
              </Badge>
              
              {(() => {
                const { estado, porcentaje } = getEstadoEvaluacion(evaluacionActual.id_evaluacion);
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
                    <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
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
                    <p className="text-2xl font-bold text-green-600">{stats.conNota}</p>
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
                    <p className="text-2xl font-bold text-orange-600">{stats.sinNota}</p>
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
                    <p className="text-2xl font-bold text-purple-600">{stats.promedio}</p>
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
                  <span className="ml-2 text-gray-600">Cargando alumnos...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Alumno</TableHead>
                      <TableHead className="w-48">Calificación</TableHead>
                      <TableHead className="w-32 text-center">Estado</TableHead>
                      <TableHead className="w-40 text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alumnosFiltrados.length > 0 ? (
                      alumnosFiltrados.map((alumno, index) => (
                        <TableRow key={alumno.id_alumno}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
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
                                handleCalificacionChange(alumno.id_alumno, e.target.value)
                              }
                              placeholder="0 - 10"
                              className="w-full"
                              disabled={alumno.tiene_calificacion && !alumnosEnEdicion.has(alumno.id_alumno)}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {alumno.tiene_calificacion ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Calificado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                No Calificado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Botón de Guardar individual */}
                              {(alumno.calificacion !== undefined && alumno.calificacion !== null) && (
                                (!alumno.tiene_calificacion || alumnosEnEdicion.has(alumno.id_alumno))
                              ) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleGuardarIndividual(alumno)}
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
                              {alumno.tiene_calificacion && (
                                alumnosEnEdicion.has(alumno.id_alumno) ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCancelarEdicion(alumno.id_alumno)}
                                    className="text-gray-600 hover:text-gray-900"
                                    title="Cancelar edición"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleHabilitarEdicion(alumno.id_alumno)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Editar calificación"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                )
                              )}
                              
                              {/* Placeholder cuando no hay acciones disponibles */}
                              {!alumno.tiene_calificacion && (alumno.calificacion === undefined || alumno.calificacion === null) && (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
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
    </div>
  );
}

export default CalificacionesModule;
