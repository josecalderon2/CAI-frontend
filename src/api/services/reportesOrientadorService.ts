import { api } from '../axiosConfig';

// Interfaces para los reportes del orientador (basadas en la estructura real del backend)

export interface EvaluacionDistribucion {
  tipo: string;
  porcentajeBase: number;
  cantidad: number;
  porcentajeCadaUna: number;
  evaluaciones: Array<{
    id_evaluacion: number;
    nombre: string;
  }>;
}

export interface ReporteEvaluacionesAsignatura {
  asignatura: {
    id_asignatura: number;
  };
  anio_academico: string;
  distribucionPorcentajes: EvaluacionDistribucion[];
  totalPorcentaje: number;
}

export interface AlumnoCalificacion {
  id_alumno: number;
  nombre: string;
  apellido: string;
  genero: 'M' | 'F';
  calificacion: number | null;
  id_nota: number | null;
  tiene_calificacion: boolean;
}

export interface ReporteCalificacionesEvaluacion {
  id_evaluacion: number;
  nombre_evaluacion: string;
  asignatura: {
    id_asignatura: number;
    nombre: string;
  };
  curso: {
    id_curso: number;
    nombre: string;
    seccion: string | null; // Seccion puede ser null
  };
  total_alumnos: number;
  alumnos_calificados: number;
  alumnos: AlumnoCalificacion[];
}

export interface NotaAlumno {
  id_nota: number;
  id_asignatura: number;
  trimestre: string;
  id_evaluacion: number;
  calificacion: number;
  fecha_registro: string;
  id_alumno: number;
  asignatura: {
    id_asignatura: number;
    nombre: string;
    orden_en_reporte: string;
    horas_semanas: number;
    id_metodo_evaluacion: number;
    id_tipo_asignatura: number;
    id_sistema_evaluacion: number;
    id_curso: number;
  };
  evaluacion: {
    id_evaluacion: number;
    nombre: string;
    puntaje_maximo: number;
    puntaje_minimo: number;
    id_tipo_evaluacion: number;
    id_asignatura: number;
    id_orientador: number;
    anio_academico: string;
    mes: number | null;
    trimestre: number | null;
    periodo: number | null;
    createdAt: string;
    tipoEvaluacion: {
      id_tipo_evaluacion: number;
      nombre: string;
      id_grado_academico: number;
      porcentaje: number;
      activo: boolean;
    };
  };
}

export type ReporteNotasAlumno = NotaAlumno[];

export interface PromedioMensual {
  id: number;
  alumnoId: number;
  asignaturaId: number;
  anioAcademico: string;
  mes: number;
  trimestre: number;
  promedioTareas: number | null;
  promedioRevisiones: number | null;
  promedioLaboratorios: number | null;
  promedioMensual: number;
  actualizadoEn: string;
  asignatura: {
    id_asignatura: number;
    nombre: string;
    orden_en_reporte: string;
    horas_semanas: number;
    id_metodo_evaluacion: number;
    id_tipo_asignatura: number;
    id_sistema_evaluacion: number;
    id_curso: number;
  };
}

export interface PromedioTrimestral {
  id: number;
  alumnoId: number;
  asignaturaId: number;
  anioAcademico: string;
  trimestre: number;
  promedioMeses: number;
  actividadIntegradora: number;
  autoevaluacion: number;
  promedioActividades: number;
  examenTrimestral: number;
  promedioTrimestral: number;
  aprobado: boolean;
  actualizadoEn: string;
  asignatura: {
    id_asignatura: number;
    nombre: string;
    orden_en_reporte: string;
    horas_semanas: number;
    id_metodo_evaluacion: number;
    id_tipo_asignatura: number;
    id_sistema_evaluacion: number;
    id_curso: number;
  };
}

