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
import { Clock, Filter, Database } from 'lucide-react';
import { Input } from './ui/input';

export function HistorialAsignaciones() {
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
            <div>
              <Input placeholder="Buscar en historial..." className="mb-2" />
            </div>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por orientador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los orientadores</SelectItem>
                <SelectItem value="1">Ejemplo orientador 1</SelectItem>
                <SelectItem value="2">Ejemplo orientador 2</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los cursos</SelectItem>
                <SelectItem value="101">Curso A (A)</SelectItem>
                <SelectItem value="102">Curso B (B)</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por asignatura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las asignaturas</SelectItem>
                <SelectItem value="null">
                  Sin asignatura (Solo orientador)
                </SelectItem>
                <SelectItem value="201">Matemáticas</SelectItem>
                <SelectItem value="202">Lengua</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por año académico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los años</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
            <Select>
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

      <Card className="mt-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Historial de Asignaciones (0)</span>
            </CardTitle>
            <Button variant="outline" size="sm" disabled>
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
                <TableHead>Fecha Término</TableHead>
                <TableHead>Vigencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Database className="w-8 h-8 text-gray-300" />
                    <p className="text-gray-500 font-medium">
                      No hay datos para mostrar (vista estática)
                    </p>
                    <span className="text-xs text-gray-400">
                      Conecta la API para ver registros reales.
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="flex items-center justify-between space-x-2 py-4">
            <p className="text-sm text-gray-600">
              Mostrando <span className="font-semibold">0</span> de{' '}
              <span className="font-semibold">0</span> registros
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <span className="text-sm text-gray-600">Página 1 de 1</span>
              <Button variant="outline" size="sm" disabled>
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
