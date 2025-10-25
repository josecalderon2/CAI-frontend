// src/api/services/historialAsistenciasService.ts
import { api } from '../axiosConfig';

export type AccionHistorial =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'BULK_IMPORT'
  | 'RECTIFY'
  | 'ROLLBACK';

export interface HistorialAsistenciaFilter {
  id_alumno?: number;
  id_asignatura?: number;
  desde?: string; // 'YYYY-MM-DD' (inclusive)
  hasta?: string; // 'YYYY-MM-DD' (inclusive)
  accion?: AccionHistorial;
  page?: number;
  limit?: number;
}

export interface HistorialAsistenciaResponse {
  id: number;
  id_asistencia: number | null;
  id_alumno: number;
  id_asignatura: number;
  fecha: string; // fecha de la asistencia (server)
  accion: AccionHistorial;
  id_orientador_registro: number;
  estado_anterior?: string | null;
  estado_nuevo?: string | null;
  observacion_anterior?: string | null;
  observacion_nueva?: string | null;
  created_at: string; // timestamptz del log

  alumno?: { id_alumno: number; nombre: string; apellido: string };
  asignatura?: { id_asignatura: number; nombre: string };
  orientador?: { id_orientador: number; nombre: string; apellido: string };
}

export interface PaginatedHistorialResponse {
  items: HistorialAsistenciaResponse[];
  meta: {
    itemCount: number;
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

class HistorialAsistenciasService {
  private readonly baseUrl = '/asistencia/historial';

  async findByAsistencia(id_asistencia: number) {
    const { data } = await api.get<HistorialAsistenciaResponse[]>(
      `${this.baseUrl}/${id_asistencia}`
    );
    return data;
  }

  async search(filters: HistorialAsistenciaFilter = {}) {
    const { data } = await api.get<PaginatedHistorialResponse>(this.baseUrl, {
      params: {
        id_alumno: filters.id_alumno,
        id_asignatura: filters.id_asignatura,
        desde: filters.desde,
        hasta: filters.hasta,
        accion: filters.accion,
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
      },
    });
    return data;
  }
}

export const historialAsistenciasService = new HistorialAsistenciasService();
