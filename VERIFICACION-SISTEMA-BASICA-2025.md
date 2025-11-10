# 🔍 Verificación del Sistema BÁSICA 2025 - Documentación para Backend

## 📋 Resumen

Este documento explica cómo el frontend detecta si una asignatura usa el sistema BÁSICA 2025 y qué información necesita del backend.

---

## 🔌 Endpoint Utilizado

**Endpoint:** `GET /sistema-evaluacion/formato-evaluacion/asignatura/:id_asignatura`

**Servicio Frontend:** `notasService.obtenerFormatoEvaluacion(id_asignatura)`

---

## 📦 Respuesta Esperada del Backend

### Para BÁSICA 2025 (NUEVO SISTEMA)

```json
{
  "nivel": "BASICA",
  "asignatura": {
    "id": 1,
    "nombre": "Matemática",
    "curso": "Primero Básico A"
  },
  "componentes": [
    {
      "nombre": "Tareas (Mensual)",
      "porcentaje": 5,
      "tipo": "ACTIVIDAD",
      "periodo": "MENSUAL"
    },
    {
      "nombre": "Revisión de libros (Mensual)",
      "porcentaje": 15,
      "tipo": "ACTIVIDAD",
      "periodo": "MENSUAL"
    },
    {
      "nombre": "Laboratorio (Mensual)",
      "porcentaje": 15,
      "tipo": "ACTIVIDAD",
      "periodo": "MENSUAL"
    },
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

### Para BACHILLERATO (SISTEMA DIFERENTE)

```json
{
  "nivel": "BACHILLERATO",
  "asignatura": {
    "id": 10,
    "nombre": "Física",
    "curso": "Primero Bachillerato"
  },
  "componentes_bachillerato": [
    {
      "nombre": "Actividades",
      "porcentaje": 25,
      "actividades": [...]
    },
    {
      "nombre": "Tareas",
      "porcentaje": 5,
      "actividades": [...]
    }
  ],
  "incluye_examen_parcial": true,
  "incluye_examen_periodo": true
}
```

---

## ✅ Lógica de Validación en el Frontend

```typescript
const formatoData = await notasService.obtenerFormatoEvaluacion(
  asignaturaSeleccionada
);

// VERIFICACIÓN 1: Nivel debe ser 'BASICA'
if (formatoData.nivel !== 'BASICA') {
  setError('Esta asignatura no usa el sistema BÁSICA 2025');
  return;
}

// VERIFICACIÓN 2: Debe tener el array 'componentes'
if (!formatoData.componentes) {
  setError('Esta asignatura no usa el sistema BÁSICA 2025');
  return;
}

