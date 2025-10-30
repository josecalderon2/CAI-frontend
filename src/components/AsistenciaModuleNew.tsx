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
  TrendingDown,
  Download,
  Plus,
  Edit,
  Trash2,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

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
  type CreateConductaDto,
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
  const [mostrarEstados, setMostrarEstados] = useState(false);

  // Estados para Conducta
  const [catalogoInfracciones, setCatalogoInfracciones] = useState<
    InfraccionCatalogoResponse[]
  >([]);
  const [modalInfraccion, setModalInfraccion] = useState(false);
  const [modalConducta, setModalConducta] = useState(false);
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

  const cargarDatosIniciales = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      let cursosResponse: CursoResponse[] = [];
      let cursosRaw: any[] = [];

      // ✅ Usar endpoint seguro /cursos/mis-cursos (valida con token JWT)
      try {
        console.log(`� Obteniendo cursos mediante token JWT autenticado`);
        console.log(
          `👤 Usuario: ${user.email || user.name} (ID: ${user.id}, Rol: ${user.role})`
        );

        const cursos = await cursosService.getMisCursos();
        cursosRaw = Array.isArray(cursos) ? cursos : [];

        console.log(
          `✅ Cursos obtenidos exitosamente: ${cursosRaw.length} curso(s)`
        );
        if (cursosRaw.length > 0) {
          console.log(
            '📚 Cursos:',
            cursosRaw.map((c) => ({
              id: c.id_curso,
              nombre: c.nombre,
              asignaturas: c.asignaturas?.length || 0,
            }))
          );
        }
      } catch (err: any) {
        console.error('❌ Error al obtener cursos:', err);
        const errorMsg =
          err?.response?.data?.message || err.message || 'Error desconocido';
        const statusCode = err?.response?.status;

        if (statusCode === 401) {
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          console.error('� Token JWT inválido o expirado');
        } else if (statusCode === 403) {
          toast.error('No tienes permisos para acceder a esta información.');
          console.error('� Permisos insuficientes');
        } else {
          toast.error(`Error al cargar cursos: ${errorMsg}`);
          console.error('⚠️ Error del servidor:', err?.response?.data);
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
      // Calcular trimestre basado en la fecha
      const fecha = new Date(fechaSeleccionada);
      const mes = fecha.getMonth() + 1;
      const trimestre = Math.ceil(mes / 4); // 1-4 = T1, 5-8 = T2, 9-12 = T3

      const registros = Object.entries(asistenciaActual).map(
        ([alumnoId, datos]) => ({
          id_alumno: parseInt(alumnoId),
          id_asignatura: cursoActual.asignatura!.id_asignatura,
          id_orientador: parseInt(user.id),
          fecha: fechaSeleccionada,
          estado: datos.estado,
          anio_academico: new Date().getFullYear().toString(),
          trimestre: trimestre,
          observacion: datos.observacion || null,
        })
      );

      const bulkData: BulkAsistenciaDto = { registros };
      await asistenciaService.createBulk(bulkData);

      toast.success(
        `Asistencia guardada correctamente (${registros.length} alumnos)`
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
      toast.error('Debe completar artículo y descripción');
      return;
    }

    if (nuevaInfraccion.puntos <= 0) {
      toast.error('Los puntos deben ser mayor a 0');
      return;
    }

    setIsLoading(true);
    try {
      await conductaService.createCatalogo(nuevaInfraccion);
      toast.success('Infracción creada correctamente en el catálogo');
      setModalInfraccion(false);
      setNuevaInfraccion({
        categoria: 'MENOS_GRAVE',
        articulo: '',
        descripcion: '',
        puntos: 1,
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

    if (!nuevaConducta.fecha) {
      toast.error('Debe seleccionar una fecha');
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

      const alumno = alumnosDelCurso.find(
        (a) => a.id_alumno.toString() === nuevaConducta.id_alumno
      );
      const infraccion = catalogoInfracciones.find(
        (i) => i.id_infraccion === nuevaConducta.id_infraccion
      );

      toast.success(
        `Conducta registrada: ${alumno?.nombre} ${alumno?.apellido} - ${infraccion?.articulo}`
      );

      setModalConducta(false);
      setNuevaConducta({
        id_alumno: '',
        id_infraccion: '',
        fecha: new Date().toISOString().split('T')[0],
        observacion: '',
      });
      setBusquedaAlumnoConducta('');
    } catch (e: any) {
      console.error('Error al registrar conducta:', e);
      const errorMsg = e?.response?.data?.message || 'Error desconocido';
      toast.error(`Error al registrar la conducta: ${errorMsg}`);
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
      console.error('Error al generar resumen mensual:', e);
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
  const alumnosFiltrados = alumnosDelCurso.filter((al) =>
    `${al.nombre} ${al.apellido}`
      .toLowerCase()
      .includes(busquedaAlumno.toLowerCase())
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

  // Obtener infracción seleccionada
  const infraccionSeleccionada = catalogoInfracciones.find(
    (inf) => inf.id_infraccion === nuevaConducta.id_infraccion
  );

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
                      {curso.nombre}
                      {curso.seccion ? ` - ${curso.seccion}` : ''}
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
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400'
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
                                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                : 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400'
                            }
                            title="Atraso/Tarde"
                          >
                            <Clock className="w-4 h-4" />
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
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400'
                            }
                            title="Ausente Sin Permiso"
                          >
                            <XCircle className="w-4 h-4" />
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
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400'
                            }
                            title="Ausente Justificado/Con Permiso"
                          >
                            <Shield className="w-4 h-4" />
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
                                {infracciones.map((infraccion) => (
                                  <button
                                    key={infraccion.id_infraccion}
                                    type="button"
                                    onClick={() =>
                                      setNuevaConducta({
                                        ...nuevaConducta,
                                        id_infraccion: infraccion.id_infraccion,
                                      })
                                    }
                                    className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                                      nuevaConducta.id_infraccion ===
                                      infraccion.id_infraccion
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
                                      {nuevaConducta.id_infraccion ===
                                        infraccion.id_infraccion && (
                                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
                                      )}
                                    </div>
                                  </button>
                                ))}
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
                            (infraccion) => (
                              <button
                                key={infraccion.id_infraccion}
                                type="button"
                                onClick={() =>
                                  setNuevaConducta({
                                    ...nuevaConducta,
                                    id_infraccion: infraccion.id_infraccion,
                                  })
                                }
                                className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                                  nuevaConducta.id_infraccion ===
                                  infraccion.id_infraccion
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
                                  {nuevaConducta.id_infraccion ===
                                    infraccion.id_infraccion && (
                                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
                                  )}
                                </div>
                              </button>
                            )
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

                  {/* Resumen de infracción seleccionada */}
                  {infraccionSeleccionada && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg py-2 px-3">
                      <div className="flex items-center gap-2 flex-nowrap">
                        <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="font-semibold text-sm whitespace-nowrap">
                          Infracción:
                        </span>
                        <Badge
                          variant="outline"
                          className="font-mono text-xs whitespace-nowrap"
                        >
                          {infraccionSeleccionada.articulo}
                        </Badge>
                        <Badge
                          className={`${getBadgeColor(infraccionSeleccionada.categoria)} text-xs whitespace-nowrap`}
                        >
                          {getCategoriaLabel(infraccionSeleccionada.categoria)}{' '}
                          • -{infraccionSeleccionada.puntos} pts
                        </Badge>
                        <span className="text-sm text-gray-700">
                          {infraccionSeleccionada.descripcion}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Fecha y Observación */}
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

                  <div className="space-y-2">
                    <Label htmlFor="observacion-conducta">
                      5. Observaciones (opcional)
                    </Label>
                    <Textarea
                      id="observacion-conducta"
                      placeholder="Detalles adicionales del incidente, contexto, testigos, etc..."
                      value={nuevaConducta.observacion}
                      onChange={(e) =>
                        setNuevaConducta({
                          ...nuevaConducta,
                          observacion: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>

                  {/* Botón de guardar */}
                  <div className="flex space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setModalConducta(false);
                        setNuevaConducta({
                          id_alumno: '',
                          id_infraccion: '',
                          fecha: new Date().toISOString().split('T')[0],
                          observacion: '',
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
                        !nuevaConducta.id_infraccion ||
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
          <p className="text-sm text-gray-500">
            Los registros de conducta se mostrarán aquí una vez implementado el
            listado.
          </p>
        </CardContent>
      </Card>

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
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Crear Nueva Infracción en el Catálogo</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription>
                      Las infracciones creadas aquí estarán disponibles para
                      registrar conductas de alumnos.
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
                    <Label htmlFor="puntos" className="text-base font-semibold">
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
                        <strong>Recomendado:</strong> Menos Grave (1 pt), Grave
                        (2 pts), Muy Grave (3 pts)
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
                          Creando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Crear Infracción
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
                value={filtroResumenMensual.cursoId?.toString() || ''}
                onValueChange={(v) =>
                  setFiltroResumenMensual({
                    ...filtroResumenMensual,
                    cursoId: parseInt(v),
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
        </CardContent>
      </Card>

      {resumenMensual && resumenMensual.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado - Resumen Mensual</CardTitle>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Justificadas (E)</TableHead>
                  <TableHead>Injustificadas (SP)</TableHead>
                  <TableHead>Atrasos (A)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumenMensual.map((est: ResumenMensualResponse) => (
                  <TableRow key={est.id_alumno}>
                    <TableCell className="font-medium">
                      {est.nombre} {est.apellido}
                    </TableCell>
                    <TableCell>{est.justificadas}</TableCell>
                    <TableCell>{est.injustificadas}</TableCell>
                    <TableCell>{est.atrasos}</TableCell>
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
                value={filtroResumenTrimestral.cursoId?.toString() || ''}
                onValueChange={(v) =>
                  setFiltroResumenTrimestral({
                    ...filtroResumenTrimestral,
                    cursoId: parseInt(v),
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
              La nota de conducta se calcula con la fórmula:{' '}
              <strong>
                10 - (ausencias injustificadas × 0.2) - Σ(infracciones × puntos)
              </strong>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {resumenTrimestral && resumenTrimestral.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado - Resumen Trimestral</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Curso:{' '}
              {cursosAsignados.find(
                (c) => c.id_curso === filtroResumenTrimestral.cursoId
              )?.nombre || filtroResumenTrimestral.cursoId}{' '}
              | Trimestre: {filtroResumenTrimestral.trimestre} | Año:{' '}
              {filtroResumenTrimestral.anio}
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Justificadas (E)</TableHead>
                  <TableHead>Injustificadas (SP)</TableHead>
                  <TableHead>Infracciones</TableHead>
                  <TableHead>Nota de Conducta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumenTrimestral.map((est: ResumenTrimestralResponse) => (
                  <TableRow key={est.id_alumno}>
                    <TableCell className="font-medium">
                      {est.nombre} {est.apellido}
                    </TableCell>
                    <TableCell>{est.justificadas}</TableCell>
                    <TableCell>{est.injustificadas}</TableCell>
                    <TableCell>
                      {est.infracciones.length > 0 ? (
                        <div className="space-y-1">
                          {est.infracciones.map(
                            (inf: InfraccionResumen, idx: number) => (
                              <div key={idx} className="text-xs">
                                <Badge
                                  variant="outline"
                                  className={getBadgeColor(inf.categoria)}
                                >
                                  {inf.articulo}: {inf.cantidad}x (-{inf.puntos}{' '}
                                  pts)
                                </Badge>
                              </div>
                            )
                          )}
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
                            est.puntajeConducta >= 6 ? 'default' : 'destructive'
                          }
                          className={
                            est.puntajeConducta >= 6
                              ? 'bg-green-600 hover:bg-green-700 text-lg px-3 py-1'
                              : 'bg-red-600 hover:bg-red-700 text-lg px-3 py-1'
                          }
                        >
                          {est.puntajeConducta.toFixed(1)}
                        </Badge>
                        {est.puntajeConducta < 6 && (
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Asistencia y Conducta
        </h1>
        <p className="text-gray-600 mt-2">
          Sistema integral de registro y seguimiento académico
        </p>
      </div>

      {/* Tarjetas informativas */}
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

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList className="grid w-full grid-cols-4 gap-2">
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

        <div className="mt-6">
          <TabsContent value="asistencia">
            {renderTomarAsistencia()}
          </TabsContent>
          <TabsContent value="conducta">{renderConducta()}</TabsContent>
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
