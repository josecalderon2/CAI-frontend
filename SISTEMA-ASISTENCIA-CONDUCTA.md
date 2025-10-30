# 📋 Sistema de Asistencia y Conducta - Especificación Completa

## 🎯 Resumen del Sistema

El sistema permite:

1. **Tomar asistencia** diaria con 4 estados diferentes
2. **Registrar infracciones** durante la toma de asistencia
3. **Generar resúmenes** mensuales y trimestrales con cálculo automático de conducta

---

## 📊 Estados de Asistencia

| Estado          | Código | Color   | Descripción                | Impacto en Conducta               |
| --------------- | ------ | ------- | -------------------------- | --------------------------------- |
| **Presente**    | `P`    | Verde   | Alumno asistió normalmente | ✅ Ninguno                        |
| **Atraso**      | `A`    | Rojo    | Llegó tarde a clase        | ⚠️ Se cuenta pero no resta puntos |
| **Sin Permiso** | `SP`   | Naranja | Ausente sin justificación  | ❌ **-0.2 puntos** por cada una   |
| **Con Permiso** | `E`    | Azul    | Ausente con justificación  | ✅ Ninguno (justificada)          |

---

## 🔢 Fórmula de Cálculo de Conducta

### Fórmula Final:

```
Nota de Conducta = 10 - (Total_SP × 0.2) - Suma_Puntos_Infracciones
```

### Donde:

- **Total_SP**: Total de ausencias sin permiso (estado `SP`)
- **Suma_Puntos_Infracciones**: Suma de todos los puntos de infracciones según categoría:
  - `MENOS_GRAVE`: **-1 punto** por cada infracción
  - `GRAVE`: **-2 puntos** por cada infracción
  - `MUY_GRAVE`: **-3 puntos** por cada infracción

### Ejemplo de Cálculo:

```
Alumno: Juan Pérez
- Ausencias sin permiso (SP): 5
- Infracciones:
  * 2 × MENOS_GRAVE = 2 × 1 = -2 puntos
  * 1 × GRAVE = 1 × 2 = -2 puntos
  * 0 × MUY_GRAVE = 0 × 3 = 0 puntos

Cálculo:
10 - (5 × 0.2) - (2 + 2 + 0)
= 10 - 1.0 - 4
= 5.0 puntos

Resultado: 5.0 (REPROBADO)
```

---

## 📅 Lógica de Trimestres

El año académico se divide en 3 trimestres de 4 meses cada uno:

| Trimestre | Meses                  | Cálculo                     |
| --------- | ---------------------- | --------------------------- |
| **T1**    | Enero - Abril          | `mes ≤ 4` → Trimestre 1     |
| **T2**    | Mayo - Agosto          | `5 ≤ mes ≤ 8` → Trimestre 2 |
| **T3**    | Septiembre - Diciembre | `mes ≥ 9` → Trimestre 3     |

**Código TypeScript:**

```typescript
const mes = fecha.getMonth() + 1; // 1-12
const trimestre = Math.ceil(mes / 4); // 1, 2 o 3
```

---

## 🔄 Flujo de Trabajo

### 1️⃣ Toma de Asistencia Diaria

1. **Seleccionar curso** y **fecha**
2. Para cada alumno:
   - Marcar estado: `P`, `A`, `SP`, o `E`
   - **OPCIONAL**: Agregar infracciones del día desde dropdown
   - **OPCIONAL**: Agregar observaciones
3. **Guardar** → Se crean registros de:
   - `Asistencia` (con estado, trimestre automático)
   - `Conducta` (si hay infracciones seleccionadas)

### 2️⃣ Resumen Mensual

**Endpoint:** `GET /resumen/asistencia-mensual?cursoId={id}&mes={1-12}&anio={2025}`

**Retorna:**

```typescript
[
  {
    id_alumno: 123,
    nombre: 'Juan',
    apellido: 'Pérez',
    justificadas: 2, // Total estado 'E'
    injustificadas: 5, // Total estado 'SP'
    atrasos: 3, // Total estado 'A'
  },
  // ... más alumnos
];
```

**Cálculo Backend:**

