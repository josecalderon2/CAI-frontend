import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Plus,
  Pencil,
  CheckCircle,
  XCircle,
  List,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  obtenerTiposEvaluacion,
  crearTipoEvaluacion,
  actualizarTipoEvaluacion,
  eliminarTipoEvaluacion,
  reactivarTipoEvaluacion,
  type TipoEvaluacion,
} from '../api/services/tiposEvaluacionService';

export function TiposEvaluacionModule() {
  const [tiposEvaluacion, setTiposEvaluacion] = useState<TipoEvaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] =
    useState<TipoEvaluacion | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  useEffect(() => {
    cargarTiposEvaluacion();
  }, []);

  const cargarTiposEvaluacion = async () => {
    try {
      setLoading(true);
      const datos = await obtenerTiposEvaluacion();
      setTiposEvaluacion(datos);
      setPaginaActual(1); // Reset a la primera página cuando se cargan los datos
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar tipos de evaluación');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (tipo?: TipoEvaluacion) => {
    if (tipo) {
      setModoEdicion(true);
      setTipoSeleccionado(tipo);
      setFormData({
        nombre: tipo.nombre,
      });
    } else {
      setModoEdicion(false);
      setTipoSeleccionado(null);
      setFormData({
        nombre: '',
      });
    }
    setErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({ nombre: '' });
    setErrors({});
    setTipoSeleccionado(null);
    setModoEdicion(false);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    } else if (formData.nombre.length > 100) {
      newErrors.nombre = 'El nombre no puede exceder 100 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (modoEdicion && tipoSeleccionado) {
        await actualizarTipoEvaluacion(tipoSeleccionado.id_tipo_evaluacion, {
          nombre: formData.nombre,
        });
        toast.success('Tipo de evaluación actualizado exitosamente');
      } else {
        await crearTipoEvaluacion({
          nombre: formData.nombre,
        });
        toast.success('Tipo de evaluación creado exitosamente');
      }

      handleCloseDialog();
      cargarTiposEvaluacion();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar tipo de evaluación');
    }
  };

  const handleToggleEstado = async () => {
    if (!tipoSeleccionado) return;

    try {
      if (tipoSeleccionado.activo) {
        // Si está activo, usamos DELETE para desactivar
        await eliminarTipoEvaluacion(tipoSeleccionado.id_tipo_evaluacion);
        toast.success('Tipo de evaluación desactivado exitosamente');
      } else {
        // Si está inactivo, usamos PATCH /restore para reactivar
        await reactivarTipoEvaluacion(tipoSeleccionado.id_tipo_evaluacion);
        toast.success('Tipo de evaluación reactivado exitosamente');
      }

      setDeleteDialogOpen(false);
      setTipoSeleccionado(null);
      cargarTiposEvaluacion();
    } catch (error: any) {
      toast.error(
        error.message || 'Error al cambiar estado del tipo de evaluación'
      );
    }
  };

  const handleOpenDeleteDialog = (tipo: TipoEvaluacion) => {
    setTipoSeleccionado(tipo);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando tipos de evaluación...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tipos de Evaluación
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona los tipos de evaluación disponibles para los orientadores
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Tipo
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total de Tipos */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Tipos
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {tiposEvaluacion.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <List className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tipos Activos */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Tipos Activos
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {tiposEvaluacion.filter((t) => t.activo).length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tipos Inactivos */}
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Tipos Inactivos
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {tiposEvaluacion.filter((t) => !t.activo).length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de tipos de evaluación */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Evaluación Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {tiposEvaluacion.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay tipos de evaluación registrados
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Nombre
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Estado
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Evaluaciones
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiposEvaluacion
                      .slice(
                        (paginaActual - 1) * elementosPorPagina,
                        paginaActual * elementosPorPagina
                      )
                      .map((tipo) => (
                        <tr
                          key={tipo.id_tipo_evaluacion}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 font-medium">
                            {tipo.nombre}
                          </td>
                          <td className="py-3 px-4">
                            {tipo.activo ? (
                              <Badge className="bg-green-100 text-green-800">
                                Activo
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                Inactivo
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {tipo._count?.evaluaciones || 0}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(tipo)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDeleteDialog(tipo)}
                                className={
                                  tipo.activo
                                    ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                    : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                }
                                title={tipo.activo ? 'Desactivar' : 'Activar'}
                              >
                                {tipo.activo ? (
                                  <XCircle className="h-4 w-4" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {tiposEvaluacion.length > elementosPorPagina && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Mostrando{' '}
                    {Math.min(
                      (paginaActual - 1) * elementosPorPagina + 1,
                      tiposEvaluacion.length
                    )}{' '}
                    -{' '}
                    {Math.min(
                      paginaActual * elementosPorPagina,
                      tiposEvaluacion.length
                    )}{' '}
                    de {tiposEvaluacion.length} tipos
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPaginaActual((prev) => Math.max(1, prev - 1))
                      }
                      disabled={paginaActual === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-700">
                      Página {paginaActual} de{' '}
                      {Math.ceil(tiposEvaluacion.length / elementosPorPagina)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPaginaActual((prev) =>
                          Math.min(
                            Math.ceil(
                              tiposEvaluacion.length / elementosPorPagina
                            ),
                            prev + 1
                          )
                        )
                      }
                      disabled={
                        paginaActual ===
                        Math.ceil(tiposEvaluacion.length / elementosPorPagina)
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modoEdicion
                ? 'Editar Tipo de Evaluación'
                : 'Nuevo Tipo de Evaluación'}
            </DialogTitle>
            <DialogDescription>
              {modoEdicion
                ? 'Modifica el nombre del tipo de evaluación'
                : 'Ingresa el nombre del nuevo tipo de evaluación'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre del tipo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="Ej: Parcial, Final, Quiz, Proyecto..."
                  className={errors.nombre ? 'border-red-500' : ''}
                  autoFocus
                />
                {errors.nombre && (
                  <p className="text-sm text-red-500">{errors.nombre}</p>
                )}
                <p className="text-xs text-gray-500">
                  Este tipo estará disponible para los orientadores
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {modoEdicion ? 'Guardar cambios' : 'Crear tipo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para cambiar estado */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {tipoSeleccionado?.activo
                ? '¿Desactivar tipo de evaluación?'
                : '¿Activar tipo de evaluación?'}
            </DialogTitle>
            <DialogDescription>
              {tipoSeleccionado?.activo ? (
                <>
                  Vas a desactivar el tipo de evaluación "
                  <strong>{tipoSeleccionado?.nombre}</strong>". Los orientadores
                  no podrán usarlo para nuevas evaluaciones, pero las
                  evaluaciones existentes no se verán afectadas.
                </>
              ) : (
                <>
                  Vas a activar el tipo de evaluación "
                  <strong>{tipoSeleccionado?.nombre}</strong>". Los orientadores
                  podrán usarlo nuevamente para crear evaluaciones.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleToggleEstado}
              className={
                tipoSeleccionado?.activo
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }
            >
              {tipoSeleccionado?.activo ? 'Desactivar' : 'Activar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
