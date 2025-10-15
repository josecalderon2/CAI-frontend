import { api } from '../axiosConfig';

// Definición de tipos
export interface CreateAsignacionDto {
  id_asignatura: number;
  id_orientador: number;
  anio_academico: string;
  fecha_asignacion?: string;
  activo?: boolean;
  id_curso?: number;
  cargaHorariaSemanal?: number;
  es_orientador?: boolean;
}

export interface UpdateAsignacionDto {
  id_asignatura?: number;
  id_orientador?: number;
  anio_academico?: string;
  fecha_asignacion?: string;
  fecha_fin?: string;
  activo?: boolean;
  nombre_asignatura?: string;
  cargaHorariaSemanal?: number;
  id_curso?: number;
  curso_nombre?: string;
  seccion?: string;
  orientador_principal_id?: number;
  es_orientador?: boolean;
}

export interface AsignacionesQueryParams {
  q?: string;
  page?: number;
  limit?: number;
  estado?: 'ACTIVO' | 'INACTIVO' | 'FINALIZADO';
  id_orientador?: number;
  id_asignatura?: number;
  id_curso?: number;
  anio_academico?: string;
  use_mv?: boolean;
  soloOrientador?: boolean;
}

// Tipos para la respuesta del backend
export interface Orientador {
  id_orientador: number;
  nombreCompleto: string;
  email?: string;
  especialidad?: string;
}

export interface Curso {
  id_curso: number;
  nombre: string;
  seccion?: string | null;
  id_orientador?: number | null;
  orientador?: Orientador | null;
}

export interface Asignatura {
  id_asignatura: number;
  nombre: string;
  orden_en_reporte?: string | null;
  horas_semanas?: number | null;
}

export interface Asignacion {
  id_asignatura_orientador: number;
  docente: Orientador;
  curso: Curso;
  asignatura: Asignatura;
  cargaHorariaSemanal: number;
  fechaAsignacion: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'FINALIZADO';
  esOrientador: boolean;
  anio_academico?: string | null;
}

export interface AsignacionesResponse {
  page: number;
  pageSize: number;
  total: number;
  count: number;
  data: Asignacion[];
}

