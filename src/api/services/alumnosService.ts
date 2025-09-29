// Funciones para las operaciones PATCH de alumnos

// Definiciones de tipos necesarias (en lugar de importar)
interface DatosResponsable {
  nombre: string;
  apellido: string;
  dui: string;
  telefono: string;
  email: string | null;
  direccion: string;
  lugarTrabajo: string | null;
  profesionOficio: string;
  ultimoGradoEstudiado: string | null;
  ocupacion: string;
  religion: string | null;
  zonaResidencia: string;
  estadoFamiliar: string;
  empresaTransporte: string | null;
  placaVehiculo: string | null;
  tipoVehiculo: string | null;
  firmaFoto: string | null;
}

interface ResponsableRelacion {
  parentescoId: number | null;
  parentescoLibre: string;
  esPrincipal: boolean;
  firma: boolean;
  permiteTraslado: boolean;
  puedeRetirarAlumno: boolean;
  contactoEmergencia: boolean;
  datosResponsable: DatosResponsable;
}

interface Alumno {
  id_alumno?: number;
  nombre: string;
  apellido: string;
  genero: string;
  fechaNacimiento: string;
  nacionalidad: string;
  // Otros campos de alumno según necesidad
}

/**
 * Actualiza solo los datos básicos de un alumno
 * @param alumnoId ID del alumno a actualizar
 * @param datosBasicos Objeto con los datos básicos a actualizar
 */
export const actualizarDatosBasicos = async (
  alumnoId: number,
  datosBasicos: Partial<Alumno>
) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  try {
    const response = await fetch(`${apiUrl}/alumnos/${alumnoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(datosBasicos),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        'Error al actualizar datos básicos:',
        response.status,
        errorData
      );
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error en la actualización de datos básicos:', error);
    throw error;
  }
};

/**
 * Agrega un nuevo responsable a un alumno existente
 * @param alumnoId ID del alumno
 * @param nuevoResponsable Objeto con los datos del nuevo responsable
 */
export const agregarResponsable = async (
  alumnoId: number,
  nuevoResponsable: ResponsableRelacion
) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  try {
    console.log(
      `Agregando nuevo responsable para alumno ${alumnoId}`,
      nuevoResponsable
    );

    // Nos aseguramos de que la estructura sea correcta para el API
    const datosRelacion: Record<string, any> = {
      parentescoId: nuevoResponsable.parentescoId || null,
      parentescoLibre: nuevoResponsable.parentescoLibre || '',
      esPrincipal: Boolean(nuevoResponsable.esPrincipal),
      firma: Boolean(nuevoResponsable.firma),
      permiteTraslado: Boolean(nuevoResponsable.permiteTraslado),
      puedeRetirarAlumno: Boolean(nuevoResponsable.puedeRetirarAlumno),
      contactoEmergencia: Boolean(nuevoResponsable.contactoEmergencia),
    };

    // Si tenemos datos del responsable, los incluimos correctamente
    if (nuevoResponsable.datosResponsable) {
      // Filtramos campos nulos o undefined para evitar errores
      const datosResponsableClean: Record<string, any> = {};

      Object.entries(nuevoResponsable.datosResponsable).forEach(
        ([key, value]) => {
          if (key !== 'firmaFoto' && value !== undefined && value !== null) {
            datosResponsableClean[key] = value;
          }
        }
      );

      datosRelacion.datosResponsable = datosResponsableClean;
    }

    // Usamos el endpoint específico para crear un nuevo responsable
    const response = await fetch(`${apiUrl}/alumnos/${alumnoId}/responsables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(datosRelacion),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        'Error al agregar responsable:',
        response.status,
        errorData
      );
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al agregar responsable:', error);
    throw error;
  }
};

/**
 * Actualiza la relación entre un alumno y un responsable
 * @param alumnoId ID del alumno
 * @param relacionId ID de la relación alumno-responsable
 * @param datosRelacion Datos de la relación a actualizar
 */
