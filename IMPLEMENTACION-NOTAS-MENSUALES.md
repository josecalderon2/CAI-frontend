# Implementación del Módulo de Notas Mensuales

## Descripción General
Se ha implementado el módulo de ingreso de notas mensuales para el sistema educativo, permitiendo a los orientadores registrar y editar las evaluaciones de sus alumnos.

## Características Implementadas

### 1. Servicio de Notas (`notasService.ts`)
**Ubicación:** `src/api/services/notasService.ts`

**Funcionalidades:**
- ✅ Crear nueva nota mensual
- ✅ Actualizar nota mensual existente
- ✅ Obtener notas mensuales con filtros (alumno, asignatura, mes, año)
- ✅ Obtener nota mensual específica por ID
- ✅ Eliminar nota mensual

**Interfaces:**
```typescript
- NotaMensual: Estructura base de la nota
- NotaMensualResponse: Nota con relaciones (alumno, asignatura)
- CreateNotaMensualDto: DTO para crear notas
- UpdateNotaMensualDto: DTO para actualizar notas
```

### 2. Componente de Notas (`NotasModule.tsx`)
**Ubicación:** `src/components/NotasModule.tsx`

**Funcionalidades Principales:**

#### Selección de Curso
- ✅ Muestra solo los cursos asignados al orientador autenticado
- ✅ Utiliza el servicio `getMisCursos()` que respeta el JWT
- ✅ Carga automática al montar el componente

#### Selección de Asignatura
- ✅ Carga asignaturas según el curso seleccionado
- ✅ Filtrado automático por curso
- ✅ Manejo de cursos sin asignaturas

#### Selección de Alumno
- ✅ Lista de alumnos matriculados en el curso seleccionado
- ✅ Ordenados por apellido
- ✅ Manejo de cursos sin alumnos

#### Mes y Año Automáticos
- ✅ Detecta automáticamente el mes actual (1-12)
- ✅ Detecta automáticamente el año actual
- ✅ Muestra el nombre del mes en el título

#### Formulario de Evaluaciones (Formato Básica)
**Campos fijos sin incrementadores:**
1. ✅ Tarea 1
2. ✅ Revisión de Libros y Cuadernos
3. ✅ Tarea 2
4. ✅ Laboratorio Escrito
5. ✅ Examen Mensual

**Validaciones:**
- ✅ Rango de notas: 0 a 10
- ✅ Formato decimal permitido
- ✅ Campos opcionales (puede dejar vacíos)
- ✅ Al menos una nota debe ser ingresada

#### Gestión de Notas
- ✅ **Crear:** Guarda nuevas notas si no existen
- ✅ **Cargar:** Muestra notas existentes automáticamente al seleccionar alumno/asignatura
- ✅ **Editar:** Botón de edición para modificar notas guardadas
- ✅ **Actualizar:** Actualiza notas existentes
- ✅ **Cancelar:** Restaura valores originales al cancelar edición

#### Modos de Operación
1. **Modo Lectura:** 
   - Campos deshabilitados
   - Muestra notas guardadas
   - Botón "Editar" visible

2. **Modo Edición:**
   - Campos habilitados
   - Botón "Guardar" visible
   - Botón "Cancelar" visible

3. **Modo Creación:**
   - Campos vacíos y habilitados
   - Solo botón "Guardar" visible

#### Cálculo de Promedio
- ✅ Calculado automáticamente por el backend
- ✅ Mostrado después de guardar
- ✅ Formato: 2 decimales

### 3. Integración en la Aplicación

#### Rutas (`App.tsx`)
```tsx
<Route
  path="/notas"
  element={
    <ProtectedRoute>
      <NotasModule />
    </ProtectedRoute>
  }
/>
```

#### Menú de Navegación (`Header.tsx`)
- ✅ Opción "Notas" agregada al menú del orientador
- ✅ Icono: Edit (lápiz)
- ✅ Accesible desde el dashboard del orientador

### 4. Interfaz de Usuario

#### Componentes Utilizados
- **Card:** Contenedores principales
- **Select:** Selectores de curso, asignatura y alumno
- **Input:** Campos numéricos para las notas
- **Button:** Botones de acción
- **Alert:** Mensajes de éxito y error

