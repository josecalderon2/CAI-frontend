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

    // ✅ CORREGIDO: Ajustar fechas a zona horaria de El Salvador (UTC-6)
    // El Salvador está en UTC-6, entonces:
    // - Para buscar desde el inicio del día en El Salvador (00:00 SV), necesitamos 06:00 UTC
    // - Para buscar hasta el final del día en El Salvador (23:59 SV), necesitamos 05:59 UTC del día siguiente
    if (params.fecha) {
      queryParams.append('fecha', params.fecha);
    }
    if (params.fechaDesde) {
      // Inicio del día en El Salvador = 06:00 UTC del mismo día
      queryParams.append('fechaDesde', `${params.fechaDesde}T06:00:00.000Z`);
    }
    if (params.fechaHasta) {
      // Final del día en El Salvador = 05:59:59 UTC del día siguiente
      // Calcular el día siguiente
      const fechaHasta = new Date(params.fechaHasta + 'T00:00:00');
      fechaHasta.setDate(fechaHasta.getDate() + 1);
      const fechaHastaSiguiente = fechaHasta.toISOString().split('T')[0];
      queryParams.append('fechaHasta', `${fechaHastaSiguiente}T05:59:59.999Z`);
    }
    if (params.estado) queryParams.append('estado', params.estado);

    const url = `/asistencia/buscar/filtros?${queryParams.toString()}`;
    const response = await api.get<AsistenciaConRelaciones[]>(url);

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
  activo: boolean; // ✅ Campo para soft delete
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

// ✅ NUEVO: DTO para filtros de conducta (para endpoint de alumnos con infracciones)
export interface FiltrosConductaDto {
  id_curso?: number;
  anio_academico?: string;
  trimestre?: number;
}

// ✅ NUEVO: Response de alumnos con infracciones
export interface AlumnoConInfracciones {
  id_alumno: number;
  nombre: string;
  apellido: string;
  cursos: {
    id_curso: number;
    nombre: string;
    seccion: string;
    grado: string;
    anio_academico: string;
  }[];
  estadisticas: {
    total_infracciones: number;
    total_puntos: number;
    por_categoria: {
      MENOS_GRAVE?: {
        cantidad: number;
        puntos: number;
      };
      GRAVE?: {
        cantidad: number;
        puntos: number;
      };
      MUY_GRAVE?: {
        cantidad: number;
        puntos: number;
      };
    };
  };
  infracciones: {
    id_conducta: number;
    fecha: string;
    categoria: CategoriaInfraccion;
    articulo: string;
    descripcion: string;
    puntos: number;
    activo?: boolean; // ✅ Campo para detectar infracciones inactivas
    observacion: string | null;
    anio_academico: string;
    trimestre: number;
    orientador: {
      id_orientador: number;
      nombre: string;
      apellido: string;
    };
    asignatura: {
      id_asignatura: number;
      nombre: string;
    } | null;
  }[];
}

export interface AlumnosConInfraccionesResponse {
  filtros_aplicados: FiltrosConductaDto;
  total_alumnos: number;
  alumnos: AlumnoConInfracciones[];
}

// ✅ NUEVO: Response de años académicos disponibles
export interface AnioDisponible {
  anio_academico: string;
  trimestres_disponibles: number[];
  total_registros: number;
}

export interface AniosDisponiblesResponse {
  total_anios: number;
  anios: AnioDisponible[];
}

// 🆕 Interface para cursos con registros de conducta
export interface CursoConRegistrosResponse {
  id_curso: number;
  nombre: string;
  seccion: string;
  grado: string;
  nombre_completo: string;
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

