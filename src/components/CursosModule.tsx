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
  School, 
  Plus, 
  Edit, 
  Search,
  Users,
  MapPin,
  ToggleLeft,
  ToggleRight,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

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

interface Curso {
  id_curso: number;
  nombre: string;
  seccion?: string | null;
  id_grado_academico?: number | null;
  cupo?: number | null;
  aula?: string | null;
  activo?: boolean;
  // Relaciones expandidas
  gradoAcademico?: GradoAcademico | null;
  // Datos adicionales para la UI
  descripcion?: string;
  alumnosInscritos?: number;
}

// Mock data para jornadas
const jornadasMock: Jornada[] = [
  { id_jornada: 1, nombre: 'Matutino' },
  { id_jornada: 2, nombre: 'Vespertino' },
  { id_jornada: 3, nombre: 'Completo' }
];

// Mock data para grados académicos
const gradosAcademicosMock: GradoAcademico[] = [
  { id_grado_academico: 1, nombre: 'Kinder', opcion: 'Parvularia', n_anios: 1, nota_minima: 4.0, id_jornada: 1, rcup: false, jornada: jornadasMock[0] },
  { id_grado_academico: 2, nombre: 'Pre-Kinder', opcion: 'Parvularia', n_anios: 1, nota_minima: 4.0, id_jornada: 1, rcup: false, jornada: jornadasMock[0] },
  { id_grado_academico: 3, nombre: '1° Básico', opcion: 'Básica', n_anios: 1, nota_minima: 4.0, id_jornada: 2, rcup: true, jornada: jornadasMock[1] },
  { id_grado_academico: 4, nombre: '2° Básico', opcion: 'Básica', n_anios: 1, nota_minima: 4.0, id_jornada: 2, rcup: true, jornada: jornadasMock[1] },
  { id_grado_academico: 5, nombre: '7° Básico', opcion: 'Básica', n_anios: 1, nota_minima: 4.0, id_jornada: 1, rcup: true, jornada: jornadasMock[0] },
  { id_grado_academico: 6, nombre: '8° Básico', opcion: 'Básica', n_anios: 1, nota_minima: 4.0, id_jornada: 1, rcup: true, jornada: jornadasMock[0] },
  { id_grado_academico: 7, nombre: '1° Medio', opcion: 'Media', n_anios: 1, nota_minima: 4.0, id_jornada: 2, rcup: true, jornada: jornadasMock[1] },
  { id_grado_academico: 8, nombre: '2° Medio', opcion: 'Media', n_anios: 1, nota_minima: 4.0, id_jornada: 2, rcup: true, jornada: jornadasMock[1] },
];

