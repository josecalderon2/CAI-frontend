import { api } from '../axiosConfig';

// ============================================
// TYPES - ASISTENCIA
// ============================================

// Enums que coinciden con el backend
export type EstadoAsistencia = 'P' | 'E' | 'SP' | 'A';
export type AccionAsistencia =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'BULK_IMPORT'
  | 'RECTIFY'
  | 'ROLLBACK';

// DTO para crear una asistencia individual
export interface CreateAsistenciaDto {
  id_alumno: number;
  id_asignatura: number;
  id_orientador: number;
  fecha: string;
  estado: EstadoAsistencia;
  anio_academico: string;
  trimestre: number;
  observacion?: string | null;
}

// DTO para crear asistencias en lote (bulk)
export interface BulkAsistenciaDto {
  registros: CreateAsistenciaDto[];
}

// DTO para actualizar asistencia
export interface UpdateAsistenciaDto {
  estado?: EstadoAsistencia;
  observacion?: string;
}

// Response de asistencia
export interface AsistenciaResponse {
  id_asistencia: string;
  id_alumno: string;
  id_asignatura: string;
  id_orientador: string;
  fecha: string;
  estado: EstadoAsistencia;
  anio_academico: string;
  observacion: string | null;
  creadoEn: string;
}

// Servicio de asistencia
export const asistenciaService = {
  createBulk: async (
    data: BulkAsistenciaDto
  ): Promise<AsistenciaResponse[]> => {
    const response = await api.post<AsistenciaResponse[]>(
      '/asistencia/bulk',
      data
    );
    return response.data;
  },

  getAll: async (): Promise<AsistenciaResponse[]> => {
    const response = await api.get<AsistenciaResponse[]>('/asistencia');
    return response.data;
  },

  getById: async (id: string): Promise<AsistenciaResponse> => {
    const response = await api.get<AsistenciaResponse>(`/asistencia/${id}`);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateAsistenciaDto
  ): Promise<AsistenciaResponse> => {
    const response = await api.patch<AsistenciaResponse>(
      `/asistencia/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/asistencia/${id}`);
  },
};

// ============================================
// TYPES - CONDUCTA E INFRACCIONES
// ============================================

export type CategoriaInfraccion = 'MENOS_GRAVE' | 'GRAVE' | 'MUY_GRAVE';

export interface CreateInfraccionCatalogoDto {
  categoria: CategoriaInfraccion;
  articulo: string;
  descripcion: string;
  puntos: number;
}

export interface UpdateInfraccionCatalogoDto {
  categoria?: CategoriaInfraccion;
  articulo?: string;
  descripcion?: string;
  puntos?: number;
}

export interface InfraccionCatalogoResponse {
  id_infraccion: string;
  categoria: CategoriaInfraccion;
  articulo: string;
  descripcion: string;
  puntos: number;
  creadoEn: string;
}

export interface CreateConductaDto {
  id_alumno: number;
  id_orientador: number;
  id_infraccion: string;
  fecha: string;
  anio_academico: string;
  observacion?: string;
}

export interface UpdateConductaDto {
  id_infraccion?: string;
  observacion?: string;
}

export interface ConductaResponse {
  id_conducta: string;
  id_alumno: string;
  id_orientador: string;
  id_infraccion: string;
  fecha: string;
  anio_academico: string;
  observacion: string | null;
  creadoEn: string;
  infraccion?: InfraccionCatalogoResponse;
}

// Servicio de conducta
export const conductaService = {
  createCatalogo: async (
    data: CreateInfraccionCatalogoDto
  ): Promise<InfraccionCatalogoResponse> => {
    const response = await api.post<InfraccionCatalogoResponse>(
      '/conducta/catalogo',
      data
    );
    return response.data;
  },

  getAllCatalogo: async (): Promise<InfraccionCatalogoResponse[]> => {
    const response =
      await api.get<InfraccionCatalogoResponse[]>('/conducta/catalogo');
    return response.data;
  },

  getCatalogoById: async (id: string): Promise<InfraccionCatalogoResponse> => {
    const response = await api.get<InfraccionCatalogoResponse>(
      `/conducta/catalogo/${id}`
    );
    return response.data;
  },

  updateCatalogo: async (
    id: string,
    data: UpdateInfraccionCatalogoDto
  ): Promise<InfraccionCatalogoResponse> => {
    const response = await api.patch<InfraccionCatalogoResponse>(
      `/conducta/catalogo/${id}`,
      data
    );
    return response.data;
  },

  deleteCatalogo: async (id: string): Promise<void> => {
    await api.delete(`/conducta/catalogo/${id}`);
  },

  create: async (data: CreateConductaDto): Promise<ConductaResponse> => {
    const response = await api.post<ConductaResponse>('/conducta', data);
    return response.data;
  },

  getAll: async (): Promise<ConductaResponse[]> => {
    const response = await api.get<ConductaResponse[]>('/conducta');
    return response.data;
  },

  getByAlumno: async (idAlumno: string): Promise<ConductaResponse[]> => {
    const response = await api.get<ConductaResponse[]>(
      `/conducta/alumno/${idAlumno}`
    );
    return response.data;
  },

  getById: async (id: string): Promise<ConductaResponse> => {
    const response = await api.get<ConductaResponse>(`/conducta/${id}`);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateConductaDto
  ): Promise<ConductaResponse> => {
    const response = await api.patch<ConductaResponse>(`/conducta/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/conducta/${id}`);
  },
};

// ============================================
// TYPES - RESÚMENES
// ============================================

export interface ResumenMensualDto {
  cursoId: number;
  mes: number;
  anio: number;
}

export interface InfraccionDetalle {
  categoria: CategoriaInfraccion;
  articulo: string;
  puntos: number;
  conteo: number;
}

export interface ResumenMensualResponse {
  id_alumno: number;
  nombre: string;
  apellido: string;
  justificadas: number; // Ausencias con permiso (E)
  injustificadas: number; // Ausencias sin permiso (SP)
  atrasos: number; // Llegadas tarde (A)
}

export interface ResumenTrimestralDto {
  cursoId: number;
  trimestre: number;
  anio: number;
}

export interface InfraccionResumen {
  categoria: CategoriaInfraccion;
  articulo: string;
  descripcion: string;
  puntos: number;
  cantidad: number;
}

export interface ResumenTrimestralResponse {
  id_alumno: number;
  nombre: string;
  apellido: string;
  justificadas: number; // Ausencias con permiso (E)
  injustificadas: number; // Ausencias sin permiso (SP)
  infracciones: InfraccionResumen[];
  puntajeConducta: number; // Calculado: 10 - (SP × 0.2) - (infracciones según categoría)
}

// Servicio de resúmenes
export const resumenService = {
  getResumenMensual: async (
    params: ResumenMensualDto
  ): Promise<ResumenMensualResponse[]> => {
    const response = await api.get<ResumenMensualResponse[]>(
      '/resumen/asistencia-mensual',
      { params }
    );
    return response.data;
  },

  getResumenTrimestral: async (
    params: ResumenTrimestralDto
  ): Promise<ResumenTrimestralResponse[]> => {
    const response = await api.get<ResumenTrimestralResponse[]>(
      '/resumen/trimestral',
      { params }
    );
    return response.data;
  },
};
