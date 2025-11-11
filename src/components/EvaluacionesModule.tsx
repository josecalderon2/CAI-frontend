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
  ClipboardList,
  Plus,
  Edit,
  Trash2,
  Search,
  Award,
  Calendar,
  BookOpen,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { evaluacionesService, type Evaluacion } from '../api/services/evaluacionesService';
import { tiposEvaluacionService, type TipoEvaluacion } from '../api/services/tiposEvaluacionService';
import { asignaturasService, type Asignatura } from '../api/services/asignaturasService';

export function EvaluacionesModule() {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [tiposEvaluacion, setTiposEvaluacion] = useState<TipoEvaluacion[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Cargar catálogos
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [tiposData, asignaturasData] = await Promise.all([
          tiposEvaluacionService.findAll(),
          asignaturasService.findMisAsignaturas(), // Solo las asignaturas del orientador
        ]);

        setTiposEvaluacion(tiposData);
        setAsignaturas(asignaturasData);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
        toast.error('No se pudieron cargar los catálogos base');
      }
    };

    fetchCatalogos();
  }, []);

  // Cargar evaluaciones
  const fetchEvaluaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      // Usar el nuevo endpoint que solo trae evaluaciones de las asignaturas asignadas al orientador
      const data = await evaluacionesService.findByMisAsignaturas();
      setEvaluaciones(data);
      setTotalItems(data.length);
      setTotalPages(Math.max(1, Math.ceil(data.length / itemsPerPage)));
      setPage(1);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al cargar evaluaciones.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluaciones();
  }, []);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAsignatura, setFilterAsignatura] = useState<string>('todas');
  const [filterTrimestre, setFilterTrimestre] = useState<string>('todos');
  const [filterAnio, setFilterAnio] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEvaluacion, setEditingEvaluacion] = useState<Evaluacion | null>(null);
  const [deletingEvaluacion, setDeletingEvaluacion] = useState<Evaluacion | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    nombre: '',
    puntaje_maximo: 10,
    puntaje_minimo: 0,
    id_tipo_evaluacion: 0,
    id_asignatura: 0,
    mes: undefined as number | undefined,
    trimestre: undefined as number | undefined,
    periodo: undefined as number | undefined,
  });

  // Obtener años únicos de las evaluaciones
  const aniosDisponibles = Array.from(
    new Set(evaluaciones.map((e) => e.anio_academico))
  ).sort((a, b) => b.localeCompare(a));

  // Filtrar evaluaciones
  const filteredEvaluaciones = evaluaciones.filter((evaluacion) => {
    const matchesSearch = evaluacion.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesAsignatura =
      filterAsignatura === 'todas' ||
      evaluacion.asignatura.id_asignatura.toString() === filterAsignatura;

    const matchesTrimestre =
      filterTrimestre === 'todos' ||
      (evaluacion.trimestre && evaluacion.trimestre.toString() === filterTrimestre);

    const matchesAnio =
      filterAnio === 'todos' || evaluacion.anio_academico === filterAnio;

    return matchesSearch && matchesAsignatura && matchesTrimestre && matchesAnio;
  });

  // Efectos para la paginación
  useEffect(() => {
    setTotalItems(filteredEvaluaciones.length);
    setTotalPages(
      Math.max(1, Math.ceil(filteredEvaluaciones.length / itemsPerPage))
    );

    if (page > Math.ceil(filteredEvaluaciones.length / itemsPerPage)) {
      setPage(
        Math.max(1, Math.ceil(filteredEvaluaciones.length / itemsPerPage))
      );
    }
  }, [filteredEvaluaciones.length, itemsPerPage, page]);

  // Datos paginados
  const paginatedEvaluaciones = filteredEvaluaciones.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Crear
  const handleCreateEvaluacion = () => {
    setEditingEvaluacion(null);
    setFormData({
      nombre: '',
      puntaje_maximo: 10,
      puntaje_minimo: 0,
      id_tipo_evaluacion: 0,
      id_asignatura: 0,
      mes: undefined,
      trimestre: undefined,
      periodo: undefined,
    });
    setIsDialogOpen(true);
  };

  // Editar
  const handleEditEvaluacion = (evaluacion: Evaluacion) => {
    setEditingEvaluacion(evaluacion);
    setFormData({
      nombre: evaluacion.nombre,
      puntaje_maximo: evaluacion.puntaje_maximo,
      puntaje_minimo: evaluacion.puntaje_minimo,
      id_tipo_evaluacion: evaluacion.tipoEvaluacion.id_tipo_evaluacion,
      id_asignatura: evaluacion.asignatura.id_asignatura,
      mes: evaluacion.mes,
      trimestre: evaluacion.trimestre,
      periodo: evaluacion.periodo,
    });
    setIsDialogOpen(true);
  };

  // Confirmar eliminación
  const handleDeleteClick = (evaluacion: Evaluacion) => {
    setDeletingEvaluacion(evaluacion);
    setIsDeleteDialogOpen(true);
  };

  // Eliminar
  const handleDelete = async () => {
    if (!deletingEvaluacion) return;

    try {
      setSaving(true);
      await evaluacionesService.remove(deletingEvaluacion.id_evaluacion);
      toast.success('Evaluación eliminada correctamente');
      await fetchEvaluaciones();
      setIsDeleteDialogOpen(false);
      setDeletingEvaluacion(null);
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Error al eliminar la evaluación.';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  // Guardar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error('El nombre de la evaluación es obligatorio.');
      return;
    }

    if (formData.id_tipo_evaluacion === 0) {
      toast.error('Debe seleccionar un tipo de evaluación.');
      return;
    }

    if (formData.id_asignatura === 0) {
      toast.error('Debe seleccionar una asignatura.');
      return;
    }

    if (formData.puntaje_maximo < formData.puntaje_minimo) {
      toast.error('El puntaje máximo debe ser mayor al mínimo.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        nombre: formData.nombre,
        puntaje_maximo: formData.puntaje_maximo,
        puntaje_minimo: formData.puntaje_minimo,
        id_tipo_evaluacion: formData.id_tipo_evaluacion,
        id_asignatura: formData.id_asignatura,
        mes: formData.mes,
        trimestre: formData.trimestre,
        periodo: formData.periodo,
      };

      if (editingEvaluacion) {
        await evaluacionesService.update(editingEvaluacion.id_evaluacion, payload);
        toast.success('Evaluación actualizada correctamente');
      } else {
        await evaluacionesService.create(payload);
        toast.success('Evaluación creada correctamente');
      }

      await fetchEvaluaciones();
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Error al guardar la evaluación.';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  // Estados de carga
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando evaluaciones...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <p className="text-red-600 font-medium">{error}</p>
        <Button
          onClick={fetchEvaluaciones}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  // Vista principal
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Evaluaciones
          </h1>
          <p className="text-gray-600">
            Administra las evaluaciones de tus asignaturas
          </p>
        </div>
        <Button
          onClick={handleCreateEvaluacion}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Evaluación
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Evaluaciones</p>
                <p className="text-2xl font-bold text-blue-600">
                  {evaluaciones.length}
                </p>
              </div>
              <ClipboardList className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Asignaturas con Evaluaciones</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Set(evaluaciones.map((e) => e.asignatura.id_asignatura)).size}
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
                <p className="text-sm text-gray-600">Tipos de Evaluación</p>
                <p className="text-2xl font-bold text-purple-600">
                  {tiposEvaluacion.length}
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Año Académico Actual</p>
                <p className="text-2xl font-bold text-orange-600">
                  {new Date().getFullYear()}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Buscador */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre de evaluación..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtros adicionales */}
            <div className="flex flex-col md:flex-row gap-4">
              <Select
                value={filterAsignatura}
                onValueChange={(value) => {
                  setFilterAsignatura(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-[250px]">
                  <SelectValue placeholder="Filtrar por asignatura" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las asignaturas</SelectItem>
                  {asignaturas.map((asignatura) => (
                    <SelectItem
                      key={asignatura.id_asignatura}
                      value={asignatura.id_asignatura.toString()}
                    >
                      {asignatura.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterTrimestre}
                onValueChange={(value) => {
                  setFilterTrimestre(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por trimestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los trimestres</SelectItem>
                  <SelectItem value="1">Trimestre 1</SelectItem>
                  <SelectItem value="2">Trimestre 2</SelectItem>
                  <SelectItem value="3">Trimestre 3</SelectItem>
                  <SelectItem value="4">Trimestre 4</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterAnio}
                onValueChange={(value) => {
                  setFilterAnio(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los años</SelectItem>
                  {aniosDisponibles.map((anio) => (
                    <SelectItem key={anio} value={anio}>
                      {anio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ClipboardList className="w-5 h-5" />
            <span>Lista de Evaluaciones ({totalItems})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Asignatura</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Puntaje</TableHead>
                <TableHead>Trimestre</TableHead>
                <TableHead>Año</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEvaluaciones.length > 0 ? (
                paginatedEvaluaciones.map((evaluacion) => (
                  <TableRow key={evaluacion.id_evaluacion}>
                    <TableCell>
                      <p className="font-medium">{evaluacion.nombre}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-blue-700 border-blue-200 bg-blue-50"
                      >
                        {evaluacion.asignatura.nombre}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-purple-700 border-purple-200 bg-purple-50"
                      >
                        {evaluacion.tipoEvaluacion.nombre} ({evaluacion.tipoEvaluacion.porcentaje}%)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {evaluacion.puntaje_minimo} - {evaluacion.puntaje_maximo}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {evaluacion.trimestre ? (
                        <Badge variant="outline">T{evaluacion.trimestre}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{evaluacion.anio_academico}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEvaluacion(evaluacion)}
                          title="Editar evaluación"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(evaluacion)}
                          className="text-red-600 hover:text-red-700"
                          title="Eliminar evaluación"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-gray-500 py-6"
                  >
                    No hay evaluaciones registradas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Paginación */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <p className="text-sm text-gray-600">
              Mostrando{' '}
              <span className="font-semibold">
                {paginatedEvaluaciones.length}
              </span>{' '}
              de <span className="font-semibold">{totalItems}</span> resultados
              {(searchTerm ||
                filterAsignatura !== 'todas' ||
                filterTrimestre !== 'todos' ||
                filterAnio !== 'todos') && (
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

      {/* Dialog para crear/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEvaluacion
                ? 'Editar Evaluación'
                : 'Crear Nueva Evaluación'}
            </DialogTitle>
            <DialogDescription>
              {editingEvaluacion
                ? 'Modifica la información de la evaluación'
                : 'Completa los datos de la nueva evaluación'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre de la Evaluación *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                placeholder="Ej: Examen Parcial de Matemáticas"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Evaluación *</Label>
                <Select
                  value={formData.id_tipo_evaluacion.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      id_tipo_evaluacion: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposEvaluacion.map((tipo) => (
                      <SelectItem
                        key={tipo.id_tipo_evaluacion}
                        value={tipo.id_tipo_evaluacion.toString()}
                      >
                        {tipo.nombre} ({tipo.porcentaje}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Asignatura *</Label>
                <Select
                  value={formData.id_asignatura.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      id_asignatura: parseInt(value),
                    })
                  }
                  disabled={!!editingEvaluacion}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una asignatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {asignaturas.map((asignatura) => (
                      <SelectItem
                        key={asignatura.id_asignatura}
                        value={asignatura.id_asignatura.toString()}
                      >
                        {asignatura.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingEvaluacion && (
                  <p className="text-xs text-gray-500 mt-1">
                    No se puede cambiar la asignatura al editar
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="puntaje_minimo">Puntaje Mínimo</Label>
                <Input
                  id="puntaje_minimo"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.puntaje_minimo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      puntaje_minimo: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="puntaje_maximo">Puntaje Máximo *</Label>
                <Input
                  id="puntaje_maximo"
                  type="number"
                  min="0"
                  step="0.1"
                  max="10"
                  value={formData.puntaje_maximo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      puntaje_maximo: parseFloat(e.target.value) || 10,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="trimestre">Trimestre</Label>
                <Select
                  value={formData.trimestre?.toString() || 'none'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      trimestre: value === 'none' ? undefined : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin trimestre</SelectItem>
                    <SelectItem value="1">Trimestre 1</SelectItem>
                    <SelectItem value="2">Trimestre 2</SelectItem>
                    <SelectItem value="3">Trimestre 3</SelectItem>
                    <SelectItem value="4">Trimestre 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="mes">Mes</Label>
                <Input
                  id="mes"
                  type="number"
                  min="1"
                  max="12"
                  value={formData.mes || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mes: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="1-12"
                />
              </div>

              <div>
                <Label htmlFor="periodo">Periodo</Label>
                <Input
                  id="periodo"
                  type="number"
                  min="1"
                  value={formData.periodo || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      periodo: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="Ej: 1, 2, 3..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => !saving && setIsDialogOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingEvaluacion ? 'Actualizando...' : 'Guardando...'}
                  </>
                ) : editingEvaluacion ? (
                  'Actualizar'
                ) : (
                  'Crear Evaluación'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la evaluación "
              {deletingEvaluacion?.nombre}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EvaluacionesModule;
