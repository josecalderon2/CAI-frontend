import { useState } from 'react';
import { useEffect } from 'react';
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
  GraduationCap,
  Plus,
  Edit,
  Search,
  Award,
  Clock,
  Sun,
  Moon,
  Sunrise,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { gradoAcademicoService } from '../api/services/gradoAcademicoService';
import { Switch } from './ui/switch';

interface Jornada {
  id: number;
  nombre: string;
  icon: typeof Sun | typeof Moon | typeof Sunrise;
}

interface GradoAcademico {
  id: string;
  nombre: string;
  opcion: string;
  n_anios: number;
  nota_minima: number;
  id_jornada: number;
  rcup: boolean;
  fechaCreacion: string;
  descripcion?: string;
}

interface GradoForm {
  nombre: string;
  opcion: string;
  n_anios: number;
  nota_minima: number;
  id_jornada: number;
  rcup: boolean;
  // descripcion removed to match backend schema
}

const defaultJornadas: Jornada[] = [
  { id: 1, nombre: 'Matutino', icon: Sun },
  { id: 2, nombre: 'Vespertino', icon: Moon },
  { id: 3, nombre: 'Completo', icon: Sunrise },
];

export function GradosAcademicosModule() {
  const [grados, setGrados] = useState<GradoAcademico[]>([]);
  const [paginatedGrados, setPaginatedGrados] = useState<GradoAcademico[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const itemsPerPage = 10;

  const [searchTerm, setSearchTerm] = useState('');
  const [jornadasState, setJornadasState] =
    useState<Jornada[]>(defaultJornadas);
  const [filterJornada, setFilterJornada] = useState<string>('todos');
  const [filterRcup, setFilterRcup] = useState<string>('todos');
  const [filterOpcion, setFilterOpcion] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrado, setEditingGrado] = useState<GradoAcademico | null>(null);
  const [formData, setFormData] = useState<GradoForm>({
    nombre: '',
    opcion: '',
    n_anios: 1,
    nota_minima: 4.0,
    id_jornada: 1,
    rcup: false,
  });

  // cargar datos desde la API
  // Debounce hook for search
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // cargar datos desde la API (traer todos los registros con límite alto)
  useEffect(() => {
    (async () => {
      try {
        const res = await gradoAcademicoService.list({ page: 1, limit: 1000 });
        const items = res.items ?? res;

        const parseBoolean = (v: any) => {
          if (
            v === true ||
            v === 1 ||
            v === '1' ||
            v === 'true' ||
            v === 'True'
          )
            return true;
          if (
            v === false ||
            v === 0 ||
            v === '0' ||
            v === 'false' ||
            v === 'False'
          )
            return false;
          if (typeof v === 'string') {
            const s = v.toLowerCase();
            if (
              s === 'si' ||
              s === 'sí' ||
              s === 's' ||
              s === 'y' ||
              s === 'yes'
            )
              return true;
            if (s === 'no' || s === 'n') return false;
          }
          return Boolean(v);
        };

        const mapped = (items || []).map((it: any) => ({
          id: String(it.id_grado_academico ?? it.id ?? it.id_grado),
          nombre: it.nombre,
          opcion: it.opcion ?? '',
          n_anios: it.n_anios ?? it.n_anios ?? 1,
          nota_minima: it.nota_minima ?? it.nota_minima ?? 4.0,
          id_jornada: it.id_jornada ?? 1,
          rcup: parseBoolean(it.rcup),
          fechaCreacion: it.fechaCreacion ?? it.createdAt ?? '',
        }));

        setGrados(mapped);
      } catch (err: any) {
        console.error('Error cargando grados:', err);
        toast.error('No se pudieron cargar los grados académicos');
      }
    })();
  }, []);

  // Intentar cargar jornadas desde backend (si existe endpoint)
  useEffect(() => {
    (async () => {
      try {
        const res = await gradoAcademicoService.listJornadas();
        const items = res.items ?? res;

        const mapIcon = (name: string) => {
          const s = (name || '').toLowerCase();
          if (s.includes('matut')) return Sun;
          if (s.includes('vespert')) return Moon;
          if (s.includes('compl') || s.includes('complet')) return Sunrise;
          return Sun;
        };

        const mapped = (items || []).map((it: any) => ({
          id: Number(it.id_jornada ?? it.id),
          nombre: it.nombre ?? it.descripcion ?? String(it.id_jornada ?? it.id),
          icon: mapIcon(it.nombre ?? it.descripcion ?? ''),
        }));

        if (mapped.length > 0) setJornadasState(mapped);
      } catch (err) {
        // fallback: mantener defaultJornadas
        console.warn(
          'No se pudieron cargar jornadas desde API, usando fallback',
          err
        );
      }
    })();
  }, []);

  // Aplicar filtros y paginación en cliente
  useEffect(() => {
    const applyFilters = () => {
      const s = debouncedSearchTerm.toLowerCase();

      const filtered = grados.filter((grado: GradoAcademico) => {
        const matchesSearch =
          grado.nombre.toLowerCase().includes(s) ||
          grado.opcion.toLowerCase().includes(s) ||
          false;
        const matchesJornada =
          filterJornada === 'todos' ||
          grado.id_jornada.toString() === filterJornada;
        const matchesRcup =
          filterRcup === 'todos' ||
          (filterRcup === 'si' ? grado.rcup : !grado.rcup);
        const matchesOpcion =
          filterOpcion === 'todos' ||
          normalizeOpcion(grado.opcion) === filterOpcion;

        return matchesSearch && matchesJornada && matchesRcup && matchesOpcion;
      });

      setTotalItems(filtered.length);
      const pages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
      setTotalPages(pages);
      // Ensure current page is within range
      const currentPage = Math.min(page, pages);
      setPage(currentPage);

      const start = (currentPage - 1) * itemsPerPage;
      const slice = filtered.slice(start, start + itemsPerPage);
      setPaginatedGrados(slice);
    };

    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    grados,
    debouncedSearchTerm,
    filterJornada,
    filterRcup,
    filterOpcion,
    page,
  ]);

  const handleCreateGrado = () => {
    setEditingGrado(null);
    setFormData({
      nombre: '',
      opcion: '',
      n_anios: 1,
      nota_minima: 4.0,
      id_jornada: 1,
      rcup: false,
    });
    setIsDialogOpen(true);
  };

  const handleEditGrado = (grado: GradoAcademico) => {
    setEditingGrado(grado);
    setFormData({
      nombre: grado.nombre,
      opcion: grado.opcion,
      n_anios: grado.n_anios,
      nota_minima: grado.nota_minima,
      id_jornada: grado.id_jornada,
      rcup: grado.rcup,
    });
    setIsDialogOpen(true);
  };

  // Combina opciones fijas con las ya existentes en los grados
  // Normaliza variantes comunes para evitar duplicados visuales
  const normalizeOpcion = (raw: string) => {
    const s = String(raw || '').trim();
    if (!s) return '';
    const low = s.toLowerCase().replace(/\s+/g, ' ');
    // Normalizar variantes de 'Semi presencial' a 'Semi-presencial'
    if (/^semi[\s-]*presenci/.test(low)) return 'Semi-presencial';
    if (/^presencial$/.test(low)) return 'Presencial';
    if (/^virtual$/.test(low)) return 'Virtual';
    // Capitalizar palabras por defecto
    return s.replace(
      /\w\S*/g,
      (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    );
  };

  const opcionOptions: string[] = Array.from(
    new Set([
      'Presencial',
      'Semi-presencial',
      'Virtual',
      ...grados
        .map((g) => normalizeOpcion(g.opcion))
        .filter((o) => o && o.trim() !== ''),
    ])
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombre || !formData.opcion) {
      toast.error('Los campos nombre y opción son obligatorios');
      return;
    }

    if (formData.n_anios < 1 || formData.n_anios > 15) {
      toast.error('El número de años debe estar entre 1 y 15');
      return;
    }

    if (formData.nota_minima < 1.0 || formData.nota_minima > 7.0) {
      toast.error('La nota mínima debe estar entre 1.0 y 7.0');
      return;
    }

    (async () => {
      try {
        if (editingGrado) {
          // actualizar en backend
          const idNum = parseInt(editingGrado.id, 10);
          const updated: any = await gradoAcademicoService.update(idNum, {
            nombre: formData.nombre,
            opcion: formData.opcion,
            n_anios: formData.n_anios,
            nota_minima: formData.nota_minima,
            id_jornada: formData.id_jornada,
            rcup: formData.rcup,
            // descripcion removed from payload
          });

          // reflejar en UI
          setGrados((prev) =>
            prev.map((g) =>
              g.id === String(updated.id_grado_academico ?? updated.id)
                ? {
                    ...g,
                    nombre: updated.nombre,
                    opcion: updated.opcion ?? g.opcion,
                    n_anios: updated.n_anios ?? g.n_anios,
                    nota_minima: updated.nota_minima ?? g.nota_minima,
                    id_jornada: updated.id_jornada ?? g.id_jornada,
                    rcup: Boolean(updated.rcup),
                    // descripcion removed
                  }
                : g
            )
          );

          toast.success('Grado académico actualizado correctamente');
        } else {
          // crear en backend
          const created: any = await gradoAcademicoService.create({
            nombre: formData.nombre,
            opcion: formData.opcion,
            n_anios: formData.n_anios,
            nota_minima: formData.nota_minima,
            id_jornada: formData.id_jornada,
            rcup: formData.rcup,
            // descripcion removed from payload
          } as any);

          const newItem = {
            id: String(created.id_grado_academico ?? created.id),
            nombre: created.nombre,
            opcion: created.opcion ?? '',
            n_anios: created.n_anios ?? 1,
            nota_minima: created.nota_minima ?? 4.0,
            id_jornada: created.id_jornada ?? 1,
            rcup: Boolean(created.rcup),
            fechaCreacion: created.fechaCreacion ?? '',
            // descripcion removed from created mapping
          } as GradoAcademico;

          setGrados((prev) => [...prev, newItem]);
          toast.success('Grado académico creado correctamente');
        }

        setIsDialogOpen(false);
      } catch (err: any) {
        console.error('Error creando/actualizando grado', err);
        toast.error(err?.message ?? 'Error al guardar grado académico');
      }
    })();
  };

  // delete function removed per user request

  const getJornada = (id: number) => jornadasState.find((j) => j.id === id);

  const formatDisplayNombre = (g: GradoAcademico) => {
    const s = String(g.nombre).trim();
    // match leading number even if followed by text: '5', '5º', '5 Basico', '5 Básico'
    const leadMatch = s.match(/^([0-9]+)\s*(?:º|°)?(?:\s+(.+))?$/);
    if (leadMatch) {
      const num = leadMatch[1];
      // Prefer showing only the ordinal (e.g. '3º') or the trailing text from nombre itself
      if (leadMatch[2]) return `${num}º ${leadMatch[2]}`;
      return `${num}º`;
    }

    return g.nombre;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Grados Académicos
          </h1>
          <p className="text-gray-600">
            Administra los grados académicos del sistema educativo
          </p>
        </div>
        <Button
          onClick={handleCreateGrado}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Grado Académico
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Grados</p>
                <p className="text-2xl font-bold text-blue-600">
                  {grados.length}
                </p>
              </div>
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Con RCUP</p>
                <p className="text-2xl font-bold text-purple-600">
                  {grados.filter((g) => g.rcup).length}
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-600">
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Grados por Jornada</p>
              <div className="mt-2 space-y-2">
                {jornadasState.map((j) => {
                  const count = grados.filter(
                    (g) => g.id_jornada === j.id
                  ).length;
                  const Icon = j.icon;
                  return (
                    <div
                      key={j.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-5 h-5 text-orange-600" />
                        <span className="text-sm">{j.nombre}</span>
                      </div>
                      <span className="text-2xl font-bold text-orange-600">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio Años</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(
                    grados.reduce((sum, g) => sum + g.n_anios, 0) /
                      grados.length
                  )}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
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
                  placeholder="Buscar por nombre, opción o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterJornada} onValueChange={setFilterJornada}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Todas las jornadas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las jornadas</SelectItem>
                {jornadasState.map((j) => (
                  <SelectItem key={j.id} value={j.id.toString()}>
                    {j.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterRcup} onValueChange={setFilterRcup}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Todos los RCUP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los RCUP</SelectItem>
                <SelectItem value="si">Con RCUP</SelectItem>
                <SelectItem value="no">Sin RCUP</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterOpcion} onValueChange={setFilterOpcion}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las Opciones</SelectItem>
                {opcionOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de grados académicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5" />
            <span>Lista de Grados Académicos ({totalItems})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Opción</TableHead>
                <TableHead>Años</TableHead>
                <TableHead>Nota Mínima</TableHead>
                <TableHead>Jornada</TableHead>
                <TableHead>RCUP</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGrados.map((grado: GradoAcademico) => {
                const jornada = getJornada(grado.id_jornada);
                const JornadaIcon = jornada?.icon || Sun;

                return (
                  <TableRow key={grado.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {formatDisplayNombre(grado)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-blue-700 border-blue-200 bg-blue-50"
                      >
                        {grado.opcion}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {grado.n_anios} {grado.n_anios === 1 ? 'año' : 'años'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {grado.nota_minima.toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <JornadaIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{jornada?.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {grado.rcup ? (
                        <Badge className="bg-green-600 hover:bg-green-700">
                          Sí
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-gray-600 border-gray-300"
                        >
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditGrado(grado)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {/* delete button removed by user request */}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between space-x-2 py-4">
            <p className="text-sm text-gray-600">
              Mostrando{' '}
              <span className="font-semibold">{paginatedGrados.length}</span> de{' '}
              <span className="font-semibold">{totalItems}</span> resultados
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

      {/* Dialog para crear/editar grado */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGrado
                ? 'Editar Grado Académico'
                : 'Crear Nuevo Grado Académico'}
            </DialogTitle>
            <DialogDescription>
              {editingGrado
                ? 'Modifica la información del grado académico'
                : 'Completa los datos del nuevo grado académico'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre del Grado *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="Ej: Educación Básica"
                  required
                />
              </div>

              <div>
                <Label htmlFor="opcion">Opción *</Label>
                <Select
                  value={formData.opcion}
                  onValueChange={(value) =>
                    setFormData({ ...formData, opcion: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcionOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="n_anios">Número de Años *</Label>
                <Input
                  id="n_anios"
                  type="number"
                  min="1"
                  max="15"
                  value={formData.n_anios}
                  inputMode="numeric"
                  step={1}
                  onFocus={(e) =>
                    (e.currentTarget as HTMLInputElement).select()
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      n_anios: parseInt(e.target.value) || 1,
                    })
                  }
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Entre 1 y 15 años</p>
              </div>

              <div>
                <Label htmlFor="nota_minima">Nota Mínima *</Label>
                <Input
                  id="nota_minima"
                  type="number"
                  min="1.0"
                  max="7.0"
                  step="0.1"
                  value={formData.nota_minima}
                  inputMode="decimal"
                  onFocus={(e) =>
                    (e.currentTarget as HTMLInputElement).select()
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nota_minima: parseFloat(e.target.value) || 4.0,
                    })
                  }
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Entre 1.0 y 7.0</p>
              </div>

              <div>
                <Label htmlFor="jornada">Jornada *</Label>
                <Select
                  value={formData.id_jornada.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, id_jornada: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jornadasState.map((j) => {
                      const Icon = j.icon;
                      return (
                        <SelectItem key={j.id} value={j.id.toString()}>
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4" />
                            <span>{j.nombre}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="rcup"
                checked={formData.rcup}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, rcup: checked })
                }
              />
              <Label htmlFor="rcup" className="cursor-pointer">
                RCUP (Reprueba con último periodo)
              </Label>
            </div>

            {/* descripcion field removed to match backend schema */}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingGrado ? 'Actualizar' : 'Crear'} Grado Académico
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