// ✅ Si pasa ambas validaciones, es BÁSICA 2025
setFormato(formatoData as FormatoEvaluacionBasicaResponse);
```

---

## 🎯 Criterios para que una Asignatura use BÁSICA 2025

Una asignatura usa el sistema BÁSICA 2025 si cumple **TODAS** estas condiciones:

### ✅ Condición 1: `nivel === 'BASICA'`

- El campo `nivel` debe tener exactamente el valor `'BASICA'`
- **No** `'BACHILLERATO'`
- Es case-sensitive

### ✅ Condición 2: Existe el array `componentes`

- Debe existir la propiedad `componentes`
- Debe ser un array
- No debe estar vacío
- Cada componente debe tener:
  - `nombre`: string
  - `porcentaje`: number
  - `tipo`: 'ACTIVIDAD' | 'EXAMEN'
  - `periodo`: 'MENSUAL' | 'TRIMESTRAL'

### ✅ Condición 3: Estructura de componentes correcta

**Componentes Mensuales (35% total):**

```json
[
  {
    "nombre": "Tareas (Mensual)",
    "porcentaje": 5,
    "tipo": "ACTIVIDAD",
    "periodo": "MENSUAL"
  },
  {
    "nombre": "Revisión de libros (Mensual)",
    "porcentaje": 15,
    "tipo": "ACTIVIDAD",
    "periodo": "MENSUAL"
  },
  {
    "nombre": "Laboratorio (Mensual)",
    "porcentaje": 15,
    "tipo": "ACTIVIDAD",
    "periodo": "MENSUAL"
  }
]
```

**Componentes Trimestrales (65% total):**

```json
[
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
```

---

## 🔧 Cómo el Backend Debe Configurar esto

### Opción 1: Configuración en Base de Datos

Tabla sugerida: `sistemas_evaluacion` o similar

```sql
-- Ejemplo de configuración
INSERT INTO sistemas_evaluacion (
  id_asignatura,
  nivel,
  componentes_json
) VALUES (
  1, -- id de la asignatura
  'BASICA',
  '[
    {"nombre": "Tareas (Mensual)", "porcentaje": 5, "tipo": "ACTIVIDAD", "periodo": "MENSUAL"},
    {"nombre": "Revisión de libros (Mensual)", "porcentaje": 15, "tipo": "ACTIVIDAD", "periodo": "MENSUAL"},
    ...
  ]'
);
```

### Opción 2: Detectar por Grado Académico

```javascript
// Pseudocódigo backend
function obtenerFormatoEvaluacion(id_asignatura) {
  const asignatura = await getAsignatura(id_asignatura);
  const curso = await getCurso(asignatura.id_curso);
  const grado = curso.gradoAcademico;

  // Grados 1º-9º = BÁSICA 2025
  if (grado.nivel === 'BASICA') {
    return {
      nivel: 'BASICA',
      asignatura: {...},
      componentes: [
        // Componentes mensuales
        { nombre: "Tareas (Mensual)", porcentaje: 5, tipo: "ACTIVIDAD", periodo: "MENSUAL" },
        { nombre: "Revisión de libros (Mensual)", porcentaje: 15, tipo: "ACTIVIDAD", periodo: "MENSUAL" },
        { nombre: "Laboratorio (Mensual)", porcentaje: 15, tipo: "ACTIVIDAD", periodo: "MENSUAL" },
        // Componentes trimestrales
        { nombre: "Actividad Integradora (Trimestral)", porcentaje: 25, tipo: "ACTIVIDAD", periodo: "TRIMESTRAL" },
        { nombre: "Autoevaluación (Trimestral)", porcentaje: 10, tipo: "ACTIVIDAD", periodo: "TRIMESTRAL" },
        { nombre: "Examen (Trimestral)", porcentaje: 30, tipo: "EXAMEN", periodo: "TRIMESTRAL" }
      ]
    };
  }

  // Grados 1º-2º Bachillerato = BACHILLERATO
  if (grado.nivel === 'BACHILLERATO') {
    return {
      nivel: 'BACHILLERATO',
      asignatura: {...},
      componentes_bachillerato: [...]
    };
  }
}
```

---

## 🐛 Problemas Comunes y Soluciones

### ❌ Error: "Esta asignatura no usa el sistema BÁSICA 2025"

**Causa 1: `nivel` incorrecto**

```json
// ❌ INCORRECTO
{ "nivel": "basica" }  // minúsculas
{ "nivel": "BÁSICA" }  // con tilde
{ "nivel": "Basica" }  // capitalizado

// ✅ CORRECTO
{ "nivel": "BASICA" }  // mayúsculas sin tilde
```

**Causa 2: Falta el array `componentes`**

```json
// ❌ INCORRECTO
{
  "nivel": "BASICA",
  "actividades": [...],  // nombre incorrecto
  "componentes_bachillerato": [...]
}

// ✅ CORRECTO
{
  "nivel": "BASICA",
  "componentes": [...]  // nombre exacto
}
```

**Causa 3: Array `componentes` vacío**

```json
// ❌ INCORRECTO
{
  "nivel": "BASICA",
  "componentes": []  // vacío
}

