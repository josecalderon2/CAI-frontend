import { api } from '../axiosConfig';

// ========================
// INTERFACES DE TIPOS
// ========================

export interface RankingAlumno {
  alumnoId: number;
  cursoId: number;
  anioAcademico: string;
  promedioGeneral: number;
  totalNotas: number;
  totalAsignaturas: number;
  posicion: number;
  estadisticasComparativas: {
    promedioCurso: number;
    diferenciaConPromedio: number;
    notaMasAltaCurso: number;
    notaMasBajaCurso: number;
    posicionPorcentaje: number;
    totalAlumnosConNotas: number;
    superaPromedioCurso: boolean;
  };
  detalleAsignaturas: Array<{
    id_asignatura: number;
    nombre: string;
    promedio: number;
    total_notas: number;
    nota_mas_alta: number;
    nota_mas_baja: number;
    notas: Array<{
      id_nota: number;
      calificacion: number;
      fecha_registro: string;
      evaluacion: {
        id_evaluacion: number;
        nombre: string;
        tipo: string;
        porcentaje: number;
        mes: number | null;
        trimestre: number | null;
      };
    }>;
  }>;
  alumno: {
    id_alumno: number;
    nombre: string;
    apellido: string;
    numeroMatricula: string;
    genero: string;
    fechaNacimiento: string;
    nacionalidad: string;
    edad: number;
    partidaNumero: string;
    folio: string;
    libro: string;
    anioPartida: string;
    departamentoNacimiento: string;
    municipioNacimiento: string;
    tipoSangre: string;
    problemaFisico: string | null;
    observacionesMedicas: string | null;
    centroAsistencial: string | null;
    medicoNombre: string | null;
    medicoTelefono: string | null;
    zonaResidencia: string;
    direccion: string;
    municipio: string;
    departamento: string;
    distanciaKM: number;
    medioTransporte: string;
    encargadoTransporte: string;
    encargadoTelefono: string;
    repiteGrado: boolean;
    condicionado: boolean;
    activo: boolean;
    anioEscolar: string;
    fechaMatricula: string;
    estadoMatricula: string;
    autorizaAtencionMedica: boolean;
    autorizaUsoImagen: boolean;
    autorizaActividadesReligiosas: boolean;
    usaTransporteEscolar: boolean;
    religion: string;
  };
}

export interface DistribucionNotas {
  count: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  median: number | null;
  stddev: number | null;
}

export interface AlumnoPendiente {
  id_alumno: number;
  nombre: string;
  apellido: string;
}

export interface EvaluacionPendientes {
  evaluacion: {
    id_evaluacion: number;
    nombre: string;
  };
  total_alumnos: number;
  registrados: number;
  pendientes: AlumnoPendiente[];
}

export interface Curso {
  id_curso: number;
  nombre: string;
}

export interface Asignatura {
  id_asignatura: number;
  nombre: string;
  curso: Curso;
}

export interface EvaluacionPendiente {
  id_evaluacion: number;
  nombre: string;
  tipo: string;
  porcentaje: number;
  trimestre: number | null;
  mes: number | null;
  asignatura: Asignatura;
  total_alumnos: number;
  registrados: number;
  pendientes: number;
  porcentaje_completado: number;
}

export interface EvaluacionesPendientesResponse {
  anio_academico: string;
  filtros: {
    cursoId: number | null;
    asignaturaId: number | null;
  };
  total_evaluaciones: number;
  total_pendientes: number;
  evaluaciones: EvaluacionPendiente[];
  evaluaciones_agrupadas: Record<string, Record<string, EvaluacionPendiente[]>>;
}

export interface AlumnosPendientesResponse {
  evaluacion: {
    id_evaluacion: number;
    nombre: string;
  };
  total_alumnos: number;
  registrados: number;
  pendientes: AlumnoPendiente[];
}

// ========================
// SERVICIO
// ========================

const base = '/reportes-notas';

export const reportesAdminService = {
  /**
   * 1️⃣ GET /reportes-notas/curso/:id/ranking
   * Obtiene el ranking de mejores alumnos de un curso ordenados por promedio general descendente
   * 🔑 Solo Admin y P.A
   */
  async getRankingCurso(
    cursoId: number,
    params?: { anio?: string; top?: number }
  ): Promise<RankingAlumno[]> {
    console.log('🔍 Llamando a:', `${base}/curso/${cursoId}/ranking`, params);
    const res = await api.get(`${base}/curso/${cursoId}/ranking`, { params });
    const data = res.data as RankingAlumno[];
    console.log('✅ Respuesta getRankingCurso:', data);
    console.log(`🏆 Top ${data.length} alumnos obtenidos`);
    return data;
  },

  /**
   * 2️⃣ GET /reportes-notas/asignatura/:id/distribucion
   * Obtiene estadísticas de distribución de calificaciones de una asignatura
   * Retorna: min, max, promedio, mediana y desviación estándar
   * 🔑 Solo Admin y P.A
   */
  async getDistribucionAsignatura(
    asignaturaId: number,
    params?: { anio?: string }
  ): Promise<DistribucionNotas> {
    console.log(
      '🔍 Llamando a:',
      `${base}/asignatura/${asignaturaId}/distribucion`,
      params
    );
    const res = await api.get(
      `${base}/asignatura/${asignaturaId}/distribucion`,
      {
        params,
      }
    );
    const data = res.data as DistribucionNotas;
    console.log('✅ Respuesta getDistribucionAsignatura:', data);
    console.log(
      `📊 Estadísticas: ${data.count} notas, promedio: ${data.mean?.toFixed(2) || 'N/A'}`
    );
    return data;
  },

  /**
   * 3️⃣ GET /reportes-notas/evaluacion/:id/pendientes
   * Lista los alumnos que aún no tienen calificación registrada para una evaluación
   * Útil para supervisar el progreso de registro de notas
   * 🔑 Solo Admin y P.A
   */
  async getPendientesEvaluacion(
    evaluacionId: number
  ): Promise<AlumnosPendientesResponse> {
    console.log(
      '🔍 Llamando a:',
      `${base}/evaluacion/${evaluacionId}/pendientes`
    );
    const res = await api.get(`${base}/evaluacion/${evaluacionId}/pendientes`);
    const data = res.data as AlumnosPendientesResponse;
    console.log('✅ Respuesta getPendientesEvaluacion:', data);
    console.log(
      `📋 ${data.registrados}/${data.total_alumnos} notas registradas, ${data.pendientes.length} pendientes`
    );
    return data;
  },

  /**
   * 4️⃣ GET /reportes-notas/evaluaciones-pendientes
   * Obtiene lista de evaluaciones con pendientes, filtrable por curso y asignatura
   * Vista general para administración institucional
   * 🔑 Solo Admin y P.A
   */
  async getEvaluacionesPendientes(params?: {
    cursoId?: number;
    asignaturaId?: number;
    anio?: string;
  }): Promise<EvaluacionesPendientesResponse> {
    console.log('🔍 Llamando a:', `${base}/evaluaciones-pendientes`, params);
    const res = await api.get(`${base}/evaluaciones-pendientes`, { params });
    const data = res.data as EvaluacionesPendientesResponse;
    console.log('✅ Respuesta getEvaluacionesPendientes:', data);
    console.log(
      `📊 ${data.total_evaluaciones} evaluaciones, ${data.total_pendientes} alumnos pendientes`
    );
    return data;
  },
};
