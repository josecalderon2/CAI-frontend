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
// ✅ ACTUALIZADO: id_asignatura ahora es OPCIONAL (asistencia por curso)
export interface CreateAsistenciaDto {
  id_alumno: number;
  id_asignatura?: number; // ✅ OPCIONAL - Ya no es necesario para asistencia por curso
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
  id_orientador?: number; // Para registrar quién hizo la modificación
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

  // 🆕 Buscar asistencias con filtros
  buscarConFiltros: async (
    params: BuscarAsistenciaParams
  ): Promise<AsistenciaConRelaciones[]> => {
    const queryParams = new URLSearchParams();

    if (params.cursoId)
      queryParams.append('cursoId', params.cursoId.toString());
    if (params.alumnoId)
      queryParams.append('alumnoId', params.alumnoId.toString());
    if (params.fecha) queryParams.append('fecha', params.fecha);
    if (params.fechaDesde) queryParams.append('fechaDesde', params.fechaDesde);
    if (params.fechaHasta) queryParams.append('fechaHasta', params.fechaHasta);
    if (params.estado) queryParams.append('estado', params.estado);

    const url = `/asistencia/buscar/filtros?${queryParams.toString()}`;
    console.log('🌐 DEBUG - Service llamando al endpoint:', {
      url,
      params,
    });

    const response = await api.get<AsistenciaConRelaciones[]>(url);

    console.log('📦 DEBUG - Service respuesta recibida:', {
      cantidad: response.data.length,
      data: response.data,
    });

    return response.data;
  },

  // 🆕 Obtener historial de un registro específico
  getHistorial: async (id: string): Promise<HistorialAsistenciaResponse[]> => {
    const response = await api.get<HistorialAsistenciaResponse[]>(
      `/asistencia/historial/${id}`
    );
    return response.data;
  },

  // 🆕 Obtener historial de cambios de un alumno
  getHistorialAlumno: async (
    idAlumno: string,
    fechaDesde?: string,
    fechaHasta?: string
  ): Promise<HistorialAsistenciaResponse[]> => {
    const queryParams = new URLSearchParams();
    if (fechaDesde) queryParams.append('fechaDesde', fechaDesde);
    if (fechaHasta) queryParams.append('fechaHasta', fechaHasta);

    const response = await api.get<HistorialAsistenciaResponse[]>(
      `/asistencia/historial/alumno/${idAlumno}?${queryParams.toString()}`
    );
    return response.data;
  },

  // 🆕 Verificar estado de asistencia de un alumno en una fecha específica
  verificarEstadoAlumno: async (
    idAlumno: number,
    fecha: string
  ): Promise<{
    id_asistencia: string;
    estado: EstadoAsistencia;
    observacion: string | null;
  } | null> => {
    try {
      const response = await api.get<{
        id_asistencia: string;
        estado: EstadoAsistencia;
        observacion: string | null;
      } | null>(`/asistencia/verificar/${idAlumno}/${fecha}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },
};

// ============================================
// NUEVOS TIPOS - HISTORIAL Y BÚSQUEDA
// ============================================

export interface BuscarAsistenciaParams {
  cursoId?: number;
  alumnoId?: number;
  fecha?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: EstadoAsistencia;
}

// ✅ ACTUALIZADO: asignatura ahora es OPCIONAL
export interface AsistenciaConRelaciones extends AsistenciaResponse {
  alumno: {
    nombre: string;
    apellido: string;
  };
  asignatura?: {
    // ✅ OPCIONAL - Puede ser null para asistencia por curso
    nombre: string;
  } | null;
  orientador: {
    nombre: string;
    apellido: string;
  };
}

// ✅ ACTUALIZADO: id_asignatura ahora es OPCIONAL en historial
export interface HistorialAsistenciaResponse {
  id_historial: number;
  id_asistencia: number | null;
  id_alumno: number;
  id_asignatura?: number | null; // ✅ OPCIONAL - Puede ser null para asistencia por curso
  fecha: string;
  accion: AccionAsistencia;
  id_orientador_registro: number;
  estado_anterior: EstadoAsistencia | null;
  estado_nuevo: EstadoAsistencia | null;
  observ_anterior: string | null;
  observ_nueva: string | null;
  creadoEn: string;
}

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
  trimestre: number; // ✅ AGREGADO: Necesario para filtrar en resumen trimestral (1, 2 o 3)
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
  trimestre?: number; // ✅ AGREGADO: Trimestre del registro (1, 2 o 3)
  observacion: string | null;
  creadoEn: string;
  infraccion?: InfraccionCatalogoResponse;
}

// Response de conducta con relaciones completas
export interface ConductaConRelaciones extends ConductaResponse {
  alumno: {
    nombre: string;
    apellido: string;
  };
  infraccion: InfraccionCatalogoResponse;
  orientador?: {
    nombre: string;
    apellido: string;
  };
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
  puntajeConducta?: number; // Calculado: 10 - (SP × 0.2) - (infracciones según categoría) | Opcional si backend no lo calcula
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
    console.log('🔧 [Service] Llamando al backend con params:', params);
    const response = await api.get<any>('/resumen/trimestral', { params });

    console.log('🔧 [Service] Respuesta raw del backend:', response.data);
    console.log(
      '🔧 [Service] Total de alumnos recibidos:',
      response.data.length
    );

    if (response.data.length > 0) {
      console.log('🔧 [Service] Primer alumno sin mapear:', response.data[0]);
      console.log(
        '🔧 [Service] Campos disponibles:',
        Object.keys(response.data[0])
      );
    }

    // Mapear los nombres de campos del backend (snake_case) al frontend (camelCase)
    const mapped = response.data.map((item: any) => {
      const alumno = {
        id_alumno: item.id_alumno,
        nombre: item.nombre,
        apellido: item.apellido,
        justificadas: item.total_justificadas ?? item.justificadas ?? 0,
        injustificadas: item.total_injustificadas ?? item.injustificadas ?? 0,
        // ✅ Mapear correctamente el array de infracciones
        infracciones: (item.infracciones ?? []).map((inf: any) => ({
          categoria: inf.categoria,
          articulo: inf.articulo,
          descripcion: inf.descripcion,
          puntos: inf.puntos,
          cantidad: inf.cantidad ?? inf.conteo ?? 1, // ⚠️ Probar con ambos nombres posibles
        })),
        puntajeConducta: item.puntuacion_conducta ?? item.puntajeConducta ?? 10,
      };

      console.log(`🔧 [Service] Alumno ${item.nombre} mapeado:`, alumno);
      return alumno;
    });

    console.log('🔧 [Service] Datos finales mapeados:', mapped);
    return mapped;
  },
};
