# 📊 ANÁLISIS COMPLETO DE ENDPOINTS - REPORTES DE NOTAS

## ✅ CORRECCIONES APLICADAS

### 1. **ReporteDetalladoAlumno - Campo `numeroMatricula` vs `codigo`**

- **Problema:** Frontend esperaba `alumno.codigo` pero backend envía `alumno.numeroMatricula`
- **Solución:** ✅ Interface actualizada, componente corregido en todas las vistas y exportaciones

### 2. **ReporteDetalladoAlumno - Campo `grado` vs `nivel`**

- **Problema:** Frontend esperaba `curso.nivel` (enum) pero backend envía `curso.grado` (string del nombre del grado académico)
- **Solución:** ✅ Interface actualizada para reflejar la estructura real del backend

### 3. **ReporteCalificacionesEvaluacion - Campo `seccion` nullable**

- **Problema:** `curso.seccion` puede ser null pero no estaba tipado como opcional
- **Solución:** ✅ Interface y renderizado actualizados para manejar valores null

---

## 📋 ENDPOINTS ANALIZADOS Y VALIDADOS

### 1️⃣ **GET /reportes-notas/evaluaciones**

**Propósito:** Lista de evaluaciones con porcentajes reales por asignatura

**Query Params:**

- `id_asignatura` (requerido): ID de la asignatura
- `anio` (opcional): Año académico
- `trimestre` (opcional): Trimestre 1-3 (solo BÁSICA)
- `periodo` (opcional): Periodo 1-4 (solo BACHILLERATO)

**Respuesta Backend:**

```typescript
{
  asignatura: { id_asignatura: number },
  anio_academico: string,
  distribucionPorcentajes: [
    {
      tipo: string,
      porcentajeBase: number,
      cantidad: number,
      porcentajeCadaUna: number,
      evaluaciones: [
        { id_evaluacion: number, nombre: string }
      ]
    }
  ],
  totalPorcentaje: number
}
```

**Estado:** ✅ Interface coincide perfectamente
**Componente:** `EvaluacionesPorAsignaturaView.tsx`

---

### 2️⃣ **GET /reportes-notas/evaluacion/:id/alumnos-calificaciones**

**Propósito:** Alumnos con sus calificaciones en una evaluación específica

**Path Params:**

- `id`: ID de la evaluación

**Respuesta Backend:**

```typescript
{
  id_evaluacion: number,
  nombre_evaluacion: string,
  asignatura: {
    id_asignatura: number,
    nombre: string
  },
  curso: {
    id_curso: number,
    nombre: string,
    seccion: string | null  // ✅ CORREGIDO: Ahora nullable
  },
  total_alumnos: number,
  alumnos_calificados: number,
  alumnos: [
    {
      id_alumno: number,
      nombre: string,
      apellido: string,
      genero: 'M' | 'F',
      calificacion: number | null,
      id_nota: number | null,
      tiene_calificacion: boolean
    }
  ]
}
```

**Estado:** ✅ Interface corregida para seccion nullable
**Componente:** `CalificacionesEvaluacionView.tsx`

---

### 3️⃣ **GET /reportes-notas/alumno/:id/notas**

**Propósito:** Historial completo de notas de un alumno

**Path Params:**

- `id`: ID del alumno

**Query Params:**

- `anio` (opcional): Año académico para filtrar

**Respuesta Backend:** Array directo

```typescript
[
  {
    id_nota: number,
    id_asignatura: number,
    trimestre: string,
    id_evaluacion: number,
    calificacion: number,
    fecha_registro: string,
    id_alumno: number,
    asignatura: {
      id_asignatura: number,
      nombre: string,
      orden_en_reporte: string,
      horas_semanas: number,
      id_metodo_evaluacion: number,
      id_tipo_asignatura: number,
      id_sistema_evaluacion: number,
      id_curso: number,
    },
    evaluacion: {
      id_evaluacion: number,
      nombre: string,
      puntaje_maximo: number,
      puntaje_minimo: number,
      id_tipo_evaluacion: number,
      id_asignatura: number,
      id_orientador: number,
      anio_academico: string,
      mes: number | null,
      trimestre: number | null,
      periodo: number | null,
      createdAt: string,
      tipoEvaluacion: {
        id_tipo_evaluacion: number,
        nombre: string,
        id_grado_academico: number,
        porcentaje: number,
        activo: boolean,
      },
    },
  },
];
```

**Estado:** ✅ Interface coincide perfectamente
**Componente:** `NotasAlumnoView.tsx`

---

### 4️⃣ **GET /reportes-notas/boleta/alumno/:id/detalle** ⭐ NUEVO

**Propósito:** Boleta detallada por trimestre/periodo para entregar a padres

**Path Params:**

- `id`: ID del alumno

**Query Params:**

- `anio` (opcional): Año académico
- `trimestre` (opcional): Trimestre 1-3 (solo BÁSICA)
- `periodo` (opcional): Periodo 1-4 (solo BACHILLERATO)

**Respuesta Backend:**

