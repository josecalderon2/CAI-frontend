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
  Users,
  BookOpen,
  Eye,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  conductaService,
  type CategoriaInfraccion,
  type CreateInfraccionCatalogoDto,
  type InfraccionCatalogoResponse,
  type AlumnoConInfracciones,
  type AlumnosConInfraccionesResponse,
  type FiltrosConductaDto,
  type AnioDisponible,
} from '../api/services/asistenciaService';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'orientador' | 'P.A';
}

interface ConductaModuleProps {
  user: User;
  readOnly?: boolean; // Para modo de solo lectura (P.A - Personal Administrativo)
}

interface CursoResponse {
  id_curso: number;
  nombre: string;
  seccion?: string;
}

export function ConductaModule({ readOnly = false }: ConductaModuleProps) {
  // Estados para tabs
  const [activeTab, setActiveTab] = useState<'catalogo' | 'alumnos'>(
    'catalogo' // Siempre inicia en catálogo para todos
  );

  // Estados globales
  const [isLoading, setIsLoading] = useState(false);
  const [cursosDisponibles, setCursosDisponibles] = useState<CursoResponse[]>(
    []
  );
  const [aniosDisponibles, setAniosDisponibles] = useState<AnioDisponible[]>(
    []
  );

  // Estados para Catálogo de Infracciones
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

  // Estados para Alumnos con Infracciones
  const [alumnosConInfracciones, setAlumnosConInfracciones] = useState<
    AlumnoConInfracciones[]
  >([]);
  const [totalAlumnos, setTotalAlumnos] = useState(0);
  const [filtrosAlumnos, setFiltrosAlumnos] = useState<FiltrosConductaDto>({
    id_curso: undefined,
    anio_academico: new Date().getFullYear().toString(),
    trimestre: undefined,
  });
  const [busquedaAlumno, setBusquedaAlumno] = useState('');
  const [modalDetalleAlumno, setModalDetalleAlumno] = useState(false);
  const [alumnoSeleccionado, setAlumnoSeleccionado] =
    useState<AlumnoConInfracciones | null>(null);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (activeTab === 'alumnos') {
      cargarAlumnosConInfracciones();
    }
  }, [activeTab, filtrosAlumnos]);

  const cargarDatosIniciales = async () => {
    await Promise.all([
      cargarCatalogoInfracciones(),
      cargarCursos(),
      cargarAniosDisponibles(),
    ]);
  };

  const cargarCursos = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/cursos', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (response.ok) {
        const cursos = await response.json();
        setCursosDisponibles(cursos);
      }
    } catch (error) {
      console.error('Error al cargar cursos:', error);
    }
  };

  const cargarAniosDisponibles = async () => {
    try {
      const response = await conductaService.getAniosDisponibles();
      setAniosDisponibles(response.anios);
    } catch (error) {
      console.error('Error al cargar años disponibles:', error);
      // Si falla, usar años dinámicos como fallback
      setAniosDisponibles([]);
    }
  };

  const cargarCatalogoInfracciones = async () => {
    setIsLoading(true);
    try {
      const catalogo = await conductaService.getAllCatalogo();
      setCatalogoInfracciones(catalogo);
    } catch (e) {
      toast.error('Error al cargar el catálogo de infracciones');
    } finally {
      setIsLoading(false);
    }
  };

  const cargarAlumnosConInfracciones = async () => {
    setIsLoading(true);
    try {
      const filtros: FiltrosConductaDto = {
        id_curso: filtrosAlumnos.id_curso,
        anio_academico: filtrosAlumnos.anio_academico,
        trimestre: filtrosAlumnos.trimestre,
      };

      const response: AlumnosConInfraccionesResponse =
        await conductaService.getAlumnosConInfracciones(filtros);
      setAlumnosConInfracciones(response.alumnos);
      setTotalAlumnos(response.total_alumnos);
    } catch (error) {
      console.error('Error al cargar alumnos con infracciones:', error);
      toast.error('Error al cargar alumnos con infracciones');
      setAlumnosConInfracciones([]);
      setTotalAlumnos(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Generar años académicos dinámicamente (año actual ± 3 años)
  // O usar los años disponibles del backend si existen
  const getAniosAcademicos = () => {
    // Si tenemos datos del backend, usar esos
    if (aniosDisponibles.length > 0) {
      return aniosDisponibles.map((a) => parseInt(a.anio_academico));
    }

    // Fallback: generar años dinámicamente (año actual ± 3 años)
    const anioActual = new Date().getFullYear();
    const anios = [];
    for (let i = -3; i <= 3; i++) {
      anios.push(anioActual + i);
    }
    return anios.sort((a, b) => b - a); // Ordenar descendente (más reciente primero)
  };

  // Obtener trimestres disponibles para el año seleccionado
  const getTrimestresDisponibles = () => {
    if (!filtrosAlumnos.anio_academico || aniosDisponibles.length === 0) {
      return [1, 2, 3]; // Por defecto, mostrar 1, 2, 3
    }

    const anioInfo = aniosDisponibles.find(
      (a) => a.anio_academico === filtrosAlumnos.anio_academico
    );

    return anioInfo?.trimestres_disponibles || [1, 2, 3];
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

  // Filtrar alumnos por búsqueda
  const alumnosFiltrados = alumnosConInfracciones.filter((alumno) =>
    `${alumno.nombre} ${alumno.apellido}`
      .toLowerCase()
      .includes(busquedaAlumno.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Conducta
            </h1>
            <p className="text-gray-600 mt-1">
              Catálogo de infracciones y vista general de alumnos
            </p>
          </div>
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 flex items-center gap-2 px-4 py-2"
          >
            <Shield className="w-4 h-4" />
            Conducta
          </Badge>
        </div>

        {/* Tabs de navegación */}
        <Card className="shadow-sm">
          <CardContent className="p-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('catalogo')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-all rounded-md ${
                  activeTab === 'catalogo'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Catálogo de Infracciones</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('alumnos')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-all rounded-md ${
                  activeTab === 'alumnos'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Alumnos con Infracciones</span>
                  {totalAlumnos > 0 && (
                    <span className="px-2 py-0.5 bg-white/20 text-current text-xs font-semibold rounded-full">
                      {totalAlumnos}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Contenido condicional según tab activa */}
        {activeTab === 'catalogo' && (
          <>
            {/* Estadísticas rápidas del catálogo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-blue-600 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Total Infracciones
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
                        {catalogoInfracciones.length}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <Shield className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-600 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Menos Grave</p>
                      <p className="text-3xl font-bold text-yellow-600">
                        {infraccionesPorCategoria.MENOS_GRAVE.length}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <AlertCircle className="w-8 h-8 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-600 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Grave</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {infraccionesPorCategoria.GRAVE.length}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <AlertTriangle className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-600 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Muy Grave</p>
                      <p className="text-3xl font-bold text-red-600">
                        {infraccionesPorCategoria.MUY_GRAVE.length}
                      </p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros y búsqueda */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-600" />
                    <span>Filtros y Búsqueda</span>
                  </div>
                  {!readOnly && (
                    <Dialog
                      open={modalInfraccion}
                      onOpenChange={setModalInfraccion}
                    >
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
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Categoría</Label>
                    <Select
                      value={categoriaFiltro}
                      onValueChange={(v: any) => setCategoriaFiltro(v)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODAS">
                          Todas las Categorías
                        </SelectItem>
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
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Listado de infracciones */}
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent border-b">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>Infracciones Registradas</span>
                  <Badge className="bg-blue-600 text-white ml-auto">
                    {infraccionesConBusqueda.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-500">Cargando infracciones...</p>
                  </div>
                ) : infraccionesConBusqueda.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium mb-2">
                      No se encontraron infracciones
                    </p>
                    <p className="text-gray-400 text-sm">
                      {busqueda || categoriaFiltro !== 'TODAS'
                        ? 'Intenta ajustar los filtros de búsqueda'
                        : 'Comienza agregando infracciones al catálogo'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {infraccionesConBusqueda.map((infraccion) => (
                      <Card
                        key={infraccion.id_infraccion}
                        className="border-l-4 hover:shadow-md transition-shadow duration-200"
                        style={{
                          borderLeftColor:
                            infraccion.categoria === 'MENOS_GRAVE'
                              ? '#eab308'
                              : infraccion.categoria === 'GRAVE'
                                ? '#f97316'
                                : '#ef4444',
                        }}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-6">
                            <div className="flex-1 min-w-0 space-y-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                {getCategoriaIcon(infraccion.categoria)}
                                <Badge
                                  variant="outline"
                                  className={`${getBadgeColor(infraccion.categoria)} font-medium px-3 py-1`}
                                >
                                  {getCategoriaLabel(infraccion.categoria)}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className="bg-gray-100 text-gray-700 px-3 py-1"
                                >
                                  -{infraccion.puntos} punto
                                  {infraccion.puntos !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 text-lg mb-2">
                                  {infraccion.articulo}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {infraccion.descripcion}
                                </p>
                              </div>
                            </div>
                            {!readOnly && (
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleAbrirEditarInfraccion(infraccion)
                                  }
                                  disabled={isLoading}
                                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleEliminarInfraccion(
                                      infraccion.id_infraccion
                                    )
                                  }
                                  disabled={isLoading}
                                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
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
              <DialogContent className="max-w-lg p-6">
                <DialogHeader className="mb-4">
                  <DialogTitle className="flex items-center space-x-2 text-xl">
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
                    <Label
                      htmlFor="categoria"
                      className="text-base font-semibold"
                    >
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
                    <Label
                      htmlFor="articulo"
                      className="text-base font-semibold"
                    >
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
                    <Label
                      htmlFor="descripcion"
                      className="text-base font-semibold"
                    >
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
                    <Button
                      onClick={handleCrearInfraccion}
                      disabled={isLoading}
                    >
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
          </>
        )}

        {/* Tab de Alumnos con Infracciones */}
        {activeTab === 'alumnos' && (
          <>
            {/* Filtros para alumnos */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  Buscar y Filtrar Alumnos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Nombre del Alumno
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar por nombre..."
                        value={busquedaAlumno}
                        onChange={(e) => setBusquedaAlumno(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Año Académico
                    </Label>
                    <Select
                      value={
                        filtrosAlumnos.anio_academico ||
                        new Date().getFullYear().toString()
                      }
                      onValueChange={(value) =>
                        setFiltrosAlumnos({
                          ...filtrosAlumnos,
                          anio_academico: value,
                        })
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccionar año" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAniosAcademicos().map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Curso
                    </Label>
                    <Select
                      value={filtrosAlumnos.id_curso?.toString() || 'todos'}
                      onValueChange={(value) =>
                        setFiltrosAlumnos({
                          ...filtrosAlumnos,
                          id_curso:
                            value === 'todos' ? undefined : parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Todos los cursos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los cursos</SelectItem>
                        {cursosDisponibles.map((curso) => (
                          <SelectItem
                            key={curso.id_curso}
                            value={curso.id_curso.toString()}
                          >
                            {curso.nombre}{' '}
                            {curso.seccion ? `- ${curso.seccion}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Trimestre
                    </Label>
                    <Select
                      value={filtrosAlumnos.trimestre?.toString() || 'todos'}
                      onValueChange={(value) =>
                        setFiltrosAlumnos({
                          ...filtrosAlumnos,
                          trimestre:
                            value === 'todos' ? undefined : parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccionar trimestre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {getTrimestresDisponibles().map((trimestre) => (
                          <SelectItem
                            key={trimestre}
                            value={trimestre.toString()}
                          >
                            Trimestre {trimestre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {(busquedaAlumno ||
                  filtrosAlumnos.id_curso ||
                  filtrosAlumnos.trimestre ||
                  filtrosAlumnos.anio_academico !==
                    new Date().getFullYear().toString()) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-blue-600">
                        {alumnosFiltrados.length}
                      </span>{' '}
                      alumno{alumnosFiltrados.length !== 1 ? 's' : ''}{' '}
                      encontrado
                      {alumnosFiltrados.length !== 1 ? 's' : ''} con
                      infracciones
                      {filtrosAlumnos.anio_academico && (
                        <span className="ml-2 text-gray-700">
                          en el año{' '}
                          <strong>{filtrosAlumnos.anio_academico}</strong>
                        </span>
                      )}
                      {filtrosAlumnos.trimestre && (
                        <span className="ml-2 text-gray-700">
                          - Trimestre{' '}
                          <strong>{filtrosAlumnos.trimestre}</strong>
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Listado de alumnos con infracciones */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent border-b border-gray-200">
                <CardTitle className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  <span className="text-xl font-bold text-gray-900">
                    Alumnos con Infracciones
                  </span>
                  <Badge className="bg-blue-600 text-white ml-auto">
                    {alumnosFiltrados.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-500">Cargando alumnos...</p>
                  </div>
                ) : alumnosFiltrados.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium mb-2">
                      No se encontraron alumnos con infracciones
                    </p>
                    <p className="text-gray-400 text-sm">
                      {busquedaAlumno ||
                      filtrosAlumnos.id_curso ||
                      filtrosAlumnos.trimestre
                        ? 'Intenta ajustar los filtros de búsqueda'
                        : 'No hay registros de conducta para mostrar'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alumnosFiltrados.map((alumno) => (
                      <Card
                        key={alumno.id_alumno}
                        className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-6">
                            {/* Información del alumno */}
                            <div className="flex-1 space-y-4">
                              {/* Nombre y curso */}
                              <div>
                                <h3 className="font-bold text-gray-900 text-lg">
                                  {alumno.nombre} {alumno.apellido}
                                </h3>
                                {alumno.cursos && alumno.cursos.length > 0 && (
                                  <p className="text-sm text-gray-600 mt-1.5">
                                    {alumno.cursos.map((curso, idx) => (
                                      <span key={curso.id_curso}>
                                        {curso.nombre} - {curso.seccion}
                                        {idx < alumno.cursos.length - 1 && ', '}
                                      </span>
                                    ))}
                                  </p>
                                )}
                              </div>

                              {/* Resumen de infracciones por categoría */}
                              <div className="flex flex-wrap gap-2.5">
                                {alumno.estadisticas.por_categoria
                                  .MENOS_GRAVE && (
                                  <div className="flex items-center gap-1.5 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-xs font-semibold">
                                      {
                                        alumno.estadisticas.por_categoria
                                          .MENOS_GRAVE.cantidad
                                      }{' '}
                                      Menos Grave
                                    </span>
                                    <span className="text-xs text-yellow-600">
                                      (
                                      {
                                        alumno.estadisticas.por_categoria
                                          .MENOS_GRAVE.puntos
                                      }{' '}
                                      pts)
                                    </span>
                                  </div>
                                )}
                                {alumno.estadisticas.por_categoria.GRAVE && (
                                  <div className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg border border-orange-200">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-xs font-semibold">
                                      {
                                        alumno.estadisticas.por_categoria.GRAVE
                                          .cantidad
                                      }{' '}
                                      Grave
                                    </span>
                                    <span className="text-xs text-orange-600">
                                      (
                                      {
                                        alumno.estadisticas.por_categoria.GRAVE
                                          .puntos
                                      }{' '}
                                      pts)
                                    </span>
                                  </div>
                                )}
                                {alumno.estadisticas.por_categoria
                                  .MUY_GRAVE && (
                                  <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200">
                                    <XCircle className="w-4 h-4" />
                                    <span className="text-xs font-semibold">
                                      {
                                        alumno.estadisticas.por_categoria
                                          .MUY_GRAVE.cantidad
                                      }{' '}
                                      Muy Grave
                                    </span>
                                    <span className="text-xs text-red-600">
                                      (
                                      {
                                        alumno.estadisticas.por_categoria
                                          .MUY_GRAVE.puntos
                                      }{' '}
                                      pts)
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Total de puntos descontados */}
                              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-l-4 border-red-600 rounded-md">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                <span className="text-sm font-semibold text-red-900">
                                  Total de puntos descontados:{' '}
                                  <span className="font-bold text-base">
                                    {alumno.estadisticas.total_puntos}
                                  </span>
                                </span>
                              </div>
                            </div>

                            {/* Botón ver detalle */}
                            <Button
                              onClick={() => {
                                setAlumnoSeleccionado(alumno);
                                setModalDetalleAlumno(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 flex-shrink-0 shadow-sm"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalle
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Modal de Detalle del Alumno */}
        <Dialog open={modalDetalleAlumno} onOpenChange={setModalDetalleAlumno}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Users className="w-6 h-6 text-blue-600" />
                <span>
                  Detalle de Infracciones - {alumnoSeleccionado?.nombre}{' '}
                  {alumnoSeleccionado?.apellido}
                </span>
              </DialogTitle>
            </DialogHeader>

            {alumnoSeleccionado && (
              <div className="space-y-6">
                {/* Resumen */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-600 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-sm font-semibold text-blue-900">
                      Total de infracciones:{' '}
                      <span className="text-lg">
                        {alumnoSeleccionado.estadisticas.total_infracciones}
                      </span>{' '}
                      | Puntos descontados:{' '}
                      <span className="text-lg">
                        {alumnoSeleccionado.estadisticas.total_puntos}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lista de infracciones detallada */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Historial de Infracciones
                    <Badge variant="secondary" className="ml-auto">
                      {alumnoSeleccionado.infracciones.length}
                    </Badge>
                  </h3>
                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    {alumnoSeleccionado.infracciones.map((infraccion) => (
                      <Card
                        key={infraccion.id_conducta}
                        className="border-l-4 hover:shadow-md transition-shadow duration-200"
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
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-3 flex-wrap">
                                {infraccion.categoria === 'MENOS_GRAVE' && (
                                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                                )}
                                {infraccion.categoria === 'GRAVE' && (
                                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                                )}
                                {infraccion.categoria === 'MUY_GRAVE' && (
                                  <XCircle className="w-4 h-4 text-red-600" />
                                )}
                                <Badge
                                  variant="outline"
                                  className={getBadgeColor(
                                    infraccion.categoria
                                  )}
                                >
                                  {getCategoriaLabel(infraccion.categoria)}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  -{infraccion.puntos} pts
                                </Badge>
                              </div>
                              <h4 className="font-bold text-base text-gray-900 mb-2 mt-1">
                                {infraccion.articulo}
                              </h4>
                              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                                {infraccion.descripcion}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(
                                    infraccion.fecha
                                  ).toLocaleDateString('es-ES')}
                                </span>
                                <span>Trimestre {infraccion.trimestre}</span>
                                <span>Año: {infraccion.anio_academico}</span>
                              </div>
                              {infraccion.observacion && (
                                <p className="text-xs text-gray-600 mt-2 italic">
                                  Observación: {infraccion.observacion}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default ConductaModule;
