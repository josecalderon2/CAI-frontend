# 📋 INSTRUCCIONES PARA COMPLETAR LA ACTUALIZACIÓN

## ✅ Lo que ya está listo:

1. ✅ Nueva interfaz `EvaluacionAgrupada` con estructura correcta
2. ✅ Función `agruparEvaluaciones()` completamente reescrita
3. ✅ Componente `GrupoTrimestreCard.tsx` creado para renderizar correctamente

## 🔧 Lo que falta hacer:

### Paso 1: Importar el nuevo componente

En `EvaluacionesModule.tsx`, añade al inicio:

```tsx
import { GrupoTrimestreCard } from './GrupoTrimestreCard';
```

### Paso 2: Reemplazar el renderizado

Busca la sección que dice `{/* Grupos de evaluaciones */}` (alrededor de la línea 615)

Reemplaza TODO el bloque `grupos.map((grupo) => { ... })` con:

```tsx
grupos.map((grupo) => (
  <GrupoTrimestreCard
    key={`${grupo.asignatura.id_asignatura}-${grupo.trimestre || 'null'}-${grupo.periodo || 'null'}`}
    grupo={grupo}
    onDelete={handleDeleteClick}
    getNombreMes={getNombreMes}
  />
));
```

### Paso 3: Eliminar código no usado

1. Eliminar el estado `agregandoEn` (ya no se usa por ahora)
2. Eliminar la función `iniciarAgregado`
3. Eliminar la función `cancelarAgregado`
4. Simplificar `guardarNuevaEvaluacion`

## 🎯 Resultado Esperado:

```
┌─ Lenguaje y Literatura - Trimestre 3 [70%]
│
├─ EVALUACIONES MENSUALES (35% del trimestre)
│  │
│  ├─ Octubre [35% / 35%] ✅
│  │  ├─ Laboratorio (15%)
│  │  ├─ Tarea (5%)
│  │  └─ Revisión de Cuaderno (15%)
│  │
│  ├─ Septiembre [35% / 35%] ✅
│  │  ├─ Laboratorio (15%)
│  │  ├─ Tarea (5%)
│  │  └─ Revisión de Cuaderno (15%)
│  │
│  └─ Agosto [35% / 35%] ✅
│     ├─ Laboratorio (15%)
│     ├─ Tarea (5%)
│     └─ Revisión de Cuaderno (15%)
│
└─ EVALUACIONES TRIMESTRALES (65% del trimestre)
   └─ [0% / 65%] ❌ Faltan: Actividad Integradora, Autoevaluación, Examen
```

## 🚀 Siguiente paso:

¿Quieres que te ayude a hacer estos reemplazos o prefieres hacerlo manualmente?