#### Iconos (lucide-react)
- 📚 BookOpen: Título principal
- 👥 Users: Selección de curso y alumno
- 📄 FileText: Selección de asignatura
- 📅 Calendar: Encabezado de evaluaciones
- 💾 Save: Guardar
- ✏️ Edit2: Editar
- ⚠️ AlertCircle: Errores
- ✅ CheckCircle: Éxitos

#### Estados Visuales
- ✅ Loading: Indicador durante operaciones
- ✅ Error: Mensajes de error claros
- ✅ Success: Confirmación de guardado
- ✅ Disabled: Campos deshabilitados en modo lectura

### 5. Flujo de Trabajo

1. **Inicio:**
   - Orientador accede al módulo de notas
   - Sistema carga cursos asignados automáticamente

2. **Selección:**
   - Selecciona curso → carga alumnos y asignaturas
   - Selecciona asignatura
   - Selecciona alumno → carga notas existentes (si hay)

3. **Ingreso/Edición:**
   - Si no hay notas: campos vacíos, modo creación
   - Si hay notas: campos con valores, modo lectura
   - Click en "Editar": habilita campos
   - Ingresa/modifica notas

4. **Guardado:**
   - Click en "Guardar"
   - Validación de datos
   - Envío al backend
   - Confirmación y recarga de datos

5. **Verificación:**
   - Notas aparecen cargadas
   - Promedio calculado visible
   - Modo lectura activado

## Seguridad

### Autenticación
- ✅ Rutas protegidas con `ProtectedRoute`
- ✅ Token JWT requerido
- ✅ Verificación de rol de usuario

### Autorización
- ✅ Solo orientadores pueden acceder
- ✅ Solo pueden ver sus cursos asignados
- ✅ No hay acceso a cursos de otros orientadores

## Endpoints del Backend Utilizados

```
GET    /cursos/mis-cursos                    - Obtener cursos del orientador
GET    /cursos/:id/alumnos                   - Obtener alumnos por curso
GET    /asignaturas/curso/:idCurso           - Obtener asignaturas por curso
POST   /notas-mensuales                      - Crear nota mensual
PATCH  /notas-mensuales/:id                  - Actualizar nota mensual
GET    /notas-mensuales?params               - Obtener notas con filtros
```

## Tecnologías Utilizadas

- **React 18** con TypeScript
- **React Router** para navegación
- **Axios** para peticiones HTTP
- **Tailwind CSS** para estilos
- **Lucide React** para iconos
- **Componentes UI personalizados** (shadcn/ui)

## Mejoras Futuras Sugeridas

1. **Funcionalidades:**
   - [ ] Filtro por mes/año para ver notas históricas
   - [ ] Vista de todos los alumnos del curso en una tabla
   - [ ] Exportación a Excel/PDF
   - [ ] Copia masiva de evaluaciones
   - [ ] Estadísticas por asignatura/curso

2. **UX/UI:**
   - [ ] Shortcuts de teclado
   - [ ] Navegación rápida entre alumnos (anterior/siguiente)
   - [ ] Modo oscuro
   - [ ] Confirmación antes de salir con cambios sin guardar

3. **Validaciones:**
   - [ ] Validación de períodos académicos
   - [ ] Alertas de notas fuera de rango esperado
   - [ ] Confirmación de notas muy bajas

## Notas de Implementación

- El formato actual es para **Educación Básica**
- Las evaluaciones son un formato fijo (sin incrementadores)
- El promedio se calcula automáticamente en el backend
- Los campos de nota son opcionales pero al menos uno debe tener valor
- El mes y año se toman automáticamente de la fecha actual

## Pruebas Recomendadas

1. ✅ Crear notas para un alumno nuevo
2. ✅ Editar notas existentes
3. ✅ Validar restricciones de rango (0-10)
4. ✅ Verificar carga automática de notas
5. ✅ Probar cancelación de edición
6. ✅ Verificar cálculo de promedio
7. ✅ Probar con diferentes roles de usuario
8. ✅ Verificar mensajes de error y éxito

## Estado de la Implementación

✅ **COMPLETO** - Listo para pruebas en desarrollo

El módulo está completamente funcional y cumple con todos los requisitos especificados:
- Selección de curso asignado al orientador
- Detección automática de mes/año
- Listado de alumnos por curso
- Evaluaciones según grado académico (formato básica)
- Espacios para agregar notas (sin incrementadores)
- Carga de notas guardadas para verificación
- Funcionalidad de edición
- Botón de guardar funcional
