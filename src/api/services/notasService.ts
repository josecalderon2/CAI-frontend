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

// ============================================
// NUEVO DTO PARA SISTEMA BASICA 2025
// ============================================

/**
 * DTO para guardar una nota individual de BASICA 2025
 * Se llama una vez por cada actividad/examen
 */
export interface GuardarNotaBasicaDto {
  id_asignatura: number;
  id_alumno: number;
  tipo_actividad: string; // Nombre exacto del componente (ej: "Tareas (Mensual)")
  id_tipo_actividad?: number; // ID del tipo de actividad (opcional, se puede inferir del nombre)
  nota: number; // 0-10
  mes: number; // 1-12
  anio: number; // 2025
  periodo: number; // 1, 2, 3 (trimestre)
  numero_actividad?: number; // Número de la actividad (para tareas múltiples)
}

const base = '/sistema-evaluacion';

export const notasService = {
  /**
   * ✅ MÉTODO RECOMENDADO PARA FRONTEND: Crear o actualizar una nota mensual
   *
   * Este método usa POST con lógica UPSERT en el backend:
   * - Si la nota NO existe: la crea
   * - Si la nota existe: la actualiza
   *
   * Ventajas:
   * - Un solo endpoint para crear y actualizar
   * - El frontend no necesita verificar si existe la nota
   * - Menos propenso a errores
   * - Idempotente (llamar múltiples veces produce el mismo resultado)
   * - Mejor UX (el usuario solo "guarda")
   *
   * Usa el endpoint: POST /sistema-evaluacion/notas/simplificadas
   *
   * @param dto - Datos de la nota a crear/actualizar
   * @returns La nota mensual con todos los cálculos realizados por el backend
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

  // ============================================
  // MÉTODOS PARA NUEVO SISTEMA BASICA 2025
  // ============================================

  /**
   * ✅ GUARDAR NOTA INDIVIDUAL (BASICA 2025)
   *
   * Se debe llamar UNA VEZ por cada actividad/examen
   * Ejemplo: Si el alumno tiene 5 tareas, llamar 5 veces con diferentes notas
   *
   * POST /sistema-evaluacion/notas/simplificadas
   */
  async guardarNotaBasica2025(dto: GuardarNotaBasicaDto): Promise<any> {
    // Construir el payload en el formato que el backend espera
    const payload: any = {
      id_alumno: dto.id_alumno,
      id_asignatura: dto.id_asignatura,
      mes_numerico: dto.mes,
      anio: dto.anio,
      actividades: [
        {
          id_tipo_actividad: dto.id_tipo_actividad || 1, // TODO: Obtener del backend
          numero_actividad: dto.numero_actividad || null,
          nota: dto.nota,
        },
      ],
    };

    const res = await api.post(`${base}/notas/simplificadas`, payload);
    return res.data;
  },

  /**
   * CONSULTAR NOTAS GUARDADAS (BASICA 2025)
   *
   * Obtiene todas las notas guardadas para un alumno en un mes específico
   * GET /sistema-evaluacion/notas/simplificadas?alumno_id=X&mes=Y&anio=Z
   */
  async consultarNotasBasica2025(params: {
    alumno_id: number;
    mes: number; // 1-12
    anio: number; // 2025
  }): Promise<NotaBasica2025Response[]> {
    const res = await api.get(`${base}/notas/simplificadas`, {
      params,
    });
    return res.data as NotaBasica2025Response[];
  },

  /**
   * VER CONSOLIDADO MENSUAL (Todas las asignaturas de un alumno)
   *
   * GET /sistema-evaluacion/consolidado-mensual-alumno/:alumno_id?mes=X&anio=Y
   */
  async obtenerConsolidadoMensualAlumno(
    alumno_id: number,
    mes: number,
    anio: number
  ): Promise<ConsolidadoMensualResponse> {
    const res = await api.get(
      `${base}/consolidado-mensual-alumno/${alumno_id}`,
      {
        params: { mes, anio },
      }
    );
    return res.data as ConsolidadoMensualResponse;
  },

  /**
   * ACTUALIZAR NOTA EXISTENTE
   *
   * PATCH /sistema-evaluacion/notas/simplificadas/:id
   */
  async actualizarNotaBasica2025(id_nota: number, nota: number): Promise<any> {
    const res = await api.patch(`${base}/notas/simplificadas/${id_nota}`, {
      nota,
    });
    return res.data;
  },
};

// ============================================
// INTERFACES PARA NUEVO SISTEMA BASICA 2025
// ============================================

export interface ComponenteEvaluacionBasica {
  id?: number; // ID del tipo de actividad (opcional, viene del backend)
  nombre: string;
  porcentaje: number;
  tipo: 'ACTIVIDAD' | 'EXAMEN';
  periodo: 'MENSUAL' | 'TRIMESTRAL';
}

export interface FormatoEvaluacionBasicaResponse {
  nivel: 'BASICA';
  asignatura: {
    id: number;
    nombre: string;
    curso: string;
  };
  componentes: ComponenteEvaluacionBasica[];
}

// ============================================
// INTERFACES PARA SISTEMA BACHILLERATO
// ============================================

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

// ============================================
// INTERFACE UNIFICADA (SOPORTA AMBOS SISTEMAS)
// ============================================

export interface FormatoEvaluacionResponse {
  nivel: 'BASICA' | 'BACHILLERATO';

  // Datos de la asignatura
  asignatura?: {
    id: number;
    nombre: string;
    curso: string;
  };
  // Backward compatibility
  id_asignatura?: number;
  nombre_asignatura?: string;
  id_sistema_evaluacion?: number;
  nombre_sistema?: string;

  // Para BASICA 2025 (NUEVO)
  componentes?: ComponenteEvaluacionBasica[];

  // Para BASICA (ANTIGUO - deprecated)
  actividades?: TipoActividad[];
  porcentaje_actividades?: number; // 70%
  porcentaje_examen?: number; // 30%

  // Para BACHILLERATO
  componentes_bachillerato?: ComponenteEvaluacion[];
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

// ============================================
// INTERFACES PARA RESPUESTAS BASICA 2025
// ============================================

export interface NotaBasica2025Response {
  id_nota: number;
  asignatura_id: number;
  alumno_id: number;
  tipo_actividad: string;
  notas: number[]; // Array de notas guardadas
  promedio: number;
  mes: number;
  anio: number;
  periodo: number;
}

export interface ComponenteMensualConsolidado {
  promedio: number;
  aporte: number;
}

export interface ConsolidadoMensualAsignatura {
  asignatura_id: number;
  nombre: string;
  componentes_mensuales: {
    tareas?: ComponenteMensualConsolidado;
    revision?: ComponenteMensualConsolidado;
    laboratorio?: ComponenteMensualConsolidado;
    subtotal_mensual: number;
  };
  nota_mensual: number;
}

export interface ConsolidadoMensualResponse {
  alumno_id: number;
  mes: number;
  anio: number;
  asignaturas: ConsolidadoMensualAsignatura[];
}
