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
  mes: number;
  trimestre: number;
  anio_academico: string;
  actividades: ActividadDetalleResponse[];
  examen_mensual?: number | null;
  promedio_puro_actividades?: number;
  promedio_70_actividades?: number;
  promedio_30_examen?: number;
  nota_mensual?: number;
  porcentaje_aporte_trimestre?: number;
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

// Función auxiliar para convertir mes numérico a nombre
const convertirMesANombre = (mes: number): string => {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return meses[mes - 1];
};

// Función auxiliar para calcular trimestre según mes
const calcularTrimestre = (mes: number): number => {
  if (mes >= 2 && mes <= 4) return 1;  // Febrero, Marzo, Abril
  if (mes >= 5 && mes <= 7) return 2;  // Mayo, Junio, Julio
  if (mes >= 8 && mes <= 10) return 3; // Agosto, Septiembre, Octubre
  return 4; // Noviembre (solo para Bachillerato)
};

export const notasService = {
  /**
   * Crear o actualizar una nota mensual
   * Usa el endpoint POST /sistema-evaluacion/nota-mensual
   */
  async crearNotaSimplificada(dto: CreateNotaSimplificadaDto): Promise<NotaMensualResponse> {
    // Convertir a formato que espera el backend
    const payload: CalcularNotaMensualDto = {
      id_alumno: dto.id_alumno,
      id_asignatura: dto.id_asignatura,
      mes: convertirMesANombre(dto.mes),
      trimestre: calcularTrimestre(dto.mes),
      anio_academico: dto.anio.toString(),
      actividades: dto.actividades,
      examen_mensual: dto.examen_mensual,
      examen_parcial: dto.examen_parcial,
    };
    
    // Endpoint correcto según el controlador
    const res = await api.post(`${base}/nota-mensual`, payload);
    return res.data as NotaMensualResponse;
  },

  /**
   * Consultar notas mensuales con filtros
   * Usa el endpoint GET /sistema-evaluacion/notas-mensuales/:id_alumno/:id_asignatura
   */
  async consultarNotasSimplificadas(params: {
    id_alumno?: number;
    id_asignatura?: number;
    mes?: number; // 1-12
    anio?: number; // 2025
  }): Promise<NotaMensualResponse[]> {
    if (!params.id_alumno || !params.id_asignatura) {
      throw new Error('id_alumno e id_asignatura son requeridos');
    }

    // Convertir parámetros al formato del backend
    const mesNombre = params.mes ? convertirMesANombre(params.mes) : undefined;
    const trimestre = params.mes ? calcularTrimestre(params.mes) : undefined;
    
    const queryParams: any = {};
    if (trimestre) queryParams.trimestre = trimestre;
    if (params.anio !== undefined) queryParams.anio_academico = params.anio.toString();
    
    // Endpoint correcto según el controlador: GET notas-mensuales/:id_alumno/:id_asignatura
    const res = await api.get(
      `${base}/notas-mensuales/${params.id_alumno}/${params.id_asignatura}`,
      { params: queryParams }
    );
    
    // Filtrar por mes específico si se proporciona
    let notas = res.data as NotaMensualResponse[];
    if (mesNombre && notas.length > 0) {
      notas = notas.filter((nota: any) => nota.mes === mesNombre);
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
   */
  async obtenerFormatoEvaluacion(id_asignatura: number): Promise<any> {
    const res = await api.get(`${base}/formato-evaluacion/asignatura/${id_asignatura}`);
    return res.data;
  },

  /**
   * Obtener tipos de actividad por asignatura
   */
  async obtenerTiposActividad(id_asignatura: number): Promise<any[]> {
    const res = await api.get(`${base}/tipos-actividad/asignatura/${id_asignatura}`);
    return res.data as any[];
  },
};
