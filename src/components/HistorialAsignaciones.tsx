import { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  User,
  School,
  Clock,
  Loader2,
  Filter,
  Database,
  RefreshCw,
} from 'lucide-react';
import { Input } from './ui/input';
import { toast } from 'sonner';
import asignacionesService from '../api/services/asignacionesService';
import historialService from '../api/services/historialService';
import { api } from '../api/axiosConfig';
import { formatDate } from '../utils/formatDate';

/*
 * NOTA IMPORTANTE SOBRE EL HISTORIAL DE ASIGNACIONES
 *
 * Este componente muestra el historial completo de asignaciones del sistema.
 *
 * Se ha implementado un nuevo flujo para mantener un registro histórico completo:
 *
 * 1. Antes de actualizar una asignación (en AsignacionesModule.tsx):
 *    - Se guarda el estado actual en el historial usando el nuevo endpoint:
 *      POST /asignaciones/create-historial
 *    - La fecha_fin se establece a la fecha actual
 *
 * 2. Luego se procede a actualizar la asignación normalmente con:
 *    PATCH /asignaciones/:id
 *
 * Este proceso garantiza que tenemos un registro histórico completo
 * de todas las versiones anteriores de cada asignación.
 */

// Hook para debounce del término de búsqueda
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

// Interfaces para el historial
interface OrientadorHistorial {
  id_orientador: number;
  nombreCompleto: string;
}

interface AsignaturaHistorial {
  id_asignatura: number | null;
  nombre: string | null;
}

interface CursoHistorial {
  id_curso: number;
  nombre: string;
  seccion: string | null;
}

interface HistorialItem {
  id_historial_curso_orientador: number;
  curso: CursoHistorial;
  asignatura: AsignaturaHistorial;
  orientador: OrientadorHistorial;
  es_orientador: boolean;
  anio_academico: string | null;
  fecha_asignacion: string | null; // ISO
  fecha_fin: string | null; // ISO
  abierto: boolean; // fecha_fin === null
}

interface HistorialPaginado {
  page: number;
  pageSize: number;
  total: number;
  count: number;
  data: HistorialItem[];
}

// Interfaces para objetos de UI
interface OrientadorUI {
  id: number;
  nombre: string;
}

interface CursoUI {
  id: number;
  nombre: string;
  seccion?: string;
}

interface AsignaturaUI {
  id: number;
  nombre: string;
}

