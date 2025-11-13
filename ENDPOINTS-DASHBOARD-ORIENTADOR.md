# 📋 Endpoints Requeridos para Dashboard de Orientador

## ✅ Endpoints que YA EXISTEN y están siendo usados

1. **GET /cursos/mis-cursos**
   - ✅ Obtiene los cursos del orientador autenticado
   - Usa el token JWT para identificar al usuario
   - Retorna: `Curso[]`

2. **GET /asignaturas/mis-asignaturas**
   - ✅ Obtiene las asignaturas asignadas al orientador
   - Usa el token JWT
   - Retorna: `Asignatura[]`

3. **GET /evaluaciones/mis-asignaturas/evaluaciones**
   - ✅ Obtiene evaluaciones de las asignaturas del orientador
   - Retorna: `Evaluacion[]`

4. **GET /evaluaciones/:id/alumnos-con-calificaciones**
   - ✅ Obtiene alumnos con sus calificaciones de una evaluación
   - Usado para calcular progreso de calificaciones
   - Retorna: `AlumnosConCalificacionesResponse`

5. **GET /asignaturas/curso/:cursoId**
   - ✅ Obtiene asignaturas de un curso específico
   - Retorna: `Asignatura[]`

6. **GET /cursos/:id/alumnos**
   - ✅ Obtiene lista de alumnos de un curso
   - Usado para contar alumnos
   - Retorna: `Array<{id_alumno, nombre, apellido, rut}>`

---

## 🆕 Endpoints OPCIONALES para Mejorar el Dashboard

Estos endpoints harían el dashboard más eficiente y completo. Si no existen, el frontend usa cálculos y estimaciones.

### 1. **GET /orientador/dashboard/estadisticas**

**Descripción**: Obtiene estadísticas agregadas del orientador en una sola llamada

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Response**:
```typescript
{
  cursosAsignados: number;        // Total de cursos
  evaluacionesCreadas: number;    // Total de evaluaciones
  notasPendientes: number;        // Evaluaciones sin completar calificaciones
  alumnosTotal: number;           // Suma de alumnos en todos los cursos
  promedioGeneral: number;        // Promedio general de todos los alumnos
  evaluacionesEstesMes: number;   // Evaluaciones creadas este mes
  asignaturasAsignadas: number;   // Total de asignaturas
}
```

**Implementación Backend (NestJS)**:
```typescript
// orientador.controller.ts
@Get('dashboard/estadisticas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('orientador')
async getEstadisticasDashboard(@Request() req) {
  const orientadorId = req.user.userId;
  return this.orientadorService.getEstadisticasDashboard(orientadorId);
}

// orientador.service.ts
async getEstadisticasDashboard(orientadorId: number) {
  // Obtener cursos asignados
  const cursos = await this.cursosService.findCursosAsignadosDocente(orientadorId);
  
  // Contar alumnos
  const alumnosTotal = await this.prisma.curso.aggregate({
    where: {
      OR: [
        { id_orientador: orientadorId },
        { asignaturas: { some: { orientadores: { some: { id_orientador: orientadorId } } } } }
      ]
    },
    _count: {
      alumnos: true
    }
  });
  
  // Contar evaluaciones
  const evaluacionesCount = await this.prisma.evaluacion.count({
    where: { id_orientador: orientadorId }
  });
  
  // Evaluaciones del mes
  const mesActual = new Date().getMonth() + 1;
  const evaluacionesMes = await this.prisma.evaluacion.count({
    where: {
      id_orientador: orientadorId,
      mes: mesActual
    }
  });
  
  // Notas pendientes
  const evaluaciones = await this.prisma.evaluacion.findMany({
    where: { id_orientador: orientadorId },
    include: {
      asignatura: {
        include: {
          curso: {
            include: {
              alumnos: true
            }
          }
        }
      },
      notas: true
    }
  });
  
  const notasPendientes = evaluaciones.reduce((sum, ev) => {
    const totalAlumnos = ev.asignatura?.curso?.alumnos?.length || 0;
    const notasIngresadas = ev.notas.length;
    return sum + (totalAlumnos - notasIngresadas);
  }, 0);
  
  // Promedio general (opcional, puede ser costoso)
  const promedioGeneral = await this.calcularPromedioGeneral(orientadorId);
  
  return {
    cursosAsignados: cursos.length,
    evaluacionesCreadas: evaluacionesCount,
    notasPendientes,
    alumnosTotal: alumnosTotal._count.alumnos,
    promedioGeneral: promedioGeneral || 0,
    evaluacionesEstesMes: evaluacionesMes,
    asignaturasAsignadas: await this.prisma.asignaturaOrientador.count({
      where: { id_orientador: orientadorId }
    })
  };
}
```

---

### 2. **GET /orientador/dashboard/resumen-actividades**

**Descripción**: Obtiene un resumen de actividades recientes del orientador

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Response**:
```typescript
{
  asistenciasRegistradas: number;    // Asistencias registradas hoy/esta semana
  evaluacionesPendientes: number;    // Evaluaciones sin calificaciones completas
  notasPorIngresar: number;          // Total de notas pendientes
  ultimaActualizacion: string;       // ISO date de la última actividad
}
```

