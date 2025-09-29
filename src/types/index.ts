// Definiciones de tipos para la aplicación

export interface DatosResponsable {
  id?: number;
  nombre: string;
  apellido: string;
  dui: string;
  telefono: string;
  email: string | null;
  direccion: string;
  lugarTrabajo: string | null;
  profesionOficio: string;
  ultimoGradoEstudiado: string | null;
  ocupacion: string;
  religion: string | null;
  zonaResidencia: string;
  estadoFamiliar: string;
  empresaTransporte: string | null;
  placaVehiculo: string | null;
  tipoVehiculo: string | null;
  firmaFoto: string | null;
}

export interface ResponsableRelacion {
  id?: number;
  parentescoId: number | null;
  parentescoLibre: string;
  esPrincipal: boolean;
  firma: boolean;
  permiteTraslado: boolean;
  puedeRetirarAlumno: boolean;
  contactoEmergencia: boolean;
  datosResponsable: DatosResponsable;
  alumnoId?: number;
  responsableId?: number;
}

export interface HermanoEnColegio {
  nombre: string;
  grado: string;
}

export interface DetalleAlumno {
  id?: number;
  viveCon: string;
  dependenciaEconomica?: string;
  capacidadPago?: boolean;
  tieneHermanosEnColegio: boolean;
  hermanosEnColegio: HermanoEnColegio[];
  alumnoId?: number;
}

export interface Alumno {
  id_alumno?: number;
  nombre: string;
  apellido: string;
  genero: string;
  fechaNacimiento: string;
  nacionalidad: string;
  edad?: number;
  partidaNumero?: string;
  folio?: string;
  libro?: string;
  anioPartida?: string;
  departamentoNacimiento?: string;
  municipioNacimiento?: string;
  tipoSangre?: string;
  problemaFisico?: string;
  observacionesMedicas?: string;
  centroAsistencial?: string;
  medicoNombre?: string;
  medicoTelefono?: string;
  zonaResidencia?: string;
  direccion?: string;
  municipio?: string;
  departamento?: string;
  distanciaKM?: number;
  medioTransporte?: string;
  encargadoTransporte?: string;
  encargadoTelefono?: string;
  nivel?: string;
  grado?: string;
  seccion?: string;
  fechaIngreso?: string;
  repiteGrado?: boolean;
  condicionado?: boolean;
  activo?: boolean;
  detalle?: DetalleAlumno;
  responsables?: ResponsableRelacion[];
  createdAt?: string;
  updatedAt?: string;
}

// src/types/index.ts

// 1. Interfaz para Administrativo (sin 'modalidad')
export interface Administrativo {
  id_administrativo: number;
  nombre: string;
  apellido: string;
  email: string;
  direccion: string;
  dui: string;
  telefono: string;
  activo: boolean;
  createdAt: string;
  cargoAdministrativo: {
    id_cargo_administrativo: number;
    nombre: string;
  };
}

// 2. NUEVA Interfaz para Orientador
export interface Orientador {
  id_orientador: number;
  nombre: string;
  apellido: string;
  email: string;
  direccion: string;
  dui: string;
  telefono: string;
  activo: boolean;
  createdAt: string;
  cargoAdministrativo: {
    id_cargo_administrativo: number;
    nombre: string;
  };
}

// 3. Tipo Unificado para usar en el estado del componente
//    Tendrá todas las propiedades comunes + un 'id' normalizado y un 'type'.
export type AppUser = (Administrativo | Orientador) & {
  id: number; // ID normalizado (sea de admin u orientador)
  type: 'administrativo' | 'orientador'; // Para saber a qué endpoint llamar
};

// 4. La interfaz para la respuesta paginada no cambia
export interface PagedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}