// ✅ CORRECTO
{
  "nivel": "BASICA",
  "componentes": [
    { "nombre": "Tareas (Mensual)", ... },
    // ...más componentes
  ]
}
```

---

## 🧪 Cómo Probar desde el Backend

### 1. Verificar el Endpoint

```bash
# Hacer una petición al endpoint
curl -X GET "http://localhost:3000/api/sistema-evaluacion/formato-evaluacion/asignatura/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Verificar la Respuesta

```javascript
// La respuesta debe tener esta estructura exacta
{
  "nivel": "BASICA",  // ✅ String "BASICA"
  "asignatura": {
    "id": 1,
    "nombre": "Matemática",
    "curso": "Primero Básico A"
  },
  "componentes": [  // ✅ Array con componentes
    {
      "nombre": "Tareas (Mensual)",
      "porcentaje": 5,
      "tipo": "ACTIVIDAD",
      "periodo": "MENSUAL"
    },
    // ... más componentes
  ]
}
```

### 3. Validar Estructura

```javascript
// Validación TypeScript (recomendado en backend)
interface ComponenteEvaluacionBasica {
  nombre: string;
  porcentaje: number;
  tipo: 'ACTIVIDAD' | 'EXAMEN';
  periodo: 'MENSUAL' | 'TRIMESTRAL';
}

interface FormatoEvaluacionBasicaResponse {
  nivel: 'BASICA';
  asignatura: {
    id: number;
    nombre: string;
    curso: string;
  };
  componentes: ComponenteEvaluacionBasica[];
}
```

---

## 📊 Ejemplo Completo de Respuesta

```json
{
  "nivel": "BASICA",
  "asignatura": {
    "id": 5,
    "nombre": "Lenguaje y Literatura",
    "curso": "Tercero Básico B"
  },
  "componentes": [
    {
      "nombre": "Tareas (Mensual)",
      "porcentaje": 5,
      "tipo": "ACTIVIDAD",
      "periodo": "MENSUAL"
    },
    {
      "nombre": "Revisión de libros (Mensual)",
      "porcentaje": 15,
      "tipo": "ACTIVIDAD",
      "periodo": "MENSUAL"
    },
    {
      "nombre": "Laboratorio (Mensual)",
      "porcentaje": 15,
      "tipo": "ACTIVIDAD",
      "periodo": "MENSUAL"
    },
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

**Validación de porcentajes:**

- Suma de componentes MENSUAL: 5% + 15% + 15% = **35%** ✅
- Suma de componentes TRIMESTRAL: 25% + 10% + 30% = **65%** ✅
- Total: **100%** ✅

---

## 🎓 Resumen para el Equipo de Backend

### Lo que el frontend NECESITA:

1. **Campo `nivel`**: Debe ser exactamente `"BASICA"` (string, mayúsculas, sin tilde)

2. **Array `componentes`**: Debe existir y contener 6 componentes con esta estructura:
   - 3 componentes con `periodo: "MENSUAL"` (35% total)
   - 3 componentes con `periodo: "TRIMESTRAL"` (65% total)

3. **Cada componente debe tener:**
   - `nombre`: string descriptivo
   - `porcentaje`: number (0-100)
   - `tipo`: "ACTIVIDAD" o "EXAMEN"
   - `periodo`: "MENSUAL" o "TRIMESTRAL"

### Pregunta clave para el backend:

**¿Cómo determinar si una asignatura usa BÁSICA 2025?**

Opciones:

- ✅ Por nivel del grado académico (1º-9º básico)
- ✅ Por año académico (2025 en adelante)
- ✅ Por configuración en tabla `sistemas_evaluacion`
- ✅ Combinación de los anteriores

---

## 📞 Contacto

Si hay dudas sobre la estructura de datos o necesitan ajustes, favor coordinar con el equipo de frontend.

**Fecha de creación:** 9 de noviembre de 2025
**Última actualización:** 9 de noviembre de 2025
