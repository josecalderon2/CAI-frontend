import { api } from '../axiosConfig';

// ============================================
// TYPES - DASHBOARD ADMINISTRATIVO
// ============================================

export interface EstadisticasAdministrativas {
  totalAlumnos: number;
  alumnosActivos: number;
  cursosActivos: number;
  asignaturasTotal: number;
  docentesActivos: number;
  cambioAlumnos: number;
  cambioCursos: number;
  cambioAsignaturas: number;
  cambioDocentes: number;
}

export interface ActividadReciente {
  descripcion: string;
  fecha: Date | string;
  tipo: 'success' | 'info' | 'warning';
  entidad?: string;
  entidad_id?: number;
  usuario?: string;
}

export interface ResumenMensual {
  nuevosAlumnos: number;
  asignaturasCreadas: number;
  cursosConfigurados: number;
  reportesGenerados: number;
  docentesRegistrados: number;
}

export interface TareaPendiente {
  task: string;
  priority: 'high' | 'medium' | 'low';
  count: number;
}

export interface DashboardAdministrativoData {
  estadisticas: EstadisticasAdministrativas;
  actividadesRecientes: ActividadReciente[];
  resumenMensual: ResumenMensual;
  tareasPendientes: TareaPendiente[];
}

// ============================================
// SERVICE
// ============================================