```sql
SELECT
  a.id_alumno,
  al.nombre,
  al.apellido,
  COUNT(CASE WHEN asi.estado = 'E' THEN 1 END) as justificadas,
  COUNT(CASE WHEN asi.estado = 'SP' THEN 1 END) as injustificadas,
  COUNT(CASE WHEN asi.estado = 'A' THEN 1 END) as atrasos
FROM AlumnoCurso a
JOIN Alumno al ON a.id_alumno = al.id_alumno
LEFT JOIN Asistencia asi ON asi.id_alumno = a.id_alumno
WHERE a.id_curso = :cursoId
  AND EXTRACT(MONTH FROM asi.fecha) = :mes
  AND EXTRACT(YEAR FROM asi.fecha) = :anio
GROUP BY a.id_alumno, al.nombre, al.apellido
```

### 3️⃣ Resumen Trimestral (con Conducta)

**Endpoint:** `GET /resumen/trimestral?cursoId={id}&trimestre={1-3}&anio={2025}`

**Retorna:**

```typescript
[
  {
    id_alumno: 123,
    nombre: 'Juan',
    apellido: 'Pérez',
    justificadas: 2, // Total estado 'E' en el trimestre
    injustificadas: 5, // Total estado 'SP' en el trimestre
    infracciones: [
      {
        categoria: 'MENOS_GRAVE',
        articulo: 'Art. 10',
        descripcion: 'Hablar en clase',
        puntos: 1,
        cantidad: 2, // Cuántas veces se cometió
      },
      {
        categoria: 'GRAVE',
        articulo: 'Art. 15',
        descripcion: 'Falta de respeto',
        puntos: 2,
        cantidad: 1,
      },
    ],
    puntajeConducta: 5.0, // CALCULADO: 10 - (5 × 0.2) - (2×1 + 1×2) = 5.0
  },
  // ... más alumnos
];
```

**Cálculo Backend:**

1. **Obtener asistencias del trimestre:**

```sql
SELECT id_alumno, estado
FROM Asistencia
WHERE trimestre = :trimestre
  AND anio_academico = :anio
  AND id_alumno IN (SELECT id_alumno FROM AlumnoCurso WHERE id_curso = :cursoId)
```

2. **Obtener infracciones del trimestre:**

```sql
SELECT
  c.id_alumno,
  ic.categoria,
  ic.articulo,
  ic.descripcion,
  ic.puntos,
  COUNT(*) as cantidad
FROM Conducta c
JOIN InfraccionCatalogo ic ON c.id_infraccion = ic.id_infraccion
WHERE c.anio_academico = :anio
  AND EXTRACT(MONTH FROM c.fecha) BETWEEN :mesInicio AND :mesFin
  AND c.id_alumno IN (SELECT id_alumno FROM AlumnoCurso WHERE id_curso = :cursoId)
GROUP BY c.id_alumno, ic.id_infraccion, ic.categoria, ic.articulo, ic.descripcion, ic.puntos
```

3. **Calcular puntaje de conducta:**

```typescript
const puntajeConducta =
  10 -
  injustificadas * 0.2 -
  infracciones.reduce((sum, inf) => {
    let puntosPorCategoria = 1; // MENOS_GRAVE por defecto
    if (inf.categoria === 'GRAVE') puntosPorCategoria = 2;
    if (inf.categoria === 'MUY_GRAVE') puntosPorCategoria = 3;
    return sum + inf.cantidad * puntosPorCategoria;
  }, 0);
```

---

## 🎨 UI - Componente Frontend

### Cambios Implementados:

✅ **1. Campo RUT eliminado** de la lista de alumnos

✅ **2. Labels actualizados:**

- "Eximido" → **"Justificado/Con Permiso"**
- "Ausente" → **"Atraso/Tarde"**
- "Sin Permiso" → **"Ausente Sin Permiso"**

✅ **3. Selector de infracciones** en cada fila de alumno:

- Dropdown con todas las infracciones del catálogo
- Muestra categoría, artículo y descripción
- Permite agregar múltiples infracciones por alumno
- Badges de colores según gravedad
- Click en badge para eliminar

✅ **4. Tarjeta de ayuda** explicando:

- Significado de cada estado
- Impacto en el cálculo de conducta
- Fórmula completa visible

✅ **5. Resúmenes actualizados:**

- **Mensual**: Justificadas, Injustificadas, Atrasos
- **Trimestral**: + Infracciones detalladas + Nota de Conducta

---

## 🚀 Flujo Completo de Uso

### Caso de Uso: "Tomar asistencia del 28 de octubre"

