// Tipos para Historial de Notas del Alumno
// Fuente: especificación de refactor solicitada

export interface CursoHistorial {
  id_curso: number;
  nombre: string; // Ej: "Quinto Grado A"
  seccion?: string | null;
  id_grado_academico: number;
}

export interface AlumnoHistorial {
  id_alumno: number;
  nombre: string;
  apellido: string;
  fecha_inscripcion?: string;
}

export interface AlumnosPorCursoResponse {
  curso_id: number;
  anio_academico: string;
  total_alumnos: number;
  alumnos: AlumnoHistorial[];
}

export interface TipoEvaluacionHistorial {
  nombre: string;
  porcentaje: number;
}

export interface EvaluacionHistorial {
  id_evaluacion: number;
  nombre: string;
  trimestre: number | null;
  mes: number | null;
  anio_academico: string;
  tipoEvaluacion: TipoEvaluacionHistorial;
}

export interface AsignaturaHistorial {
  id_asignatura: number;
  nombre: string;
}

export interface NotaHistorial {
  id_nota: number;
  calificacion: number;
  fecha_registro: string;
  asignatura: AsignaturaHistorial;
  evaluacion: EvaluacionHistorial;
}

export interface NotasAgrupadasPorAsignatura {
  [nombreAsignatura: string]: NotaHistorial[];
}

export interface EstadisticasAlumnoHistorial {
  total_notas: number;
  promedio_general: number;
  asignaturas_cursadas: number;
  notas_por_trimestre?: { [trimestre: number]: number };
}
