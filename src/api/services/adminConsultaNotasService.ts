import { api } from '../axiosConfig';

// ==================== TIPOS ====================

export interface Alumno {
  id: number;
  nombre: string;
  apellido: string;
  nombreCompleto?: string;
}

export interface Asignatura {
  id: number;
  nombre: string;
  tipo?: string;
}

export interface Curso {
  id: number;
  nombre: string;
  seccion: string;
  grado?: string;
}

export interface NotaAlumno {
  alumnoId: number;
  calificacion: number | null;
  fechaRegistro: string | null;
}

export interface Evaluacion {
  id_evaluacion: number;
  nombre: string;
  tipo: string;
  porcentaje: number;
  puntajeMaximo: number;
  periodo: number;
  trimestre: number;
  mes: number;
  notas: NotaAlumno[];
}

export interface AsignaturaConEvaluaciones {
  asignatura: Asignatura;
  evaluaciones: Evaluacion[];
}

export interface EvaluacionesCursoResponse {
  curso: Curso;
  anioAcademico: string;
  alumnos: Alumno[];
  asignaturas: AsignaturaConEvaluaciones[];
}

export interface CalificacionAlumno {
  alumno: Alumno;
  calificacion: number | null;
  fechaRegistro: string | null;
  aprobado: boolean | null;
}

export interface EstadisticasEvaluacion {
  totalAlumnos: number;
  alumnosCalificados: number;
  alumnosPendientes: number;
  promedioGrupo: number | null;
  notaMaxima: number | null;
  notaMinima: number | null;
  aprobados: number;
  reprobados: number;
  porcentajeAprobacion: number | null;
}

export interface EvaluacionDetalle {
  id: number;
  nombre: string;
  tipo: string;
  porcentaje: number;
  puntajeMaximo: number;
  puntajeMinimo: number;
  periodo: number;
  trimestre: number;
  mes: number;
}

export interface CalificacionesEvaluacionResponse {
  evaluacion: EvaluacionDetalle;
  asignatura: Asignatura;
  curso: Curso;
  calificaciones: CalificacionAlumno[];
  estadisticas: EstadisticasEvaluacion;
}

export interface PromedioAsignatura {
  nombre: string;
  promedio: number;
  aprobado: boolean;
}

export interface PromedioGeneralAlumno {
  promedio: number;
  estado: string;
  aprobadoTodas: boolean;
  asignaturasReprobadas: number;
  calificacionesCerradas: boolean;
}

export interface AlumnoConPromedios {
  alumno: Alumno;
  promedioGeneral: PromedioGeneralAlumno | null;
  asignaturas: PromedioAsignatura[];
}

export interface PromediosCursoResponse {
  curso: Curso;
  anioAcademico: string;
  alumnos: AlumnoConPromedios[];
}

// ==================== SERVICIO ====================

const base = '/admin-consulta-notas';

export const adminConsultaNotasService = {
  /**
   * Obtiene todas las evaluaciones de un curso con sus calificaciones
   */
  async obtenerEvaluacionesCurso(
    cursoId: number,
    anioAcademico: string,
    asignaturaId?: number
  ): Promise<EvaluacionesCursoResponse> {
    try {
      const params: any = {
        cursoId,
        anioAcademico,
      };

      if (asignaturaId) {
        params.asignaturaId = asignaturaId;
      }

      const res = await api.get<EvaluacionesCursoResponse>(
        `${base}/curso/evaluaciones`,
        { params }
      );
      return res.data;
    } catch (error: any) {
      console.error('Error al obtener evaluaciones del curso:', error);
      if (error.response?.status === 403) {
        throw new Error(
          'No tienes permisos para acceder a esta información. Solo usuarios Admin y Personal Administrativo pueden consultar evaluaciones.'
        );
      }
      throw new Error(
        error.response?.data?.message ||
          'Error al cargar evaluaciones del curso'
      );
    }
  },

  /**
   * Obtiene las calificaciones de una evaluación específica
   */
  async obtenerCalificacionesEvaluacion(
    evaluacionId: number,
    anioAcademico: string
  ): Promise<CalificacionesEvaluacionResponse> {
    try {
      const res = await api.get<CalificacionesEvaluacionResponse>(
        `${base}/evaluacion/calificaciones`,
        {
          params: {
            evaluacionId,
            anioAcademico,
          },
        }
      );
      return res.data;
    } catch (error: any) {
      console.error('Error al obtener calificaciones de la evaluación:', error);
      if (error.response?.status === 403) {
        throw new Error(
          'No tienes permisos para acceder a esta información. Solo usuarios Admin y Personal Administrativo pueden consultar evaluaciones.'
        );
      }
      throw new Error(
        error.response?.data?.message ||
          'Error al cargar calificaciones de la evaluación'
      );
    }
  },

  /**
   * Obtiene el resumen de promedios de un curso
   */
  async obtenerPromediosCurso(
    cursoId: number,
    anioAcademico: string
  ): Promise<PromediosCursoResponse> {
    try {
      const res = await api.get<PromediosCursoResponse>(
        `${base}/curso/promedios`,
        {
          params: {
            cursoId,
            anioAcademico,
          },
        }
      );
      return res.data;
    } catch (error: any) {
      console.error('Error al obtener promedios del curso:', error);
      if (error.response?.status === 403) {
        throw new Error(
          'No tienes permisos para acceder a esta información. Solo usuarios Admin y Personal Administrativo pueden consultar evaluaciones.'
        );
      }
      throw new Error(
        error.response?.data?.message || 'Error al cargar promedios del curso'
      );
    }
  },
};
