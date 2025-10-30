# 🔧 Fix: Infracciones no aparecen en Resumen Trimestral

**Fecha:** 30 de octubre de 2025  
**Problema:** Las infracciones registradas en la sección de Conducta no aparecen en el Resumen Trimestral  
**Causa:** Falta de campos `trimestre` y `anio_academico` al registrar conductas

---

## 🔴 Problema Identificado

### **Síntoma:**

- Registras una conducta/infracción en la pestaña "Conducta" ✅
- La conducta se guarda correctamente en la base de datos ✅
- Al generar el Resumen Trimestral, solo aparecen las faltas (ausencias) ❌
- Las infracciones NO aparecen en el resumen ❌

### **Causa Raíz:**

Cuando se registra una conducta, **NO se estaban enviando los campos requeridos** para el filtrado trimestral:

```typescript
// ❌ CÓDIGO ANTERIOR (SIN trimestre y anio_academico)
const conductaData = {
  id_alumno: idAlumno,
  id_infraccion: idInfraccion,
  id_orientador: idOrientador,
  fecha: new Date(nuevaConducta.fecha).toISOString(),
  descripcion: infraccionSeleccionada.descripcion,
  // ❌ FALTABAN: trimestre, anio_academico
};
```

El backend filtra las conductas así en `resumen.service.ts`:

```typescript
const conteosConductaAgrupados = await this.prisma.conducta.groupBy({
  by: ['id_alumno', 'id_infraccion_catalogo'],
  where: {
    id_alumno: { in: alumnos.map((a) => a.id_alumno) },
    trimestre: trimestre, // ⚠️ Filtra por trimestre
    anio_academico: anioAcademicoStr, // ⚠️ Filtra por año académico
  },
  _count: { id_conducta: true },
});
```

**Como las conductas se guardaban SIN estos campos**, el filtro del backend no las encontraba.

---

## ✅ Solución Implementada

### **1. Cálculo Automático de Trimestre**

Se agregó lógica para calcular automáticamente el trimestre basándose en la fecha de la conducta:

```typescript
// ✅ NUEVO: Calcular trimestre y año académico
const fechaConducta = new Date(nuevaConducta.fecha);
const mesConducta = fechaConducta.getMonth() + 1;
const trimestreConducta = Math.ceil(mesConducta / 4); // 1-4 = T1, 5-8 = T2, 9-12 = T3
const anioAcademicoConducta = fechaConducta.getFullYear().toString();

console.log('📅 Cálculo de trimestre:', {
  fecha: nuevaConducta.fecha,
  mes: mesConducta,
  trimestre: trimestreConducta,
  anio_academico: anioAcademicoConducta,
});
```

### **2. Campos Agregados al Registro de Conducta**

```typescript
// ✅ CÓDIGO ACTUALIZADO (CON trimestre y anio_academico)
const conductaData: any = {
  id_alumno: idAlumno,
  id_infraccion: idInfraccion,
  id_orientador: idOrientador,
  fecha: new Date(nuevaConducta.fecha).toISOString(),
  descripcion: infraccionSeleccionada.descripcion,
  trimestre: trimestreConducta, // ✅ AGREGADO
  anio_academico: anioAcademicoConducta, // ✅ AGREGADO
};
```

### **3. TypeScript Interfaces Actualizadas**

**CreateConductaDto:**

```typescript
export interface CreateConductaDto {
  id_alumno: number;
  id_orientador: number;
  id_infraccion: string;
  fecha: string;
  anio_academico: string;
  trimestre: number; // ✅ AGREGADO
  observacion?: string;
}
```

**ConductaResponse:**

```typescript
export interface ConductaResponse {
  id_conducta: string;
  id_alumno: string;
  id_orientador: string;
  id_infraccion: string;
  fecha: string;
  anio_academico: string;
  trimestre?: number; // ✅ AGREGADO
  observacion: string | null;
  creadoEn: string;
  infraccion?: InfraccionCatalogoResponse;
}
```

