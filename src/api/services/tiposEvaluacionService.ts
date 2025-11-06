import { api } from '../axiosConfig';

export interface TipoEvaluacion {
  id_tipo_evaluacion: number;
  nombre: string;
  activo: boolean;
  _count?: {
    evaluaciones: number;
  };
}

export interface CreateTipoEvaluacionDto {
  nombre: string;
}

export interface UpdateTipoEvaluacionDto {
  nombre?: string;
  activo?: boolean;
}

/**
 * Obtener todos los tipos de evaluación
 * Admin: Obtiene todos (activos e inactivos)
 * Orientador: Obtiene solo activos
 */
export const obtenerTiposEvaluacion = async (): Promise<TipoEvaluacion[]> => {
  try {
    const response = await api.get<TipoEvaluacion[]>('/tipos-evaluacion');
    return response.data;
  } catch (error: any) {
    console.error('Error al obtener tipos de evaluación:', error);
    throw new Error(
      error.response?.data?.message || 'Error al obtener tipos de evaluación'
    );
  }
};

/**
 * Obtener un tipo de evaluación por ID
 */
export const obtenerTipoEvaluacionPorId = async (
  id: number
): Promise<TipoEvaluacion> => {
  try {
    const response = await api.get<TipoEvaluacion>(`/tipos-evaluacion/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error al obtener tipo de evaluación:', error);
    throw new Error(
      error.response?.data?.message || 'Error al obtener tipo de evaluación'
    );
  }
};

/**
 * Crear un nuevo tipo de evaluación
 * Solo Admin
 */
export const crearTipoEvaluacion = async (
  data: CreateTipoEvaluacionDto
): Promise<TipoEvaluacion> => {
  try {
    const response = await api.post<TipoEvaluacion>('/tipos-evaluacion', data);
    return response.data;
  } catch (error: any) {
    console.error('Error al crear tipo de evaluación:', error);
    throw new Error(
      error.response?.data?.message || 'Error al crear tipo de evaluación'
    );
  }
};

/**
 * Actualizar un tipo de evaluación
 * Solo Admin
 */
export const actualizarTipoEvaluacion = async (
  id: number,
  data: UpdateTipoEvaluacionDto
): Promise<TipoEvaluacion> => {
  try {
    const response = await api.patch<TipoEvaluacion>(
      `/tipos-evaluacion/${id}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('Error al actualizar tipo de evaluación:', error);
    throw new Error(
      error.response?.data?.message || 'Error al actualizar tipo de evaluación'
    );
  }
};

/**
 * Desactivar un tipo de evaluación
 * Solo Admin
 */
export const eliminarTipoEvaluacion = async (
  id: number
): Promise<{ message: string }> => {
  try {
    const response = await api.delete<{ message: string }>(
      `/tipos-evaluacion/${id}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error al eliminar tipo de evaluación:', error);
    throw new Error(
      error.response?.data?.message || 'Error al eliminar tipo de evaluación'
    );
  }
};

/**
 * Reactivar un tipo de evaluación desactivado
 * Solo Admin
 */
export const reactivarTipoEvaluacion = async (
  id: number
): Promise<{ message: string }> => {
  try {
    const response = await api.patch<{ message: string }>(
      `/tipos-evaluacion/${id}/restore`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error al reactivar tipo de evaluación:', error);
    throw new Error(
      error.response?.data?.message || 'Error al reactivar tipo de evaluación'
    );
  }
};
