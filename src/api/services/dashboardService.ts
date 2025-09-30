import { api } from '../axiosConfig';

/**
 * Obtiene estadísticas del personal (usuarios registrados)
 * @returns Objeto con conteo detallado del personal
 */
export const obtenerEstadisticasPersonal = async () => {
  try {
    console.log('Obteniendo estadísticas de personal...');
    const response = await api.get('/estadisticas/personal/total');
    console.log(
      'Respuesta de estadísticas de personal:',
      response.status,
      response.data
    );
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas de personal:', error);
    // Devolver datos por defecto en caso de error
    return {
      detalles: {
        administrativos: 0,
        orientadores: 0,
        administrativosPorCargo: [],
      },
      totalUsuariosRegistrados: 0,
    };
  }
};

/**
 * Obtiene todos los alumnos registrados en el sistema
 * @returns Lista de alumnos o número total de alumnos
 */
export const obtenerTotalAlumnos = async () => {
  try {
    console.log('Obteniendo total de alumnos...');
    const response = await api.get('/alumnos');
    console.log('Respuesta de alumnos:', response.status);

    const data = response.data;
    // Si viene paginado, tomamos la propiedad "total"
    if (
      data &&
      typeof data === 'object' &&
      'total' in data &&
      (data as { total?: number }).total !== undefined
    ) {
      console.log(
        'Total alumnos (de paginado):',
        (data as { total: number }).total
      );
      return (data as { total: number }).total;
    }

    // Si es un array, contamos los elementos
    if (Array.isArray(data)) {
      console.log('Total alumnos (contando array):', data.length);
      return data.length;
    }

    // Si viene la propiedad items (array), contamos esos elementos
    if (
      data &&
      typeof data === 'object' &&
      'items' in data &&
      Array.isArray((data as { items?: unknown[] }).items)
    ) {
      console.log(
        'Total alumnos (de items):',
        (data as { items: unknown[] }).items.length
      );
      return (data as { items: unknown[] }).items.length;
    }

    return 0;
  } catch (error) {
    console.error('Error al obtener total de alumnos:', error);
    return 0;
  }
};

/**
 * Obtiene todos los cursos registrados en el sistema
 * @returns Total de cursos
 */
export const obtenerTotalCursos = async () => {
  try {
    console.log('Obteniendo total de cursos...');
    const response = await api.get('/cursos');

    const data = response.data;
    // Si viene paginado, tomamos la propiedad "total"
    if (
      data &&
      typeof data === 'object' &&
      (data as { total?: number }).total !== undefined
    ) {
      return (data as { total: number }).total;
    }

    // Si es un array, contamos los elementos
    if (Array.isArray(data)) {
      return data.length;
    }

    // Si viene la propiedad items (array), contamos esos elementos
    if (
      data &&
      (data as { items?: unknown[] }).items &&
      Array.isArray((data as { items?: unknown[] }).items)
    ) {
      return (data as { items: unknown[] }).items.length;
    }

    return 0;
  } catch (error) {
    console.error('Error al obtener total de cursos:', error);
    return 0;
  }
};

/**
 * Obtiene todas las asignaturas registradas en el sistema
 * @returns Total de asignaturas
 */
export const obtenerTotalAsignaturas = async () => {
  try {
    console.log('Obteniendo total de asignaturas...');
    const response = await api.get('/asignaturas');

    const data = response.data;
    // Si viene paginado, tomamos la propiedad "total"
    if (
      data &&
      typeof data === 'object' &&
      (data as { total?: number }).total !== undefined
    ) {
      return (data as { total: number }).total;
    }

    // Si es un array, contamos los elementos
    if (Array.isArray(data)) {
      return data.length;
    }

    // Si viene la propiedad items (array), contamos esos elementos
    if (
      data &&
      (data as { items?: unknown[] }).items &&
      Array.isArray((data as { items?: unknown[] }).items)
    ) {
      return (data as { items: unknown[] }).items.length;
    }

    return 0;
  } catch (error) {
    console.error('Error al obtener total de asignaturas:', error);
    return 0;
  }
};

/**
 * Obtiene la actividad reciente en el sistema
 * @returns Lista de actividades recientes
 */
export const obtenerActividadReciente = async () => {
  try {
    console.log('Obteniendo actividad reciente...');
    const response = await api.get('/actividad');

    const data = response.data;

    // Si es un array, lo devolvemos directamente
    if (Array.isArray(data)) {
      return data;
    }

    // Si viene la propiedad items (array), devolvemos esos elementos
    if (data && Array.isArray((data as { items?: unknown[] }).items)) {
      return (data as { items: unknown[] }).items;
    }

    return [];
  } catch (error) {
    console.error('Error al obtener actividad reciente:', error);
    return [];
  }
};
