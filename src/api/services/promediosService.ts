import { api } from '../axiosConfig';

// DTOs basados en el backend
export interface EvaluacionPendienteItem {
  tipoEvaluacion: string;
  periodo?: number;
  trimestre?: number;
  mes?: number;
}

export interface AlumnoSinCalificarDto {
  id_alumno: number;
  nombreCompleto: string;
  // Soporta tanto strings simples como objetos con periodo/trimestre/mes
  evaluacionesPendientes: Array<string | EvaluacionPendienteItem>;
  motivo?: string;
}

export interface EvaluacionFaltanteDto {
  tipoEvaluacion: string;
  esperadas: number;
  creadas: number;
}

export interface AdvertenciaCierreDto {
  tipo:
    | 'EVALUACIONES_FALTANTES'
    | 'ALUMNOS_SIN_CALIFICAR'
    | 'SIN_PROMEDIOS_CALCULADOS';
  mensaje: string;
  evaluacionesFaltantes?: EvaluacionFaltanteDto[];
  alumnosSinCalificar?: AlumnoSinCalificarDto[];
}

export interface EstadisticasCierreDto {
  totalAlumnos: number;
  alumnosConTodasLasNotas: number;
  alumnosSinNotas: number;
  totalEvaluacionesEsperadas: number;
  evaluacionesCreadas: number;
  totalCalificacionesRegistradas: number;
  totalCalificacionesEsperadas: number;
}

export interface VerificacionCierreResponseDto {
  puedesCerrar: boolean;
  advertencias: AdvertenciaCierreDto[];
  estadisticas: EstadisticasCierreDto;
  mensaje: string;
}

export interface CerrarCursoResponseDto {
  mensaje: string;
  totalAlumnos: number;
  alumnosCerrados: number;
  alumnosConError: number;
  advertencias: AdvertenciaCierreDto[];
  errores?: Array<{
    alumnoId: number;
    error: string;
  }>;
}

const base = '/promedios';

export const promediosService = {
  /**
   * Verificar el estado de las calificaciones de UNA ASIGNATURA antes de cerrar
   */
  async verificarEstadoParaCierreAsignatura(
    asignaturaId: number,
    anioAcademico: string,
    trimestre?: number,
    periodo?: number
  ): Promise<VerificacionCierreResponseDto> {
    const params = new URLSearchParams({
      asignaturaId: asignaturaId.toString(),
      anioAcademico,
    });

    if (trimestre !== undefined && trimestre !== null) {
      params.append('trimestre', trimestre.toString());
    }

    if (periodo !== undefined && periodo !== null) {
      params.append('periodo', periodo.toString());
    }

    const res = await api.get<VerificacionCierreResponseDto>(
      `${base}/verificar-cierre-asignatura?${params.toString()}`
    );
    return res.data;
  },

  /**
   * Cerrar calificaciones de UNA ASIGNATURA específica
   */
  async cerrarCalificacionesAsignatura(
    asignaturaId: number,
    anioAcademico: string,
    trimestre?: number,
    periodo?: number,
    forzar: boolean = false
  ): Promise<CerrarCursoResponseDto> {
    const params = new URLSearchParams({
      asignaturaId: asignaturaId.toString(),
      anioAcademico,
      forzar: forzar.toString(),
    });

    if (trimestre !== undefined && trimestre !== null) {
      params.append('trimestre', trimestre.toString());
    }

    if (periodo !== undefined && periodo !== null) {
      params.append('periodo', periodo.toString());
    }

    const res = await api.post<CerrarCursoResponseDto>(
      `${base}/cerrar-asignatura?${params.toString()}`
    );
    return res.data;
  },

  /**
   * Verificar el estado de las calificaciones antes de cerrar (TODO EL CURSO)
   */
  async verificarEstadoParaCierre(
    cursoId: number,
    anioAcademico: string,
    trimestre?: number,
    periodo?: number
  ): Promise<VerificacionCierreResponseDto> {
    const params = new URLSearchParams({
      cursoId: cursoId.toString(),
      anioAcademico,
    });

    if (trimestre !== undefined) {
      params.append('trimestre', trimestre.toString());
    }

    if (periodo !== undefined) {
      params.append('periodo', periodo.toString());
    }

    const res = await api.get<VerificacionCierreResponseDto>(
      `${base}/verificar-cierre?${params.toString()}`
    );
    return res.data;
  },

  /**
   * Cerrar calificaciones de un alumno individual
   */
  async cerrarCalificaciones(
    alumnoId: number,
    cursoId: number,
    anioAcademico: string,
    forzar: boolean = false
  ): Promise<any> {
    const params = new URLSearchParams({
      cursoId: cursoId.toString(),
      anioAcademico,
      forzar: forzar.toString(),
    });

    const res = await api.post(
      `${base}/cerrar/${alumnoId}?${params.toString()}`
    );
    return res.data;
  },

  /**
   * Cerrar calificaciones de TODO un curso
   */
  async cerrarCalificacionesCurso(
    cursoId: number,
    anioAcademico: string,
    trimestre?: number,
    periodo?: number,
    forzar: boolean = false
  ): Promise<CerrarCursoResponseDto> {
    const params = new URLSearchParams({
      cursoId: cursoId.toString(),
      anioAcademico,
      forzar: forzar.toString(),
    });

    if (trimestre !== undefined) {
      params.append('trimestre', trimestre.toString());
    }

    if (periodo !== undefined) {
      params.append('periodo', periodo.toString());
    }

    const res = await api.post<CerrarCursoResponseDto>(
      `${base}/cerrar-curso?${params.toString()}`
    );
    return res.data;
  },
};
