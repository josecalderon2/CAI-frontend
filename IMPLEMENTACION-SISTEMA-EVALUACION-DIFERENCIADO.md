# Implementación Sistema de Evaluación Diferenciado

## 📋 Resumen

Se ha implementado correctamente el sistema de evaluación diferenciado que soporta dos modalidades:

- **Educación Básica**: Sistema de 3 trimestres con evaluación 70% actividades + 30% examen mensual
- **Bachillerato**: Sistema de 4 periodos con 6 componentes de evaluación

## 🔧 Cambios Realizados

### 1. Servicio de Notas (`notasService.ts`)

#### Nuevas Interfaces

```typescript
// Interfaces para el formato de evaluación
export interface TipoActividad {
  id_tipo_actividad: number;
  nombre: string;
  numero_actividad?: number;
  porcentaje?: number;
}

export interface ComponenteEvaluacion {
  nombre: string;
  porcentaje: number;
  actividades: TipoActividad[];
}

export interface FormatoEvaluacionResponse {
  nivel: 'BASICA' | 'BACHILLERATO';
  id_asignatura: number;
  nombre_asignatura: string;
  id_sistema_evaluacion: number;
  nombre_sistema: string;

  // Para BASICA
  actividades?: TipoActividad[];
  porcentaje_actividades?: number; // 70%
  porcentaje_examen?: number; // 30%

  // Para BACHILLERATO
  componentes?: ComponenteEvaluacion[];
  incluye_examen_parcial?: boolean;
  incluye_examen_periodo?: boolean;
}
```

#### Funcionalidad Mejorada

- `obtenerFormatoEvaluacion()`: Ahora retorna el formato tipado según el nivel educativo
- Soporte para examen parcial en bachillerato

### 2. Componente de Notas (`NotasModuleNew.tsx`)

#### Nuevas Interfaces

```typescript
interface ActividadFormulario {
  id_tipo_actividad: number;
  nombre: string;
  numero_actividad?: number;
  nota: string;
  categoria?: string; // Para agrupar en bachillerato
}

interface NotaFormulario {
  actividades: ActividadFormulario[];
  examen_mensual: string;
  examen_parcial: string; // Para bachillerato
}
```

#### Estados Actualizados

- `formatoEvaluacion`: Ahora tipado como `FormatoEvaluacionResponse`
- `notas`: Incluye campo `examen_parcial` para bachillerato

#### Funciones Nuevas/Actualizadas

**`cargarFormatoEvaluacion()`**

```typescript
- Detecta automáticamente el nivel educativo (BASICA o BACHILLERATO)
- Para BASICA: Carga actividades continuas simples
- Para BACHILLERATO: Carga componentes con categorías
- Inicializa el formulario según el tipo de evaluación
```

**`handleExamenParcialChange()`**

```typescript
- Maneja el cambio del examen parcial (solo para bachillerato)
- Valida rango 0-10
```

**`handleGuardar()`**

```typescript
- Incluye examen_parcial en el DTO
- Logging mejorado con nivel educativo
- Actualiza formulario con datos guardados incluyendo examen parcial
```

#### UI Diferenciada por Nivel Educativo

**Educación Básica:**

```
✓ Actividades Continuas (70%)
  - Muestra lista simple de actividades
  - Sin agrupación por categorías
✓ Examen Mensual (30%)
  - Campo único para examen mensual
✓ Resultados mostrados:
  - Promedio Actividades
  - Nota Mensual
  - Aporte al Trimestre
```

**Bachillerato:**

```
✓ Componentes agrupados visualmente:
  - Actividades Integradoras (25%)
  - Tareas (5%)
  - Coevaluación (5%)
  - Laboratorio/Prácticas (10%)
  - Examen Parcial (25%)
  - Examen de Periodo (30%)
✓ Cada componente muestra su porcentaje
✓ Actividades agrupadas por categoría
✓ Resultados mostrados:
  - Promedio Actividades
  - Nota del Periodo
  - (No muestra aporte al trimestre)
```

## 📊 Endpoints del Backend Utilizados

### 1. Obtener Formato de Evaluación

```
GET /sistema-evaluacion/formato-evaluacion/asignatura/:id_asignatura
```

