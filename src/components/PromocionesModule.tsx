import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
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
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  ArrowRight,
  GraduationCap,
  Users,
  UserCheck,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  cursosService,
  type Curso as CursoAPI,
} from '../api/services/cursosService';
import promocionesService from '../api/services/promocionesService';
import { api } from '../api/axiosConfig';

// Tipos que coinciden con el backend
interface AlumnoCurso {
  id_alumno_curso: number;
  id_alumno: number;
  id_curso?: number; // ID del curso actual del alumno
  nombre: string;
  apellido: string;
  numero_matricula: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
  promedio_notas?: number | null;
  anio_academico: string;
  curso_nombre?: string; // Cuando se obtienen todos los alumnos
  grado_academico?: string; // Cuando se obtienen todos los alumnos
}

// Usar el tipo de Curso de la API
type Curso = CursoAPI;

interface HistorialAcademico {
  anioAcademico: string;
  curso: string; // Cambiado: ahora es string directo
  gradoAcademico: string; // Cambiado: ahora es string directo
  estadoFinal: string | null;
  notaPromedio: number | null;
  fechaInicio: Date | string;
  fechaFin: Date | string | null;
  observaciones: string | null;
  alumnoNombre?: string; // Cuando se obtienen todos los alumnos
  alumnoId?: number; // Cuando se obtienen todos los alumnos
}

