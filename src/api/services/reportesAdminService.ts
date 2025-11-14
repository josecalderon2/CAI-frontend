import { api } from '../axiosConfig';

// ========================
// INTERFACES DE TIPOS
// ========================

export interface RankingAlumno {
  id: number;
  alumnoId: number;
  cursoId: number;
  anioAcademico: string;
  promedioGeneral: number;
  alumno: {
    id_alumno: number;
    nombre: string;
    apellido: string;
    numeroMatricula: string;
    fecha_nacimiento: string;
    direccion: string;
    telefono: string;
    email: string;
    genero: string;
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
  ): Promise<EvaluacionPendientes> {
    console.log(
      '🔍 Llamando a:',
      `${base}/evaluacion/${evaluacionId}/pendientes`
    );
    const res = await api.get(`${base}/evaluacion/${evaluacionId}/pendientes`);
    const data = res.data as EvaluacionPendientes;
    console.log('✅ Respuesta getPendientesEvaluacion:', data);
    console.log(
      `📋 ${data.registrados}/${data.total_alumnos} notas registradas, ${data.pendientes.length} pendientes`
    );
    return data;
  },
};