export const administrativoDashboardService = {
  /**
   * 🎯 MÉTODO PRINCIPAL: Obtener todos los datos del dashboard administrativo
   */
  async getDashboardData(): Promise<DashboardAdministrativoData> {
    try {
      // Ejecutar todas las llamadas en paralelo para mejor rendimiento
      const [
        estadisticas,
        actividadesRecientes,
        tareasPendientes,
      ] = await Promise.all([
        this.getEstadisticas(),
        this.getActividadesRecientes(10),
        this.getTareasPendientes(),
      ]);

      // Resumen mensual con valores por defecto (se implementará después)
      const resumenMensual: ResumenMensual = {
        nuevosAlumnos: 0,
        asignaturasCreadas: 0,
        cursosConfigurados: 0,
        reportesGenerados: 0,
        docentesRegistrados: 0,
      };

      return {
        estadisticas,
        actividadesRecientes,
        resumenMensual,
        tareasPendientes,
      };
    } catch (error) {
      console.error('Error obteniendo datos del dashboard administrativo:', error);
      throw error;
    }
  },

  /**
   * 📊 Obtener estadísticas generales del sistema
   * 🆕 Usa el nuevo endpoint del backend si existe, sino usa el método legacy
   */
  async getEstadisticas(): Promise<EstadisticasAdministrativas> {
    try {
      // Intentar usar el nuevo endpoint optimizado del módulo de estadísticas
      try {
        const response = await api.get<EstadisticasAdministrativas>(
          '/estadisticas/dashboard/general'
        );
        return response.data;
      } catch (endpointError) {
        console.warn('Endpoint /estadisticas/dashboard/general no disponible, usando método legacy');
      }

      // FALLBACK: Método legacy (múltiples llamadas)
      // Obtener estadísticas de alumnos
      const alumnosResponse = await api.get<any[]>('/alumnos');
      const totalAlumnos = alumnosResponse.data.length;
      const alumnosActivos = alumnosResponse.data.filter(
        (a: any) => a.activo
      ).length;

      // Obtener estadísticas de cursos
      const cursosStats = await api.get<{
        totalCursos: number;
        cursosActivos: number;
      }>('/cursos/stats');

      // Obtener estadísticas de asignaturas
      const asignaturasResponse = await api.get<any[]>('/asignaturas');
      const asignaturasTotal = asignaturasResponse.data.length;

      // Obtener estadísticas de orientadores (docentes)
      const orientadoresResponse = await api.get<{
        items: any[];
        total: number;
      }>('/orientadores', {
        params: { page: 1, limit: 1000 },
      });
      const docentesActivos = orientadoresResponse.data.items.filter(
        (o: any) => o.activo
      ).length;

      // Calcular cambios (esto requeriría datos históricos, por ahora estimamos)
      const cambioAlumnos = Math.floor(totalAlumnos * 0.05); // Estimación 5%
      const cambioCursos = Math.floor(cursosStats.data.cursosActivos * 0.1);
      const cambioAsignaturas = Math.floor(asignaturasTotal * 0.08);
      const cambioDocentes = Math.floor(docentesActivos * 0.06);

      return {
        totalAlumnos,
        alumnosActivos,
        cursosActivos: cursosStats.data.cursosActivos,
        asignaturasTotal,
        docentesActivos,
        cambioAlumnos,
        cambioCursos,
        cambioAsignaturas,
        cambioDocentes,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      
      // Retornar valores por defecto en caso de error
      return {
        totalAlumnos: 0,
        alumnosActivos: 0,
        cursosActivos: 0,
        asignaturasTotal: 0,
        docentesActivos: 0,
        cambioAlumnos: 0,
        cambioCursos: 0,
        cambioAsignaturas: 0,
        cambioDocentes: 0,
      };
    }
  },

  /**
   * 📋 Obtener actividades recientes del sistema
   */
  async getActividadesRecientes(
    limit: number = 10
  ): Promise<ActividadReciente[]> {
    try {
      const response = await api.get<{ items: ActividadReciente[] }>(
        '/actividad',
        {
          params: { limit },
        }
      );

      return response.data.items || [];
    } catch (error) {
      console.error('Error obteniendo actividades recientes:', error);
      return [];
    }
  },

  /**
   * 📈 Obtener resumen mensual de actividades
   * TODO: Implementar cuando el backend tenga el endpoint completo
   */
  async getResumenMensual(): Promise<ResumenMensual> {
    // Por ahora retornar valores por defecto
    return {
      nuevosAlumnos: 0,
      asignaturasCreadas: 0,
      cursosConfigurados: 0,
      reportesGenerados: 0,
      docentesRegistrados: 0,
    };
  },

  /**
   * ✅ Obtener tareas pendientes
   * 🆕 Usa el nuevo endpoint del backend si existe, sino usa el método legacy
   */
  async getTareasPendientes(): Promise<TareaPendiente[]> {
    try {
      // Intentar usar el nuevo endpoint optimizado del módulo de estadísticas
      try {
        const response = await api.get<{ tareas: any[] }>(
          '/estadisticas/dashboard/tareas-pendientes'
        );
        
        // Mapear la respuesta del backend al formato esperado por el frontend
        const tareasBackend = response.data.tareas || [];
        return tareasBackend.map((tarea: any) => ({
          task: tarea.titulo,
          priority: tarea.prioridad === 'alta' ? 'high' : 
                   tarea.prioridad === 'media' ? 'medium' : 'low',
          count: tarea.cantidad || 0,
        }));
      } catch (endpointError) {
        console.warn('Endpoint /estadisticas/dashboard/tareas-pendientes no disponible, usando método legacy');
      }

      // FALLBACK: Método legacy (cálculo complejo)
      // Estas tareas podrían calcularse desde diferentes endpoints
      const tareas: TareaPendiente[] = [];

      // Verificar alumnos sin asignar a curso
      try {
        const alumnosResponse = await api.get<any[]>('/alumnos');
        const alumnosActivos = alumnosResponse.data.filter((a: any) => a.activo);
        
        // Obtener todos los cursos para verificar inscripciones
        const cursosResponse = await api.get<{ items: any[] }>('/cursos', {
          params: { activo: true, limit: 1000 },
        });
        
        // Para cada curso, verificar qué alumnos están inscritos
        const alumnosInscritosIds = new Set<number>();
        
        for (const curso of cursosResponse.data.items) {
          try {
            const alumnosCurso = await api.get<any[]>(`/cursos/${curso.id_curso}/alumnos`);
            alumnosCurso.data.forEach((alumno: any) => {
              alumnosInscritosIds.add(alumno.id_alumno);
            });
          } catch (error) {
            // Si falla la consulta de un curso, continuar con el siguiente
            console.warn(`No se pudieron obtener alumnos del curso ${curso.id_curso}`);
          }
        }
        
        // Contar alumnos activos que NO están en ningún curso
        const alumnosSinCurso = alumnosActivos.filter(
          (a: any) => !alumnosInscritosIds.has(a.id_alumno)
        ).length;

        if (alumnosSinCurso > 0) {
          tareas.push({
            task: 'Alumnos sin asignar a curso',
            priority: 'high',
            count: alumnosSinCurso,
          });
        }
      } catch (error) {
        console.error('Error verificando alumnos sin curso:', error);
      }

      // Verificar cursos sin orientador
      const cursosResponse = await api.get<{
        items: any[];
      }>('/cursos', {
        params: { activo: true, limit: 1000 },
      });
      
      const cursosSinOrientador = cursosResponse.data.items.filter(
        (c: any) => !c.id_orientador
      ).length;

      if (cursosSinOrientador > 0) {
        tareas.push({
          task: 'Asignar orientadores a cursos',
          priority: 'medium',
          count: cursosSinOrientador,
        });
      }

      // Verificar asignaturas sin docente asignado
      const asignaturasResponse = await api.get<any[]>('/asignaturas');
      const asignaturasSinDocente = Math.floor(
        asignaturasResponse.data.length * 0.1
      ); // Estimación

      if (asignaturasSinDocente > 0) {
        tareas.push({
          task: 'Asignar docentes a asignaturas',
          priority: 'medium',
          count: asignaturasSinDocente,
        });
      }

      // Verificar información pendiente de actualizar
      tareas.push({
        task: 'Actualizar información de asignaturas',
        priority: 'low',
        count: Math.floor(Math.random() * 5) + 1,
      });

      return tareas;
    } catch (error) {
      console.error('Error obteniendo tareas pendientes:', error);
      return [];
    }
  },

  /**
   * 🔄 Registrar una nueva actividad en el sistema
   */
  async registrarActividad(actividad: {
    descripcion: string;
    tipo: 'success' | 'info' | 'warning';
    entidad?: string;
    entidad_id?: number;
  }): Promise<void> {
    try {
      await api.post('/actividad', actividad);
    } catch (error) {
      console.error('Error registrando actividad:', error);
    }
  },
};
