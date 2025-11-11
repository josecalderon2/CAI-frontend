import { api } from '../axiosConfig';

export interface TipoEvaluacion {
  id_tipo_evaluacion: number;
  nombre: string;
  porcentaje: number;
}

const base = '/tipos-evaluacion';

export const tiposEvaluacionService = {
  /**
   * Obtener todos los tipos de evaluación
   */
  async findAll(): Promise<TipoEvaluacion[]> {
    const res = await api.get(base);
    return res.data as TipoEvaluacion[];
  },

  /**
   * Obtener un tipo de evaluación por ID
   */
  async findOne(id: number): Promise<TipoEvaluacion> {
    const res = await api.get(`${base}/${id}`);
    return res.data as TipoEvaluacion;
  },
};
