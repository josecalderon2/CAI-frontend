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
import { toast } from 'sonner';
import {
  ArrowUpRight,
  ArrowRight,
  GraduationCap,
  Users,
  UserCheck,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

// Tipos locales (sin importar del servicio)
interface AlumnoCurso {
  id_alumno_curso: number;
  id_alumno: number;
  id_curso: number;
  nombre: string;
  apellido: string;
  numero_matricula: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
  promedio_notas?: number | null;
  anio_academico: string;
}

interface Curso {
  id_curso: number;
  nombre: string;
  seccion?: string | null;
  activo: boolean;
}

interface HistorialAcademico {
  anioAcademico: string;
  curso: {
    nombre: string;
    seccion: string | null;
    gradoAcademico: {
      nombre: string;
    };
  };
  estadoFinal: string | null;
  notaPromedio: number | null;
  fechaInicio: Date;
  fechaFin: Date | null;
  observaciones: string | null;
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

export function PromocionesModule() {
  const [tab, setTab] = useState('alumnos-curso');
  const currentYear = new Date().getFullYear().toString();

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Sistema de Promociones y Traslados
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

  useEffect(() => {
    loadCursos();
  }, []);

  useEffect(() => {
    if (cursoSeleccionado) {
      loadAlumnos();
    }
  }, [cursoSeleccionado, anioAcademico]);

  // Auto-seleccionar el primer curso al cargar
  useEffect(() => {
    if (cursos.length > 0 && !cursoSeleccionado) {
      setCursoSeleccionado(cursos[0].id_curso.toString());
    }
  }, [cursos]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAlumnos(alumnos);
    } else {
      const normalized = searchTerm
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      setFilteredAlumnos(
        alumnos.filter((alumno) => {
          const fullName = `${alumno.nombre} ${alumno.apellido}`
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          return (
            fullName.includes(normalized) ||
            alumno.numero_matricula.includes(normalized)
          );
        })
      );
    }
  }, [alumnos, searchTerm]);

  const loadCursos = async () => {
    try {
      setIsLoading(true);
      // Datos simulados de cursos
      const cursosMock: Curso[] = [
        { id_curso: 1, nombre: 'Primer Grado', seccion: 'A', activo: true },
        { id_curso: 2, nombre: 'Primer Grado', seccion: 'B', activo: true },
        { id_curso: 3, nombre: 'Segundo Grado', seccion: 'A', activo: true },
        { id_curso: 4, nombre: 'Tercer Grado', seccion: 'A', activo: true },
        { id_curso: 5, nombre: 'Cuarto Grado', seccion: 'A', activo: true },
      ];
      setCursos(cursosMock);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      toast.error('No se pudieron cargar los cursos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlumnos = async () => {
    if (!cursoSeleccionado) return;

    try {
      setIsLoading(true);
      // Datos simulados de alumnos
      const alumnosMock: AlumnoCurso[] = [
        {
          id_alumno_curso: 1,
          id_alumno: 1,
          id_curso: parseInt(cursoSeleccionado),
          nombre: 'Juan',
          apellido: 'Pérez',
          numero_matricula: '2024-001',
          estado: 'ACTIVO',
          promedio_notas: 8.5,
          anio_academico: anioAcademico,
        },
        {
          id_alumno_curso: 2,
          id_alumno: 2,
          id_curso: parseInt(cursoSeleccionado),
          nombre: 'María',
          apellido: 'González',
          numero_matricula: '2024-002',
          estado: 'ACTIVO',
          promedio_notas: 9.2,
          anio_academico: anioAcademico,
        },
        {
          id_alumno_curso: 3,
          id_alumno: 3,
          id_curso: parseInt(cursoSeleccionado),
          nombre: 'Carlos',
          apellido: 'Martínez',
          numero_matricula: '2024-003',
          estado: 'ACTIVO',
          promedio_notas: 7.8,
          anio_academico: anioAcademico,
        },
      ];
      setAlumnos(alumnosMock);
      setAlumnosSeleccionados([]);
    } catch (error) {
      console.error('Error al cargar alumnos:', error);
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
    if (alumnosSeleccionados.length === filteredAlumnos.length) {
      setAlumnosSeleccionados([]);
    } else {
      setAlumnosSeleccionados(filteredAlumnos.map((a) => a.id_alumno));
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
            placeholder="Buscar por nombre o matrícula"
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
                      alumnosSeleccionados.length === filteredAlumnos.length &&
                      filteredAlumnos.length > 0
                    }
                    onCheckedChange={handleSelectAllChange}
                    id="select-all"
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Seleccionar todos ({filteredAlumnos.length})
                  </label>
                </div>

                <div className="space-x-2">
                  <Button
                    variant="outline"
                    disabled={alumnosSeleccionados.length === 0}
                    onClick={() =>
                      toast.info(
                        "Promoción masiva disponible en la pestaña 'Promoción Masiva'"
                      )
                    }
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Acciones Masivas
                  </Button>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Promedio</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlumnos.map((alumno) => (
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
                        <TableCell>{alumno.numero_matricula}</TableCell>
                        <TableCell>
                          {alumno.nombre} {alumno.apellido}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              alumno.estado === 'ACTIVO'
                                ? 'bg-green-100 text-green-800'
                                : alumno.estado === 'SUSPENDIDO'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {alumno.estado}
                          </span>
                        </TableCell>
                        <TableCell>
                          {alumno.promedio_notas?.toFixed(2) || '-'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
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
                            variant="outline"
                            onClick={() => abrirDialogoTraslado(alumno)}
                          >
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Trasladar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirDialogoFinalizar(alumno)}
                          >
                            <GraduationCap className="h-4 w-4 mr-1" />
                            Finalizar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
          cursoOrigen={cursos.find(
            (c) => c.id_curso === parseInt(cursoSeleccionado)
          )}
          anioOrigen={anioAcademico}
          tipo="promocion"
          onSuccess={loadAlumnos}
        />
      )}

      {/* Modal de Traslado */}
      {alumnoSeleccionado && (
        <PromocionDialog
          alumno={alumnoSeleccionado}
          open={showTrasladadoDialog}
          onClose={() => setShowTrasladadoDialog(false)}
          cursoOrigen={cursos.find(
            (c) => c.id_curso === parseInt(cursoSeleccionado)
          )}
          anioOrigen={anioAcademico}
          tipo="traslado"
          onSuccess={loadAlumnos}
        />
      )}

      {/* Modal de Finalización */}
      {alumnoSeleccionado && (
        <FinalizarDialog
          alumno={alumnoSeleccionado}
          open={showFinalizarDialog}
          onClose={() => setShowFinalizarDialog(false)}
          cursoActual={cursos.find(
            (c) => c.id_curso === parseInt(cursoSeleccionado)
          )}
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
      setCursoOrigen(cursos[0].id_curso.toString());
      setCursoDestino(cursos[1]?.id_curso.toString() || '');
    }
  }, [cursos]);

  const loadCursos = async () => {
    try {
      setIsLoading(true);
      // Datos simulados de cursos
      const cursosMock: Curso[] = [
        { id_curso: 1, nombre: 'Primer Grado', seccion: 'A', activo: true },
        { id_curso: 2, nombre: 'Primer Grado', seccion: 'B', activo: true },
        { id_curso: 3, nombre: 'Segundo Grado', seccion: 'A', activo: true },
        { id_curso: 4, nombre: 'Tercer Grado', seccion: 'A', activo: true },
        { id_curso: 5, nombre: 'Cuarto Grado', seccion: 'A', activo: true },
      ];
      setCursos(cursosMock);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      toast.error('No se pudieron cargar los cursos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlumnos = async () => {
    if (!cursoOrigen) return;

    try {
      setIsLoading(true);
      // Datos simulados de alumnos
      const alumnosMock: AlumnoCurso[] = [
        {
          id_alumno_curso: 1,
          id_alumno: 1,
          id_curso: parseInt(cursoOrigen),
          nombre: 'Juan',
          apellido: 'Pérez',
          numero_matricula: '2024-001',
          estado: 'ACTIVO',
          promedio_notas: 8.5,
          anio_academico: anioOrigen,
        },
        {
          id_alumno_curso: 2,
          id_alumno: 2,
          id_curso: parseInt(cursoOrigen),
          nombre: 'María',
          apellido: 'González',
          numero_matricula: '2024-002',
          estado: 'ACTIVO',
          promedio_notas: 9.2,
          anio_academico: anioOrigen,
        },
        {
          id_alumno_curso: 3,
          id_alumno: 3,
          id_curso: parseInt(cursoOrigen),
          nombre: 'Carlos',
          apellido: 'Martínez',
          numero_matricula: '2024-003',
          estado: 'ACTIVO',
          promedio_notas: 7.8,
          anio_academico: anioOrigen,
        },
      ];

      setAlumnos(alumnosMock);
      setAlumnosSeleccionados([]);

      // Inicializa el estado para cada alumno
      const initialData: { [id: number]: any } = {};
      alumnosMock.forEach((alumno: AlumnoCurso) => {
        initialData[alumno.id_alumno] = {
          estado: 'APROBADO',
          nota_promedio: alumno.promedio_notas || undefined,
          observaciones: '',
        };
      });
      setAlumnosData(initialData);
    } catch (error) {
      console.error('Error al cargar alumnos:', error);
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

      // Simulación de promoción masiva
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(
        `${alumnosSeleccionados.length} alumnos promovidos con éxito`
      );

      // Recargar la lista de alumnos
      loadAlumnos();
    } catch (error) {
      console.error('Error al realizar promoción masiva:', error);
      toast.error('No se pudo completar la promoción masiva');
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
                  <Button
                    variant="outline"
                    disabled={alumnosSeleccionados.length === 0}
                    onClick={() => aplicarEstadoMasivo('TRASLADADO')}
                  >
                    Trasladar Seleccionados
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
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<string>('1');
  const [anioAcademico, setAnioAcademico] = useState<string>('todos');
  const [historialAcademico, setHistorialAcademico] = useState<
    HistorialAcademico[]
  >([]);
  const [alumnoInfo, setAlumnoInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistorial = async () => {
    if (!alumnoSeleccionado) return;

    try {
      setIsLoading(true);

      const alumnoId = parseInt(alumnoSeleccionado);

      // Datos simulados de diferentes alumnos
      const alumnos = [
        { id: 1, nombre: 'Juan', apellido: 'Pérez' },
        { id: 2, nombre: 'María', apellido: 'González' },
        { id: 3, nombre: 'Carlos', apellido: 'Martínez' },
      ];

      const alumno = alumnos.find((a) => a.id === alumnoId) || alumnos[0];

      // Datos simulados de historial académico
      const historialMock: HistorialAcademico[] = [
        {
          anioAcademico: '2025',
          curso: {
            nombre: 'Primer Grado',
            seccion: 'A',
            gradoAcademico: { nombre: 'Primer Grado' },
          },
          estadoFinal: 'APROBADO',
          notaPromedio: alumnoId === 1 ? 8.5 : alumnoId === 2 ? 9.2 : 7.8,
          fechaInicio: new Date('2025-01-15'),
          fechaFin: new Date('2025-11-30'),
          observaciones: 'Excelente rendimiento académico',
        },
        {
          anioAcademico: '2024',
          curso: {
            nombre: 'Parvularia',
            seccion: 'B',
            gradoAcademico: { nombre: 'Parvularia' },
          },
          estadoFinal: 'APROBADO',
          notaPromedio: alumnoId === 1 ? 9.0 : alumnoId === 2 ? 8.8 : 8.2,
          fechaInicio: new Date('2024-01-15'),
          fechaFin: new Date('2024-11-30'),
          observaciones: 'Adaptación exitosa',
        },
        {
          anioAcademico: '2023',
          curso: {
            nombre: 'Pre-kinder',
            seccion: 'A',
            gradoAcademico: { nombre: 'Pre-kinder' },
          },
          estadoFinal: 'APROBADO',
          notaPromedio: alumnoId === 1 ? 8.7 : alumnoId === 2 ? 9.5 : 7.5,
          fechaInicio: new Date('2023-01-15'),
          fechaFin: new Date('2023-11-30'),
          observaciones: 'Buen desempeño general',
        },
      ];

      // Simular info del alumno
      setAlumnoInfo({
        id_alumno: alumnoId,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
      });

      setHistorialAcademico(historialMock);
    } catch (error) {
      console.error('Error al cargar historial académico:', error);
      toast.error('No se pudo cargar el historial académico');
      setHistorialAcademico([]);
      setAlumnoInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (alumnoSeleccionado) {
      loadHistorial();
    }
  }, [alumnoSeleccionado]);

  const handleGenerarInforme = () => {
    toast.info('Funcionalidad de generación de informes en desarrollo');
  };

  // Filtrar historial por año académico si no es "todos"
  const historialFiltrado =
    anioAcademico === 'todos'
      ? historialAcademico
      : historialAcademico.filter((h) => h.anioAcademico === anioAcademico);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="alumno">Buscar Alumno</Label>
          <Select
            value={alumnoSeleccionado}
            onValueChange={setAlumnoSeleccionado}
          >
            <SelectTrigger id="alumno">
              <SelectValue placeholder="Seleccione un alumno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Juan Pérez</SelectItem>
              <SelectItem value="2">María González</SelectItem>
              <SelectItem value="3">Carlos Martínez</SelectItem>
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
                    {historialFiltrado.map((registro, index) => (
                      <TableRow key={`${registro.anioAcademico}-${index}`}>
                        <TableCell>{registro.anioAcademico}</TableCell>
                        <TableCell>
                          {registro.curso.nombre} {registro.curso.seccion || ''}
                        </TableCell>
                        <TableCell>
                          {registro.curso.gradoAcademico.nombre}
                        </TableCell>
                        <TableCell>
                          {registro.estadoFinal ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                registro.estadoFinal === 'APROBADO'
                                  ? 'bg-green-100 text-green-800'
                                  : registro.estadoFinal === 'REPROBADO'
                                    ? 'bg-red-100 text-red-800'
                                    : registro.estadoFinal === 'FINALIZADO'
                                      ? 'bg-blue-100 text-blue-800'
                                      : registro.estadoFinal === 'TRASLADADO'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {registro.estadoFinal}
                            </span>
                          ) : (
                            <span className="text-gray-400">En curso</span>
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
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {alumnoSeleccionado
                ? 'No hay registros de historial académico para este alumno'
                : 'Ingrese un ID de alumno para ver su historial académico'}
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
  const [isLoading, setIsLoading] = useState(false); // Se usa para controlar la carga de cursos
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadCursos();
    }
  }, [open]);

  const loadCursos = async () => {
    try {
      setIsLoading(true);
      // Datos simulados de cursos
      const cursosMock: Curso[] = [
        { id_curso: 1, nombre: 'Primer Grado', seccion: 'A', activo: true },
        { id_curso: 2, nombre: 'Primer Grado', seccion: 'B', activo: true },
        { id_curso: 3, nombre: 'Segundo Grado', seccion: 'A', activo: true },
        { id_curso: 4, nombre: 'Tercer Grado', seccion: 'A', activo: true },
        { id_curso: 5, nombre: 'Cuarto Grado', seccion: 'A', activo: true },
      ];
      setCursos(cursosMock);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      toast.error('No se pudieron cargar los cursos disponibles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!cursoDestino || !cursoOrigen?.id_curso) {
      toast.error('Seleccione un curso destino');
      return;
    }

    try {
      setIsSubmitting(true);

      // Simulación de promoción
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(
        `${tipo === 'promocion' ? 'Promoción' : 'Traslado'} realizado con éxito`
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error(`Error al realizar ${tipo}:`, error);
      toast.error(`No se pudo completar el ${tipo}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {tipo === 'promocion' ? 'Promover Alumno' : 'Trasladar Alumno'}
          </DialogTitle>
          <DialogDescription>
            {tipo === 'promocion'
              ? 'Complete los detalles para promover al alumno al siguiente nivel.'
              : 'Complete los detalles para trasladar al alumno a otro curso.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Datos del alumno */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-500">Alumno</Label>
              <div className="font-medium mt-1">
                {alumno.nombre} {alumno.apellido}
              </div>
            </div>
            <div>
              <Label className="text-gray-500">Matrícula</Label>
              <div className="font-medium mt-1">{alumno.numero_matricula}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-500">Curso Actual</Label>
              <div className="font-medium mt-1">
                {cursoOrigen?.nombre} {cursoOrigen?.seccion || ''}
              </div>
            </div>
            <div>
              <Label className="text-gray-500">Año Académico Actual</Label>
              <div className="font-medium mt-1">{anioOrigen}</div>
            </div>
          </div>

          <div className="border-t my-2"></div>

          {/* Datos de promoción/traslado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="curso-destino">Curso Destino</Label>
              <Select value={cursoDestino} onValueChange={setCursoDestino}>
                <SelectTrigger>
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
            <div>
              <Label htmlFor="anio-destino">Año Académico Destino</Label>
              <Select value={anioDestino} onValueChange={setAnioDestino}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un año" />
                </SelectTrigger>
                <SelectContent>
                  {tipo === 'promocion' ? (
                    <>
                      <SelectItem value={anioOrigen}>{anioOrigen}</SelectItem>
                      <SelectItem value={(parseInt(anioOrigen) + 1).toString()}>
                        {parseInt(anioOrigen) + 1}
                      </SelectItem>
                    </>
                  ) : (
                    <SelectItem value={anioOrigen}>{anioOrigen}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={estado}
              onValueChange={(value: 'APROBADO' | 'REPROBADO' | 'TRASLADADO') =>
                setEstado(value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un estado" />
              </SelectTrigger>
              <SelectContent>
                {tipo === 'promocion' ? (
                  <>
                    <SelectItem value="APROBADO">APROBADO</SelectItem>
                    <SelectItem value="REPROBADO">REPROBADO</SelectItem>
                  </>
                ) : (
                  <SelectItem value="TRASLADADO">TRASLADADO</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="nota">Nota Promedio</Label>
            <Input
              id="nota"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={notaPromedio}
              onChange={(e) => setNotaPromedio(e.target.value)}
              placeholder="Nota promedio"
            />
          </div>

          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Escriba las observaciones aquí"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !cursoDestino}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tipo === 'promocion' ? 'Promover' : 'Trasladar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Diálogo de Finalización de Estudios
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

  const handleSubmit = async () => {
    if (!cursoActual?.id_curso) {
      toast.error('Información del curso no disponible');
      return;
    }

    try {
      setIsSubmitting(true);

      // Simulación de finalización
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Finalización de estudios registrada con éxito');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al finalizar estudios:', error);
      toast.error('No se pudo completar la finalización de estudios');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Finalizar Estudios</DialogTitle>
          <DialogDescription>
            Registre la finalización de estudios del alumno.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Datos del alumno */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-500">Alumno</Label>
              <div className="font-medium mt-1">
                {alumno.nombre} {alumno.apellido}
              </div>
            </div>
            <div>
              <Label className="text-gray-500">Matrícula</Label>
              <div className="font-medium mt-1">{alumno.numero_matricula}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-500">Curso Actual</Label>
              <div className="font-medium mt-1">
                {cursoActual?.nombre} {cursoActual?.seccion || ''}
              </div>
            </div>
            <div>
              <Label className="text-gray-500">Año Académico</Label>
              <div className="font-medium mt-1">{anioActual}</div>
            </div>
          </div>

          <div className="border-t my-2"></div>

          <div>
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

          <div>
            <Label htmlFor="observaciones-final">Observaciones</Label>
            <Textarea
              id="observaciones-final"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Escriba las observaciones aquí"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Finalizar Estudios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
