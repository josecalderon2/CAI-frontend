import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  AlertTriangle,
  AlertCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Save,
  Shield,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  conductaService,
  type CategoriaInfraccion,
  type CreateInfraccionCatalogoDto,
  type InfraccionCatalogoResponse,
} from '../api/services/asistenciaService';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'docente' | 'administrativo';
}

interface ConductaModuleProps {
  user: User;
}

export function ConductaModule({ user }: ConductaModuleProps) {
  // user prop disponible para futuras validaciones de permisos
  const [isLoading, setIsLoading] = useState(false);
  const [catalogoInfracciones, setCatalogoInfracciones] = useState<
    InfraccionCatalogoResponse[]
  >([]);
  const [modalInfraccion, setModalInfraccion] = useState(false);
  const [modoEdicionInfraccion, setModoEdicionInfraccion] = useState(false);
  const [infraccionEditando, setInfraccionEditando] =
    useState<InfraccionCatalogoResponse | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<
    CategoriaInfraccion | 'TODAS'
  >('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const [nuevaInfraccion, setNuevaInfraccion] =
    useState<CreateInfraccionCatalogoDto>({
      categoria: 'MENOS_GRAVE',
      articulo: '',
      descripcion: '',
      puntos: 1,
    });

  useEffect(() => {
    cargarCatalogoInfracciones();
  }, []);

  const cargarCatalogoInfracciones = async () => {
    setIsLoading(true);
    try {
      const catalogo = await conductaService.getAllCatalogo();
      setCatalogoInfracciones(catalogo);
      toast.success(`${catalogo.length} infracciones cargadas`);
    } catch (e) {
      toast.error('Error al cargar el catálogo de infracciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrearInfraccion = async () => {
    if (!nuevaInfraccion.articulo || !nuevaInfraccion.descripcion) {
      toast.error('Debe completar artículo y descripción');
      return;
    }

    if (nuevaInfraccion.puntos <= 0) {
      toast.error('Los puntos deben ser mayor a 0');
      return;
    }

    setIsLoading(true);
    try {
      if (modoEdicionInfraccion && infraccionEditando) {
        // MODO EDICIÓN
        await conductaService.updateCatalogo(
          infraccionEditando.id_infraccion,
          nuevaInfraccion
        );
        toast.success('Infracción actualizada correctamente');
      } else {
        // MODO CREACIÓN
        await conductaService.createCatalogo(nuevaInfraccion);
        toast.success('Infracción creada correctamente en el catálogo');
      }

      await cargarCatalogoInfracciones();

      setModalInfraccion(false);
      setModoEdicionInfraccion(false);
      setInfraccionEditando(null);
      setNuevaInfraccion({
        categoria: 'MENOS_GRAVE',
        articulo: '',
        descripcion: '',
        puntos: 1,
      });
    } catch (e: any) {
      const errorMsg =
        e?.response?.data?.message ||
        `Error al ${modoEdicionInfraccion ? 'actualizar' : 'crear'} la infracción`;
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbrirEditarInfraccion = (
    infraccion: InfraccionCatalogoResponse
  ) => {
    setNuevaInfraccion({
      categoria: infraccion.categoria,
      articulo: infraccion.articulo,
      descripcion: infraccion.descripcion,
      puntos: infraccion.puntos,
    });

    setInfraccionEditando(infraccion);
    setModoEdicionInfraccion(true);
    setModalInfraccion(true);
  };

  const handleEliminarInfraccion = async (idInfraccion: string) => {
    if (
      !confirm(
        '¿Estás seguro de eliminar esta infracción del catálogo?\n\nADVERTENCIA: Si hay registros de conducta asociados a esta infracción, no podrá eliminarse.'
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await conductaService.deleteCatalogo(idInfraccion);
      toast.success('Infracción eliminada correctamente del catálogo');
      await cargarCatalogoInfracciones();
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        'Error al eliminar la infracción. Puede que existan registros de conducta asociados.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeColor = (categoria: CategoriaInfraccion) => {
    switch (categoria) {
      case 'MENOS_GRAVE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'GRAVE':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MUY_GRAVE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoriaLabel = (categoria: CategoriaInfraccion) => {
    switch (categoria) {
      case 'MENOS_GRAVE':
        return 'Menos Grave';
      case 'GRAVE':
        return 'Grave';
      case 'MUY_GRAVE':
        return 'Muy Grave';
      default:
        return categoria;
    }
  };

  const getCategoriaIcon = (categoria: CategoriaInfraccion) => {
    switch (categoria) {
      case 'MENOS_GRAVE':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'GRAVE':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'MUY_GRAVE':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getPuntosPorCategoria = (categoria: CategoriaInfraccion) => {
    switch (categoria) {
      case 'MENOS_GRAVE':
        return 1;
      case 'GRAVE':
        return 2;
      case 'MUY_GRAVE':
        return 3;
      default:
        return 0;
    }
  };

  // Agrupar infracciones por categoría
  const infraccionesPorCategoria = {
    MENOS_GRAVE: catalogoInfracciones.filter(
      (inf) => inf.categoria === 'MENOS_GRAVE'
    ),
    GRAVE: catalogoInfracciones.filter((inf) => inf.categoria === 'GRAVE'),
    MUY_GRAVE: catalogoInfracciones.filter(
      (inf) => inf.categoria === 'MUY_GRAVE'
    ),
  };

  // Filtrar infracciones por búsqueda y categoría
  const infraccionesFiltradas =
    categoriaFiltro === 'TODAS'
      ? catalogoInfracciones
      : catalogoInfracciones.filter((inf) => inf.categoria === categoriaFiltro);

  const infraccionesConBusqueda = infraccionesFiltradas.filter(
    (inf) =>
      inf.articulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      inf.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-l-red-600">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
          Catálogo de Infracciones de Conducta
        </h1>
        <p className="text-gray-600 mt-2 flex items-center">
          <Shield className="w-4 h-4 mr-2 text-red-600" />
          Gestión completa del catálogo de infracciones y conducta estudiantil
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-gray-500 hover:shadow-lg transition-shadow bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Total Infracciones
                </p>
                <p className="text-2xl font-bold text-gray-700">
                  {catalogoInfracciones.length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow bg-gradient-to-br from-yellow-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Menos Grave</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {infraccionesPorCategoria.MENOS_GRAVE.length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Grave</p>
                <p className="text-2xl font-bold text-orange-700">
                  {infraccionesPorCategoria.GRAVE.length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Muy Grave</p>
                <p className="text-2xl font-bold text-red-700">
                  {infraccionesPorCategoria.MUY_GRAVE.length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Filtros</span>
            </div>
            <Dialog open={modalInfraccion} onOpenChange={setModalInfraccion}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setModoEdicionInfraccion(false);
                    setInfraccionEditando(null);
                    setNuevaInfraccion({
                      categoria: 'MENOS_GRAVE',
                      articulo: '',
                      descripcion: '',
                      puntos: 1,
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Infracción
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Categoría</Label>
              <Select
                value={categoriaFiltro}
                onValueChange={(v: any) => setCategoriaFiltro(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas las Categorías</SelectItem>
                  <SelectItem value="MENOS_GRAVE">Menos Grave</SelectItem>
                  <SelectItem value="GRAVE">Grave</SelectItem>
                  <SelectItem value="MUY_GRAVE">Muy Grave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por artículo o descripción..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listado de infracciones */}
      <Card>
        <CardHeader>
          <CardTitle>
            Infracciones Registradas ({infraccionesConBusqueda.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Cargando infracciones...</p>
            </div>
          ) : infraccionesConBusqueda.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No se encontraron infracciones con los filtros aplicados
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {infraccionesConBusqueda.map((infraccion) => (
                <Card
                  key={infraccion.id_infraccion}
                  className="border-l-4 hover:shadow-md transition-shadow"
                  style={{
                    borderLeftColor:
                      infraccion.categoria === 'MENOS_GRAVE'
                        ? '#eab308'
                        : infraccion.categoria === 'GRAVE'
                          ? '#f97316'
                          : '#ef4444',
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getCategoriaIcon(infraccion.categoria)}
                          <Badge
                            variant="outline"
                            className={getBadgeColor(infraccion.categoria)}
                          >
                            {getCategoriaLabel(infraccion.categoria)}
                          </Badge>
                          <Badge variant="secondary">
                            -{infraccion.puntos} pt
                            {infraccion.puntos > 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <p className="font-semibold text-gray-900 mb-1">
                          Artículo: {infraccion.articulo}
                        </p>
                        <p className="text-sm text-gray-600">
                          {infraccion.descripcion}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleAbrirEditarInfraccion(infraccion)
                          }
                          disabled={isLoading}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() =>
                            handleEliminarInfraccion(infraccion.id_infraccion)
                          }
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de creación/edición */}
      <Dialog open={modalInfraccion} onOpenChange={setModalInfraccion}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {modoEdicionInfraccion ? (
                <>
                  <Edit className="w-5 h-5 text-blue-600" />
                  <span>Editar Infracción del Catálogo</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Crear Nueva Infracción en el Catálogo</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200 py-2">
              <AlertCircle className="h-3 w-3 text-blue-600" />
              <AlertDescription className="text-xs text-blue-700">
                {modoEdicionInfraccion
                  ? '✏️ Modifica la infracción. Los cambios se aplicarán al catálogo.'
                  : '➕ Nueva infracción para el catálogo de conducta.'}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="categoria" className="text-base font-semibold">
                1. Categoría de la Infracción
              </Label>
              <Select
                value={nuevaInfraccion.categoria}
                onValueChange={(v: CategoriaInfraccion) => {
                  const puntosDefault = getPuntosPorCategoria(v);
                  setNuevaInfraccion({
                    ...nuevaInfraccion,
                    categoria: v,
                    puntos: puntosDefault,
                  });
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MENOS_GRAVE">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span>Menos Grave</span>
                      <Badge
                        variant="outline"
                        className="ml-2 bg-yellow-100 text-yellow-800"
                      >
                        -1 pt
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="GRAVE">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span>Grave</span>
                      <Badge
                        variant="outline"
                        className="ml-2 bg-orange-100 text-orange-800"
                      >
                        -2 pts
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="MUY_GRAVE">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>Muy Grave</span>
                      <Badge
                        variant="outline"
                        className="ml-2 bg-red-100 text-red-800"
                      >
                        -3 pts
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="articulo" className="text-base font-semibold">
                2. Artículo
              </Label>
              <Input
                id="articulo"
                placeholder="Ej: Art. 45"
                value={nuevaInfraccion.articulo}
                onChange={(e) =>
                  setNuevaInfraccion({
                    ...nuevaInfraccion,
                    articulo: e.target.value,
                  })
                }
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion" className="text-base font-semibold">
                3. Descripción
              </Label>
              <Input
                id="descripcion"
                placeholder="Descripción de la infracción"
                value={nuevaInfraccion.descripcion}
                onChange={(e) =>
                  setNuevaInfraccion({
                    ...nuevaInfraccion,
                    descripcion: e.target.value,
                  })
                }
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="puntos" className="text-base font-semibold">
                4. Puntos a Descontar
              </Label>
              <Input
                id="puntos"
                type="number"
                min="1"
                value={nuevaInfraccion.puntos}
                onChange={(e) =>
                  setNuevaInfraccion({
                    ...nuevaInfraccion,
                    puntos: parseInt(e.target.value) || 0,
                  })
                }
                className="h-11"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setModalInfraccion(false);
                  setModoEdicionInfraccion(false);
                  setInfraccionEditando(null);
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button onClick={handleCrearInfraccion} disabled={isLoading}>
                {isLoading ? (
                  'Guardando...'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {modoEdicionInfraccion
                      ? 'Guardar Cambios'
                      : 'Crear Infracción'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ConductaModule;
