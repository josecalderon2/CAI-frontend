import { useState } from 'react';
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
  GraduationCap, 
  Plus, 
  Edit, 
  Search,
  Award,
  Clock,
  Sun,
  Moon,
  Sunrise,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
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

const jornadas: Jornada[] = [
  { id: 1, nombre: 'Matutino', icon: Sun },
  { id: 2, nombre: 'Vespertino', icon: Moon },
  { id: 3, nombre: 'Completo', icon: Sunrise },
];

export function GradosAcademicosModule() {
  const [grados, setGrados] = useState<GradoAcademico[]>([
    {
      id: '1',
      nombre: 'Educación Parvularia',
      opcion: 'Kinder',
      n_anios: 2,
      nota_minima: 5.0,
      id_jornada: 1,
      rcup: false,
      fechaCreacion: '2024-01-15',
      descripcion: 'Nivel de educación inicial'
    },
    {
      id: '2',
      nombre: 'Educación Básica',
      opcion: 'Básica General',
      n_anios: 8,
      nota_minima: 4.0,
      id_jornada: 1,
      rcup: true,
      fechaCreacion: '2024-01-15',
      descripcion: 'Educación básica de 1° a 8°'
    },
    {
      id: '3',
      nombre: 'Educación Media',
      opcion: 'Científico-Humanista',
      n_anios: 4,
      nota_minima: 4.0,
      id_jornada: 1,
      rcup: true,
      fechaCreacion: '2024-01-15',
      descripcion: 'Educación media científico-humanista'
    },
    {
      id: '4',
      nombre: 'Educación Media',
      opcion: 'Técnico-Profesional',
      n_anios: 4,
      nota_minima: 4.0,
      id_jornada: 3,
      rcup: true,
      fechaCreacion: '2024-01-15',
      descripcion: 'Educación media técnico-profesional'
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterJornada, setFilterJornada] = useState<string>('todos');
  const [filterRcup, setFilterRcup] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrado, setEditingGrado] = useState<GradoAcademico | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    opcion: '',
    n_anios: 1,
    nota_minima: 4.0,
    id_jornada: 1,
    rcup: false,
    descripcion: ''
  });

  // Filtrar grados
  const filteredGrados = grados.filter(grado => {
    const matchesSearch = 
      grado.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grado.opcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (grado.descripcion && grado.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesJornada = filterJornada === 'todos' || grado.id_jornada.toString() === filterJornada;
    const matchesRcup = filterRcup === 'todos' || (filterRcup === 'si' ? grado.rcup : !grado.rcup);
    
    return matchesSearch && matchesJornada && matchesRcup;
  });

  const handleCreateGrado = () => {
    setEditingGrado(null);
    setFormData({
      nombre: '',
      opcion: '',
      n_anios: 1,
      nota_minima: 4.0,
      id_jornada: 1,
      rcup: false,
      descripcion: ''
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
      descripcion: grado.descripcion || ''
    });
    setIsDialogOpen(true);
  };

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

    if (editingGrado) {
      // Editar grado existente
      setGrados(grados.map(g => 
        g.id === editingGrado.id 
          ? {
              ...g,
              nombre: formData.nombre,
              opcion: formData.opcion,
              n_anios: formData.n_anios,
              nota_minima: formData.nota_minima,
              id_jornada: formData.id_jornada,
              rcup: formData.rcup,
              descripcion: formData.descripcion
            }
          : g
      ));
      toast.success('Grado académico actualizado correctamente');
    } else {
      // Crear nuevo grado
      const newGrado: GradoAcademico = {
        id: Date.now().toString(),
        nombre: formData.nombre,
        opcion: formData.opcion,
        n_anios: formData.n_anios,
        nota_minima: formData.nota_minima,
        id_jornada: formData.id_jornada,
        rcup: formData.rcup,
        fechaCreacion: new Date().toISOString().split('T')[0],
        descripcion: formData.descripcion
      };
      setGrados([...grados, newGrado]);
      toast.success('Grado académico creado correctamente');
    }

    setIsDialogOpen(false);
  };

  const getJornada = (id: number) => jornadas.find(j => j.id === id);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Grados Académicos</h1>
          <p className="text-gray-600">Administra los grados académicos del sistema educativo</p>
        </div>
        <Button onClick={handleCreateGrado} className="bg-blue-600 hover:bg-blue-700">
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
                <p className="text-2xl font-bold text-blue-600">{grados.length}</p>
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
                <p className="text-2xl font-bold text-purple-600">{grados.filter(g => g.rcup).length}</p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Años</p>
                <p className="text-2xl font-bold text-orange-600">{grados.reduce((sum, g) => sum + g.n_anios, 0)}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio Años</p>
                <p className="text-2xl font-bold text-green-600">{Math.round(grados.reduce((sum, g) => sum + g.n_anios, 0) / grados.length)}</p>
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
                <SelectValue placeholder="Filtrar por jornada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {jornadas.map(j => (
                  <SelectItem key={j.id} value={j.id.toString()}>{j.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterRcup} onValueChange={setFilterRcup}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por RCUP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="si">Con RCUP</SelectItem>
                <SelectItem value="no">Sin RCUP</SelectItem>
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
            <span>Lista de Grados Académicos ({filteredGrados.length})</span>
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
              {filteredGrados.map((grado) => {
                const jornada = getJornada(grado.id_jornada);
                const JornadaIcon = jornada?.icon || Sun;
                
                return (
                  <TableRow key={grado.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{grado.nombre}</p>
                        {grado.descripcion && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">{grado.descripcion}</p>
                        )}
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
                        <span className="text-sm">{grado.n_anios} {grado.n_anios === 1 ? 'año' : 'años'}</span>
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
                        <Badge variant="outline" className="text-gray-600 border-gray-300">
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditGrado(grado)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para crear/editar grado */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGrado ? 'Editar Grado Académico' : 'Crear Nuevo Grado Académico'}
            </DialogTitle>
            <DialogDescription>
              {editingGrado ? 'Modifica la información del grado académico' : 'Completa los datos del nuevo grado académico'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre del Grado *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Educación Básica"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="opcion">Opción *</Label>
                <Input
                  id="opcion"
                  value={formData.opcion}
                  onChange={(e) => setFormData({...formData, opcion: e.target.value})}
                  placeholder="Ej: Básica General"
                  required
                />
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
                  onChange={(e) => setFormData({...formData, n_anios: parseInt(e.target.value) || 1})}
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
                  onChange={(e) => setFormData({...formData, nota_minima: parseFloat(e.target.value) || 4.0})}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Entre 1.0 y 7.0</p>
              </div>

              <div>
                <Label htmlFor="jornada">Jornada *</Label>
                <Select 
                  value={formData.id_jornada.toString()} 
                  onValueChange={(value) => setFormData({...formData, id_jornada: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jornadas.map(j => {
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
                onCheckedChange={(checked) => setFormData({...formData, rcup: checked})}
              />
              <Label htmlFor="rcup" className="cursor-pointer">
                RCUP (Reconocimiento Curricular de Unidades Pedagógicas)
              </Label>
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                placeholder="Descripción del grado académico..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