export interface PromedioFinalAsignatura {
  id: number;
  alumnoId: number;
  asignaturaId: number;
  anioAcademico: string;
  promedioTrimestre1: number | null;
  promedioTrimestre2: number | null;
  promedioTrimestre3: number | null;
  promedioPeriodo1: number | null;
  promedioPeriodo2: number | null;
  promedioPeriodo3: number | null;
  promedioPeriodo4: number | null;
  promedioFinal: number;
  aprobado: boolean;
  requiereRecuperacion: boolean;
  notaRecuperacion: number | null;
  aproboRecuperacion: boolean | null;
  actualizadoEn: string;
  asignatura: {
    id_asignatura: number;
    nombre: string;
    orden_en_reporte: string;
    horas_semanas: number;
    id_metodo_evaluacion: number;
    id_tipo_asignatura: number;
    id_sistema_evaluacion: number;
    id_curso: number;
  };
}

export interface PromedioFinalAlumno {
  id: number;
  alumnoId: number;
  cursoId: number;
  anioAcademico: string;
  promedioGeneral: number;
  aprobadoTodasAsignaturas: boolean;
  asignaturasReprobadas: number;
  estadoFinal: 'APROBADO' | 'REPROBADO' | 'RECUPERACION';
  calificacionesCerradas: boolean;
  fechaCierre: string | null;
  actualizadoEn: string;
}

export interface ReportePromediosAlumno {
  anio: string;
  mensuales: PromedioMensual[];
  trimestrales: PromedioTrimestral[];
  periodos: any[];
  finalesAsignatura: PromedioFinalAsignatura[];
  finalAlumno: PromedioFinalAlumno | null;
}

export interface Conducta {
  id_conducta: number;
  id_alumno: number;
  fecha: string;
  id_infraccion_catalogo: number;
  id_orientador: number;
  id_asignatura: number | null;
  observacion: string;
  anio_academico: string;
  trimestre: number;
  infraccion: {
    id_infraccion: number;
    categoria: 'LEVE' | 'MENOS_GRAVE' | 'GRAVE' | 'MUY_GRAVE';
    articulo: string;
    descripcion: string;
    puntos: number;
    activo: boolean;
  };
}

export interface ReporteBoletaAlumno {
  anio: string;
  finalesAsignatura: PromedioFinalAsignatura[];
  finalAlumno: PromedioFinalAlumno | null;
  conductasResumen: {
    total: number;
    detalles: Conducta[];
  };
  asistencia: {
    total: number;
    presentes: number;
    porcentaje: number | null;
  };
}

// Interfaces para el reporte detallado para padres
export interface EvaluacionDetalle {
  id_evaluacion: number;
  nombre: string;
  tipo: string;
  porcentaje: number;
  trimestre: number | null;
  periodo: number | null;
  mes: number | null;
  nota: number | null;
  fecha_registro: Date | null;
}

export interface AsignaturaDetallada {
  id_asignatura: number;
  nombre: string;
  orientador: string | null;
  evaluaciones: EvaluacionDetalle[];
  promedio_periodo: number | null;
}

export interface ConductaDetalle {
  id_conducta: number;
  fecha: Date;
  observacion: string;
  orientador: string | null;
  infraccion: {
    categoria: 'MUY_GRAVE' | 'GRAVE' | 'MENOS_GRAVE';
    articulo: string;
    descripcion: string;
    puntos: number;
  };
}

export interface ReporteDetalladoAlumno {
  alumno: {
    id_alumno: number;
    nombre: string;
    apellido: string;
    numeroMatricula: string; // Backend usa numeroMatricula, no codigo
  };
  curso: {
    id_curso: number;
    nombre: string;
    grado: string; // Backend devuelve el nombre del grado académico
    es_bachillerato: boolean;
  };
  periodo_academico: {
    anio: string;
    trimestre: number | null;
    periodo: number | null;
    nombre: string;
  };
  asignaturas: AsignaturaDetallada[];
  promedio_general_periodo: number | null;
  conductas: {
    total: number;
    puntos_acumulados: number;
    detalles: ConductaDetalle[];
  };
  asistencia: {
    total_registros: number;
    presentes: number;
    ausentes: number;
    tardanzas: number;
    porcentaje_asistencia: number | null;
  };
}