1. **Orientador ingresa** al módulo de Asistencia
2. **Selecciona** curso "5° Básico A"
3. **Selecciona** fecha: 28/10/2025 (mes 10 → Trimestre 3)
4. **Para cada alumno:**

   ```
   Juan Pérez:
   - Estado: SP (Ausente sin permiso)
   - Infracción: "Art. 12 - Llegó tarde 3 veces" (MENOS_GRAVE)

   María González:
   - Estado: P (Presente)
   - Sin infracciones

   Pedro López:
   - Estado: E (Ausente con permiso médico)
   - Observación: "Licencia médica adjunta"
   ```

5. **Click en "Guardar Asistencia"**

6. **Sistema crea:**

   ```sql
   INSERT INTO Asistencia (id_alumno, id_asignatura, id_orientador, fecha, estado, trimestre, anio_academico)
   VALUES
     (1, 10, 5, '2025-10-28', 'SP', 3, '2025'),
     (2, 10, 5, '2025-10-28', 'P', 3, '2025'),
     (3, 10, 5, '2025-10-28', 'E', 3, '2025');

   INSERT INTO Conducta (id_alumno, id_orientador, id_infraccion, fecha, anio_academico)
   VALUES (1, 5, 'uuid-de-art-12', '2025-10-28', '2025');
   ```

7. **Notificación:** "Asistencia guardada: 3 alumnos y 1 infracción"

---

## 📈 Generación de Resúmenes

### Resumen Trimestral de Juan Pérez (ejemplo)

**Parámetros:**

- Curso: 5° Básico A (ID=10)
- Trimestre: 3 (meses 9-12)
- Año: 2025

**Datos encontrados:**

- Justificadas (E): 2
- Injustificadas (SP): 5
- Infracciones:
  - Art. 12 (MENOS_GRAVE): 3 veces
  - Art. 20 (GRAVE): 1 vez

**Cálculo:**

```
Nota = 10 - (5 × 0.2) - (3 × 1 + 1 × 2)
     = 10 - 1.0 - (3 + 2)
     = 10 - 1.0 - 5
     = 4.0
```

**Resultado mostrado:**

```
╔═══════════════════════════════════════════════════════════╗
║ Juan Pérez                                                ║
║ Justificadas: 2 | Injustificadas: 5                       ║
║ Infracciones:                                             ║
║   • Art. 12 (MENOS_GRAVE): 3x (-1 pts c/u)               ║
║   • Art. 20 (GRAVE): 1x (-2 pts)                         ║
║ Nota de Conducta: 4.0 ⚠️                                 ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 🔍 Verificación de Implementación

### Checklist Backend:

- [ ] Endpoint `/resumen/asistencia-mensual` retorna array de ResumenMensualResponse
- [ ] Endpoint `/resumen/trimestral` retorna array de ResumenTrimestralResponse
- [ ] Campo `trimestre` se calcula automáticamente en Asistencia
- [ ] Infracciones se agrupan por categoría en resumen trimestral
- [ ] `puntajeConducta` se calcula con la fórmula correcta
- [ ] Filtra por rango de meses del trimestre (1-4, 5-8, 9-12)

### Checklist Frontend:

- [x] Campo RUT eliminado de la UI
- [x] Labels actualizados (Justificado, Atraso, etc.)
- [x] Dropdown de infracciones por alumno
- [x] Badges de infracciones con colores por categoría
- [x] Tarjeta de ayuda con explicación de estados
- [x] Resumen mensual muestra: justificadas, injustificadas, atrasos
- [x] Resumen trimestral muestra: + infracciones + nota conducta
- [x] Guardado masivo de asistencia + infracciones

---

## 📝 Notas Importantes

1. **Trimestres son de 4 meses**, no 3 como en algunos sistemas
2. **Estado 'A' (Atraso)** se cuenta pero NO resta puntos en conducta
3. **Infracciones se pueden asignar** durante la toma de asistencia o después
4. **El backend debe calcular** el `puntajeConducta` y enviarlo al frontend
5. **Frontend solo muestra** el resultado, no hace el cálculo (para consistencia)

---

## 🎓 Escala de Calificación de Conducta

| Rango      | Calificación | Color        |
| ---------- | ------------ | ------------ |
| 9.0 - 10.0 | Excelente    | Verde oscuro |
| 7.0 - 8.9  | Buena        | Verde claro  |
| 6.0 - 6.9  | Suficiente   | Amarillo     |
| 4.0 - 5.9  | Insuficiente | Naranja      |
| 0.0 - 3.9  | Deficiente   | Rojo         |

---

**Fecha de creación:** 28 de octubre de 2025  
**Versión:** 1.0  
**Estado:** ✅ Frontend implementado, pendiente verificación backend
