import { useState } from 'react';
import {
  asistenciaService,
  type AsistenciaConRelaciones,
  type BuscarAsistenciaParams,
  type EstadoAsistencia,
  type UpdateAsistenciaDto,
} from '../api/services/asistenciaService';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Search, Edit, AlertCircle, Calendar, User } from 'lucide-react';

interface HistorialAsistenciaProps {
  cursosAsignados: any[];
  alumnosPorCurso: Record<string, any[]>;
}

export function HistorialAsistencia({
  cursosAsignados,
  alumnosPorCurso,
}: HistorialAsistenciaProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [asistencias, setAsistencias] = useState<AsistenciaConRelaciones[]>([]);
  const [modalEditar, setModalEditar] = useState(false);
  const [asistenciaSeleccionada, setAsistenciaSeleccionada] =
    useState<AsistenciaConRelaciones | null>(null);

  // Filtros
  const [filtros, setFiltros] = useState<BuscarAsistenciaParams>({
    cursoId: undefined,
    alumnoId: undefined,
    fechaDesde: '',
    fechaHasta: '',
    estado: undefined,
  });

  // Formulario de edición
  const [formEdicion, setFormEdicion] = useState<UpdateAsistenciaDto>({
    estado: undefined,
    observacion: '',
  });

  const handleBuscar = async () => {
    setIsLoading(true);
    try {
      const resultados = await asistenciaService.buscarConFiltros(filtros);
      setAsistencias(resultados);

      if (resultados.length === 0) {
        toast.info('No se encontraron registros con los filtros aplicados');
      } else {
        toast.success(`${resultados.length} registro(s) encontrado(s)`);
      }
    } catch (e: any) {
      const errorMsg =
        e?.response?.data?.message || 'Error al buscar asistencias';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbrirModal = (asistencia: AsistenciaConRelaciones) => {
    setAsistenciaSeleccionada(asistencia);
    setFormEdicion({
      estado: asistencia.estado,
      observacion: asistencia.observacion || '',
    });
    setModalEditar(true);
  };

  const handleGuardarCambios = async () => {
    if (!asistenciaSeleccionada) return;

    // Validar que haya cambios
    if (
      formEdicion.estado === asistenciaSeleccionada.estado &&
      (formEdicion.observacion || '') ===
        (asistenciaSeleccionada.observacion || '')
    ) {
      toast.warning('No se detectaron cambios');
      return;
    }

    setIsLoading(true);
    try {
      await asistenciaService.update(
        asistenciaSeleccionada.id_asistencia,
        formEdicion
      );

      toast.success('Asistencia modificada correctamente');
      setModalEditar(false);
      handleBuscar(); // Recargar resultados
    } catch (e: any) {
      const errorMsg =
        e?.response?.data?.message || 'Error al modificar la asistencia';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const getEstadoBadge = (estado: EstadoAsistencia) => {
    const config = {
      P: { label: 'Presente', className: 'bg-green-100 text-green-800' },
      E: { label: 'Excusado', className: 'bg-blue-100 text-blue-800' },
      SP: {
        label: 'Sin Permiso',
        className: 'bg-orange-100 text-orange-800',
      },
      A: { label: 'Ausente', className: 'bg-red-100 text-red-800' },
    };
    return (
      config[estado] || {
        label: estado,
        className: 'bg-gray-100 text-gray-800',
      }
    );
  };

  const alumnosDelCurso = filtros.cursoId
    ? alumnosPorCurso[filtros.cursoId.toString()] || []
    : [];

  return (
    <div className="space-y-6">
      {/* Filtros de búsqueda */}
      <Card className="border-blue-200 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Search className="w-5 h-5" />
            <span>Buscar Asistencias Registradas</span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Busca y modifica registros de asistencia previamente guardados
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Curso */}
            <div>
              <Label className="text-gray-700 font-semibold">Curso</Label>
              <Select
                value={filtros.cursoId?.toString() || ''}
                onValueChange={(value) =>
                  setFiltros({
                    ...filtros,
                    cursoId: value ? parseInt(value) : undefined,
                    alumnoId: undefined, // Reset alumno cuando cambia curso
                  })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los cursos</SelectItem>
                  {cursosAsignados.map((curso) => (
                    <SelectItem
                      key={curso.id_curso}
                      value={curso.id_curso.toString()}
                    >
                      {curso.nombre}
                      {curso.seccion ? ` - ${curso.seccion}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Alumno */}
            <div>
              <Label className="text-gray-700 font-semibold">
                Alumno (opcional)
              </Label>
              <Select
                value={filtros.alumnoId?.toString() || ''}
                onValueChange={(value) =>
                  setFiltros({
                    ...filtros,
                    alumnoId: value ? parseInt(value) : undefined,
                  })
                }
                disabled={!filtros.cursoId}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Todos los alumnos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los alumnos</SelectItem>
                  {alumnosDelCurso.map((alumno: any) => (
                    <SelectItem
                      key={alumno.id_alumno}
                      value={alumno.id_alumno.toString()}
                    >
                      {alumno.nombre} {alumno.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado */}
            <div>
              <Label className="text-gray-700 font-semibold">
                Estado (opcional)
              </Label>
              <Select
                value={filtros.estado || ''}
                onValueChange={(value) =>
                  setFiltros({
                    ...filtros,
                    estado: (value as EstadoAsistencia) || undefined,
                  })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="P">Presente (P)</SelectItem>
                  <SelectItem value="E">Excusado (E)</SelectItem>
                  <SelectItem value="SP">Sin Permiso (SP)</SelectItem>
                  <SelectItem value="A">Ausente (A)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha Desde */}
            <div>
              <Label className="text-gray-700 font-semibold">
                Fecha Desde (opcional)
              </Label>
              <Input
                type="date"
                value={filtros.fechaDesde || ''}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaDesde: e.target.value })
                }
                className="h-11"
              />
            </div>

            {/* Fecha Hasta */}
            <div>
              <Label className="text-gray-700 font-semibold">
                Fecha Hasta (opcional)
              </Label>
              <Input
                type="date"
                value={filtros.fechaHasta || ''}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaHasta: e.target.value })
                }
                className="h-11"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              onClick={handleBuscar}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Search className="w-4 h-4 mr-2" />
              {isLoading ? 'Buscando...' : 'Buscar Registros'}
            </Button>
            {asistencias.length > 0 && (
              <span className="text-sm text-gray-600">
                {asistencias.length} resultado(s) encontrado(s)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {asistencias.length > 0 && (
        <Card className="border-gray-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-gray-900">
                  Registros Encontrados ({asistencias.length})
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-50 hover:to-indigo-50">
                    <TableHead className="font-bold text-gray-700">
                      Fecha
                    </TableHead>
                    <TableHead className="font-bold text-gray-700">
                      Alumno
                    </TableHead>
                    <TableHead className="font-bold text-gray-700">
                      Asignatura
                    </TableHead>
                    <TableHead className="font-bold text-gray-700">
                      Estado
                    </TableHead>
                    <TableHead className="font-bold text-gray-700">
                      Observación
                    </TableHead>
                    <TableHead className="text-right font-bold text-gray-700">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asistencias.map((asistencia, index) => {
                    const estadoBadge = getEstadoBadge(asistencia.estado);
                    return (
                      <TableRow
                        key={asistencia.id_asistencia}
                        className={
                          index % 2 === 0
                            ? 'bg-white hover:bg-blue-50/30'
                            : 'bg-slate-50/50 hover:bg-blue-50/40'
                        }
                      >
                        <TableCell className="font-medium">
                          {new Date(asistencia.fecha).toLocaleDateString(
                            'es-SV',
                            {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            }
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {asistencia.alumno.nombre}{' '}
                              {asistencia.alumno.apellido}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {asistencia.asignatura.nombre}
                        </TableCell>
                        <TableCell>
                          <Badge className={estadoBadge.className}>
                            {estadoBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <span className="text-sm text-gray-600 line-clamp-2">
                            {asistencia.observacion || (
                              <span className="text-gray-400 italic">
                                Sin observaciones
                              </span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAbrirModal(asistencia)}
                            className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Modificar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no hay resultados */}
      {asistencias.length === 0 && filtros.cursoId && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-12 text-center">
            <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No se encontraron registros
            </h3>
            <p className="text-sm text-gray-500">
              Intenta ajustar los filtros de búsqueda o verifica que existan
              registros de asistencia guardados.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de edición */}
      <Dialog open={modalEditar} onOpenChange={setModalEditar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center space-x-2">
              <Edit className="w-5 h-5 text-blue-600" />
              <span>Modificar Asistencia</span>
            </DialogTitle>
            <DialogDescription>
              Modifica el estado o la observación del registro de asistencia
            </DialogDescription>
          </DialogHeader>

          {asistenciaSeleccionada && (
            <div className="space-y-6">
              {/* Información del registro */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg space-y-2 border-2 border-blue-200">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <p className="text-sm">
                    <strong className="text-blue-900">Alumno:</strong>{' '}
                    <span className="text-gray-800">
                      {asistenciaSeleccionada.alumno.nombre}{' '}
                      {asistenciaSeleccionada.alumno.apellido}
                    </span>
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <p className="text-sm">
                    <strong className="text-blue-900">Fecha:</strong>{' '}
                    <span className="text-gray-800">
                      {new Date(
                        asistenciaSeleccionada.fecha
                      ).toLocaleDateString('es-SV', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </p>
                </div>
                <div className="flex items-center space-x-2 pt-2 border-t border-blue-200">
                  <p className="text-sm">
                    <strong className="text-blue-900">Estado Actual:</strong>{' '}
                    <Badge
                      className={
                        getEstadoBadge(asistenciaSeleccionada.estado).className
                      }
                    >
                      {getEstadoBadge(asistenciaSeleccionada.estado).label}
                    </Badge>
                  </p>
                </div>
              </div>

              {/* Nuevo Estado */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-900">
                  Nuevo Estado
                </Label>
                <Select
                  value={formEdicion.estado || ''}
                  onValueChange={(value) =>
                    setFormEdicion({
                      ...formEdicion,
                      estado: value as EstadoAsistencia,
                    })
                  }
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Presente (P)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="E">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>Excusado (E)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="SP">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span>Sin Permiso (SP)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="A">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Ausente (A)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Observación */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-900">
                  Observación / Motivo del cambio
                </Label>
                <Textarea
                  placeholder="Ej: Presentó constancia médica, error en el registro inicial, etc..."
                  value={formEdicion.observacion || ''}
                  onChange={(e) =>
                    setFormEdicion({
                      ...formEdicion,
                      observacion: e.target.value,
                    })
                  }
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  Es recomendable agregar el motivo del cambio para mantener un
                  registro claro
                </p>
              </div>

              {/* Alerta de auditoría */}
              <div className="flex items-start space-x-3 text-sm text-amber-700 bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">
                    🔒 Registro en Historial de Auditoría
                  </p>
                  <p className="text-amber-600">
                    Esta modificación quedará registrada permanentemente en el
                    historial del sistema, incluyendo el estado anterior, nuevo
                    estado y la fecha del cambio.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModalEditar(false)}
              className="hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarCambios}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Guardando...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
