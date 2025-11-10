# 🚀 GUÍA RÁPIDA DE USO - Sistema BÁSICA 2025

## 📌 Para Empezar

### 1. Acceder al Sistema

```
Dashboard → Módulo de Notas → Seleccionar "BÁSICA 2025"
```

### 2. Configuración Inicial

1. **Seleccionar Curso**: Ejemplo: "5to Grado A"
2. **Seleccionar Asignatura**: Ejemplo: "Matemática"
3. **Seleccionar Año**: 2025
4. **Seleccionar Trimestre**: 1, 2 o 3
5. **Seleccionar Mes**: Febrero, Marzo, Abril (según trimestre)

---

## 📅 Ingresar Evaluaciones Mensuales

### Paso 1: Ir al Tab "Evaluaciones Mensuales"

```
[ 📅 Evaluaciones Mensuales (35%) ] [ 📊 Evaluaciones Trimestrales (65%) ]
  ↑ Click aquí
```

### Paso 2: Expandir Alumno

```
┌────────────────────────────────────────────────┐
│ Juan Pérez    8.5 (5)   9.0 (1)   [▼ Ver/Editar] │ ← Click aquí
└────────────────────────────────────────────────┘
```

### Paso 3: Agregar Tareas

```
EXPANDIDO:
Tareas: [8.5] [9.0] [7.5] [9.5] [8.0]  [+ Agregar]
        ↑     ↑     ↑     ↑     ↑
     Notas ya guardadas

[Input: 8.0] [Agregar] ← Agregar nueva tarea
```

**Para agregar múltiples tareas**:

1. Escribir nota en el input (ej: 8.5)
2. Click en "Agregar"
3. Repetir para cada tarea

### Paso 4: Agregar Revisión y Laboratorio

De la misma manera, agregar notas para:

- **Revisión de libros y cuadernos**: 1 o más notas
- **Laboratorio escrito**: 1 o más notas

### Paso 5: Guardar

```
[💾 Guardar Notas] ← Click aquí
```

El sistema guardará **cada nota individualmente** en el backend.

---

## 📊 Ingresar Evaluaciones Trimestrales

### Paso 1: Ir al Tab "Evaluaciones Trimestrales"

```
[ 📅 Evaluaciones Mensuales (35%) ] [ 📊 Evaluaciones Trimestrales (65%) ]
                                      ↑ Click aquí
```

### Paso 2: Ingresar Notas Directamente

```
┌────────────────┬──────────────────┬───────────────┬─────────┐
│ Alumno         │ Act. Integradora │ Autoevaluación│ Examen  │
│                │ (25%)            │ (10%)         │ (30%)   │
├────────────────┼──────────────────┼───────────────┼─────────┤
│ Juan Pérez     │ [9.5]            │ [8.0]         │ [9.0]   │
│                │  ↑               │  ↑            │  ↑      │
│                │  Escribir nota directamente                │
└────────────────┴──────────────────┴───────────────┴─────────┘
```

**Solo una nota por componente** (no múltiples como en mensuales).

### Paso 3: Guardar

```
[💾 Guardar Notas] ← Click aquí
```

---

## ⚠️ Validaciones Automáticas

### ✅ Nota Válida

```
✓ Rango: 0.0 - 10.0
✓ Decimales permitidos: 0.1, 0.5, etc.
✗ Valores fuera de rango: -1, 11, etc.
```

### ✅ Mes Válido según Trimestre

```
Trimestre 1 → Solo permite: Febrero, Marzo, Abril
Trimestre 2 → Solo permite: Mayo, Junio, Julio
Trimestre 3 → Solo permite: Agosto, Septiembre, Octubre
```

---

## 📋 Ejemplos Rápidos

### Ejemplo 1: Ingresar 5 Tareas para un Alumno

```
1. Tab "Mensuales" → Expandir alumno
2. Sección "Tareas":
   Input: 8.5 → [Agregar]
   Input: 9.0 → [Agregar]
   Input: 7.5 → [Agregar]
   Input: 9.5 → [Agregar]
   Input: 8.0 → [Agregar]
3. [Guardar Notas]

Resultado: 5 tareas guardadas
Promedio automático: 8.5
```

### Ejemplo 2: Ingresar Examen Trimestral

```
1. Tab "Trimestrales"
2. Columna "Examen (30%)":
   Input: 9.0
3. [Guardar Notas]

Resultado: 1 examen guardado
Aporte: 2.7 puntos (9.0 × 0.30)
```

---

## 🔄 Editar Notas Existentes

### Para Notas Mensuales (con múltiples valores):

```
1. Expandir alumno
2. Ver notas existentes: [8.5] [9.0] [7.5]
3. Para eliminar: Click en [✕] junto a la nota
4. Para agregar nueva: Usar input + [Agregar]
5. [Guardar Notas]
```

### Para Notas Trimestrales (valor único):

```
1. Tab "Trimestrales"
2. Modificar valor en el input directamente
3. [Guardar Notas]
```

---

## 🎯 Tips y Mejores Prácticas

### ✅ DO (Hacer)

- ✓ Guardar frecuentemente
- ✓ Verificar promedios antes de guardar
- ✓ Usar selector de mes correcto según trimestre
- ✓ Ingresar todas las notas mensuales antes de las trimestrales

