import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

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
import { formatDate } from '../utils/formatDate';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import type { PagedResponse } from '../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Target,
  Plus,
  Search,
  User,
  School,
  Users,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Pencil,
  History,
  ClipboardList,
} from 'lucide-react';
import { Input } from './ui/input';
import { toast } from 'sonner';
import asignacionesService from '../api/services/asignacionesService';
import { HistorialAsignaciones } from './HistorialAsignaciones';

// Interfaz para representar un orientador desde la API
interface OrientadorUI {
  id: number;
  nombre: string;
  email?: string;
  especialidad?: string;
}

// Interfaz para representar un curso desde la API
interface CursoUI {
  id: number;
  nombre: string;
  nivel?: string;
  grado?: string;
  seccion?: string;
  orientadorId?: number; // ID del orientador principal del curso
}

// Interfaz para representar una asignatura desde la API
interface AsignaturaUI {
  id: number;
  nombre: string;
  codigo?: string;
  nivel?: string;
}

// Interfaz para representar una asignación desde la API
interface AsignacionUI {
  id: number;
  orientadorId: number;
  cursoId: number;
  asignaturaId: number;
  fechaAsignacion: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'FINALIZADO';
  cargaHoraria: number;
  esOrientador: boolean;
  orientador?: OrientadorUI;
  curso?: CursoUI;
  asignatura?: AsignaturaUI;
}