  // 🆕 NUEVO: Obtener TODAS las infracciones (activas + inactivas)
  getAllCatalogoIncludingInactive: async (): Promise<
    InfraccionCatalogoResponse[]
  > => {
    const response = await api.get<InfraccionCatalogoResponse[]>(
      '/conducta/catalogo/all'
    );
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

  deleteCatalogo: async (id: string): Promise<InfraccionCatalogoResponse> => {
    const response = await api.delete<InfraccionCatalogoResponse>(
      `/conducta/catalogo/${id}`
    );
    return response.data;
  },

  // 🆕 NUEVO: Reactivar infracción desactivada
  restoreCatalogo: async (id: string): Promise<InfraccionCatalogoResponse> => {
    const response = await api.patch<InfraccionCatalogoResponse>(
      `/conducta/catalogo/${id}/restore`
    );
    return response.data;
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

  // 🆕 Obtener alumnos con infracciones (para administrador)
  getAlumnosConInfracciones: async (
    filtros?: FiltrosConductaDto
  ): Promise<AlumnosConInfraccionesResponse> => {
    const queryParams = new URLSearchParams();
    if (filtros?.id_curso)
      queryParams.append('id_curso', filtros.id_curso.toString());
    if (filtros?.anio_academico)
      queryParams.append('anio_academico', filtros.anio_academico);
    if (filtros?.trimestre)
      queryParams.append('trimestre', filtros.trimestre.toString());

    const url = `/conducta/alumnos-con-infracciones${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<AlumnosConInfraccionesResponse>(url);

    return response.data;
  },

  // 🆕 Obtener años académicos disponibles para filtros
  getAniosDisponibles: async (): Promise<AniosDisponiblesResponse> => {
    const response = await api.get<AniosDisponiblesResponse>(
      '/conducta/anios-disponibles'
    );
    return response.data;
  },

  // 🆕 Obtener cursos que tienen registros de conducta
  getCursosConInfracciones: async (): Promise<{
    total_cursos: number;
    cursos: CursoConRegistrosResponse[];
  }> => {
    const response = await api.get<{
      total_cursos: number;
      cursos: CursoConRegistrosResponse[];
    }>('/conducta/cursos-con-infracciones');
    return response.data;
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

export interface ResumenAnualDto {
  cursoId: number;
  anio: number;
}

export interface ResumenAnualResponse {
  id_alumno: number;
  nombre: string;
  apellido: string;
  justificadas: number; // Total de ausencias con permiso (E) en el año
  injustificadas: number; // Total de ausencias sin permiso (SP) en el año
  atrasos: number; // Total de llegadas tarde (A) en el año
}

// ✅ NUEVO: DTO para Resumen Trimestral Consolidado Anual
export interface ResumenTrimestralConsolidadoDto {
  cursoId: number;
  anio: number;
}

// ✅ NUEVO: Response de Resumen Trimestral Consolidado Anual
export interface ResumenTrimestralConsolidadoResponse {
  id_alumno: number;
  nombre: string;
  apellido: string;
  trimestre1: {
    justificadas: number;
    injustificadas: number;
    infracciones: InfraccionResumen[];
    puntajeConducta: number;
  };
  trimestre2: {
    justificadas: number;
    injustificadas: number;
    infracciones: InfraccionResumen[];
    puntajeConducta: number;
  };
  trimestre3: {
    justificadas: number;
    injustificadas: number;
    infracciones: InfraccionResumen[];
    puntajeConducta: number;
  };
  totales: {
    justificadas: number;
    injustificadas: number;
    totalInfracciones: number;
    promedioConducta: number;
  };
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
    const response = await api.get<any>('/resumen/trimestral', { params });

    // Mapear los nombres de campos del backend (snake_case) al frontend (camelCase)
    const mapped = response.data.map((item: any) => ({
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
    }));

    return mapped;
  },

  getResumenAnual: async (
    params: ResumenAnualDto
  ): Promise<ResumenAnualResponse[]> => {
    const response = await api.get<any>('/resumen/anual', { params });

    // Mapear los nombres de campos del backend (snake_case) al frontend (camelCase)
    const mapped = response.data.map((item: any) => ({
      id_alumno: item.id_alumno,
      nombre: item.nombre,
      apellido: item.apellido,
      justificadas: item.total_justificadas ?? item.justificadas ?? 0,
      injustificadas: item.total_injustificadas ?? item.injustificadas ?? 0,
      atrasos: item.total_atrasos ?? item.atrasos ?? 0,
    }));

    return mapped;
  },

  // 🆕 Obtener resumen trimestral consolidado anual
  getResumenTrimestralConsolidado: async (
    params: ResumenTrimestralConsolidadoDto
  ): Promise<ResumenTrimestralConsolidadoResponse[]> => {
    const queryParams = new URLSearchParams({
      cursoId: params.cursoId.toString(),
      anio: params.anio.toString(),
    });

    const response = await api.get<any>(
      `/asistencia/resumen/trimestral-consolidado?${queryParams.toString()}`
    );

    // Mapear los nombres de campos del backend (snake_case) al frontend (camelCase)
    const mapped = response.data.map((item: any) => ({
      id_alumno: item.id_alumno,
      nombre: item.nombre,
      apellido: item.apellido,
      trimestre1: {
        justificadas: item.trimestre1?.justificadas ?? 0,
        injustificadas: item.trimestre1?.injustificadas ?? 0,
        infracciones: (item.trimestre1?.infracciones ?? []).map((inf: any) => ({
          categoria: inf.categoria,
          articulo: inf.articulo,
          descripcion: inf.descripcion,
          puntos: inf.puntos,
          cantidad: inf.cantidad ?? inf.conteo ?? 0,
        })),
        puntajeConducta:
          item.trimestre1?.puntaje_conducta ??
          item.trimestre1?.puntajeConducta ??
          10,
      },
      trimestre2: {
        justificadas: item.trimestre2?.justificadas ?? 0,
        injustificadas: item.trimestre2?.injustificadas ?? 0,
        infracciones: (item.trimestre2?.infracciones ?? []).map((inf: any) => ({
          categoria: inf.categoria,
          articulo: inf.articulo,
          descripcion: inf.descripcion,
          puntos: inf.puntos,
          cantidad: inf.cantidad ?? inf.conteo ?? 0,
        })),
        puntajeConducta:
          item.trimestre2?.puntaje_conducta ??
          item.trimestre2?.puntajeConducta ??
          10,
      },
      trimestre3: {
        justificadas: item.trimestre3?.justificadas ?? 0,
        injustificadas: item.trimestre3?.injustificadas ?? 0,
        infracciones: (item.trimestre3?.infracciones ?? []).map((inf: any) => ({
          categoria: inf.categoria,
          articulo: inf.articulo,
          descripcion: inf.descripcion,
          puntos: inf.puntos,
          cantidad: inf.cantidad ?? inf.conteo ?? 0,
        })),
        puntajeConducta:
          item.trimestre3?.puntaje_conducta ??
          item.trimestre3?.puntajeConducta ??
          10,
      },
      totales: {
        justificadas: item.totales?.justificadas ?? 0,
        injustificadas: item.totales?.injustificadas ?? 0,
        totalInfracciones:
          item.totales?.total_infracciones ??
          item.totales?.totalInfracciones ??
          0,
        promedioConducta:
          item.totales?.promedio_conducta ??
          item.totales?.promedioConducta ??
          10,
      },
    }));

    return mapped;
  },
};
