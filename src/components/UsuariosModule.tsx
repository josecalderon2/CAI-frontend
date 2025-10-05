import { useState, useEffect, useCallback } from 'react';
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
  Users,
  UserPlus,
  Edit,
  Search,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../api/axiosConfig';
import type { Administrativo } from '../types';
import type { PagedResponse } from '../types';
import type { Orientador } from '../types';
import type { AppUser } from '../types';

interface Cargo {
  id_cargo_administrativo: number;
  nombre: string;
}

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export function UsuariosModule() {
  const [usuarios, setUsuarios] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Estado para almacenar totales globales por tipo de usuario
  const [totalCounts, setTotalCounts] = useState({
    admins: 0,
    orientadores: 0,
    pa: 0,
    activos: 0,
  });

  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    id_cargo_administrativo: 0,
    direccion: '',
    dui: '',
    telefono: '',
  });

  const fetchCargos = useCallback(async () => {
    try {
      const response = await api.get<Cargo[]>('/cargo-administrativo');
      setCargos(response.data);
      if (response.data.length > 0 && !editingUser) {
        setFormData((prev) => ({
          ...prev,
          id_cargo_administrativo: response.data[0].id_cargo_administrativo,
        }));
      }
    } catch (error) {
      toast.error('No se pudieron cargar los roles/cargos.');
    }
  }, []);

  // Función para obtener TODOS los usuarios sin paginación
  const fetchAllUsersNoLimit = useCallback(async (): Promise<AppUser[]> => {
    try {
      // Obtenemos TODOS los usuarios sin aplicar filtros en la petición
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '1000'); // Número alto para traer todos los registros

      console.log('Obteniendo todos los usuarios sin límite');

      const [adminResponse, orientadorResponse] = await Promise.all([
        api.get<PagedResponse<Administrativo>>(
          `/administrativo?${params.toString()}`
        ),
        api.get<PagedResponse<Orientador>>(`/orientador?${params.toString()}`),
      ]);

      // Convertimos todos los usuarios a un formato común
      const allAdmins: AppUser[] = adminResponse.data.items.map((user) => ({
        ...user,
        id: user.id_administrativo,
        type: 'administrativo' as const,
      }));

      const allOrientadores: AppUser[] = orientadorResponse.data.items.map(
        (user) => ({
          ...user,
          id: user.id_orientador,
          type: 'orientador' as const,
        })
      );

      // Combinamos todos los usuarios
      return [...allAdmins, ...allOrientadores];
    } catch (error) {
      console.error('Error al obtener todos los usuarios:', error);
      return [];
    }
  }, []);

  // Función para obtener totales y aplicar filtros del lado del cliente
  const fetchTotalCounts = useCallback(async () => {
    try {
      // Obtenemos TODOS los usuarios primero
      const allUsersData = await fetchAllUsersNoLimit();
      console.log(`Total usuarios obtenidos: ${allUsersData.length}`);

      // Ahora aplicamos todos los filtros del lado del cliente
      let filteredUsers: AppUser[] = allUsersData;

      // Filtrar por término de búsqueda si existe
      if (debouncedSearchTerm) {
        const searchTermLower = debouncedSearchTerm.toLowerCase();
        filteredUsers = filteredUsers.filter(
          (user) =>
            user.nombre?.toLowerCase().includes(searchTermLower) ||
            user.apellido?.toLowerCase().includes(searchTermLower) ||
            user.email?.toLowerCase().includes(searchTermLower)
        );
        console.log(`Después de filtrar por búsqueda: ${filteredUsers.length}`);
      }

      // Filtrar por estado si es diferente de 'todos'
      if (filterStatus !== 'todos') {
        const isActive = filterStatus === 'true';
        filteredUsers = filteredUsers.filter(
          (user) => user.activo === isActive
        );
        console.log(`Después de filtrar por estado: ${filteredUsers.length}`);
      }

      // Filtrar por rol si es diferente de 'todos'
      if (filterRole !== 'todos') {
        filteredUsers = filteredUsers.filter(
          (user) => user.cargoAdministrativo?.nombre === filterRole
        );
        console.log(`Después de filtrar por rol: ${filteredUsers.length}`);
      }

      // Contar por tipo usando los datos filtrados
      const adminCount = filteredUsers.filter((u) =>
        u.cargoAdministrativo?.nombre?.toLowerCase().includes('admin')
      ).length;
      const paCount = filteredUsers.filter(
        (u) =>
          u.cargoAdministrativo?.nombre?.toLowerCase().includes('p.a') ||
          u.cargoAdministrativo?.nombre
            ?.toLowerCase()
            .includes('personal administrativo')
      ).length;
      const orientadorCount = filteredUsers.filter((u) =>
        u.cargoAdministrativo?.nombre?.toLowerCase().includes('orientador')
      ).length;
      const activosCount = filteredUsers.filter((u) => u.activo).length;

      // Actualizar estado con los totales
      setTotalCounts({
        admins: adminCount,
        orientadores: orientadorCount,
        pa: paCount,
        activos: activosCount,
      });
    } catch (error) {
      console.error('Error al obtener totales:', error);
    }
  }, [debouncedSearchTerm, filterStatus, filterRole, fetchAllUsersNoLimit]);

  // Nueva implementación: aplicamos filtrado y paginación del lado del cliente
  const fetchAllUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Obtenemos todos los usuarios sin paginación
      const allUsers = await fetchAllUsersNoLimit();

      // Aplicamos filtros del lado del cliente
      let filteredUsers: AppUser[] = allUsers;

      // Filtrar por término de búsqueda si existe
      if (debouncedSearchTerm) {
        const searchTermLower = debouncedSearchTerm.toLowerCase();
        filteredUsers = filteredUsers.filter(
          (user) =>
            user.nombre?.toLowerCase().includes(searchTermLower) ||
            user.apellido?.toLowerCase().includes(searchTermLower) ||
            user.email?.toLowerCase().includes(searchTermLower)
        );
      }

      // Filtrar por estado si es diferente de 'todos'
      if (filterStatus !== 'todos') {
        const isActive = filterStatus === 'true';
        filteredUsers = filteredUsers.filter(
          (user) => user.activo === isActive
        );
      }

      // Filtrar por rol si es diferente de 'todos'
      if (filterRole !== 'todos') {
        // Ahora podemos simplemente filtrar por el nombre exacto del cargo
        filteredUsers = filteredUsers.filter(
          (user) => user.cargoAdministrativo?.nombre === filterRole
        );
      }

      // Ordenamos los resultados por fecha de creación (más recientes primero)
      filteredUsers.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Calculamos el total de resultados filtrados
      const totalFiltered = filteredUsers.length;

      // Aplicamos paginación manual
      const startIndex = (page - 1) * itemsPerPage;
      const paginatedUsers = filteredUsers.slice(
        startIndex,
        startIndex + itemsPerPage
      );

      // Actualizamos el estado
      setUsuarios(paginatedUsers);
      setTotalItems(totalFiltered);
      setTotalPages(Math.ceil(totalFiltered / itemsPerPage));

      console.log(`Total usuarios filtrados: ${totalFiltered}`);
      console.log(
        `Mostrando página ${page} con ${paginatedUsers.length} usuarios`
      );
    } catch (err: any) {
      const errorMessage = 'Error al cargar los usuarios';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    debouncedSearchTerm,
    filterStatus,
    filterRole,
    itemsPerPage,
    fetchAllUsersNoLimit,
  ]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  useEffect(() => {
    fetchCargos();
  }, [fetchCargos]);

  // Obtener totales globales cuando cambian los filtros
  useEffect(() => {
    fetchTotalCounts();
  }, [fetchTotalCounts]);

  // Cuando cambian los filtros, volvemos a la primera página
  useEffect(() => {
    if (
      debouncedSearchTerm ||
      filterStatus !== 'todos' ||
      filterRole !== 'todos'
    ) {
      setPage(1);
    }
  }, [debouncedSearchTerm, filterStatus, filterRole]);
  // Ya no necesitamos filtrado adicional porque lo aplicamos en fetchAllUsers

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      nombres: '',
      apellidos: '',
      email: '',
      id_cargo_administrativo:
        cargos.length > 0 ? cargos[0].id_cargo_administrativo : 0,
      direccion: '',
      dui: '',
      telefono: '',
    });
    setIsDialogOpen(true);
  };

  const handleEditUser = (usuario: AppUser) => {
    setEditingUser(usuario);
    setFormData({
      nombres: usuario.nombre,
      apellidos: usuario.apellido,
      email: usuario.email,
      id_cargo_administrativo:
        usuario.cargoAdministrativo.id_cargo_administrativo,
      direccion: usuario.direccion,
      dui: usuario.dui,
      telefono: usuario.telefono,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.nombres ||
      !formData.apellidos ||
      !formData.email ||
      !formData.direccion ||
      !formData.dui ||
      !formData.telefono
    ) {
      toast.error('Todos los campos son obligatorios');
      return;
    }
    if (formData.id_cargo_administrativo === 0) {
      toast.error('Debe seleccionar un rol/cargo');
      return;
    }

    try {
      const userData = {
        nombre: formData.nombres,
        apellido: formData.apellidos,
        email: formData.email,
        id_cargo_administrativo: formData.id_cargo_administrativo,
        direccion: formData.direccion,
        dui: formData.dui,
        telefono: formData.telefono,
      };

      if (editingUser) {
        const endpoint = `/${editingUser.type}/${editingUser.id}`;
        await api.patch(endpoint, userData);
        toast.success('Usuario actualizado correctamente');
      } else {
        let endpoint = '';
        // Verificamos el nombre del cargo en lugar del ID para mayor robustez
        const cargo = cargos.find(
          (c) => c.id_cargo_administrativo === formData.id_cargo_administrativo
        );

        if (cargo?.nombre.toLowerCase().includes('orientador')) {
          endpoint = '/orientador';
        } else if (
          cargo?.nombre.toLowerCase().includes('admin') ||
          cargo?.nombre.toLowerCase().includes('p.a') ||
          cargo?.nombre.toLowerCase().includes('personal administrativo')
        ) {
          endpoint = '/administrativo';
        } else {
          toast.error('Cargo no válido para la creación');
          return;
        }
        await api.post(endpoint, userData);
        toast.success('Usuario creado correctamente');
      }
      setIsDialogOpen(false);
      // Actualizamos tanto los usuarios como los contadores
      fetchAllUsers();
      fetchTotalCounts();
    } catch (err: any) {
      // ===== INICIO DE LA CORRECCIÓN CLAVE =====
      // Esta versión simplificada maneja TODOS los errores del backend correctamente.
      const errorMessages = err.response?.data?.message;
      if (Array.isArray(errorMessages)) {
        // Para errores de validación (400), que vienen en un array.
        toast.error(errorMessages.join('; '));
      } else {
        // Para errores únicos (409), que vienen como un solo string.
        toast.error(errorMessages || 'Ocurrió un error inesperado.');
      }
      // ===== FIN DE LA CORRECCIÓN CLAVE =====
    }
  };

  // UsuariosModule.tsx

  const handleToggleStatus = async (usuario: AppUser) => {
    const action = usuario.activo ? 'Desactivar' : 'Reactivar';
    const toastId = toast.loading(`${action.slice(0, -1)}ando usuario...`);
    try {
      const endpoint = `/${usuario.type}/${usuario.id}`;
      if (usuario.activo) {
        await api.delete(endpoint);
      } else {
        await api.patch(`${endpoint}/restore`);
      }
      toast.success(`Usuario ${action.toLowerCase()}do correctamente`, {
        id: toastId,
      });
      // Actualizamos tanto los usuarios como los contadores
      fetchAllUsers();
      fetchTotalCounts();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        `Error al ${action.toLowerCase()} el usuario`;
      toast.error(errorMessage, { id: toastId });
    }
  };

  // Ya no necesitamos estos contadores de página pues usamos los totales globales

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600">Administra los usuarios del sistema</p>
        </div>
        <Button
          onClick={handleCreateUser}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Administradores</p>
              <p className="text-2xl font-bold text-purple-600">
                {totalCounts.admins}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-purple-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">P.A.</p>
              <p className="text-2xl font-bold text-red-600">
                {totalCounts.pa}
              </p>
            </div>
            <Users className="w-8 h-8 text-red-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Orientadores</p>
              <p className="text-2xl font-bold text-green-600">
                {totalCounts.orientadores}
              </p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuarios Activos</p>
              <p className="text-2xl font-bold text-orange-600">
                {totalCounts.activos}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-orange-600" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Volver a la primera página cuando se busca
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={filterRole}
              onValueChange={(value) => {
                setFilterRole(value);
                setPage(1); // Volver a la primera página cuando se cambia el filtro
              }}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los roles</SelectItem>
                {cargos.map((cargo) => (
                  <SelectItem
                    key={cargo.id_cargo_administrativo}
                    value={cargo.nombre}
                  >
                    {cargo.nombre === 'Orientador'
                      ? 'Orientador'
                      : cargo.nombre === 'Admin'
                        ? 'Administrador'
                        : cargo.nombre === 'P.A'
                          ? 'Personal Administrativo'
                          : cargo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterStatus}
              onValueChange={(value) => {
                setFilterStatus(value);
                setPage(1); // Volver a la primera página cuando se cambia el filtro
              }}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="true">Activo</SelectItem>
                <SelectItem value="false">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Lista de Usuarios ({usuarios.length})</span>
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin inline-block" />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-red-600 p-4"
                  >
                    <AlertCircle className="w-6 h-6 inline-block mr-2" />
                    {error}
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((usuario: AppUser) => (
                  <TableRow key={`${usuario.type}-${usuario.id}`}>
                    <TableCell className="font-medium">{`${usuario.nombre} ${usuario.apellido}`}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          usuario.cargoAdministrativo
                            .id_cargo_administrativo === 1
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {usuario.cargoAdministrativo.nombre}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={usuario.activo ? 'default' : 'destructive'}
                      >
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(usuario.createdAt).toLocaleDateString()}
                    </TableCell>
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
                          className={
                            usuario.activo
                              ? 'text-orange-600 hover:text-orange-700'
                              : 'text-green-600 hover:text-green-700'
                          }
                          title={
                            usuario.activo
                              ? 'Desactivar usuario'
                              : 'Activar usuario'
                          }
                        >
                          {usuario.activo ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between space-x-2 py-4">
            <p className="text-sm text-gray-600">
              Mostrando <span className="font-semibold">{usuarios.length}</span>{' '}
              de <span className="font-semibold">{totalItems}</span> resultados
              {(debouncedSearchTerm ||
                filterStatus !== 'todos' ||
                filterRole !== 'todos') && (
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Modifica la información del usuario'
                : 'Completa los datos del nuevo usuario'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 pt-4">
              <div className="col-span-1">
                <Label htmlFor="nombres">Nombres</Label>
                <Input
                  id="nombres"
                  value={formData.nombres}
                  onChange={(e) =>
                    setFormData({ ...formData, nombres: e.target.value })
                  }
                  placeholder="Ej: Ana María"
                  required
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="apellidos"
                  value={formData.apellidos}
                  onChange={(e) =>
                    setFormData({ ...formData, apellidos: e.target.value })
                  }
                  placeholder="Ej: Pérez González"
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="usuario@colegio.edu"
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                  placeholder="Colonia, Municipio, Departamento"
                  required
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="dui">DUI</Label>
                <Input
                  id="dui"
                  value={formData.dui}
                  onChange={(e) =>
                    setFormData({ ...formData, dui: e.target.value })
                  }
                  placeholder="00000000-0"
                  required
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  placeholder="0000-0000"
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="rol">Rol</Label>
                <Select
                  value={formData.id_cargo_administrativo.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      id_cargo_administrativo: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un cargo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cargos.map((cargo) => (
                      <SelectItem
                        key={cargo.id_cargo_administrativo}
                        value={cargo.id_cargo_administrativo.toString()}
                      >
                        {cargo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!editingUser && (
              <div className="mt-4 flex items-start space-x-2 rounded-md border border-blue-200 bg-blue-50 p-3">
                <Info className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <p className="text-sm text-blue-800">
                  El sistema generará una contraseña temporal y la enviará al
                  correo electrónico proporcionado.
                </p>
              </div>
            )}

            <DialogFooter className="pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
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
