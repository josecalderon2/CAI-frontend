# 🎯 Nueva Estructura de Visualización

## Cambio Principal:

Antes (mal):

```
Lenguaje - Trimestre 3 - Octubre: 35%
Lenguaje - Trimestre 3 - Septiembre: 35%
Lenguaje - Trimestre 3 - Agosto: 35%
```

Ahora (correcto):

```
┌─ Lenguaje y Literatura - Trimestre 3
│
├─── EVALUACIONES MENSUALES (35% del trimestre)
│    │
│    ├─ Octubre (35%)
│    │  ├─ Laboratorio (15%)
│    │  ├─ Tarea (5%)
│    │  └─ Revisión de Cuaderno (15%)
│    │
│    ├─ Septiembre (35%)
│    │  ├─ Laboratorio (15%)
│    │  ├─ Tarea (5%)
│    │  └─ Revisión de Cuaderno (15%)
│    │
│    └─ Agosto (35%)
│       ├─ Laboratorio (15%)
│       ├─ Tarea (5%)
│       └─ Revisión de Cuaderno (15%)
│
└─── EVALUACIONES TRIMESTRALES (65% del trimestre)
     ├─ Actividad Integradora (25%)
     ├─ Autoevaluación (10%)
     └─ Examen Trimestral (30%)
```

## Explicación:

1. **Un solo grupo por trimestre** - No se separa por mes
2. **Dos secciones dentro del trimestre:**
   - Mensuales: Agrupadas por mes, cada mes suma 35% (normalizado a 100%)
   - Trimestrales: Evaluaciones del trimestre completo, suman 65%
3. **Total del trimestre: 100%** (35% mensuales + 65% trimestrales)

## Interfaz Nueva:

```typescript
interface EvaluacionPorMes {
  mes: number;
  evaluaciones: Evaluacion[];
  porcentajeTotal: number;
  tiposFaltantes: TipoEvaluacion[];
  tiposExistentes: Map<number, Evaluacion>;
  estaCompleto: boolean; // true si suma 35%
}

interface EvaluacionAgrupada {
  asignatura: AsignaturaEvaluacion;
  trimestre: number | null;
  periodo: number | null;
  evaluacionesMensuales: EvaluacionPorMes[]; // Array de meses
  evaluacionesTrimestrales: Evaluacion[]; // Evaluaciones del trimestre
  porcentajeTotalTrimestral: number; // Debe sumar 65%
  tiposFaltantesTrimestral: TipoEvaluacion[];
  estaCompleto: boolean; // true si todo suma 100%
}
```

## Visualización en UI:

```jsx
<Card>
  <CardHeader>
    <h3>Lenguaje - Trimestre 3</h3>
    <ProgressBar value={totalTrimestre} /> {/* 100% */}
  </CardHeader>

  <CardContent>
    {/* Sección Mensuales */}
    <div className="mensual-section">
      <h4>Evaluaciones Mensuales (35%)</h4>

      {grupo.evaluacionesMensuales.map((mes) => (
        <div key={mes.mes} className="mes-card">
          <h5>
            {getNombreMes(mes.mes)} - {mes.porcentajeTotal}%
          </h5>
          {mes.evaluaciones.map((ev) => (
            <div>
              {ev.nombre} - {ev.tipoEvaluacion.porcentaje}%
            </div>
          ))}
          {mes.tiposFaltantes.length > 0 && (
            <div>Faltan: {mes.tiposFaltantes.map((t) => t.nombre)}</div>
          )}
        </div>
      ))}
    </div>

    {/* Sección Trimestrales */}
    <div className="trimestral-section">
      <h4>Evaluaciones Trimestrales (65%)</h4>

      {grupo.evaluacionesTrimestrales.map((ev) => (
        <div>
          {ev.nombre} - {ev.tipoEvaluacion.porcentaje}%
        </div>
      ))}

      {grupo.tiposFaltantesTrimestral.length > 0 && (
        <div>Faltan: {grupo.tiposFaltantesTrimestral.map((t) => t.nombre)}</div>
      )}
    </div>
  </CardContent>
</Card>
```
