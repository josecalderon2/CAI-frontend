# Implementación: Botón "Cerrar Calificaciones" en CalificacionesModule

## 📋 Resumen de Cambios

Se ha implementado la funcionalidad completa de "Cerrar Calificaciones" en el módulo de calificaciones del frontend, que permite a los orientadores cerrar las calificaciones de un curso de manera segura con validaciones previas.

## 🆕 Archivos Creados

### 1. `src/api/services/promediosService.ts`

Nuevo servicio que se comunica con los endpoints del backend de promedios:

**Funcionalidades:**

- ✅ `verificarEstadoParaCierre()`: Verifica el estado antes de cerrar calificaciones
- ✅ `cerrarCalificaciones()`: Cierra calificaciones de un alumno individual
- ✅ `cerrarCalificacionesCurso()`: Cierra calificaciones de todos los alumnos de un curso

**Interfaces TypeScript:**

- `VerificacionCierreResponseDto`: Respuesta de verificación con advertencias y estadísticas
- `CerrarCursoResponseDto`: Resultado del cierre con resumen de alumnos procesados
- `AlumnoSinCalificarDto`: Información de alumnos con evaluaciones pendientes
- `EvaluacionFaltanteDto`: Evaluaciones que faltan por crear
- `AdvertenciaCierreDto`: Advertencias detectadas
- `EstadisticasCierreDto`: Estadísticas del estado de calificaciones

## 📝 Archivos Modificados

### 1. `src/components/CalificacionesModule.tsx`

#### Nuevas Importaciones:

```typescript
import {
  promediosService,
  type VerificacionCierreResponseDto,
} from '../api/services/promediosService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Lock, AlertTriangle } from 'lucide-react';
```

#### Nuevos Estados:

```typescript
const [showCloseDialog, setShowCloseDialog] = useState(false);
const [verificacionCierre, setVerificacionCierre] =
  useState<VerificacionCierreResponseDto | null>(null);
const [loadingVerificacion, setLoadingVerificacion] = useState(false);
const [closingGrades, setClosingGrades] = useState(false);
const [cursoInfo, setCursoInfo] = useState<{
  id_curso: number;
  trimestre?: number;
  periodo?: number;
} | null>(null);
```

#### Nuevas Funciones:

**1. `handleVerificarCierre()`**

- Obtiene el año académico actual
- Llama al endpoint `GET /promedios/verificar-cierre`
- Muestra el diálogo con advertencias y estadísticas

**2. `handleCerrarCalificaciones(forzar: boolean)`**

- Cierra las calificaciones del curso
- Llama al endpoint `POST /promedios/cerrar-curso`
- Muestra resultado con cantidad de alumnos cerrados
- Parámetro `forzar` permite cerrar aunque haya advertencias

**3. Modificación en `fetchData()`**

- Ahora extrae información del curso (id_curso, trimestre, periodo)
- Guarda esta información en el estado `cursoInfo` para usarla en el cierre

#### Nuevos Componentes UI:

**1. Botón "Cerrar Calificaciones" en el Header**

```tsx
{
  evaluacionSeleccionada && cursoInfo && (
    <Button onClick={handleVerificarCierre} disabled={loadingVerificacion}>
      <Lock className="w-4 h-4 mr-2" />
      Cerrar Calificaciones
    </Button>
  );
}
```

**2. Dialog de Verificación y Cierre**
Componente completo que muestra:

- **Título**: "Cerrar Calificaciones del Curso"
- **Estadísticas**:
  - Total de alumnos
  - Alumnos con todas las notas
  - Alumnos sin algunas notas
  - Calificaciones registradas vs esperadas

- **Advertencias** (si existen):
  - 🟠 **Alumnos sin calificar**: Lista de alumnos con evaluaciones pendientes
  - 🟡 **Evaluaciones faltantes**: Tipos de evaluación que faltan por crear

- **Botones de acción**:
  - "Cancelar": Cierra el diálogo
  - "Forzar Cierre": Aparece solo si hay advertencias (botón rojo)
  - "Cerrar Calificaciones": Botón principal (azul)

## 🔄 Flujo de Funcionamiento

### Paso 1: Seleccionar Evaluación

El orientador selecciona una asignatura y evaluación en el módulo de calificaciones.

### Paso 2: Ver Botón de Cierre

Cuando hay una evaluación seleccionada, aparece el botón "Cerrar Calificaciones" en el header.

### Paso 3: Verificar Estado

Al hacer clic en "Cerrar Calificaciones":

1. Se llama a `GET /promedios/verificar-cierre?cursoId=X&anioAcademico=2025&trimestre=1`
2. El backend retorna:
   - `puedesCerrar`: true/false
   - `advertencias`: Array de advertencias
   - `estadisticas`: Resumen del estado
   - `mensaje`: Mensaje descriptivo

### Paso 4: Mostrar Diálogo

Se abre un diálogo modal mostrando:

**Si no hay advertencias:**

```
┌────────────────────────────────────────┐
│ 📊 Estadísticas del Curso              │
│ Total: 30 | Con notas: 30 | Sin: 0    │
│                                        │
│ ✅ ¡Todo en orden!                     │
│                                        │
│ [Cancelar]  [Cerrar Calificaciones]   │
└────────────────────────────────────────┘
```

**Si hay advertencias:**

