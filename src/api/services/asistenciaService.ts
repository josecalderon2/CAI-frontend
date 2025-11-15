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
// ⚠️ Actualizado: DTO para Resumen Trimestral Consolidado (por curso, no por alumno)
export interface ResumenTrimestralConsolidadoDto {
  cursoId: number;
  anio?: number | string; // opcional, backend usa año actual por defecto
}

// ✅ Nuevas interfaces para el consolidado por trimestre
export type EstadoConsolidado = 'P' | 'E' | 'SP' | 'A';

export interface DetalleAlumnoTrimestre {
  id_alumno: number;
  nombre: string;
  apellido: string;
  P: number;
  E: number;
  SP: number;
  A: number;
  total_registros: number;
  porcentaje_asistencia: number;
}

export interface ResumenTrimestralItem {
  trimestre: 1 | 2 | 3;
  P: number;
  E: number;
  SP: number;
  A: number;
  total_registros: number;
  porcentaje_asistencia: number; // 2 decimales
  alumnos?: DetalleAlumnoTrimestre[]; // opcional: detalle por alumno
}

export interface ResumenTrimestralConsolidado {
  cursoId: number;
  anio: string;
  trimestres: ResumenTrimestralItem[];
  totales: Omit<ResumenTrimestralItem, 'trimestre'>;
}

// 🆕 Consolidado por Alumno (asistencia + conducta)
export interface ResumenTrimestralConsolidadoAlumnoDto {
  cursoId: number;
  alumnoId: number;
  anio?: number | string;
}

export interface ConductaTrimestreResumen {
  trimestre: 1 | 2 | 3;
  menos_graves: number;
  graves: number;
  muy_graves: number;
  puntos: number;
  detalles: InfraccionResumen[];
}

export interface ConductaTrimestresResumen {
  trimestres: ConductaTrimestreResumen[];
  totales: {
    menos_graves: number;
    graves: number;
    muy_graves: number;
    puntos: number;
    total_infracciones: number;
  };
}

export interface ResumenTrimestralConsolidadoAlumno {
  cursoId: number;
  alumnoId: number;
  anio: string;
  asistencia: {
    trimestres: ResumenTrimestralItem[];
    totales: Omit<ResumenTrimestralItem, 'trimestre'>;
  };
  conducta: ConductaTrimestresResumen;
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

  // 🆕 Obtener resumen trimestral consolidado (P/E/SP/A por trimestre)
  getResumenTrimestralConsolidado: async (
    params: ResumenTrimestralConsolidadoDto
  ): Promise<ResumenTrimestralConsolidado> => {
    const queryParams = new URLSearchParams({
      cursoId: params.cursoId.toString(),
      ...(params.anio ? { anio: params.anio.toString() } : {}),
    });

    const response = await api.get<any>(
      `/asistencia/resumen/trimestral-consolidado?${queryParams.toString()}`
    );

    const data = response.data;

    const trimestres = (data.trimestres ?? []).map((t: any) => {
      const P = Number(t.P ?? 0);
      const E = Number(t.E ?? 0);
      const SP = Number(t.SP ?? 0);
      const A = Number(t.A ?? 0);
      const total = Number(t.total_registros ?? P + E + SP + A);
      const pct = Number(
        (t.porcentaje_asistencia ?? ((P + E) / (total || 1)) * 100).toFixed(2)
      );
      const alumnos: DetalleAlumnoTrimestre[] = (t.alumnos ?? []).map(
        (al: any) => ({
          id_alumno: Number(al.id_alumno),
          nombre: String(al.nombre ?? ''),
          apellido: String(al.apellido ?? ''),
          P: Number(al.P ?? 0),
          E: Number(al.E ?? 0),
          SP: Number(al.SP ?? 0),
          A: Number(al.A ?? 0),
          total_registros: Number(
            al.total_registros ??
              Number(al.P ?? 0) +
                Number(al.E ?? 0) +
                Number(al.SP ?? 0) +
                Number(al.A ?? 0)
          ),
          porcentaje_asistencia: Number(
            (
              al.porcentaje_asistencia ??
              ((Number(al.P ?? 0) + Number(al.E ?? 0)) /
                (Number(
                  al.total_registros ??
                    Number(al.P ?? 0) +
                      Number(al.E ?? 0) +
                      Number(al.SP ?? 0) +
                      Number(al.A ?? 0)
                ) || 1)) *
                100
            ).toFixed(2)
          ),
        })
      );
      return {
        trimestre: (t.trimestre as 1 | 2 | 3) ?? 1,
        P,
        E,
        SP,
        A,
        total_registros: total,
        porcentaje_asistencia: pct,
        alumnos,
      } as ResumenTrimestralItem;
    });

    const tot = data.totales ?? {};
    const Ptot = Number(tot.P ?? 0);
    const Etot = Number(tot.E ?? 0);
    const SPtot = Number(tot.SP ?? 0);
    const Atot = Number(tot.A ?? 0);
    const totalTot = Number(tot.total_registros ?? Ptot + Etot + SPtot + Atot);
    const pctTot = Number(
      (
        tot.porcentaje_asistencia ?? ((Ptot + Etot) / (totalTot || 1)) * 100
      ).toFixed(2)
    );

    const mapped: ResumenTrimestralConsolidado = {
      cursoId: Number(data.cursoId ?? params.cursoId),
      anio: String(data.anio ?? params.anio ?? ''),
      trimestres,
      totales: {
        P: Ptot,
        E: Etot,
        SP: SPtot,
        A: Atot,
        total_registros: totalTot,
        porcentaje_asistencia: pctTot,
      },
    };

    return mapped;
  },

