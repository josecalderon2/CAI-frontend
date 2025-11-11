import { api } from '../axiosConfig';

// Interfaces para notas mensuales
export interface NotaMensual {
  id_nota_mensual?: number;
  id_alumno: number;
  id_asignatura: number;
  mes: number;
  anio: number;
  tarea_1?: number | null;
  revision_libros_cuadernos?: number | null;
  tarea_2?: number | null;
  laboratorio_escrito?: number | null;
  examen_mensual?: number | null;
  promedio?: number | null;
  createdAt?: string;
  updatedAt?: string;
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

export interface CreateNotaMensualDto {
  id_alumno: number;
  id_asignatura: number;
  mes: number;
  anio: number;
  tarea_1?: number | null;
  revision_libros_cuadernos?: number | null;
  tarea_2?: number | null;
  laboratorio_escrito?: number | null;
  examen_mensual?: number | null;
}

export interface UpdateNotaMensualDto {
  tarea_1?: number | null;
  revision_libros_cuadernos?: number | null;
  tarea_2?: number | null;
  laboratorio_escrito?: number | null;
  examen_mensual?: number | null;
}

const base = '/notas-mensuales';

export const notasService = {
  // Crear una nota mensual
  async createNotaMensual(dto: CreateNotaMensualDto): Promise<NotaMensualResponse> {
    const res = await api.post(base, dto);
    return res.data as NotaMensualResponse;
  },

  // Actualizar una nota mensual existente
  async updateNotaMensual(id: number, dto: UpdateNotaMensualDto): Promise<NotaMensualResponse> {
    const res = await api.patch(`${base}/${id}`, dto);
    return res.data as NotaMensualResponse;
  },

  // Obtener notas mensuales por alumno, asignatura, mes y año
  async getNotasMensuales(params: {
    id_alumno?: number;
    id_asignatura?: number;
    mes?: number;
    anio?: number;
  }): Promise<NotaMensualResponse[]> {
    // Filtrar parámetros undefined para evitar enviar valores vacíos
    const filteredParams: Record<string, number> = {};
    if (params.id_alumno !== undefined) filteredParams.id_alumno = params.id_alumno;
    if (params.id_asignatura !== undefined) filteredParams.id_asignatura = params.id_asignatura;
    if (params.mes !== undefined) filteredParams.mes = params.mes;
    if (params.anio !== undefined) filteredParams.anio = params.anio;
    
    const res = await api.get(base, { params: filteredParams });
    return res.data as NotaMensualResponse[];
  },

  // Obtener una nota mensual específica
  async getNotaMensual(id: number): Promise<NotaMensualResponse> {
    const res = await api.get(`${base}/${id}`);
    return res.data as NotaMensualResponse;
  },

  // Eliminar una nota mensual
  async deleteNotaMensual(id: number): Promise<void> {
    await api.delete(`${base}/${id}`);
  },
};
