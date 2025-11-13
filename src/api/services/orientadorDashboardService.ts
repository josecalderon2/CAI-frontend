import { api } from '../axiosConfig';
import { cursosService, type Curso } from './cursosService';
import { evaluacionesService, type Evaluacion } from './evaluacionesService';
import { asignaturasService, type Asignatura } from './asignaturasService';

// ============================================
// TYPES - DASHBOARD ORIENTADOR
// ============================================

export interface EstadisticasDashboard {
  cursosAsignados: number;
  evaluacionesCreadas: number;
  notasPendientes: number;
  alumnosTotal: number;
  promedioGeneral: number;
  evaluacionesEstesMes: number;
  asignaturasAsignadas: number;
}

export interface CursoAsignadoDetalle extends Curso {
  alumnosCount?: number;
  asignaturas?: Asignatura[];
  ultimaAsistencia?: string;
}

export interface EvaluacionReciente extends Evaluacion {
  notasIngresadas?: number;
  totalAlumnos?: number;
  estadoProgreso?: 'Completada' | 'En Progreso' | 'Pendiente' | 'Planificada';
}

export interface ResumenActividades {
  asistenciasRegistradas: number;
  evaluacionesPendientes: number;
  notasPorIngresar: number;
  ultimaActualizacion: string;
}

export interface DashboardOrientadorData {
  estadisticas: EstadisticasDashboard;
  cursosAsignados: CursoAsignadoDetalle[];
  evaluacionesRecientes: EvaluacionReciente[];
  resumenActividades?: ResumenActividades;
}

// ============================================
// SERVICE
// ============================================

const base = '/orientador';

