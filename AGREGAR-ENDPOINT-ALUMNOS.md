# 🔧 Agregar Endpoint para Obtener Alumnos por Curso

## 📁 Archivo 1: `cursos.controller.ts`

### Agregar este endpoint DESPUÉS del endpoint `findCursosAsignadosDocente`:

```typescript
/**
 * Obtener alumnos de un curso específico
 * Retorna la lista de alumnos matriculados en el curso
 */
@Get(':id/alumnos')
@Roles('Orientador', 'Admin', 'P.A')
@ApiOperation({
  summary: 'Obtener alumnos de un curso',
  description: 'Retorna todos los alumnos matriculados en un curso específico',
})
@ApiOkResponse({
  description: 'Lista de alumnos del curso',
})
async getAlumnosPorCurso(@Param('id', ParseIntPipe) id: number) {
  return this.service.getAlumnosPorCurso(id);
}
```

### 📍 Ubicación sugerida:

Agregar DESPUÉS del endpoint `findCursosAsignadosDocente` (línea ~95) y ANTES del endpoint `findOne`.

---

## 📁 Archivo 2: `cursos.service.ts`

### Agregar este método en la clase CursosService:

```typescript
/**
 * Obtener alumnos de un curso específico
 * Retorna la lista de alumnos matriculados activamente en el curso
 */
async getAlumnosPorCurso(cursoId: number) {
  // Verificar que el curso existe
  await this.findOne(cursoId);

  // Obtener alumnos del curso a través de la tabla pivote AlumnoCurso
  const alumnosCurso = await this.prisma.alumnoCurso.findMany({
    where: {
      cursoId: cursoId,
      estado: 'ACTIVO', // Solo alumnos activos
    },
    include: {
      alumno: {
        select: {
          id_alumno: true,
          nombre: true,
          apellido: true,
          rut: true,
        },
      },
    },
    orderBy: {
      alumno: {
        apellido: 'asc',
      },
    },
  });

  // Mapear para retornar solo los datos del alumno
  return alumnosCurso.map((ac) => ({
    id_alumno: ac.alumno.id_alumno,
    nombre: ac.alumno.nombre,
    apellido: ac.alumno.apellido,
    rut: ac.alumno.rut,
  }));
}
```

### 📍 Ubicación sugerida:

Agregar DESPUÉS del método `findCursosAsignadosDocente` (línea ~263) y ANTES del método `findCursoCupos`.

---

## 🧪 Testing

### 1. Verificar que el servidor esté corriendo:

```bash
cd /Users/rodolforivas/Documents/GitHub/CAI-backend
npm run start:dev
```

### 2. Probar el endpoint con curl:

```bash
# Reemplaza <TOKEN> con un token JWT válido
# Reemplaza {id} con el ID del curso (ejemplo: 1)
curl -X GET \
  http://localhost:3000/cursos/1/alumnos \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"
```

### 3. Respuesta esperada (ejemplo):

```json
[
  {
    "id_alumno": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "rut": "12345678-9"
  },
  {
    "id_alumno": 2,
    "nombre": "María",
    "apellido": "González",
    "rut": "98765432-1"
  }
]
```

---

## ✅ Checklist de Implementación

- [ ] 1. Abrir `src/cursos/cursos.controller.ts`
- [ ] 2. Agregar el endpoint `getAlumnosPorCurso` (código arriba)
- [ ] 3. Verificar imports necesarios (ya deberían estar):
  ```typescript
  import { ParseIntPipe } from '@nestjs/common';
  ```
- [ ] 4. Abrir `src/cursos/cursos.service.ts`
- [ ] 5. Agregar el método `getAlumnosPorCurso` (código arriba)
- [ ] 6. Guardar ambos archivos
- [ ] 7. El servidor debería recargar automáticamente (hot reload)
- [ ] 8. Probar el endpoint con curl o Postman
- [ ] 9. Verificar que retorna los alumnos del curso
- [ ] 10. Probar desde el frontend (debería funcionar automáticamente)

---

## 🔍 Verificación en el Frontend

Una vez implementado el backend, el frontend debería mostrar en consola:

```
🔍 Buscando cursos para orientador ID: 1
✅ Endpoint /cursos/asignados: 2 cursos encontrados
📚 Curso "Quinto Grado": {asignaturas_recibidas: 3, primera_asignatura: "Matemática I", tiene_asignatura: true}
✅ 2 curso(s) cargado(s) correctamente
✅ Alumnos cargados para curso 1: 15 alumnos
✅ Alumnos cargados para curso 2: 12 alumnos
```

Y al seleccionar un curso, deberías ver la lista de alumnos en la tabla.

---

## 🐛 Troubleshooting

### Error: "Curso no encontrado"

**Solución**: Verificar que el ID del curso existe en la base de datos

### Error: "AlumnoCurso is not defined"

**Solución**: Verificar que el modelo AlumnoCurso existe en schema.prisma:

```prisma
model AlumnoCurso {
  alumnoId  Int
  cursoId   Int
  estado    String  @default("ACTIVO")

  alumno    Alumno  @relation(fields: [alumnoId], references: [id_alumno])
  curso     Curso   @relation(fields: [cursoId], references: [id_curso])

  @@id([alumnoId, cursoId])
  @@map("alumno_curso")
}
```

### No retorna alumnos aunque existan en DB

**Solución**: Verificar que:

1. Los alumnos estén en la tabla `alumno_curso`
2. El campo `estado` sea `'ACTIVO'`
3. El `cursoId` coincida con el ID del curso

### Query SQL para verificar alumnos:

```sql
-- Ver alumnos de un curso específico
SELECT
  a.id_alumno,
  a.nombre,
  a.apellido,
  a.rut,
  ac.estado
FROM alumno_curso ac
INNER JOIN "Alumno" a ON ac."alumnoId" = a.id_alumno
WHERE ac."cursoId" = 1  -- Cambiar por el ID del curso
  AND ac.estado = 'ACTIVO'
ORDER BY a.apellido ASC;
```

---

## 📝 Notas Adicionales

### Estructura de la tabla AlumnoCurso

La tabla pivote `AlumnoCurso` conecta alumnos con cursos y permite:

- **Matricular alumnos** en cursos
- **Controlar el estado** (ACTIVO, INACTIVO, RETIRADO)
- **Gestionar cupos** (conteo de alumnos activos)

### Campos importantes:

- `alumnoId`: FK a la tabla Alumno
- `cursoId`: FK a la tabla Curso
- `estado`: Estado de la matrícula (ACTIVO por defecto)

---

**Última actualización**: 28 de octubre de 2025  
**Estado**: 📝 Listo para implementar
