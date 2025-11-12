import { api } from '../axiosConfig';

export interface Asignatura {
  id_asignatura: number;
  nombre: string;
  horas_semanas?: number;
  orden_en_reporte?: string;
  id_curso?: number;
  id_metodo_evaluacion?: number;
  id_tipo_asignatura?: number;
  id_sistema_evaluacion?: number;
  curso?: {
    id_curso: number;
    nombre: string;
    seccion?: string;
    gradoAcademico?: {
      id_grado_academico: number;
      nombre: string;
    };
  };
  metodoEvaluacion?: {
    id_metodo_evaluacion: number;
    nombre: string;
  };
  tipoAsignatura?: {
    id_tipo_asignatura: number;
    nombre: string;
  };
  sistemaEvaluacion?: {
    id_sistema_evaluacion: number;
    nombre: string;
  };
}

const base = '/asignaturas';

export const asignaturasService = {
  /**
   * Obtener todas las asignaturas
   */
  async findAll(): Promise<Asignatura[]> {
    const res = await api.get(base);
    return res.data as Asignatura[];
  },

  /**
   * Obtener una asignatura por ID
   */
  async findOne(id: number): Promise<Asignatura> {
    const res = await api.get(`${base}/${id}`);
    return res.data as Asignatura;
  },

  /**
   * Obtener asignaturas por curso
   */
  async findByCurso(cursoId: number): Promise<Asignatura[]> {
    const res = await api.get(`${base}/curso/${cursoId}`);
    return res.data as Asignatura[];
  },

  /**
   * Obtener solo las asignaturas asignadas al orientador autenticado
   */
  async findMisAsignaturas(): Promise<Asignatura[]> {
    const res = await api.get(`${base}/mis-asignaturas`);
    return res.data as Asignatura[];
  },
};