### ❌ DON'T (No Hacer)

- ✗ No cambiar de curso sin guardar
- ✗ No ingresar notas fuera de rango
- ✗ No mezclar meses de diferentes trimestres
- ✗ No dejar componentes requeridos vacíos

---

## 💡 Casos de Uso Comunes

### Caso 1: Primer Ingreso del Mes

```
Objetivo: Ingresar todas las notas mensuales de Noviembre

1. Curso: 5to Grado A
2. Asignatura: Matemática
3. Trimestre: 3
4. Mes: Noviembre
5. Tab: Mensuales
6. Para cada alumno:
   - Agregar tareas (las que tenga)
   - Agregar revisión
   - Agregar laboratorio
7. Guardar
```

### Caso 2: Completar Notas Trimestrales (Fin de Trimestre)

```
Objetivo: Ingresar evaluaciones finales del trimestre

1. Tab: Trimestrales
2. Para cada alumno:
   - Actividad Integradora: [nota]
   - Autoevaluación: [nota]
   - Examen: [nota]
3. Guardar
```

### Caso 3: Corregir una Tarea

```
Objetivo: Cambiar nota de una tarea específica

1. Tab: Mensuales
2. Expandir alumno
3. Sección "Tareas": Ver [8.5] [9.0] [7.5]
4. Eliminar tarea incorrecta: Click [✕] en [7.5]
5. Agregar tarea correcta: Input: 8.0 → [Agregar]
6. Guardar
```

---

## 🆘 Resolución de Problemas

### Problema 1: "No se muestran alumnos"

```
Solución:
1. Verificar que el curso esté seleccionado
2. Verificar que la asignatura esté seleccionada
3. Verificar que el curso tenga alumnos matriculados
```

### Problema 2: "No puedo seleccionar el mes X"

```
Solución:
1. Verificar el trimestre seleccionado
2. Cada trimestre solo permite sus propios meses:
   - T1: Feb, Mar, Abr
   - T2: May, Jun, Jul
   - T3: Ago, Sep, Oct
```

### Problema 3: "Error al guardar notas"

```
Posibles causas:
1. Nota fuera de rango (0-10)
2. Tipo de actividad no válido
3. Conexión con backend perdida

Solución:
1. Verificar que todas las notas estén entre 0 y 10
2. Recargar la página y volver a intentar
3. Contactar soporte si el problema persiste
```

### Problema 4: "Los promedios no se calculan"

```
Solución:
1. Los promedios se calculan en el backend al guardar
2. En frontend solo se muestra un preview
3. Guardar las notas para ver el cálculo oficial
```

---

## 📞 Soporte y Ayuda

### Documentación Completa

- **Archivo**: `/SISTEMA-NOTAS-BASICA-2025.md`
- **Contiene**: Estructura completa del sistema, APIs, ejemplos

### Referencia Técnica

- **Archivo**: `/IMPLEMENTACION-SISTEMA-BASICA-2025-FINAL.md`
- **Contiene**: Detalles de implementación, interfaces, métodos

### Diagramas y Visuales

- **Archivo**: `/RESUMEN-VISUAL-BASICA-2025.md`
- **Contiene**: Diagramas de flujo, ejemplos visuales

---

## 🎓 Preguntas Frecuentes (FAQ)

**P: ¿Puedo ingresar notas trimestrales antes de las mensuales?**  
R: Sí, puedes ingresar en cualquier orden. El sistema calcula la nota final sumando ambos componentes.

**P: ¿Cuántas tareas puedo agregar por alumno?**  
R: No hay límite. Puedes agregar tantas tareas como necesites.

**P: ¿Qué pasa si elimino una tarea por error?**  
R: Deberás volver a agregarla. Por eso recomendamos guardar frecuentemente.

**P: ¿Puedo cambiar una nota después de guardarla?**  
R: Sí, simplemente elimina la nota incorrecta y agrega la correcta, luego guarda nuevamente.

**P: ¿El sistema calcula automáticamente el promedio?**  
R: Sí, el backend calcula automáticamente todos los promedios y aportes al guardar.

**P: ¿Dónde veo la nota final del trimestre?**  
R: La nota final se visualiza en el módulo de reportes o boletas del sistema.

---

## ✅ Checklist de Ingreso Completo

### Para un Mes Completo:

- [ ] Seleccionar curso y asignatura
- [ ] Seleccionar trimestre y mes correctos
- [ ] Tab "Mensuales":
  - [ ] Ingresar tareas para todos los alumnos
  - [ ] Ingresar revisiones para todos los alumnos
  - [ ] Ingresar laboratorios para todos los alumnos
- [ ] Guardar notas mensuales
- [ ] Verificar mensajes de éxito

### Para un Trimestre Completo:

- [ ] Completar los 3 meses mensuales
- [ ] Tab "Trimestrales":
  - [ ] Ingresar actividades integradoras
  - [ ] Ingresar autoevaluaciones
  - [ ] Ingresar exámenes
- [ ] Guardar notas trimestrales
- [ ] Verificar cálculo de nota final

---

## 🚀 ¡Listo para Usar!

El sistema está completamente funcional y listo para ingresar notas.

**¡Comienza a usar el sistema ahora!** 🎉

---

**Última actualización**: 9 de noviembre de 2025  
**Versión**: 1.0.0