  // 🆕 Consolidado por alumno (asistencia + conducta)
  getResumenTrimestralConsolidadoAlumno: async (
    params: ResumenTrimestralConsolidadoAlumnoDto
  ): Promise<ResumenTrimestralConsolidadoAlumno> => {
    const queryParams = new URLSearchParams({
      cursoId: params.cursoId.toString(),
      alumnoId: params.alumnoId.toString(),
      ...(params.anio ? { anio: params.anio.toString() } : {}),
    });

    const response = await api.get<any>(
      `/asistencia/resumen/trimestral-consolidado/alumno?${queryParams.toString()}`
    );

    const data = response.data ?? {};

    const mapTrimestres = (arr: any[]): ResumenTrimestralItem[] =>
      (arr ?? []).map((t: any) => {
        const P = Number(t.P ?? 0);
        const E = Number(t.E ?? 0);
        const SP = Number(t.SP ?? 0);
        const A = Number(t.A ?? 0);
        const total = Number(t.total_registros ?? P + E + SP + A);
        const pct = Number(
          (t.porcentaje_asistencia ?? ((P + E) / (total || 1)) * 100).toFixed(2)
        );
        return {
          trimestre: (t.trimestre as 1 | 2 | 3) ?? 1,
          P,
          E,
          SP,
          A,
          total_registros: total,
          porcentaje_asistencia: pct,
        } as ResumenTrimestralItem;
      });

    const asis = data.asistencia ?? {};
    const asisTrimestres = mapTrimestres(asis.trimestres ?? []);
    const asisTot = asis.totales ?? {};
    const asisMappedTot = {
      P: Number(asisTot.P ?? 0),
      E: Number(asisTot.E ?? 0),
      SP: Number(asisTot.SP ?? 0),
      A: Number(asisTot.A ?? 0),
      total_registros: Number(
        asisTot.total_registros ??
          Number(asisTot.P ?? 0) +
            Number(asisTot.E ?? 0) +
            Number(asisTot.SP ?? 0) +
            Number(asisTot.A ?? 0)
      ),
      porcentaje_asistencia: Number(
        (
          asisTot.porcentaje_asistencia ??
          ((Number(asisTot.P ?? 0) + Number(asisTot.E ?? 0)) /
            (Number(
              asisTot.total_registros ??
                Number(asisTot.P ?? 0) +
                  Number(asisTot.E ?? 0) +
                  Number(asisTot.SP ?? 0) +
                  Number(asisTot.A ?? 0)
            ) || 1)) *
            100
        ).toFixed(2)
      ),
    } as Omit<ResumenTrimestralItem, 'trimestre'>;

    const cond = data.conducta ?? {};
    const condTrimestres: ConductaTrimestreResumen[] = (
      cond.trimestres ?? []
    ).map((t: any) => ({
      trimestre: (t.trimestre as 1 | 2 | 3) ?? 1,
      menos_graves: Number(t.menos_graves ?? 0),
      graves: Number(t.graves ?? 0),
      muy_graves: Number(t.muy_graves ?? 0),
      puntos: Number(t.puntos ?? 0),
      detalles: (t.detalles ?? []).map((inf: any) => ({
        categoria: inf.categoria,
        articulo: inf.articulo,
        descripcion: inf.descripcion,
        puntos: Number(inf.puntos ?? 0),
        cantidad: Number(inf.cantidad ?? inf.conteo ?? 0),
      })) as InfraccionResumen[],
    }));
    const condTot = cond.totales ?? {};
    const condMappedTot = {
      menos_graves: Number(condTot.menos_graves ?? 0),
      graves: Number(condTot.graves ?? 0),
      muy_graves: Number(condTot.muy_graves ?? 0),
      puntos: Number(condTot.puntos ?? 0),
      total_infracciones: Number(condTot.total_infracciones ?? 0),
    };

    const mapped: ResumenTrimestralConsolidadoAlumno = {
      cursoId: Number(data.cursoId ?? params.cursoId),
      alumnoId: Number(data.alumnoId ?? params.alumnoId),
      anio: String(data.anio ?? params.anio ?? ''),
      asistencia: { trimestres: asisTrimestres, totales: asisMappedTot },
      conducta: { trimestres: condTrimestres, totales: condMappedTot },
    };

    return mapped;
  },
};