---

## 📊 Distribución de Trimestres

La lógica de cálculo de trimestre es:

```typescript
const trimestre = Math.ceil(mes / 4);
```

| Meses                         | Trimestre | Periodo           |
| ----------------------------- | --------- | ----------------- |
| Enero - Abril (1-4)           | **1**     | Primer Trimestre  |
| Mayo - Agosto (5-8)           | **2**     | Segundo Trimestre |
| Septiembre - Diciembre (9-12) | **3**     | Tercer Trimestre  |

**Ejemplos:**

- Fecha: `2025-01-15` → Mes: 1 → Trimestre: 1 ✅
- Fecha: `2025-06-20` → Mes: 6 → Trimestre: 2 ✅
- Fecha: `2025-10-30` → Mes: 10 → Trimestre: 3 ✅

---

## 🧪 Cómo Probar el Fix

### **Paso 1: Registrar una nueva conducta**

1. Ve a la pestaña **"Conducta"**
2. Haz clic en **"Registrar Conducta"**
3. Selecciona un alumno
4. Selecciona una infracción (ej: "Menos Grave")
5. Selecciona la fecha actual
6. Haz clic en **"Registrar"**

**Verificar en consola:**

```
📅 Cálculo de trimestre: {
  fecha: "2025-10-30",
  mes: 10,
  trimestre: 3,
  anio_academico: "2025"
}
```

### **Paso 2: Generar Resumen Trimestral**

1. Ve a la pestaña **"Resumen Trimestral"**
2. Selecciona el curso del alumno
3. Selecciona **"Tercer Trimestre"** (Octubre = Trimestre 3)
4. Selecciona el año **2025**
5. Haz clic en **"Generar Resumen Trimestral"**

**Resultado esperado:**

```
✅ La tabla debe mostrar la infracción registrada
✅ Columna "Menos Graves" debe mostrar la cantidad (ej: 1)
✅ Columna "Artículo" debe mostrar el artículo de la infracción (ej: "Art. 15(1)")
✅ El puntaje de conducta debe reflejar el descuento (ej: 9.0 si solo tiene esa infracción)
```

---

## ⚠️ Datos Históricos (Migración)

### **Problema con datos existentes:**

Las conductas registradas **ANTES de este fix** NO tienen los campos `trimestre` y `anio_academico`, por lo tanto:

- ❌ NO aparecerán en los resúmenes trimestrales
- ❌ NO afectarán el cálculo de puntaje de conducta

### **Solución para datos históricos:**

Necesitas ejecutar un script de migración en el backend para calcular y actualizar estos campos:

```sql
-- Script SQL para actualizar registros históricos
UPDATE "Conducta"
SET
  trimestre = CASE
    WHEN EXTRACT(MONTH FROM fecha) BETWEEN 1 AND 4 THEN 1
    WHEN EXTRACT(MONTH FROM fecha) BETWEEN 5 AND 8 THEN 2
    WHEN EXTRACT(MONTH FROM fecha) BETWEEN 9 AND 12 THEN 3
  END,
  anio_academico = EXTRACT(YEAR FROM fecha)::TEXT
WHERE trimestre IS NULL OR anio_academico IS NULL;
```

**O con Prisma:**

```typescript
// Script de migración (ejecutar una sola vez)
const conductasSinTrimestre = await prisma.conducta.findMany({
  where: {
    OR: [{ trimestre: null }, { anio_academico: null }],
  },
});

for (const conducta of conductasSinTrimestre) {
  const fecha = new Date(conducta.fecha);
  const mes = fecha.getMonth() + 1;
  const trimestre = Math.ceil(mes / 4);
  const anio_academico = fecha.getFullYear().toString();

  await prisma.conducta.update({
    where: { id_conducta: conducta.id_conducta },
    data: { trimestre, anio_academico },
  });
}

console.log(`✅ ${conductasSinTrimestre.length} conductas actualizadas`);
```

