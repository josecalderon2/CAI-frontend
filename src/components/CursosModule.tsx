import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
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
  School,
  Plus,
  Edit,
  Search,
  Users,
  MapPin,
  ToggleLeft,
  ToggleRight,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { cursosService } from '../api/services/cursosService';
import type { Curso as CursoType } from '../api/services/cursosService';
import { gradoAcademicoService } from '../api/services/gradoAcademicoService';

interface Jornada {
  id_jornada: number;
  nombre: string;
}

interface GradoAcademico {
  id_grado_academico: number;
  nombre: string;
  opcion?: string | null;
  n_anios?: number | null;
  nota_minima?: number | null;
  id_jornada?: number | null;
  rcup?: boolean | null;
  jornada?: Jornada | null;
}

interface Curso extends CursoType {
  // Datos adicionales para la UI (solo para la visualización en la interfaz)
  alumnosInscritos?: number; // Será reemplazado por alumnosCount cuando esté disponible desde el backend
}

export function CursosModule() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [gradosAcademicos, setGradosAcademicos] = useState<GradoAcademico[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para la paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5; // Cantidad de cursos por página

  // Función para calcular el porcentaje de ocupación
  const calcularPorcentajeOcupacion = (curso: Curso) => {
    if (!curso.cupo || curso.cupo === 0) return 0;
    const porcentaje = ((curso.alumnosInscritos || 0) / curso.cupo) * 100;
    return Math.min(100, Math.round(porcentaje));
  };
  const [stats, setStats] = useState({
    totalCursos: 0,
    cursosActivos: 0,
    capacidadTotal: 0,
    promedioAlumnosPorCurso: 0,
  });

  // Efecto para cargar los datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Cargar grados académicos
        const gradosData = await gradoAcademicoService.list({ limit: 100 });
        setGradosAcademicos(gradosData.items);

        // Cargar cursos
        const cursosData = await cursosService.list({ limit: 100 });
        setCursos(
          cursosData.items.map((curso) => ({
            ...curso,
            // Usar descripción del backend si existe, de lo contrario generar una
            descripcion:
              curso.descripcion ||
              `Curso de ${curso.gradoAcademico?.nombre || ''} ${curso.seccion || ''}`,
            // Usar el conteo real de alumnos del backend si está disponible, de lo contrario mostrar 0
            alumnosInscritos:
              curso.alumnosCount !== undefined ? curso.alumnosCount : 0,
          }))
        );

        // Cargar estadísticas
        const statsData = await cursosService.stats();
        setStats(statsData);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('Error al cargar los datos. Por favor, intente nuevamente.');
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);

  // Form data para curso
  const [formData, setFormData] = useState({
    seccion: '',
    id_grado_academico: 0,
    cupo: 30,
    aula: '',
    descripcion: '',
  });

  // Filtrar cursos
  const filteredCursos = cursos.filter((curso) => {
    const matchesSearch =
      curso.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curso.aula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curso.gradoAcademico?.nombre
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    // En el backend, el grado académico solo tiene id y nombre en la relación

    const matchesEstado =
      filterEstado === 'todos' ||
      (filterEstado === 'activo' ? curso.activo : !curso.activo);

    return matchesSearch && matchesEstado;
  });

  // Actualizar estados para la paginación
  useEffect(() => {
    setTotalItems(filteredCursos.length);
    setTotalPages(Math.max(1, Math.ceil(filteredCursos.length / itemsPerPage)));
  }, [filteredCursos.length, itemsPerPage]);

  // Cuando cambian los filtros, volvemos a la primera página
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterEstado]);

  // Aplicar paginación
  const paginatedCursos = filteredCursos.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleCreateCurso = () => {
    setEditingCurso(null);
    setFormData({
      seccion: '',
      id_grado_academico: 0,
      cupo: 30,
      aula: '',
      descripcion: '',
    });
    setIsDialogOpen(true);
  };

  const handleEditCurso = (curso: Curso) => {
    setEditingCurso(curso);
    setFormData({
      seccion: curso.seccion || '',
      id_grado_academico: curso.id_grado_academico || 0,
      cupo: curso.cupo || 30,
      aula: curso.aula || '',
      descripcion: curso.descripcion || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.seccion || !formData.id_grado_academico || !formData.aula) {
      toast.error(
        'Los campos sección, grado académico y aula son obligatorios'
      );
      return;
    }

    // Encontrar el grado académico seleccionado
    const gradoAcademico = gradosAcademicos.find(
      (g) => g.id_grado_academico === formData.id_grado_academico
    );

    if (!gradoAcademico) {
      toast.error('El grado académico seleccionado no es válido');
      return;
    }

    // Generar nombre del curso
    const nombreCurso = `${gradoAcademico.nombre} ${formData.seccion}`;

    // Verificar combinación única de grado y sección
    const cursoExists = cursos.some(
      (c) =>
        c.id_grado_academico === formData.id_grado_academico &&
        c.seccion === formData.seccion &&
        c.id_curso !== editingCurso?.id_curso
    );

    if (cursoExists) {
      toast.error('Ya existe un curso con ese grado y sección');
      return;
    }

    try {
      if (editingCurso) {
        // Editar curso existente mediante API
        const updatedCurso = await cursosService.update(
          editingCurso.id_curso as number,
          {
            nombre: nombreCurso,
            seccion: formData.seccion,
            id_grado_academico: formData.id_grado_academico,
            cupo: formData.cupo,
            aula: formData.aula,
            descripcion: formData.descripcion,
          }
        );

        // Actualizar estado local
        setCursos(
          cursos.map((c) =>
            c.id_curso === editingCurso.id_curso
              ? {
                  ...updatedCurso,
                  descripcion: formData.descripcion,
                  alumnosInscritos: c.alumnosInscritos,
                }
              : c
          )
        );
        toast.success('Curso actualizado correctamente');
      } else {
        // Crear nuevo curso mediante API
        const newCursoData = {
          nombre: nombreCurso,
          seccion: formData.seccion,
          id_grado_academico: formData.id_grado_academico,
          cupo: formData.cupo,
          aula: formData.aula,
          descripcion: formData.descripcion,
          activo: true,
        };

        const createdCurso = await cursosService.create(newCursoData);

        // Añadir al estado local con datos adicionales para la UI
        const newCurso: Curso = {
          ...createdCurso,
          descripcion: formData.descripcion,
          // Un curso nuevo siempre empezará con 0 alumnos
          alumnosInscritos:
            createdCurso.alumnosCount !== undefined
              ? createdCurso.alumnosCount
              : 0,
        };

        setCursos([...cursos, newCurso]);
        toast.success('Curso creado correctamente');
      }

      // Actualizar estadísticas después de cambios
      const statsData = await cursosService.stats();
      setStats(statsData);

      setIsDialogOpen(false);
    } catch (err) {
      console.error('Error guardando curso:', err);
      toast.error('Error al guardar el curso');
    }
  };
  const handleToggleStatus = async (curso: Curso) => {
    try {
      if (!curso.id_curso) {
        throw new Error('ID de curso inválido');
      }

      const newStatus = !curso.activo;

      if (newStatus) {
        // Activar curso
        await cursosService.restore(curso.id_curso);
      } else {
        // Desactivar curso
        await cursosService.remove(curso.id_curso);
      }

      // Actualizar estado local
      setCursos(
        cursos.map((c) =>
          c.id_curso === curso.id_curso ? { ...c, activo: newStatus } : c
        )
      );

      // Actualizar estadísticas
      const statsData = await cursosService.stats();
      setStats(statsData);

      toast.success(
        `Curso ${newStatus ? 'activado' : 'desactivado'} correctamente`
      );
    } catch (err) {
      console.error('Error cambiando estado del curso:', err);
      toast.error('Error al cambiar el estado del curso');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Cursos
          </h1>
          <p className="text-gray-600">
            Administra los cursos y secciones del colegio
          </p>
        </div>
        <Button
          onClick={handleCreateCurso}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Curso
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cursos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {cursos.length}
                </p>
              </div>
              <School className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cursos Activos</p>
                <p className="text-2xl font-bold text-green-600">
                  {cursos.filter((c) => c.activo).length}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Capacidad Total</p>
                <p className="text-2xl font-bold text-purple-600">
                  {cursos
                    .filter((c) => c.activo)
                    .reduce((sum, c) => sum + (c.cupo || 0), 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Alumnos Inscritos</p>
                <p className="text-2xl font-bold text-orange-600">
                  {cursos
                    .filter((c) => c.activo)
                    .reduce((sum, c) => sum + (c.alumnosInscritos || 0), 0)}
                </p>
              </div>
              <GraduationCap className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, grado o aula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de cursos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <School className="w-5 h-5" />
            <span>Lista de Cursos ({filteredCursos.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Grado Académico</TableHead>
                <TableHead>Aula</TableHead>
                <TableHead className="w-[150px]">Ocupación / Cupo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCursos.map((curso) => {
                return (
                  <TableRow key={curso.id_curso}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{curso.nombre}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-gray-600 truncate max-w-xs">
                          {curso.descripcion || '-'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {curso.gradoAcademico?.nombre}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{curso.aula}</span>
                      </div>
                    </TableCell>
                    <TableCell className="w-[150px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>
                            {curso.alumnosInscritos || 0} / {curso.cupo}
                          </span>
                          <span className="font-medium">
                            {calcularPorcentajeOcupacion(curso)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              calcularPorcentajeOcupacion(curso) > 90
                                ? 'bg-red-500'
                                : calcularPorcentajeOcupacion(curso) > 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${calcularPorcentajeOcupacion(curso)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={curso.activo ? 'default' : 'destructive'}>
                        {curso.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCurso(curso)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(curso)}
                          className={
                            curso.activo
                              ? 'text-orange-600 hover:text-orange-700'
                              : 'text-green-600 hover:text-green-700'
                          }
                          title={
                            curso.activo ? 'Desactivar curso' : 'Activar curso'
                          }
                        >
                          {curso.activo ? (
                            <ToggleLeft className="w-4 h-4" />
                          ) : (
                            <ToggleRight className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between space-x-2 py-4">
            <p className="text-sm text-gray-600">
              Mostrando {(page - 1) * itemsPerPage + 1} -{' '}
              {Math.min(page * itemsPerPage, totalItems)} de {totalItems}{' '}
              resultados
              {(searchTerm.trim() !== '' || filterEstado !== 'todos') && (
                <Badge
                  variant="outline"
                  className="ml-2 bg-blue-50 text-blue-700"
                >
                  Filtrado
                </Badge>
              )}
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
        </CardContent>
      </Card>

      {/* Dialog para crear/editar curso */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCurso ? 'Editar Curso' : 'Crear Nuevo Curso'}
            </DialogTitle>
            <DialogDescription>
              {editingCurso
                ? 'Modifica la información del curso'
                : 'Completa los datos del nuevo curso'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grado_academico">Grado Académico *</Label>
                <Select
                  value={formData.id_grado_academico.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      id_grado_academico: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un grado" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradosAcademicos.map((grado: GradoAcademico) => (
                      <SelectItem
                        key={grado.id_grado_academico}
                        value={grado.id_grado_academico.toString()}
                      >
                        {grado.nombre} {grado.opcion ? `- ${grado.opcion}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="seccion">Sección *</Label>
                <Input
                  id="seccion"
                  value={formData.seccion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      seccion: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="Ej: A, B, C"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aula">Aula *</Label>
                <Input
                  id="aula"
                  value={formData.aula}
                  onChange={(e) =>
                    setFormData({ ...formData, aula: e.target.value })
                  }
                  placeholder="Ej: Aula 201"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cupo">Cupo Máximo *</Label>
                <Input
                  id="cupo"
                  type="number"
                  min="10"
                  max="50"
                  value={formData.cupo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cupo: parseInt(e.target.value) || 30,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                placeholder="Descripción del curso..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingCurso ? 'Actualizar' : 'Crear'} Curso
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
