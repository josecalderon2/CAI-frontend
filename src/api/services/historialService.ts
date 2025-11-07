import { api } from '../axiosConfig';

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

export interface HistorialQueryParams {
  page?: number;
  limit?: number;
  id_orientador?: number;
  id_asignatura?: number | null;
  id_curso?: number;
  anio_academico?: string | null;
  es_orientador?: boolean;
  estado?: 'abierto' | 'cerrado';
  order?: 'asc' | 'desc';
}

// Servicio para el historial de asignaciones - Simplificado para evitar errores
const historialService = {
  // Método de emergencia para obtener el historial de forma directa sin parámetros
  getHistorialDirecto: async (): Promise<HistorialResponse> => {
    try {
      // Intentar una petición simple sin params
      const response = await api.get('/asignaciones/historial');

      // Manejo seguro de datos
      const responseData = response.data as any;

      return {
        page: 1,
        pageSize: 10,
        total:
          responseData && typeof responseData === 'object'
            ? responseData.total || 0
            : 0,
        count:
          responseData && typeof responseData === 'object'
            ? responseData.count || 0
            : 0,
        data: Array.isArray(responseData)
          ? responseData
          : responseData &&
              typeof responseData === 'object' &&
              Array.isArray(responseData.data)
            ? responseData.data
            : [],
      };
    } catch (error) {
      console.error('Error en método de emergencia:', error);
      return {
        page: 1,
        pageSize: 10,
        total: 0,
        count: 0,
        data: [],
      };
    }
  },

  // Registrar un nuevo historial - Con verificación de autenticación
  createHistorial: async (dto: CreateHistorialDto): Promise<any> => {
    try {
      // Verificar que hay un token en localStorage
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('Error: No hay token de autenticación');
        throw new Error('No autorizado: Inicie sesión nuevamente');
      }

      // Incluir token explícitamente
      const response = await api.post('/asignaciones/create-historial', dto, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error al crear historial:', error);

      // Manejo específico para error 401
      if (error.response && error.response.status === 401) {
        console.error('Error 401: No autorizado - Token inválido o expirado');
      }

      throw error;
    }
  },

  // Obtener historial de asignaciones - Método simplificado sin parámetros
  getHistorial: async (): Promise<HistorialResponse> => {
    try {
      // Verificar que hay un token en localStorage
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('Error: No hay token de autenticación');
        throw new Error('No autorizado: Inicie sesión nuevamente');
      }

      // Llamada simple sin parámetros para evitar problemas con la URL
      const response = await api.get('/asignaciones/historial', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Validar que la respuesta tiene la estructura esperada
      const responseData = response.data as any;
      if (responseData) {
        // Si falta algún campo, añadirlo con valores por defecto
        return {
          page: responseData.page || 1,
          pageSize: responseData.pageSize || 10,
          total: responseData.total || 0,
          count: responseData.count || 0,
          data: Array.isArray(responseData.data) ? responseData.data : [],
        };
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error: any) {
      console.error('Error al obtener historial:', error);

      // Manejo específico para error 401
      if (error.response && error.response.status === 401) {
        console.error('Error 401: No autorizado - Token inválido o expirado');
        // Podríamos redirigir al login o mostrar un mensaje específico
      }

      // Devolver un objeto vacío con la estructura esperada para evitar errores
      return {
        page: 1,
        pageSize: 10,
        total: 0,
        count: 0,
        data: [],
      };
    }
  },
};

export default historialService;