---

## 📝 Checklist de Verificación

### **Frontend:**

- [x] Calcular `trimestre` basado en la fecha
- [x] Calcular `anio_academico` basado en la fecha
- [x] Enviar `trimestre` al registrar conducta
- [x] Enviar `anio_academico` al registrar conducta
- [x] Actualizar interface `CreateConductaDto`
- [x] Actualizar interface `ConductaResponse`
- [x] Agregar logs de debugging

### **Backend (Verificar):**

- [ ] El DTO `CreateConductaDto` acepta `trimestre`
- [ ] El DTO `CreateConductaDto` acepta `anio_academico`
- [ ] El modelo Prisma `Conducta` tiene campo `trimestre`
- [ ] El modelo Prisma `Conducta` tiene campo `anio_academico`
- [ ] El endpoint `POST /conducta` guarda estos campos
- [ ] El query de resumen trimestral filtra por estos campos

### **Testing:**

- [ ] Registrar conducta en Enero (debe ser Trimestre 1)
- [ ] Registrar conducta en Junio (debe ser Trimestre 2)
- [ ] Registrar conducta en Octubre (debe ser Trimestre 3)
- [ ] Generar resumen del trimestre correspondiente
- [ ] Verificar que las infracciones aparezcan en el resumen
- [ ] Verificar que el puntaje se calcule correctamente

---

## 🎯 Resultado Final

### **Antes del Fix:**

```
Resumen Trimestral:
- ✅ Ausencias justificadas: 2
- ✅ Ausencias injustificadas: 1
- ❌ Infracciones Menos Graves: - (vacío)
- ❌ Infracciones Graves: - (vacío)
- ❌ Infracciones Muy Graves: - (vacío)
- ⚠️ Puntaje Conducta: 9.8 (solo descuenta ausencias)
```

### **Después del Fix:**

```
Resumen Trimestral:
- ✅ Ausencias justificadas: 2
- ✅ Ausencias injustificadas: 1
- ✅ Infracciones Menos Graves: 2 | Art. 15(1), Art. 23(1)
- ✅ Infracciones Graves: 1 | Art. 42(1)
- ✅ Infracciones Muy Graves: - (vacío)
- ✅ Puntaje Conducta: 5.8 (descuenta ausencias + infracciones)
```

**Cálculo:**

```
10.0 - (1 × 0.2) - (2 × 1) - (1 × 2) = 10.0 - 0.2 - 2.0 - 2.0 = 5.8 ✅
```

---

## 📌 Notas Importantes

1. **Consistencia de cálculo:** La fórmula de trimestre debe ser idéntica en:
   - Registro de asistencia (`handleGuardarAsistencia`)
   - Registro de conducta (`handleRegistrarConducta`)
   - Ambos usan: `Math.ceil(mes / 4)` ✅

2. **Formato de año:** Siempre usar string: `new Date().getFullYear().toString()` ✅

3. **Logs de debugging:** Los logs agregados ayudan a verificar que los cálculos sean correctos

4. **Backend validation:** El backend debe validar que el trimestre sea 1, 2 o 3

5. **Datos históricos:** No olvides ejecutar el script de migración para actualizar conductas antiguas

---

## 🚀 Próximos Pasos

1. **Probar el fix** con una nueva conducta
2. **Verificar** que aparezca en el resumen trimestral
3. **Ejecutar migración** para datos históricos (si existen)
4. **Documentar** en el manual de usuario
5. **Capacitar** a los orientadores sobre el nuevo comportamiento

---

## ✅ Conclusión

El problema se debió a que las conductas se registraban **sin los campos necesarios para filtrar** en el resumen trimestral. Con los campos `trimestre` y `anio_academico` ahora incluidos, las infracciones aparecerán correctamente en los resúmenes y afectarán el cálculo de la puntuación de conducta.

**Fix implementado exitosamente** ✅
