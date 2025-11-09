import { api } from '../axiosConfig';

// Interfaces para actividades de evaluación
export interface ActividadEvaluacion {
  id_tipo_actividad: number;
  numero_actividad?: number;
  nota: number;
}

export interface ActividadDetalleResponse {
  id_tipo_actividad: number;
  tipo_actividad_nombre: string;
  numero_actividad?: number;
  nombre_completo: string;
  nota: number;
}

// Interfaces para notas mensuales (SISTEMA NUEVO)
export interface NotaMensual {
  id_nota_mensual?: number;
  id_alumno: number;
  id_asignatura: number;
  mes_numerico?: number; // Mes como número (1-12)
  mes_nombre?: string; // Mes como texto ("Enero", "Febrero", etc.)
  mes?: number | string; // Compatibilidad con ambos formatos
  trimestre?: number;
  anio?: number; // Año numérico (2025)
  anio_academico?: string; // Año como string "2025"
  actividades: ActividadDetalleResponse[];
  examen_mensual?: number | null;
  examen_parcial?: number | null;
  promedio_puro_actividades?: number;
  promedio_70_actividades?: number;
  promedio_30_examen?: number;
  nota_mensual?: number;
  porcentaje_aporte_trimestre?: number;
  porcentaje_aporte?: number; // Alias alternativo
  aporte_al_trimestre?: number;
  fecha_registro?: string;
}

export interface NotaMensualResponse extends NotaMensual {
  alumno?: {
    id_alumno: number;
    nombre: string;
    apellido: string;
  };
  asignatura?: {
    id_asignatura: number;
    nombre: string;
  };
}

// DTO para crear/actualizar notas con el NUEVO sistema de evaluación
export interface CalcularNotaMensualDto {
  id_alumno: number;
  id_asignatura: number;
  mes: string; // "Febrero", "Marzo", etc.
  trimestre: number; // 1, 2, 3
  anio_academico: string; // "2025"
  actividades: ActividadEvaluacion[];
  examen_mensual?: number;
  examen_parcial?: number; // Para bachillerato
}

// DTO simplificado (usa mes numérico y año numérico)
export interface CreateNotaSimplificadaDto {
  id_alumno: number;
  id_asignatura: number;
  mes: number; // 1-12
  anio: number; // 2025
  actividades: ActividadEvaluacion[];
  examen_mensual?: number;
  examen_parcial?: number;
}

const base = '/sistema-evaluacion';