```typescript
{
  alumno: {
    id_alumno: number,
    nombre: string,
    apellido: string,
    numeroMatricula: string  // ✅ CORREGIDO: Era 'codigo' en frontend
  },
  curso: {
    id_curso: number,
    nombre: string,
    grado: string,  // ✅ CORREGIDO: Era 'nivel' en frontend
    es_bachillerato: boolean
  },
  periodo_academico: {
    anio: string,
    trimestre: number | null,
    periodo: number | null,
    nombre: string  // Ej: "Trimestre 1" o "Periodo 2"
  },
  asignaturas: [
    {
      id_asignatura: number,
      nombre: string,
      orientador: string | null,
      evaluaciones: [
        {
          id_evaluacion: number,
          nombre: string,
          tipo: string,
          porcentaje: number,
          trimestre: number | null,
          periodo: number | null,
          mes: number | null,
          nota: number | null,
          fecha_registro: Date | null
        }
      ],
      promedio_periodo: number | null
    }
  ],
  promedio_general_periodo: number | null,
  conductas: {
    total: number,
    puntos_acumulados: number,
    detalles: [
      {
        id_conducta: number,
        fecha: Date,
        observacion: string,
        orientador: string | null,
        infraccion: {
          categoria: 'MUY_GRAVE' | 'GRAVE' | 'MENOS_GRAVE',
          articulo: string,
          descripcion: string,
          puntos: number
        }
      }
    ]
  },
  asistencia: {
    total_registros: number,
    presentes: number,
    ausentes: number,
    tardanzas: number,
    porcentaje_asistencia: number | null
  }
}
```

**Estado:** ✅ Interfaces corregidas completamente
**Componente:** `ReporteDetalladoAlumnoView.tsx`

---

## 🎯 LÓGICA DE NEGOCIO VALIDADA

### Selector Trimestre vs Periodo

El componente `ReporteDetalladoAlumnoView` implementa correctamente la lógica:

1. **Detección automática:** Usa `reporte.curso.es_bachillerato` para determinar si mostrar selector de trimestre (1-3) o periodo (1-4)
2. **Fallback inteligente:** En primera carga, intenta con `trimestre`, si falla intenta con `periodo`
3. **Labels dinámicos:** El selector muestra "Trimestre" o "Periodo" según el tipo de curso

### Asistencia del Año Completo

- El endpoint devuelve asistencia de **TODO EL AÑO**, no solo del trimestre/periodo
- Estados: `P` (Presente), `E` (Excusa), `SP` (Sin Permiso/Ausente), `A` (Ausente/Tardanza)
- Cálculo: `(presentes + excusas) / total * 100`

### Conductas Filtradas

- Backend filtra conductas por `trimestre` (BÁSICA) o `periodo` (BACHILLERATO)
- Incluye nombre del orientador que registró la infracción
- Suma total de puntos acumulados en el periodo

---

## 🔄 ENDPOINTS NO UTILIZADOS (pero disponibles)

### **GET /reportes-notas/promedios/alumno/:id**

- **Propósito:** Todos los promedios (mensuales, trimestrales, periodos, finales)
- **Estado:** Disponible pero no usado en la UI actual
- **Uso potencial:** Para un reporte más detallado de evolución de promedios

### **GET /reportes-notas/boleta/alumno/:id**

- **Propósito:** Boleta completa del año (todas las asignaturas)
- **Estado:** ❌ Eliminado del menú de reportes (reemplazado por reporte detallado)
- **Componente eliminado:** `BoletaAlumnoView.tsx`

---

## ⚠️ RECOMENDACIONES

### 1. Backend: Estandarizar nombres de campos

- Considerar usar `codigo` o `numeroMatricula` consistentemente en toda la API
- El frontend ahora usa `numeroMatricula` para coincidir con el backend

### 2. Frontend: Validación de datos

- ✅ Ya implementado: Manejo de valores null en `seccion`, `orientador`, `nota`
- ✅ Ya implementado: Validación de array vacío en `distribucionPorcentajes`

### 3. Tipos de Conducta

- Backend usa: `MUY_GRAVE`, `GRAVE`, `MENOS_GRAVE`
- Frontend esperaba también: `LEVE` (no usado actualmente)
- ⚠️ Considerar si `LEVE` debe agregarse al backend o removerse del frontend

---

## 📝 RESUMEN DE CAMBIOS APLICADOS

1. ✅ Interface `ReporteDetalladoAlumno` actualizada:
   - `alumno.codigo` → `alumno.numeroMatricula`
   - `curso.nivel` → `curso.grado`

2. ✅ Interface `ReporteCalificacionesEvaluacion` actualizada:
   - `curso.seccion: string` → `curso.seccion: string | null`

3. ✅ Componente `ReporteDetalladoAlumnoView.tsx` actualizado:
   - Render de "Número de Matrícula" en lugar de "Código"
   - Nombres de archivos PDF/Excel incluyen numeroMatricula
   - Todos los usos de `codigo` reemplazados por `numeroMatricula`

4. ✅ Componente `CalificacionesEvaluacionView.tsx` actualizado:
   - Manejo seguro de `curso.seccion` nullable en renderizado

---

**Estado Final:** ✅ TODAS LAS INTERFACES Y COMPONENTES ALINEADOS CON EL BACKEND

**Fecha de análisis:** 13 de noviembre de 2025