// Función helper para formatear fechas
const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('es-SV', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// Función helper para normalizar estados
const normalizeEstado = (estado: string | null): string => {
  if (!estado) return 'En curso';

  const estadosMap: { [key: string]: string } = {
    APROBADO: 'Aprobado',
    REPROBADO: 'Reprobado',
    FINALIZADO: 'Graduado',
    'NO REINSCRITO': 'Retirado',
    NO_REINSCRITO: 'Retirado',
  };

  return estadosMap[estado.toUpperCase()] || estado;
};

export function PromocionesModule() {
  const [tab, setTab] = useState('alumnos-curso');
  const currentYear = new Date().getFullYear().toString();

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Sistema de Promociones y Historial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="alumnos-curso">
                <Users className="h-4 w-4 mr-2" />
                Alumnos por Curso
              </TabsTrigger>
              <TabsTrigger value="promocion-masiva">
                <UserCheck className="h-4 w-4 mr-2" />
                Promoción Masiva
              </TabsTrigger>
              <TabsTrigger value="historial-academico">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Historial Académico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="alumnos-curso">
              <AlumnosPorCursoTab defaultYear={currentYear} />
            </TabsContent>

            <TabsContent value="promocion-masiva">
              <PromocionMasivaTab defaultYear={currentYear} />
            </TabsContent>

            <TabsContent value="historial-academico">
              <HistorialAcademicoTab defaultYear={currentYear} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Tab de Alumnos por Curso
function AlumnosPorCursoTab({ defaultYear }: { defaultYear: string }) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string>('');
  const [anioAcademico, setAnioAcademico] = useState<string>(defaultYear);
  const [alumnos, setAlumnos] = useState<AlumnoCurso[]>([]);
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<number[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showPromocionDialog, setShowPromocionDialog] = useState(false);
  const [showTrasladadoDialog, setShowTrasladadoDialog] = useState(false);
  const [showFinalizarDialog, setShowFinalizarDialog] = useState(false);
  const [alumnoSeleccionado, setAlumnoSeleccionado] =
    useState<AlumnoCurso | null>(null);

  // Estados para filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAlumnos, setFilteredAlumnos] = useState<AlumnoCurso[]>([]);

  // Estados para paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadCursos();
  }, []);

  useEffect(() => {
    if (cursoSeleccionado) {
      loadAlumnos();
    }
  }, [cursoSeleccionado, anioAcademico]);

  // Auto-seleccionar "Todos" al cargar
  useEffect(() => {
    if (cursos.length > 0 && !cursoSeleccionado) {
      setCursoSeleccionado('todos');
    }
  }, [cursos]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAlumnos(alumnos);
      setTotalPages(Math.ceil(alumnos.length / itemsPerPage));
    } else {
      const normalized = searchTerm
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const filtered = alumnos.filter((alumno) => {
        const fullName = `${alumno.nombre} ${alumno.apellido}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return (
          fullName.includes(normalized) ||
          alumno.numero_matricula.includes(normalized)
        );
      });
      setFilteredAlumnos(filtered);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    }
    setPage(1); // Volver a la primera página al cambiar búsqueda
  }, [alumnos, searchTerm, itemsPerPage]);

  const loadCursos = async () => {
    try {
      setIsLoading(true);
      const response = await cursosService.list({ activo: true });
      setCursos(response.items);
    } catch (error) {
      toast.error('No se pudieron cargar los cursos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlumnos = async () => {
    if (!cursoSeleccionado) return;

    try {
      setIsLoading(true);

      // Si año académico es "todos", necesitamos cargar todos los años
      if (anioAcademico === 'todos') {
        const years = [
          parseInt(defaultYear) - 1,
          parseInt(defaultYear),
          parseInt(defaultYear) + 1,
        ];

        const allAlumnos: AlumnoCurso[] = [];

        // Cargar alumnos de todos los años
        for (const year of years) {
          try {
            if (cursoSeleccionado === 'todos') {
              const response = await promocionesService.getTodosLosAlumnos(
                year.toString()
              );
              allAlumnos.push(...response.items);
            } else {
              const response = await promocionesService.getAlumnosPorCurso(
                parseInt(cursoSeleccionado),
                year.toString()
              );
              allAlumnos.push(...response.items);
            }
          } catch (error) {
            // No hay alumnos en este año
          }
        }

        setAlumnos(allAlumnos);
        setAlumnosSeleccionados([]);
      } else {
        // Año específico seleccionado
        if (cursoSeleccionado === 'todos') {
          const response =
            await promocionesService.getTodosLosAlumnos(anioAcademico);
          setAlumnos(response.items);
          setAlumnosSeleccionados([]);
        } else {
          // Endpoint normal para un curso específico
          const response = await promocionesService.getAlumnosPorCurso(
            parseInt(cursoSeleccionado),
            anioAcademico
          );

          // El servicio ya mapea la respuesta al formato esperado
          setAlumnos(response.items);
          setAlumnosSeleccionados([]);
        }
      }
    } catch (error) {
      toast.error('No se pudieron cargar los alumnos del curso');
      setAlumnos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = (id_alumno: number) => {
    setAlumnosSeleccionados((prev) => {
      if (prev.includes(id_alumno)) {
        return prev.filter((id) => id !== id_alumno);
      } else {
        return [...prev, id_alumno];
      }
    });
  };

  const handleSelectAllChange = () => {
    if (alumnosSeleccionados.length === paginatedAlumnos.length) {
      setAlumnosSeleccionados([]);
    } else {
      setAlumnosSeleccionados(paginatedAlumnos.map((a) => a.id_alumno));
    }
  };

  const abrirDialogoPromocion = (alumno: AlumnoCurso) => {
    setAlumnoSeleccionado(alumno);
    setShowPromocionDialog(true);
  };

  const abrirDialogoTraslado = (alumno: AlumnoCurso) => {
    setAlumnoSeleccionado(alumno);
    setShowTrasladadoDialog(true);
  };

  const abrirDialogoFinalizar = (alumno: AlumnoCurso) => {
    setAlumnoSeleccionado(alumno);
    setShowFinalizarDialog(true);
  };

  // Obtener alumnos paginados
  const paginatedAlumnos = filteredAlumnos.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="curso">Curso</Label>
          <Select
            value={cursoSeleccionado}
            onValueChange={setCursoSeleccionado}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los cursos</SelectItem>
              {cursos.map((curso) => (
                <SelectItem
                  key={curso.id_curso}
                  value={curso.id_curso?.toString() || ''}
                >
                  {curso.nombre} {curso.seccion || ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="anio">Año Académico</Label>
          <Select value={anioAcademico} onValueChange={setAnioAcademico}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los años</SelectItem>
              {[
                parseInt(defaultYear) - 1,
                parseInt(defaultYear),
                parseInt(defaultYear) + 1,
              ].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="Buscar por nombre"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <>
          {filteredAlumnos.length > 0 ? (
            <>
              <div className="flex items-center justify-between my-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={
                      alumnosSeleccionados.length === paginatedAlumnos.length &&
                      paginatedAlumnos.length > 0
                    }
                    onCheckedChange={handleSelectAllChange}
                    id="select-all"
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Seleccionar todos en esta página ({paginatedAlumnos.length})
                  </label>
                </div>

                <div className="space-x-2"></div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Nombre</TableHead>
                      {cursoSeleccionado === 'todos' && (
                        <>
                          <TableHead>Curso</TableHead>
                          <TableHead>Grado</TableHead>
                        </>
                      )}
                      <TableHead>Estado</TableHead>
                      <TableHead>Promedio</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAlumnos.map((alumno) => (
                      <TableRow key={alumno.id_alumno}>
                        <TableCell>
                          <Checkbox
                            checked={alumnosSeleccionados.includes(
                              alumno.id_alumno
                            )}
                            onCheckedChange={() =>
                              handleCheckboxChange(alumno.id_alumno)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {alumno.nombre} {alumno.apellido}
                        </TableCell>
                        {cursoSeleccionado === 'todos' && (
                          <>
                            <TableCell>{alumno.curso_nombre || '-'}</TableCell>
                            <TableCell>
                              {alumno.grado_academico || '-'}
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          <Badge
                            variant={
                              alumno.estado === 'ACTIVO'
                                ? 'success'
                                : alumno.estado === 'SUSPENDIDO'
                                  ? 'warning'
                                  : 'destructive'
                            }
                          >
                            {alumno.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {alumno.promedio_notas?.toFixed(2) || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirDialogoPromocion(alumno)}
                            >
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                              Promover
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => abrirDialogoTraslado(alumno)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Retirar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirDialogoFinalizar(alumno)}
                              className="bg-green-50 hover:bg-green-100 border-green-200"
                            >
                              <GraduationCap className="h-4 w-4 mr-1" />
                              Graduado
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Controles de paginación */}
              {filteredAlumnos.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">
                    Mostrando {(page - 1) * itemsPerPage + 1} -{' '}
                    {Math.min(page * itemsPerPage, filteredAlumnos.length)} de{' '}
                    {filteredAlumnos.length} alumnos
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-600">
                      Página {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((prev) => (prev < totalPages ? prev + 1 : prev))
                      }
                      disabled={page >= totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {cursoSeleccionado
                ? 'No hay alumnos en este curso para el año seleccionado'
                : 'Seleccione un curso para ver sus alumnos'}
            </div>
          )}
        </>
      )}

      {/* Modal de Promoción */}
      {alumnoSeleccionado && (
        <PromocionDialog
          alumno={alumnoSeleccionado}
          open={showPromocionDialog}
          onClose={() => setShowPromocionDialog(false)}
          cursoOrigen={
            cursoSeleccionado === 'todos'
              ? // Cuando es "Todos", buscar el curso desde el id_curso del alumno
                cursos.find((c) => c.id_curso === alumnoSeleccionado.id_curso)
              : // Cuando es un curso específico, usar el curso seleccionado
                cursos.find((c) => c.id_curso === parseInt(cursoSeleccionado))
          }
          anioOrigen={anioAcademico}
          tipo="promocion"
          onSuccess={loadAlumnos}
        />
      )}

      {/* Modal de No Reinscrito */}
      {alumnoSeleccionado && (
        <NoReinscritoDialog
          alumno={alumnoSeleccionado}
          open={showTrasladadoDialog}
          onClose={() => setShowTrasladadoDialog(false)}
          cursoActual={
            cursoSeleccionado === 'todos'
              ? // Cuando es "Todos", buscar el curso desde el id_curso del alumno
                cursos.find((c) => c.id_curso === alumnoSeleccionado.id_curso)
              : // Cuando es un curso específico, usar el curso seleccionado
                cursos.find((c) => c.id_curso === parseInt(cursoSeleccionado))
          }
          anioActual={anioAcademico}
          onSuccess={loadAlumnos}
        />
      )}

      {/* Modal de Finalización */}
      {alumnoSeleccionado && (
        <FinalizarDialog
          alumno={alumnoSeleccionado}
          open={showFinalizarDialog}
          onClose={() => setShowFinalizarDialog(false)}
          cursoActual={
            cursoSeleccionado === 'todos'
              ? // Cuando es "Todos", buscar el curso desde el id_curso del alumno
                cursos.find((c) => c.id_curso === alumnoSeleccionado.id_curso)
              : // Cuando es un curso específico, usar el curso seleccionado
                cursos.find((c) => c.id_curso === parseInt(cursoSeleccionado))
          }
          anioActual={anioAcademico}
          onSuccess={loadAlumnos}
        />
      )}
    </div>
  );
}

// Tab de Promoción Masiva
function PromocionMasivaTab({ defaultYear }: { defaultYear: string }) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoOrigen, setCursoOrigen] = useState<string>('');
  const [cursoDestino, setCursoDestino] = useState<string>('');
  const [anioOrigen, setAnioOrigen] = useState<string>(defaultYear);
  const [anioDestino, setAnioDestino] = useState<string>(
    (parseInt(defaultYear) + 1).toString()
  );
  const [alumnos, setAlumnos] = useState<AlumnoCurso[]>([]);
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<number[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para almacenar notas y observaciones por alumno
  const [alumnosData, setAlumnosData] = useState<{
    [id_alumno: number]: {
      estado: 'APROBADO' | 'REPROBADO' | 'TRASLADADO';
      nota_promedio?: number;
      observaciones?: string;
    };
  }>({});

  useEffect(() => {
    loadCursos();
  }, []);

  useEffect(() => {
    if (cursoOrigen) {
      loadAlumnos();
    }
  }, [cursoOrigen, anioOrigen]);

  // Auto-seleccionar el primer curso al cargar
  useEffect(() => {
    if (cursos.length > 0 && !cursoOrigen) {
      setCursoOrigen(cursos[0].id_curso?.toString() || '');
      setCursoDestino(cursos[1]?.id_curso?.toString() || '');
    }
  }, [cursos]);

  const loadCursos = async () => {
    try {
      setIsLoading(true);
      const response = await cursosService.list({ activo: true });
      setCursos(response.items);
    } catch (error) {
      toast.error('No se pudieron cargar los cursos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlumnos = async () => {
    if (!cursoOrigen) return;

    try {
      setIsLoading(true);
      const response = await promocionesService.getAlumnosPorCurso(
        parseInt(cursoOrigen),
        anioOrigen
      );

      setAlumnos(response.items);
      setAlumnosSeleccionados([]);

      // Inicializa el estado para cada alumno
      const initialData: { [id: number]: any } = {};
      response.items.forEach((alumno: AlumnoCurso) => {
        initialData[alumno.id_alumno] = {
          estado: 'APROBADO',
          nota_promedio: alumno.promedio_notas || undefined,
          observaciones: '',
        };
      });
      setAlumnosData(initialData);
    } catch (error) {
      toast.error('No se pudieron cargar los alumnos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = (id_alumno: number) => {
    setAlumnosSeleccionados((prev) => {
      if (prev.includes(id_alumno)) {
        return prev.filter((id) => id !== id_alumno);
      } else {
        return [...prev, id_alumno];
      }
    });
  };

  const handleSelectAllChange = () => {
    if (alumnosSeleccionados.length === alumnos.length) {
      setAlumnosSeleccionados([]);
    } else {
      setAlumnosSeleccionados(alumnos.map((a) => a.id_alumno));
    }
  };

  const handleEstadoChange = (
    id_alumno: number,
    estado: 'APROBADO' | 'REPROBADO' | 'TRASLADADO'
  ) => {
    setAlumnosData((prev) => ({
      ...prev,
      [id_alumno]: {
        ...prev[id_alumno],
        estado,
      },
    }));
  };

  const handleNotaChange = (id_alumno: number, nota: string) => {
    const notaNumber = parseFloat(nota);
    setAlumnosData((prev) => ({
      ...prev,
      [id_alumno]: {
        ...prev[id_alumno],
        nota_promedio: isNaN(notaNumber) ? undefined : notaNumber,
      },
    }));
  };

  const handleObservacionesChange = (
    id_alumno: number,
    observaciones: string
  ) => {
    setAlumnosData((prev) => ({
      ...prev,
      [id_alumno]: {
        ...prev[id_alumno],
        observaciones,
      },
    }));
  };

  const aplicarEstadoMasivo = (
    estado: 'APROBADO' | 'REPROBADO' | 'TRASLADADO'
  ) => {
    const newData = { ...alumnosData };
    alumnosSeleccionados.forEach((id) => {
      newData[id] = {
        ...newData[id],
        estado,
      };
    });
    setAlumnosData(newData);
  };

  const handleSubmit = async () => {
    if (!cursoOrigen || !cursoDestino || alumnosSeleccionados.length === 0) {
      toast.error('Seleccione cursos origen y destino, y al menos un alumno');
      return;
    }

    try {
      setIsSubmitting(true);

      // Preparar datos para el backend según el DTO PromocionMasivaDto
      const promocionMasivaDto = {
        anioActual: anioOrigen,
        anioSiguiente: anioDestino,
        promocionesPorCurso: [
          {
            cursoOrigenId: parseInt(cursoOrigen),
            cursoDestinoId: parseInt(cursoDestino),
            alumnos: alumnosSeleccionados.map((alumnoId) => {
              const data = alumnosData[alumnoId] || {};
              return {
                alumnoId: alumnoId,
                estado: data.estado || 'APROBADO',
                notaPromedio: data.nota_promedio,
                observaciones: data.observaciones,
              };
            }),
          },
        ],
      };

      // Llamar al endpoint de promoción masiva
      const response = (await promocionesService.promocionMasiva(
        promocionMasivaDto
      )) as any;

      // Contar alumnos promovidos exitosamente
      const totalPromovidos = response.reduce(
        (sum: number, resultado: any) =>
          sum + (resultado.alumnosPromovidos || 0),
        0
      );

      toast.success(
        `${totalPromovidos} alumno${totalPromovidos !== 1 ? 's' : ''} promovido${totalPromovidos !== 1 ? 's' : ''} exitosamente`
      );

      // Recargar la lista de alumnos
      loadAlumnos();
    } catch (error: any) {
      const mensaje =
        error.response?.data?.message ||
        'No se pudo completar la promoción masiva';
      toast.error(mensaje);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Curso Origen</h3>
          <div>
            <Label htmlFor="curso-origen">Seleccione el curso origen</Label>
            <Select value={cursoOrigen} onValueChange={setCursoOrigen}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un curso" />
              </SelectTrigger>
              <SelectContent>
                {cursos.map((curso) => (
                  <SelectItem
                    key={`origen-${curso.id_curso}`}
                    value={curso.id_curso?.toString() || ''}
                  >
                    {curso.nombre} {curso.seccion || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="anio-origen">Año Académico Origen</Label>
            <Select value={anioOrigen} onValueChange={setAnioOrigen}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un año" />
              </SelectTrigger>
              <SelectContent>
                {[
                  parseInt(defaultYear) - 1,
                  parseInt(defaultYear),
                  parseInt(defaultYear) + 1,
                ].map((year) => (
                  <SelectItem key={`origin-${year}`} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Curso Destino</h3>
          <div>
            <Label htmlFor="curso-destino">Seleccione el curso destino</Label>
            <Select value={cursoDestino} onValueChange={setCursoDestino}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un curso" />
              </SelectTrigger>
              <SelectContent>
                {cursos.map((curso) => (
                  <SelectItem
                    key={`destino-${curso.id_curso}`}
                    value={curso.id_curso?.toString() || ''}
                  >
                    {curso.nombre} {curso.seccion || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="anio-destino">Año Académico Destino</Label>
            <Select value={anioDestino} onValueChange={setAnioDestino}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un año" />
              </SelectTrigger>
              <SelectContent>
                {[
                  parseInt(defaultYear),
                  parseInt(defaultYear) + 1,
                  parseInt(defaultYear) + 2,
                ].map((year) => (
                  <SelectItem key={`dest-${year}`} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <>
          {alumnos.length > 0 ? (
            <>
              <div className="flex items-center justify-between my-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={
                      alumnosSeleccionados.length === alumnos.length &&
                      alumnos.length > 0
                    }
                    onCheckedChange={handleSelectAllChange}
                    id="select-all-masiva"
                  />
                  <label
                    htmlFor="select-all-masiva"
                    className="text-sm font-medium"
                  >
                    Seleccionar todos ({alumnos.length})
                  </label>
                </div>

                <div className="space-x-2">
                  <Button
                    variant="outline"
                    disabled={alumnosSeleccionados.length === 0}
                    onClick={() => aplicarEstadoMasivo('APROBADO')}
                  >
                    Aprobar Seleccionados
                  </Button>
                  <Button
                    variant="outline"
                    disabled={alumnosSeleccionados.length === 0}
                    onClick={() => aplicarEstadoMasivo('REPROBADO')}
                  >
                    Reprobar Seleccionados
                  </Button>
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Nota Promedio</TableHead>
                      <TableHead>Observaciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alumnos.map((alumno) => (
                      <TableRow key={alumno.id_alumno}>
                        <TableCell>
                          <Checkbox
                            checked={alumnosSeleccionados.includes(
                              alumno.id_alumno
                            )}
                            onCheckedChange={() =>
                              handleCheckboxChange(alumno.id_alumno)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {alumno.nombre} {alumno.apellido}
                            </div>
                            <div className="text-sm text-gray-500">
                              {alumno.numero_matricula}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={
                              alumnosData[alumno.id_alumno]?.estado ||
                              'APROBADO'
                            }
                            onValueChange={(
                              value: 'APROBADO' | 'REPROBADO' | 'TRASLADADO'
                            ) => handleEstadoChange(alumno.id_alumno, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="APROBADO">APROBADO</SelectItem>
                              <SelectItem value="REPROBADO">
                                REPROBADO
                              </SelectItem>
                              <SelectItem value="TRASLADADO">
                                TRASLADADO
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            placeholder="Nota promedio"
                            value={
                              alumnosData[
                                alumno.id_alumno
                              ]?.nota_promedio?.toString() || ''
                            }
                            onChange={(e) =>
                              handleNotaChange(alumno.id_alumno, e.target.value)
                            }
                            className="w-[100px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            placeholder="Observaciones"
                            value={
                              alumnosData[alumno.id_alumno]?.observaciones || ''
                            }
                            onChange={(e) =>
                              handleObservacionesChange(
                                alumno.id_alumno,
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    alumnosSeleccionados.length === 0 ||
                    !cursoDestino ||
                    isSubmitting
                  }
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Ejecutar Promoción Masiva
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {cursoOrigen
                ? 'No hay alumnos en este curso para el año seleccionado'
                : 'Seleccione un curso para ver sus alumnos'}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Tab de Historial Académico
function HistorialAcademicoTab({ defaultYear }: { defaultYear: string }) {
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<string>('');
  const [anioAcademico, setAnioAcademico] = useState<string>('todos');
  const [historialAcademico, setHistorialAcademico] = useState<
    HistorialAcademico[]
  >([]);
  const [alumnoInfo, setAlumnoInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alumnos, setAlumnos] = useState<
    Array<{ id_alumno: number; nombre: string; apellido: string }>
  >([]);
  const [busquedaNombre, setBusquedaNombre] = useState<string>('');

  // Estados para paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Cargar lista de alumnos al montar el componente
  useEffect(() => {
    loadAlumnos();
  }, []);

  const loadAlumnos = async () => {
    try {
      // Cargar alumnos activos desde el endpoint /alumnos
      const response = await api.get('/alumnos', {
        params: { incluirInactivos: 'false' },
      });

      // El backend devuelve un array de alumnos
      const alumnosData = response.data as any[];

      // Mapear solo los datos necesarios
      const alumnosLista = alumnosData.map((alumno: any) => ({
        id_alumno: alumno.id_alumno,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
      }));

      setAlumnos(alumnosLista);

      // Auto-seleccionar "Todos" por defecto
      if (alumnosLista.length > 0 && !alumnoSeleccionado) {
        setAlumnoSeleccionado('todos');
      }
    } catch (error) {
      toast.error('No se pudo cargar la lista de alumnos');
    }
  };

  const loadHistorial = async () => {
    if (!alumnoSeleccionado) return;

    try {
      setIsLoading(true);

      // Si se selecciona "Todos", cargar historial de todos los alumnos
      if (alumnoSeleccionado === 'todos') {
        // Cargar historial de todos los alumnos
        const todosHistoriales: HistorialAcademico[] = [];

        for (const alumno of alumnos) {
          try {
            const response = (await promocionesService.getHistorialAcademico(
              alumno.id_alumno
            )) as any;

            // Agregar nombre del alumno a cada registro
            if (response.historial && response.historial.length > 0) {
              const historialConAlumno = response.historial.map((h: any) => ({
                ...h,
                alumnoNombre: `${alumno.nombre} ${alumno.apellido}`,
                alumnoId: alumno.id_alumno,
              }));
              todosHistoriales.push(...historialConAlumno);
            }
          } catch (error) {
            // Error al cargar historial de un alumno
          }
        }

        // Ordenar por año académico descendente
        todosHistoriales.sort((a, b) =>
          b.anioAcademico.localeCompare(a.anioAcademico)
        );

        setAlumnoInfo(null);
        setHistorialAcademico(todosHistoriales);

        if (todosHistoriales.length === 0) {
          toast.info('No hay historial académico registrado');
        }
      } else {
        // Cargar historial de un alumno específico
        const alumnoId = parseInt(alumnoSeleccionado);

        const response = (await promocionesService.getHistorialAcademico(
          alumnoId
        )) as any;

        // Extraer datos del alumno y su historial
        setAlumnoInfo(response.alumno || null);
        setHistorialAcademico(response.historial || []);

        if (!response.historial || response.historial.length === 0) {
          toast.info('Este alumno no tiene historial académico registrado');
        }
      }
    } catch (error) {
      toast.error('No se pudo cargar el historial académico');
      setHistorialAcademico([]);
      setAlumnoInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (alumnoSeleccionado && alumnos.length > 0) {
      loadHistorial();
    }
  }, [alumnoSeleccionado]);

  const handleGenerarInforme = () => {
    toast.info('Funcionalidad de generación de informes en desarrollo');
  };

  // Filtrar alumnos por búsqueda de nombre
  const alumnosFiltrados = alumnos.filter((alumno) => {
    if (!busquedaNombre.trim()) return true;

    const normalized = busquedaNombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const fullName = `${alumno.nombre} ${alumno.apellido}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return fullName.includes(normalized);
  });

  // Filtrar historial por año académico y por nombre de alumno
  const historialFiltrado = historialAcademico.filter((h) => {
    // Filtrar por año académico
    if (anioAcademico !== 'todos' && h.anioAcademico !== anioAcademico) {
      return false;
    }

    // Filtrar por búsqueda de nombre (solo si hay búsqueda)
    if (busquedaNombre.trim()) {
      const normalized = busquedaNombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const alumnoNombre = (h.alumnoNombre || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      return alumnoNombre.includes(normalized);
    }

    return true;
  });

  // Actualizar paginación cuando cambia el historial filtrado
  useEffect(() => {
    setTotalPages(Math.ceil(historialFiltrado.length / itemsPerPage));
    setPage(1);
  }, [historialFiltrado.length, itemsPerPage]);

  // Obtener historial paginado
  const paginatedHistorial = historialFiltrado.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="busqueda-nombre-historial" className="text-xs">
            Buscar por nombre
          </Label>
          <Input
            id="busqueda-nombre-historial"
            type="text"
            placeholder="Nombre del alumno..."
            value={busquedaNombre}
            onChange={(e) => setBusquedaNombre(e.target.value)}
            className="h-9"
          />
        </div>

        <div>
          <Label htmlFor="alumno">Seleccionar Alumno</Label>
          <Select
            value={alumnoSeleccionado}
            onValueChange={setAlumnoSeleccionado}
          >
            <SelectTrigger id="alumno">
              <SelectValue placeholder="Seleccione un alumno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los alumnos</SelectItem>
              {alumnosFiltrados.length > 0 ? (
                alumnosFiltrados.map((alumno) => (
                  <SelectItem
                    key={alumno.id_alumno}
                    value={alumno.id_alumno.toString()}
                  >
                    {alumno.nombre} {alumno.apellido}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="0" disabled>
                  {busquedaNombre
                    ? 'No se encontraron alumnos'
                    : 'No hay alumnos disponibles'}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="anio">Año Académico</Label>
          <Select value={anioAcademico} onValueChange={setAnioAcademico}>
            <SelectTrigger id="anio">
              <SelectValue placeholder="Seleccione un año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los años</SelectItem>
              {[
                parseInt(defaultYear) - 2,
                parseInt(defaultYear) - 1,
                parseInt(defaultYear),
              ].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Información de resultados de búsqueda */}
      {busquedaNombre && (
        <div className="text-sm text-gray-600">
          {alumnosFiltrados.length === 0 ? (
            <span className="text-red-500">
              No se encontraron alumnos con ese nombre
            </span>
          ) : (
            <span>{alumnosFiltrados.length} alumno(s) encontrado(s)</span>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <>
          {historialFiltrado.length > 0 ? (
            <div className="space-y-4">
              {/* Información del alumno */}
              {alumnoInfo && (
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium text-gray-500">Alumno</h3>
                        <p className="text-lg">
                          {alumnoInfo.nombre} {alumnoInfo.apellido}
                        </p>
                      </div>
                      <div className="text-right">
                        <Button onClick={handleGenerarInforme}>
                          Generar Informe
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Historial académico */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {alumnoSeleccionado === 'todos' && (
                        <TableHead>Alumno</TableHead>
                      )}
                      <TableHead>Año Académico</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Grado Académico</TableHead>
                      <TableHead>Estado Final</TableHead>
                      <TableHead>Nota Promedio</TableHead>
                      <TableHead>Fecha Inicio</TableHead>
                      <TableHead>Fecha Fin</TableHead>
                      <TableHead>Observaciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedHistorial.map((registro, index) => (
                      <TableRow key={`${registro.anioAcademico}-${index}`}>
                        {alumnoSeleccionado === 'todos' && (
                          <TableCell className="font-medium">
                            {registro.alumnoNombre || '-'}
                          </TableCell>
                        )}
                        <TableCell>{registro.anioAcademico}</TableCell>
                        <TableCell>{registro.curso || '-'}</TableCell>
                        <TableCell>{registro.gradoAcademico || '-'}</TableCell>
                        <TableCell>
                          {registro.estadoFinal ? (
                            <Badge
                              variant={
                                registro.estadoFinal === 'APROBADO'
                                  ? 'success'
                                  : registro.estadoFinal === 'REPROBADO'
                                    ? 'destructive'
                                    : registro.estadoFinal === 'FINALIZADO'
                                      ? 'success'
                                      : registro.estadoFinal ===
                                            'NO REINSCRITO' ||
                                          registro.estadoFinal ===
                                            'NO_REINSCRITO'
                                        ? 'destructive'
                                        : 'outline'
                              }
                            >
                              {normalizeEstado(registro.estadoFinal)}
                            </Badge>
                          ) : (
                            <Badge variant="outline">En curso</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {registro.notaPromedio?.toFixed(2) || '-'}
                        </TableCell>
                        <TableCell>
                          {formatDate(registro.fechaInicio.toString())}
                        </TableCell>
                        <TableCell>
                          {registro.fechaFin
                            ? formatDate(registro.fechaFin.toString())
                            : '-'}
                        </TableCell>
                        <TableCell>{registro.observaciones || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Controles de paginación */}
              {historialFiltrado.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">
                    Mostrando {(page - 1) * itemsPerPage + 1} -{' '}
                    {Math.min(page * itemsPerPage, historialFiltrado.length)} de{' '}
                    {historialFiltrado.length} registros
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-600">
                      Página {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((prev) => (prev < totalPages ? prev + 1 : prev))
                      }
                      disabled={page >= totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {alumnoSeleccionado && alumnoSeleccionado !== 'todos'
                ? 'No hay registros de historial académico para este alumno'
                : alumnoSeleccionado === 'todos'
                  ? 'No hay registros de historial académico'
                  : 'Seleccione un alumno para ver su historial'}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Diálogo de Promoción/Traslado
interface PromocionDialogProps {
  alumno: AlumnoCurso;
  open: boolean;
  onClose: () => void;
  cursoOrigen: Curso | undefined;
  anioOrigen: string;
  tipo: 'promocion' | 'traslado';
  onSuccess: () => void;
}

function PromocionDialog({
  alumno,
  open,
  onClose,
  cursoOrigen,
  anioOrigen,
  tipo,
  onSuccess,
}: PromocionDialogProps) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoDestino, setCursoDestino] = useState<string>('');
  const [anioDestino, setAnioDestino] = useState<string>(
    tipo === 'promocion' ? (parseInt(anioOrigen) + 1).toString() : anioOrigen
  );
  const [estado, setEstado] = useState<'APROBADO' | 'REPROBADO' | 'TRASLADADO'>(
    tipo === 'promocion' ? 'APROBADO' : 'TRASLADADO'
  );
  const [notaPromedio, setNotaPromedio] = useState<string>(
    alumno.promedio_notas?.toString() || ''
  );
  const [observaciones, setObservaciones] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadCursos();
    }
  }, [open]);

  const loadCursos = async () => {
    try {
      const response = await cursosService.list({ activo: true });
      setCursos(response.items);
    } catch (error) {
      toast.error('No se pudieron cargar los cursos disponibles');
    }
  };

  const handleSubmit = async () => {
    if (!cursoDestino || !cursoOrigen?.id_curso) {
      toast.error('Seleccione un curso destino');
      return;
    }

    try {
      setIsSubmitting(true);

      // Preparar datos para el backend
      const promoverDto = {
        alumnoId: alumno.id_alumno,
        cursoDestinoId: parseInt(cursoDestino),
        anioActual: anioOrigen,
        anioDestino: anioDestino,
        estado: estado,
        observaciones: observaciones.trim() || undefined,
        notaPromedio: notaPromedio ? parseFloat(notaPromedio) : undefined,
      };

      // Llamar al endpoint de promoción
      const response = (await promocionesService.promoverAlumno(
        promoverDto
      )) as any;

      toast.success(
        `Alumno promovido exitosamente a ${response.cursoNuevo || 'nuevo curso'}`
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      const mensaje =
        error.response?.data?.message || 'No se pudo completar la promoción';
      toast.error(mensaje);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <ArrowUpRight className="h-5 w-5" />
            Promover Alumno
          </DialogTitle>
          <DialogDescription>
            El alumno pasó de grado y se reinscribió. Complete los detalles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Datos del alumno */}
          <div className="rounded-lg border bg-gray-50 p-3">
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-gray-500">Alumno</Label>
                <p className="font-medium text-sm">
                  {alumno.nombre} {alumno.apellido}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Curso Actual</Label>
                  <p className="text-sm font-medium">
                    {cursoOrigen?.nombre} {cursoOrigen?.seccion || ''}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Año Actual</Label>
                  <p className="text-sm font-medium">{anioOrigen}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mensaje informativo */}
          <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2.5">
            <span className="text-lg"></span>
            <p className="flex-1 text-xs text-blue-800">
              El alumno será promovido al siguiente curso. Complete los datos de
              promoción.
            </p>
          </div>

          {/* Datos de promoción */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="curso-destino" className="text-sm">
                Curso Destino
              </Label>
              <Select value={cursoDestino} onValueChange={setCursoDestino}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccione un curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map((curso) => (
                    <SelectItem
                      key={curso.id_curso}
                      value={curso.id_curso?.toString() || ''}
                    >
                      {curso.nombre} {curso.seccion || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="anio-destino" className="text-sm">
                  Año Nuevo
                </Label>
                <Select value={anioDestino} onValueChange={setAnioDestino}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={anioOrigen}>
                      {anioOrigen} (Repite)
                    </SelectItem>
                    <SelectItem value={(parseInt(anioOrigen) + 1).toString()}>
                      {parseInt(anioOrigen) + 1} (Normal)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="estado" className="text-sm">
                  Estado
                </Label>
                <Select
                  value={estado}
                  onValueChange={(
                    value: 'APROBADO' | 'REPROBADO' | 'TRASLADADO'
                  ) => setEstado(value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APROBADO">Aprobado</SelectItem>
                    <SelectItem value="REPROBADO">Reprobado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="nota" className="text-sm">
                Nota Promedio
              </Label>
              <Input
                id="nota"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={notaPromedio}
                onChange={(e) => setNotaPromedio(e.target.value)}
                placeholder="Ej: 8.5"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="observaciones" className="text-sm">
                Observaciones
              </Label>
              <Textarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={3}
                className="mt-1 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !cursoDestino}
            className="bg-blue-600 hover:bg-blue-700"
            type="button"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Promoción
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Diálogo para marcar alumno como No Reinscrito (Inactivo)
interface NoReinscritoDialogProps {
  alumno: AlumnoCurso;
  open: boolean;
  onClose: () => void;
  cursoActual: Curso | undefined;
  anioActual: string;
  onSuccess: () => void;
}

function NoReinscritoDialog({
  alumno,
  open,
  onClose,
  cursoActual,
  anioActual,
  onSuccess,
}: NoReinscritoDialogProps) {
  const [observaciones, setObservaciones] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleConfirm = () => {
    setShowConfirmDialog(true);
  };

  const handleSubmit = async () => {
    if (!cursoActual?.id_curso) {
      toast.error('Información del curso no disponible');
      return;
    }

    try {
      setIsSubmitting(true);

      // Preparar datos para el DTO FinalizarAlumnoDto
      const finalizarDto = {
        alumnoId: alumno.id_alumno,
        anioActual: anioActual,
        estado: 'NO REINSCRITO', // Estado específico para no reinscritos
        observaciones:
          observaciones || 'No se reinscribió para el siguiente año académico',
        marcarInactivo: true, // IMPORTANTE: Marca al alumno como inactivo
      };

      // Llamar al endpoint real de finalización
      await promocionesService.finalizarAlumno(finalizarDto);

      toast.success(
        `${alumno.nombre} ${alumno.apellido} retirado del curso (Inactivo)`
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      const mensaje =
        error.response?.data?.message ||
        error.message ||
        'No se pudo completar la operación';
      toast.error(`Error: ${mensaje}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-600">
            <ArrowRight className="h-5 w-5" />
            Retirar Alumno
          </DialogTitle>
          <DialogDescription>
            El alumno será retirado del curso actual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Datos del alumno */}
          <div className="rounded-lg border bg-gray-50 p-3">
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-gray-600">Alumno</Label>
                <p className="font-semibold">
                  {alumno.nombre} {alumno.apellido}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">Último Curso</Label>
                  <p className="text-sm font-medium">
                    {cursoActual?.nombre} {cursoActual?.seccion || ''}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Último Año</Label>
                  <p className="text-sm font-medium">{anioActual}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Advertencia */}
          <div className="flex gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-2.5">
            <span className="text-lg">⚠️</span>
            <p className="flex-1 text-xs text-yellow-800">
              Esta acción marcará al alumno como INACTIVO. No aparecerá en
              listas de cursos activos.
            </p>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones-inactivo">
              Motivo / Observaciones
            </Label>
            <Textarea
              id="observaciones-inactivo"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ejemplo: No se reinscribió, cambió de colegio..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting} type="button">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Retirar Alumno
          </Button>
        </div>
      </DialogContent>

      {/* Diálogo de Confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              Confirmar Acción
            </DialogTitle>
            <DialogDescription>
              Confirme que desea retirar al alumno del curso.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            <p className="text-sm">
              ¿Está seguro de retirar a{' '}
              <span className="font-semibold">
                {alumno.nombre} {alumno.apellido}
              </span>{' '}
              del curso actual?
            </p>
            <p className="mt-2 text-xs text-gray-600">
              El alumno será marcado como INACTIVO.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
              type="button"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowConfirmDialog(false);
                handleSubmit();
              }}
              disabled={isSubmitting}
              type="button"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sí, Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// Diálogo de Finalización de Estudios (Graduación)
interface FinalizarDialogProps {
  alumno: AlumnoCurso;
  open: boolean;
  onClose: () => void;
  cursoActual: Curso | undefined;
  anioActual: string;
  onSuccess: () => void;
}

function FinalizarDialog({
  alumno,
  open,
  onClose,
  cursoActual,
  anioActual,
  onSuccess,
}: FinalizarDialogProps) {
  const [notaPromedio, setNotaPromedio] = useState<string>(
    alumno.promedio_notas?.toString() || ''
  );
  const [observaciones, setObservaciones] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleConfirm = () => {
    setShowConfirmDialog(true);
  };

  const handleSubmit = async () => {
    if (!cursoActual?.id_curso) {
      toast.error('Información del curso no disponible');
      return;
    }

    try {
      setIsSubmitting(true);

      // Preparar datos para el DTO FinalizarAlumnoDto
      const finalizarDto = {
        alumnoId: alumno.id_alumno,
        anioActual: anioActual,
        estado: 'FINALIZADO', // Estado para graduados
        notaPromedio: notaPromedio ? parseFloat(notaPromedio) : undefined,
        observaciones:
          observaciones || 'Completó todos sus estudios en la institución',
        marcarInactivo: true, // IMPORTANTE: Marca al alumno como inactivo (ya no está en el sistema)
      };

      // Llamar al endpoint real de finalización
      await promocionesService.finalizarAlumno(finalizarDto);

      toast.success(
        `🎓 ${alumno.nombre} ${alumno.apellido} ha finalizado sus estudios exitosamente`
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      const mensaje =
        error.response?.data?.message ||
        'No se pudo completar la finalización de estudios';
      toast.error(mensaje);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <GraduationCap className="h-5 w-5" />
            Graduación - Finalizar Estudios
          </DialogTitle>
          <DialogDescription>
            El alumno ha completado todos sus estudios exitosamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Datos del alumno */}
          <div className="rounded-lg border bg-gray-50 p-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-green-600" />
                <div>
                  <Label className="text-xs text-gray-600">
                    Alumno Graduado
                  </Label>
                  <p className="font-semibold">
                    {alumno.nombre} {alumno.apellido}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">Último Curso</Label>
                  <p className="text-sm font-medium">
                    {cursoActual?.nombre} {cursoActual?.seccion || ''}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">
                    Año de Graduación
                  </Label>
                  <p className="text-sm font-medium">{anioActual}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mensaje de éxito */}
          <div className="flex gap-2 rounded-lg border border-green-200 bg-green-50 p-2.5">
            <span className="text-lg">🎓</span>
            <p className="flex-1 text-xs text-green-800">
              Este alumno completó exitosamente todos sus estudios.
            </p>
          </div>

          {/* Nota promedio */}
          <div className="space-y-2">
            <Label htmlFor="nota-final">Nota Promedio Final</Label>
            <Input
              id="nota-final"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={notaPromedio}
              onChange={(e) => setNotaPromedio(e.target.value)}
              placeholder="Nota promedio final"
            />
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones-final">
              Felicitaciones / Observaciones
            </Label>
            <Textarea
              id="observaciones-final"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ejemplo: Graduado con honores..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting} type="button">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            🎓 Registrar Graduación
          </Button>
        </div>
      </DialogContent>

      {/* Diálogo de Confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              Confirmar Graduación
            </DialogTitle>
            <DialogDescription>
              Confirme que desea registrar la graduación del alumno.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            <p className="text-sm">
              ¿Está seguro de marcar a{' '}
              <span className="font-semibold">
                {alumno.nombre} {alumno.apellido}
              </span>{' '}
              como Graduado?
            </p>
            <p className="mt-2 text-xs text-gray-600">
              El alumno será marcado como GRADUADO e INACTIVO.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
              type="button"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowConfirmDialog(false);
                handleSubmit();
              }}
              disabled={isSubmitting}
              type="button"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sí, Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
