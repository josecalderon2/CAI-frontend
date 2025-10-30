# Refactorización de Servicios de Asistencia

## Resumen de Cambios

Se ha refactorizado completamente el archivo `asistenciaService.ts` para alinearlo con los **3 controladores** del backend:

1. **AsistenciaController** (`/asistencia`)
2. **ConductaController** (`/conducta`)
3. **ResumenController** (`/resumen`)

## Cambios Principales

### 1. Servicio de Asistencia (`asistenciaService`)

#### Endpoints Principales

**Toma de Asistencia Masiva (NUEVO)**

```typescript
// POST /asistencia/bulk
await asistenciaService.createBulk(asistencias: CreateAsistenciaDto[])
```

Este es el endpoint principal para que los docentes tomen asistencia de forma masiva. Reemplaza el antiguo método `create` que recibía un array.

**Crear Asistencia Individual (Corrección)**

```typescript
// POST /asistencia
await asistenciaService.create(asistencia: CreateAsistenciaDto)
```

Para correcciones o registros individuales.

**Consultas**

```typescript
// GET /asistencia
await asistenciaService.findAll()

// GET /asistencia/alumno/:id_alumno
await asistenciaService.findByStudent(id_alumno: number)

// GET /asistencia/:id
await asistenciaService.findOne(id: number)
```

**Actualizar y Eliminar**

```typescript
// PATCH /asistencia/:id
await asistenciaService.update(id: number, updateData: UpdateAsistenciaDto)

// DELETE /asistencia/:id
await asistenciaService.remove(id: number)
```

#### Método de Compatibilidad

```typescript
// Filtra del lado del cliente (temporal)
await asistenciaService.findByAsignaturaAndFecha(id_asignatura, fecha);
```

**Nota:** Este método filtra del lado del cliente. Se recomienda agregar este endpoint al backend para mejor rendimiento.

---

### 2. Servicio de Conducta (`conductaService`) - NUEVO

#### Catálogo de Infracciones

```typescript
// POST /conducta/catalogo
await conductaService.createCatalogo(dto: CreateInfraccionCatalogoDto)

// GET /conducta/catalogo
await conductaService.findAllCatalogo()

// GET /conducta/catalogo/:id
await conductaService.findOneCatalogo(id: number)

// PATCH /conducta/catalogo/:id
await conductaService.updateCatalogo(id: number, dto: UpdateInfraccionCatalogoDto)

// DELETE /conducta/catalogo/:id
await conductaService.removeCatalogo(id: number)
```

**Tipos de Gravedad:**

- `LEVE`
- `MODERADA`
- `GRAVE`
- `MUY_GRAVE`

#### Instancias de Conducta

```typescript
// POST /conducta
await conductaService.create(dto: CreateConductaDto)

// GET /conducta
await conductaService.findAll()

// GET /conducta/alumno/:id_alumno
await conductaService.findByStudent(id_alumno: number)

// GET /conducta/:id
await conductaService.findOne(id: number)

// PATCH /conducta/:id
await conductaService.update(id: number, dto: UpdateConductaDto)

// DELETE /conducta/:id
await conductaService.remove(id: number)
```

---

### 3. Servicio de Resumen (`resumenService`) - NUEVO

#### Consolidados y Reportes

```typescript
// GET /resumen/asistencia-mensual
// Reemplaza a Consolidados.csv
await resumenService.getResumenMensualAsistencia({
  anio?: number,
  mes?: number,
  id_curso?: number,
  id_grado_academico?: number
})

// GET /resumen/trimestral
// Reemplaza a Trimestral.csv
await resumenService.getResumenTrimestral({
  anio?: number,
  trimestre?: number,
  id_curso?: number,
  id_grado_academico?: number
})
```

---

## Cambios en Tipos de Datos

### `anio_academico`

**ANTES:** `string`  
**AHORA:** `number`

```typescript
interface CreateAsistenciaDto {
  // ... otros campos
  anio_academico?: number; // ✅ Ahora es number
}
```

### Nuevas Interfaces

