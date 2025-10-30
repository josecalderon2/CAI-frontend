# 🔧 Correcciones Completas para el Módulo de Asistencia

## 📝 Resumen de Cambios

### 1. **Interfaces y Tipos** ✅ HECHO

- ✅ Quitado campo `rut` de `AlumnoResponse`
- ✅ Actualizado `BulkAsistenciaDto` para usar `registros` en lugar de `asistencias`
- ✅ Actualizado `CreateAsistenciaDto` para usar números en lugar de strings
- ✅ Agregado campo `trimestre` a `CreateAsistenciaDto`
- ✅ Actualizado `ResumenMensualDto` y `ResumenTrimestralDto`

### 2. **Vista de Toma de Asistencia** ⚠️ PENDIENTE

Cambios necesarios en la tabla de alumnos:

```tsx
// QUITAR COLUMNA DE RUT:
// Buscar en línea ~765 y ELIMINAR:
<TableHead>RUT</TableHead>

// Y en el map de alumnos ELIMINAR:
<TableCell>RUT: {alumno.rut}</TableCell>

// CAMBIAR QUITAR LA PALABRA "EXIMIDO" por algo más claro
// El campo E significa "Excusado/Justificado" no "Eximido"
```

### 3. **Lógica de Estados de Asistencia**

Los estados correctos según el schema son:

- **P** = Presente
- **E** = Excusado/Justificado (falta con permiso)
- **SP** = Sin Permiso (falta injustificada)
- **A** = Atraso/Tarde

**Flujo de Toma de Asistencia:**

1. Por defecto todos están sin marcar
2. Marcar **P** (Presente) si vino a clase
3. Marcar **A** (Tarde) si llegó tarde
4. Si no vino, preguntar si tiene permiso:
   - **E** = Con permiso/justificado
   - **SP** = Sin permiso/injustificado

### 4. **Vista de Resúmenes** ⚠️ PENDIENTE

#### Resumen Mensual

Cambiar completamente el render para mostrar los nuevos campos:

```tsx
const renderResumenMensual = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Resumen Mensual de Asistencia</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Curso</Label>
            <Select
              value={filtroResumenMensual.cursoId.toString()}
              onValueChange={(v) =>
                setFiltroResumenMensual({
                  ...filtroResumenMensual,
                  cursoId: parseInt(v),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar curso" />
              </SelectTrigger>
              <SelectContent>
                {cursosAsignados.map((curso) => (
                  <SelectItem
                    key={curso.id_curso}
                    value={curso.id_curso.toString()}
                  >
                    {curso.nombre} {curso.seccion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Mes</Label>
            <Select
              value={filtroResumenMensual.mes.toString()}
              onValueChange={(v) =>
                setFiltroResumenMensual({
                  ...filtroResumenMensual,
                  mes: parseInt(v),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(2000, i, 1).toLocaleDateString('es-ES', {
                      month: 'long',
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Año</Label>
            <Input
              type="number"
              value={filtroResumenMensual.anio}
              onChange={(e) =>
                setFiltroResumenMensual({
                  ...filtroResumenMensual,
                  anio: parseInt(e.target.value),
                })
              }
            />
          </div>
        </div>
        <Button
          onClick={handleGenerarResumenMensual}
          disabled={isLoading || filtroResumenMensual.cursoId === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          {isLoading ? 'Generando...' : 'Generar Resumen'}
        </Button>
      </CardContent>
    </Card>

    {resumenMensual && resumenMensual.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle>Resultado - Resumen Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Curso:{' '}
            {
              cursosAsignados.find(
                (c) => c.id_curso === filtroResumenMensual.cursoId
              )?.nombre
            }{' '}
            | Mes:{' '}
            {new Date(2000, filtroResumenMensual.mes - 1, 1).toLocaleDateString(
              'es-ES',
              { month: 'long' }
            )}{' '}
            | Año: {filtroResumenMensual.anio}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead>Justificadas</TableHead>
                <TableHead>Injustificadas</TableHead>
                <TableHead>Atrasos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumenMensual.map((alumno) => (
                <TableRow key={alumno.id_alumno}>
                  <TableCell className="font-medium">
                    {alumno.nombre} {alumno.apellido}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50">
                      {alumno.justificadas}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">{alumno.injustificadas}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="warning" className="bg-yellow-100">
                      {alumno.atrasos}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )}
  </div>
);
```

#### Resumen Trimestral