export function AsignacionesModule() {
  // Maneja el submit del formulario de asignación
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.orientadorId || !formData.cursoId || !formData.asignaturaId) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    // Verificar que el curso tenga asignaturas asignadas
    if (getAsignaturasCompatibles(formData.cursoId).length === 0) {
      toast.error(
        'Este curso no tiene asignaturas asignadas. Por favor, seleccione otro curso.'
      );
      return;
    }

    // Verificar que no exista duplicado (ignorando el registro actual si estamos en modo edición)
    const exists = asignaciones.some(
      (a) =>
        a.orientadorId === Number(formData.orientadorId) &&
        a.cursoId === Number(formData.cursoId) &&
        a.asignaturaId === Number(formData.asignaturaId) &&
        a.estado === 'ACTIVO' &&
        (!isEditMode || (isEditMode && a.id !== editingId)) // Ignorar el registro actual en modo edición
    );

    if (exists) {
      toast.error(
        'Ya existe una asignación activa para este orientador, curso y asignatura'
      );
      return;
    }

    // Verificar si hay un orientador principal diferente al actual ya asignado al curso
    const existeOtroOrientadorPrincipal = asignaciones.some(
      (a) =>
        a.cursoId === Number(formData.cursoId) &&
        a.estado === 'ACTIVO' &&
        a.esOrientador === true &&
        a.orientadorId !== Number(formData.orientadorId) &&
        (!isEditMode || (isEditMode && a.id !== editingId)) // Ignorar registro actual si es edición
    );

    // Si ya existe otro orientador como principal y estamos intentando asignar a este como principal
    if (existeOtroOrientadorPrincipal && formData.esOrientador) {
      // Configurar estado para mostrar el diálogo de confirmación
      setConfirmDialogContent({
        title: 'Confirmación requerida',
        message:
          'Ya existe un orientador principal para este curso. ¿Está seguro de continuar con esta asignación?',
        confirmLabel: 'Aceptar',
        cancelLabel: 'Cancelar',
        onConfirm: () => {
          // Al confirmar, mostramos la segunda confirmación
          setConfirmDialogContent({
            title: 'Advertencia',
            message:
              'Esta acción reemplazará al orientador principal actual del curso. ¿Confirma que desea continuar?',
            confirmLabel: 'Confirmar',
            cancelLabel: 'Cancelar',
            onConfirm: () => {
              // Si confirma ambos diálogos, procedemos con la operación
              setConfirmDialogOpen(false);
              procederConSubmit();
            },
            onCancel: () => setConfirmDialogOpen(false),
          });
        },
        onCancel: () => setConfirmDialogOpen(false),
      });

      setConfirmDialogOpen(true);
      return;
    }

    // Si no hay orientador principal o no estamos asignando a este como principal, procedemos directamente
    procederConSubmit();
  };
  // Estado para controlar la pestaña activa
  const [activeTab, setActiveTab] = useState('asignaciones');

  // Estados para datos de API
  const [orientadores, setOrientadores] = useState<OrientadorUI[]>([]);
  const [cursos, setCursos] = useState<CursoUI[]>([]); // Para el dropdown de filtro
  const [cursosFormulario, setCursosFormulario] = useState<CursoUI[]>([]); // Para el formulario de creación
  const [asignaturas, setAsignaturas] = useState<AsignaturaUI[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Función para cargar y refrescar datos
  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Obtener orientadores
      const orientadoresData = await asignacionesService.getOrientadores();

      if (Array.isArray(orientadoresData)) {
        if (orientadoresData.length > 0) {
          const orientadoresFormateados = orientadoresData
            .map((o) => {
              // Verificar que el objeto tiene las propiedades esperadas
              if (!o || typeof o !== 'object') {
                // Elemento no válido en orientadores
                return null;
              }

              // Verificar si tiene id_orientador y nombreCompleto
              if (!('id_orientador' in o) || !('nombreCompleto' in o)) {
                // Elemento sin las propiedades requeridas
                // Intentar identificar las claves del objeto para adaptarse
                const keys = Object.keys(o);

                // Buscar claves que puedan contener el ID y el nombre
                const idKey =
                  keys.find((k) => k.toLowerCase().includes('id')) || '';
                const nombreKey =
                  keys.find(
                    (k) =>
                      k.toLowerCase().includes('nombre') ||
                      k.toLowerCase().includes('name') ||
                      k.toLowerCase().includes('apellido')
                  ) || '';

                if (idKey && nombreKey) {
                  return {
                    id: o[idKey],
                    nombre: o[nombreKey],
                    email: '',
                    especialidad: '',
                  };
                }

                return null;
              }

              // Asegurarnos de que estamos usando el ID correcto
              return {
                id: o.id_orientador,
                nombre: o.nombreCompleto,
                email: o.email || '',
                especialidad: o.especialidad || '',
              };
            })
            .filter((d) => d !== null);

          if (orientadoresFormateados.length > 0) {
            setOrientadores(orientadoresFormateados);
          } else {
            // Array formateado quedó vacío
            toast.warning(
              'No se pudieron procesar los orientadores correctamente'
            );
          }
        } else {
          // Array de orientadores original vacío
          toast.warning('No hay orientadores disponibles en el sistema');
        }
      } else if (
        typeof orientadoresData === 'object' &&
        orientadoresData !== null
      ) {
        // Intenta manejar el caso de un solo objeto orientador

        try {
          const orientadorData = orientadoresData as any;
          if (
            'id_orientador' in orientadorData &&
            'nombreCompleto' in orientadorData
          ) {
            const orientadorUnico = {
              id: orientadorData.id_orientador,
              nombre: orientadorData.nombreCompleto,
              email: orientadorData.email || '',
              especialidad: orientadorData.especialidad || '',
            };

            setOrientadores([orientadorUnico]);
          } else {
            // El objeto no tiene la estructura esperada de un orientador
            toast.error('Formato de orientador no reconocido');
          }
        } catch (err) {
          // Error al procesar objeto de orientador
          toast.error('Error al procesar datos de orientadores');
        }
      } else {
        // No se recibieron orientadores o el formato es incorrecto
        toast.error('Error al cargar la lista de orientadores');
      }

      // Obtener cursos para el filtro (con endpoint /cursos)
      const cursosData = await asignacionesService.getCursos();

      const cursosFormateados = cursosData.map((c) => ({
        id: c.id_curso,
        nombre: c.nombre,
        nivel: '', // No tenemos esta info en la API actual
        grado: '',
        seccion: c.seccion || '',
      }));

      // Mapeo más completo para ordenar correctamente los cursos
      const ordenCursos: Record<string, number> = {
        primero: 1,
        primer: 1,
        '1': 1,
        i: 1,
        segundo: 2,
        '2': 2,
        ii: 2,
        tercero: 3,
        tercer: 3,
        '3': 3,
        iii: 3,
        cuarto: 4,
        '4': 4,
        iv: 4,
        quinto: 5,
        '5': 5,
        v: 5,
        sexto: 6,
        '6': 6,
        vi: 6,
        séptimo: 7,
        septimo: 7,
        '7': 7,
        vii: 7,
        octavo: 8,
        '8': 8,
        viii: 8,
        noveno: 9,
        '9': 9,
        ix: 9,
        décimo: 10,
        decimo: 10,
        '10': 10,
        x: 10,
        undécimo: 11,
        undecimo: 11,
        onceavo: 11,
        '11': 11,
        xi: 11,
        duodécimo: 12,
        duodecimo: 12,
        doceavo: 12,
        '12': 12,
        xii: 12,
      };

      // Función mejorada para determinar el orden de un curso
      const getOrdenCurso = (nombre: string): number => {
        const nombreLower = nombre.toLowerCase().trim();

        // 1. Buscar coincidencias exactas primero
        for (const [clave, valor] of Object.entries(ordenCursos)) {
          // Buscar coincidencias exactas (por ejemplo, "Primero A" contiene "primero")
          if (
            nombreLower === clave ||
            nombreLower.startsWith(clave + ' ') ||
            nombreLower.includes(' ' + clave + ' ') ||
            nombreLower.endsWith(' ' + clave)
          ) {
            return valor;
          }
        }

        // 2. Buscar coincidencias parciales
        for (const [clave, valor] of Object.entries(ordenCursos)) {
          if (nombreLower.includes(clave)) {
            return valor;
          }
        }

        // 3. Buscar números en el nombre
        const numeroMatch = nombreLower.match(/\d+/);
        if (numeroMatch && numeroMatch[0]) {
          const numero = parseInt(numeroMatch[0], 10);
          if (numero >= 1 && numero <= 12) {
            return numero;
          }
        }

        return 99; // Valor por defecto para cursos que no siguen el patrón
      };

      // Ordenar los cursos por grado académico
      const cursosOrdenados = [...cursosFormateados].sort((a, b) => {
        const ordenA = getOrdenCurso(a.nombre);
        const ordenB = getOrdenCurso(b.nombre);

        if (ordenA === ordenB) {
          // Si el grado es igual, ordenar por sección (A, B, C, etc.)
          return a.nombre.localeCompare(b.nombre);
        }

        return ordenA - ordenB;
      });

      // Registramos cómo quedó el ordenamiento para debug
      console.log(
        'Cursos ordenados:',
        cursosOrdenados.map(
          (c) => `${c.nombre} (orden: ${getOrdenCurso(c.nombre)})`
        )
      );

      setCursos(cursosOrdenados);

      // Obtener cursos para el formulario (con endpoint /cursos/all)
      const cursosAllData = await asignacionesService.getCursosAll();

      const cursosAllFormateados = cursosAllData.map((c) => ({
        id: c.id_curso,
        nombre: c.nombre,
        nivel: '', // No tenemos esta info en la API actual
        grado: '',
        seccion: c.seccion || '',
      }));
      setCursosFormulario(cursosAllFormateados);

      // Obtener asignaturas
      const asignaturasData = await asignacionesService.getAsignaturas();

      const asignaturasFormateadas = asignaturasData.map((a) => ({
        id: a.id_asignatura,
        nombre: a.nombre,
        codigo: a.orden_en_reporte || '',
        nivel: '', // No tenemos esta info en la API actual
      }));
      setAsignaturas(asignaturasFormateadas);

      // Obtener asignaciones
      const asignacionesResponse = await asignacionesService.getAsignaciones();

      // Verificar si hay datos de asignaciones
      const asignacionesData = asignacionesResponse?.data || [];

      if (asignacionesData.length === 0) {
        // No se recibieron asignaciones del servidor
        setAsignaciones([]);
        return;
      }

      const asignacionesFormateadas = asignacionesData
        .map((a) => {
          // Verificar que los objetos anidados existan y tengan los campos necesarios
          if (!a || !a.docente || !a.curso || !a.asignatura) {
            // Asignación con datos faltantes
            return null;
          }

          return {
            id: a.id_asignatura_orientador,
            orientadorId: a.docente?.id_orientador,
            cursoId: a.curso?.id_curso,
            asignaturaId: a.asignatura?.id_asignatura,
            fechaAsignacion: a.fechaAsignacion || '',
            estado: a.estado || 'ACTIVO',
            cargaHoraria: a.cargaHorariaSemanal || 0,
            esOrientador: a.esOrientador || false,
            orientador: {
              id: a.docente.id_orientador,
              nombre: a.docente.nombreCompleto,
            },
            curso: {
              id: a.curso.id_curso,
              nombre: a.curso.nombre,
              seccion: a.curso.seccion || '',
            },
            asignatura: {
              id: a.asignatura.id_asignatura,
              nombre: a.asignatura.nombre,
              codigo: a.asignatura.orden_en_reporte || '',
            },
          };
        })
        .filter((item) => item !== null) as AsignacionUI[];
      setAsignaciones(asignacionesFormateadas);
    } catch (error) {
      // Error al cargar datos
      toast.error('Error al cargar datos. Por favor, intente nuevamente.');

      // Inicializar arrays vacíos en caso de error
      setOrientadores([]);
      setCursos([]);
      setAsignaturas([]);
      setAsignaciones([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // Debounce para mejorar rendimiento
  const [filterOrientador, setFilterOrientador] = useState<string>('todos');
  const [filterCurso, setFilterCurso] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  // Estados para el diálogo de confirmación personalizado
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogContent, setConfirmDialogContent] = useState({
    title: '',
    message: '',
    confirmLabel: 'Aceptar',
    cancelLabel: 'Cancelar',
    onConfirm: () => {},
    onCancel: () => {},
  });
  const [formData, setFormData] = useState({
    orientadorId: '',
    cursoId: '',
    asignaturaId: '',
    cargaHoraria: 4,
    esOrientador: false,
  });

  // Funciones auxiliares para obtener nombres
  const getOrientadorNombre = (id: number) =>
    orientadores.find((o: OrientadorUI) => o.id === id)?.nombre || 'N/A';
  const getCursoNombre = (id: number) =>
    cursos.find((c: CursoUI) => c.id === id)?.nombre || 'N/A';
  const getAsignaturaNombre = (id: number) =>
    asignaturas.find((a: AsignaturaUI) => a.id === id)?.nombre || 'N/A';
  const getAsignaturaCodigo = (id: number) =>
    asignaturas.find((a: AsignaturaUI) => a.id === id)?.codigo || 'N/A';

  // Filtrar asignaciones con lógica mejorada similar a UsuariosModule
  const filteredAsignaciones = asignaciones.filter((asignacion) => {
    // Usar el objeto orientador y curso directamente si están disponibles
    const orientadorNombre = (
      asignacion.orientador?.nombre ||
      getOrientadorNombre(asignacion.orientadorId)
    ).toLowerCase();

    const cursoNombre = (
      asignacion.curso?.nombre || getCursoNombre(asignacion.cursoId)
    ).toLowerCase();

    const asignaturaNombre = (
      asignacion.asignatura?.nombre ||
      getAsignaturaNombre(asignacion.asignaturaId)
    ).toLowerCase();

    // Búsqueda mejorada con término debounced
    let matchesSearch = true;
    if (debouncedSearchTerm) {
      const searchTermLower = debouncedSearchTerm.toLowerCase();
      matchesSearch =
        orientadorNombre.includes(searchTermLower) ||
        cursoNombre.includes(searchTermLower) ||
        asignaturaNombre.includes(searchTermLower);
    }

    // Filtros adicionales
    const matchesOrientador =
      filterOrientador === 'todos' ||
      asignacion.orientadorId.toString() === filterOrientador;

    const matchesCurso =
      filterCurso === 'todos' || asignacion.cursoId.toString() === filterCurso;

    const matchesEstado =
      filterEstado === 'todos' || asignacion.estado === filterEstado;

    return matchesSearch && matchesOrientador && matchesCurso && matchesEstado;
  });

  // Calcular paginación
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedAsignaciones = filteredAsignaciones.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Actualizar número total de páginas
  useEffect(() => {
    const totalFiltered = filteredAsignaciones.length;
    setTotalPages(Math.ceil(totalFiltered / itemsPerPage));

    // Asegurarse de que la página actual es válida
    if (page > Math.ceil(totalFiltered / itemsPerPage) && totalFiltered > 0) {
      setPage(1);
    }
  }, [filteredAsignaciones, page]);

  // Estado para manejar asignaturas filtradas por curso
  const [asignaturasFiltradas, setAsignaturasFiltradas] = useState<
    AsignaturaUI[]
  >([]);

  // Obtener asignaturas compatibles con el curso seleccionado
  const getAsignaturasCompatibles = (cursoId: string) => {
    // Si no hay curso seleccionado, devolver array vacío
    if (!cursoId) return [];

    // Si hay asignaturas filtradas (incluso si es array vacío), devolverlas
    // Esto asegura que si un curso no tiene asignaturas, no se mostrarán opciones en el dropdown
    if (formData.cursoId && formData.cursoId === cursoId)
      return asignaturasFiltradas;

    // Si no hay asignaturas filtradas y no hay curso seleccionado, devolver todas las asignaturas
    return asignaturas;
  };

  const handleCreateAsignacion = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      orientadorId: '',
      cursoId: '',
      asignaturaId: '',
      cargaHoraria: 4,
      esOrientador: false,
    });
    setIsDialogOpen(true);
  };

  const handleEditAsignacion = async (asignacion: AsignacionUI) => {
    setIsEditMode(true);
    setEditingId(asignacion.id);

    try {
      // Si la asignación tiene curso, cargar las asignaturas para ese curso
      if (asignacion.cursoId) {
        // Mostrar indicador de carga
        const loadingToast = toast.loading('Cargando asignaturas del curso...');

        // Cargar asignaturas para este curso desde el backend
        const asignaturasCurso =
          await asignacionesService.getAsignaturasPorCurso(asignacion.cursoId);

        // Mapear a formato UI
        const asignaturasFormateadas = asignaturasCurso.map((a) => ({
          id: a.id_asignatura,
          nombre: a.nombre,
          codigo: a.orden_en_reporte || '',
          nivel: '',
        }));

        // Actualizar estado
        setAsignaturasFiltradas(asignaturasFormateadas);

        // Finalizar indicador de carga
        toast.dismiss(loadingToast);
      }
    } catch (error) {
      console.error('Error al cargar asignaturas por curso:', error);
      toast.error('No se pudieron cargar las asignaturas para este curso.');
    }

    // Cargar los datos actuales en el formulario
    setFormData({
      orientadorId: asignacion.orientadorId.toString(),
      cursoId: asignacion.cursoId.toString(),
      asignaturaId: asignacion.asignaturaId.toString(),
      cargaHoraria: asignacion.cargaHoraria,
      esOrientador: asignacion.esOrientador,
    });

    setIsDialogOpen(true);
  };
  // Función para proceder con la creación/actualización una vez pasadas las confirmaciones
  const procederConSubmit = async () => {
    // Verificar si hay un orientador principal diferente al actual ya asignado al curso
    const existeOtroOrientadorPrincipal = asignaciones.some(
      (a) =>
        a.cursoId === Number(formData.cursoId) &&
        a.estado === 'ACTIVO' &&
        a.esOrientador === true &&
        a.orientadorId !== Number(formData.orientadorId) &&
        (!isEditMode || (isEditMode && a.id !== editingId)) // Ignorar registro actual si es edición
    );

    // Si ya existe otro orientador como principal y estamos intentando asignar a este como principal
    if (existeOtroOrientadorPrincipal && formData.esOrientador) {
      // Configurar estado para mostrar el diálogo de confirmación
      setConfirmDialogContent({
        title: 'Confirmación requerida',
        message:
          'Ya existe un orientador principal para este curso. ¿Está seguro de continuar con esta asignación?',
        confirmLabel: 'Aceptar',
        cancelLabel: 'Cancelar',
        onConfirm: () => {
          // Al confirmar, mostramos la segunda confirmación
          setConfirmDialogContent({
            title: 'Advertencia',
            message:
              'Esta acción reemplazará al orientador principal actual del curso. ¿Confirma que desea continuar?',
            confirmLabel: 'Confirmar',
            cancelLabel: 'Cancelar',
            onConfirm: () => {
              // Si confirma ambos diálogos, procedemos con la operación
              setConfirmDialogOpen(false);
              procederConSubmit();
            },
            onCancel: () => setConfirmDialogOpen(false),
          });
        },
        onCancel: () => setConfirmDialogOpen(false),
      });

      setConfirmDialogOpen(true);
      return;
    }

    // Si no hay orientador principal o no estamos asignando a este como principal, continuar con la lógica (no llamar recursivamente)

    // Verificar compatibilidad de nivel
    const cursoSel = cursos.find((c) => c.id.toString() === formData.cursoId);
    const asignatura = asignaturas.find(
      (a) => a.id.toString() === formData.asignaturaId
    );

    if (
      cursoSel &&
      asignatura &&
      cursoSel.nivel &&
      asignatura.nivel &&
      cursoSel.nivel !== asignatura.nivel
    ) {
      toast.error('La asignatura no es compatible con el nivel del curso');
      return;
    }

    try {
      // Mostrar el toast de carga solo después de todas las validaciones
      const loadingToast = toast.loading(
        isEditMode ? 'Actualizando asignación...' : 'Creando asignación...'
      );

      // Preparar payload según operación
      // Preparamos el payload común para ambas operaciones
      const commonPayload = {
        id_orientador: Number(formData.orientadorId),
        id_asignatura: Number(formData.asignaturaId),
        id_curso: Number(formData.cursoId), // Necesario para validación en el backend
        cargaHorariaSemanal: Number(formData.cargaHoraria), // Aseguramos que sea número
        es_orientador: Boolean(formData.esOrientador), // Aseguramos que sea boolean
      };

      let response;

      if (isEditMode && editingId) {
        // Para actualización solo enviamos los campos que queremos modificar
        console.log('Actualizando asignación:', editingId, commonPayload);

        // Paso 1: Obtener la asignación actual antes de actualizarla
        try {
          const asignacionActual =
            await asignacionesService.getAsignacionById(editingId);

          // Paso 2: Registrar el estado actual en el historial antes de actualizarlo
          await asignacionesService.createHistorial({
            id_asignatura_orientador: asignacionActual.id_asignatura_orientador,
            id_curso: asignacionActual.curso.id_curso,
            id_orientador: asignacionActual.docente.id_orientador,
            id_asignatura: asignacionActual.asignatura.id_asignatura,
            es_orientador: asignacionActual.esOrientador,
            anio_academico: asignacionActual.anio_academico || undefined,
            fecha_asignacion: asignacionActual.fechaAsignacion,
            fecha_fin: new Date().toISOString(), // Fecha actual como cierre
          });

          console.log('Registro histórico creado correctamente');
        } catch (historialError) {
          console.error(
            'Error al crear el registro histórico:',
            historialError
          );
          // Continuamos con la actualización aunque el historial falle
        }

        // Paso 3: Actualizar la asignación normalmente
        response = await asignacionesService.updateAsignacion(
          editingId,
          commonPayload
        );

        toast.dismiss(loadingToast);
        toast.success('Asignación actualizada correctamente');
      } else {
        // Para creación necesitamos todos los campos
        const createDto = {
          ...commonPayload,
          anio_academico: new Date().getFullYear().toString(),
          activo: true,
        };

        // Loguear para debug
        console.log('Creando nueva asignación:', createDto);

        // Llamar a la API de creación
        response = await asignacionesService.createAsignacion(createDto);

        // Log para debug
        console.log('Respuesta API:', response);

        // Obtener la asignación recién creada con formato UI
        const newAsignacion: AsignacionUI = {
          id: response.id_asignatura_orientador,
          orientadorId: response.docente.id_orientador,
          cursoId: response.curso.id_curso,
          asignaturaId: response.asignatura.id_asignatura,
          fechaAsignacion: response.fechaAsignacion,
          estado: response.estado,
          cargaHoraria: response.cargaHorariaSemanal,
          esOrientador: response.esOrientador || false,
          orientador: {
            id: response.docente.id_orientador,
            nombre: response.docente.nombreCompleto,
          },
          curso: {
            id: response.curso.id_curso,
            nombre: response.curso.nombre,
            seccion: response.curso.seccion || '',
          },
          asignatura: {
            id: response.asignatura.id_asignatura,
            nombre: response.asignatura.nombre,
            codigo: response.asignatura.orden_en_reporte || '',
          },
        };

        setAsignaciones([...asignaciones, newAsignacion]);
        toast.dismiss(loadingToast);
        toast.success('Asignación creada correctamente');
      }

      await fetchData();
      setIsDialogOpen(false);
    } catch (error: any) {
      // Siempre cerrar cualquier toast de carga antes de mostrar errores
      toast.dismiss();
      // Error al procesar la asignación
      console.error(
        `Error al ${isEditMode ? 'editar' : 'crear'} asignación:`,
        error
      );

      if (error.response) {
        // El servidor respondió con un error
        console.error('Respuesta de error:', error.response.data);

        // Mostrar mensaje específico según el código de error
        if (error.response.status === 409) {
          toast.error(
            'Ya existe una asignación activa para este orientador, curso y asignatura. Por favor, revise los datos.'
          );
        } else if (error.response.status === 400) {
          if (error.response.data?.message) {
            if (Array.isArray(error.response.data.message)) {
              toast.error(`Error: ${error.response.data.message[0]}`);
            } else {
              toast.error(`Error: ${error.response.data.message}`);
            }
          } else {
            toast.error(
              'Los datos enviados no son válidos. Revise el formulario.'
            );
          }
        } else {
          toast.error(
            `Error del servidor (${error.response.status}). Por favor, intente nuevamente.`
          );
        }
      } else if (error.request) {
        // No se recibió respuesta
        toast.error(
          'No se pudo conectar con el servidor. Verifique su conexión.'
        );
      } else {
        // Error al preparar la petición
        toast.error(
          `Error al ${isEditMode ? 'editar' : 'crear'} asignación. Por favor, intente nuevamente.`
        );
      }
    }
  };

  const handleToggleStatus = async (asignacion: AsignacionUI) => {
    try {
      const loadingToast = toast.loading('Actualizando estado...');

      // Paso 1: Obtener la asignación completa antes de actualizar
      try {
        const asignacionCompleta = await asignacionesService.getAsignacionById(
          asignacion.id
        );

        // Paso 2: Registrar el estado actual en el historial antes de actualizarlo
        await asignacionesService.createHistorial({
          id_asignatura_orientador: asignacionCompleta.id_asignatura_orientador,
          id_curso: asignacionCompleta.curso.id_curso,
          id_orientador: asignacionCompleta.docente.id_orientador,
          id_asignatura: asignacionCompleta.asignatura.id_asignatura,
          es_orientador: asignacionCompleta.esOrientador,
          anio_academico: asignacionCompleta.anio_academico || undefined,
          fecha_asignacion: asignacionCompleta.fechaAsignacion,
          fecha_fin: new Date().toISOString(), // Fecha actual como cierre
        });

        console.log(
          'Registro histórico creado correctamente para cambio de estado'
        );
      } catch (historialError) {
        console.error('Error al crear el registro histórico:', historialError);
        // Continuamos con la actualización aunque el historial falle
      }

      // Paso 3: Llamar a la API para cambiar el estado
      await asignacionesService.updateAsignacion(asignacion.id, {
        activo: asignacion.estado === 'ACTIVO' ? false : true,
      });
      await fetchData();
      toast.dismiss(loadingToast);
      const newStatus = asignacion.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
      toast.success(
        `Asignación ${newStatus === 'ACTIVO' ? 'activada' : 'desactivada'} correctamente`
      );
    } catch (error: any) {
      // Error al cambiar estado

      // Mostrar más detalles del error
      if (error.response) {
        // Detalle de la respuesta del error

        // Mensaje personalizado según el código de error
        if (error.response.status === 404) {
          toast.error(
            'No se encontró la asignación. Puede que haya sido eliminada.'
          );
        } else if (error.response.status === 400) {
          toast.error(
            `Error en la solicitud: ${error.response.data.message || 'Datos inválidos'}`
          );
        } else {
          toast.error(
            `Error del servidor (${error.response.status}). Por favor, intente nuevamente.`
          );
        }
      } else if (error.request) {
        // No se recibió respuesta del servidor
        toast.error(
          'No se pudo conectar con el servidor. Verifique su conexión a internet.'
        );
      } else {
        // Error al configurar la petición
        toast.error(`Error: ${error.message}`);
      }
    }
  };

  // Calcular estadísticas
  const totalCargaHoraria = asignaciones
    .filter((a) => a.estado === 'ACTIVO')
    .reduce((sum, a) => sum + a.cargaHoraria, 0);

  const orientadoresConAsignaciones = new Set(
    asignaciones.filter((a) => a.estado === 'ACTIVO').map((a) => a.orientadorId)
  ).size;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Asignaciones
          </h1>
          <p className="text-gray-600">
            Asigna orientadores a cursos y asignaturas
          </p>
        </div>
        {activeTab === 'asignaciones' && (
          <Button
            onClick={handleCreateAsignacion}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Asignación
              </>
            )}
          </Button>
        )}
      </div>

      {/* Pestañas para alternar entre asignaciones actuales e historial */}
      <Tabs
        defaultValue="asignaciones"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-4"
      >
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="asignaciones" className="flex items-center">
            <ClipboardList className="w-4 h-4 mr-2" />
            Asignaciones Actuales
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center">
            <History className="w-4 h-4 mr-2" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="asignaciones">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Asignaciones</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {asignaciones.filter((a) => a.estado === 'ACTIVO').length}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Orientadores Asignados
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {orientadoresConAsignaciones}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Carga Horaria Total</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {totalCargaHoraria}h
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Promedio por Orientador
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {orientadoresConAsignaciones > 0
                        ? Math.round(
                            totalCargaHoraria / orientadoresConAsignaciones
                          )
                        : 0}
                      h
                    </p>
                  </div>
                  <User className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros y búsqueda */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por orientador, curso o asignatura..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1); // Volver a la primera página cuando se busca
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={filterOrientador}
                  onValueChange={(value) => {
                    setFilterOrientador(value);
                    setPage(1); // Volver a la primera página cuando se cambia el filtro
                  }}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filtrar por orientador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">
                      Todos los orientadores
                    </SelectItem>
                    {orientadores.map((orientador) => {
                      // Es importante que usemos el ID que coincida con el orientadorId de las asignaciones
                      return (
                        <SelectItem
                          key={orientador.id}
                          value={orientador.id.toString()}
                        >
                          {orientador.nombre}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Select
                  value={filterCurso}
                  onValueChange={(value) => {
                    setFilterCurso(value);
                    setPage(1); // Volver a la primera página cuando se cambia el filtro
                  }}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filtrar por curso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los cursos</SelectItem>
                    {cursos.map((curso) => (
                      <SelectItem key={curso.id} value={curso.id.toString()}>
                        <div>
                          <p className="font-medium">{curso.nombre}</p>
                          {curso.seccion && (
                            <p className="text-sm text-gray-500 ml-1">
                              Sección: {curso.seccion}
                            </p>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filterEstado}
                  onValueChange={(value) => {
                    setFilterEstado(value);
                    setPage(1); // Volver a la primera página cuando se cambia el filtro
                  }}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="ACTIVO">Activa</SelectItem>
                    <SelectItem value="INACTIVO">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de asignaciones */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>
                  Lista de Asignaciones ({filteredAsignaciones.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orientador</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Asignatura</TableHead>
                    <TableHead>Carga Horaria</TableHead>
                    <TableHead>Fecha Asignación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="w-6 h-6 animate-spin mr-2" />
                          <span>Cargando asignaciones...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredAsignaciones.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-24 text-center text-gray-500"
                      >
                        No se encontraron asignaciones con los filtros
                        seleccionados
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAsignaciones.map((asignacion) => {
                      // Usar información directa del objeto o buscar por ID como fallback
                      const orientadorNombre =
                        asignacion.orientador?.nombre ||
                        getOrientadorNombre(asignacion.orientadorId);
                      const cursoNombre =
                        asignacion.curso?.nombre ||
                        getCursoNombre(asignacion.cursoId);
                      const asignaturaNombre =
                        asignacion.asignatura?.nombre ||
                        getAsignaturaNombre(asignacion.asignaturaId);
                      const asignaturaCodigo =
                        asignacion.asignatura?.codigo ||
                        getAsignaturaCodigo(asignacion.asignaturaId);

                      const orientador = orientadores.find(
                        (o) => o.id === asignacion.orientadorId
                      );

                      return (
                        <TableRow key={asignacion.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {orientadorNombre || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {orientador?.especialidad || ''}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <School className="w-4 h-4 text-gray-400" />
                              <div>
                                <span>{cursoNombre || 'N/A'}</span>
                                {asignacion.curso?.seccion && (
                                  <span className="text-sm text-gray-500 ml-1">
                                    {asignacion.curso.seccion}
                                  </span>
                                )}
                                {asignacion.esOrientador && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs bg-green-100 text-green-800"
                                  >
                                    Orientador Principal
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {asignaturaNombre || 'N/A'}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                Código: {asignaturaCodigo || 'N/A'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">
                              {asignacion.cargaHoraria}h/sem
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(asignacion.fechaAsignacion, 'short')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                asignacion.estado === 'ACTIVO'
                                  ? 'default'
                                  : 'destructive'
                              }
                            >
                              {asignacion.estado === 'ACTIVO'
                                ? 'Activa'
                                : 'Inactiva'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditAsignacion(asignacion)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Editar asignación"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(asignacion)}
                                className={
                                  asignacion.estado === 'ACTIVO'
                                    ? 'text-orange-600 hover:text-orange-700'
                                    : 'text-green-600 hover:text-green-700'
                                }
                                title={
                                  asignacion.estado === 'ACTIVO'
                                    ? 'Desactivar asignación'
                                    : 'Activar asignación'
                                }
                              >
                                {asignacion.estado === 'ACTIVO' ? (
                                  <ToggleLeft className="w-4 h-4" />
                                ) : (
                                  <ToggleRight className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {/* Controles de paginación */}
              <div className="flex items-center justify-between space-x-2 py-4">
                <p className="text-sm text-gray-600">
                  Mostrando{' '}
                  <span className="font-semibold">
                    {paginatedAsignaciones.length}
                  </span>{' '}
                  de{' '}
                  <span className="font-semibold">
                    {filteredAsignaciones.length}
                  </span>{' '}
                  resultados
                  {(debouncedSearchTerm ||
                    filterEstado !== 'todos' ||
                    filterCurso !== 'todos' ||
                    filterOrientador !== 'todos') && (
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

          {/* Dialog para crear/editar asignación */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? 'Editar Asignación' : 'Crear Nueva Asignación'}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? 'Modifica los detalles de la asignación actual'
                    : 'Asigna un orientador a un curso y asignatura específica'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Orientador *
                  </label>
                  <Select
                    value={formData.orientadorId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, orientadorId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un orientador" />
                    </SelectTrigger>
                    <SelectContent>
                      {orientadores.length > 0 ? (
                        orientadores.map((orientador) => {
                          return (
                            <SelectItem
                              key={orientador.id}
                              value={orientador.id.toString()}
                            >
                              <div>
                                <p className="font-medium">
                                  {orientador.nombre}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {orientador.especialidad}
                                </p>
                              </div>
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="" disabled>
                          No hay orientadores disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Curso *
                  </label>
                  <Select
                    value={formData.cursoId}
                    onValueChange={async (value) => {
                      // Actualizar el form data
                      setFormData({
                        ...formData,
                        cursoId: value,
                        asignaturaId: '',
                      });

                      // Si se seleccionó un curso, cargar sus asignaturas
                      if (value) {
                        try {
                          // Mostrar indicador de carga
                          toast.loading('Cargando asignaturas...', {
                            id: 'asignaturas-loading',
                          });

                          // Cargar asignaturas para este curso desde el backend
                          const asignaturasCurso =
                            await asignacionesService.getAsignaturasPorCurso(
                              parseInt(value, 10)
                            );

                          // Mapear a formato UI
                          const asignaturasFormateadas = asignaturasCurso.map(
                            (a) => ({
                              id: a.id_asignatura,
                              nombre: a.nombre,
                              codigo: a.orden_en_reporte || '',
                              nivel: '',
                            })
                          );

                          // Actualizar estado
                          setAsignaturasFiltradas(asignaturasFormateadas);

                          // Finalizar indicador de carga
                          toast.dismiss('asignaturas-loading');

                          // Si no hay asignaturas, mostrar mensaje
                          if (asignaturasFormateadas.length === 0) {
                            toast.warning(
                              'Este curso no tiene asignaturas asignadas. Por favor, asigne asignaturas al curso primero.'
                            );
                          }
                        } catch (error) {
                          console.error(
                            'Error al cargar asignaturas por curso:',
                            error
                          );
                          toast.error(
                            'No se pudieron cargar las asignaturas para este curso.'
                          );
                          setAsignaturasFiltradas([]);
                        }
                      } else {
                        // Si se deseleccionó el curso, limpiar asignaturas filtradas
                        setAsignaturasFiltradas([]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {cursosFormulario.map((curso) => (
                        <SelectItem key={curso.id} value={curso.id.toString()}>
                          <div>
                            <p className="font-medium">{curso.nombre}</p>
                            {curso.seccion && (
                              <p className="text-sm text-gray-500">
                                Sección: {curso.seccion}
                              </p>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Asignatura *
                  </label>
                  <Select
                    value={formData.asignaturaId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, asignaturaId: value })
                    }
                    disabled={
                      !formData.cursoId ||
                      getAsignaturasCompatibles(formData.cursoId).length === 0
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una asignatura" />
                    </SelectTrigger>
                    <SelectContent>
                      {isEditMode && asignaturasFiltradas.length === 0 ? (
                        // Si estamos en modo edición pero no tenemos asignaturas filtradas aún, mostrar la asignatura actual
                        <SelectItem value={formData.asignaturaId}>
                          <div>
                            <p className="font-medium">
                              {asignaturas.find(
                                (a) => a.id.toString() === formData.asignaturaId
                              )?.nombre || 'Cargando...'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {asignaturas.find(
                                (a) => a.id.toString() === formData.asignaturaId
                              )?.codigo || ''}
                            </p>
                          </div>
                        </SelectItem>
                      ) : getAsignaturasCompatibles(formData.cursoId).length >
                        0 ? (
                        getAsignaturasCompatibles(formData.cursoId).map(
                          (asignatura) => (
                            <SelectItem
                              key={asignatura.id}
                              value={asignatura.id.toString()}
                            >
                              <div>
                                <p className="font-medium">
                                  {asignatura.nombre}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {asignatura.codigo}
                                </p>
                              </div>
                            </SelectItem>
                          )
                        )
                      ) : (
                        <div className="text-amber-500 p-2 text-center">
                          Este curso no tiene asignaturas asignadas
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Carga Horaria Semanal
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.cargaHoraria}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cargaHoraria: parseInt(e.target.value) || 4,
                      })
                    }
                    placeholder="Horas por semana"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="esOrientador"
                    checked={formData.esOrientador}
                    onCheckedChange={(checked) => {
                      // Cuando se está marcando el checkbox
                      if (checked === true) {
                        // Verificar si ya existe un orientador principal para este curso
                        const cursoSeleccionado = cursos.find(
                          (c) => c.id.toString() === formData.cursoId
                        );
                        const orientadorActual =
                          cursoSeleccionado?.orientadorId;

                        if (orientadorActual && orientadorActual > 0) {
                          // Primera confirmación
                          if (
                            window.confirm(
                              `Este curso ya tiene un orientador principal asignado. ¿Estás seguro de querer cambiar al orientador principal?`
                            )
                          ) {
                            // Segunda confirmación
                            if (
                              window.confirm(
                                `ATENCIÓN: Cambiar el orientador principal del curso puede afectar otras configuraciones. ¿Estás completamente seguro?`
                              )
                            ) {
                              setFormData({
                                ...formData,
                                esOrientador: true,
                              });
                            }
                          }
                        } else {
                          // No hay orientador principal, simplemente actualizamos
                          setFormData({
                            ...formData,
                            esOrientador: true,
                          });
                        }
                      } else {
                        // Si está desmarcando, actualizar sin preguntar
                        setFormData({
                          ...formData,
                          esOrientador: false,
                        });
                      }
                    }}
                  />
                  <label
                    htmlFor="esOrientador"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Es orientador principal de este curso
                  </label>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={
                      !formData.orientadorId ||
                      !formData.cursoId ||
                      !formData.asignaturaId ||
                      getAsignaturasCompatibles(formData.cursoId).length === 0
                    }
                  >
                    {isEditMode ? 'Actualizar Asignación' : 'Crear Asignación'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="historial">
          <HistorialAsignaciones />
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmación personalizado */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmDialogContent.title}</DialogTitle>
            <DialogDescription className="pt-3">
              {confirmDialogContent.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                confirmDialogContent.onCancel();
              }}
            >
              {confirmDialogContent.cancelLabel}
            </Button>
            <Button
              onClick={() => {
                confirmDialogContent.onConfirm();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {confirmDialogContent.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
