# 🎨 Guía Visual del Nuevo Módulo de Evaluaciones

## 📸 Vista Previa del Nuevo Diseño

### 1. **Estadísticas en el Header**

```
┌─────────────────┬──────────────────┬─────────────────┬──────────────┐
│  📋 Total       │  ✅ Completos    │  ⚠️ Incompletos │  📚 Asign.  │
│     24          │      3           │       5          │      8       │
└─────────────────┴──────────────────┴─────────────────┴──────────────┘
```

### 2. **Filtros Inteligentes**

```
[Todas las asignaturas ▼] [Todos los trimestres ▼] [Todos los años ▼]
```

### 3. **Grupo Completo (100%)** ✅

```
┌──────────────────────────────────────────────────────────────────┐
│ 📚 Matemáticas - Trimestre 1                    ✅ 100.0%         │
│                                                  Completo          │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │
├──────────────────────────────────────────────────────────────────┤
│ Nombre                │ Tipo                  │ %    │ Acciones  │
├──────────────────────────────────────────────────────────────────┤
│ Examen Trimestral     │ 🎯 Examen (30%)       │ ▓▓▓  │    🗑️     │
│ Examen Parcial        │ 📝 Parcial (25%)      │ ▓▓▓  │    🗑️     │
│ Actividad Final       │ 🎨 Actividad (25%)    │ ▓▓▓  │    🗑️     │
│ Laboratorio Química   │ 🧪 Laboratorio (10%)  │ ▓    │    🗑️     │
│ Tarea Semanal         │ 📖 Tarea (5%)         │ ▓    │    🗑️     │
│ Evaluación Grupal     │ 👥 Coevaluación (5%)  │ ▓    │    🗑️     │
└──────────────────────────────────────────────────────────────────┘
```

### 4. **Grupo Incompleto (< 100%)** ⚠️

```
┌──────────────────────────────────────────────────────────────────┐
│ 📚 Lenguaje - Trimestre 2         ⚠️ 65.0%       [+ Agregar]     │
│                                    Falta 35.0%                    │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░                  │
├──────────────────────────────────────────────────────────────────┤
│ Nombre                │ Tipo                  │ %    │ Acciones  │
├──────────────────────────────────────────────────────────────────┤
│ Examen Bimestral      │ 🎯 Examen (30%)       │ ▓▓▓  │    🗑️     │
│ Exposición Oral       │ 🎨 Actividad (25%)    │ ▓▓▓  │    🗑️     │
│ Lectura Comprensiva   │ 📖 Tarea (5%)         │ ▓    │    🗑️     │
│ Autoevaluación        │ 👤 Coevaluación (5%)  │ ▓    │    🗑️     │
└──────────────────────────────────────────────────────────────────┘
│ ⚠️ Tipos faltantes para completar el 100%:                       │
│ [📝 Examen Parcial (25%)] [🧪 Laboratorio (10%)]                 │
└──────────────────────────────────────────────────────────────────┘
```

### 5. **Agregando Nueva Evaluación (Inline)** ➕

```
┌──────────────────────────────────────────────────────────────────┐
│ 📚 Ciencias - Trimestre 3         ⚠️ 60.0%       [+ Agregar]     │
│                                    Falta 40.0%                    │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░              │
├──────────────────────────────────────────────────────────────────┤
│ Nombre                │ Tipo                  │ %    │ Acciones  │
├──────────────────────────────────────────────────────────────────┤
│ Examen Final          │ 🎯 Examen (30%)       │ ▓▓▓  │    🗑️     │
│ Proyecto Sistema      │ 🎨 Actividad (25%)    │ ▓▓▓  │    🗑️     │
│ Quiz Semanal          │ 📖 Tarea (5%)         │ ▓    │    🗑️     │
│ ┌───────────────────┬────────────────────────┬──────┬─────────┐ │
│ │ [Práctica Lab 1]  │ [Laboratorio (10%) ▼]  │ 0-10 │ ✅  ❌  │ │ <- Fila inline
│ └───────────────────┴────────────────────────┴──────┴─────────┘ │
└──────────────────────────────────────────────────────────────────┘
│ ⚠️ Tipos faltantes: [📝 Examen Parcial (25%)] [👥 Coevaluación]  │
└──────────────────────────────────────────────────────────────────┘
```

