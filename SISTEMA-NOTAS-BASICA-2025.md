# 🎓 Sistema de Evaluación BÁSICA 2025

## 📋 Resumen

El nuevo sistema de evaluación para **Educación Básica (1º-9º grado)** se divide en DOS tipos de evaluaciones:

### 1. EVALUACIONES MENSUALES (35% del total)

- **Tareas (5%)**: Múltiples tareas por mes, se guarda cada una y se calcula el promedio
- **Revisión de libros y cuadernos (15%)**: Una o más revisiones
- **Laboratorio escrito (15%)**: Uno o más laboratorios

### 2. EVALUACIONES TRIMESTRALES (65% del total)

- **Actividad Integradora (25%)**: Una o más actividades
- **Autoevaluación (10%)**: Una o más autoevaluaciones
- **Examen (30%)**: UN examen por trimestre

---

## 🔄 Flujo de Trabajo

### PASO 1: Obtener Formato de Evaluación

Antes de mostrar el formulario, se obtiene la configuración de componentes:

```typescript
GET /sistema-evaluacion/formato-evaluacion/asignatura/:asignaturaId

// Respuesta esperada para BASICA:
{
  "nivel": "BASICA",
  "asignatura": {
    "id": 123,
    "nombre": "Matemática",
    "curso": "5to Grado A"
  },
  "componentes": [
    // MENSUALES (35%)
    {
      "nombre": "Tareas (Mensual)",
      "porcentaje": 5,
      "tipo": "ACTIVIDAD",
      "periodo": "MENSUAL"
    },
    {
      "nombre": "Revisión de libros y cuadernos (Mensual)",
      "porcentaje": 15,
      "tipo": "ACTIVIDAD",
      "periodo": "MENSUAL"
    },
    {
      "nombre": "Laboratorio escrito (Mensual)",
      "porcentaje": 15,
      "tipo": "ACTIVIDAD",
      "periodo": "MENSUAL"
    },
    // TRIMESTRALES (65%)
    {
      "nombre": "Actividad Integradora (Trimestral)",
      "porcentaje": 25,
      "tipo": "ACTIVIDAD",
      "periodo": "TRIMESTRAL"
    },
    {
      "nombre": "Autoevaluación (Trimestral)",
      "porcentaje": 10,
      "tipo": "ACTIVIDAD",
      "periodo": "TRIMESTRAL"
    },
    {
      "nombre": "Examen (Trimestral)",
      "porcentaje": 30,
      "tipo": "EXAMEN",
      "periodo": "TRIMESTRAL"
    }
  ]
}
```

### PASO 2: Interfaz de Usuario

La UI se divide en **DOS tabs**:

#### Tab 1: Evaluaciones Mensuales 📅

- Selector de mes: Febrero, Marzo, Abril (para Trimestre 1)
- Para TAREAS: Lista expandible donde se pueden agregar múltiples tareas
- Para REVISIÓN: Input(s) para una o más revisiones
- Para LABORATORIO: Input(s) para uno o más laboratorios

#### Tab 2: Evaluaciones Trimestrales 📊

- Para ACTIVIDAD INTEGRADORA: Input(s)
- Para AUTOEVALUACIÓN: Input(s)
- Para EXAMEN: Input único (solo uno por trimestre)

### PASO 3: Guardar Notas

**IMPORTANTE**: Se debe llamar al endpoint **UNA VEZ POR CADA NOTA**

```typescript
POST /sistema-evaluacion/notas/simplificadas

// Body:
{
  "asignatura_id": 123,
  "alumno_id": 456,
  "tipo_actividad": "Tareas (Mensual)", // ⚠️ EXACTAMENTE como viene en formato
  "nota": 8.5,
  "mes": 11,  // Noviembre (mes numérico 1-12)
  "anio": 2025,
  "periodo": 3 // Trimestre 3
}
```

#### Ejemplo: Guardar 5 tareas para un alumno

