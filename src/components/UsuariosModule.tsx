import { useState } from 'react';
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
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  UserCheck,
  UserX
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'docente';
  estado: 'activo' | 'inactivo';
  fechaCreacion: string;
}

export function UsuariosModule() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    {
      id: '1',
      nombre: 'María González',
      email: 'admin@colegioamigos.edu',
      rol: 'admin',
      estado: 'activo',
      fechaCreacion: '2024-01-10'
    },
    {
      id: '2',
      nombre: 'Carlos Rodríguez',
      email: 'docente@colegioamigos.edu',
      rol: 'docente',
      estado: 'activo',
      fechaCreacion: '2024-01-12'
    },
    {
      id: '3',
      nombre: 'Ana Martínez',
      email: 'ana.martinez@colegioamigos.edu',
      rol: 'docente',
      estado: 'activo',
      fechaCreacion: '2024-01-15'
    },
    {
      id: '4',
      nombre: 'Pedro Silva',
      email: 'pedro.silva@colegioamigos.edu',
      rol: 'docente',
      estado: 'inactivo',
      fechaCreacion: '2024-01-18'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    rol: 'docente' as 'admin' | 'docente',
    password: '',
    confirmPassword: ''
  });

  // Filtrar usuarios
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'todos' || usuario.rol === filterRole;
    const matchesStatus = filterStatus === 'todos' || usuario.estado === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      nombre: '',
      email: '',
      rol: 'docente',
      password: '',
      confirmPassword: ''
    });
    setIsDialogOpen(true);
  };

  const handleEditUser = (usuario: Usuario) => {
    setEditingUser(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      password: '',
      confirmPassword: ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombre || !formData.email) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    if (!editingUser && (!formData.password || !formData.confirmPassword)) {
      toast.error('La contraseña es obligatoria para nuevos usuarios');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    // Verificar email único
    const emailExists = usuarios.some(u => 
      u.email === formData.email && u.id !== editingUser?.id
    );
    
    if (emailExists) {
      toast.error('El correo electrónico ya está en uso');
      return;
    }

    if (editingUser) {
      // Editar usuario existente
      setUsuarios(usuarios.map(u => 
        u.id === editingUser.id 
          ? { ...u, nombre: formData.nombre, email: formData.email, rol: formData.rol }
          : u
      ));
      toast.success('Usuario actualizado correctamente');
    } else {
      // Crear nuevo usuario
      const newUser: Usuario = {
        id: Date.now().toString(),
        nombre: formData.nombre,
        email: formData.email,
        rol: formData.rol,
        estado: 'activo',
        fechaCreacion: new Date().toISOString().split('T')[0]
      };
      setUsuarios([...usuarios, newUser]);
      toast.success('Usuario creado correctamente');
    }

    setIsDialogOpen(false);
  };

  const handleToggleStatus = (usuario: Usuario) => {
    const newStatus = usuario.estado === 'activo' ? 'inactivo' : 'activo';
    setUsuarios(usuarios.map(u => 
      u.id === usuario.id ? { ...u, estado: newStatus } : u
    ));
    toast.success(`Usuario ${newStatus === 'activo' ? 'activado' : 'desactivado'} correctamente`);
  };

  const handleDeleteUser = (usuario: Usuario) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      setUsuarios(usuarios.filter(u => u.id !== usuario.id));
      toast.success('Usuario eliminado correctamente');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra los usuarios del sistema</p>
        </div>
        <Button onClick={handleCreateUser} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold text-blue-600">{usuarios.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Administradores</p>
                <p className="text-2xl font-bold text-purple-600">
                  {usuarios.filter(u => u.rol === 'admin').length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Docentes</p>
                <p className="text-2xl font-bold text-green-600">
                  {usuarios.filter(u => u.rol === 'docente').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold text-orange-600">
                  {usuarios.filter(u => u.estado === 'activo').length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-orange-600" />
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
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los roles</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="docente">Docente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
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

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Lista de Usuarios ({filteredUsuarios.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.nombre}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <Badge variant={usuario.rol === 'admin' ? 'default' : 'secondary'}>
                      {usuario.rol === 'admin' ? 'Administrador' : 'Docente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={usuario.estado === 'activo' ? 'default' : 'destructive'}>
                      {usuario.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>{usuario.fechaCreacion}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(usuario)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(usuario)}
                        className={usuario.estado === 'activo' ? 'text-orange-600' : 'text-green-600'}
                      >
                        {usuario.estado === 'activo' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(usuario)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para crear/editar usuario */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'Modifica la información del usuario' : 'Completa los datos del nuevo usuario'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Ej: María González"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="usuario@colegioamigos.edu"
                required
              />
            </div>

            <div>
              <Label htmlFor="rol">Rol</Label>
              <Select value={formData.rol} onValueChange={(value: 'admin' | 'docente') => setFormData({...formData, rol: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="docente">Docente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="password">
                {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                required={!editingUser}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">
                {editingUser ? 'Confirmar Nueva Contraseña' : 'Confirmar Contraseña'}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="••••••••"
                required={!editingUser || !!formData.password}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingUser ? 'Actualizar' : 'Crear'} Usuario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}