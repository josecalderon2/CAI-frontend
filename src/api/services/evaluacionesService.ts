import { api } from '../axiosConfig';

// Interfaces basadas en el backend
export interface TipoEvaluacion {
  id_tipo_evaluacion: number;
  nombre: string;
  porcentaje: number;
}

export interface AsignaturaEvaluacion {
  id_asignatura: number;
  nombre: string;
}

export interface OrientadorEvaluacion {
  id_orientador: number;
  nombre: string;
  apellido: string;
}

export interface Evaluacion {
  id_evaluacion: number;
  nombre: string;
  puntaje_maximo: number;
  puntaje_minimo: number;
  calificacion?: number;
  anio_academico: string;
  mes?: number;
  trimestre?: number;
  periodo?: number;
  createdAt: Date;
  tipoEvaluacion: TipoEvaluacion;
  asignatura: AsignaturaEvaluacion;
  orientador: OrientadorEvaluacion;
}

export interface CreateEvaluacionDto {
  nombre: string;
  puntaje_maximo?: number;
  puntaje_minimo?: number;
  id_tipo_evaluacion: number;
  id_asignatura: number;
  mes?: number;
  trimestre?: number;
  periodo?: number;
}

export interface UpdateEvaluacionDto {
  nombre?: string;
  puntaje_maximo?: number;
  puntaje_minimo?: number;
  id_tipo_evaluacion?: number;
  id_asignatura?: number;
  mes?: number;
  trimestre?: number;
  periodo?: number;
}

const base = '/evaluaciones';

export const evaluacionesService = {
  /**
   * Obtener todas las evaluaciones del orientador autenticado
   */
  async findAll(): Promise<Evaluacion[]> {
    const res = await api.get(base);
    return res.data as Evaluacion[];
  },

  /**
   * Obtener solo las evaluaciones de las asignaturas asignadas al orientador
   */
  async findByMisAsignaturas(): Promise<Evaluacion[]> {
    const res = await api.get(`${base}/mis-asignaturas/evaluaciones`);
    return res.data as Evaluacion[];
  },

  /**
   * Obtener una evaluación específica por ID
   */
  async findOne(id: number): Promise<Evaluacion> {
    const res = await api.get(`${base}/${id}`);
    return res.data as Evaluacion;
  },

  /**
   * Crear una nueva evaluación
   */
  async create(evaluacion: CreateEvaluacionDto): Promise<Evaluacion> {
    const res = await api.post(base, evaluacion);
    return res.data as Evaluacion;
  },

  /**
   * Actualizar una evaluación existente
   */
  async update(
    id: number,
    evaluacion: UpdateEvaluacionDto
  ): Promise<Evaluacion> {
    const res = await api.patch(`${base}/${id}`, evaluacion);
    return res.data as Evaluacion;
  },

  /**
   * Eliminar una evaluación
   */
  async remove(id: number): Promise<{ message: string }> {
    const res = await api.delete(`${base}/${id}`);
    return res.data as { message: string };
  },

  /**
   * Obtener tipos de evaluación válidos para una asignatura
   */
  async getTiposEvaluacionByAsignatura(
    id_asignatura: number
  ): Promise<TipoEvaluacion[]> {
    const res = await api.get(`/tipos-evaluacion/asignatura/${id_asignatura}`);
    return res.data as TipoEvaluacion[];
  },
};