```typescript
const tareas = [8.5, 9.0, 7.5, 9.5, 8.0];

for (const notaTarea of tareas) {
  await notasService.guardarNotaBasica2025({
    asignatura_id: 123,
    alumno_id: 456,
    tipo_actividad: 'Tareas (Mensual)',
    nota: notaTarea,
    mes: 11,
    anio: 2025,
    periodo: 3,
  });
}

// El backend calculará automáticamente:
// - Promedio: (8.5+9.0+7.5+9.5+8.0)/5 = 8.5
// - Aporte: 8.5 × 0.05 = 0.425
```

### PASO 4: Consultar Notas Guardadas

```typescript
GET /sistema-evaluacion/notas/simplificadas?alumno_id=456&mes=11&anio=2025

// Respuesta:
[
  {
    "id_nota": 1,
    "asignatura_id": 123,
    "alumno_id": 456,
    "tipo_actividad": "Tareas (Mensual)",
    "notas": [8.5, 9.0, 7.5, 9.5, 8.0], // ✅ Todas las tareas guardadas
    "promedio": 8.5,
    "mes": 11,
    "anio": 2025,
    "periodo": 3
  },
  {
    "tipo_actividad": "Revisión de libros y cuadernos (Mensual)",
    "notas": [9.0],
    "promedio": 9.0
  }
  // ... más componentes
]
```

### PASO 5: Consolidado Mensual

Ver todas las asignaturas de un alumno en un mes:

```typescript
GET /sistema-evaluacion/consolidado-mensual-alumno/456?mes=11&anio=2025

// Respuesta:
{
  "alumno_id": 456,
  "mes": 11,
  "anio": 2025,
  "asignaturas": [
    {
      "asignatura_id": 123,
      "nombre": "Matemática",
      "componentes_mensuales": {
        "tareas": { "promedio": 8.5, "aporte": 0.425 },
        "revision": { "promedio": 9.0, "aporte": 1.35 },
        "laboratorio": { "promedio": 8.5, "aporte": 1.275 },
        "subtotal_mensual": 3.05
      },
      "nota_mensual": 3.05
    }
    // ... más asignaturas
  ]
}
```

---

## 📂 Archivos Modificados

### 1. `/src/api/services/notasService.ts`

**Interfaces Añadidas**:

```typescript
// Componente de evaluación BÁSICA
export interface ComponenteEvaluacionBasica {
  nombre: string;
  porcentaje: number;
  tipo: 'ACTIVIDAD' | 'EXAMEN';
  periodo: 'MENSUAL' | 'TRIMESTRAL';
}

// Formato de evaluación BÁSICA
export interface FormatoEvaluacionBasicaResponse {
  nivel: 'BASICA';
  asignatura: {
    id: number;
    nombre: string;
    curso: string;
  };
  componentes: ComponenteEvaluacionBasica[];
}

// DTO para guardar nota individual
export interface GuardarNotaBasicaDto {
  asignatura_id: number;
  alumno_id: number;
  tipo_actividad: string;
  nota: number;
  mes: number;
  anio: number;
  periodo: number;
}

// Respuesta de nota guardada
export interface NotaBasica2025Response {
  id_nota: number;
  asignatura_id: number;
  alumno_id: number;
  tipo_actividad: string;
  notas: number[];
  promedio: number;
  mes: number;
  anio: number;
  periodo: number;
}

// Consolidado mensual
export interface ConsolidadoMensualResponse {
  alumno_id: number;
  mes: number;
  anio: number;
  asignaturas: ConsolidadoMensualAsignatura[];
}
```

**Métodos Añadidos**:

```typescript
// Guardar nota individual
async guardarNotaBasica2025(dto: GuardarNotaBasicaDto): Promise<any>

// Consultar notas guardadas
async consultarNotasBasica2025(params: {
  alumno_id: number;
  mes: number;
  anio: number;
}): Promise<NotaBasica2025Response[]>

// Ver consolidado mensual
async obtenerConsolidadoMensualAlumno(
  alumno_id: number,
  mes: number,
  anio: number
): Promise<ConsolidadoMensualResponse>

// Actualizar nota existente
async actualizarNotaBasica2025(
  id_nota: number,
  nota: number
): Promise<any>
```