## 🎬 Flujo de Interacción

### Escenario A: Orientador completa evaluaciones de Matemáticas

```
PASO 1: Entra al módulo
┌────────────────────────────────────────────┐
│ 🔍 Filtros: [Matemáticas ▼] [Trimestre 1] │
└────────────────────────────────────────────┘

PASO 2: Ve el grupo incompleto
┌────────────────────────────────────────────┐
│ 📚 Matemáticas - T1    ⚠️ 70%   [Agregar] │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░           │
│ Falta: 30%                                 │
└────────────────────────────────────────────┘

PASO 3: Click en [Agregar]
┌────────────────────────────────────────────┐
│ Aparece fila inline ↓                      │
│ [Nombre] [Tipo ▼] [0-10] [✅] [❌]         │
└────────────────────────────────────────────┘

PASO 4: Llena datos
┌────────────────────────────────────────────┐
│ [Actividad Clase] [Actividad 25% ▼] [0-10]│
│                                   [✅] [❌] │
└────────────────────────────────────────────┘

PASO 5: Click ✅ - Sistema valida
┌────────────────────────────────────────────┐
│ ✅ Nombre: OK                              │
│ ✅ Tipo seleccionado: OK                   │
│ ✅ No duplicado: OK                        │
│ ✅ 70% + 25% = 95% < 100%: OK             │
│ → Guardando...                             │
└────────────────────────────────────────────┘

PASO 6: Actualización automática
┌────────────────────────────────────────────┐
│ 📚 Matemáticas - T1    ⚠️ 95%   [Agregar] │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░   │
│ Falta: 5%                                  │
│                                            │
│ ⚠️ Tipos faltantes: [Coevaluación (5%)]   │
└────────────────────────────────────────────┘

PASO 7: Agrega último tipo
┌────────────────────────────────────────────┐
│ [Auto-evaluación] [Coevaluación 5% ▼] ... │
│ Click ✅                                   │
└────────────────────────────────────────────┘

PASO 8: Grupo completado! 🎉
┌────────────────────────────────────────────┐
│ 📚 Matemáticas - T1    ✅ 100.0%           │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ Completo ✓                                 │
│                                            │
│ [No hay tipos faltantes]                   │
└────────────────────────────────────────────┘
```

### Escenario B: Sistema previene error

```
PASO 1: Orientador intenta agregar duplicado
┌────────────────────────────────────────────┐
│ Ya tiene: "Examen Final" (Examen 30%)      │
│ Intenta agregar: "Otro Examen" (Examen 30%)│
└────────────────────────────────────────────┘

PASO 2: Sistema detecta
┌────────────────────────────────────────────┐
│ ❌ ERROR: Ya existe una evaluación         │
│    de tipo "Examen de Período (30%)"       │
│    en este grupo.                          │
│                                            │
│ 💡 Selecciona otro tipo de la lista        │
└────────────────────────────────────────────┘

PASO 3: Dropdown muestra solo disponibles
┌────────────────────────────────────────────┐
│ Tipos disponibles:                         │
│ ✅ Examen Parcial (25%)                    │
│ ✅ Actividad Integradora (25%)             │
│ ✅ Laboratorio (10%)                       │
│ ✅ Tarea (5%)                              │
│ ✅ Coevaluación (5%)                       │
│                                            │
│ ❌ Examen de Período (30%) [YA EXISTE]     │
└────────────────────────────────────────────┘
```

## 🎨 Código de Colores

### Barras de Progreso

- 🟢 **Verde**: 100% exacto → Completo
- 🟠 **Naranja**: < 100% → Incompleto
- 🔴 **Rojo**: > 100% → Sobrepasa

### Badges de Estado

- `[Completo]` → Verde con ✅
- `[Falta X%]` → Naranja con ⚠️
- `[Excede 100%]` → Rojo con 🚫

### Tipos de Evaluación

- 🎯 Examen de Período
- 📝 Examen Parcial
- 🎨 Actividad Integradora
- 🧪 Laboratorio
- 📖 Tarea
- 👥 Coevaluación

## 📱 Responsive Design