export function CursosModule() {
  const [cursos, setCursos] = useState<Curso[]>([
    {
      id_curso: 1,
      nombre: '8° Básico A',
      seccion: 'A',
      id_grado_academico: 6,
      cupo: 30,
      aula: 'Aula 201',
      activo: true,
      descripcion: 'Curso de octavo básico sección A',
      alumnosInscritos: 28,
      gradoAcademico: gradosAcademicosMock[5]
    },
    {
      id_curso: 2,
      nombre: '7° Básico B',
      seccion: 'B',
      id_grado_academico: 5,
      cupo: 28,
      aula: 'Aula 105',
      activo: true,
      descripcion: 'Curso de séptimo básico sección B',
      alumnosInscritos: 25,
      gradoAcademico: gradosAcademicosMock[4]
    },
    {
      id_curso: 3,
      nombre: '1° Medio A',
      seccion: 'A',
      id_grado_academico: 7,
      cupo: 35,
      aula: 'Aula 301',
      activo: true,
      descripcion: 'Primer año de educación media sección A',
      alumnosInscritos: 32,
      gradoAcademico: gradosAcademicosMock[6]
    },
    {
      id_curso: 4,
      nombre: 'Kinder B',
      seccion: 'B',
      id_grado_academico: 1,
      cupo: 20,
      aula: 'Aula Parvulos 2',
      activo: false,
      descripcion: 'Kinder sección B',
      alumnosInscritos: 0,
      gradoAcademico: gradosAcademicosMock[0]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterNivel, setFilterNivel] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);

  // Form data para curso
  const [formData, setFormData] = useState({
    seccion: '',
    id_grado_academico: 0,
    cupo: 30,
    aula: '',
    descripcion: ''
  });

  // Filtrar cursos
  const filteredCursos = cursos.filter(curso => {
    const matchesSearch = 
      curso.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curso.aula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curso.gradoAcademico?.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesNivel = filterNivel === 'todos' || 
      curso.gradoAcademico?.opcion?.toLowerCase() === filterNivel.toLowerCase();
    
    const matchesEstado = filterEstado === 'todos' || 
      (filterEstado === 'activo' ? curso.activo : !curso.activo);
    
    return matchesSearch && matchesNivel && matchesEstado;
  });

  const handleCreateCurso = () => {
    setEditingCurso(null);
    setFormData({
      seccion: '',
      id_grado_academico: 0,
      cupo: 30,
      aula: '',
      descripcion: ''
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
      descripcion: curso.descripcion || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.seccion || !formData.id_grado_academico || !formData.aula) {
      toast.error('Los campos sección, grado académico y aula son obligatorios');
      return;
    }

    // Encontrar el grado académico seleccionado
    const gradoAcademico = gradosAcademicosMock.find(g => g.id_grado_academico === formData.id_grado_academico);
    
    if (!gradoAcademico) {
      toast.error('El grado académico seleccionado no es válido');
      return;
    }

    // Generar nombre del curso
    const nombreCurso = `${gradoAcademico.nombre} ${formData.seccion}`;

    // Verificar combinación única de grado y sección
    const cursoExists = cursos.some(c => 
      c.id_grado_academico === formData.id_grado_academico && 
      c.seccion === formData.seccion &&
      c.id_curso !== editingCurso?.id_curso
    );
    
    if (cursoExists) {
      toast.error('Ya existe un curso con ese grado y sección');
      return;
    }

    if (editingCurso) {
      // Editar curso existente
      setCursos(cursos.map(c => 
        c.id_curso === editingCurso.id_curso 
          ? {
              ...c,
              nombre: nombreCurso,
              seccion: formData.seccion,
              id_grado_academico: formData.id_grado_academico,
              cupo: formData.cupo,
              aula: formData.aula,
              descripcion: formData.descripcion,
              gradoAcademico: gradoAcademico
            }
          : c
      ));
      toast.success('Curso actualizado correctamente');
    } else {
      // Crear nuevo curso
      const newCurso: Curso = {
        id_curso: Math.max(...cursos.map(c => c.id_curso), 0) + 1,
        nombre: nombreCurso,
        seccion: formData.seccion,
        id_grado_academico: formData.id_grado_academico,
        cupo: formData.cupo,
        aula: formData.aula,
        activo: true,
        descripcion: formData.descripcion,
        alumnosInscritos: 0,
        gradoAcademico: gradoAcademico
      };
      setCursos([...cursos, newCurso]);
      toast.success('Curso creado correctamente');
    }

    setIsDialogOpen(false);
  };

  const handleToggleStatus = (curso: Curso) => {
    const newStatus = !curso.activo;
    setCursos(cursos.map(c => 
      c.id_curso === curso.id_curso ? { ...c, activo: newStatus } : c
    ));
    toast.success(`Curso ${newStatus ? 'activado' : 'desactivado'} correctamente`);
  };

  const calcularPorcentajeOcupacion = (curso: Curso) => {
    if (!curso.cupo) return 0;
    return Math.round(((curso.alumnosInscritos || 0) / curso.cupo) * 100);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Cursos</h1>
          <p className="text-gray-600">Administra los cursos y secciones del colegio</p>
        </div>
        <Button onClick={handleCreateCurso} className="bg-blue-600 hover:bg-blue-700">
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
                <p className="text-2xl font-bold text-blue-600">{cursos.length}</p>
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
                  {cursos.filter(c => c.activo).length}
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
                  {cursos.filter(c => c.activo).reduce((sum, c) => sum + (c.cupo || 0), 0)}
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
                  {cursos.filter(c => c.activo).reduce((sum, c) => sum + (c.alumnosInscritos || 0), 0)}
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
            <Select value={filterNivel} onValueChange={setFilterNivel}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los niveles</SelectItem>
                <SelectItem value="parvularia">Parvularia</SelectItem>
                <SelectItem value="basica">Básica</SelectItem>
                <SelectItem value="media">Media</SelectItem>
              </SelectContent>
            </Select>
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
                <TableHead>Curso</TableHead>
                <TableHead>Grado Académico</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Aula</TableHead>
                <TableHead>Ocupación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCursos.map((curso) => {
                const porcentajeOcupacion = calcularPorcentajeOcupacion(curso);
                
                return (
                  <TableRow key={curso.id_curso}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{curso.nombre}</p>
                        {curso.descripcion && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {curso.descripcion}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{curso.gradoAcademico?.nombre}</p>
                        {curso.gradoAcademico?.jornada && (
                          <p className="text-sm text-gray-500">
                            {curso.gradoAcademico.jornada.nombre}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {curso.gradoAcademico?.opcion}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{curso.aula}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{curso.alumnosInscritos || 0}/{curso.cupo}</span>
                          <span className="text-gray-500">{porcentajeOcupacion}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              porcentajeOcupacion >= 90 ? 'bg-red-500' :
                              porcentajeOcupacion >= 70 ? 'bg-orange-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${porcentajeOcupacion}%` }}
                          />
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
                          className={curso.activo ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                          title={curso.activo ? 'Desactivar curso' : 'Activar curso'}
                        >
                          {curso.activo ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
              {editingCurso ? 'Modifica la información del curso' : 'Completa los datos del nuevo curso'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grado_academico">Grado Académico *</Label>
                <Select 
                  value={formData.id_grado_academico.toString()} 
                  onValueChange={(value) => setFormData({...formData, id_grado_academico: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un grado" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradosAcademicosMock.map(grado => (
                      <SelectItem key={grado.id_grado_academico} value={grado.id_grado_academico.toString()}>
                        {grado.nombre} - {grado.opcion}
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
                  onChange={(e) => setFormData({...formData, seccion: e.target.value.toUpperCase()})}
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
                  onChange={(e) => setFormData({...formData, aula: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, cupo: parseInt(e.target.value) || 30})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                placeholder="Descripción del curso..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
