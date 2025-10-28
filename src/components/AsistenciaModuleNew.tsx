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
import { Alert, AlertDescription } from './ui/alert';
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
  TrendingDown,
  Download,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

// Importar servicios refactorizados
import {
  asistenciaService,
  conductaService,
  resumenService,
  type CreateAsistenciaDto,
  type BulkAsistenciaDto,
  type CreateConductaDto,
  type CreateInfraccionCatalogoDto,
  type InfraccionCatalogoResponse,
  type ResumenMensualDto,
  type ResumenMensualResponse,
  type ResumenTrimestralDto,
  type ResumenTrimestralResponse,
  type EstadoAsistencia,
  type CategoriaInfraccion,
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
  rut: string;
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
    'asistencia' | 'conducta' | 'resumen-mensual' | 'resumen-trimestral'
  >('asistencia');
  const [isLoading, setIsLoading] = useState(false);
  const [cursosAsignados, setCursosAsignados] = useState<CursoResponse[]>([]);

  // Estados para Toma de Asistencia
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [alumnosPorCurso, setAlumnosPorCurso] = useState<
    Record<string, AlumnoResponse[]>
  >({});
  const [asistenciaActual, setAsistenciaActual] = useState<
    Record<string, { estado: EstadoAsistencia; observacion: string }>
  >({});
  const [busquedaAlumno, setBusquedaAlumno] = useState('');

  // Estados para Conducta
  const [catalogoInfracciones, setCatalogoInfracciones] = useState<
    InfraccionCatalogoResponse[]
  >([]);
  const [modalInfraccion, setModalInfraccion] = useState(false);
  const [modalConducta, setModalConducta] = useState(false);
  const [nuevaInfraccion, setNuevaInfraccion] =
    useState<CreateInfraccionCatalogoDto>({
      categoria: 'MENOS_GRAVE',
      articulo: '',
      descripcion: '',
      puntos: 0,
    });
  const [nuevaConducta, setNuevaConducta] = useState<{
    id_alumno: string;
    id_infraccion: string;
    fecha: string;
    observacion: string;
  }>({
    id_alumno: '',
    id_infraccion: '',
    fecha: new Date().toISOString().split('T')[0],
    observacion: '',
  });

  // Estados para Resúmenes
  const [resumenMensual, setResumenMensual] =
    useState<ResumenMensualResponse | null>(null);
  const [resumenTrimestral, setResumenTrimestral] =
    useState<ResumenTrimestralResponse | null>(null);
  const [filtroResumenMensual, setFiltroResumenMensual] =
    useState<ResumenMensualDto>({
      id_curso: '',
      mes: new Date().getMonth() + 1,
      anio_academico: new Date().getFullYear().toString(),
    });
  const [filtroResumenTrimestral, setFiltroResumenTrimestral] =
    useState<ResumenTrimestralDto>({
      id_curso: '',
      trimestre: Math.floor(new Date().getMonth() / 3) + 1,
      anio_academico: new Date().getFullYear().toString(),
    });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
    if (activeTab === 'conducta') {
      cargarCatalogoInfracciones();
    }
  }, [user?.id, activeTab]);

  const cargarDatosIniciales = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      let cursosResponse: CursoResponse[] = [];
      let cursosRaw: any[] = [];
      let estrategiaUsada = '';

      // ESTRATEGIA 1: Intentar endpoint /cursos/asignados/:id
      try {
        console.log(`🔍 Buscando cursos para orientador ID: ${user.id}`);
        const cursos = await cursosService.findCursosAsignadosDocente(
          parseInt(user.id)
        );
        cursosRaw = Array.isArray(cursos) ? cursos : [];
        estrategiaUsada = 'Endpoint /cursos/asignados';
        console.log(
          `✅ ${estrategiaUsada}: ${cursosRaw.length} cursos encontrados`,
          cursosRaw
        );
      } catch (err: any) {
        console.warn(
          '❌ Endpoint /cursos/asignados no disponible:',
          err.message
        );

        // ESTRATEGIA 2: Obtener todos los cursos y filtrar por id_orientador
        try {
          console.log('🔄 Fallback: Listando todos los cursos...');
          const allCursos = await cursosService.list({
            activo: true,
            limit: 100,
          });
          console.log(`📋 Total de cursos activos: ${allCursos.items.length}`);
          console.log('Todos los cursos:', allCursos.items);

          cursosRaw = allCursos.items.filter(
            (curso) => curso.id_orientador === parseInt(user.id)
          );
          estrategiaUsada = 'Filtrado por id_orientador';
          console.log(
            `✅ ${estrategiaUsada}: ${cursosRaw.length} cursos encontrados`,
            cursosRaw
          );
        } catch (fallbackErr) {
          console.error('❌ Error en fallback de cursos:', fallbackErr);
          toast.error('No se pudieron cargar los cursos');
        }
      }

      // Procesar cursos encontrados
      if (cursosRaw.length > 0) {
        const cursosConAsignaturas = cursosRaw
          .filter((curso: any) => curso?.id_curso != null || curso?.id != null)
          .map((curso: any) => {
            // El backend retorna asignaturas como array, necesitamos mapearlo
            const asignaturasArray = curso.asignaturas || [];
            const primeraAsignatura = asignaturasArray.length > 0 ? asignaturasArray[0] : null;
            
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
            console.log(`📚 Curso "${curso.nombre}":`, {
              asignaturas_recibidas: asignaturasArray.length,
              primera_asignatura: primeraAsignatura?.nombre || 'N/A',
              tiene_asignatura: !!primeraAsignatura,
            });
            return cursoMapeado;
          });

        const sinAsignaturas = cursosConAsignaturas.filter(
          (c) => !c.asignatura
        );
        const conAsignaturas = cursosConAsignaturas.filter((c) => c.asignatura);

        console.log(
          `📊 Resumen: ${cursosConAsignaturas.length} cursos totales`
        );
        console.log(`   ✅ Con asignaturas: ${conAsignaturas.length}`);
        console.log(`   ⚠️  Sin asignaturas: ${sinAsignaturas.length}`);

        if (sinAsignaturas.length > 0) {
          console.warn(
            '⚠️  Cursos sin asignaturas:',
            sinAsignaturas.map((c) => c.nombre)
          );
        }

        cursosResponse = conAsignaturas as CursoResponse[];
      }

      if (cursosResponse.length === 0) {
        console.warn('⚠️  No se encontraron cursos con asignaturas asignadas');
        toast.warning(
          'No se encontraron cursos con asignaturas. Verifica que:\n' +
            '1. Tengas cursos asignados como orientador\n' +
            '2. Los cursos tengan asignaturas creadas\n' +
            '3. Estés usando el ID de orientador correcto'
        );
        console.log(
          `💡 Para debug, ejecuta las consultas SQL en: consultas-debug-cursos.sql`
        );
        console.log(`   Reemplaza :id_orientador con: ${user.id}`);
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
              rut: a.rut ?? 'N/A',
            }));
          } catch (err) {
            console.error(
              `Error al cargar alumnos del curso ${curso.id_curso}:`,
              err
            );
            alumnosPorCursoTemp[curso.id_curso.toString()] = [];
          }
        }
      }
      setAlumnosPorCurso(alumnosPorCursoTemp);
    } catch (e) {
      console.error('Error al cargar datos iniciales:', e);
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
      console.error('Error al cargar catálogo de infracciones:', e);
      toast.error('Error al cargar el catálogo de infracciones');
    }
  };

  // Handlers para Asistencia
  const handleEstadoChange = (alumnoId: number, estado: EstadoAsistencia) => {
    setAsistenciaActual((prev) => ({
      ...prev,
      [alumnoId]: { estado, observacion: prev[alumnoId]?.observacion || '' },
    }));
  };

  const handleObservacionChange = (alumnoId: number, observacion: string) => {
    setAsistenciaActual((prev) => ({
      ...prev,
      [alumnoId]: { estado: prev[alumnoId]?.estado || 'P', observacion },
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
    if (!cursoActual?.asignatura?.id_asignatura) {
      toast.error('El curso seleccionado no tiene asignatura asignada');
      return;
    }

    if (Object.keys(asistenciaActual).length === 0) {
      toast.error('Debe marcar la asistencia de al menos un alumno');
      return;
    }

    setIsLoading(true);
    try {
      const asistencias: CreateAsistenciaDto[] = Object.entries(
        asistenciaActual
      ).map(([alumnoId, datos]) => ({
        id_alumno: alumnoId,
        id_asignatura: cursoActual.asignatura!.id_asignatura.toString(),
        id_orientador: user.id,
        fecha: fechaSeleccionada,
        estado: datos.estado,
        anio_academico: new Date().getFullYear().toString(),
        observacion: datos.observacion || undefined,
      }));

      const bulkData: BulkAsistenciaDto = { asistencias };
      await asistenciaService.createBulk(bulkData);

      toast.success(
        `Asistencia guardada correctamente (${asistencias.length} alumnos)`
      );
      setAsistenciaActual({});
    } catch (e: any) {
      console.error('Error al guardar asistencias:', e);
      const errorMsg = e?.response?.data?.message || 'Error desconocido';
      toast.error(`Error al guardar las asistencias: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const marcarTodosPresentes = () => {
    const alumnosDelCurso = cursoSeleccionado
      ? alumnosPorCurso[cursoSeleccionado] || []
      : [];
    const nuevaAsistencia: Record<
      string,
      { estado: EstadoAsistencia; observacion: string }
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

  // Handlers para Conducta
  const handleCrearInfraccion = async () => {
    if (!nuevaInfraccion.articulo || !nuevaInfraccion.descripcion) {
      toast.error('Debe completar todos los campos obligatorios');
      return;
    }

    setIsLoading(true);
    try {
      await conductaService.createCatalogo(nuevaInfraccion);
      toast.success('Infracción creada correctamente');
      setModalInfraccion(false);
      setNuevaInfraccion({
        categoria: 'MENOS_GRAVE',
        articulo: '',
        descripcion: '',
        puntos: 0,
      });
      cargarCatalogoInfracciones();
    } catch (e: any) {
      console.error('Error al crear infracción:', e);
      toast.error('Error al crear la infracción');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrarConducta = async () => {
    if (!nuevaConducta.id_alumno || !nuevaConducta.id_infraccion) {
      toast.error('Debe seleccionar un alumno y una infracción');
      return;
    }

    setIsLoading(true);
    try {
      const conductaData: CreateConductaDto = {
        id_alumno: nuevaConducta.id_alumno,
        id_orientador: user.id,
        id_infraccion: nuevaConducta.id_infraccion,
        fecha: nuevaConducta.fecha,
        anio_academico: new Date().getFullYear().toString(),
        observacion: nuevaConducta.observacion || undefined,
      };

      await conductaService.create(conductaData);
      toast.success('Conducta registrada correctamente');
      setModalConducta(false);
      setNuevaConducta({
        id_alumno: '',
        id_infraccion: '',
        fecha: new Date().toISOString().split('T')[0],
        observacion: '',
      });
    } catch (e: any) {
      console.error('Error al registrar conducta:', e);
      toast.error('Error al registrar la conducta');
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers para Resúmenes
  const handleGenerarResumenMensual = async () => {
    if (!filtroResumenMensual.id_curso) {
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
      console.error('Error al generar resumen mensual:', e);
      toast.error('Error al generar el resumen mensual');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerarResumenTrimestral = async () => {
    if (!filtroResumenTrimestral.id_curso) {
      toast.error('Debe seleccionar un curso');
      return;
    }

    setIsLoading(true);
    try {
      const resumen = await resumenService.getResumenTrimestral(
        filtroResumenTrimestral
      );
      setResumenTrimestral(resumen);
      toast.success('Resumen trimestral generado correctamente');
    } catch (e: any) {
      console.error('Error al generar resumen trimestral:', e);
      toast.error('Error al generar el resumen trimestral');
    } finally {
      setIsLoading(false);
    }
  };

  // Utiles
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
                  <SelectValue placeholder="Seleccionar curso" />
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
                  disabled={
                    isLoading || Object.keys(asistenciaActual).length === 0
                  }
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Guardando...' : 'Guardar Asistencia'}
                </Button>
              </div>
            </CardContent>
          </Card>

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
                                    handleObservacionChange(
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
        </>
      )}
    </div>
  );

  const renderConducta = () => (
    <div className="space-y-6">
      {/* Catálogo de Infracciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Catálogo de Infracciones</span>
            </div>
            <Dialog open={modalInfraccion} onOpenChange={setModalInfraccion}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Infracción
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Infracción</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select
                      value={nuevaInfraccion.categoria}
                      onValueChange={(v: CategoriaInfraccion) =>
                        setNuevaInfraccion({ ...nuevaInfraccion, categoria: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MENOS_GRAVE">Menos Grave</SelectItem>
                        <SelectItem value="GRAVE">Grave</SelectItem>
                        <SelectItem value="MUY_GRAVE">Muy Grave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="articulo">Artículo</Label>
                    <Input
                      id="articulo"
                      placeholder="Ej: Art. 10"
                      value={nuevaInfraccion.articulo}
                      onChange={(e) =>
                        setNuevaInfraccion({
                          ...nuevaInfraccion,
                          articulo: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      placeholder="Descripción de la infracción..."
                      value={nuevaInfraccion.descripcion}
                      onChange={(e) =>
                        setNuevaInfraccion({
                          ...nuevaInfraccion,
                          descripcion: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="puntos">Puntos Negativos</Label>
                    <Input
                      id="puntos"
                      type="number"
                      min="0"
                      step="0.1"
                      value={nuevaInfraccion.puntos}
                      onChange={(e) =>
                        setNuevaInfraccion({
                          ...nuevaInfraccion,
                          puntos: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <Button
                    onClick={handleCrearInfraccion}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Creando...' : 'Crear Infracción'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead>Artículo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Puntos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
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
                    <Badge variant="secondary">-{infraccion.puntos} pts</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {catalogoInfracciones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    No hay infracciones registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Registro de Conductas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Registros de Conducta</span>
            </div>
            <Dialog open={modalConducta} onOpenChange={setModalConducta}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Conducta</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="curso-conducta">Curso</Label>
                    <Select
                      value={cursoSeleccionado}
                      onValueChange={(v) => {
                        setCursoSeleccionado(v);
                        setNuevaConducta({ ...nuevaConducta, id_alumno: '' });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar curso" />
                      </SelectTrigger>
                      <SelectContent>
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
                    <Label htmlFor="alumno-conducta">Alumno</Label>
                    <Select
                      value={nuevaConducta.id_alumno}
                      onValueChange={(v) =>
                        setNuevaConducta({ ...nuevaConducta, id_alumno: v })
                      }
                      disabled={!cursoSeleccionado}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar alumno" />
                      </SelectTrigger>
                      <SelectContent>
                        {alumnosDelCurso.map((alumno) => (
                          <SelectItem
                            key={alumno.id_alumno}
                            value={alumno.id_alumno.toString()}
                          >
                            {alumno.nombre} {alumno.apellido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="infraccion-conducta">Infracción</Label>
                    <Select
                      value={nuevaConducta.id_infraccion}
                      onValueChange={(v) =>
                        setNuevaConducta({ ...nuevaConducta, id_infraccion: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar infracción" />
                      </SelectTrigger>
                      <SelectContent>
                        {catalogoInfracciones.map((infraccion) => (
                          <SelectItem
                            key={infraccion.id_infraccion}
                            value={infraccion.id_infraccion}
                          >
                            {infraccion.articulo} -{' '}
                            {infraccion.descripcion.substring(0, 50)}...
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fecha-conducta">Fecha</Label>
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="observacion-conducta">Observación</Label>
                    <Textarea
                      id="observacion-conducta"
                      placeholder="Detalles adicionales..."
                      value={nuevaConducta.observacion}
                      onChange={(e) =>
                        setNuevaConducta({
                          ...nuevaConducta,
                          observacion: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    onClick={handleRegistrarConducta}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Registrando...' : 'Registrar Conducta'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Los registros de conducta se mostrarán aquí una vez implementado el
            listado.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderResumenMensual = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Resumen Mensual de Asistencia</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Curso</Label>
              <Select
                value={filtroResumenMensual.id_curso}
                onValueChange={(v) =>
                  setFiltroResumenMensual({
                    ...filtroResumenMensual,
                    id_curso: v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
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
                value={filtroResumenMensual.anio_academico}
                onChange={(e) =>
                  setFiltroResumenMensual({
                    ...filtroResumenMensual,
                    anio_academico: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <Button
            onClick={handleGenerarResumenMensual}
            disabled={isLoading || !filtroResumenMensual.id_curso}
          >
            <Download className="w-4 h-4 mr-2" />
            {isLoading ? 'Generando...' : 'Generar Resumen'}
          </Button>
        </CardContent>
      </Card>

      {resumenMensual && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado - Resumen Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Curso: {resumenMensual.id_curso} | Mes: {resumenMensual.mes} |
              Año: {resumenMensual.anio_academico}
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Presentes</TableHead>
                  <TableHead>Ausencias</TableHead>
                  <TableHead>Excusados</TableHead>
                  <TableHead>Sin Permiso</TableHead>
                  <TableHead>% Asistencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumenMensual.estudiantes.map((est) => (
                  <TableRow key={est.id_alumno}>
                    <TableCell className="font-medium">
                      {est.nombre} {est.apellidos}
                    </TableCell>
                    <TableCell>{est.dias_asistidos}</TableCell>
                    <TableCell>{est.dias_ausencias}</TableCell>
                    <TableCell>{est.dias_excusados}</TableCell>
                    <TableCell>{est.dias_sin_permiso}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          est.porcentaje_asistencia >= 80
                            ? 'default'
                            : 'destructive'
                        }
                        className={
                          est.porcentaje_asistencia >= 80
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }
                      >
                        {est.porcentaje_asistencia.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderResumenTrimestral = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Resumen Trimestral con Nota de Conducta</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Curso</Label>
              <Select
                value={filtroResumenTrimestral.id_curso}
                onValueChange={(v) =>
                  setFiltroResumenTrimestral({
                    ...filtroResumenTrimestral,
                    id_curso: v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
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
                value={filtroResumenTrimestral.anio_academico}
                onChange={(e) =>
                  setFiltroResumenTrimestral({
                    ...filtroResumenTrimestral,
                    anio_academico: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <Button
            onClick={handleGenerarResumenTrimestral}
            disabled={isLoading || !filtroResumenTrimestral.id_curso}
          >
            <Download className="w-4 h-4 mr-2" />
            {isLoading ? 'Generando...' : 'Generar Resumen'}
          </Button>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              La nota de conducta se calcula con la fórmula:{' '}
              <strong>
                10 - (ausencias injustificadas × 0.2) - Σ(infracciones × puntos)
              </strong>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {resumenTrimestral && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado - Resumen Trimestral</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Curso: {resumenTrimestral.id_curso} | Trimestre:{' '}
              {resumenTrimestral.trimestre} | Año:{' '}
              {resumenTrimestral.anio_academico}
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Ausencias Injustificadas</TableHead>
                  <TableHead>Infracciones</TableHead>
                  <TableHead>Nota de Conducta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumenTrimestral.estudiantes.map((est) => (
                  <TableRow key={est.id_alumno}>
                    <TableCell className="font-medium">
                      {est.nombre} {est.apellidos}
                    </TableCell>
                    <TableCell>{est.total_ausencias_injustificadas}</TableCell>
                    <TableCell>
                      {est.infracciones.length > 0 ? (
                        <div className="space-y-1">
                          {est.infracciones.map((inf, idx) => (
                            <div key={idx} className="text-xs">
                              <Badge
                                variant="outline"
                                className={getBadgeColor(inf.categoria)}
                              >
                                {inf.articulo}: {inf.conteo}x (-{inf.puntos}{' '}
                                pts)
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          Sin infracciones
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            est.nota_conducta >= 6 ? 'default' : 'destructive'
                          }
                          className={
                            est.nota_conducta >= 6
                              ? 'bg-green-600 hover:bg-green-700 text-lg px-3 py-1'
                              : 'bg-red-600 hover:bg-red-700 text-lg px-3 py-1'
                          }
                        >
                          {est.nota_conducta.toFixed(1)}
                        </Badge>
                        {est.nota_conducta < 6 && (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Asistencia y Conducta
        </h1>
        <p className="text-gray-600 mt-2">
          Sistema integral de registro y seguimiento académico
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="asistencia" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Tomar Asistencia
          </TabsTrigger>
          <TabsTrigger value="conducta" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Conducta
          </TabsTrigger>
          <TabsTrigger
            value="resumen-mensual"
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Resumen Mensual
          </TabsTrigger>
          <TabsTrigger
            value="resumen-trimestral"
            className="flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            Resumen Trimestral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="asistencia">{renderTomarAsistencia()}</TabsContent>
        <TabsContent value="conducta">{renderConducta()}</TabsContent>
        <TabsContent value="resumen-mensual">
          {renderResumenMensual()}
        </TabsContent>
        <TabsContent value="resumen-trimestral">
          {renderResumenTrimestral()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
