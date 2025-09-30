import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { api } from '../api/axiosConfig';
import {
  desactivarAlumno,
  reactivarAlumno,
  eliminarResponsable,
  actualizarAlumnoCompleto,
} from '../api/services/alumnosService';

import {
  actualizarSoloResponsable,
  actualizarRelacionResponsable,
} from '../api/services/responsableService';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  GraduationCap,
  UserPlus,
  Edit,
  Search,
  User,
  Phone,
  MapPin,
  Calendar,
  Plus,
  X,
  Heart,
  Car,
  Users,
  FileText,
  ToggleLeft,
  ToggleRight,
  Eye,
  Mail,
  IdCard,
  CheckCircle,
  XCircle,
  Building,
  Stethoscope,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import type { DatosResponsable } from '../types';

// Usaremos los parentescos cargados desde la API
// Mantenemos esta constante como fallback en caso de que la API falle
// Interfaz para los parentescos (relaciones familiares)
interface Parentesco {
  id_parentesco: number;
  nombre: string;
  createdAt?: string;
  updatedAt?: string;
}

const TIPOS_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DEPARTAMENTOS = [
  'Ahuachapán',
  'Cabañas',
  'Chalatenango',
  'Cuscatlán',
  'La Libertad',
  'La Paz',
  'La Unión',
  'Morazán',
  'San Miguel',
  'San Salvador',
  'San Vicente',
  'Santa Ana',
  'Sonsonate',
  'Usulután',
];

const GRADOS_ESTUDIO = [
  'Educación Básica',
  'Bachillerato',
  'Técnico',
  'Universitario',
  'Maestría',
  'Doctorado',
];

const RELIGIONES = [
  'Católica',
  'Protestante',
  'Evangélica',
  'Testigo de Jehová',
  'Mormón',
  'Adventista',
  'Bautista',
  'Metodista',
  'Pentecostal',
  'Otra',
  'Ninguna',
];

// Definimos tipos locales para uso interno en este componente
// Estas interfaces son usadas por el componente y adaptadas a la API
type ResponsableData = DatosResponsable;

// Interface para representar la relación alumno-responsable
interface RelacionAlumnoResponsable {
  id?: number;
  alumnoId?: number;
  responsableId?: number;
  parentescoId?: number | null;
  parentescoLibre?: string | null;
  esPrincipal?: boolean;
  firma?: boolean;
  firmaImagen?: string | null;
  permiteTraslado?: boolean;
  puedeRetirarAlumno?: boolean;
  contactoEmergencia?: boolean;
}

interface ResponsableCompleto {
  // Puede tener las propiedades en el nivel raíz (nueva estructura del API)
  id?: number;
  alumnoId?: number;
  responsableId?: number;
  parentescoId?: number | null;
  parentescoLibre?: string | null;
  esPrincipal?: boolean;
  firma?: boolean;
  firmaImagen?: string | null;
  permiteTraslado?: boolean;
  puedeRetirarAlumno?: boolean;
  contactoEmergencia?: boolean;

  // O puede tener los datos anidados en estas propiedades (estructura anterior)
  id_responsable?: number;
  datosResponsable?: ResponsableData;

  // Para compatibilidad con código existente
  relacion?: RelacionAlumnoResponsable;

  // Datos anidados de la nueva estructura del API
  responsable?: ResponsableData;
  parentesco?: Parentesco;
}

// Definimos el tipo Alumno para este componente
interface Alumno {
  id_alumno: number;
  // Datos Personales
  nombre: string;
  apellido: string;
  genero: string;
  fechaNacimiento: string;
  nacionalidad: string;
  edad?: number;

  // Datos de Partida de Nacimiento
  partidaNumero: string;
  folio: string;
  libro: string;
  anioPartida: string;
  departamentoNacimiento: string;
  municipioNacimiento: string;

  // Datos Médicos
  tipoSangre: string;
  problemaFisico: string;
  observacionesMedicas: string;
  centroAsistencial: string;
  medicoNombre: string;
  medicoTelefono: string;

  // Datos de Residencia
  zonaResidencia: string;
  direccion: string;
  municipio: string;
  departamento: string;

  // Datos de Transporte
  distanciaKM: number;
  medioTransporte: string;
  encargadoTransporte: string;
  encargadoTelefono: string;

  // Estado Académico
  nivel: 'parvularia' | 'basica' | 'media';
  grado: string;
  seccion: string;
  fechaIngreso: string;
  repiteGrado: boolean;
  condicionado: boolean;
  activo: boolean;

  // Detalle adicional
  detalle: {
    viveCon: string;
    dependenciaEconomica: string;
    capacidadPago: boolean;
    tieneHermanosEnColegio: boolean;
    hermanosEnColegio: Array<{ nombre: string; grado: string }>;
  };

  // Responsables
  responsables: ResponsableCompleto[];
}

