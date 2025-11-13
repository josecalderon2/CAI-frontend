import { api } from '../axiosConfig';

export interface Calificacion {
  id_nota: number;
  calificacion: number;
  alumno: {
    id_alumno: number;
    nombre: string;
    apellido: string;
  };
  evaluacion: {
    id_evaluacion: number;
    nombre: string;
    puntaje_maximo: number;
    puntaje_minimo: number;
  };
  asignatura: {
    id_asignatura: number;
    nombre: string;
  };
}

export interface CreateCalificacionDTO {
  id_evaluacion: number;
  id_alumno: number;
  calificacion: number;
}

export interface UpdateCalificacionDTO {
  id_evaluacion?: number;
  id_alumno?: number;
  calificacion?: number;
}

const base = '/calificaciones';

export const calificacionesService = {
  /**
   * Crear una calificación
   */
  async create(data: CreateCalificacionDTO): Promise<Calificacion> {
    const res = await api.post<Calificacion>(base, data);
    return res.data;
  },

  /**
   * Obtener calificaciones por evaluación
   */
  async findByEvaluacion(idEvaluacion: number): Promise<Calificacion[]> {
    const res = await api.get<Calificacion[]>(base, {
      params: { id_evaluacion: idEvaluacion },
    });
    return res.data;
  },

  /**
   * Actualizar una calificación
   */
  async update(id: number, data: UpdateCalificacionDTO): Promise<Calificacion> {
    const res = await api.patch<Calificacion>(`${base}/${id}`, data);
    return res.data;
  },

  /**
   * Eliminar una calificación
   */
  async remove(id: number): Promise<void> {
    await api.delete<void>(`${base}/${id}`);
  },
};