// Servicio de asignaciones
const asignacionesService = {
  // Obtener asignaciones
  getAsignaciones: async (
    params: AsignacionesQueryParams = {}
  ): Promise<AsignacionesResponse> => {
    try {
      const response = await api.get<AsignacionesResponse>('/asignaciones', {
        params,
      });

      // Si la respuesta viene directamente como un array en lugar de un objeto paginado
      if (Array.isArray(response.data)) {
        return {
          page: 1,
          pageSize: response.data.length,
          total: response.data.length,
          count: response.data.length,
          data: response.data,
        };
      }

      return response.data;
    } catch (error) {
      // Devolver una respuesta vacía en caso de error para evitar bloqueos
      return {
        page: 1,
        pageSize: 10,
        total: 0,
        count: 0,
        data: [],
      };
    }
  },

  // Obtener una asignación por ID
  getAsignacionById: async (id: number): Promise<Asignacion> => {
    try {
      const response = await api.get<Asignacion>(`/asignaciones/${id}`);
      return response.data;
    } catch (error) {
      // Error al obtener la asignación
      throw error;
    }
  },

  // Crear una nueva asignación
  createAsignacion: async (
    asignacion: CreateAsignacionDto
  ): Promise<Asignacion> => {
    try {
      // Log para debug
      console.log('Service - enviando asignación:', asignacion);

      const response = await api.post<Asignacion>('/asignaciones', asignacion);
      console.log('Service - respuesta recibida:', response.data);
      return response.data;
    } catch (error) {
      // Error al crear la asignación
      console.error('Service - error al crear asignación:', error);
      throw error;
    }
  },

  // Actualizar una asignación existente
  updateAsignacion: async (
    id: number,
    asignacion: UpdateAsignacionDto
  ): Promise<Asignacion> => {
    try {
      const response = await api.patch<Asignacion>(
        `/asignaciones/${id}`,
        asignacion
      );
      return response.data;
    } catch (error) {
      // Error al actualizar la asignación
      throw error;
    }
  },

  // Eliminar una asignación (soft delete)
  deleteAsignacion: async (id: number): Promise<Asignacion> => {
    try {
      const response = await api.delete<Asignacion>(`/asignaciones/${id}`);
      return response.data;
    } catch (error) {
      // Error al eliminar la asignación
      throw error;
    }
  },

  // Obtener orientadores (docentes) para dropdowns usando el endpoint específico
  getOrientadores: async (): Promise<Orientador[]> => {
    try {
      // Usar el endpoint específico para listar orientadores (all)
      const response = await api.get<any>('/orientador/all');

      // Si la respuesta es directamente un array
      if (Array.isArray(response.data)) {
        return response.data.map((o: any) => ({
          id_orientador: o.id_orientador || o.id || 0,
          nombreCompleto: o.nombreCompleto || o.nombre || 'Sin nombre',
          email: o.email || '',
          especialidad: o.especialidad || '',
        }));
      }

      // Si la respuesta tiene una estructura con datos anidados
      if (response.data && typeof response.data === 'object') {
        // Verificar si los datos están en .data
        if (response.data.data && Array.isArray(response.data.data)) {
          return response.data.data.map((o: any) => ({
            id_orientador: o.id_orientador || o.id || 0,
            nombreCompleto: o.nombreCompleto || o.nombre || 'Sin nombre',
            email: o.email || '',
            especialidad: o.especialidad || '',
          }));
        }

        // Verificar si los datos están en .items
        if (response.data.items && Array.isArray(response.data.items)) {
          return response.data.items.map((o: any) => ({
            id_orientador: o.id_orientador || o.id || 0,
            nombreCompleto: o.nombreCompleto || o.nombre || 'Sin nombre',
            email: o.email || '',
            especialidad: o.especialidad || '',
          }));
        }

        // Verificar si los datos están en .orientadores
        if (
          response.data.orientadores &&
          Array.isArray(response.data.orientadores)
        ) {
          return response.data.orientadores.map((o: any) => ({
            id_orientador: o.id_orientador || o.id || 0,
            nombreCompleto: o.nombreCompleto || o.nombre || 'Sin nombre',
            email: o.email || '',
            especialidad: o.especialidad || '',
          }));
        }

        // Si es un solo objeto con los campos necesarios
        if (response.data.id_orientador && response.data.nombreCompleto) {
          return [
            {
              id_orientador: response.data.id_orientador,
              nombreCompleto: response.data.nombreCompleto,
              email: response.data.email || '',
              especialidad: response.data.especialidad || '',
            },
          ];
        }
      }

      // Si llegamos aquí, no se encontraron orientadores en el formato esperado
      throw new Error(
        'No se encontraron orientadores en la respuesta del servidor'
      );
    } catch (error: any) {
      // Verificar si es un error de autenticación
      if (error?.response?.status === 401) {
        throw new Error(
          'No tienes autorización para acceder a este recurso. Por favor, inicia sesión nuevamente.'
        );
      }

      // Intentar obtener orientadores desde las asignaciones como alternativa
      try {
        const asignacionesResponse =
          await api.get<AsignacionesResponse>('/asignaciones');

        if (asignacionesResponse.data && asignacionesResponse.data.data) {
          // Extraer orientadores únicos de las asignaciones
          const orientadoresMap = new Map<number, Orientador>();

          asignacionesResponse.data.data.forEach((asignacion) => {
            if (asignacion.docente && asignacion.docente.id_orientador) {
              orientadoresMap.set(asignacion.docente.id_orientador, {
                id_orientador: asignacion.docente.id_orientador,
                nombreCompleto:
                  asignacion.docente.nombreCompleto || 'Sin nombre',
                email: asignacion.docente.email || '',
                especialidad: asignacion.docente.especialidad || '',
              });
            }
          });

          const orientadoresFromAsignaciones = Array.from(
            orientadoresMap.values()
          );

          if (orientadoresFromAsignaciones.length > 0) {
            return orientadoresFromAsignaciones;
          }
        }

        throw new Error('No se encontraron orientadores en las asignaciones');
      } catch (fallbackError) {
        throw new Error(
          'No se pudieron obtener los orientadores. Verifique la conexión con el servidor.'
        );
      }
    }
  },

  // Obtener cursos directamente del endpoint regular
  getCursos: async (): Promise<Curso[]> => {
    try {
      const response = await api.get<any>('/cursos');

      // Manejar diferentes formatos de respuesta
      let cursos: Curso[] = [];
      if (Array.isArray(response.data)) {
        cursos = response.data;
      } else if (
        response.data &&
        response.data.items &&
        Array.isArray(response.data.items)
      ) {
        cursos = response.data.items;
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        cursos = response.data.data;
      } else if (response.data) {
        try {
          // Intentar convertir a array si es posible
          const datos = response.data;
          cursos = Array.isArray(datos) ? datos : [];
        } catch (e) {
          throw new Error(
            'No se pudo convertir la respuesta a array de cursos'
          );
        }
      }

      if (cursos.length === 0) {
        throw new Error('No se encontraron cursos en la respuesta');
      }

      return cursos;
    } catch (error: any) {
      // Verificar si es un error de autenticación
      if (error?.response?.status === 401) {
        throw new Error(
          'No tienes autorización para acceder a este recurso. Por favor, inicia sesión nuevamente.'
        );
      }

      throw new Error(
        'No se pudo conectar con el backend para obtener datos de cursos'
      );
    }
  },

  // Obtener todos los cursos incluyendo inactivos (para el formulario de creación)
  getCursosAll: async (): Promise<Curso[]> => {
    try {
      const response = await api.get<any>('/cursos/all');

      // Manejar diferentes formatos de respuesta
      let cursos: Curso[] = [];
      if (Array.isArray(response.data)) {
        cursos = response.data;
      } else if (
        response.data &&
        response.data.items &&
        Array.isArray(response.data.items)
      ) {
        cursos = response.data.items;
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        cursos = response.data.data;
      } else if (response.data) {
        try {
          // Intentar convertir a array si es posible
          const datos = response.data;
          cursos = Array.isArray(datos) ? datos : [];
        } catch (e) {
          throw new Error(
            'No se pudo convertir la respuesta a array de cursos'
          );
        }
      }

      if (cursos.length === 0) {
        throw new Error('No se encontraron cursos en la respuesta');
      }

      return cursos;
    } catch (error: any) {
      // Verificar si es un error de autenticación
      if (error?.response?.status === 401) {
        throw new Error(
          'No tienes autorización para acceder a este recurso. Por favor, inicia sesión nuevamente.'
        );
      }

      throw new Error(
        'No se pudo conectar con el backend para obtener datos de cursos'
      );
    }
  },

  // Obtener asignaturas directamente del endpoint
  getAsignaturas: async (): Promise<Asignatura[]> => {
    try {
      const response = await api.get<any>('/asignaturas');

      // Manejar diferentes formatos de respuesta
      let asignaturas: Asignatura[] = [];
      if (Array.isArray(response.data)) {
        asignaturas = response.data;
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        asignaturas = response.data.data;
      } else if (
        response.data &&
        response.data.items &&
        Array.isArray(response.data.items)
      ) {
        asignaturas = response.data.items;
      } else if (response.data) {
        try {
          // Intentar convertir a array si es posible
          const datos = response.data;
          asignaturas = Array.isArray(datos) ? datos : [];
        } catch (e) {
          throw new Error(
            'No se pudo convertir la respuesta a array de asignaturas'
          );
        }
      }

      if (asignaturas.length === 0) {
        throw new Error('No se encontraron asignaturas en la respuesta');
      }

      return asignaturas;
    } catch (error: any) {
      // Verificar si es un error de autenticación
      if (error?.response?.status === 401) {
        throw new Error(
          'No tienes autorización para acceder a este recurso. Por favor, inicia sesión nuevamente.'
        );
      }

      throw new Error(
        'No se pudo conectar con el backend para obtener datos de asignaturas'
      );
    }
  },

  // Obtener asignaturas por curso específico
  getAsignaturasPorCurso: async (cursoId: number): Promise<Asignatura[]> => {
    try {
      const response = await api.get<any>(`/asignaturas/curso/${cursoId}`);

      // Manejar diferentes formatos de respuesta
      let asignaturas: Asignatura[] = [];
      if (Array.isArray(response.data)) {
        asignaturas = response.data;
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        asignaturas = response.data.data;
      } else if (
        response.data &&
        response.data.items &&
        Array.isArray(response.data.items)
      ) {
        asignaturas = response.data.items;
      } else if (response.data) {
        try {
          // Intentar convertir a array si es posible
          const datos = response.data;
          asignaturas = Array.isArray(datos) ? datos : [];
        } catch (e) {
          throw new Error(
            'No se pudo convertir la respuesta a array de asignaturas por curso'
          );
        }
      }

      return asignaturas;
    } catch (error: any) {
      // Verificar si es un error de autenticación
      if (error?.response?.status === 401) {
        throw new Error(
          'No tienes autorización para acceder a este recurso. Por favor, inicia sesión nuevamente.'
        );
      }

      throw new Error(
        `No se pudieron obtener las asignaturas para el curso ID ${cursoId}`
      );
    }
  },
};

export default asignacionesService;