export const orientadorDashboardService = {
  /**
   * 🎯 MÉTODO PRINCIPAL: Obtener todos los datos del dashboard
   * Este método agrega múltiples llamadas a la API para construir el dashboard completo
   */
  async getDashboardData(
    orientadorId?: number
  ): Promise<DashboardOrientadorData> {
    try {
      // 1. Obtener cursos asignados (usa el nuevo endpoint si existe, sino fallback)
      const cursosAsignados = await this.getCursosAsignados(orientadorId);

      // 2. Obtener asignaturas asignadas
      const misAsignaturas = await asignaturasService.findMisAsignaturas();

      // 3. Obtener evaluaciones recientes
      const evaluaciones = await evaluacionesService.findByMisAsignaturas();

      // 4. Calcular estadísticas
      const estadisticas = await this.calcularEstadisticas(
        cursosAsignados,
        evaluaciones,
        misAsignaturas
      );

      // 5. Procesar evaluaciones recientes (últimas 5)
      const evaluacionesRecientes = await this.procesarEvaluacionesRecientes(
        evaluaciones
      );

      // 6. Obtener resumen de actividades (si el endpoint existe)
      let resumenActividades: ResumenActividades | undefined;
      try {
        resumenActividades = await this.getResumenActividades();
      } catch (error) {
        console.warn('Resumen de actividades no disponible:', error);
      }

      return {
        estadisticas,
        cursosAsignados,
        evaluacionesRecientes,
        resumenActividades,
      };
    } catch (error) {
      console.error('Error obteniendo datos del dashboard:', error);
      throw error;
    }
  },

  /**
   * Obtener cursos asignados al orientador
   */
  async getCursosAsignados(
    orientadorId?: number
  ): Promise<CursoAsignadoDetalle[]> {
    try {
      // Intenta usar el nuevo endpoint (recomendado)
      let cursos: Curso[];

      if (orientadorId) {
        // Si tenemos el ID, intentamos el endpoint específico
        try {
          cursos = await cursosService.findCursosAsignadosDocente(orientadorId);
        } catch (error) {
          console.warn(
            'Endpoint /cursos/asignados/:id no disponible, usando mis-cursos'
          );
          cursos = await cursosService.getMisCursos();
        }
      } else {
        // Usa el endpoint basado en JWT
        cursos = await cursosService.getMisCursos();
      }

      // Enriquecer cada curso con información adicional
      const cursosDetallados = await Promise.all(
        cursos.map(async (curso) => {
          try {
            // Obtener asignaturas del curso
            const asignaturas = curso.id_curso
              ? await asignaturasService.findByCurso(curso.id_curso)
              : [];

            // Obtener alumnos del curso para contar
            let alumnosCount = 0;
            if (curso.id_curso) {
              try {
                const alumnos = await cursosService.getAlumnosPorCurso(
                  curso.id_curso
                );
                alumnosCount = alumnos.length;
              } catch (error) {
                console.warn(
                  `No se pudo obtener alumnos del curso ${curso.id_curso}`
                );
              }
            }

            return {
              ...curso,
              asignaturas,
              alumnosCount,
            } as CursoAsignadoDetalle;
          } catch (error) {
            console.error(
              `Error procesando curso ${curso.id_curso}:`,
              error
            );
            return {
              ...curso,
              asignaturas: [],
              alumnosCount: 0,
            } as CursoAsignadoDetalle;
          }
        })
      );

      return cursosDetallados;
    } catch (error) {
      console.error('Error obteniendo cursos asignados:', error);
      throw error;
    }
  },

  /**
   * Calcular estadísticas del dashboard
   */
  async calcularEstadisticas(
    cursos: CursoAsignadoDetalle[],
    evaluaciones: Evaluacion[],
    asignaturas: Asignatura[]
  ): Promise<EstadisticasDashboard> {
    // Contar alumnos totales
    const alumnosTotal = cursos.reduce(
      (sum, curso) => sum + (curso.alumnosCount || 0),
      0
    );

    // Evaluaciones del mes actual
    const mesActual = new Date().getMonth() + 1;
    const evaluacionesEstesMes = evaluaciones.filter(
      (ev) => ev.mes === mesActual
    ).length;

    // Contar notas pendientes (evaluaciones sin completar)
    // Esto requeriría un endpoint específico, por ahora usamos estimación
    let notasPendientes = 0;
    try {
      // Intentar obtener notas pendientes de cada evaluación
      const evaluacionesPendientes = await Promise.all(
        evaluaciones.slice(0, 10).map(async (ev) => {
          try {
            const detalles =
              await evaluacionesService.getAlumnosConCalificaciones(
                ev.id_evaluacion
              );
            return detalles.total_alumnos - detalles.alumnos_calificados;
          } catch {
            return 0;
          }
        })
      );
      notasPendientes = evaluacionesPendientes.reduce(
        (sum, n) => sum + n,
        0
      );
    } catch (error) {
      console.warn('No se pudo calcular notas pendientes');
    }

    return {
      cursosAsignados: cursos.length,
      evaluacionesCreadas: evaluaciones.length,
      notasPendientes,
      alumnosTotal,
      promedioGeneral: 0, // Esto requiere un endpoint específico del backend
      evaluacionesEstesMes,
      asignaturasAsignadas: asignaturas.length,
    };
  },

  /**
   * Procesar evaluaciones recientes para mostrar en el dashboard
   */
  async procesarEvaluacionesRecientes(
    evaluaciones: Evaluacion[]
  ): Promise<EvaluacionReciente[]> {
    // Ordenar por fecha de creación (más recientes primero)
    const evaluacionesOrdenadas = [...evaluaciones].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Tomar las 5 más recientes
    const recientes = evaluacionesOrdenadas.slice(0, 5);

    // Enriquecer con información de progreso
    const evaluacionesEnriquecidas = await Promise.all(
      recientes.map(async (ev) => {
        try {
          const detalles =
            await evaluacionesService.getAlumnosConCalificaciones(
              ev.id_evaluacion
            );

          let estadoProgreso: EvaluacionReciente['estadoProgreso'] =
            'Pendiente';
          if (detalles.alumnos_calificados === detalles.total_alumnos) {
            estadoProgreso = 'Completada';
          } else if (detalles.alumnos_calificados > 0) {
            estadoProgreso = 'En Progreso';
          } else {
            // Verificar si la fecha ya pasó
            const fechaCreacion = new Date(ev.createdAt);
            const hoy = new Date();
            if (fechaCreacion > hoy) {
              estadoProgreso = 'Planificada';
            }
          }

          return {
            ...ev,
            notasIngresadas: detalles.alumnos_calificados,
            totalAlumnos: detalles.total_alumnos,
            estadoProgreso,
          } as EvaluacionReciente;
        } catch (error) {
          return {
            ...ev,
            estadoProgreso: 'Pendiente' as const,
          } as EvaluacionReciente;
        }
      })
    );

    return evaluacionesEnriquecidas;
  },

  /**
   * 📊 Obtener resumen de actividades
   * ⚠️ REQUIERE ENDPOINT EN BACKEND: GET /orientador/resumen-actividades
   */
  async getResumenActividades(): Promise<ResumenActividades> {
    try {
      const res = await api.get(`${base}/resumen-actividades`);
      return res.data as ResumenActividades;
    } catch (error) {
      // Si el endpoint no existe, retornar datos por defecto
      throw new Error(
        'Endpoint de resumen de actividades no disponible en el backend'
      );
    }
  },

  /**
   * 📈 Obtener estadísticas generales del orientador
   * ⚠️ REQUIERE ENDPOINT EN BACKEND: GET /orientador/estadisticas
   */
  async getEstadisticasGenerales(): Promise<EstadisticasDashboard> {
    try {
      const res = await api.get(`${base}/estadisticas`);
      return res.data as EstadisticasDashboard;
    } catch (error) {
      throw new Error(
        'Endpoint de estadísticas no disponible en el backend'
      );
    }
  },

  /**
   * 🎯 Obtener promedio general de todos los alumnos del orientador
   * ⚠️ REQUIERE ENDPOINT EN BACKEND: GET /orientador/promedio-general
   */
  async getPromedioGeneral(): Promise<number> {
    try {
      const res = await api.get<{ promedio: number }>(`${base}/promedio-general`);
      return res.data.promedio || 0;
    } catch (error) {
      console.warn('Endpoint de promedio general no disponible');
      return 0;
    }
  },
};
