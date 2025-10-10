import { api } from '../axiosConfig';

export interface Curso {
  id_curso?: number;
  nombre: string;
  seccion?: string | null;
  descripcion?: string | null;
  id_grado_academico?: number | null;
  id_orientador?: number | null;
  cupo?: number | null;
  aula?: string | null;
  activo?: boolean;
  // Relaciones expandidas
  gradoAcademico?: {
    id_grado_academico: number;
    nombre: string;
  } | null;
  orientador?: {
    id_orientador: number;
    nombre: string;
    apellido: string;
  } | null;
  // Campo para el conteo de alumnos (puede ser proporcionado por el backend)
  alumnosCount?: number;
}

export interface ListCursosParams {
  page?: number;
  limit?: number;
  q?: string;
  id_grado_academico?: number;
  modalidad?: string;
  activo?: boolean;
}

const base = '/cursos';

export const cursosService = {
  async list(params?: ListCursosParams): Promise<{
    items: Curso[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const res = await api.get(base, { params });
    return res.data as {
      items: Curso[];
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  },

  async getOne(id: number): Promise<Curso> {
    const res = await api.get(`${base}/${id}`);
    return res.data as Curso;
  },

  async create(curso: Curso): Promise<Curso> {
    const res = await api.post(base, curso);
    return res.data as Curso;
  },

  async update(id: number, curso: Partial<Curso>): Promise<Curso> {
    const res = await api.patch(`${base}/${id}`, curso);
    return res.data as Curso;
  },

  async remove(id: number): Promise<Curso> {
    const res = await api.delete(`${base}/${id}`);
    return res.data as Curso;
  },

  async restore(id: number): Promise<Curso> {
    const res = await api.patch(`${base}/${id}/restore`, {});
    return res.data as Curso;
  },

  async stats(): Promise<{
    totalCursos: number;
    cursosActivos: number;
    capacidadTotal: number;
    promedioAlumnosPorCurso: number;
  }> {
    const res = await api.get(`${base}/stats`);
    return res.data as {
      totalCursos: number;
      cursosActivos: number;
      capacidadTotal: number;
      promedioAlumnosPorCurso: number;
    };
  },

  // Toggle active status (wraps update method)
  async toggleStatus(id: number, active: boolean): Promise<Curso> {
    return this.update(id, { activo: active });
  },
};