// Interfaces para la boleta mensual
export interface BoletaMensualResponse {
  alumno: {
    id_alumno: number;
    nombre: string;
    apellido: string;
    numeroMatricula: string;
  };
  curso: {
    id_curso: number;
    nombre: string;
    grado: string;
    es_bachillerato: boolean;
    orientador: string;
  };
  periodo_academico: {
    anio: string;
    mes: number;
    nombre_mes: string;
    trimestre: number | null;
    periodo: number | null;
    descripcion: string;
  };
  asignaturas: Array<{
    id_asignatura: number;
    nombre: string;
    orientador: string;
    evaluaciones: Array<{
      id_evaluacion: number;
      nombre: string;
      tipo: string;
      porcentaje: number;
      nota: number | null;
      fecha_registro: string | null;
    }>;
    promedio_mensual: number | null;
    desglose_promedio: {
      tareas: number | null;
      revisiones: number | null;
      laboratorios: number | null;
    };
  }>;
  promedio_general_mes: number | null;
  conductas: {
    total: number;
    puntos_acumulados: number;
    detalles: Array<{
      id_conducta: number;
      fecha: string;
      observacion: string;
      orientador: string | null;
      infraccion: {
        categoria: string;
        articulo: string;
        descripcion: string;
        puntos: number;
      };
    }>;
  };
  asistencia: {
    total_dias: number;
    presentes: number;
    ausentes: number;
    tardanzas: number;
    porcentaje_asistencia: number | null;
  };
}

const base = '/reportes-notas';

