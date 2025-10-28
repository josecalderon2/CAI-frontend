# 🔧 Cambios para Implementar en el Backend

## 📁 Archivo 1: `cursos.controller.ts`

### Agregar este endpoint DESPUÉS de los endpoints existentes:

```typescript
/**
 * Obtener cursos asignados a un orientador específico
 * Incluye cursos donde el orientador:
 * - Es el orientador titular (id_orientador)
 * - Está en el historial vigente
 * - Tiene asignaturas asignadas
 */
@Get('asignados/:orientadorId')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('orientador', 'admin', 'administrativo')
async findCursosAsignadosDocente(
  @Param('orientadorId', ParseIntPipe) orientadorId: number,
) {
  return this.cursosService.findCursosAsignadosDocente(orientadorId);
}
```

### 📍 Ubicación sugerida:

Agregar ANTES del endpoint de estadísticas (stats) o al final de los endpoints GET.

---

## 📁 Archivo 2: `cursos.service.ts`

### Agregar este método en la clase CursosService:

```typescript
/**
 * Buscar cursos asignados a un orientador
 * Retorna cursos donde el orientador tiene algún rol (titular, historial o asignatura)
 */
async findCursosAsignadosDocente(orientadorId: number) {
  const cursos = await this.prisma.curso.findMany({
    where: {
      activo: true,
      OR: [
        // Opción 1: Es orientador titular del curso
        {
          id_orientador: orientadorId
        },

        // Opción 2: Está en el historial como orientador o docente (vigente)
        {
          historialCurso: {
            some: {
              id_orientador: orientadorId,
              OR: [
                { fecha_fin: null },
                { fecha_fin: { gt: new Date() } }
              ]
            }
          }
        },

        // Opción 3: Tiene asignaturas asignadas a través de AsignaturaOrientador
        {
          asignaturas: {
            some: {
              orientadores: {
                some: {
                  id_orientador: orientadorId,
                  activo: true
                }
              }
            }
          }
        }
      ]
    },
    include: {
      gradoAcademico: {
        select: {
          id_grado_academico: true,
          nombre: true
        }
      },
      asignaturas: {
        select: {
          id_asignatura: true,
          nombre: true
        },
        orderBy: {
          id_asignatura: 'asc'
        }
      },
      orientador: {
        select: {
          id_orientador: true,
          nombre: true,
          apellido: true
        }
      }
    },
    orderBy: {
      id_curso: 'asc'
    }
  });

  return cursos;
}
```

### 📍 Ubicación sugerida:

Agregar al final de los métodos de consulta, antes de los métodos de estadísticas.

---

## 🧪 Testing

### 1. Verificar que el servidor esté corriendo:

```bash
cd /Users/rodolforivas/Documents/GitHub/CAI-backend
npm run start:dev
```

### 2. Probar el endpoint con curl:

```bash
# Reemplaza <TOKEN> con un token JWT válido de un orientador
curl -X GET \
  http://localhost:3000/cursos/asignados/1 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"
```

### 3. Respuesta esperada (ejemplo):

```json
[
  {
    "id_curso": 1,
    "nombre": "Quinto Grado",
    "seccion": "A",
    "descripcion": null,
    "id_grado_academico": 1,
    "id_orientador": 1,
    "cupo": 30,
    "aula": "Aula 101",
    "activo": true,
    "anio_academico": "2025",
    "gradoAcademico": {
      "id_grado_academico": 1,
      "nombre": "Primaria"
    },
    "asignaturas": [
      {
        "id_asignatura": 1,
        "nombre": "Matemática I"
      },
      {
        "id_asignatura": 2,
        "nombre": "Lenguaje y Literatura"
      },
      {
        "id_asignatura": 3,
        "nombre": "Ciencias Naturales"
      }
    ],
    "orientador": {
      "id_orientador": 1,
      "nombre": "Juan",
      "apellido": "Pérez"
    }
  },
  {
    "id_curso": 2,
    "nombre": "Sexto Grado",
    "seccion": "B",
    ...
  }
]
```

---

## ✅ Checklist de Implementación

- [ ] 1. Abrir `src/cursos/cursos.controller.ts`
- [ ] 2. Agregar el endpoint `findCursosAsignadosDocente` (código arriba)
- [ ] 3. Verificar imports necesarios:
  ```typescript
  import { ParseIntPipe } from '@nestjs/common';
  ```
- [ ] 4. Abrir `src/cursos/cursos.service.ts`
- [ ] 5. Agregar el método `findCursosAsignadosDocente` (código arriba)
- [ ] 6. Guardar ambos archivos
- [ ] 7. El servidor debería recargar automáticamente (hot reload)
- [ ] 8. Probar el endpoint con curl o Postman
- [ ] 9. Verificar que retorna los cursos del orientador
- [ ] 10. Probar desde el frontend (debería funcionar automáticamente)

---

## 🔍 Verificación en el Frontend

Una vez implementado el backend, el frontend debería mostrar en consola:

```
🔍 Buscando cursos para orientador ID: 1
✅ Endpoint /cursos/asignados: 2 cursos encontrados
📊 Resumen: 2 cursos totales
   ✅ Con asignaturas: 2
   ⚠️  Sin asignaturas: 0
✅ 2 curso(s) cargado(s) correctamente
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@nestjs/common'"

**Solución**: Reinstalar dependencias

```bash
cd CAI-backend
npm install
```

### Error: "Unauthorized" o 401

**Solución**: Verificar que el token JWT sea válido y el usuario tenga rol 'orientador'

### Error: "PrismaClient is not defined"

**Solución**: Verificar que el servicio tenga inyectado PrismaService:

```typescript
constructor(private prisma: PrismaService) {}
```

### No retorna cursos aunque existan en DB

**Solución**: Verificar que:

1. Los cursos tengan `activo = true`
2. El orientador esté correctamente asignado
3. Ejecutar las consultas SQL del archivo `consultas-debug-cursos.sql` para verificar

---

## 📚 Documentación Adicional

- **Query SQL equivalente**: Ver archivo `consultas-debug-cursos.sql` PASO 7
- **Diagnóstico completo**: Ver archivo `SOLUCION-CURSOS.md`
- **Frontend fallback**: Ver `src/components/AsistenciaModuleNew.tsx` líneas 189-309

---

**Última actualización**: 27 de octubre de 2025  
**Estado**: 📝 Listo para implementar