```
┌────────────────────────────────────────┐
│ 📊 Estadísticas del Curso              │
│ Total: 30 | Con notas: 27 | Sin: 3    │
│                                        │
│ ⚠️ 3 alumnos sin calificaciones       │
│   • Juan Pérez                         │
│     - Tarea 1 - Matemáticas           │
│     - Examen Parcial                   │
│   • María López                        │
│     - Laboratorio 2                    │
│                                        │
│ ⚠️ Evaluaciones faltantes              │
│   • Examen Trimestral: 6 de 8         │
│                                        │
│ [Cancelar] [Forzar Cierre] [Cerrar]   │
└────────────────────────────────────────┘
```

### Paso 5: Decidir Acción

El orientador puede:

- **Cancelar**: Cerrar el diálogo y completar las calificaciones faltantes
- **Forzar Cierre**: Cerrar aunque haya advertencias (botón rojo, solo si hay advertencias)
- **Cerrar Calificaciones**: Cerrar normalmente

### Paso 6: Cerrar Calificaciones

Al confirmar:

1. Se llama a `POST /promedios/cerrar-curso?cursoId=X&anioAcademico=2025&trimestre=1&forzar=true/false`
2. El backend:
   - Recalcula todos los promedios
   - Marca las calificaciones como cerradas
   - Retorna resumen de alumnos procesados

### Paso 7: Mostrar Resultado

Se muestra un toast con el resultado:

- ✅ **Éxito total**: "Calificaciones cerradas exitosamente para 30 alumnos"
- ⚠️ **Parcial**: "Se cerraron 27 de 30 alumnos. 3 con errores."

## 🎨 Características de UX

### 1. Transparencia Total

El orientador ve exactamente qué falta antes de cerrar:

- Qué alumnos no tienen calificaciones
- Qué evaluaciones específicas faltan por calificar
- Qué tipos de evaluación no se han creado

### 2. Prevención de Errores

- No se puede cerrar por accidente
- Se requiere confirmación explícita
- Se muestran advertencias claras

### 3. Flexibilidad

- Permite forzar cierre cuando es justificado
- Útil para casos especiales (alumno retirado, evaluación no aplicable, etc.)

### 4. Feedback Claro

- Estadísticas visuales con colores
- Iconos descriptivos
- Mensajes de éxito/error detallados

### 5. Responsive

- Dialog adaptable a móviles
- Scroll interno si hay muchas advertencias
- Layout responsive para estadísticas

## 📊 Tipos de Advertencias

### 1. ALUMNOS_SIN_CALIFICAR

```typescript
{
  tipo: 'ALUMNOS_SIN_CALIFICAR',
  mensaje: '3 alumno(s) no tienen todas las calificaciones',
  alumnosSinCalificar: [
    {
      id_alumno: 123,
      nombreCompleto: 'Juan Pérez',
      evaluacionesPendientes: [
        'Tarea 1 - Matemáticas',
        'Examen Parcial - Lenguaje'
      ]
    }
  ]
}
```

### 2. EVALUACIONES_FALTANTES

```typescript
{
  tipo: 'EVALUACIONES_FALTANTES',
  mensaje: 'Hay tipos de evaluación sin crear para el trimestre 1',
  evaluacionesFaltantes: [
    {
      tipoEvaluacion: 'Examen Trimestral',
      esperadas: 8,
      creadas: 6
    }
  ]
}
```

### 3. SIN_PROMEDIOS_CALCULADOS

```typescript
{
  tipo: 'SIN_PROMEDIOS_CALCULADOS',
  mensaje: 'Algunos alumnos no tienen promedios calculados'
}
```

## 🔧 Endpoints Utilizados

### 1. Verificar Estado

```
GET /promedios/verificar-cierre?cursoId=5&anioAcademico=2025&trimestre=1
```

### 2. Cerrar Curso

```
POST /promedios/cerrar-curso?cursoId=5&anioAcademico=2025&trimestre=1&forzar=false
```

## ✅ Validaciones Implementadas

### Frontend:

1. ✅ Verifica que exista información del curso antes de permitir cierre
2. ✅ Deshabilita botones durante el proceso
3. ✅ Valida respuestas del backend
4. ✅ Maneja errores de red

### Backend (ya implementado):

1. ✅ Verifica evaluaciones faltantes
2. ✅ Identifica alumnos sin calificar
3. ✅ Calcula estadísticas precisas
4. ✅ Permite forzar cierre con flag explícito
5. ✅ Registra quién y cuándo cerró

## 🎯 Beneficios

1. **Seguridad**: No se cierran calificaciones por error
2. **Transparencia**: El orientador sabe exactamente qué falta
3. **Trazabilidad**: Se registra el cierre en la base de datos
4. **Flexibilidad**: Permite casos especiales con "forzar cierre"
5. **UX Profesional**: Interfaz clara y fácil de usar
6. **Prevención**: Detecta problemas antes de cerrar

## 🚀 Próximos Pasos Recomendados

1. **Testing**: Probar el flujo completo con diferentes escenarios
2. **Permisos**: Verificar que solo orientadores autorizados puedan cerrar
3. **Logs**: Revisar que se registre correctamente el cierre
4. **Notificaciones**: Considerar enviar email cuando se cierran calificaciones
5. **Reapertura**: Implementar función para reabrir si es necesario

## 📌 Notas Importantes

- El año académico se obtiene automáticamente del año actual
- El cierre afecta a TODOS los alumnos activos del curso
- El botón solo aparece cuando hay una evaluación seleccionada
- Las advertencias son informativas, no bloqueantes (se puede forzar)
- El diálogo tiene scroll interno para muchas advertencias
