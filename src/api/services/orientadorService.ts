import { api } from '../axiosConfig';

export interface Orientador {
  id_orientador: number;
  nombre: string;
  apellido: string;
  nombreCompleto?: string;
}

export const orientadorService = {
  async getAll(): Promise<Orientador[]> {
    const { data } = await api.get('/orientadores');
    return data as Orientador[];
  },
  async getOne(id: number) {
    const { data } = await api.get(`/orientadores/${id}`);
    return data;
  },
};