export const actualizarRelacionResponsable = async (
  alumnoId: number,
  relacionId: number,
  datosRelacion: Partial<ResponsableRelacion>
) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  try {
    // Log para verificar los valores antes de enviar
    console.log('Enviando datos de relación:', {
      ...datosRelacion,
      contactoEmergencia:
        datosRelacion.contactoEmergencia === true ? true : false,
    });

    // Preparar los datos para envío
    const datosEnvio: Record<string, any> = {};

    // Primero procesamos los campos booleanos con conversión explícita
    if ('contactoEmergencia' in datosRelacion) {
      datosEnvio.contactoEmergencia =
        datosRelacion.contactoEmergencia === true ? true : false;
    }
    if ('firma' in datosRelacion) {
      datosEnvio.firma = datosRelacion.firma === true ? true : false;
    }
    if ('permiteTraslado' in datosRelacion) {
      datosEnvio.permiteTraslado =
        datosRelacion.permiteTraslado === true ? true : false;
    }
    if ('puedeRetirarAlumno' in datosRelacion) {
      datosEnvio.puedeRetirarAlumno =
        datosRelacion.puedeRetirarAlumno === true ? true : false;
    }
    if ('esPrincipal' in datosRelacion) {
      datosEnvio.esPrincipal =
        datosRelacion.esPrincipal === true ? true : false;
    }

    // Luego procesamos el resto de campos, preservando cadenas vacías
    Object.entries(datosRelacion).forEach(([key, value]) => {
      // Si no es un campo booleano ya procesado y tiene un valor (incluyendo cadenas vacías)
      if (
        ![
          'contactoEmergencia',
          'firma',
          'permiteTraslado',
          'puedeRetirarAlumno',
          'esPrincipal',
        ].includes(key)
      ) {
        datosEnvio[key] = value;
      }
    });

    // Log final antes de enviar los datos
    console.log('Datos finales a enviar a la API:', datosEnvio);

    const response = await fetch(
      `${apiUrl}/alumnos/${alumnoId}/responsables/${relacionId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(datosEnvio),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        'Error al actualizar relación:',
        response.status,
        errorData
      );
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al actualizar relación con responsable:', error);
    throw error;
  }
};

/**
 * Elimina un responsable de un alumno
 * @param alumnoId ID del alumno
 * @param relacionId ID de la relación alumno-responsable
 */
/**
 * Elimina un responsable de un alumno
 * @param alumnoId ID del alumno
 * @param relacionId ID de la relación alumno-responsable
 * @returns Objeto con resultado de la operación
 */
export const eliminarResponsable = async (
  alumnoId: number,
  relacionId: number
) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  try {
    console.log(
      `Intentando eliminar responsable: alumnoId=${alumnoId}, relacionId=${relacionId}`
    );

    const url = `${apiUrl}/alumnos/${alumnoId}/responsables/${relacionId}`;
    console.log(`URL de eliminación: ${url}`);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    // Intentamos obtener cualquier respuesta del servidor, ya sea éxito o error
    let responseData = {};
    const responseText = await response.text();

    if (responseText) {
      try {
        responseData = JSON.parse(responseText);
        console.log('Respuesta del servidor al eliminar:', responseData);
      } catch (parseError) {
        console.log('Respuesta del servidor (texto plano):', responseText);
      }
    }

    if (!response.ok) {
      console.error(
        `Error al eliminar responsable - Status: ${response.status}, Mensaje: ${response.statusText}`,
        responseData
      );

      // Construir un mensaje de error más descriptivo
      const errorMessage =
        (responseData as any)?.message ||
        (responseData as any)?.error ||
        `Error ${response.status}: ${response.statusText}`;

      throw new Error(errorMessage);
    }

    // Las operaciones DELETE pueden no devolver contenido
    if (response.status === 204 || !responseText) {
      console.log(
        'Responsable eliminado correctamente (sin contenido en respuesta)'
      );
      return { success: true };
    }

    console.log('Responsable eliminado correctamente:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error en la función eliminarResponsable:', error);
    throw error;
  }
};

/**
 * Desactiva un alumno (soft delete)
 * @param alumnoId ID del alumno a desactivar
 */
export const desactivarAlumno = async (alumnoId: number) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  try {
    const response = await fetch(`${apiUrl}/alumnos/${alumnoId}`, {
      method: 'DELETE',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error al desactivar alumno:', response.status, errorData);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    // Las operaciones DELETE pueden no devolver contenido
    if (response.status === 204) {
      return { success: true };
    }

    return await response.json();
  } catch (error) {
    console.error('Error al desactivar alumno:', error);
    throw error;
  }
};

/**
 * Reactiva un alumno que estaba desactivado
 * @param alumnoId ID del alumno a reactivar
 */
export const reactivarAlumno = async (alumnoId: number) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  try {
    const response = await fetch(`${apiUrl}/alumnos/${alumnoId}/restore`, {
      method: 'PATCH',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error al reactivar alumno:', response.status, errorData);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al reactivar alumno:', error);
    throw error;
  }
};

/**
 * Actualiza un alumno completo con todos sus datos y responsables
 * @param alumnoId ID del alumno a actualizar
 * @param alumnoCompleto Datos completos del alumno
 */
export const actualizarAlumnoCompleto = async (
  alumnoId: number,
  alumnoCompleto: any
) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  try {
    // Primero, extraemos los responsables para manejarlos por separado
    const { responsables, ...datosBasicos } = alumnoCompleto;

    // Actualizamos los datos básicos del alumno
    const responseAlumno = await fetch(`${apiUrl}/alumnos/${alumnoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(datosBasicos),
    });

    if (!responseAlumno.ok) {
      const errorData = await responseAlumno.json().catch(() => ({}));
      console.error(
        'Error al actualizar datos básicos:',
        responseAlumno.status,
        errorData
      );
      throw new Error(
        `Error ${responseAlumno.status}: ${responseAlumno.statusText}`
      );
    }

    // Ahora procesamos los responsables
    const resultadosResponsables = [];
    if (responsables && Array.isArray(responsables)) {
      for (const responsable of responsables) {
        try {
          let respuestaResponsable;

          if (responsable.id) {
            // Actualizar responsable existente
            console.log(
              `Actualizando responsable ID ${responsable.id} para alumno ${alumnoId}`
            );

            // Para la API de actualización de relación alumno-responsable, solo enviamos estos campos específicos
            // según la documentación y el código del backend
            const datosRelacion = {
              parentescoId: responsable.parentescoId,
              parentescoLibre: responsable.parentescoLibre || '',
              esPrincipal: Boolean(responsable.esPrincipal),
              firma: Boolean(responsable.firma),
              permiteTraslado: Boolean(responsable.permiteTraslado),
              puedeRetirarAlumno: Boolean(responsable.puedeRetirarAlumno),
              contactoEmergencia: Boolean(responsable.contactoEmergencia),
            };

            console.log(
              'Datos de relación a enviar:',
              JSON.stringify(datosRelacion, null, 2)
            );

            // Primero actualizamos la relación
            respuestaResponsable = await fetch(
              `${apiUrl}/alumnos/${alumnoId}/responsables/${responsable.id}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify(datosRelacion),
              }
            );

            // Verificamos si hubo error en la actualización de la relación
            if (!respuestaResponsable.ok) {
              const errorText = await respuestaResponsable.text();
              console.error(
                `Error en la actualización de la relación (status ${respuestaResponsable.status}):`,
                errorText
              );

              // Intentamos parsear como JSON si es posible
              let detalleError;
              try {
                detalleError = JSON.parse(errorText);
              } catch (e) {
                detalleError = { mensaje: errorText };
              }

              // Si es un error 404, probablemente el responsable ya no existe
              // En lugar de simplemente reportar el error, deberíamos intentar crear un nuevo responsable
              if (respuestaResponsable.status === 404) {
                console.log(
                  'La relación o el responsable no existe. Intentando crear un nuevo responsable...'
                );

                try {
                  // Creamos un nuevo responsable con todos los datos
                  const datosCreacion: Record<string, any> = {
                    parentescoId: responsable.parentescoId,
                    parentescoLibre: responsable.parentescoLibre || '',
                    esPrincipal: Boolean(responsable.esPrincipal),
                    firma: Boolean(responsable.firma),
                    permiteTraslado: Boolean(responsable.permiteTraslado),
                    puedeRetirarAlumno: Boolean(responsable.puedeRetirarAlumno),
                    contactoEmergencia: Boolean(responsable.contactoEmergencia),
                  };

                  // Si tenemos datos del responsable, los agregamos
                  if (responsable.datosResponsable) {
                    // Filtramos campos nulos o undefined para evitar errores
                    const datosResponsableClean: Record<string, any> = {};

                    Object.entries(responsable.datosResponsable).forEach(
                      ([key, value]) => {
                        // Excluimos firmaFoto y valores undefined/null
                        if (
                          key !== 'firmaFoto' &&
                          value !== undefined &&
                          value !== null
                        ) {
                          datosResponsableClean[key] = value;
                        }
                      }
                    );

                    datosCreacion.datosResponsable = datosResponsableClean;
                  }

                  console.log(
                    'Intentando crear nuevo responsable con datos:',
                    JSON.stringify(datosCreacion, null, 2)
                  );

                  // Intentamos crear un nuevo responsable usando POST
                  const respuestaCreacion = await fetch(
                    `${apiUrl}/alumnos/${alumnoId}/responsables`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: token ? `Bearer ${token}` : '',
                      },
                      body: JSON.stringify(datosCreacion),
                    }
                  );

                  if (respuestaCreacion.ok) {
                    const resultadoCreacion = await respuestaCreacion.json();
                    console.log(
                      'Relación recreada exitosamente:',
                      resultadoCreacion
                    );

                    resultadosResponsables.push({
                      error: false,
                      mensaje:
                        'Relación responsable-alumno recreada exitosamente',
                      datos: resultadoCreacion,
                    });
                  } else {
                    // Si tampoco podemos crear la relación, entonces reportamos el error completo
                    const errorCreacion = await respuestaCreacion.text();
                    console.error(
                      'No se pudo crear la relación:',
                      errorCreacion
                    );

                    resultadosResponsables.push({
                      error: true,
                      status: respuestaCreacion.status,
                      mensaje: `No se pudo recrear la relación: ${errorCreacion}`,
                      detalles: {
                        originalError: detalleError,
                        creationError: errorCreacion,
                      },
                    });
                  }
                } catch (err: any) {
                  console.error('Error al intentar recrear la relación:', err);
                  resultadosResponsables.push({
                    error: true,
                    mensaje: `Error al intentar recrear la relación: ${err.message || 'Error desconocido'}`,
                    tipo: 'excepcion',
                  });
                }
              } else {
                // Para otros errores, simplemente reportamos el error como antes
                resultadosResponsables.push({
                  error: true,
                  status: respuestaResponsable.status,
                  mensaje: `Error al actualizar relación: ${detalleError.message || detalleError.error || 'Error desconocido'}`,
                  detalles: detalleError,
                });
              }

              // Continuamos con el siguiente responsable
              continue;
            }

            // La actualización de la relación fue exitosa, ahora actualizamos los datos del responsable
            if (responsable.datosResponsable) {
              const relacionData = await respuestaResponsable.json();
              const responsableId = relacionData.responsableId;

              if (responsableId) {
                console.log(
                  `Actualizando datos del responsable ID: ${responsableId}`
                );

                // Aseguramos que solo enviamos los campos válidos para un responsable
                // según la estructura en el backend
                const datosLimpios: Record<string, any> = {};

                // Solo incluimos campos que tienen valores (no undefined/null)
                if (responsable.datosResponsable.nombre)
                  datosLimpios.nombre = responsable.datosResponsable.nombre;
                if (responsable.datosResponsable.apellido)
                  datosLimpios.apellido = responsable.datosResponsable.apellido;
                if (responsable.datosResponsable.dui)
                  datosLimpios.dui = responsable.datosResponsable.dui;
                if (responsable.datosResponsable.telefono)
                  datosLimpios.telefono = responsable.datosResponsable.telefono;
                if (responsable.datosResponsable.email !== undefined)
                  datosLimpios.email = responsable.datosResponsable.email;
                if (responsable.datosResponsable.direccion)
                  datosLimpios.direccion =
                    responsable.datosResponsable.direccion;
                if (responsable.datosResponsable.lugarTrabajo !== undefined)
                  datosLimpios.lugarTrabajo =
                    responsable.datosResponsable.lugarTrabajo;
                if (responsable.datosResponsable.profesionOficio)
                  datosLimpios.profesionOficio =
                    responsable.datosResponsable.profesionOficio;
                if (
                  responsable.datosResponsable.ultimoGradoEstudiado !==
                  undefined
                )
                  datosLimpios.ultimoGradoEstudiado =
                    responsable.datosResponsable.ultimoGradoEstudiado;
                if (responsable.datosResponsable.ocupacion)
                  datosLimpios.ocupacion =
                    responsable.datosResponsable.ocupacion;
                if (responsable.datosResponsable.religion !== undefined)
                  datosLimpios.religion = responsable.datosResponsable.religion;
                if (responsable.datosResponsable.zonaResidencia)
                  datosLimpios.zonaResidencia =
                    responsable.datosResponsable.zonaResidencia;
                if (responsable.datosResponsable.estadoFamiliar)
                  datosLimpios.estadoFamiliar =
                    responsable.datosResponsable.estadoFamiliar;
                if (
                  responsable.datosResponsable.empresaTransporte !== undefined
                )
                  datosLimpios.empresaTransporte =
                    responsable.datosResponsable.empresaTransporte;
                if (responsable.datosResponsable.placaVehiculo !== undefined)
                  datosLimpios.placaVehiculo =
                    responsable.datosResponsable.placaVehiculo;
                if (responsable.datosResponsable.tipoVehiculo !== undefined)
                  datosLimpios.tipoVehiculo =
                    responsable.datosResponsable.tipoVehiculo;
                // Eliminamos firmaFoto ya que el backend no acepta esta propiedad en la actualización

                // Solo hacemos la petición si hay datos que actualizar
                if (Object.keys(datosLimpios).length === 0) {
                  console.log(
                    'No hay datos para actualizar del responsable, omitiendo actualización.'
                  );

                  // Agregamos un registro de éxito aunque no haya hecho actualización
                  resultadosResponsables.push({
                    error: false,
                    mensaje:
                      'Responsable actualizado correctamente (solo relación)',
                    datos: {
                      id: responsableId,
                    },
                  });
                  continue;
                }

                console.log(
                  'Datos del responsable a actualizar:',
                  JSON.stringify(datosLimpios, null, 2)
                );

                try {
                  const respDatos = await fetch(
                    `${apiUrl}/responsables/${responsableId}`,
                    {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: token ? `Bearer ${token}` : '',
                      },
                      body: JSON.stringify(datosLimpios),
                    }
                  );

                  // Guardamos el texto de la respuesta para usarlo tanto para log como para errores
                  const respDatosTexto = await respDatos.text();
                  console.log(
                    `Respuesta actualización datos responsable (status: ${respDatos.status}):`,
                    respDatosTexto
                  );

                  if (!respDatos.ok) {
                    console.error(
                      `Error al actualizar datos del responsable: ${respDatos.status}`,
                      respDatosTexto
                    );

                    // Agregamos el error a resultadosResponsables para mostrarlo al usuario
                    let detalleError;
                    try {
                      detalleError = JSON.parse(respDatosTexto);
                    } catch (e) {
                      detalleError = { mensaje: respDatosTexto };
                    }

                    resultadosResponsables.push({
                      error: true,
                      status: respDatos.status,
                      mensaje: `Error al actualizar datos: ${detalleError.message || detalleError.error || 'Error desconocido'}`,
                      detalles: detalleError,
                    });
                  } else {
                    // Si la actualización fue exitosa, registramos el éxito en resultadosResponsables
                    let datosActualizados;
                    try {
                      datosActualizados = respDatosTexto
                        ? JSON.parse(respDatosTexto)
                        : {};
                    } catch (e) {
                      datosActualizados = {};
                    }

                    resultadosResponsables.push({
                      error: false,
                      mensaje: 'Responsable actualizado correctamente',
                      datos: {
                        ...datosActualizados,
                        id: responsableId,
                      },
                    });
                  }
                } catch (err: any) {
                  console.error(
                    'Excepción al actualizar datos del responsable:',
                    err
                  );
                  resultadosResponsables.push({
                    error: true,
                    mensaje: `Excepción: ${err.message || 'Error desconocido'}`,
                    tipo: 'excepcion',
                  });
                }
              }
            }
          } else {
            // Agregar nuevo responsable
            console.log(`Agregando nuevo responsable para alumno ${alumnoId}`);

            // Nos aseguramos de enviar la estructura correcta que espera la API
            // Según el controlador, necesitamos cumplir con CreateAlumnoResponsableDto
            const nuevoResponsable: Record<string, any> = {
              parentescoId: responsable.parentescoId || null,
              parentescoLibre: responsable.parentescoLibre || '',
              esPrincipal: Boolean(responsable.esPrincipal),
              firma: Boolean(responsable.firma),
              permiteTraslado: Boolean(responsable.permiteTraslado),
              puedeRetirarAlumno: Boolean(responsable.puedeRetirarAlumno),
              contactoEmergencia: Boolean(responsable.contactoEmergencia),
            };

            // Si tenemos datos del responsable, los incluimos correctamente
            if (
              responsable.datosResponsable &&
              Object.keys(responsable.datosResponsable).length > 0
            ) {
              // Filtramos campos nulos o undefined para evitar errores
              // y excluimos explícitamente firmaFoto que causa errores en el backend
              const datosResponsableClean: Record<string, any> = {};

              Object.entries(responsable.datosResponsable).forEach(
                ([key, value]) => {
                  // Excluimos firmaFoto y valores undefined/null
                  if (
                    key !== 'firmaFoto' &&
                    value !== undefined &&
                    value !== null
                  ) {
                    datosResponsableClean[key] = value;
                  }
                }
              );

              nuevoResponsable.datosResponsable = datosResponsableClean;
            }

            console.log(
              'Datos de nuevo responsable:',
              JSON.stringify(nuevoResponsable, null, 2)
            );

            respuestaResponsable = await fetch(
              `${apiUrl}/alumnos/${alumnoId}/responsables`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify(nuevoResponsable),
              }
            );
          }

          if (respuestaResponsable.ok) {
            const resultado = await respuestaResponsable.json();
            console.log('Respuesta exitosa del servidor:', resultado);

            // Guardamos la información del responsable actualizado o creado para actualizaciones futuras
            const responsableInfo = {
              id: resultado.id || resultado.responsableId || responsable.id,
              // Si tenemos el ID del responsable en la respuesta, lo guardamos
              responsableId:
                resultado.responsableId ||
                resultado.responsable?.id ||
                responsable.responsableId ||
                0,
            };

            console.log(
              'Información del responsable guardada:',
              responsableInfo
            );

            resultadosResponsables.push({
              error: false,
              mensaje: responsable.id
                ? 'Responsable actualizado correctamente'
                : 'Responsable agregado correctamente',
              datos: {
                ...resultado,
                ...responsableInfo,
              },
            });
          } else {
            // Capturamos el texto completo de la respuesta para mejor diagnóstico
            const textoError = await respuestaResponsable.text();
            console.error(
              `Error con responsable (status ${respuestaResponsable.status}):`,
              textoError
            );

            // Intentamos parsear como JSON si es posible
            let detalleError;
            try {
              detalleError = JSON.parse(textoError);
            } catch (e) {
              detalleError = { mensaje: textoError };
            }

            resultadosResponsables.push({
              error: true,
              status: respuestaResponsable.status,
              mensaje:
                detalleError.message ||
                detalleError.mensaje ||
                `Error ${respuestaResponsable.status}`,
              detalles: detalleError,
            });
          }
        } catch (error: any) {
          console.error('Error procesando responsable:', error);
          resultadosResponsables.push({
            error: true,
            mensaje: error.message || 'Error desconocido',
            tipo: 'excepcion',
          });
        }
      }
    }

    // Obtenemos el alumno actualizado completo
    const alumnoActualizado = await fetch(`${apiUrl}/alumnos/${alumnoId}`).then(
      (res) => res.json()
    );

    return {
      alumno: alumnoActualizado,
      resultadosResponsables,
    };
  } catch (error) {
    console.error('Error en la actualización completa del alumno:', error);
    throw error;
  }
};
