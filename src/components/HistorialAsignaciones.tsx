import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
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
import { Input } from './ui/input';
import { toast } from 'sonner';
import { Clock, Filter, Database, Loader2 } from 'lucide-react';
import historialService, {
  type HistorialItem,
} from '../api/services/historialService';
import { formatDate } from '../utils/formatDate';

export function HistorialAsignaciones() {
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [filteredHistorial, setFilteredHistorial] = useState<HistorialItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para filtros individuales
  const [filterOrientador, setFilterOrientador] = useState<string>('todos');
  const [filterCurso, setFilterCurso] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');

  // Estados para paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadHistorial();
  }, []);

  // Normaliza texto: quita acentos/espacios extras y pone en minúsculas
  const norm = (s: string) =>
    (s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim();

  // Efecto para manejar la búsqueda + filtros SIN debounce
  useEffect(() => {
    const q = norm(searchTerm);

    setFilteredHistorial(
      historial.filter((item) => {
        // Campos a buscar (normalizados)
        const orientador = norm(item.orientador.nombreCompleto);
        const curso = norm(item.curso.nombre);
        const asignatura = norm(item.asignatura?.nombre || '');

        // Coincidencia por texto (desde la 1ª letra)
        const matchesSearch =
          q === '' ||
          orientador.includes(q) ||
          curso.includes(q) ||
          asignatura.includes(q);

        // Filtros adicionales
        const matchesOrientador =
          filterOrientador === 'todos' ||
          item.orientador.id_orientador.toString() === filterOrientador;

        const matchesCurso =
          filterCurso === 'todos' ||
          item.curso.id_curso.toString() === filterCurso;

        const matchesEstado =
          filterEstado === 'todos' ||
          (filterEstado === 'abierto' ? item.abierto : !item.abierto);

        return (
          matchesSearch && matchesOrientador && matchesCurso && matchesEstado
        );
      })
    );
  }, [searchTerm, filterOrientador, filterCurso, filterEstado, historial]);

  // Actualizar paginación cuando cambia el historial filtrado
  useEffect(() => {
    setTotalPages(Math.ceil(filteredHistorial.length / itemsPerPage));
    setPage(1);
  }, [filteredHistorial.length, itemsPerPage]);

  // Obtener historial paginado
  const paginatedHistorial = filteredHistorial.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const loadHistorial = async () => {
    try {
      setIsLoading(true);
      const response = await historialService.getHistorial();
      setHistorial(response.data);
      setFilteredHistorial(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar el historial');
      toast.error('No se pudo cargar el historial de asignaciones');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="mb-6 mt-4">
        <CardHeader>
          <CardTitle className="text-xl flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros de Historial</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              placeholder="Buscar en historial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />

            {/* Filtro de Orientadores */}
            <Select
              value={filterOrientador}
              onValueChange={setFilterOrientador}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los orientadores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los orientadores</SelectItem>
                {Array.from(
                  new Set(
                    historial.map((item) => item.orientador.id_orientador)
                  )
                ).map((id) => {
                  const orientador = historial.find(
                    (item) => item.orientador.id_orientador === id
                  )?.orientador;
                  if (!orientador) return null;
                  return (
                    <SelectItem key={id} value={id.toString()}>
                      {orientador.nombreCompleto}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Filtro de Cursos */}
            <Select value={filterCurso} onValueChange={setFilterCurso}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los cursos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los cursos</SelectItem>
                {Array.from(
                  new Set(historial.map((item) => item.curso.id_curso))
                ).map((id) => {
                  const curso = historial.find(
                    (item) => item.curso.id_curso === id
                  )?.curso;
                  if (!curso) return null;
                  return (
                    <SelectItem key={id} value={id.toString()}>
                      {curso.nombre}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Filtro de Estado */}
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="abierto">Vigentes</SelectItem>
                <SelectItem value="cerrado">Finalizados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>
                Historial de Asignaciones ({filteredHistorial.length})
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-24 text-red-500">
              <Database className="w-8 h-8 mb-2" />
              <p>{error}</p>
            </div>
          ) : filteredHistorial.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-gray-500">
              <Database className="w-8 h-8 mb-2" />
              <p>No hay registros en el historial</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orientador</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Asignatura</TableHead>
                    <TableHead>Año Académico</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Fecha Término</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedHistorial.map((item) => (
                    <TableRow key={item.id_historial_curso_orientador}>
                      <TableCell>{item.orientador.nombreCompleto}</TableCell>
                      <TableCell>{item.curso.nombre}</TableCell>
                      <TableCell>{item.asignatura?.nombre || 'N/A'}</TableCell>
                      <TableCell>{item.anio_academico || 'N/A'}</TableCell>
                      <TableCell>
                        {item.es_orientador ? 'Orientador' : 'Docente'}
                      </TableCell>
                      <TableCell>
                        {formatDate(item.fecha_asignacion || '')}
                      </TableCell>
                      <TableCell>
                        {item.fecha_fin
                          ? formatDate(item.fecha_fin)
                          : 'Vigente'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            item.abierto
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.abierto ? 'Vigente' : 'Finalizado'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Controles de Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4 mt-4">
                  <div className="text-sm text-gray-500">
                    Mostrando {(page - 1) * itemsPerPage + 1} a{' '}
                    {Math.min(page * itemsPerPage, filteredHistorial.length)} de{' '}
                    {filteredHistorial.length} registros
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <div className="text-sm">
                      Página {page} de {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