export const notasService = {
  /**
   * Crear o actualizar una nota mensual
   * Usa el endpoint POST /sistema-evaluacion/notas/simplificadas
   */
  async crearNotaSimplificada(
    dto: CreateNotaSimplificadaDto
  ): Promise<NotaMensualResponse> {
    // Formato exacto que el backend espera
    const payload: any = {
      id_alumno: dto.id_alumno,
      id_asignatura: dto.id_asignatura,
      mes_numerico: dto.mes, // numérico 1-12
      anio: dto.anio, // numérico 2025
      actividades: dto.actividades.map((act) => ({
        id_tipo_actividad: act.id_tipo_actividad,
        numero_actividad: act.numero_actividad ?? null,
        nota: act.nota,
      })),
    };

    // Agregar exámenes solo si tienen valor
    if (dto.examen_mensual !== undefined) {
      payload.examen_mensual = dto.examen_mensual;
    }
    if (dto.examen_parcial !== undefined) {
      payload.examen_parcial = dto.examen_parcial;
    }

    // Endpoint simplificado
    const res = await api.post(`${base}/notas/simplificadas`, payload);
    return res.data as NotaMensualResponse;
  },

  /**
   * Consultar notas mensuales con filtros
   * Usa el endpoint GET /sistema-evaluacion/notas/simplificadas con query params
   * 
   * Ejemplos de uso:
   * - Un alumno, una asignatura, un mes: { id_alumno: 1, id_asignatura: 1, mes: 11, anio: 2025 }
   * - Un alumno, una asignatura, todos los meses: { id_alumno: 1, id_asignatura: 1, anio: 2025 }
   * - Todos los alumnos, una asignatura, un mes: { id_asignatura: 1, mes: 11, anio: 2025 }
   */
  async consultarNotasSimplificadas(params: {
    id_alumno?: number;
    id_asignatura?: number;
    mes?: number; // 1-12
    anio?: number; // 2025
  }): Promise<NotaMensualResponse[]> {
    // Validar que al menos id_asignatura esté presente
    if (!params.id_asignatura) {
      throw new Error('id_asignatura es requerido');
    }

    const queryParams: any = {
      id_asignatura: params.id_asignatura,
    };

    // Agregar parámetros opcionales
    if (params.id_alumno !== undefined) {
      queryParams.id_alumno = params.id_alumno;
    }
    if (params.anio !== undefined) {
      queryParams.anio = params.anio;
    }
    if (params.mes !== undefined) {
      queryParams.mes = params.mes;
    }

    // Endpoint con query params según backend consultarNotasSimplificadas
    let notas: NotaMensualResponse[] = [];
    try {
      const res = await api.get(`${base}/notas/simplificadas`, {
        params: queryParams,
      });
      notas = res.data as NotaMensualResponse[];
    } catch (err: any) {
      // Si el backend responde 404 (no hay notas para esa combinación), tratamos como lista vacía
      if (err?.response?.status === 404) {
        return [];
      }
      throw err; // otros códigos se propagan
    }

    return notas;
  },

  /**
   * Obtener una nota mensual específica por alumno, asignatura, mes y año
   */
  async obtenerNotaSimplificadaPorId(
    id_alumno: number,
    id_asignatura: number,
    mes: number,
    anio: number
  ): Promise<NotaMensualResponse | null> {
    const notas = await this.consultarNotasSimplificadas({
      id_alumno,
      id_asignatura,
      mes,
      anio,
    });
    return notas.length > 0 ? notas[0] : null;
  },

  /**
   * Obtener el formato de evaluación para una asignatura
   * Esto indica qué actividades se deben mostrar en el formulario
   * Retorna diferentes formatos según el nivel educativo (BASICA o BACHILLERATO)
   */
  async obtenerFormatoEvaluacion(
    id_asignatura: number
  ): Promise<FormatoEvaluacionResponse> {
    const res = await api.get(
      `${base}/formato-evaluacion/asignatura/${id_asignatura}`
    );
    return res.data as FormatoEvaluacionResponse;
  },

  /**
   * Obtener tipos de actividad por asignatura
   */
  async obtenerTiposActividad(id_asignatura: number): Promise<any[]> {
    const res = await api.get(
      `${base}/tipos-actividad/asignatura/${id_asignatura}`
    );
    return res.data as any[];
  },

  /**
   * Obtener catálogo de tipos de actividad por asignatura
   * Endpoint recomendado para mostrar las evaluaciones disponibles
   * GET /sistema-evaluacion/catalogo/tipos-actividad?id_asignatura=X
   */
  async obtenerCatalogoTiposActividad(
    id_asignatura: number
  ): Promise<CatalogoTipoActividadResponse[]> {
    const res = await api.get(`${base}/catalogo/tipos-actividad`, {
      params: { id_asignatura },
    });
    return res.data as CatalogoTipoActividadResponse[];
  },
};

// Interfaces para el formato de evaluación
export interface TipoActividad {
  id_tipo_actividad: number;
  nombre: string;
  numero_actividad?: number;
  porcentaje?: number;
}

export interface ComponenteEvaluacion {
  nombre: string;
  porcentaje: number;
  actividades: TipoActividad[];
}

export interface FormatoEvaluacionResponse {
  nivel: 'BASICA' | 'BACHILLERATO';
  id_asignatura: number;
  nombre_asignatura: string;
  id_sistema_evaluacion: number;
  nombre_sistema: string;

  // Para BASICA
  actividades?: TipoActividad[];
  porcentaje_actividades?: number; // 70%
  porcentaje_examen?: number; // 30%

  // Para BACHILLERATO
  componentes?: ComponenteEvaluacion[];
  incluye_examen_parcial?: boolean;
  incluye_examen_periodo?: boolean;
}

// Interfaces para el catálogo de tipos de actividad
export interface CatalogoTipoActividadResponse {
  id_tipo_actividad: number;
  nombre: string;
  categoria?: string | null;
  peso?: number | null;
  activo: boolean;
  orden: number;
  nivel_educativo: 'BASICA' | 'BACHILLERATO';
  permite_multiples_instancias: boolean;
  descripcion?: string;
}