export const reportesOrientadorService = {
  /**
   * Obtener evaluaciones de una asignatura del orientador
   * Estructura: { asignatura, anio_academico, distribucionPorcentajes[], totalPorcentaje }
   */
  async getEvaluacionesByAsignatura(
    idAsignatura: number,
    anio: number
  ): Promise<ReporteEvaluacionesAsignatura> {
    console.log('🔍 Llamando a:', `${base}/evaluaciones`, {
      id_asignatura: idAsignatura,
      anio,
    });
    const res = await api.get(`${base}/evaluaciones`, {
      params: { id_asignatura: idAsignatura, anio },
    });
    const data = res.data as ReporteEvaluacionesAsignatura;
    console.log('✅ Respuesta getEvaluacionesByAsignatura:', data);
    console.log('📋 Distribución Porcentajes:', data.distribucionPorcentajes);
    return data;
  },

  /**
   * Obtener calificaciones de alumnos en una evaluación específica
   * Estructura: { id_evaluacion, nombre_evaluacion, asignatura, curso, total_alumnos, alumnos_calificados, alumnos[] }
   */
  async getCalificacionesEvaluacion(
    idEvaluacion: number
  ): Promise<ReporteCalificacionesEvaluacion> {
    console.log(
      '🔍 Llamando a:',
      `${base}/evaluacion/${idEvaluacion}/alumnos-calificaciones`
    );
    const res = await api.get(
      `${base}/evaluacion/${idEvaluacion}/alumnos-calificaciones`
    );
    const data = res.data as ReporteCalificacionesEvaluacion;
    console.log('✅ Respuesta getCalificacionesEvaluacion:', data);
    console.log(
      `📊 ${data.alumnos_calificados}/${data.total_alumnos} alumnos calificados`
    );
    return data;
  },

  /**
   * Obtener todas las notas de un alumno en asignaturas del orientador
   * Estructura: Array de notas con toda la información de evaluación y asignatura
   */
  async getNotasAlumno(
    idAlumno: number,
    anio: number
  ): Promise<ReporteNotasAlumno> {
    console.log('🔍 Llamando a:', `${base}/alumno/${idAlumno}/notas`, {
      anio,
    });
    const res = await api.get(`${base}/alumno/${idAlumno}/notas`, {
      params: { anio },
    });
    const data = res.data as ReporteNotasAlumno;
    console.log('✅ Respuesta getNotasAlumno:', data);
    console.log(`📝 Total de notas: ${data.length}`);
    return data;
  },

  /**
   * Obtener promedios de un alumno en asignaturas del orientador
   * Estructura: { anio, mensuales[], trimestrales[], periodos[], finalesAsignatura[], finalAlumno }
   */
  async getPromediosAlumno(
    idAlumno: number,
    anio: number
  ): Promise<ReportePromediosAlumno> {
    console.log('🔍 Llamando a:', `${base}/promedios/alumno/${idAlumno}`, {
      anio,
    });
    const res = await api.get(`${base}/promedios/alumno/${idAlumno}`, {
      params: { anio },
    });
    const data = res.data as ReportePromediosAlumno;
    console.log('✅ Respuesta getPromediosAlumno:', data);
    console.log(
      `📊 Promedio General: ${data.finalAlumno?.promedioGeneral || 'N/A'}`
    );
    return data;
  },

  /**
   * Obtener la boleta completa de un alumno (solo asignaturas del orientador)
   * Estructura: { anio, finalesAsignatura[], finalAlumno, conductasResumen, asistencia }
   */
  async getBoletaAlumno(
    idAlumno: number,
    anio: number
  ): Promise<ReporteBoletaAlumno> {
    console.log('🔍 Llamando a:', `${base}/boleta/alumno/${idAlumno}`, {
      anio,
    });
    const res = await api.get(`${base}/boleta/alumno/${idAlumno}`, {
      params: { anio },
    });
    const data = res.data as ReporteBoletaAlumno;
    console.log('✅ Respuesta getBoletaAlumno:', data);
    console.log(
      `📋 Asignaturas: ${data.finalesAsignatura.length}, Conductas: ${data.conductasResumen.total}, Asistencia: ${data.asistencia.porcentaje}%`
    );
    return data;
  },

  /**
   * Obtener reporte detallado de un alumno por trimestre/periodo (para padres)
   * Estructura: { alumno, curso, periodo_academico, asignaturas[], promedio_general_periodo, conductas, asistencia }
   */
  async getReporteDetalladoAlumno(
    idAlumno: number,
    params: { anio?: string; trimestre?: number; periodo?: number }
  ): Promise<ReporteDetalladoAlumno> {
    console.log(
      '🔍 Llamando a:',
      `${base}/boleta/alumno/${idAlumno}/detalle`,
      params
    );
    const res = await api.get(`${base}/boleta/alumno/${idAlumno}/detalle`, {
      params,
    });
    const data = res.data as ReporteDetalladoAlumno;
    console.log('✅ Respuesta getReporteDetalladoAlumno:', data);
    console.log('🔍 DIAGNÓSTICO PROMEDIO:');
    console.log('  - promedio_general_periodo:', data.promedio_general_periodo);
    console.log('  - tipo:', typeof data.promedio_general_periodo);
    console.log('  - es null?:', data.promedio_general_periodo === null);
    console.log(
      '  - es undefined?:',
      data.promedio_general_periodo === undefined
    );
    console.log('  - es NaN?:', isNaN(data.promedio_general_periodo as any));
    console.log('  - asignaturas con promedio:');
    data.asignaturas.forEach((asig) => {
      console.log(
        `    * ${asig.nombre}: ${asig.promedio_periodo} (tipo: ${typeof asig.promedio_periodo})`
      );
    });
    console.log(
      `📊 ${data.periodo_academico.nombre} - ${data.asignaturas.length} asignaturas, Promedio: ${data.promedio_general_periodo?.toFixed(2) || 'N/A'}`
    );
    return data;
  },

  /**
   * Obtener boleta mensual de un alumno (para padres)
   * Endpoint: GET /reportes-notas/boleta/alumno/:id/mensual?mes=X&anio=YYYY
   * Estructura: { alumno, curso, periodo_academico, asignaturas[], promedio_general_mes, conductas, asistencia }
   */
  async getBoletaMensual(
    idAlumno: number,
    params: { mes: number; anio?: string }
  ): Promise<BoletaMensualResponse> {
    console.log(
      '🔍 Llamando a:',
      `${base}/boleta/alumno/${idAlumno}/mensual`,
      params
    );
    const res = await api.get(`${base}/boleta/alumno/${idAlumno}/mensual`, {
      params,
    });
    const data = res.data as BoletaMensualResponse;
    console.log('✅ Respuesta getBoletaMensual:', data);
    console.log(
      `📊 ${data.periodo_academico.nombre_mes} ${data.periodo_academico.anio} - ${data.asignaturas.length} asignaturas, Promedio: ${data.promedio_general_mes?.toFixed(2) || 'N/A'}`
    );
    return data;
  },
};