**Respuesta esperada:**

```json
{
  "nivel": "BASICA" | "BACHILLERATO",
  "id_asignatura": 1,
  "nombre_asignatura": "Matemática",
  "id_sistema_evaluacion": 1,
  "nombre_sistema": "Sistema Básica",

  // Para BASICA
  "actividades": [
    {
      "id_tipo_actividad": 1,
      "nombre": "Tarea",
      "numero_actividad": 1
    }
  ],
  "porcentaje_actividades": 70,
  "porcentaje_examen": 30,

  // Para BACHILLERATO
  "componentes": [
    {
      "nombre": "Actividades Integradoras",
      "porcentaje": 25,
      "actividades": [...]
    }
  ],
  "incluye_examen_parcial": true,
  "incluye_examen_periodo": true
}
```

### 2. Crear/Actualizar Nota Mensual

```
POST /sistema-evaluacion/nota-mensual
```

**Payload:**

```json
{
  "id_alumno": 1,
  "id_asignatura": 1,
  "mes": 11,
  "anio": 2025,
  "actividades": [
    {
      "id_tipo_actividad": 1,
      "numero_actividad": 1,
      "nota": 8.5
    }
  ],
  "examen_mensual": 9.0,
  "examen_parcial": 8.0 // Solo para bachillerato
}
```

### 3. Consultar Notas

```
GET /sistema-evaluacion/notas-mensuales/:id_alumno/:id_asignatura
```

## 🎯 Flujo de Trabajo

1. **Selección de Curso**: El orientador selecciona el curso
2. **Carga de Asignatura**: Al seleccionar asignatura, se obtiene el formato de evaluación
3. **Detección Automática**: El sistema detecta si es BASICA o BACHILLERATO
4. **Renderizado Dinámico**: La UI se adapta automáticamente al tipo de evaluación
5. **Selección de Alumno**: Se cargan las notas existentes del alumno
6. **Ingreso/Edición**: El orientador ingresa o edita las notas
7. **Guardado**: Se envía al backend con el formato correcto
8. **Visualización**: Se muestran los resultados calculados

## ✅ Validaciones Implementadas

- ✓ Notas en rango 0-10
- ✓ Al menos una nota debe ser ingresada
- ✓ Validación de alumno y asignatura seleccionados
- ✓ Campos específicos según nivel educativo
- ✓ Manejo de errores con mensajes claros

## 🔄 Compatibilidad Backend

El frontend está preparado para recibir:

### Desde Backend para BASICA:

```typescript
{
  nivel: 'BASICA',
  actividades: TipoActividad[],
  porcentaje_actividades: 70,
  porcentaje_examen: 30
}
```

### Desde Backend para BACHILLERATO:

```typescript
{
  nivel: 'BACHILLERATO',
  componentes: [
    {
      nombre: 'Actividades Integradoras',
      porcentaje: 25,
      actividades: [...]
    },
    // ... otros 5 componentes
  ],
  incluye_examen_parcial: true,
  incluye_examen_periodo: true
}
```

## 🚀 Próximos Pasos Recomendados

1. **Backend**: Implementar endpoint `/formato-evaluacion/asignatura/:id` que retorne el formato según el nivel educativo
2. **Backend**: Actualizar la estrategia de cálculo para guardar `examen_parcial` en BACHILLERATO
3. **Testing**: Probar con asignaturas de ambos niveles educativos
4. **Validación**: Verificar que los cálculos sean correctos en ambos casos

## 📝 Notas Técnicas

- El componente ahora es completamente dinámico y se adapta automáticamente
- No hay código duplicado ni lógica hardcodeada
- Fácil mantenimiento y extensión
- TypeScript proporciona seguridad de tipos en toda la aplicación
- UI consistente con shadcn/ui y Tailwind CSS

## 🎨 Mejoras Visuales

- Actividades de bachillerato agrupadas en tarjetas con fondo gris claro
- Cada componente muestra su porcentaje
- Iconos descriptivos para cada sección
- Estados de carga y error mejorados
- Etiquetas dinámicas según el nivel educativo

---

**Autor**: Sistema de Evaluación CAI
**Fecha**: 8 de noviembre de 2025
**Versión**: 1.0
