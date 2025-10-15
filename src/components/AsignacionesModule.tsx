import { useState } from 'react';
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
  Target, 
  Plus, 
  Search,
  User,
  BookOpen,
  School,
  Users,
  Calendar,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Input } from './ui/input';
import { toast } from 'sonner';

interface Docente {
  id: string;
  nombre: string;
  email: string;
  especialidad: string;
}

interface Curso {
  id: string;
  nombre: string;
  nivel: string;
  grado: string;
  seccion: string;
}

interface Asignatura {
  id: string;
  nombre: string;
  codigo: string;
  nivel: string;
}

interface Asignacion {
  id: string;
  docenteId: string;
  cursoId: string;
  asignaturaId: string;
  fechaAsignacion: string;
  estado: 'activa' | 'inactiva';
  cargaHoraria: number;
}

export function AsignacionesModule() {
  // Datos mock
  const [docentes] = useState<Docente[]>([
    { id: '1', nombre: 'María González', email: 'maria@colegio.edu', especialidad: 'Matemáticas' },
    { id: '2', nombre: 'Carlos Rodríguez', email: 'carlos@colegio.edu', especialidad: 'Ciencias' },
    { id: '3', nombre: 'Ana Martínez', email: 'ana@colegio.edu', especialidad: 'Lenguaje' },
    { id: '4', nombre: 'Pedro Silva', email: 'pedro@colegio.edu', especialidad: 'Historia' },
    { id: '5', nombre: 'Laura Pérez', email: 'laura@colegio.edu', especialidad: 'Educación Física' }
  ]);

  const [cursos] = useState<Curso[]>([
    { id: '1', nombre: '8° Básico A', nivel: 'basica', grado: '8', seccion: 'A' },
    { id: '2', nombre: '7° Básico B', nivel: 'basica', grado: '7', seccion: 'B' },
    { id: '3', nombre: '1° Media A', nivel: 'media', grado: '1', seccion: 'A' },
    { id: '4', nombre: 'Kinder B', nivel: 'parvularia', grado: 'K', seccion: 'B' },
    { id: '5', nombre: '6° Básico C', nivel: 'basica', grado: '6', seccion: 'C' }
  ]);

  const [asignaturas] = useState<Asignatura[]>([
    { id: '1', nombre: 'Matemáticas', codigo: 'MAT001', nivel: 'basica' },
    { id: '2', nombre: 'Ciencias Naturales', codigo: 'CIE001', nivel: 'basica' },
    { id: '3', nombre: 'Lenguaje y Comunicación', codigo: 'LEN001', nivel: 'media' },
    { id: '4', nombre: 'Historia', codigo: 'HIS001', nivel: 'media' },
    { id: '5', nombre: 'Educación Física', codigo: 'EDF001', nivel: 'basica' },
    { id: '6', nombre: 'Inglés', codigo: 'ING001', nivel: 'basica' }
  ]);

  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([
    {
      id: '1',
      docenteId: '1',
      cursoId: '1',
      asignaturaId: '1',
      fechaAsignacion: '2024-01-15',
      estado: 'activa',
      cargaHoraria: 5
    },
    {
      id: '2',
      docenteId: '2',
      cursoId: '1',
      asignaturaId: '2',
      fechaAsignacion: '2024-01-16',
      estado: 'activa',
      cargaHoraria: 4
    },
    {
      id: '3',
      docenteId: '3',
      cursoId: '3',
      asignaturaId: '3',
      fechaAsignacion: '2024-01-18',
      estado: 'activa',
      cargaHoraria: 6
    },
    {
      id: '4',
      docenteId: '1',
      cursoId: '2',
      asignaturaId: '1',
      fechaAsignacion: '2024-01-20',
      estado: 'inactiva',
      cargaHoraria: 5
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDocente, setFilterDocente] = useState<string>('todos');
  const [filterCurso, setFilterCurso] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    docenteId: '',
    cursoId: '',
    asignaturaId: '',
    cargaHoraria: 4
  });

  // Funciones auxiliares para obtener nombres
  const getDocenteNombre = (id: string) => docentes.find(d => d.id === id)?.nombre || 'N/A';
  const getCursoNombre = (id: string) => cursos.find(c => c.id === id)?.nombre || 'N/A';
  const getAsignaturaNombre = (id: string) => asignaturas.find(a => a.id === id)?.nombre || 'N/A';
  const getAsignaturaCodigo = (id: string) => asignaturas.find(a => a.id === id)?.codigo || 'N/A';

  // Filtrar asignaciones
  const filteredAsignaciones = asignaciones.filter(asignacion => {
    const docenteNombre = getDocenteNombre(asignacion.docenteId).toLowerCase();
    const cursoNombre = getCursoNombre(asignacion.cursoId).toLowerCase();
    const asignaturaNombre = getAsignaturaNombre(asignacion.asignaturaId).toLowerCase();
    
    const matchesSearch = 
      docenteNombre.includes(searchTerm.toLowerCase()) ||
      cursoNombre.includes(searchTerm.toLowerCase()) ||
      asignaturaNombre.includes(searchTerm.toLowerCase());
    
    const matchesDocente = filterDocente === 'todos' || asignacion.docenteId === filterDocente;
    const matchesCurso = filterCurso === 'todos' || asignacion.cursoId === filterCurso;
    const matchesEstado = filterEstado === 'todos' || asignacion.estado === filterEstado;
    
    return matchesSearch && matchesDocente && matchesCurso && matchesEstado;
  });

  // Obtener asignaturas compatibles con el curso seleccionado
  const getAsignaturasCompatibles = (cursoId: string) => {
    const curso = cursos.find(c => c.id === cursoId);
    if (!curso) return [];
    return asignaturas.filter(a => a.nivel === curso.nivel);
  };

  const handleCreateAsignacion = () => {
    setFormData({
      docenteId: '',
      cursoId: '',
      asignaturaId: '',
      cargaHoraria: 4
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.docenteId || !formData.cursoId || !formData.asignaturaId) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    // Verificar que no exista duplicado
    const exists = asignaciones.some(a => 
      a.docenteId === formData.docenteId && 
      a.cursoId === formData.cursoId && 
      a.asignaturaId === formData.asignaturaId &&
      a.estado === 'activa'
    );
    
    if (exists) {
      toast.error('Ya existe una asignación activa para este docente, curso y asignatura');
      return;
    }

    // Verificar compatibilidad de nivel
    const curso = cursos.find(c => c.id === formData.cursoId);
    const asignatura = asignaturas.find(a => a.id === formData.asignaturaId);
    
    if (curso && asignatura && curso.nivel !== asignatura.nivel) {
      toast.error('La asignatura no es compatible con el nivel del curso');
      return;
    }

    // Crear nueva asignación
    const newAsignacion: Asignacion = {
      id: Date.now().toString(),
      docenteId: formData.docenteId,
      cursoId: formData.cursoId,
      asignaturaId: formData.asignaturaId,
      fechaAsignacion: new Date().toISOString().split('T')[0],
      estado: 'activa',
      cargaHoraria: formData.cargaHoraria
    };

    setAsignaciones([...asignaciones, newAsignacion]);
    toast.success('Asignación creada correctamente');
    setIsDialogOpen(false);
  };



  const handleToggleStatus = (asignacion: Asignacion) => {
    const newStatus = asignacion.estado === 'activa' ? 'inactiva' : 'activa';
    setAsignaciones(asignaciones.map(a => 
      a.id === asignacion.id ? { ...a, estado: newStatus } : a
    ));
    toast.success(`Asignación ${newStatus === 'activa' ? 'activada' : 'desactivada'} correctamente`);
  };

  // Calcular estadísticas
  const totalCargaHoraria = asignaciones
    .filter(a => a.estado === 'activa')
    .reduce((sum, a) => sum + a.cargaHoraria, 0);

  const docentesConAsignaciones = new Set(
    asignaciones.filter(a => a.estado === 'activa').map(a => a.docenteId)
  ).size;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Asignaciones</h1>
          <p className="text-gray-600">Asigna docentes a cursos y asignaturas</p>
        </div>
        <Button onClick={handleCreateAsignacion} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Asignación
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Asignaciones</p>
                <p className="text-2xl font-bold text-blue-600">
                  {asignaciones.filter(a => a.estado === 'activa').length}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Docentes Asignados</p>
                <p className="text-2xl font-bold text-green-600">{docentesConAsignaciones}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Carga Horaria Total</p>
                <p className="text-2xl font-bold text-purple-600">{totalCargaHoraria}h</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio por Docente</p>
                <p className="text-2xl font-bold text-orange-600">
                  {docentesConAsignaciones > 0 ? Math.round(totalCargaHoraria / docentesConAsignaciones) : 0}h
                </p>
              </div>
              <User className="w-8 h-8 text-orange-600" />
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
                  placeholder="Buscar por docente, curso o asignatura..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterDocente} onValueChange={setFilterDocente}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por docente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los docentes</SelectItem>
                {docentes.map((docente) => (
                  <SelectItem key={docente.id} value={docente.id}>
                    {docente.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCurso} onValueChange={setFilterCurso}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los cursos</SelectItem>
                {cursos.map((curso) => (
                  <SelectItem key={curso.id} value={curso.id}>
                    {curso.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activa">Activa</SelectItem>
                <SelectItem value="inactiva">Inactiva</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de asignaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Lista de Asignaciones ({filteredAsignaciones.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Docente</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Asignatura</TableHead>
                <TableHead>Carga Horaria</TableHead>
                <TableHead>Fecha Asignación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAsignaciones.map((asignacion) => {
                const docente = docentes.find(d => d.id === asignacion.docenteId);
                return (
                  <TableRow key={asignacion.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getDocenteNombre(asignacion.docenteId)}</p>
                        <p className="text-sm text-gray-500">{docente?.especialidad}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <School className="w-4 h-4 text-gray-400" />
                        <span>{getCursoNombre(asignacion.cursoId)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getAsignaturaNombre(asignacion.asignaturaId)}</p>
                        <Badge variant="outline" className="text-xs">
                          {getAsignaturaCodigo(asignacion.asignaturaId)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {asignacion.cargaHoraria}h/sem
                      </Badge>
                    </TableCell>
                    <TableCell>{asignacion.fechaAsignacion}</TableCell>
                    <TableCell>
                      <Badge variant={asignacion.estado === 'activa' ? 'default' : 'destructive'}>
                        {asignacion.estado === 'activa' ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(asignacion)}
                        className={asignacion.estado === 'activa' ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                        title={asignacion.estado === 'activa' ? 'Desactivar asignación' : 'Activar asignación'}
                      >
                        {asignacion.estado === 'activa' ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para crear asignación */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear Nueva Asignación</DialogTitle>
            <DialogDescription>
              Asigna un docente a un curso y asignatura específica
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Docente *</label>
              <Select value={formData.docenteId} onValueChange={(value) => setFormData({...formData, docenteId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un docente" />
                </SelectTrigger>
                <SelectContent>
                  {docentes.map((docente) => (
                    <SelectItem key={docente.id} value={docente.id}>
                      <div>
                        <p className="font-medium">{docente.nombre}</p>
                        <p className="text-sm text-gray-500">{docente.especialidad}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Curso *</label>
              <Select 
                value={formData.cursoId} 
                onValueChange={(value) => {
                  setFormData({...formData, cursoId: value, asignaturaId: ''});
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={curso.id}>
                      {curso.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Asignatura *</label>
              <Select 
                value={formData.asignaturaId} 
                onValueChange={(value) => setFormData({...formData, asignaturaId: value})}
                disabled={!formData.cursoId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una asignatura" />
                </SelectTrigger>
                <SelectContent>
                  {getAsignaturasCompatibles(formData.cursoId).map((asignatura) => (
                    <SelectItem key={asignatura.id} value={asignatura.id}>
                      <div>
                        <p className="font-medium">{asignatura.nombre}</p>
                        <p className="text-sm text-gray-500">{asignatura.codigo}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Carga Horaria Semanal</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.cargaHoraria}
                onChange={(e) => setFormData({...formData, cargaHoraria: parseInt(e.target.value) || 4})}
                placeholder="Horas por semana"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Crear Asignación
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}