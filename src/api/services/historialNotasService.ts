import { api } from '../axiosConfig';
import type {
  CursoHistorial,
  AlumnosPorCursoResponse,
  NotaHistorial,
} from '../../types/historial-notas.types';

// Servicio para Historial de Notas (Admin / Personal Académico)
// Usa api preconfigurada (incluye token vía interceptor)

export const historialNotasService = {
  /** Lista todos los cursos activos para llenar el primer dropdown */
  async getCursos(): Promise<CursoHistorial[]> {
    const res = await api.get('/cursos/all');
    return res.data as CursoHistorial[];
  },

  /** Obtiene alumnos de un curso específico por año académico */
  async getAlumnosPorCurso(
    cursoId: number,
    anio?: string
  ): Promise<AlumnosPorCursoResponse> {
    const anioFinal = anio || new Date().getFullYear().toString();
    const res = await api.get(`/cursos/${cursoId}/alumnos-por-anio`, {
      params: { anio: anioFinal },
    });
    return res.data as AlumnosPorCursoResponse;
  },

  /** Obtiene historial completo de notas del alumno */
  async getHistorialNotas(
    alumnoId: number,
    anio?: string
  ): Promise<NotaHistorial[]> {
    const params: any = {};
    if (anio) params.anio = anio;
    const res = await api.get(`/reportes-notas/alumno/${alumnoId}/notas`, {
      params,
    });
    return res.data as NotaHistorial[];
  },
};