```tsx
const renderResumenTrimestral = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Award className="w-5 h-5" />
          <span>Resumen Trimestral con Nota de Conducta</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Curso</Label>
            <Select
              value={filtroResumenTrimestral.cursoId.toString()}
              onValueChange={(v) =>
                setFiltroResumenTrimestral({
                  ...filtroResumenTrimestral,
                  cursoId: parseInt(v),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar curso" />
              </SelectTrigger>
              <SelectContent>
                {cursosAsignados.map((curso) => (
                  <SelectItem
                    key={curso.id_curso}
                    value={curso.id_curso.toString()}
                  >
                    {curso.nombre} {curso.seccion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Trimestre</Label>
            <Select
              value={filtroResumenTrimestral.trimestre.toString()}
              onValueChange={(v) =>
                setFiltroResumenTrimestral({
                  ...filtroResumenTrimestral,
                  trimestre: parseInt(v),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Primer Trimestre</SelectItem>
                <SelectItem value="2">Segundo Trimestre</SelectItem>
                <SelectItem value="3">Tercer Trimestre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Año</Label>
            <Input
              type="number"
              value={filtroResumenTrimestral.anio}
              onChange={(e) =>
                setFiltroResumenTrimestral({
                  ...filtroResumenTrimestral,
                  anio: parseInt(e.target.value),
                })
              }
            />
          </div>
        </div>
        <Button
          onClick={handleGenerarResumenTrimestral}
          disabled={isLoading || filtroResumenTrimestral.cursoId === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          {isLoading ? 'Generando...' : 'Generar Resumen'}
        </Button>
      </CardContent>
    </Card>

    {resumenTrimestral && resumenTrimestral.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle>Resultado - Resumen Trimestral</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Curso:{' '}
            {
              cursosAsignados.find(
                (c) => c.id_curso === filtroResumenTrimestral.cursoId
              )?.nombre
            }{' '}
            | Trimestre: {filtroResumenTrimestral.trimestre} | Año:{' '}
            {filtroResumenTrimestral.anio}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead>Justificadas</TableHead>
                <TableHead>Injustificadas</TableHead>
                <TableHead>Infracciones</TableHead>
                <TableHead>Puntaje Conducta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumenTrimestral.map((alumno) => (
                <TableRow key={alumno.id_alumno}>
                  <TableCell className="font-medium">
                    {alumno.nombre} {alumno.apellido}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50">
                      {alumno.justificadas}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">{alumno.injustificadas}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {alumno.infracciones.length === 0 ? (
                        <Badge variant="outline" className="bg-green-50">
                          Sin infracciones
                        </Badge>
                      ) : (
                        alumno.infracciones.map((inf, idx) => (
                          <Badge
                            key={idx}
                            variant={
                              inf.categoria === 'MUY_GRAVE'
                                ? 'destructive'
                                : inf.categoria === 'GRAVE'
                                  ? 'warning'
                                  : 'outline'
                            }
                            className="mr-1"
                          >
                            {inf.articulo}: {inf.cantidad}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        alumno.puntajeConducta >= 8
                          ? 'default'
                          : alumno.puntajeConducta >= 6
                            ? 'warning'
                            : 'destructive'
                      }
                      className={
                        alumno.puntajeConducta >= 8
                          ? 'bg-green-600'
                          : alumno.puntajeConducta >= 6
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                      }
                    >
                      {alumno.puntajeConducta.toFixed(1)} / 10
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Leyenda de cálculo */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Fórmula de Cálculo:</h4>
            <p className="text-sm text-gray-600">
              Puntaje = 10 - (Injustificadas × 0.2) - (Infracciones según
              categoría)
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>• Menos Graves: -1 punto c/u</li>
              <li>• Graves: -2 puntos c/u</li>
              <li>• Muy Graves: -3 puntos c/u</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )}
  </div>
);
```

## 🔧 Cambios en el Backend

### En `cursos.service.ts` - Método `getAlumnosPorCurso`:

```typescript
async getAlumnosPorCurso(cursoId: number) {
  await this.findOne(cursoId);

  const alumnosCurso = await this.prisma.alumnoCurso.findMany({
    where: {
      cursoId: cursoId,
      estado: 'ACTIVO',
    },
    include: {
      alumno: {
        select: {
          id_alumno: true,
          nombre: true,
          apellido: true,
          // NO incluir rut
        },
      },
    },
    orderBy: {
      alumno: {
        apellido: 'asc',
      },
    },
  });

  return alumnosCurso.map((ac) => ({
    id_alumno: ac.alumno.id_alumno,
    nombre: ac.alumno.nombre,
    apellido: ac.alumno.apellido,
    // NO retornar rut
  }));
}
```

### En `cursosService.ts` - Agregar interface:

```typescript
export interface Curso {
  // ... campos existentes
  // Quitar rut de todas las interfaces
}
```

## ✅ Checklist Final

- [ ] 1. Quitar columna RUT de tabla de alumnos
- [ ] 2. Cambiar label "Eximido" a "Justificado" o "Con Permiso"
- [ ] 3. Actualizar renderResumenMensual con nuevo código
- [ ] 4. Actualizar renderResumenTrimestral con nuevo código
- [ ] 5. Verificar que el backend retorne los datos correctos
- [ ] 6. Probar flujo completo de toma de asistencia
- [ ] 7. Probar generación de resúmenes

## 🧪 Testing

### 1. Toma de Asistencia:

- Seleccionar curso
- Marcar presente (P)
- Marcar tarde (A)
- Marcar ausencia justificada (E)
- Marcar ausencia injustificada (SP)
- Guardar y verificar que se guarde correctamente

### 2. Resumen Mensual:

- Seleccionar curso, mes y año
- Generar resumen
- Verificar que muestre: justificadas, injustificadas, atrasos

### 3. Resumen Trimestral:

- Seleccionar curso, trimestre y año
- Generar resumen
- Verificar que muestre: justificadas, injustificadas, infracciones, puntaje de conducta
- Verificar cálculo: 10 - (SP × 0.2) - (infracciones)

---

**Última actualización**: 28 de octubre de 2025  
**Estado**: 📝 Implementar cambios en vistas de resúmenes