### 2. `/src/components/NotasIngresoBasica2025.tsx` (NUEVO)

Componente completo para ingreso de notas con el nuevo sistema BÁSICA 2025.

**Características**:

- ✅ Selector de curso, asignatura, trimestre, mes y año
- ✅ Tabs para separar evaluaciones mensuales y trimestrales
- ✅ Para mensuales: Sistema expandible por alumno para agregar múltiples notas
- ✅ Para trimestrales: Inputs directos en tabla
- ✅ Validación de meses según trimestre
- ✅ Guardado automático con llamadas individuales al backend
- ✅ Cards informativos con porcentajes diferenciados por color
- ✅ Cálculo automático de promedios en tiempo real

---

## 🎨 UI/UX

### Colores

- **Mensuales**: Azul (`bg-blue-50`, `border-blue-200`, `text-blue-900`)
- **Trimestrales**: Púrpura (`bg-purple-50`, `border-purple-200`, `text-purple-900`)

### Estructura Visual

```
┌─────────────────────────────────────────────────┐
│ 📝 Ingreso de Notas - BÁSICA 2025              │
├─────────────────────────────────────────────────┤
│ [Curso ▼] [Asignatura ▼] [Año: 2025]          │
│ [Trimestre ▼] [Mes ▼]                          │
├─────────────────────────────────────────────────┤
│ [📅 Evaluaciones Mensuales] [📊 Trimestrales] │
├─────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐  │
│ │ 📋 Componentes Mensuales (35%)           │  │
│ │ • Tareas: 5%                             │  │
│ │ • Revisión de libros: 15%                │  │
│ │ • Laboratorio escrito: 15%               │  │
│ └───────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│ TABLA DE ALUMNOS CON NOTAS                     │
│ [Alumno] [Tareas] [Revisión] [Lab] [▼Acciones]│
│ ...                                             │
│ ┌─────────────────────────────────────────┐    │
│ │ EXPANDIDO: Agregar/Eliminar Notas       │    │
│ │ Tareas: [8.5] [9.0] [7.5] [+Agregar]    │    │
│ └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│                              [💾 Guardar Notas] │
└─────────────────────────────────────────────────┘
```

---

## ⚠️ Validaciones Importantes

### Meses por Trimestre

```typescript
const MESES_POR_TRIMESTRE = {
  1: [2, 3, 4], // Trimestre 1: Febrero, Marzo, Abril
  2: [5, 6, 7], // Trimestre 2: Mayo, Junio, Julio
  3: [8, 9, 10], // Trimestre 3: Agosto, Septiembre, Octubre
};
```

### Validación de Nota

```typescript
if (nota < 0 || nota > 10) {
  throw new Error('Nota debe estar entre 0 y 10');
}
```

### Validación de tipo_actividad

```typescript
const tipoActividad = formato.componentes.find(
  (c) => c.nombre === tipo_actividad_input
);

if (!tipoActividad) {
  throw new Error('Tipo de actividad no válido');
}
```

---

## 🚀 Próximos Pasos

1. **Testing con datos reales**:
   - Probar ingreso de múltiples tareas
   - Verificar cálculos de promedios
   - Validar guardado y recuperación de notas

2. **Mejoras UX**:
   - Agregar tooltips explicativos
   - Mostrar preview de cálculos en tiempo real
   - Confirmación antes de guardar

3. **Funcionalidades adicionales**:
   - Editar notas existentes (PATCH)
   - Eliminar notas guardadas
   - Exportar consolidado a Excel/PDF

4. **Integración con reportes**:
   - Boleta mensual con nuevo formato
   - Boleta trimestral consolidada
   - Resumen anual

---

## 📞 Soporte

Para preguntas sobre el nuevo sistema BÁSICA 2025, contactar al equipo de desarrollo.

**Fecha de implementación**: 9 de noviembre de 2025  
**Estado**: ✅ Implementado - Pendiente de testing