### Desktop (> 1024px)

```
┌─────────────────────────────────────────────────────────┐
│  [Filtro 1]  [Filtro 2]  [Filtro 3]                    │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ Grupo 1 - Completo                             │   │
│  └────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────┐   │
│  │ Grupo 2 - Incompleto                           │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1024px)

```
┌──────────────────────────────────┐
│ [Filtro 1] [Filtro 2]            │
│ [Filtro 3]                       │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Grupo 1 (Tabla compacta)     │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

### Mobile (< 768px)

```
┌──────────────────┐
│ [Filtros ▼]      │
│                  │
│ ┌──────────────┐ │
│ │ 📚 Mat - T1  │ │
│ │ 70% ⚠️       │ │
│ │ ▓▓▓▓░░       │ │
│ │              │ │
│ │ Cards en     │ │
│ │ lugar de     │ │
│ │ tabla        │ │
│ └──────────────┘ │
└──────────────────┘
```

## 🔔 Notificaciones Toast

### Éxito ✅

```
┌─────────────────────────────────┐
│ ✅ Evaluación agregada          │
│    correctamente                │
└─────────────────────────────────┘
```

### Error ❌

```
┌─────────────────────────────────┐
│ ❌ Ya existe una evaluación     │
│    de tipo "Examen (30%)"       │
└─────────────────────────────────┘
```

### Advertencia ⚠️

```
┌─────────────────────────────────┐
│ ⚠️ Esta evaluación sobrepasa    │
│    el 100%. Actual: 75%         │
│    + Nuevo: 30% = 105%          │
└─────────────────────────────────┘
```

## 🎯 Métricas de UX

### Antes vs Ahora

#### Agregar una evaluación

```
ANTES:
1. Click "Nueva Evaluación" (botón)
2. Modal se abre
3. Llenar 8 campos
4. Scroll en modal
5. Click "Guardar"
6. Modal se cierra
→ TOTAL: ~30 segundos, 5 clicks

AHORA:
1. Click "Agregar" (inline)
2. Llenar 3 campos
3. Click ✅
→ TOTAL: ~10 segundos, 2 clicks
```

#### Ver estado de un grupo

```
ANTES:
1. Mirar tabla completa
2. Sumar mentalmente porcentajes
3. Verificar qué tipos existen
4. Calcular qué falta
→ TOTAL: ~60 segundos, propenso a errores

AHORA:
1. Ver barra de progreso
2. Ver "Falta X%"
3. Ver lista de tipos faltantes
→ TOTAL: ~5 segundos, sin cálculos
```

## 🎓 Capacitación Sugerida

### Para Orientadores

1. **"La barra verde es tu amiga"**
   - Verde = Completo ✅
   - Naranja = Falta trabajo ⚠️
   - Rojo = Algo está mal 🚫

2. **"Mira los tipos faltantes"**
   - Panel amarillo muestra qué agregarfaltar
   - Cada badge es un tipo que necesitas

3. **"Agrega directo en la tabla"**
   - No más modales molestos
   - Click "Agregar" → Llena → ✅ Listo

4. **"El sistema te cuida"**
   - No puedes duplicar tipos
   - No puedes pasar de 100%
   - Ves errores inmediatamente

---

## 🎨 Paleta de Colores

```css
/* Progreso */
--complete: #10b981 /* Verde */ --incomplete: #f59e0b /* Naranja */
  --exceed: #ef4444 /* Rojo */ /* Estados */ --success: #10b981
  --warning: #f59e0b --error: #ef4444 --info: #3b82f6 /* UI */
  --primary: #3b82f6 --secondary: #6b7280 --accent: #8b5cf6;
```

## ✨ Animaciones

```
Agregar evaluación:
├─ Fila aparece: slide-down 200ms
├─ Campos: fade-in 150ms
└─ Al guardar: success pulse 300ms

Actualizar progreso:
├─ Barra: smooth width transition 400ms
├─ Porcentaje: count-up animation 500ms
└─ Badge: scale pulse 200ms

Eliminar:
└─ Fila desaparece: fade-out + slide-up 300ms
```

---

**¡El nuevo diseño hace que gestionar evaluaciones sea pan comido! 🍞**
