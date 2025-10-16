# Documentación: Implementación del Historial de Asignaciones

## Resumen

Se ha implementado un nuevo flujo para mantener un registro histórico completo de las asignaciones en el sistema. Anteriormente, cuando se actualizaba una asignación, se perdía la información histórica de cómo estaba configurada antes de la modificación. Con esta nueva implementación, se guarda cada versión de una asignación antes de ser modificada.

## Nuevo Endpoint Implementado

```
POST /asignaciones/create-historial
```

Este endpoint registra una "instantánea" de la asignación en el historial antes de que sea modificada.

## Cambios realizados

1. **Creación de servicios**:
   - Se ha agregado el método `createHistorial` al servicio `asignacionesService.ts`
   - Se ha definido la interfaz `CreateHistorialDto` para tipificar los datos

2. **Modificación del flujo de actualización**:
   - En `AsignacionesModule.tsx` se modificaron las funciones que actualizan asignaciones para primero guardar el historial:
     - `handleSubmit`: Cuando se edita una asignación desde el formulario
     - `handleToggleStatus`: Cuando se activa/desactiva una asignación

3. **Documentación**:
   - Se ha agregado documentación en el componente `HistorialAsignaciones.tsx` explicando el nuevo flujo

## Cómo funciona el nuevo flujo

1. **Antes de actualizar una asignación**:
   - Se obtiene la asignación actual completa usando `getAsignacionById`
   - Se registra su estado actual en el historial usando `createHistorial`, estableciendo la fecha de fin al momento actual
2. **Luego, se procede con la actualización normal**:
   - Se envía la actualización como siempre usando `updateAsignacion`

## Ejemplo de implementación

```typescript
// Antes de actualizar una asignación
const actualizarConHistorial = async (id, nuevosDatos) => {
  try {
    // 1. Obtener los datos actuales completos
    const asignacionActual = await asignacionesService.getAsignacionById(id);

    // 2. Guardar en historial antes de actualizar
    await asignacionesService.createHistorial({
      id_asignatura_orientador: asignacionActual.id_asignatura_orientador,
      id_curso: asignacionActual.curso.id_curso,
      id_orientador: asignacionActual.docente.id_orientador,
      id_asignatura: asignacionActual.asignatura.id_asignatura,
      es_orientador: asignacionActual.esOrientador,
      anio_academico: asignacionActual.anio_academico || undefined,
      fecha_asignacion: asignacionActual.fechaAsignacion,
      fecha_fin: new Date().toISOString(), // Fecha actual como cierre
    });

    // 3. Proceder con la actualización normal
    await asignacionesService.updateAsignacion(id, nuevosDatos);
  } catch (error) {
    console.error('Error al actualizar:', error);
  }
};
```

## Beneficios

- Historial completo de cambios en las asignaciones
- Sin romper ninguna funcionalidad existente
- Fácil acceso a datos históricos para reportes
- Mayor trazabilidad de las modificaciones

## Consideraciones importantes

- El registro en historial debe hacerse **antes** de actualizar la asignación
- En caso de error al crear el historial, el código actual continúa con la actualización normal, priorizando la funcionalidad principal
- Los registros históricos se pueden consultar a través del componente `HistorialAsignaciones.tsx`

## ¿Qué pasa si hay un error al crear el historial?

Se ha implementado manejo de errores para que, si falla la creación del historial, no se interrumpa la actualización de la asignación. El error se registra en la consola pero se permite continuar con la operación principal.

## Futuras mejoras posibles

- Implementar una notificación para el usuario cuando no se pudo registrar el historial
- Agregar un campo para registrar qué usuario realizó cada cambio
- Agregar vistas de comparación entre diferentes versiones de una asignación
