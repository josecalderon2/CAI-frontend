// Función para procesar responsables
const formatResponsablesForApi = (responsables) => {
  return responsables.map((resp) => {
    // Datos del responsable
    const datosResponsable = {
      nombre: resp.responsable?.nombre || resp.datosResponsable?.nombre || '',
      apellido:
        resp.responsable?.apellido || resp.datosResponsable?.apellido || '',
      dui: resp.responsable?.dui || resp.datosResponsable?.dui || '',
      telefono:
        resp.responsable?.telefono || resp.datosResponsable?.telefono || '',
      email: resp.responsable?.email || resp.datosResponsable?.email || null,
      direccion:
        resp.responsable?.direccion || resp.datosResponsable?.direccion || '',
      lugarTrabajo:
        resp.responsable?.lugarTrabajo ||
        resp.datosResponsable?.lugarTrabajo ||
        null,
      profesionOficio:
        resp.responsable?.profesionOficio ||
        resp.datosResponsable?.profesionOficio ||
        '',
      ultimoGradoEstudiado:
        resp.responsable?.ultimoGradoEstudiado ||
        resp.datosResponsable?.ultimoGradoEstudiado ||
        null,
      ocupacion:
        resp.responsable?.ocupacion || resp.datosResponsable?.ocupacion || '',
      religion:
        resp.responsable?.religion || resp.datosResponsable?.religion || null,
      zonaResidencia:
        resp.responsable?.zonaResidencia ||
        resp.datosResponsable?.zonaResidencia ||
        'Urbana',
      estadoFamiliar:
        resp.responsable?.estadoFamiliar ||
        resp.datosResponsable?.estadoFamiliar ||
        '',
      empresaTransporte:
        resp.responsable?.empresaTransporte ||
        resp.datosResponsable?.empresaTransporte ||
        null,
      placaVehiculo:
        resp.responsable?.placaVehiculo ||
        resp.datosResponsable?.placaVehiculo ||
        null,
      tipoVehiculo:
        resp.responsable?.tipoVehiculo ||
        resp.datosResponsable?.tipoVehiculo ||
        null,
      firmaFoto: resp.responsable?.firmaFoto || null,
    };

    // Datos de la relación
    return {
      parentescoId: resp.parentescoId || resp.relacion?.parentescoId || null,
      parentescoLibre:
        resp.parentescoLibre || resp.relacion?.parentescoLibre || '',
      esPrincipal: resp.esPrincipal || resp.relacion?.esPrincipal || false,
      firma: resp.firma || resp.relacion?.firma || false,
      permiteTraslado:
        resp.permiteTraslado || resp.relacion?.permiteTraslado || false,
      puedeRetirarAlumno:
        resp.puedeRetirarAlumno || resp.relacion?.puedeRetirarAlumno || false,
      contactoEmergencia:
        resp.contactoEmergencia || resp.relacion?.contactoEmergencia || false,

      // Anidando los datos del responsable como espera la API
      datosResponsable: datosResponsable,
    };
  });
};
