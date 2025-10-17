import { api } from '../axiosConfig';

export interface GradoCreateDto {
  nombre: string;
  opcion?: string;
  n_anios?: number;
  nota_minima?: number;
  id_jornada?: number;
  rcup?: boolean;
}

const base = '/grado-academico';

export const gradoAcademicoService = {
  async list(params?: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<any> {
    const res = await api.get(base, { params });
    return res.data as any;
  },

  async create(dto: GradoCreateDto): Promise<any> {
    const res = await api.post(base, dto);
    return res.data as any;
  },

  async update(
    id: number | string,
    dto: Partial<GradoCreateDto>
  ): Promise<any> {
    const res = await api.patch(`${base}/${id}`, dto);
    return res.data as any;
  },

  async remove(id: number | string): Promise<any> {
    const res = await api.delete(`${base}/${id}`);
    return res.data as any;
  },
  async listJornadas(): Promise<any> {
    const res = await api.get('/jornadas');
    return res.data as any;
  },
};
