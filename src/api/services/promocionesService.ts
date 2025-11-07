import { api } from '../axiosConfig';

// Interfaces que coinciden con el backend
export interface AlumnoCurso {
  id_alumno_curso: number;
  id_alumno: number;
  id_curso: number;
  nombre: string;
  apellido: string;
  numero_matricula: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
  promedio_notas?: number | null;
  anio_academico: string;
}

// DTOs que coinciden con el backend (promociones.dto.ts)
export interface PromoverAlumnoDto {
  alumnoId: number;
  cursoDestinoId: number;
  anioActual: string;
  anioDestino: string;
  estado?: string;
  observaciones?: string;
  notaPromedio?: number;
}

export interface AlumnoPromocionDto {
  alumnoId: number;
  estado: string;
  notaPromedio?: number;
  observaciones?: string;
}

export interface PromocionCursoDto {
  cursoOrigenId: number;
  cursoDestinoId: number;
  alumnos: AlumnoPromocionDto[];
}

export interface PromocionMasivaDto {
  anioActual: string;
  anioSiguiente: string;
  promocionesPorCurso: PromocionCursoDto[];
}

export interface FinalizarAlumnoDto {
  alumnoId: number;
  anioActual: string;
  estado?: string;
  notaPromedio?: number;
  observaciones?: string;
  marcarInactivo?: boolean;
}

// Respuesta del historial académico
export interface HistorialAcademico {
  anioAcademico: string;
  curso: {
    nombre: string;
    seccion: string | null;
    gradoAcademico: {
      nombre: string;
    };
  };
  estadoFinal: string | null;
  notaPromedio: number | null;
  fechaInicio: Date;
  fechaFin: Date | null;
  observaciones: string | null;
}

// Servicio para manejar todas las operaciones de promociones
const promocionesService = {
  // Obtener todos los alumnos para promoción (todos los cursos)
  async getTodosLosAlumnos(anioAcademico: string) {
    const response = await api.get('/promociones/alumnos', {
      params: { anioAcademico },
    });

    // El backend devuelve { anioAcademico, totalCursos, totalAlumnos, items }
    const data: any = response.data;
    const items = data.items || [];

    // Mapear según la estructura del backend
    // Ver promociones.service.ts línea 1018-1037
    const itemsMapped = items.map((item: any) => ({
      id_alumno_curso: item.id,
      id_alumno: item.id,
      id_curso: item.curso?.id, // ID del curso desde el objeto curso
      nombre: item.nombre,
      apellido: item.apellido,
      numero_matricula: item.numeroMatricula || `MAT-${item.id}`,
      estado: item.estadoActual || 'ACTIVO',
      promedio_notas: item.notaPromedio,
      anio_academico: anioAcademico,
      curso_nombre: item.curso?.nombreCompleto, // nombreCompleto del curso desde backend
      grado_academico: item.curso?.gradoAcademico, // nombre del grado académico
    }));

    return {
      items: itemsMapped,
      totalCursos: data.totalCursos,
      totalAlumnos: data.totalAlumnos,
    };
  },

  // Obtener alumnos por curso para promoción
  async getAlumnosPorCurso(cursoId: number, anioAcademico: string) {
    const response = await api.get(
      `/promociones/alumnos-por-curso/${cursoId}`,
      {
        params: { anioAcademico },
      }
    );

    // El backend devuelve { curso, alumnos, total }
    const data: any = response.data;
    const alumnos = data.alumnos || [];

    // Transformar al formato esperado por el frontend
    const itemsMapped = alumnos.map((alumno: any) => ({
      id_alumno_curso: alumno.id, // No existe en backend, usar id
      id_alumno: alumno.id,
      id_curso: cursoId,
      nombre: alumno.nombre,
      apellido: alumno.apellido,
      numero_matricula: alumno.numero_matricula || `MAT-${alumno.id}`,
      estado: alumno.estadoActual || 'ACTIVO',
      promedio_notas: alumno.notaPromedio,
      anio_academico: anioAcademico,
    }));

    return { items: itemsMapped };
  },

  // Obtener cursos disponibles para promoción
  async getCursosParaPromocion(
    gradoAcademicoId: number,
    anioAcademico: string
  ) {
    const response = await api.get(
      `/promociones/cursos-para-promocion/${gradoAcademicoId}`,
      {
        params: { anioAcademico },
      }
    );

    // El backend devuelve { cursosSugeridos, todosLosCursos, esUltimoGrado }
    return response.data;
  },

  // Obtener historial académico de un alumno
  async getHistorialAcademico(alumnoId: number) {
    const response = await api.get(`/promociones/historial/${alumnoId}`);

    // El backend devuelve { alumno, historial }
    return response.data;
  },

  // Promocionar o trasladar un alumno individualmente
  async promoverAlumno(data: PromoverAlumnoDto) {
    const response = await api.post('/promociones/promover-alumno', data);
    return response.data;
  },

  // Finalizar estudios de un alumno
  async finalizarAlumno(data: FinalizarAlumnoDto) {
    try {
      const response = await api.post('/promociones/finalizar-alumno', data);
      return response.data;
    } catch (error: any) {
      console.error('Error en finalizarAlumno:', error);
      throw error;
    }
  },

  // Realizar promoción masiva de alumnos
  async promocionMasiva(data: PromocionMasivaDto) {
    const response = await api.post('/promociones/promociones-masivas', data);
    return response.data;
  },
};

export default promocionesService;
