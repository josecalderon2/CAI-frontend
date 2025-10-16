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

export interface HistorialQueryParams {
  page?: number;
  limit?: number;
  id_orientador?: number;
  id_asignatura?: number | null;
  id_curso?: number;
  anio_academico?: string | null;
  es_orientador?: boolean;
  estado?: 'abierto' | 'cerrado';
  all?: boolean;
  order?: 'asc' | 'desc';
}

export interface CreateHistorialDto {
  id_asignatura_orientador: number;
  id_curso: number;
  id_orientador: number;
  id_asignatura?: number;
  es_orientador?: boolean;
  anio_academico?: string;
  fecha_asignacion?: string;
  fecha_fin?: string;
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

// Interfaces para el historial
export interface HistorialItem {
  id_historial_curso_orientador: number;
  curso: {
    id_curso: number;
    nombre: string;
    seccion: string | null;
  };
  asignatura: {
    id_asignatura: number | null;
    nombre: string | null;
  };
  orientador: {
    id_orientador: number;
    nombreCompleto: string;
  };
  es_orientador: boolean;
  anio_academico: string | null;
  fecha_asignacion: string | null;
  fecha_fin: string | null;
  abierto: boolean;
}

export interface HistorialResponse {
  page: number;
  pageSize: number;
  total: number;
  count: number;
  data: HistorialItem[];
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
  // Obtener historial de asignaciones
  getHistorial: async (
    params: HistorialQueryParams = {}
  ): Promise<HistorialResponse> => {
    try {
      console.log('Solicitando historial con params:', params);

      // Creamos un objeto limpio con solo los parámetros admitidos por el backend
      const cleanParams: any = {};

      // Parámetros de paginación (siempre permitidos)
      // Convertimos explícitamente a enteros para prevenir errores de validación
      if (params.page !== undefined) {
        const pageNum = parseInt(String(params.page), 10);
        if (!isNaN(pageNum) && pageNum > 0) {
          cleanParams.page = pageNum;
        } else {
          cleanParams.page = 1; // Valor predeterminado válido
        }
      } else {
        cleanParams.page = 1; // Asegurar que siempre enviemos página 1 por defecto
      }

      if (params.limit !== undefined) {
        const limitNum = parseInt(String(params.limit), 10);
        if (!isNaN(limitNum) && limitNum > 0) {
          cleanParams.limit = limitNum;
        } else {
          cleanParams.limit = 10; // Valor predeterminado válido
        }
      } else {
        cleanParams.limit = 10; // Asegurar que siempre enviemos limit 10 por defecto
      }

      // Filtros específicos, solo pasamos valores válidos y definidos
      if (
        params.id_orientador !== undefined &&
        !isNaN(Number(params.id_orientador))
      ) {
        cleanParams.id_orientador = Number(params.id_orientador);
      }

      if (params.id_curso !== undefined && !isNaN(Number(params.id_curso))) {
        cleanParams.id_curso = Number(params.id_curso);
      }

      // Para asignatura, manejo especial para permitir nulos explícitos
      if (params.id_asignatura === null) {
        cleanParams.id_asignatura = null;
      } else if (
        params.id_asignatura !== undefined &&
        !isNaN(Number(params.id_asignatura))
      ) {
        cleanParams.id_asignatura = Number(params.id_asignatura);
      }

      // Año académico, validamos que sea un string no vacío
      if (
        params.anio_academico &&
        typeof params.anio_academico === 'string' &&
        params.anio_academico.trim() !== ''
      ) {
        cleanParams.anio_academico = params.anio_academico.trim();
      }

      // Estado (solo aceptamos valores específicos)
      if (params.estado === 'abierto' || params.estado === 'cerrado') {
        cleanParams.estado = params.estado;
      }

      // Es orientador (solo si es boolean explícito)
      if (params.es_orientador === true || params.es_orientador === false) {
        cleanParams.es_orientador = params.es_orientador;
      }

      // Nunca enviamos el parámetro all=true que podría estar causando problemas

      // Añadir orden si está especificado
      if (params.order === 'asc' || params.order === 'desc') {
        cleanParams.order = params.order;
      }

      console.log('URL de historial:', '/asignaciones/historial');
      console.log('Parámetros limpios enviados:', cleanParams);

      const response = await api.get<HistorialResponse>(
        '/asignaciones/historial',
        {
          params: cleanParams,
        }
      );

      console.log('Respuesta del historial recibida correctamente');

      // Verificamos si la respuesta tiene datos
      if (
        !response.data ||
        (typeof response.data === 'object' &&
          Object.keys(response.data).length === 0)
      ) {
        console.warn('La respuesta del historial está vacía');
        return {
          page: 1,
          pageSize: 10,
          total: 0,
          count: 0,
          data: [],
        };
      }

      // Si la respuesta viene directamente como un array en lugar de un objeto paginado
      if (Array.isArray(response.data)) {
        console.log('Respuesta es un array, convirtiendo a formato paginado');
        return {
          page: 1,
          pageSize: response.data.length,
          total: response.data.length,
          count: response.data.length,
          data: response.data,
        };
      }

      // Verificamos que la respuesta tenga la estructura esperada
      if (!response.data.data || !Array.isArray(response.data.data)) {
        console.warn(
          'La respuesta del historial no tiene el formato esperado:',
          response.data
        );
        return {
          page: 1,
          pageSize: 10,
          total: 0,
          count: 0,
          data: [],
        };
      }

      console.log('Datos de historial recibidos:', {
        total: response.data.total,
        count: response.data.count,
        page: response.data.page,
        dataLength: response.data.data.length,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error al obtener historial:', error);

      // Mostrar detalles específicos del error para diagnóstico
      if (error.response) {
        console.error(
          'Detalles del error:',
          error.response?.data || error.message
        );
        console.error('Status del error:', error.response?.status);
        console.error('Headers:', error.response?.headers);

        // Para errores 400 (Bad Request), mostrar detalles de validación
        if (error.response.status === 400 && error.response.data) {
          if (error.response.data.message) {
            console.error('Mensaje de error:', error.response.data.message);

            // Si hay errores específicos de validación, mostrarlos para diagnóstico
            if (Array.isArray(error.response.data.message)) {
              error.response.data.message.forEach(
                (msg: string, index: number) => {
                  console.error(`Validación ${index + 1}:`, msg);
                }
              );
            }
          }

          if (error.response.data.error) {
            console.error('Error detallado:', error.response.data.error);
          }
        }
      } else {
        console.error('Error sin respuesta del servidor:', error.message);
      }

      // Verificamos el tipo de error antes de asumir que no hay datos
      if (error.response && error.response.status === 404) {
        // Si el endpoint no existe o no hay datos (404 Not Found)
        console.log(
          'El endpoint de historial no existe o no se encontraron datos'
        );
        return {
          page: 1,
          pageSize: 10,
          total: 0,
          count: 0,
          data: [], // Array vacío para que el componente muestre "No se encontraron registros"
        };
      }

      // Para otros tipos de errores, lanzamos el error para que el componente pueda manejarlo
      // y mostrar mensajes de error apropiados
      console.error('Error al obtener historial, lanzando excepción');
      throw error;
    }
  },

  // Registrar un nuevo historial de asignación
  // Este endpoint debe ser llamado antes de actualizar una asignación
  // para mantener un registro histórico completo
  createHistorial: async (dto: CreateHistorialDto): Promise<any> => {
    try {
      console.log('Creando registro histórico:', dto);
      const response = await api.post('/asignaciones/create-historial', dto);
      console.log('Registro histórico creado:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al crear registro histórico:', error);
      throw error;
    }
  },
};

export default asignacionesService;