export function HistorialAsignaciones() {
  // Estados para datos de API
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [orientadores, setOrientadores] = useState<OrientadorUI[]>([]);
  const [cursos, setCursos] = useState<CursoUI[]>([]);
  const [asignaturas, setAsignaturas] = useState<AsignaturaUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [filterOrientador, setFilterOrientador] = useState<string>('todos');
  const [filterCurso, setFilterCurso] = useState<string>('todos');
  const [filterAsignatura, setFilterAsignatura] = useState<string>('todos');
  const [filterAnio, setFilterAnio] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [aniosAcademicos, setAniosAcademicos] = useState<string[]>([]);

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      // Verificar si hay un token de autenticación
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No hay token de autenticación');
        toast.error('Sesión no válida. Por favor inicie sesión nuevamente.');
        // Aquí podríamos redirigir al login si es necesario
        return;
      }

      setIsLoading(true);
      try {
        // Cargar orientadores
        const orientadoresData = await asignacionesService.getOrientadores();
        setOrientadores(
          orientadoresData.map((o) => ({
            id: o.id_orientador,
            nombre: o.nombreCompleto,
          }))
        );

        // Cargar cursos
        const cursosData = await asignacionesService.getCursos();
        setCursos(
          cursosData.map((c) => ({
            id: c.id_curso,
            nombre: c.nombre,
            seccion: c.seccion || '',
          }))
        );

        // Cargar asignaturas
        const asignaturasData = await asignacionesService.getAsignaturas();
        setAsignaturas(
          asignaturasData.map((a) => ({
            id: a.id_asignatura,
            nombre: a.nombre,
          }))
        );

        // Cargar historial con los filtros actuales
        await loadHistorial();
      } catch (error: any) {
        console.error('Error al cargar datos iniciales:', error);

        // Verificar si es un error de autorización
        if (error.response && error.response.status === 401) {
          toast.error('No autorizado. Por favor inicie sesión nuevamente.');
          // Aquí podríamos redirigir al login si es necesario
        } else {
          toast.error(
            'Error al cargar los datos. Por favor, recargue la página.'
          );
        }
      }
    };

    loadData();
  }, []);

  // Efecto para cargar el historial cuando cambian los filtros o la página
  useEffect(() => {
    loadHistorial();
  }, [
    page,
    debouncedSearchTerm,
    filterOrientador,
    filterCurso,
    filterAsignatura,
    filterAnio,
    filterEstado,
  ]);

  // Función para recargar datos directamente
  const checkDirectApiResponse = async () => {
    try {
      setIsLoading(true);
      toast.info('Recargando datos del historial usando método directo...');

      // Usar una petición extremadamente simple, sin parámetros ni headers adicionales
      const response = await api.get<any>('/asignaciones/historial');
      console.log('Datos obtenidos:', response.data);

      // Tipo correcto para el manejo de datos
      const responseData = response.data as {
        data: HistorialItem[];
        total: number;
        page: number;
        pageSize: number;
        count: number;
      };

      if (
        responseData &&
        responseData.data &&
        Array.isArray(responseData.data)
      ) {
        // Actualizar estados directamente
        setHistorial(responseData.data);
        setTotalItems(responseData.total || 0);
        setTotalPages(Math.ceil((responseData.total || 0) / itemsPerPage));
        toast.success(`Se encontraron ${responseData.data.length} registros`);

        // Limpiar filtros automáticamente
        setFilterOrientador('todos');
        setFilterCurso('todos');
        setFilterAsignatura('todos');
        setFilterAnio('todos');
        setFilterEstado('todos');
        setSearchTerm('');

        // Extraer años para el filtro
        if (responseData.data && Array.isArray(responseData.data)) {
          const anios = Array.from(
            new Set(
              responseData.data
                .map((item) => item.anio_academico)
                .filter(Boolean)
            )
          ) as string[];
          setAniosAcademicos(anios);
        }
      } else {
        toast.warning('No se encontraron registros');
        setHistorial([]);
        setTotalItems(0);
        setTotalPages(1);
      }
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error:', error);

      // Verificar si es un error de autorización
      if (error.response && error.response.status === 401) {
        toast.error('No autorizado. Por favor inicie sesión nuevamente.');
        // Podríamos redirigir al login aquí si es necesario
      } else {
        toast.error('No se pudieron cargar los datos');
      }

      setHistorial([]);
      setTotalItems(0);
      setTotalPages(1);
      setIsLoading(false);
    }
  };

  // Función para cargar el historial - Método extremadamente simplificado para evitar problemas
  const loadHistorial = async () => {
    setIsLoading(true);
    try {
      console.log('Intentando cargar historial directo');

      // Usar el método de emergencia directo sin parámetros
      const response = await historialService.getHistorialDirecto();

      // Actualizar estados con la respuesta
      setHistorial(response.data || []);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
      setTotalItems(response.total);

      // Extraer años para el filtro
      if (response.data && Array.isArray(response.data)) {
        const anios = Array.from(
          new Set(
            response.data.map((item) => item.anio_academico).filter(Boolean)
          )
        ) as string[];
        setAniosAcademicos(anios);
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error('Error al cargar historial:', error);

      // Verificar si es un error de autorización
      if (error.response && error.response.status === 401) {
        toast.error('No autorizado. Por favor inicie sesión nuevamente.');
        // Aquí podríamos redirigir al login si es necesario
      } else {
        toast.error('Error al cargar el historial. Intente nuevamente.');
      }

      // Establecer datos vacíos para evitar errores en la UI
      setHistorial([]);
      setTotalPages(1);
      setTotalItems(0);
      setIsLoading(false);
    }
  };

  // Filtrar el historial con el término de búsqueda, añadiendo verificación para evitar errores
  const filteredHistorial = historial.filter((item) => {
    // Verificar que el item y sus propiedades existen
    if (!item || !item.orientador || !item.curso) return false;

    if (!debouncedSearchTerm) return true;

    const searchTermLower = debouncedSearchTerm.toLowerCase();

    return (
      (item.orientador?.nombreCompleto &&
        item.orientador.nombreCompleto
          .toLowerCase()
          .includes(searchTermLower)) ||
      (item.curso?.nombre &&
        item.curso.nombre.toLowerCase().includes(searchTermLower)) ||
      (item.asignatura?.nombre &&
        item.asignatura.nombre.toLowerCase().includes(searchTermLower))
    );
  });

  return (
    <>
      {/* Filtros para el historial */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros de Historial</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Buscar en historial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
              />
            </div>

            <Select
              value={filterOrientador}
              onValueChange={(value) => {
                setFilterOrientador(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por orientador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los orientadores</SelectItem>
                {orientadores.map((orientador) => (
                  <SelectItem
                    key={orientador.id}
                    value={orientador.id.toString()}
                  >
                    {orientador.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterCurso}
              onValueChange={(value) => {
                setFilterCurso(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los cursos</SelectItem>
                {cursos.map((curso) => (
                  <SelectItem key={curso.id} value={curso.id.toString()}>
                    {curso.nombre} {curso.seccion && `(${curso.seccion})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterAsignatura}
              onValueChange={(value) => {
                setFilterAsignatura(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por asignatura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las asignaturas</SelectItem>
                <SelectItem value="null">
                  Sin asignatura (Solo orientador)
                </SelectItem>
                {asignaturas.map((asignatura) => (
                  <SelectItem
                    key={asignatura.id}
                    value={asignatura.id.toString()}
                  >
                    {asignatura.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterAnio}
              onValueChange={(value) => {
                setFilterAnio(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por año académico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los años</SelectItem>
                {aniosAcademicos.map((anio) => (
                  <SelectItem key={anio} value={anio}>
                    {anio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterEstado}
              onValueChange={(value) => {
                setFilterEstado(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por vigencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="abierto">Vigente</SelectItem>
                <SelectItem value="cerrado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de historial */}
      <Card className="mt-16">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Historial de Asignaciones ({totalItems})</span>
            </CardTitle>

            <Button
              variant="outline"
              size="sm"
              onClick={checkDirectApiResponse}
            >
              Verificar API
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orientador</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Asignatura</TableHead>
                <TableHead>Año Académico</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead title="Fecha en que terminó la asignación (en blanco si sigue activa)">
                  Fecha Término
                </TableHead>
                <TableHead title="Indica si la asignación sigue vigente o ya ha finalizado">
                  Vigencia
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col justify-center items-center h-full">
                      <div className="flex items-center mb-2">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        <span>Buscando registros en el historial...</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        Si la tabla de historial ha sido borrada, no se
                        mostrarán datos
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredHistorial.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Database className="w-8 h-8 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        No se encontraron registros en el historial
                      </p>
                      <Button
                        variant="outline"
                        onClick={checkDirectApiResponse}
                        className="mt-2"
                      >
                        Recargar datos
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredHistorial.map((item) => (
                  <TableRow key={item.id_historial_curso_orientador}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>
                          {item.orientador?.nombreCompleto || 'Sin orientador'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <School className="w-4 h-4 text-gray-400" />
                        <div>
                          <span>{item.curso?.nombre || 'Sin curso'}</span>
                          {item.curso?.seccion && (
                            <span className="text-sm text-gray-500 ml-1">
                              {item.curso?.seccion}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.asignatura?.nombre ? (
                        item.asignatura.nombre
                      ) : (
                        <span className="text-gray-400">Sin asignatura</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.anio_academico || (
                        <span className="text-gray-400">No especificado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.es_orientador ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          Orientador Principal
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600">
                          Orientador
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.fecha_asignacion ? (
                        formatDate(item.fecha_asignacion, 'short')
                      ) : (
                        <span className="text-gray-400">No especificada</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.fecha_fin ? (
                        <span title="Fecha en que finalizó esta asignación">
                          {formatDate(item.fecha_fin, 'short')}
                        </span>
                      ) : (
                        <span
                          className="text-gray-400"
                          title="Esta asignación sigue activa actualmente"
                        >
                          Sin fecha de término
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.abierto ? 'default' : 'secondary'}
                        className={
                          item.abierto
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }
                        title={
                          item.abierto
                            ? 'La asignación está actualmente vigente'
                            : 'La asignación ha finalizado y ya no está vigente'
                        }
                      >
                        {item.abierto ? 'Vigente' : 'Finalizado'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Controles de paginación */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <p className="text-sm text-gray-600">
              Mostrando{' '}
              <span className="font-semibold">{filteredHistorial.length}</span>{' '}
              de <span className="font-semibold">{totalItems}</span> registros
              {(debouncedSearchTerm ||
                filterEstado !== 'todos' ||
                filterCurso !== 'todos' ||
                filterOrientador !== 'todos' ||
                filterAsignatura !== 'todos' ||
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
                Página {page} de {totalPages || 1}
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
    </>
  );
}