export function AlumnosModule() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterNivel, setFilterNivel] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null);
  const [editingAlumno, setEditingAlumno] = useState<Alumno | null>(null);
  const [currentTab, setCurrentTab] = useState('personal');

  // Cargar alumnos desde el backend
  useEffect(() => {
    const cargarAlumnos = async () => {
      try {
        setIsLoading(true);
        // Incluimos alumnos inactivos para poder filtrarlos en la interfaz
        const response = await api.get('/alumnos', {
          params: { incluirInactivos: true },
        });

        // Aseguramos que cada alumno tenga la propiedad responsables definida
        const alumnosData = (response.data as Alumno[]).map((alumno) => {
          // Solo verificamos la estructura básica
          if (alumno.responsables && alumno.responsables.length > 0) {
            // El alumno tiene responsables
          }

          return {
            ...alumno,
            responsables: alumno.responsables || [],
            detalle: alumno.detalle || {
              viveCon: '',
              dependenciaEconomica: '',
              capacidadPago: false,
              tieneHermanosEnColegio: false,
              hermanosEnColegio: [],
            },
          };
        });

        setAlumnos(alumnosData);
        setError(null);
      } catch (err) {
        setError('Error al cargar los alumnos. Intente de nuevo más tarde.');
        toast.error('Error al cargar los alumnos');
      } finally {
        setIsLoading(false);
      }
    };

    cargarAlumnos();
  }, []);

  // Cargamos los parentescos desde la API
  useEffect(() => {
    const cargarParentescos = async () => {
      try {
        const response = await api.get('/parentescos');
        setParentescos(response.data as Parentesco[]);
      } catch (error) {}
    };

    cargarParentescos();
  }, []);

  // Estado para los responsables
  const [responsables, setResponsables] = useState<ResponsableCompleto[]>([]);
  const [parentescos, setParentescos] = useState<Parentesco[]>([]);

  const [formData, setFormData] = useState({
    // Datos Personales
    nombre: '',
    apellido: '',
    genero: 'Masculino',
    fechaNacimiento: '',
    nacionalidad: 'Salvadoreña',

    // Datos de Partida de Nacimiento
    partidaNumero: '',
    folio: '',
    libro: '',
    anioPartida: '',
    departamentoNacimiento: '',
    municipioNacimiento: '',

    // Datos Médicos
    tipoSangre: '',
    problemaFisico: '',
    observacionesMedicas: '',
    centroAsistencial: '',
    medicoNombre: '',
    medicoTelefono: '',

    // Datos de Residencia
    zonaResidencia: 'Urbana',
    direccion: '',
    municipio: '',
    departamento: '',

    // Datos de Transporte
    distanciaKM: 0,
    medioTransporte: '',
    encargadoTransporte: '',
    encargadoTelefono: '',

    // Estado Académico
    nivel: 'basica' as 'parvularia' | 'basica' | 'media',
    grado: '',
    seccion: '',
    fechaIngreso: '',
    repiteGrado: false,
    condicionado: false,

    // Detalle adicional
    viveCon: '',
    dependenciaEconomica: '',
    capacidadPago: false,
    tieneHermanosEnColegio: false,
    hermanosEnColegio: '[]',
  });

  // Filtrar alumnos
  const filteredAlumnos = alumnos.filter((alumno) => {
    const matchesSearch =
      alumno.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumno.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${alumno.nombre} ${alumno.apellido}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesNivel =
      filterNivel === 'todos' || alumno.nivel === filterNivel;
    const matchesEstado =
      filterEstado === 'todos' ||
      (filterEstado === 'activo' ? alumno.activo : !alumno.activo);

    return matchesSearch && matchesNivel && matchesEstado;
  });

  const resetForm = () => {
    setEditingAlumno(null);
    setCurrentTab('personal');
    setResponsables([]);
    setFormData({
      nombre: '',
      apellido: '',
      genero: 'Masculino',
      fechaNacimiento: '',
      nacionalidad: 'Salvadoreña',
      partidaNumero: '',
      folio: '',
      libro: '',
      anioPartida: '',
      departamentoNacimiento: '',
      municipioNacimiento: '',
      tipoSangre: '',
      problemaFisico: '',
      observacionesMedicas: '',
      centroAsistencial: '',
      medicoNombre: '',
      medicoTelefono: '',
      zonaResidencia: 'Urbana',
      direccion: '',
      municipio: '',
      departamento: '',
      distanciaKM: 0,
      medioTransporte: '',
      encargadoTransporte: '',
      encargadoTelefono: '',
      nivel: 'basica',
      grado: '',
      seccion: '',
      fechaIngreso: '',
      repiteGrado: false,
      condicionado: false,
      viveCon: '',
      dependenciaEconomica: '',
      capacidadPago: false,
      tieneHermanosEnColegio: false,
      hermanosEnColegio: '[]',
    });
  };

  const handleCreateAlumno = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditAlumno = (alumno: Alumno) => {
    setEditingAlumno(alumno);
    setCurrentTab('personal');
    setIsDialogOpen(true); // Abrimos el diálogo de edición
    setResponsables(alumno.responsables || []);
    setFormData({
      nombre: alumno.nombre,
      apellido: alumno.apellido,
      genero: alumno.genero,
      fechaNacimiento: alumno.fechaNacimiento,
      nacionalidad: alumno.nacionalidad,
      partidaNumero: alumno.partidaNumero,
      folio: alumno.folio,
      libro: alumno.libro,
      anioPartida: alumno.anioPartida,
      departamentoNacimiento: alumno.departamentoNacimiento,
      municipioNacimiento: alumno.municipioNacimiento,
      tipoSangre: alumno.tipoSangre,
      problemaFisico: alumno.problemaFisico,
      observacionesMedicas: alumno.observacionesMedicas,
      centroAsistencial: alumno.centroAsistencial,
      medicoNombre: alumno.medicoNombre,
      medicoTelefono: alumno.medicoTelefono,
      zonaResidencia: alumno.zonaResidencia,
      direccion: alumno.direccion,
      municipio: alumno.municipio,
      departamento: alumno.departamento,
      distanciaKM: alumno.distanciaKM,
      medioTransporte: alumno.medioTransporte,
      encargadoTransporte: alumno.encargadoTransporte,
      encargadoTelefono: alumno.encargadoTelefono,
      nivel: alumno.nivel,
      grado: alumno.grado,
      seccion: alumno.seccion,
      fechaIngreso: alumno.fechaIngreso,
      repiteGrado: alumno.repiteGrado,
      condicionado: alumno.condicionado,
      viveCon: alumno.detalle.viveCon,
      dependenciaEconomica: alumno.detalle.dependenciaEconomica,
      capacidadPago: alumno.detalle.capacidadPago,
      tieneHermanosEnColegio: alumno.detalle.tieneHermanosEnColegio,
      hermanosEnColegio: JSON.stringify(alumno.detalle.hermanosEnColegio || []),
    });
    setIsDialogOpen(true);
  };

  const handleViewAlumno = (alumno: Alumno) => {
    setSelectedAlumno(alumno);
    setIsDetailDialogOpen(true);
  };

  // Funciones para manejar responsables
  const addResponsable = () => {
    // Usamos el formato nuevo para los responsables, compatible con la API
    const defaultParentescoId =
      parentescos.length > 0 ? parentescos[0].id_parentesco : 1;

    // ID temporal para la interfaz (número negativo para evitar colisión con IDs reales)
    const tempId = -Math.floor(Math.random() * 100000);

    const newResponsable: ResponsableCompleto = {
      // Propiedades principales (estructura nueva)
      id: 0, // Se asignará cuando se guarde en BD
      id_responsable: tempId, // ID temporal para la UI
      responsableId: 0, // Se asignará cuando se guarde
      parentescoId: defaultParentescoId,
      parentescoLibre: null,
      esPrincipal: responsables.length === 0,
      firma: false,
      permiteTraslado: false,
      puedeRetirarAlumno: false,
      contactoEmergencia: false,

      // Datos del responsable - estructura consistente con la función isEmptyResponsable
      responsable: {
        id: 0, // Se asignará cuando se guarde
        nombre: '',
        apellido: '',
        dui: '',
        telefono: '',
        email: '',
        direccion: '',
        lugarTrabajo: '',
        profesionOficio: '',
        ultimoGradoEstudiado: '',
        ocupacion: '',
        religion: '',
        zonaResidencia: 'Urbana',
        estadoFamiliar: '',
        empresaTransporte: '',
        placaVehiculo: '',
        tipoVehiculo: '',
        firmaFoto: null,
      },

      // También agregamos la estructura alternativa para compatibilidad
      datosResponsable: {
        nombre: '',
        apellido: '',
        dui: '',
        telefono: '',
        email: '',
        direccion: '',
        lugarTrabajo: '',
        profesionOficio: '',
        ultimoGradoEstudiado: '',
        ocupacion: '',
        religion: '',
        zonaResidencia: 'Urbana',
        estadoFamiliar: '',
        empresaTransporte: '',
        placaVehiculo: '',
        tipoVehiculo: '',
        firmaFoto: null,
      },
    };

    setResponsables([...responsables, newResponsable]);
  };

  const updateResponsable = (
    index: number,
    section: 'datosResponsable' | 'relacion',
    field: string,
    value: any
  ) => {
    const updated = [...responsables];

    if (section === 'relacion' && field === 'parentescoId') {
      // Buscamos el parentesco en la lista cargada desde la API
      const parentescoEncontrado = parentescos.find(
        (p) => p.id_parentesco === value
      );

      // Aseguramos que la relación existe antes de actualizar
      const relacionActual = updated[index].relacion || {
        id: 0,
        alumnoId: 0,
        responsableId: 0,
        esPrincipal: false,
        firma: false,
        permiteTraslado: false,
        puedeRetirarAlumno: false,
        contactoEmergencia: false,
      };

      updated[index] = {
        ...updated[index],
        parentescoId: value, // Actualizar en el nivel raíz para la nueva estructura
        parentescoLibre: parentescoEncontrado?.nombre || '',
        // Mantener compatibilidad con la estructura antigua
        relacion: {
          ...relacionActual,
          parentescoId: value,
          parentescoLibre: parentescoEncontrado?.nombre || '',
        },
      };
    } else if (section === 'relacion' && field === 'esPrincipal') {
      if (value === true) {
        // Solo uno puede ser principal - desmarcar todos los demás
        updated.forEach((resp, i) => {
          // Asegurarse de que relacion existe
          if (!resp.relacion) {
            resp.relacion = {
              id: 0,
              alumnoId: 0,
              responsableId: 0,
              esPrincipal: false,
              firma: false,
              permiteTraslado: false,
              puedeRetirarAlumno: false,
              contactoEmergencia: false,
            };
          }
          // Actualizar esPrincipal en la raíz y en relacion
          resp.esPrincipal = i === index;
          resp.relacion.esPrincipal = i === index;
        });
      } else {
        // Si se está desmarcando, solo actualizar este responsable
        // Asegurarse de que relacion existe
        if (!updated[index].relacion) {
          updated[index].relacion = {
            id: 0,
            alumnoId: 0,
            responsableId: 0,
            esPrincipal: false,
            firma: false,
            permiteTraslado: false,
            puedeRetirarAlumno: false,
            contactoEmergencia: false,
          };
        }
        updated[index].esPrincipal = false;
        updated[index].relacion.esPrincipal = false;
      }
    } else if (
      section === 'relacion' &&
      (field === 'contactoEmergencia' ||
        field === 'firma' ||
        field === 'permiteTraslado' ||
        field === 'puedeRetirarAlumno')
    ) {
      // Para estos campos booleanos específicos, los actualizamos tanto en la raíz como en relacion
      // Asegurarse de que relacion existe
      const relacionActual = updated[index].relacion || {
        id: 0,
        alumnoId: 0,
        responsableId: 0,
        esPrincipal: false,
        firma: false,
        permiteTraslado: false,
        puedeRetirarAlumno: false,
        contactoEmergencia: false,
      };

      updated[index] = {
        ...updated[index],
        // Actualizamos el campo en la raíz
        [field]: value,
        // Y también en la relación
        relacion: {
          ...relacionActual,
          [field]: value,
        },
      };
    } else if (
      section === 'datosResponsable' &&
      (field === 'email' || field === 'religion')
    ) {
      // Tratamiento especial para campos problemáticos

      // Aseguramos que exista la sección datosResponsable
      const datosActuales = updated[index].datosResponsable || {};

      // Creamos una copia segura para TypeScript
      updated[index] = {
        ...updated[index],
        datosResponsable: {
          ...datosActuales,
          [field]: value === null ? '' : value, // Convertimos null a cadena vacía
        } as any, // Usamos 'as any' para evitar errores de tipo
      };
    } else {
      // Aseguramos que la sección exista
      const sectionData = updated[index][section] || {};

      // Guardamos el valor tal cual, sin transformaciones
      // Esto permite conservar cadenas vacías

      updated[index] = {
        ...updated[index],
        [section]: {
          ...sectionData,
          [field]: value,
        },
      };
    }
    setResponsables(updated);
  };

  /**
   * Actualiza solo un responsable específico sin actualizar todo el alumno
   * Esta función es útil para hacer cambios puntuales a un responsable
   */
  const actualizarResponsable = async (
    index: number,
    soloRelacion: boolean = false
  ) => {
    if (!editingAlumno || !responsables[index]) return;

    const responsable = responsables[index];
    if (!responsable.id) {
      toast.error(
        'No se puede actualizar un responsable que aún no ha sido guardado'
      );
      return;
    }

    setIsLoading(true);

    try {
      // Si tenemos que actualizar la relación
      if (soloRelacion || !responsable.datosResponsable) {
        // Actualizamos solo la relación
        // Extraemos los valores booleanos explícitamente
        const contactoEmergencia = responsable.contactoEmergencia === true;
        const firma = responsable.firma === true;
        const permiteTraslado = responsable.permiteTraslado === true;
        const puedeRetirarAlumno = responsable.puedeRetirarAlumno === true;
        const esPrincipal = responsable.esPrincipal === true;

        const datosRelacion = {
          parentescoId: responsable.parentescoId,
          parentescoLibre: responsable.parentescoLibre || '',
          esPrincipal: esPrincipal,
          firma: firma,
          permiteTraslado: permiteTraslado,
          puedeRetirarAlumno: puedeRetirarAlumno,
          contactoEmergencia: contactoEmergencia,
        };

        const resultadoRelacion = await actualizarRelacionResponsable(
          editingAlumno.id_alumno,
          responsable.id,
          datosRelacion
        );

        toast.success('Relación con responsable actualizada correctamente');
        return resultadoRelacion;
      }

      // Si tenemos que actualizar los datos del responsable
      if (responsable.datosResponsable) {
        // Primero aseguramos tener el ID correcto del responsable
        let responsableId = responsable.responsableId;

        if (!responsableId) {
          // Intentamos obtener el ID del responsable desde la relación
          try {
            const relacionData = await actualizarRelacionResponsable(
              editingAlumno.id_alumno,
              responsable.id,
              {
                /* podemos enviar un objeto vacío solo para obtener los datos actuales */
              }
            );
            responsableId = relacionData.responsableId;
          } catch (error) {
            // Error al obtener ID de responsable
          }
        }

        if (responsableId) {
          // Clonar y asegurar que los campos vacíos se preserven correctamente
          const datosParaEnviar: Record<string, any> = {};

          // Copiamos manualmente cada propiedad para asegurar que se preserven las cadenas vacías
          if (responsable.datosResponsable) {
            Object.entries(responsable.datosResponsable).forEach(
              ([key, value]) => {
                // Siempre incluimos todos los campos, incluso los vacíos
                // Si es undefined o null, lo convertimos a cadena vacía para asegurar el borrado
                datosParaEnviar[key] =
                  value === undefined || value === null ? '' : value;
              }
            );
          }

          // Ahora actualizamos los datos del responsable
          const resultado = await actualizarSoloResponsable(
            responsableId,
            datosParaEnviar
          );

          toast.success('Datos del responsable actualizados correctamente');
          return resultado;
        } else {
          toast.error(
            'No se pudo determinar el ID del responsable para actualizar sus datos'
          );
        }
      }
    } catch (error: any) {
      toast.error(
        `Error al actualizar responsable: ${error.message || 'Error desconocido'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Función para verificar si un responsable está vacío (todos sus campos importantes están vacíos)
  const isEmptyResponsable = (responsable: any): boolean => {
    // Si el responsable es nulo o undefined, considerarlo vacío
    if (!responsable) {
      return true;
    }

    // En la estructura pueden existir los datos en varias propiedades
    const datosResponsable = responsable.datosResponsable || {};
    const responsableData = responsable.responsable || {};

    // Campos importantes que verificaremos en ambas ubicaciones posibles
    const camposImportantes = [
      'nombre',
      'apellido',
      'dui',
      'telefono',
      'direccion',
      'profesionOficio',
    ];

    // Verificar si algún campo importante tiene valor en cualquiera de las dos estructuras
    for (const campo of camposImportantes) {
      // Verificar en datosResponsable
      const valor1 = datosResponsable[campo];
      if (valor1 && typeof valor1 === 'string' && valor1.trim() !== '') {
        return false; // No está vacío
      }

      // Verificar en responsable
      const valor2 = responsableData[campo];
      if (valor2 && typeof valor2 === 'string' && valor2.trim() !== '') {
        return false; // No está vacío
      }
    }

    return true; // Está vacío
  };

  const removeResponsable = async (index: number) => {
    // Asegurarse de que el índice es válido
    if (index < 0 || index >= responsables.length) {
      toast.error('Índice de responsable no válido');
      return;
    }

    // Obtenemos el responsable a eliminar
    const responsableToRemove = responsables[index];

    try {
      setIsLoading(true);

      // Verificar explícitamente si está vacío
      const esResponsableVacio = isEmptyResponsable(responsableToRemove);

      // Caso 1: Responsable existente en la base de datos (tiene ID numérico en la BD)
      if (
        editingAlumno?.id_alumno &&
        typeof responsableToRemove?.id === 'number' &&
        responsableToRemove.id > 0
      ) {
        // Llamar a la API para eliminar el responsable
        await eliminarResponsable(
          editingAlumno.id_alumno,
          responsableToRemove.id
        );

        toast.success(
          'Responsable eliminado correctamente de la base de datos'
        );
      }
      // Caso 2: Formulario vacío - solo eliminamos visualmente sin notificación
      else if (esResponsableVacio) {
        // No mostramos notificación para no interrumpir al usuario
      }
      // Caso 3: Responsable con datos pero no guardado en BD
      else {
        toast.success('Responsable eliminado correctamente');
      }

      // Eliminación del estado local (en todos los casos)

      // Eliminamos del estado usando el índice
      setResponsables((prevState) => {
        const newState = prevState.filter((_, i) => i !== index);
        return newState;
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al eliminar el responsable: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre || !formData.apellido || !formData.fechaNacimiento) {
      toast.error('Los campos obligatorios deben ser completados');
      return;
    }

    if (responsables.length === 0) {
      toast.error('Debe agregar al menos un responsable');
      return;
    }

    // Calcular edad si no se proporcionó
    const calcularEdad = (fechaNacimiento: string) => {
      const hoy = new Date();
      const [day, month, year] = fechaNacimiento.split('/');
      const nacimiento = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mes = hoy.getMonth() - nacimiento.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      return edad;
    };

    const edad = calcularEdad(formData.fechaNacimiento);

    if (editingAlumno) {
      // Editar alumno existente
      setIsLoading(true);

      // Preparamos el objeto de actualización para la API
      const alumnoActualizado = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        genero: formData.genero,
        fechaNacimiento: formData.fechaNacimiento,
        nacionalidad: formData.nacionalidad,
        edad: edad,
        partidaNumero: formData.partidaNumero,
        folio: formData.folio,
        libro: formData.libro,
        anioPartida: formData.anioPartida,
        departamentoNacimiento: formData.departamentoNacimiento,
        municipioNacimiento: formData.municipioNacimiento,
        tipoSangre: formData.tipoSangre,
        problemaFisico: formData.problemaFisico,
        observacionesMedicas: formData.observacionesMedicas,
        centroAsistencial: formData.centroAsistencial,
        medicoNombre: formData.medicoNombre,
        medicoTelefono: formData.medicoTelefono,
        zonaResidencia: formData.zonaResidencia,
        direccion: formData.direccion,
        municipio: formData.municipio,
        departamento: formData.departamento,
        distanciaKM: formData.distanciaKM,
        medioTransporte: formData.medioTransporte,
        encargadoTransporte: formData.encargadoTransporte,
        encargadoTelefono: formData.encargadoTelefono,
        nivel: formData.nivel,
        grado: formData.grado,
        seccion: formData.seccion,
        fechaIngreso: formData.fechaIngreso,
        repiteGrado: formData.repiteGrado,
        condicionado: formData.condicionado,
        detalle: {
          viveCon: formData.viveCon,
          dependenciaEconomica: formData.dependenciaEconomica,
          capacidadPago: formData.capacidadPago,
          tieneHermanosEnColegio: formData.tieneHermanosEnColegio,
          hermanosEnColegio: formData.hermanosEnColegio
            ? JSON.parse(formData.hermanosEnColegio)
            : [],
        },
        responsables: responsables.map((resp) => {
          // Preparar los responsables con la estructura correcta para la API
          const datosResponsable = {
            nombre:
              resp.responsable?.nombre || resp.datosResponsable?.nombre || '',
            apellido:
              resp.responsable?.apellido ||
              resp.datosResponsable?.apellido ||
              '',
            dui: resp.responsable?.dui || resp.datosResponsable?.dui || '',
            telefono:
              resp.responsable?.telefono ||
              resp.datosResponsable?.telefono ||
              '',
            email:
              resp.responsable?.email || resp.datosResponsable?.email || null,
            direccion:
              resp.responsable?.direccion ||
              resp.datosResponsable?.direccion ||
              '',
            lugarTrabajo:
              resp.responsable?.lugarTrabajo ||
              resp.datosResponsable?.lugarTrabajo ||
              null,
            profesionOficio:
              resp.responsable?.profesionOficio ||
              resp.datosResponsable?.profesionOficio ||
              '',
            ultimoGradoEstudiado:
              resp.responsable?.ultimoGradoEstudiado ||
              resp.datosResponsable?.ultimoGradoEstudiado ||
              null,
            ocupacion:
              resp.responsable?.ocupacion ||
              resp.datosResponsable?.ocupacion ||
              '',
            religion:
              resp.responsable?.religion ||
              resp.datosResponsable?.religion ||
              null,
            zonaResidencia:
              resp.responsable?.zonaResidencia ||
              resp.datosResponsable?.zonaResidencia ||
              'Urbana',
            estadoFamiliar:
              resp.responsable?.estadoFamiliar ||
              resp.datosResponsable?.estadoFamiliar ||
              '',
            empresaTransporte:
              resp.responsable?.empresaTransporte ||
              resp.datosResponsable?.empresaTransporte ||
              null,
            placaVehiculo:
              resp.responsable?.placaVehiculo ||
              resp.datosResponsable?.placaVehiculo ||
              null,
            tipoVehiculo:
              resp.responsable?.tipoVehiculo ||
              resp.datosResponsable?.tipoVehiculo ||
              null,
            firmaFoto: resp.responsable?.firmaFoto || null,
          };

          return {
            parentescoId:
              resp.parentescoId || resp.relacion?.parentescoId || null,
            parentescoLibre:
              resp.parentescoLibre || resp.relacion?.parentescoLibre || '',
            esPrincipal:
              resp.esPrincipal || resp.relacion?.esPrincipal || false,
            firma: resp.firma || resp.relacion?.firma || false,
            permiteTraslado:
              resp.permiteTraslado || resp.relacion?.permiteTraslado || false,
            puedeRetirarAlumno:
              resp.puedeRetirarAlumno ||
              resp.relacion?.puedeRetirarAlumno ||
              false,
            contactoEmergencia:
              resp.contactoEmergencia ||
              resp.relacion?.contactoEmergencia ||
              false,
            datosResponsable: datosResponsable,
            id: resp.id || null, // Incluimos el ID si existe (para actualizar relaciones existentes)
          };
        }),
      };

      try {
        // Usamos la función actualizarAlumnoCompleto del servicio que maneja todos los aspectos
        // de la actualización, incluyendo responsables
        const resultado = await actualizarAlumnoCompleto(
          editingAlumno.id_alumno,
          alumnoActualizado
        );

        // Verificamos si hubo errores con los responsables
        const responsablesConError = resultado.resultadosResponsables.filter(
          (res) => res.error
        );

        // Actualizamos el estado local con el alumno actualizado
        setAlumnos(
          alumnos.map((a) =>
            a.id_alumno === editingAlumno.id_alumno ? resultado.alumno : a
          )
        );

        // Verificamos cuántos responsables se actualizaron correctamente
        const responsablesExitosos = resultado.resultadosResponsables.filter(
          (res) => !res.error
        );

        if (responsablesExitosos.length > 0) {
          toast.success(
            `Se ${responsablesExitosos.length === 1 ? 'actualizó' : 'actualizaron'} ${responsablesExitosos.length} ${responsablesExitosos.length === 1 ? 'responsable' : 'responsables'} correctamente`,
            {
              duration: 3000,
            }
          );
        }

        if (responsablesConError.length > 0) {
          // Mostramos detalles de los errores específicos
          responsablesConError.forEach((res, index) => {
            toast.error(
              `Error en responsable ${index + 1}: ${res.mensaje || 'Error desconocido'}`,
              {
                duration: 5000,
              }
            );
          });

          toast.warning(
            'Alumno actualizado pero hubo problemas con algunos responsables'
          );
        } else {
          toast.success('Alumno actualizado correctamente');
        }

        // Limpiar el formulario y cerrar el modo de edición
        resetForm();
        setEditingAlumno(null);
        setIsDialogOpen(false);
      } catch (error) {
        toast.error(
          'Error al actualizar el alumno. Por favor intente nuevamente.'
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      // Crear nuevo alumno
      // Preparamos el objeto alumno para enviar a la API
      const nuevoAlumno = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        genero: formData.genero,
        fechaNacimiento: formData.fechaNacimiento,
        nacionalidad: formData.nacionalidad,
        edad: edad,
        partidaNumero: formData.partidaNumero,
        folio: formData.folio,
        libro: formData.libro,
        anioPartida: formData.anioPartida,
        departamentoNacimiento: formData.departamentoNacimiento,
        municipioNacimiento: formData.municipioNacimiento,
        tipoSangre: formData.tipoSangre,
        problemaFisico: formData.problemaFisico,
        observacionesMedicas: formData.observacionesMedicas,
        centroAsistencial: formData.centroAsistencial,
        medicoNombre: formData.medicoNombre,
        medicoTelefono: formData.medicoTelefono,
        zonaResidencia: formData.zonaResidencia,
        direccion: formData.direccion,
        municipio: formData.municipio,
        departamento: formData.departamento,
        distanciaKM: formData.distanciaKM,
        medioTransporte: formData.medioTransporte,
        encargadoTransporte: formData.encargadoTransporte,
        encargadoTelefono: formData.encargadoTelefono,
        // Eliminamos las propiedades que causan error:
        // nivel: formData.nivel,
        // grado: formData.grado,
        // seccion: formData.seccion,
        // fechaIngreso: formData.fechaIngreso || new Date().toISOString().split('T')[0],
        repiteGrado: formData.repiteGrado,
        condicionado: formData.condicionado,
        activo: true,
        detalle: {
          viveCon: formData.viveCon,
          dependenciaEconomica: formData.dependenciaEconomica,
          capacidadPago: formData.capacidadPago,
          tieneHermanosEnColegio: formData.tieneHermanosEnColegio,
          hermanosEnColegio: formData.hermanosEnColegio
            ? JSON.parse(formData.hermanosEnColegio)
            : [],
        },
        responsables: responsables.map((resp) => {
          // Preparamos los responsables con la estructura que espera la API
          // Datos del responsable en un objeto anidado como requiere la API
          const datosResponsable = {
            nombre:
              resp.responsable?.nombre || resp.datosResponsable?.nombre || '',
            apellido:
              resp.responsable?.apellido ||
              resp.datosResponsable?.apellido ||
              '',
            dui: resp.responsable?.dui || resp.datosResponsable?.dui || '',
            telefono:
              resp.responsable?.telefono ||
              resp.datosResponsable?.telefono ||
              '',
            email:
              resp.responsable?.email || resp.datosResponsable?.email || null,
            direccion:
              resp.responsable?.direccion ||
              resp.datosResponsable?.direccion ||
              '',
            lugarTrabajo:
              resp.responsable?.lugarTrabajo ||
              resp.datosResponsable?.lugarTrabajo ||
              null,
            profesionOficio:
              resp.responsable?.profesionOficio ||
              resp.datosResponsable?.profesionOficio ||
              '',
            ultimoGradoEstudiado:
              resp.responsable?.ultimoGradoEstudiado ||
              resp.datosResponsable?.ultimoGradoEstudiado ||
              null,
            ocupacion:
              resp.responsable?.ocupacion ||
              resp.datosResponsable?.ocupacion ||
              '',
            religion:
              resp.responsable?.religion ||
              resp.datosResponsable?.religion ||
              null,
            zonaResidencia:
              resp.responsable?.zonaResidencia ||
              resp.datosResponsable?.zonaResidencia ||
              'Urbana',
            estadoFamiliar:
              resp.responsable?.estadoFamiliar ||
              resp.datosResponsable?.estadoFamiliar ||
              '',
            empresaTransporte:
              resp.responsable?.empresaTransporte ||
              resp.datosResponsable?.empresaTransporte ||
              null,
            placaVehiculo:
              resp.responsable?.placaVehiculo ||
              resp.datosResponsable?.placaVehiculo ||
              null,
            tipoVehiculo:
              resp.responsable?.tipoVehiculo ||
              resp.datosResponsable?.tipoVehiculo ||
              null,
            firmaFoto: resp.responsable?.firmaFoto || null,
          };

          return {
            // Datos de la relación con el alumno
            parentescoId:
              resp.parentescoId || resp.relacion?.parentescoId || null,
            parentescoLibre:
              resp.parentescoLibre || resp.relacion?.parentescoLibre || '',
            esPrincipal:
              resp.esPrincipal || resp.relacion?.esPrincipal || false,
            firma: resp.firma || resp.relacion?.firma || false,
            permiteTraslado:
              resp.permiteTraslado || resp.relacion?.permiteTraslado || false,
            puedeRetirarAlumno:
              resp.puedeRetirarAlumno ||
              resp.relacion?.puedeRetirarAlumno ||
              false,
            contactoEmergencia:
              resp.contactoEmergencia ||
              resp.relacion?.contactoEmergencia ||
              false,

            // Anidando los datos del responsable como espera la API
            datosResponsable: datosResponsable,
          };
        }),
      };

      // Mostramos un indicador de carga
      setIsLoading(true);

      // Realizamos la petición POST a la API
      try {
        // Intentamos una versión alternativa de la petición API usando fetch directamente
        // para descartar posibles problemas con axios
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const token = localStorage.getItem('access_token');

        const fetchResponse = await fetch(`${apiUrl}/alumnos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify(nuevoAlumno),
        });

        if (fetchResponse.ok) {
          const alumnoCreado = (await fetchResponse.json()) as Alumno;
          setAlumnos([...alumnos, alumnoCreado]);
          toast.success('Alumno registrado correctamente');
        } else {
          // Intentamos obtener datos de error pero no los mostramos en consola
          await fetchResponse.json().catch(() => ({}));

          toast.error(
            `Error al registrar: ${fetchResponse.status} ${fetchResponse.statusText}`
          );
          throw new Error(
            `Error al registrar: ${fetchResponse.status} ${fetchResponse.statusText}`
          );
        }

        // Cerramos el diálogo y limpiamos el formulario
        setIsDialogOpen(false);

        // Reiniciamos el formulario y los responsables
        setFormData({
          nombre: '',
          apellido: '',
          genero: 'Masculino',
          fechaNacimiento: '',
          nacionalidad: 'Salvadoreña',
          partidaNumero: '',
          folio: '',
          libro: '',
          anioPartida: '',
          departamentoNacimiento: '',
          municipioNacimiento: '',
          tipoSangre: '',
          problemaFisico: '',
          observacionesMedicas: '',
          centroAsistencial: '',
          medicoNombre: '',
          medicoTelefono: '',
          zonaResidencia: 'Urbana',
          direccion: '',
          municipio: '',
          departamento: '',
          distanciaKM: 0,
          medioTransporte: '',
          encargadoTransporte: '',
          encargadoTelefono: '',
          nivel: 'basica',
          grado: '',
          seccion: '',
          fechaIngreso: '',
          repiteGrado: false,
          condicionado: false,
          viveCon: '',
          dependenciaEconomica: '',
          capacidadPago: false,
          tieneHermanosEnColegio: false,
          hermanosEnColegio: '[]',
        });
        setResponsables([]);
      } catch (error: any) {
        // Mostrar más información del error para diagnosticar
        toast.error(
          'Error al registrar el alumno: ' +
            (error.response?.data?.message ||
              error.message ||
              'Error de conexión')
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleToggleStatus = async (alumno: Alumno) => {
    if (!alumno.id_alumno) {
      toast.error('ID de alumno no encontrado');
      return;
    }

    setIsLoading(true);

    try {
      if (alumno.activo) {
        // Desactivar alumno
        await desactivarAlumno(alumno.id_alumno);
      } else {
        // Reactivar alumno
        await reactivarAlumno(alumno.id_alumno);
      }

      const newStatus = !alumno.activo;

      // Actualizar estado local
      setAlumnos(
        alumnos.map((a) =>
          a.id_alumno === alumno.id_alumno ? { ...a, activo: newStatus } : a
        )
      );

      toast.success(
        `Alumno ${newStatus ? 'activado' : 'desactivado'} correctamente`
      );
    } catch (error) {
      toast.error(
        `Error al ${alumno.activo ? 'desactivar' : 'activar'} el alumno`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const calcularEdadDisplay = (fechaNacimiento: string) => {
    const hoy = new Date();
    const [day, month, year] = fechaNacimiento.split('/');
    const nacimiento = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    );
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const getParentescoNombre = (
    parentescoId?: number | null,
    parentescoLibre?: string
  ) => {
    // Si hay texto libre de parentesco, lo usamos directamente
    if (parentescoLibre) return parentescoLibre;

    // Si no hay ID de parentesco, retornamos mensaje genérico
    if (parentescoId === null || parentescoId === undefined) {
      return 'Contacto';
    }

    // Buscamos el parentesco por ID en la lista de parentescos cargada de la API
    // Si hay parentescos cargados, los usamos
    if (parentescos.length > 0) {
      const parentesco = parentescos.find(
        (p) => p.id_parentesco === parentescoId
      );
      return parentesco?.nombre || 'Contacto principal';
    }

    // Si no hay parentescos cargados, usamos valores por defecto
    return parentescoId === 1
      ? 'Padre'
      : parentescoId === 2
        ? 'Madre'
        : 'Contacto principal';
  };

  const getResponsablePrincipal = (alumno: Alumno) => {
    // Verificamos que responsables exista y no esté vacío

    if (!alumno.responsables) {
      return null;
    }

    // Primero verificamos si responsables es un array
    if (Array.isArray(alumno.responsables)) {
      if (alumno.responsables.length === 0) {
        return null;
      }

      // Buscamos el responsable principal usando la propiedad esPrincipal
      const principal = alumno.responsables.find((r) => r.esPrincipal === true);

      // Si encontramos uno principal, lo retornamos
      if (principal) {
        return principal;
      }

      // Si no hay principal, retornamos el primero de la lista
      return alumno.responsables[0];
    } else if (
      typeof alumno.responsables === 'object' &&
      alumno.responsables !== null
    ) {
      // Si responsables no es un array sino un objeto único
      return alumno.responsables;
    }

    return null;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Alumnos
          </h1>
          <p className="text-gray-600">
            Administra la información completa de los estudiantes
          </p>
        </div>
        <Button
          onClick={handleCreateAlumno}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Alumno
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Alumnos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {alumnos.length}
                </p>
              </div>
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Parvularia</p>
                <p className="text-2xl font-bold text-green-600">
                  {alumnos.filter((a) => a.nivel === 'parvularia').length}
                </p>
              </div>
              <User className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Básica</p>
                <p className="text-2xl font-bold text-purple-600">
                  {alumnos.filter((a) => a.nivel === 'basica').length}
                </p>
              </div>
              <GraduationCap className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Media</p>
                <p className="text-2xl font-bold text-orange-600">
                  {alumnos.filter((a) => a.nivel === 'media').length}
                </p>
              </div>
              <User className="w-8 h-8 text-orange-600" />
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
                  placeholder="Buscar por nombre o apellidos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterNivel} onValueChange={setFilterNivel}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los niveles</SelectItem>
                <SelectItem value="parvularia">Parvularia</SelectItem>
                <SelectItem value="basica">Básica</SelectItem>
                <SelectItem value="media">Media</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
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

      {/* Tabla de alumnos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5" />
            <span>Lista de Alumnos ({filteredAlumnos.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Edad</TableHead>
                <TableHead>Nivel/Grado</TableHead>
                <TableHead>Responsable Principal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="mt-2 text-sm text-gray-500">
                        Cargando alumnos...
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <XCircle className="h-8 w-8 text-red-500" />
                      <p className="mt-2 text-sm text-gray-500">{error}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setIsLoading(true);
                          api
                            .get('/alumnos', {
                              params: { incluirInactivos: true },
                            })
                            .then((response) => {
                              // Aseguramos que cada alumno tenga la propiedad responsables definida
                              const alumnosData = (
                                response.data as Alumno[]
                              ).map((alumno) => ({
                                ...alumno,
                                responsables: alumno.responsables || [],
                                detalle: alumno.detalle || {
                                  viveCon: '',
                                  dependenciaEconomica: '',
                                  capacidadPago: false,
                                  tieneHermanosEnColegio: false,
                                  hermanosEnColegio: [],
                                },
                              }));
                              setAlumnos(alumnosData);
                              setError(null);
                            })
                            .catch(() => {
                              setError(
                                'Error al cargar los alumnos. Intente de nuevo más tarde.'
                              );
                            })
                            .then(
                              () => {
                                setIsLoading(false);
                              },
                              () => {
                                setIsLoading(false);
                              }
                            );
                        }}
                      >
                        Reintentar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAlumnos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-sm text-gray-500">
                      No se encontraron alumnos
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAlumnos.map((alumno) => {
                  // Obtenemos el responsable principal
                  const responsablePrincipal = getResponsablePrincipal(alumno);

                  // Verificamos que exista el responsable principal
                  if (responsablePrincipal) {
                    // El responsable principal existe
                  }
                  return (
                    <TableRow
                      key={alumno.id_alumno}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleViewAlumno(alumno)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {alumno.nombre} {alumno.apellido}
                          </p>
                          <p className="text-sm text-gray-500">
                            {alumno.grado}° {alumno.seccion}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {alumno.fechaNacimiento
                          ? `${calcularEdadDisplay(alumno.fechaNacimiento)} años`
                          : 'No registrado'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {alumno.nivel} - {alumno.grado}°
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          {responsablePrincipal ? (
                            <>
                              <p className="font-medium text-sm">
                                {/* Usando las propiedades correctas según la estructura del responsable */}
                                {(() => {
                                  if (!responsablePrincipal)
                                    return 'Sin responsable';

                                  // Verificamos si los datos están en responsable (nueva estructura)
                                  if (
                                    responsablePrincipal.responsable?.nombre
                                  ) {
                                    return `${responsablePrincipal.responsable.nombre} ${responsablePrincipal.responsable.apellido || ''}`;
                                  }

                                  // O si están en datosResponsable (estructura anterior)
                                  if (
                                    responsablePrincipal.datosResponsable
                                      ?.nombre
                                  ) {
                                    return `${responsablePrincipal.datosResponsable.nombre} ${responsablePrincipal.datosResponsable.apellido || ''}`;
                                  }

                                  return 'Sin nombre Sin apellido';
                                })()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(() => {
                                  if (!responsablePrincipal) return '';

                                  // Si tiene parentesco anidado, lo usamos directamente
                                  if (responsablePrincipal.parentesco?.nombre) {
                                    return responsablePrincipal.parentesco
                                      .nombre;
                                  }

                                  // Si tiene parentescoId en nivel raíz
                                  if (
                                    responsablePrincipal.parentescoId !==
                                    undefined
                                  ) {
                                    return getParentescoNombre(
                                      responsablePrincipal.parentescoId,
                                      responsablePrincipal.parentescoLibre || ''
                                    );
                                  }

                                  // Si tiene relacion.parentescoId
                                  if (
                                    responsablePrincipal.relacion
                                      ?.parentescoId !== undefined
                                  ) {
                                    return getParentescoNombre(
                                      responsablePrincipal.relacion
                                        .parentescoId,
                                      responsablePrincipal.relacion
                                        .parentescoLibre || ''
                                    );
                                  }

                                  return 'Contacto principal';
                                })()}
                              </p>
                              {alumno.responsables &&
                                alumno.responsables.length > 1 && (
                                  <p className="text-xs text-blue-600">
                                    +{alumno.responsables.length - 1} más
                                  </p>
                                )}
                            </>
                          ) : (
                            <p className="text-sm text-gray-400">
                              Sin responsable principal
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={alumno.activo ? 'default' : 'destructive'}
                        >
                          {alumno.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewAlumno(alumno)}
                            title="Ver información detallada"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAlumno(alumno)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(alumno)}
                            className={
                              alumno.activo
                                ? 'text-orange-600 hover:text-orange-700'
                                : 'text-green-600 hover:text-green-700'
                            }
                            title={
                              alumno.activo
                                ? 'Desactivar alumno'
                                : 'Activar alumno'
                            }
                          >
                            {alumno.activo ? (
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
        </CardContent>
      </Card>

      {/* Dialog para crear/editar alumno */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAlumno ? 'Editar Alumno' : 'Registrar Nuevo Alumno'}
            </DialogTitle>
            <DialogDescription>
              {editingAlumno
                ? 'Modifica la información completa del alumno'
                : 'Completa todos los datos del nuevo alumno'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <Tabs
              value={currentTab}
              onValueChange={setCurrentTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger
                  value="personal"
                  className="flex items-center space-x-1"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Personal</span>
                </TabsTrigger>
                <TabsTrigger
                  value="nacimiento"
                  className="flex items-center space-x-1"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Nacimiento</span>
                </TabsTrigger>
                <TabsTrigger
                  value="medico"
                  className="flex items-center space-x-1"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span className="hidden sm:inline">Médico</span>
                </TabsTrigger>
                <TabsTrigger
                  value="residencia"
                  className="flex items-center space-x-1"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">Residencia</span>
                </TabsTrigger>
                <TabsTrigger
                  value="transporte"
                  className="flex items-center space-x-1"
                >
                  <Car className="w-4 h-4" />
                  <span className="hidden sm:inline">Transporte</span>
                </TabsTrigger>
                <TabsTrigger
                  value="academico"
                  className="flex items-center space-x-1"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="hidden sm:inline">Académico</span>
                </TabsTrigger>
                <TabsTrigger
                  value="detalles"
                  className="flex items-center space-x-1"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Detalles</span>
                </TabsTrigger>
                <TabsTrigger
                  value="responsables"
                  className="flex items-center space-x-1"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Responsables</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab: Datos Personales */}
              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, nombre: e.target.value })
                      }
                      placeholder="Juan Carlos"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="apellido">Apellido *</Label>
                    <Input
                      id="apellido"
                      value={formData.apellido}
                      onChange={(e) =>
                        setFormData({ ...formData, apellido: e.target.value })
                      }
                      placeholder="Pérez González"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="genero">Género</Label>
                    <Select
                      value={formData.genero}
                      onValueChange={(value) =>
                        setFormData({ ...formData, genero: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="fechaNacimiento">
                      Fecha de Nacimiento * (DD/MM/YYYY)
                    </Label>
                    <Input
                      id="fechaNacimiento"
                      value={formData.fechaNacimiento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fechaNacimiento: e.target.value,
                        })
                      }
                      placeholder="01/01/2010"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="nacionalidad">Nacionalidad</Label>
                    <Input
                      id="nacionalidad"
                      value={formData.nacionalidad}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nacionalidad: e.target.value,
                        })
                      }
                      placeholder="Salvadoreña"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Datos de Nacimiento */}
              <TabsContent value="nacimiento" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="partidaNumero">Número de Partida</Label>
                    <Input
                      id="partidaNumero"
                      value={formData.partidaNumero}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          partidaNumero: e.target.value,
                        })
                      }
                      placeholder="123456"
                    />
                  </div>

                  <div>
                    <Label htmlFor="folio">Folio</Label>
                    <Input
                      id="folio"
                      value={formData.folio}
                      onChange={(e) =>
                        setFormData({ ...formData, folio: e.target.value })
                      }
                      placeholder="123"
                    />
                  </div>

                  <div>
                    <Label htmlFor="libro">Libro</Label>
                    <Input
                      id="libro"
                      value={formData.libro}
                      onChange={(e) =>
                        setFormData({ ...formData, libro: e.target.value })
                      }
                      placeholder="456"
                    />
                  </div>

                  <div>
                    <Label htmlFor="anioPartida">Año de Partida</Label>
                    <Input
                      id="anioPartida"
                      value={formData.anioPartida}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          anioPartida: e.target.value,
                        })
                      }
                      placeholder="2010"
                    />
                  </div>

                  <div>
                    <Label htmlFor="departamentoNacimiento">
                      Departamento de Nacimiento
                    </Label>
                    <Select
                      value={formData.departamentoNacimiento}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          departamentoNacimiento: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTAMENTOS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="municipioNacimiento">
                      Municipio de Nacimiento
                    </Label>
                    <Input
                      id="municipioNacimiento"
                      value={formData.municipioNacimiento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          municipioNacimiento: e.target.value,
                        })
                      }
                      placeholder="San Salvador"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Datos Médicos */}
              <TabsContent value="medico" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipoSangre">Tipo de Sangre</Label>
                    <Select
                      value={formData.tipoSangre}
                      onValueChange={(value) =>
                        setFormData({ ...formData, tipoSangre: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo de sangre" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_SANGRE.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="problemaFisico">Problemas Físicos</Label>
                    <Input
                      id="problemaFisico"
                      value={formData.problemaFisico}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          problemaFisico: e.target.value,
                        })
                      }
                      placeholder="Ninguno"
                    />
                  </div>

                  <div>
                    <Label htmlFor="centroAsistencial">
                      Centro Asistencial
                    </Label>
                    <Input
                      id="centroAsistencial"
                      value={formData.centroAsistencial}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          centroAsistencial: e.target.value,
                        })
                      }
                      placeholder="Hospital Central"
                    />
                  </div>

                  <div>
                    <Label htmlFor="medicoNombre">Nombre del Médico</Label>
                    <Input
                      id="medicoNombre"
                      value={formData.medicoNombre}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          medicoNombre: e.target.value,
                        })
                      }
                      placeholder="Dr. Juan Pérez"
                    />
                  </div>

                  <div>
                    <Label htmlFor="medicoTelefono">Teléfono del Médico</Label>
                    <Input
                      id="medicoTelefono"
                      value={formData.medicoTelefono}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          medicoTelefono: e.target.value,
                        })
                      }
                      placeholder="2222-3333"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="observacionesMedicas">
                      Observaciones Médicas
                    </Label>
                    <Textarea
                      id="observacionesMedicas"
                      value={formData.observacionesMedicas}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          observacionesMedicas: e.target.value,
                        })
                      }
                      placeholder="Sin alergias conocidas"
                      rows={3}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Datos de Residencia */}
              <TabsContent value="residencia" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zonaResidencia">Zona de Residencia</Label>
                    <Select
                      value={formData.zonaResidencia}
                      onValueChange={(value) =>
                        setFormData({ ...formData, zonaResidencia: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar zona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Urbana">Urbana</SelectItem>
                        <SelectItem value="Rural">Rural</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="departamento">Departamento</Label>
                    <Select
                      value={formData.departamento}
                      onValueChange={(value) =>
                        setFormData({ ...formData, departamento: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTAMENTOS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="municipio">Municipio</Label>
                    <Input
                      id="municipio"
                      value={formData.municipio}
                      onChange={(e) =>
                        setFormData({ ...formData, municipio: e.target.value })
                      }
                      placeholder="San Salvador"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="direccion">Dirección Completa</Label>
                    <Input
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) =>
                        setFormData({ ...formData, direccion: e.target.value })
                      }
                      placeholder="Calle Principal #123"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Datos de Transporte */}
              <TabsContent value="transporte" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="distanciaKM">Distancia en KM</Label>
                    <Input
                      id="distanciaKM"
                      type="number"
                      step="0.1"
                      value={formData.distanciaKM}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          distanciaKM: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="5.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="medioTransporte">Medio de Transporte</Label>
                    <Input
                      id="medioTransporte"
                      value={formData.medioTransporte}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          medioTransporte: e.target.value,
                        })
                      }
                      placeholder="Autobús escolar"
                    />
                  </div>

                  <div>
                    <Label htmlFor="encargadoTransporte">
                      Encargado de Transporte
                    </Label>
                    <Input
                      id="encargadoTransporte"
                      value={formData.encargadoTransporte}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          encargadoTransporte: e.target.value,
                        })
                      }
                      placeholder="José Transportista"
                    />
                  </div>

                  <div>
                    <Label htmlFor="encargadoTelefono">
                      Teléfono del Encargado
                    </Label>
                    <Input
                      id="encargadoTelefono"
                      value={formData.encargadoTelefono}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          encargadoTelefono: e.target.value,
                        })
                      }
                      placeholder="7777-8888"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Estado Académico */}
              <TabsContent value="academico" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nivel">Nivel Educativo</Label>
                    <Select
                      value={formData.nivel}
                      onValueChange={(
                        value: 'parvularia' | 'basica' | 'media'
                      ) => setFormData({ ...formData, nivel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar nivel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parvularia">Parvularia</SelectItem>
                        <SelectItem value="basica">Básica</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="grado">Grado</Label>
                    <Input
                      id="grado"
                      value={formData.grado}
                      onChange={(e) =>
                        setFormData({ ...formData, grado: e.target.value })
                      }
                      placeholder="8"
                    />
                  </div>

                  <div>
                    <Label htmlFor="seccion">Sección</Label>
                    <Input
                      id="seccion"
                      value={formData.seccion}
                      onChange={(e) =>
                        setFormData({ ...formData, seccion: e.target.value })
                      }
                      placeholder="A"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fechaIngreso">Fecha de Ingreso</Label>
                    <Input
                      id="fechaIngreso"
                      type="date"
                      value={formData.fechaIngreso}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fechaIngreso: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="repiteGrado"
                      checked={formData.repiteGrado}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, repiteGrado: !!checked })
                      }
                    />
                    <Label htmlFor="repiteGrado">Repite Grado</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="condicionado"
                      checked={formData.condicionado}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, condicionado: !!checked })
                      }
                    />
                    <Label htmlFor="condicionado">Condicionado</Label>
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Detalles Adicionales */}
              <TabsContent value="detalles" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="viveCon">Vive Con</Label>
                    <Input
                      id="viveCon"
                      value={formData.viveCon}
                      onChange={(e) =>
                        setFormData({ ...formData, viveCon: e.target.value })
                      }
                      placeholder="Ambos padres"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dependenciaEconomica">
                      Dependencia Económica
                    </Label>
                    <Input
                      id="dependenciaEconomica"
                      value={formData.dependenciaEconomica}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dependenciaEconomica: e.target.value,
                        })
                      }
                      placeholder="Padre"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="capacidadPago"
                      checked={formData.capacidadPago}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, capacidadPago: !!checked })
                      }
                    />
                    <Label htmlFor="capacidadPago">
                      Tiene Capacidad de Pago
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tieneHermanosEnColegio"
                      checked={formData.tieneHermanosEnColegio}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          tieneHermanosEnColegio: !!checked,
                        })
                      }
                    />
                    <Label htmlFor="tieneHermanosEnColegio">
                      Tiene Hermanos en el Colegio
                    </Label>
                  </div>

                  {formData.tieneHermanosEnColegio && (
                    <div className="md:col-span-2">
                      <Label htmlFor="hermanos">Hermanos en el Colegio</Label>
                      <div className="space-y-4 mt-2">
                        {/* Lista de hermanos actuales */}
                        {formData.hermanosEnColegio &&
                          JSON.parse(formData.hermanosEnColegio || '[]').map(
                            (hermano: any, index: number) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={hermano.nombre}
                                  placeholder="Nombre completo"
                                  className="flex-1"
                                  onChange={(e) => {
                                    const hermanos = JSON.parse(
                                      formData.hermanosEnColegio || '[]'
                                    );
                                    hermanos[index].nombre = e.target.value;
                                    setFormData({
                                      ...formData,
                                      hermanosEnColegio:
                                        JSON.stringify(hermanos),
                                    });
                                  }}
                                />
                                <Input
                                  value={hermano.grado}
                                  placeholder="Grado"
                                  className="w-20"
                                  onChange={(e) => {
                                    const hermanos = JSON.parse(
                                      formData.hermanosEnColegio || '[]'
                                    );
                                    hermanos[index].grado = e.target.value;
                                    setFormData({
                                      ...formData,
                                      hermanosEnColegio:
                                        JSON.stringify(hermanos),
                                    });
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  type="button"
                                  onClick={() => {
                                    const hermanos = JSON.parse(
                                      formData.hermanosEnColegio || '[]'
                                    );
                                    hermanos.splice(index, 1);
                                    setFormData({
                                      ...formData,
                                      hermanosEnColegio:
                                        JSON.stringify(hermanos),
                                    });
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )
                          )}

                        {/* Botón para agregar nuevo hermano */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            const hermanos = JSON.parse(
                              formData.hermanosEnColegio || '[]'
                            );
                            hermanos.push({ nombre: '', grado: '' });
                            setFormData({
                              ...formData,
                              hermanosEnColegio: JSON.stringify(hermanos),
                            });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Hermano
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab: Responsables */}
              <TabsContent value="responsables" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    Responsables del Alumno
                  </h3>
                  <Button
                    type="button"
                    onClick={addResponsable}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Responsable
                  </Button>
                </div>

                {responsables.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay responsables agregados</p>
                    <Button
                      type="button"
                      onClick={addResponsable}
                      variant="outline"
                      className="mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Primer Responsable
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {responsables.map((responsable, index) => (
                      <Card key={responsable.id_responsable} className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-md font-medium">
                            Responsable {index + 1}
                          </h4>
                          <div className="flex gap-2">
                            {/* Botón para cancelar formularios vacíos - con depuración */}
                            {(() => {
                              const isEmpty = isEmptyResponsable(responsable);
                              // Verificación de formulario vacío
                              if (isEmpty) {
                                return (
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                      removeResponsable(index);
                                    }}
                                    className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    title="Cancelar formulario vacío"
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancelar formulario
                                  </Button>
                                );
                              } else {
                                return (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          '¿Está seguro que desea eliminar este responsable?' +
                                            (responsable.id
                                              ? ' Esta acción no se puede deshacer.'
                                              : '')
                                        )
                                      ) {
                                        // Eliminando responsable con datos
                                        removeResponsable(index);
                                      }
                                    }}
                                    className="hover:bg-red-700"
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Eliminar responsable
                                  </Button>
                                );
                              }
                            })()}
                          </div>
                        </div>

                        {/* Datos Básicos */}
                        <div className="space-y-4">
                          <h5 className="text-sm font-medium text-gray-700 border-b pb-2">
                            Datos Básicos
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label>Nombre</Label>
                              <Input
                                value={
                                  responsable.datosResponsable?.nombre !==
                                  undefined
                                    ? responsable.datosResponsable.nombre
                                    : responsable.responsable?.nombre || ''
                                }
                                onChange={(e) => {
                                  // Asegurarnos de que se pase el valor exacto, incluso si es vacío
                                  updateResponsable(
                                    index,
                                    'datosResponsable',
                                    'nombre',
                                    e.target.value
                                  );
                                }}
                                placeholder="María"
                              />
                            </div>

                            <div>
                              <Label>Apellido</Label>
                              <Input
                                value={
                                  responsable.datosResponsable?.apellido !==
                                  undefined
                                    ? responsable.datosResponsable.apellido
                                    : responsable.responsable?.apellido || ''
                                }
                                onChange={(e) => {
                                  // Asegurarnos de que se pase el valor exacto, incluso si es vacío
                                  updateResponsable(
                                    index,
                                    'datosResponsable',
                                    'apellido',
                                    e.target.value
                                  );
                                }}
                                placeholder="González"
                              />
                            </div>

                            <div>
                              <Label>DUI</Label>
                              <Input
                                value={
                                  responsable.datosResponsable?.dui !==
                                  undefined
                                    ? responsable.datosResponsable.dui
                                    : responsable.responsable?.dui || ''
                                }
                                onChange={(e) => {
                                  updateResponsable(
                                    index,
                                    'datosResponsable',
                                    'dui',
                                    e.target.value
                                  );
                                }}
                                placeholder="12345678-9"
                              />
                            </div>

                            <div>
                              <Label>Teléfono</Label>
                              <Input
                                value={
                                  responsable.datosResponsable?.telefono !==
                                  undefined
                                    ? responsable.datosResponsable.telefono
                                    : responsable.responsable?.telefono || ''
                                }
                                onChange={(e) => {
                                  // Asegurarnos de que se pase el valor exacto, incluso si es vacío
                                  updateResponsable(
                                    index,
                                    'datosResponsable',
                                    'telefono',
                                    e.target.value
                                  );
                                }}
                                placeholder="7890-5678"
                              />
                            </div>

                            <div>
                              <Label>Correo Electrónico</Label>
                              <Input
                                type="email"
                                value={
                                  responsable.datosResponsable?.email !==
                                    undefined &&
                                  responsable.datosResponsable?.email !== null
                                    ? String(responsable.datosResponsable.email)
                                    : responsable.responsable?.email !==
                                          undefined &&
                                        responsable.responsable?.email !== null
                                      ? String(responsable.responsable.email)
                                      : ''
                                }
                                onChange={(e) => {
                                  // Aseguramos que se pase el valor exacto, incluso si es vacío
                                  updateResponsable(
                                    index,
                                    'datosResponsable',
                                    'email',
                                    e.target.value
                                  );
                                }}
                                placeholder="correo@email.com"
                              />
                            </div>

                            <div>
                              <Label>Parentesco</Label>
                              <Select
                                value={
                                  responsable.relacion?.parentescoId?.toString() ||
                                  responsable.parentescoId?.toString() ||
                                  '1'
                                }
                                onValueChange={(value) =>
                                  updateResponsable(
                                    index,
                                    'relacion',
                                    'parentescoId',
                                    parseInt(value)
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar parentesco" />
                                </SelectTrigger>
                                <SelectContent>
                                  {parentescos.length > 0 ? (
                                    // Usamos los parentescos cargados desde la API
                                    parentescos.map((parentesco) => (
                                      <SelectItem
                                        key={parentesco.id_parentesco}
                                        value={parentesco.id_parentesco.toString()}
                                      >
                                        {parentesco.nombre}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    // Fallback en caso de que no se hayan cargado los parentescos
                                    <SelectItem value="1">
                                      Cargando parentescos...
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="md:col-span-3">
                              <Label>Dirección</Label>
                              <Input
                                value={
                                  responsable.datosResponsable?.direccion !==
                                  undefined
                                    ? responsable.datosResponsable.direccion
                                    : responsable.responsable?.direccion || ''
                                }
                                onChange={(e) => {
                                  updateResponsable(
                                    index,
                                    'datosResponsable',
                                    'direccion',
                                    e.target.value
                                  );
                                }}
                                placeholder="Av. Principal #123, San Salvador"
                              />
                            </div>
                          </div>

                          {/* Datos Profesionales */}
                          <h5 className="text-sm font-medium text-gray-700 border-b pb-2">
                            Datos Profesionales
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Lugar de Trabajo</Label>
                              <Input
                                value={
                                  responsable.datosResponsable?.lugarTrabajo !==
                                  undefined
                                    ? responsable.datosResponsable
                                        .lugarTrabajo || ''
                                    : responsable.responsable?.lugarTrabajo ||
                                      ''
                                }
                                onChange={(e) => {
                                  updateResponsable(
                                    index,
                                    'datosResponsable',
                                    'lugarTrabajo',
                                    e.target.value
                                  );
                                }}
                                placeholder="Empresa XYZ"
                              />
                            </div>

                            <div>
                              <Label>Profesión u Oficio</Label>
                              <Input
                                value={
                                  responsable.datosResponsable
                                    ?.profesionOficio !== undefined
                                    ? responsable.datosResponsable
                                        .profesionOficio
                                    : responsable.responsable
                                        ?.profesionOficio || ''
                                }
                                onChange={(e) => {
                                  updateResponsable(
                                    index,
                                    'datosResponsable',
                                    'profesionOficio',
                                    e.target.value
                                  );
                                }}
                                placeholder="Ingeniero"
                              />
                            </div>

                            <div>
                              <Label>Último Grado Estudiado</Label>
                              <Select
                                value={
                                  responsable.datosResponsable
                                    ?.ultimoGradoEstudiado ||
                                  responsable.responsable
                                    ?.ultimoGradoEstudiado ||
                                  ''
                                }
                                onValueChange={(value) =>
                                  updateResponsable(
                                    index,
                                    'datosResponsable',
                                    'ultimoGradoEstudiado',
                                    value
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar grado" />
                                </SelectTrigger>
                                <SelectContent>
                                  {GRADOS_ESTUDIO.map((grado) => (
                                    <SelectItem key={grado} value={grado}>
                                      {grado}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Ocupación Actual</Label>
                              <Input
                                value={
                                  responsable.datosResponsable?.ocupacion !==
                                  undefined
                                    ? responsable.datosResponsable?.ocupacion
                                    : responsable.responsable?.ocupacion || ''
                                }
                                onChange={(e) => {
                                  // Asegurarnos de que se pase el valor exacto, incluso si es vacío
                                  const valor = e.target.value;
                                  console.log(
                                    'Valor de ocupación:',
                                    valor,
                                    typeof valor
                                  );
                                  updateResponsable(
                                    index,
                                    'datosResponsable',
                                    'ocupacion',
                                    valor
                                  );
                                }}
                                placeholder="Gerente de Sistemas"
                              />
                            </div>
                          </div>

                          {/* Datos Personales Adicionales */}
                          <h5 className="text-sm font-medium text-gray-700 border-b pb-2">
                            Datos Adicionales
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label>Religión</Label>
                              <Select
                                value={
                                  responsable.datosResponsable?.religion !==
                                    undefined &&
                                  responsable.datosResponsable?.religion !==
                                    null
                                    ? String(
                                        responsable.datosResponsable.religion
                                      )
                                    : responsable.responsable?.religion !==
                                          undefined &&
                                        responsable.responsable?.religion !==
                                          null
                                      ? String(responsable.responsable.religion)
                                      : ''
                                }
                                onValueChange={(value) =>
                                  updateResponsable(
                                    index,
                                    'datosResponsable',
                                    'religion',
                                    value
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar religión" />
                                </SelectTrigger>
                                <SelectContent>
                                  {RELIGIONES.map((religion) => (
                                    <SelectItem key={religion} value={religion}>
                                      {religion}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Zona de Residencia</Label>
                              <Select
                                value={
                                  responsable.datosResponsable
                                    ?.zonaResidencia ||
                                  responsable.responsable?.zonaResidencia ||
                                  'Urbana'
                                }
                                onValueChange={(value) =>
                                  updateResponsable(
                                    index,
                                    'datosResponsable',
                                    'zonaResidencia',
                                    value
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar zona" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Urbana">Urbana</SelectItem>
                                  <SelectItem value="Rural">Rural</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Estado Familiar</Label>
                              <Select
                                value={
                                  responsable.datosResponsable
                                    ?.estadoFamiliar ||
                                  responsable.responsable?.estadoFamiliar ||
                                  ''
                                }
                                onValueChange={(value) =>
                                  updateResponsable(
                                    index,
                                    'datosResponsable',
                                    'estadoFamiliar',
                                    value
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Soltero/a">
                                    Soltero/a
                                  </SelectItem>
                                  <SelectItem value="Casado/a">
                                    Casado/a
                                  </SelectItem>
                                  <SelectItem value="Divorciado/a">
                                    Divorciado/a
                                  </SelectItem>
                                  <SelectItem value="Viudo/a">
                                    Viudo/a
                                  </SelectItem>
                                  <SelectItem value="Unión Libre">
                                    Unión Libre
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Datos de Transporte */}
                          <h5 className="text-sm font-medium text-gray-700 border-b pb-2">
                            Datos de Transporte (Opcional)
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label>Empresa de Transporte</Label>
                              <Input
                                value={
                                  responsable.datosResponsable
                                    ?.empresaTransporte ||
                                  responsable.responsable?.empresaTransporte ||
                                  ''
                                }
                                onChange={(e) =>
                                  updateResponsable(
                                    index,
                                    'datosResponsable',
                                    'empresaTransporte',
                                    e.target.value
                                  )
                                }
                                placeholder="Transportes El Sol"
                              />
                            </div>

                            <div>
                              <Label>Placa del Vehículo</Label>
                              <Input
                                value={
                                  responsable.datosResponsable?.placaVehiculo ||
                                  responsable.responsable?.placaVehiculo ||
                                  ''
                                }
                                onChange={(e) =>
                                  updateResponsable(
                                    index,
                                    'datosResponsable',
                                    'placaVehiculo',
                                    e.target.value
                                  )
                                }
                                placeholder="P123456"
                              />
                            </div>

                            <div>
                              <Label>Tipo de Vehículo</Label>
                              <Input
                                value={
                                  responsable.datosResponsable?.tipoVehiculo ||
                                  responsable.responsable?.tipoVehiculo ||
                                  ''
                                }
                                onChange={(e) =>
                                  updateResponsable(
                                    index,
                                    'datosResponsable',
                                    'tipoVehiculo',
                                    e.target.value
                                  )
                                }
                                placeholder="Sedán"
                              />
                            </div>
                          </div>

                          {/* Permisos y Autorizaciones */}
                          <h5 className="text-sm font-medium text-gray-700 border-b pb-2">
                            Permisos y Autorizaciones
                          </h5>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`principal-${index}`}
                                checked={
                                  responsable.relacion?.esPrincipal === true ||
                                  responsable.esPrincipal === true ||
                                  false
                                }
                                onCheckedChange={(checked) => {
                                  console.log(
                                    'Checkbox esPrincipal cambiado a:',
                                    checked
                                  );
                                  updateResponsable(
                                    index,
                                    'relacion',
                                    'esPrincipal',
                                    checked === true
                                  );
                                }}
                              />
                              <Label
                                htmlFor={`principal-${index}`}
                                className="text-sm"
                              >
                                Es principal
                              </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`firma-${index}`}
                                checked={
                                  responsable.relacion?.firma === true ||
                                  responsable.firma === true ||
                                  false
                                }
                                onCheckedChange={(checked) => {
                                  updateResponsable(
                                    index,
                                    'relacion',
                                    'firma',
                                    checked === true
                                  );
                                }}
                              />
                              <Label
                                htmlFor={`firma-${index}`}
                                className="text-sm"
                              >
                                Puede firmar
                              </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`traslado-${index}`}
                                checked={
                                  responsable.relacion?.permiteTraslado ===
                                    true ||
                                  responsable.permiteTraslado === true ||
                                  false
                                }
                                onCheckedChange={(checked) => {
                                  console.log(
                                    'Checkbox permiteTraslado cambiado a:',
                                    checked
                                  );
                                  updateResponsable(
                                    index,
                                    'relacion',
                                    'permiteTraslado',
                                    checked === true
                                  );
                                }}
                              />
                              <Label
                                htmlFor={`traslado-${index}`}
                                className="text-sm"
                              >
                                Autoriza traslados
                              </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`retirar-${index}`}
                                checked={
                                  responsable.relacion?.puedeRetirarAlumno ===
                                    true ||
                                  responsable.puedeRetirarAlumno === true ||
                                  false
                                }
                                onCheckedChange={(checked) => {
                                  console.log(
                                    'Checkbox puedeRetirarAlumno cambiado a:',
                                    checked
                                  );
                                  updateResponsable(
                                    index,
                                    'relacion',
                                    'puedeRetirarAlumno',
                                    checked === true
                                  );
                                }}
                              />
                              <Label
                                htmlFor={`retirar-${index}`}
                                className="text-sm"
                              >
                                Puede retirar
                              </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`emergencia-${index}`}
                                checked={
                                  responsable.relacion?.contactoEmergencia ===
                                    true ||
                                  responsable.contactoEmergencia === true ||
                                  false
                                }
                                onCheckedChange={(checked) => {
                                  console.log(
                                    'Checkbox contactoEmergencia cambiado a:',
                                    checked
                                  );
                                  updateResponsable(
                                    index,
                                    'relacion',
                                    'contactoEmergencia',
                                    checked === true
                                  );
                                }}
                              />
                              <Label
                                htmlFor={`emergencia-${index}`}
                                className="text-sm"
                              >
                                Contacto emergencia
                              </Label>
                            </div>
                          </div>

                          {/* Botón de acción para el responsable */}
                          <div className="flex justify-end mt-4 pt-4 border-t">
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={() =>
                                actualizarResponsable(index, false)
                              }
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Save className="w-4 h-4 mr-2" /> Guardar
                              Responsable
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  // Creamos un evento sintético para pasar a handleSubmit
                  const syntheticEvent = {
                    preventDefault: () => {},
                  } as React.FormEvent<HTMLFormElement>;
                  handleSubmit(syntheticEvent);
                }}
              >
                {editingAlumno ? 'Actualizar' : 'Registrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver información detallada del alumno */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Información Completa del Alumno</span>
            </DialogTitle>
            <DialogDescription>
              Información detallada de {selectedAlumno?.nombre}{' '}
              {selectedAlumno?.apellido}
            </DialogDescription>
          </DialogHeader>

          {selectedAlumno && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">Información General</TabsTrigger>
                <TabsTrigger value="academico">Académico & Médico</TabsTrigger>
                <TabsTrigger value="responsables">Responsables</TabsTrigger>
                <TabsTrigger value="adicional">
                  Información Adicional
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Datos Personales */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Datos Personales</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Nombre Completo</p>
                        <p className="font-medium">
                          {selectedAlumno.nombre} {selectedAlumno.apellido}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Género</p>
                        <p className="font-medium">{selectedAlumno.genero}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Fecha de Nacimiento
                        </p>
                        <p className="font-medium">
                          {selectedAlumno.fechaNacimiento}
                          {selectedAlumno.fechaNacimiento &&
                            ` (${calcularEdadDisplay(selectedAlumno.fechaNacimiento)} años)`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Nacionalidad</p>
                        <p className="font-medium">
                          {selectedAlumno.nacionalidad}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Datos de Nacimiento */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Partida de Nacimiento</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">
                          Número de Partida
                        </p>
                        <p className="font-medium">
                          {selectedAlumno.partidaNumero || 'No registrado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Folio - Libro</p>
                        <p className="font-medium">
                          {selectedAlumno.folio} - {selectedAlumno.libro}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Año de Partida</p>
                        <p className="font-medium">
                          {selectedAlumno.anioPartida}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Lugar de Nacimiento
                        </p>
                        <p className="font-medium">
                          {selectedAlumno.municipioNacimiento},{' '}
                          {selectedAlumno.departamentoNacimiento}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Residencia y Transporte */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>Residencia</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Dirección</p>
                        <p className="font-medium">
                          {selectedAlumno.direccion}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Municipio - Departamento
                        </p>
                        <p className="font-medium">
                          {selectedAlumno.municipio},{' '}
                          {selectedAlumno.departamento}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Zona</p>
                        <p className="font-medium">
                          {selectedAlumno.zonaResidencia}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Car className="w-4 h-4" />
                        <span>Transporte</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">
                          Medio de Transporte
                        </p>
                        <p className="font-medium">
                          {selectedAlumno.medioTransporte || 'No especificado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Distancia</p>
                        <p className="font-medium">
                          {selectedAlumno.distanciaKM} km
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Encargado</p>
                        <p className="font-medium">
                          {selectedAlumno.encargadoTransporte || 'No asignado'}
                        </p>
                      </div>
                      {selectedAlumno.encargadoTelefono && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Teléfono del Encargado
                          </p>
                          <p className="font-medium">
                            {selectedAlumno.encargadoTelefono}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="academico" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información Académica */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4" />
                        <span>Estado Académico</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Nivel Educativo</p>
                        <p className="font-medium capitalize">
                          {selectedAlumno.nivel}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Grado y Sección</p>
                        <p className="font-medium">
                          {selectedAlumno.grado}° {selectedAlumno.seccion}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Fecha de Ingreso
                        </p>
                        <p className="font-medium">
                          {selectedAlumno.fechaIngreso}
                        </p>
                      </div>
                      <div className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          {selectedAlumno.repiteGrado ? (
                            <CheckCircle className="w-4 h-4 text-orange-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-green-600" />
                          )}
                          <span className="text-sm">Repite Grado</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {selectedAlumno.condicionado ? (
                            <CheckCircle className="w-4 h-4 text-red-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-green-600" />
                          )}
                          <span className="text-sm">Condicionado</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Información Médica */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Heart className="w-4 h-4" />
                        <span>Información Médica</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Tipo de Sangre</p>
                        <p className="font-medium">
                          {selectedAlumno.tipoSangre || 'No registrado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Problemas Físicos
                        </p>
                        <p className="font-medium">
                          {selectedAlumno.problemaFisico || 'Ninguno'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Centro Asistencial
                        </p>
                        <p className="font-medium">
                          {selectedAlumno.centroAsistencial ||
                            'No especificado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Médico de Cabecera
                        </p>
                        <p className="font-medium">
                          {selectedAlumno.medicoNombre || 'No asignado'}
                        </p>
                        {selectedAlumno.medicoTelefono && (
                          <p className="text-sm text-gray-500">
                            {selectedAlumno.medicoTelefono}
                          </p>
                        )}
                      </div>
                      {selectedAlumno.observacionesMedicas && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Observaciones Médicas
                          </p>
                          <p className="text-sm bg-gray-50 p-2 rounded">
                            {selectedAlumno.observacionesMedicas}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="responsables" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Responsables Registrados</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedAlumno.responsables &&
                    selectedAlumno.responsables.length > 0 ? (
                      <div className="space-y-4">
                        {selectedAlumno.responsables.map((responsable) => (
                          <div
                            key={responsable.id_responsable}
                            className={`p-4 border rounded-lg ${responsable.relacion?.esPrincipal || responsable.esPrincipal ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-medium">
                                    {responsable.datosResponsable?.nombre ||
                                      responsable.responsable?.nombre ||
                                      ''}{' '}
                                    {responsable.datosResponsable?.apellido ||
                                      responsable.responsable?.apellido ||
                                      ''}
                                  </h4>
                                  {(responsable.relacion?.esPrincipal ||
                                    responsable.esPrincipal) && (
                                    <Badge
                                      variant="default"
                                      className="text-xs"
                                    >
                                      Principal
                                    </Badge>
                                  )}
                                  <Badge variant="outline">
                                    {getParentescoNombre(
                                      responsable.relacion?.parentescoId ||
                                        responsable.parentescoId,
                                      responsable.relacion?.parentescoLibre ||
                                        responsable.parentescoLibre ||
                                        ''
                                    )}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
                                  <div className="flex items-center space-x-2">
                                    <IdCard className="w-4 h-4 text-gray-400" />
                                    <span>
                                      {responsable.datosResponsable?.dui ||
                                        responsable.responsable?.dui ||
                                        ''}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>
                                      {responsable.datosResponsable?.telefono ||
                                        responsable.responsable?.telefono ||
                                        ''}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>
                                      {responsable.datosResponsable?.email ||
                                        responsable.responsable?.email ||
                                        ''}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Building className="w-4 h-4 text-gray-400" />
                                    <span>
                                      {responsable.datosResponsable
                                        ?.profesionOficio ||
                                        responsable.responsable
                                          ?.profesionOficio ||
                                        'No especificado'}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-sm text-gray-600 mb-3">
                                  <div className="flex items-center space-x-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span>
                                      {responsable.datosResponsable
                                        ?.direccion ||
                                        responsable.responsable?.direccion ||
                                        ''}
                                    </span>
                                  </div>
                                  {(responsable.datosResponsable
                                    ?.lugarTrabajo ||
                                    responsable.responsable?.lugarTrabajo) && (
                                    <div className="flex items-center space-x-2 mt-1">
                                      <Building className="w-4 h-4 text-gray-400" />
                                      <span>
                                        Trabaja en:{' '}
                                        {responsable.datosResponsable
                                          ?.lugarTrabajo ||
                                          responsable.responsable?.lugarTrabajo}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Permisos */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                  <div className="flex items-center space-x-1">
                                    {responsable.relacion?.firma ||
                                    responsable.firma ? (
                                      <CheckCircle className="w-3 h-3 text-green-600" />
                                    ) : (
                                      <XCircle className="w-3 h-3 text-red-600" />
                                    )}
                                    <span className="text-xs">Firma</span>
                                  </div>

                                  <div className="flex items-center space-x-1">
                                    {responsable.relacion?.permiteTraslado ||
                                    responsable.permiteTraslado ? (
                                      <CheckCircle className="w-3 h-3 text-green-600" />
                                    ) : (
                                      <XCircle className="w-3 h-3 text-red-600" />
                                    )}
                                    <span className="text-xs">Traslado</span>
                                  </div>

                                  <div className="flex items-center space-x-1">
                                    {responsable.relacion?.puedeRetirarAlumno ||
                                    responsable.puedeRetirarAlumno ? (
                                      <CheckCircle className="w-3 h-3 text-green-600" />
                                    ) : (
                                      <XCircle className="w-3 h-3 text-red-600" />
                                    )}
                                    <span className="text-xs">Retiro</span>
                                  </div>

                                  <div className="flex items-center space-x-1">
                                    {responsable.relacion?.contactoEmergencia ||
                                    responsable.contactoEmergencia ? (
                                      <CheckCircle className="w-3 h-3 text-green-600" />
                                    ) : (
                                      <XCircle className="w-3 h-3 text-red-600" />
                                    )}
                                    <span className="text-xs">Emergencia</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No hay responsables registrados para este alumno</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="adicional" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Información Adicional</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Vive Con</p>
                        <p className="font-medium">
                          {selectedAlumno.detalle.viveCon || 'No especificado'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">
                          Dependencia Económica
                        </p>
                        <p className="font-medium">
                          {selectedAlumno.detalle.dependenciaEconomica ||
                            'No especificado'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {selectedAlumno.detalle.capacidadPago ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm">Capacidad de Pago</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {selectedAlumno.detalle.tieneHermanosEnColegio ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm">
                          Tiene Hermanos en el Colegio
                        </span>
                      </div>

                      {selectedAlumno.detalle.tieneHermanosEnColegio &&
                        selectedAlumno.detalle.hermanosEnColegio.length > 0 && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-500 mb-2">
                              Hermanos en el Colegio
                            </p>
                            <div className="space-y-1">
                              {selectedAlumno.detalle.hermanosEnColegio.map(
                                (hermano, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center space-x-2 text-sm"
                                  >
                                    <GraduationCap className="w-4 h-4 text-gray-400" />
                                    <span>
                                      {hermano.nombre} - {hermano.grado}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