```typescript
// Conducta
interface CreateInfraccionCatalogoDto {
  nombre: string;
  descripcion?: string;
  gravedad: 'LEVE' | 'MODERADA' | 'GRAVE' | 'MUY_GRAVE';
  puntos_negativos?: number;
}

interface CreateConductaDto {
  id_alumno: number;
  id_infraccion_catalogo: number;
  id_orientador: number;
  fecha: string;
  descripcion?: string;
  medida_tomada?: string;
}

// Resumen
interface ResumenMensualDto {
  anio?: number;
  mes?: number;
  id_curso?: number;
  id_grado_academico?: number;
}

interface ResumenTrimestralDto {
  anio?: number;
  trimestre?: number;
  id_curso?: number;
  id_grado_academico?: number;
}
```

---

## Cambios en Componentes

### AsistenciaModule.tsx

**Antes:**

```typescript
await asistenciaService.create(asistenciasArray);
```

**Ahora:**

```typescript
await asistenciaService.createBulk(asistenciasArray);
```

**Tipo `anio_academico` corregido:**

```typescript
const asistenciasAGuardar = {
  // ...
  anio_academico: new Date().getFullYear(), // ✅ number, no string
  // ...
};
```

---

## Próximos Pasos Recomendados

### Backend

1. **Agregar endpoint:** `GET /asistencia/asignatura/:id_asignatura/fecha/:fecha`
   - Actualmente se filtra del lado del cliente
   - Mejorará el rendimiento con grandes volúmenes de datos

### Frontend

1. **Implementar módulo de Conducta** usando `conductaService`
2. **Implementar reportes** usando `resumenService`
3. **Agregar validaciones** para tipos de gravedad
4. **Implementar búsqueda avanzada** en conducta

---

## Ejemplo de Uso

### Tomar Asistencia Masiva

```typescript
import { asistenciaService } from '@/api/services/asistenciaService';

const handleGuardarAsistencia = async () => {
  const asistencias = [
    {
      id_alumno: 1,
      id_asignatura: 5,
      id_orientador: 3,
      fecha: '2025-10-27',
      estado: 'P',
      observacion: '',
      anio_academico: 2025,
      trimestre: 4,
    },
    // ... más alumnos
  ];

  try {
    const response = await asistenciaService.createBulk(asistencias);
    console.log('Asistencias guardadas:', response);
  } catch (error) {
    console.error('Error al guardar:', error);
  }
};
```

### Registrar Conducta

```typescript
import { conductaService } from '@/api/services/asistenciaService';

// 1. Obtener catálogo de infracciones
const infracciones = await conductaService.findAllCatalogo();

// 2. Registrar una conducta
const nuevaConducta = await conductaService.create({
  id_alumno: 1,
  id_infraccion_catalogo: infracciones[0].id_infraccion_catalogo,
  id_orientador: 3,
  fecha: '2025-10-27',
  descripcion: 'Llegó tarde a clases',
  medida_tomada: 'Amonestación verbal',
});
```

### Obtener Resumen Mensual

```typescript
import { resumenService } from '@/api/services/asistenciaService';

const resumen = await resumenService.getResumenMensualAsistencia({
  anio: 2025,
  mes: 10,
  id_curso: 5,
});

console.log('Consolidado mensual:', resumen);
```

---

## Estructura de Archivos

```
src/
├── api/
│   └── services/
│       ├── asistenciaService.ts      ✅ REFACTORIZADO
│       ├── cursosService.ts
│       ├── historialService.ts
│       └── ...
└── components/
    ├── AsistenciaModule.tsx          ✅ ACTUALIZADO
    └── ...
```

---

## Notas Importantes

1. **Breaking Changes:** El método `create` ahora recibe un objeto individual en lugar de un array
2. **Nuevo método:** Usar `createBulk` para toma masiva de asistencia
3. **Tipo corregido:** `anio_academico` es ahora `number` en lugar de `string`
4. **Nuevos servicios:** `conductaService` y `resumenService` disponibles
5. **Exports:** Todos los tipos están exportados para uso en otros componentes

---

## Testing

Se recomienda probar los siguientes escenarios:

- ✅ Toma de asistencia masiva con `createBulk`
- ✅ Corrección individual con `create`
- ✅ Consulta de asistencias por alumno
- ✅ Creación de catálogo de infracciones
- ✅ Registro de conductas
- ✅ Generación de reportes mensuales
- ✅ Generación de reportes trimestrales

---

**Fecha de refactorización:** 27 de octubre de 2025  
**Versión:** 2.0.0
