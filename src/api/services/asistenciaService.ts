import { api } from '../axiosConfig';

// Types
interface Alumno {
  id: string;
  nombre: string;
  apellido: string;
  rut: string;
  cursoId: string;
}

interface Curso {
  id: string;
  nombre: string;
  nivel: string;
  asignatura: string;
  alumnos: number;
}

interface CreateAsistenciaDto {
  id_alumno: number;
  id_asignatura: number;
  id_orientador: number;
  fecha: string;
  estado: 'P' | 'E' | 'SP' | 'A';
  observacion?: string;
  anio_academico?: string; // String según schema de BD
  trimestre?: number;
}

interface UpdateAsistenciaDto {
  estado?: 'P' | 'E' | 'SP' | 'A';
  observacion?: string;
  trimestre?: number;
}

interface AsistenciaResponse {
  id_asistencia: number;
  id_alumno: number;
  id_asignatura: number;
  id_orientador: number;
  fecha: string;
  estado: string;
  observacion: string | null;
  anio_academico: string; // String según schema de BD
  trimestre: number;
  created_at: string;
  updated_at: string;
}

// Service methods
export const asistenciaService = {
  // Registrar asistencias (individual o bloque)
  async create(
    asistencias: CreateAsistenciaDto[]
  ): Promise<AsistenciaResponse[]> {
    const { data } = await api.post<AsistenciaResponse[]>(
      '/asistencias',
      asistencias
    );
    return data;
  },

  // Obtener asistencias por asignatura y fecha específica
  async findByAsignaturaAndFecha(
    id_asignatura: number,
    fecha: string
  ): Promise<AsistenciaResponse[]> {
    const { data } = await api.get<AsistenciaResponse[]>(
      `/asistencias/asignatura/${id_asignatura}/fecha/${fecha}`
    );
    return data;
  },

  // Obtener asistencias registradas por un docente
  async findByDocente(id_orientador: number): Promise<AsistenciaResponse[]> {
    const { data } = await api.get<AsistenciaResponse[]>(
      `/asistencias/docente/${id_orientador}`
    );
    return data;
  },

  // Obtener historial de asistencias de un alumno
  async findByAlumno(id_alumno: number): Promise<AsistenciaResponse[]> {
    const { data } = await api.get<AsistenciaResponse[]>(
      `/asistencias/alumno/${id_alumno}`
    );
    return data;
  },

  // Actualizar una asistencia específica
  async update(
    id_asistencia: number,
    updateData: UpdateAsistenciaDto
  ): Promise<AsistenciaResponse> {
    const { data } = await api.patch<AsistenciaResponse>(
      `/asistencias/${id_asistencia}`,
      updateData
    );
    return data;
  },

  // Obtener cursos asignados a un docente
  async getCursosAsignados(id_orientador: number): Promise<Curso[]> {
    const { data } = await api.get<Curso[]>(
      `/cursos/asignados/${id_orientador}`
    );
    return data;
  },

  // Obtener alumnos de un curso
  async getAlumnosPorCurso(id_curso: number): Promise<Alumno[]> {
    const { data } = await api.get<Alumno[]>(`/cursos/${id_curso}/alumnos`);
    return data;
  },

  // Obtener consolidado mensual por curso
  async getConsolidadoMensual(id_curso: number, anio: number, mes: number) {
    const { data } = await api.get(
      `/asistencias/mensual/curso/${id_curso}/${anio}/${mes}`
    );
    return data;
  },

  // Obtener consolidado trimestral por curso
  async getConsolidadoTrimestral(
    id_curso: number,
    anio: number,
    trimestre: number
  ) {
    const { data } = await api.get(
      `/asistencias/trimestral/curso/${id_curso}/${anio}/${trimestre}`
    );
    return data;
  },
};
