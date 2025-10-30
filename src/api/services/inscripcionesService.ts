import { api } from '../axiosConfig';

export interface InscripcionDto {
  cursoId: number;
  anioAcademico: string;
  seccionAsignada?: string;
  observaciones?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export interface InscripcionResponse {
  id: number;
  alumnoId: number;
  cursoId: number;
  anioAcademico: string;
  seccionAsignada?: string;
  estado: string;
  observaciones?: string;
  fechaInscripcion: Date;
  fechaRetiro?: Date;
  alumno?: {
    id_alumno: number;
    nombre: string;
    apellido: string;
  };
  curso?: {
    id_curso: number;
    nombre: string;
    seccion?: string;
    gradoAcademico?: {
      nombre: string;
    };
  };
}

/**
 * Inscribe un alumno a un curso
 * @param alumnoId ID del alumno a inscribir
 * @param inscripcionDto Datos de la inscripción
 */
export const inscribirAlumnoCurso = async (
  alumnoId: number,
  inscripcionDto: InscripcionDto
): Promise<InscripcionResponse> => {
  const response = await api.post(
    `/alumnos/${alumnoId}/inscripciones`,
    inscripcionDto
  );
  return response.data as InscripcionResponse;
};

/**
 * Obtiene todas las inscripciones de un alumno
 * @param alumnoId ID del alumno
 */
export const obtenerInscripcionesAlumno = async (
  alumnoId: number
): Promise<InscripcionResponse[]> => {
  const response = await api.get(`/alumnos/${alumnoId}/inscripciones`);
  return response.data as InscripcionResponse[];
};

/**
 * Retira a un alumno de un curso
 * @param alumnoId ID del alumno
 * @param inscripcionId ID de la inscripción
 */
export const retirarAlumnoCurso = async (
  alumnoId: number,
  inscripcionId: number
): Promise<InscripcionResponse> => {
  const response = await api.patch(
    `/alumnos/${alumnoId}/inscripciones/${inscripcionId}/retirar`
  );
  return response.data as InscripcionResponse;
};

export default {
  inscribirAlumnoCurso,
  obtenerInscripcionesAlumno,
  retirarAlumnoCurso,
};
