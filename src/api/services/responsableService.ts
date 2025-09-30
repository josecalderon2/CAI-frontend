/**
 * Servicios específicos para gestionar responsables
 */

/**
 * Actualiza solo los datos de un responsable específico
 * Esta función es útil cuando solo quieres acizar un responsable sin tocar el resto del alumno
 * @param responsableId ID del responsable a actualizar
 * @param datos Datos del responsable a actualizar
 * @returns Datos actualizados del responsable
 */
export const actualizarSoloResponsable = async (
  responsableId: number,
  datos: Record<string, any>
) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  // Limpiamos los datos para evitar errores
  const datosLimpios: Record<string, any> = {};

  // Incluimos todos los campos, incluso los que tienen cadena vacía
  Object.entries(datos).forEach(([key, value]) => {
    // Incluimos todos los valores, incluso cadenas vacías
    if (key !== 'firmaFoto') {
      // Tratamiento especial para email y religion
      if (key === 'email' || key === 'religion') {
        datosLimpios[key] =
          value === undefined || value === null || value === ''
            ? ''
            : String(value);
      } else {
        // Para el resto de campos
        datosLimpios[key] = value === undefined || value === null ? '' : value;
      }
    }
  });

  try {
    const response = await fetch(`${apiUrl}/responsables/${responsableId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(datosLimpios),
    });

    if (!response.ok) {
      const errorText = await response.text();

      let detalleError;
      try {
        detalleError = JSON.parse(errorText);
      } catch (e) {
        detalleError = { mensaje: errorText };
      }

      throw new Error(
        `Error ${response.status}: ${detalleError.message || detalleError.error || response.statusText}`
      );
    }

    // Si la respuesta tiene contenido, la parseamos
    if (response.status !== 204) {
      return await response.json();
    }

    // Si no tiene contenido (204 No Content), devolvemos éxito
    return { success: true, id: responsableId };
  } catch (error: any) {
    throw error;
  }
};

/**
 * Actualiza la relación entre un alumno y un responsable
 * @param alumnoId ID del alumno
 * @param relacionId ID de la relación (o ID del responsable en la relación)
 * @param datosRelacion Datos de la relación a actualizar
 * @returns Datos actualizados de la relación
 */
export const actualizarRelacionResponsable = async (
  alumnoId: number,
  relacionId: number,
  datosRelacion: Record<string, any>
) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  try {
    console.log(
      `Actualizando relación alumno ${alumnoId} - responsable ${relacionId}`,
      datosRelacion
    );

    const response = await fetch(
      `${apiUrl}/alumnos/${alumnoId}/responsables/${relacionId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(datosRelacion),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      let detalleError;
      try {
        detalleError = JSON.parse(errorText);
      } catch (e) {
        detalleError = { mensaje: errorText };
      }

      throw new Error(
        `Error ${response.status}: ${detalleError.message || detalleError.error || response.statusText}`
      );
    }

    return await response.json();
  } catch (error: any) {
    throw error;
  }
};

/**
 * Función para obtener los datos de un responsable específico
 * @param responsableId ID del responsable a consultar
 * @returns Datos del responsable
 */
export const obtenerDatosResponsable = async (responsableId: number) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  try {
    const response = await fetch(`${apiUrl}/responsables/${responsableId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Error al obtener responsable (status: ${response.status}):`,
        errorText
      );

      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    throw error;
  }
};
