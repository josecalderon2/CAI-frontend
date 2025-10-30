# 🎯 SOLUCIÓN: Problema de Carga de Cursos en AsistenciaModule

## 📊 Diagnóstico

### ✅ DATOS CONFIRMADOS EN BASE DE DATOS

Según las consultas SQL ejecutadas:

- **Orientador ID=1**: ✅ Existe y está activo
- **Cursos asignados**: ✅ 2 cursos únicos
  - Curso ID=1: "Quinto Grado" Sección A (orientador titular)
  - Curso ID=2: "Sexto Grado" Sección B (por AsignaturaOrientador)
- **Asignaturas**: ✅ Existen
  - Curso 1: Matemática I, Lenguaje y Literatura, Ciencias Naturales
  - Curso 2: Ciencias Sociales

### ❌ PROBLEMAS IDENTIFICADOS

1. **404 en `/cursos/asignados/1`**
   - El endpoint NO existe en el backend
   - El frontend intenta usarlo pero falla
2. **403 Forbidden en `/cursos?activo=true&limit=100`**
   - El endpoint existe pero tiene restricciones de permisos
   - Los orientadores no pueden listar TODOS los cursos

## 🔧 SOLUCIONES PROPUESTAS

### **Opción A (Recomendada): Crear el Endpoint en el Backend**

Crear el endpoint `GET /cursos/asignados/:orientadorId` en el backend.

**Archivo**: `CAI-backend/src/cursos/cursos.controller.ts`

```typescript
@Get('asignados/:orientadorId')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('orientador', 'admin', 'administrativo')
async findCursosAsignadosDocente(
  @Param('orientadorId', ParseIntPipe) orientadorId: number,
) {
  return this.cursosService.findCursosAsignadosDocente(orientadorId);
}
```

**Archivo**: `CAI-backend/src/cursos/cursos.service.ts`

```typescript
async findCursosAsignadosDocente(orientadorId: number) {
  // Buscar cursos donde el orientador tiene algún rol
  const cursos = await this.prisma.curso.findMany({
    where: {
      activo: true,
      OR: [
        // Es orientador titular
        { id_orientador: orientadorId },

        // Está en el historial
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

        // Tiene asignaturas asignadas
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
        }
      }
    }
  });

  return cursos;
}
```

### **Opción B (Temporal): Ajustar Permisos del Endpoint Existente**

Modificar el endpoint `GET /cursos` para permitir que los orientadores lo usen:

**Archivo**: `CAI-backend/src/cursos/cursos.controller.ts`

```typescript
@Get()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('orientador', 'admin', 'administrativo') // Agregar 'orientador'
async findAll(@Query() query: ListCursosParams) {
  return this.cursosService.list(query);
}
```

### **Opción C (Workaround Frontend - YA IMPLEMENTADO)**

El frontend ya tiene un fallback, pero no funciona por el 403.

Si implementas la **Opción B**, el fallback automático del frontend funcionará:

```typescript
// Ya está en AsistenciaModuleNew.tsx líneas 207-232
try {
  const allCursos = await cursosService.list({ activo: true, limit: 100 });
  cursosResponse = allCursos.items
    .filter((curso) => curso.id_orientador === parseInt(user.id))
    .map((curso) => ({...}))
} catch (fallbackErr) {
  console.error('Error en fallback de cursos:', fallbackErr);
}
```

## 📝 RECOMENDACIÓN FINAL

**Implementa la Opción A** por estas razones:

1. ✅ Más eficiente (solo devuelve cursos del orientador)
2. ✅ Mejor seguridad (no expone todos los cursos)
3. ✅ Reutilizable (otros módulos pueden usar el mismo endpoint)
4. ✅ Query SQL ya está lista (ver PASO 7 en `consultas-debug-cursos.sql`)

## 🚀 PASOS PARA IMPLEMENTAR

### Backend (Opción A):

1. Abre `CAI-backend/src/cursos/cursos.controller.ts`
2. Agrega el endpoint `findCursosAsignadosDocente`
3. Abre `CAI-backend/src/cursos/cursos.service.ts`
4. Agrega el método con la query de Prisma
5. Prueba el endpoint: `GET http://localhost:3000/cursos/asignados/1`

### Frontend (Ya está listo):

El frontend ya maneja automáticamente:

- ✅ Intenta usar `/cursos/asignados/:id`
- ✅ Si falla (404), usa fallback con `/cursos` (necesita Opción B)
- ✅ Muestra logs detallados para debug
- ✅ Filtra cursos sin asignaturas

## 🧪 TESTING

Una vez implementado el endpoint, verifica:

```bash
# 1. Prueba el endpoint directamente
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3000/cursos/asignados/1

# Respuesta esperada:
[
  {
    "id_curso": 1,
    "nombre": "Quinto Grado",
    "seccion": "A",
    "asignaturas": [
      {"id_asignatura": 1, "nombre": "Matemática I"},
      {"id_asignatura": 2, "nombre": "Lenguaje y Literatura"},
      {"id_asignatura": 3, "nombre": "Ciencias Naturales"}
    ]
  },
  {
    "id_curso": 2,
    "nombre": "Sexto Grado",
    "seccion": "B",
    "asignaturas": [
      {"id_asignatura": 6, "nombre": "Ciencias Sociales"}
    ]
  }
]

# 2. Recarga el frontend
# Deberías ver en consola:
# ✅ "2 curso(s) cargado(s) correctamente"
```

## 📚 ARCHIVOS DE REFERENCIA

- SQL Query: `consultas-debug-cursos.sql` (PASO 7 y 7B)
- Frontend: `src/components/AsistenciaModuleNew.tsx` (líneas 189-309)
- Backend Controller: `src/cursos/cursos.controller.ts`
- Backend Service: `src/cursos/cursos.service.ts`

---

**Última actualización**: 27 de octubre de 2025
**Estado**: ✅ Datos confirmados en DB | ❌ Endpoint faltante | 🔧 Solución lista para implementar
