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
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Search,
  Calculator,
  FileText,
  //Award,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api/axiosConfig';

// Tipos principales
interface Asignatura {
  id: string;
  nombre: string;
  metodoEvaluacion: string;
  nivel: string;
  tipoAsignatura: string;
  sistemaEvaluacion: string;
  fechaCreacion: string;
  horasSemanales: number;
}

interface MetodoEvaluacion {
  id_metodo_evaluacion: number;
  nombre: string;
}

interface Curso {
  id_curso: number;
  nombre: string;
}

interface TipoAsignatura {
  id_tipo_asignatura: number;
  nombre: string;
}

interface SistemaEvaluacion {
  id_sistema_evaluacion: number;
  nombre: string;
}

export function AsignaturasModule() {
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Catálogos
  const [metodos, setMetodos] = useState<MetodoEvaluacion[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [tipos, setTipos] = useState<TipoAsignatura[]>([]);
  const [sistemas, setSistemas] = useState<SistemaEvaluacion[]>([]);

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [resMet, resCur, resTip, resSis] = await Promise.all([
          api.get('/metodos-evaluacion'),
          api.get('/cursos'),
          api.get('/tipos-asignatura'),
          api.get('/sistemas-evaluacion'),
        ]);

        // Asegurar que cada uno sea un array válido
        const safeData = (data: any) =>
          Array.isArray(data)
            ? data
            : Array.isArray(data?.items)
            ? data.items
            : [];

        setMetodos(safeData(resMet.data));
        setCursos(safeData(resCur.data));
        setTipos(safeData(resTip.data));
        setSistemas(safeData(resSis.data));
      } catch (err) {
        console.error('Error al cargar catálogos:', err);
        toast.error('No se pudieron cargar los catálogos base');
      }
    };

    fetchCatalogos();
  }, []);
  
  // Cargar asignaturas
  const fetchAsignaturas = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<any[]>('/asignaturas');
      const data = res.data || [];

      setAsignaturas(
        Array.isArray(data)
          ? data.map((a: any) => ({
              id: a.id_asignatura?.toString() ?? 'N/A',
              nombre: a.nombre ?? 'N/A',
              metodoEvaluacion: a.metodoEvaluacion?.nombre ?? 'N/A',
              nivel: a.curso?.nombre ?? 'N/A',
              tipoAsignatura: a.tipoAsignatura?.nombre ?? 'N/A', // 🟩
              sistemaEvaluacion: a.sistemaEvaluacion?.nombre ?? 'N/A', // 🟩
              fechaCreacion: a.createdAt ?? 'N/A',
              horasSemanales: a.horas_semanas ?? 0,
            }))
          : []
      );

    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al cargar asignaturas.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsignaturas();
  }, []);

  const reloadAsignaturas = fetchAsignaturas;

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNivel, setFilterNivel] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsignatura, setEditingAsignatura] = useState<Asignatura | null>(null);

  // Form
  const [formData, setFormData] = useState({
    nombre: '',
    horasSemanales: 1,
    id_curso: null as number | null,
    id_metodo_evaluacion: null as number | null,
    id_tipo_asignatura: null as number | null,
    id_sistema_evaluacion: null as number | null,
  });

  // Filtrar
  const filteredAsignaturas = asignaturas.filter((asignatura) => {
    const matchesSearch = asignatura.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNivel = filterNivel === 'todos' || asignatura.nivel === filterNivel;
    return matchesSearch && matchesNivel;
  });

  // Crear
  const handleCreateAsignatura = () => {
    setEditingAsignatura(null);
    setFormData({
      nombre: '',
      horasSemanales: 1,
      id_curso: null,
      id_metodo_evaluacion: null,
      id_tipo_asignatura: null,
      id_sistema_evaluacion: null,
    });
    setIsDialogOpen(true);
  };

  // Editar
  const handleEditAsignatura = (asignatura: Asignatura) => {
    setEditingAsignatura(asignatura);
    setFormData({
      nombre: asignatura.nombre !== 'N/A' ? asignatura.nombre : '',
      horasSemanales: asignatura.horasSemanales || 1,

      // 🟩 Busca en los catálogos el ID correspondiente por nombre
      id_curso:
        cursos.find((c) => c.nombre === asignatura.nivel)?.id_curso ?? null,

      id_metodo_evaluacion:
        metodos.find((m) => m.nombre === asignatura.metodoEvaluacion)?.id_metodo_evaluacion ?? null,

      id_tipo_asignatura:
        tipos.find((t) => t.nombre === asignatura.tipoAsignatura)?.id_tipo_asignatura ?? null,

      id_sistema_evaluacion:
        sistemas.find((s) => s.nombre === asignatura.sistemaEvaluacion)?.id_sistema_evaluacion ?? null,
    });

    setIsDialogOpen(true);
  };

  // Guardar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error('El nombre de la asignatura es obligatorio.');
      return;
    }

    try {
      setSaving(true);

      const payload = Object.fromEntries(
        Object.entries({
          nombre: formData.nombre,
          horas_semanas: formData.horasSemanales,
          id_curso: formData.id_curso,
          id_metodo_evaluacion: formData.id_metodo_evaluacion,
          id_tipo_asignatura: formData.id_tipo_asignatura,
          id_sistema_evaluacion: formData.id_sistema_evaluacion,
        }).filter(([_, v]) => v != null)
      );

      if (editingAsignatura) {
        await api.patch(`/asignaturas/${editingAsignatura.id}`, payload);
        toast.success('Asignatura actualizada correctamente');
      } else {
        await api.post('/asignaturas', payload);
        toast.success('Asignatura creada correctamente');
      }

      await reloadAsignaturas();
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Error al guardar la asignatura.';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

// const handleDeleteAsignatura = async (asignatura: Asignatura) => {
//   if (window.confirm(`¿Seguro que deseas eliminar "${asignatura.nombre}"?`)) {
//     try {
//       await api.delete(`/asignaturas/${asignatura.id}`);
//       toast.success('Asignatura eliminada correctamente');
//       await reloadAsignaturas();
//     } catch (err: any) {
//       console.error('Error al eliminar asignatura:', err);
//       const msg = err?.response?.data?.message || 'No se pudo eliminar la asignatura.';
//       toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
//     }
//   }
// };

  // Estados de carga
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p className="animate-pulse">Cargando asignaturas…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-red-600 font-medium">⚠️ {error}</p>
        <Button onClick={reloadAsignaturas} className="bg-blue-600 hover:bg-blue-700">
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Asignaturas</h1>
          <p className="text-gray-600">Administra las materias del plan de estudios</p>
        </div>
        <Button onClick={handleCreateAsignatura} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Asignatura
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Asignaturas */}
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Asignaturas</p>
                <p className="text-2xl font-bold text-blue-600">{asignaturas.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Promedio de Horas/Semana */}
        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio de Horas/Semana</p>
                <p className="text-2xl font-bold text-purple-600">
                  {asignaturas.length > 0
                    ? (
                        asignaturas.reduce(
                          (acc, a) => acc + (a.horasSemanales || 0),
                          0
                        ) / asignaturas.length
                      ).toFixed(1)
                    : 0}
                </p>
              </div>
              <Calculator className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        {/* Horas Totales Semanales */}
        <Card className="border-l-4 border-l-orange-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Horas Totales Semanales</p>
                <p className="text-2xl font-bold text-orange-600">
                  {asignaturas.reduce((acc, a) => acc + (a.horasSemanales || 0), 0)}
                </p>
              </div>
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        {/* Asignaturas sin Curso Asignado */}
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sin Curso Asignado</p>
                <p className="text-2xl font-bold text-red-500">
                  {asignaturas.filter((a) => a.nivel === 'N/A' || !a.nivel).length}
                </p>
              </div>
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>Lista de Asignaturas ({filteredAsignaturas.length})</span>
          </CardTitle>
          {/* Buscador */}
          <div className="flex items-center justify-between mb-3">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre de asignatura..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-8"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Método Evaluación</TableHead>
                <TableHead>Horas/Semana</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAsignaturas.length > 0 ? (
                filteredAsignaturas.map((asignatura) => (
                  <TableRow key={asignatura.id}>
                    <TableCell>{asignatura.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {asignatura.nivel || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{asignatura.metodoEvaluacion || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{asignatura.horasSemanales}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAsignatura(asignatura)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {/* 
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAsignatura(asignatura)}
                          className="text-red-600 hover:text-red-700 border-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-6">
                    📭 No hay asignaturas registradas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAsignatura
                ? saving
                  ? 'Actualizando asignatura...'
                  : 'Editar Asignatura'
                : saving
                ? 'Guardando nueva asignatura...'
                : 'Crear Nueva Asignatura'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre de la Asignatura *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Matemáticas"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Curso */}
              <div>
                <Label>Curso</Label>
                <Select
                  value={formData.id_curso?.toString() || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, id_curso: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos.map((c) => (
                      <SelectItem key={c.id_curso} value={c.id_curso.toString()}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Método */}
              <div>
                <Label>Método de Evaluación</Label>
                <Select
                  value={formData.id_metodo_evaluacion?.toString() || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, id_metodo_evaluacion: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione método" />
                  </SelectTrigger>
                  <SelectContent>
                    {metodos.map((m) => (
                      <SelectItem
                        key={m.id_metodo_evaluacion}
                        value={m.id_metodo_evaluacion.toString()}
                      >
                        {m.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Tipo */}
              <div>
                <Label>Tipo de Asignatura</Label>
                <Select
                  value={formData.id_tipo_asignatura?.toString() || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, id_tipo_asignatura: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos.map((t) => (
                      <SelectItem
                        key={t.id_tipo_asignatura}
                        value={t.id_tipo_asignatura.toString()}
                      >
                        {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sistema */}
              <div>
                <Label>Sistema de Evaluación</Label>
                <Select
                  value={formData.id_sistema_evaluacion?.toString() || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, id_sistema_evaluacion: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione sistema" />
                  </SelectTrigger>
                  <SelectContent>
                    {sistemas.map((s) => (
                      <SelectItem
                        key={s.id_sistema_evaluacion}
                        value={s.id_sistema_evaluacion.toString()}
                      >
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Horas */}
            <div>
              <Label htmlFor="horasSemanales">Horas por Semana</Label>
              <Input
                id="horasSemanales"
                type="number"
                min="1"
                max="20"
                value={formData.horasSemanales}
                onChange={(e) =>
                  setFormData({ ...formData, horasSemanales: parseInt(e.target.value) || 1 })
                }
              />
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
                {saving
                  ? editingAsignatura
                    ? 'Actualizando...'
                    : 'Guardando...'
                  : editingAsignatura
                  ? 'Actualizar'
                  : 'Crear Asignatura'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AsignaturasModule;