**Implementación Backend (NestJS)**:
```typescript
@Get('dashboard/resumen-actividades')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('orientador')
async getResumenActividades(@Request() req) {
  const orientadorId = req.user.userId;
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  // Asistencias registradas hoy
  const asistenciasHoy = await this.prisma.asistencia.count({
    where: {
      id_orientador: orientadorId,
      fecha: {
        gte: hoy
      }
    }
  });
  
  // Evaluaciones pendientes (sin completar)
  const evaluaciones = await this.prisma.evaluacion.findMany({
    where: { id_orientador: orientadorId },
    include: {
      asignatura: {
        include: {
          curso: {
            include: {
              _count: {
                select: { alumnos: true }
              }
            }
          }
        }
      },
      _count: {
        select: { notas: true }
      }
    }
  });
  
  const evaluacionesPendientes = evaluaciones.filter(ev => {
    const totalAlumnos = ev.asignatura?.curso?._count?.alumnos || 0;
    return ev._count.notas < totalAlumnos;
  }).length;
  
  const notasPorIngresar = evaluaciones.reduce((sum, ev) => {
    const totalAlumnos = ev.asignatura?.curso?._count?.alumnos || 0;
    return sum + (totalAlumnos - ev._count.notas);
  }, 0);
  
  // Última actividad
  const ultimaAsistencia = await this.prisma.asistencia.findFirst({
    where: { id_orientador: orientadorId },
    orderBy: { creadoEn: 'desc' }
  });
  
  const ultimaNota = await this.prisma.nota.findFirst({
    where: {
      evaluacion: {
        id_orientador: orientadorId
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  const ultimaActualizacion = [ultimaAsistencia?.creadoEn, ultimaNota?.createdAt]
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || new Date();
  
  return {
    asistenciasRegistradas: asistenciasHoy,
    evaluacionesPendientes,
    notasPorIngresar,
    ultimaActualizacion: ultimaActualizacion.toISOString()
  };
}
```

---

### 3. **GET /orientador/promedio-general**

**Descripción**: Calcula el promedio general de todos los alumnos del orientador

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Response**:
```typescript
{
  promedio: number;
  totalAlumnos: number;
  alumnosConNotas: number;
}
```

**Implementación Backend (NestJS)**:
```typescript
@Get('promedio-general')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('orientador')
async getPromedioGeneral(@Request() req) {
  const orientadorId = req.user.userId;
  
  // Obtener todas las notas de los alumnos en las asignaturas del orientador
  const notas = await this.prisma.nota.findMany({
    where: {
      evaluacion: {
        id_orientador: orientadorId
      }
    },
    select: {
      calificacion: true,
      alumno: {
        select: {
          id_alumno: true
        }
      }
    }
  });
  
  if (notas.length === 0) {
    return {
      promedio: 0,
      totalAlumnos: 0,
      alumnosConNotas: 0
    };
  }
  
  // Calcular promedio por alumno
  const promediosPorAlumno = new Map<number, number[]>();
  
  notas.forEach(nota => {
    const alumnoId = nota.alumno.id_alumno;
    if (!promediosPorAlumno.has(alumnoId)) {
      promediosPorAlumno.set(alumnoId, []);
    }
    promediosPorAlumno.get(alumnoId)!.push(nota.calificacion);
  });
  
  // Promedio general
  const promedios = Array.from(promediosPorAlumno.values()).map(notasAlumno => {
    return notasAlumno.reduce((sum, n) => sum + n, 0) / notasAlumno.length;
  });
  
  const promedioGeneral = promedios.reduce((sum, p) => sum + p, 0) / promedios.length;
  
  return {
    promedio: parseFloat(promedioGeneral.toFixed(2)),
    totalAlumnos: promediosPorAlumno.size,
    alumnosConNotas: promediosPorAlumno.size
  };
}
```

---

## 🔧 Endpoints CRÍTICOS que DEBEN Existir

Estos son necesarios para el funcionamiento básico:

### ✅ **GET /cursos/asignados/:orientadorId**

**Descripción**: Ya documentado en `SOLUCION-CURSOS.md`. Es el endpoint más importante.

**Status**: ⚠️ Debe ser implementado en el backend (ver SOLUCION-CURSOS.md)

---

## 📊 Resumen de Prioridades

### 🔴 ALTA PRIORIDAD (Crítico)
- `GET /cursos/asignados/:orientadorId` - Ya funciona con `/cursos/mis-cursos` como fallback

### 🟡 MEDIA PRIORIDAD (Mejora significativa)
- `GET /orientador/dashboard/estadisticas` - Evita múltiples llamadas
- `GET /orientador/dashboard/resumen-actividades` - Información útil para el orientador

### 🟢 BAJA PRIORIDAD (Opcional)
- `GET /orientador/promedio-general` - Puede ser costoso computacionalmente

---

## 🎯 Estado Actual del Frontend

El frontend **ya está completamente funcional** con los endpoints existentes:

✅ Carga cursos asignados  
✅ Muestra estadísticas calculadas  
✅ Lista evaluaciones recientes con progreso  
✅ Muestra asignaturas y alumnos por curso  
✅ Maneja errores y estados de carga  

Los endpoints opcionales solo mejorarían el **rendimiento** y agregarían **más información**, pero **no son estrictamente necesarios** para que el dashboard funcione.

---

## 🚀 Cómo Probar

1. Inicia sesión con un usuario orientador
2. El dashboard debería cargar automáticamente:
   - Estadísticas de cursos, alumnos, evaluaciones
   - Lista de cursos asignados con asignaturas
   - Evaluaciones recientes con progreso
   - Acciones rápidas funcionales

3. Si ves errores en consola, verifica que los endpoints listados en "✅ YA EXISTEN" estén disponibles

---

**Última actualización**: 13 de noviembre de 2025  
**Estado**: ✅ Frontend integrado y funcional | 🟡 Endpoints opcionales pendientes
