import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import {
  cursosService,
  type Curso as CursoServicio,
} from '../api/services/cursosService';
import asignacionesService from '../api/services/asignacionesService';
import {
  notasService,
  type FormatoEvaluacionResponse,
  type ActividadEvaluacion,
  type NotaMensualResponse,
} from '../api/services/notasService';
import { getUser } from '../utils/auth';
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle,
  FileText,
  Loader2,
  Save,
  Users,
} from 'lucide-react';

type Alumno = {
  id_alumno: number;
  nombre: string;
  apellido: string;
  rut?: string;
};

type Asignatura = {
  id_asignatura: number;
  nombre: string;
};

type CeldaNota = {
  // clave única por actividad
  key: string;
  id_tipo_actividad: number;
  numero_actividad?: number;
  label: string;
};

type RowNotas = {
  alumno: Alumno;
  // valores de notas por key de actividad
  valores: Record<string, string>; // string para inputs controlados
  examen_mensual: string; // para BASICA o examen de periodo en Bachillerato
  examen_parcial: string; // para Bachillerato
  // datos calculados devueltos por backend
  calculos?: {
    promedio_puro_actividades?: number;
    nota_mensual?: number;
    aporte_al_trimestre?: number;
  };
  // estados de guardado por fila
  saving?: boolean;
  savedAt?: number;
  error?: string | null;
};

const nombresMeses = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export default function NotasIngresoMensualCurso() {
  // selección principal
  const [cursos, setCursos] = useState<CursoServicio[]>([]);
  const [cursoId, setCursoId] = useState<number | ''>('');
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [asignaturaId, setAsignaturaId] = useState<number | ''>('');
  const [mes, setMes] = useState<number>(() => new Date().getMonth() + 1); // 1-12

  // datos dependientes
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [formato, setFormato] = useState<FormatoEvaluacionResponse | null>(
    null
  );
  const [columnas, setColumnas] = useState<CeldaNota[]>([]);
  const [rows, setRows] = useState<RowNotas[]>([]);

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

  const usuario = useMemo(() => getUser(), []);

  // cargar cursos del orientador
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await cursosService.getMisCursos();
        setCursos(data);
      } catch (e: any) {
        setError(e?.message || 'Error al cargar cursos');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // al seleccionar curso: cargar alumnos y asignaturas evitando 403 para Orientador
  useEffect(() => {
    if (!cursoId) {
      setAlumnos([]);
      setAsignaturas([]);
      setAsignaturaId('');
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);
        // alumnos del curso
        const alumnosData = await cursosService.getAlumnosPorCurso(
          Number(cursoId)
        );
        setAlumnos(alumnosData);

        // estrategia para asignaturas:
        // 1. Intentar leerlas del objeto curso (si backend las incluyó en mis-cursos)
        // 2. Si rol es Admin/P.A intentar /asignaciones con filtros
        // 3. Fallback a /asignaturas/curso/:id
        let asigs: Asignatura[] = [];
        const cursoSel: any = cursos.find(
          (c) => (c.id_curso ?? 0) === Number(cursoId)
        );
        const embebidas = Array.isArray(cursoSel?.asignaturas)
          ? cursoSel.asignaturas
          : null;
        if (embebidas && embebidas.length) {
          asigs = embebidas.map((a: any) => ({
            id_asignatura: a.id_asignatura,
            nombre: a.nombre,
          }));
        } else {
          const rol = usuario?.role;
          const puedeAsignaciones = rol === 'Admin' || rol === 'P.A';
          if (puedeAsignaciones) {
            try {
              const resp = await asignacionesService.getAsignaciones({
                id_curso: Number(cursoId),
                limit: 200,
              });
              const uniqueMap = new Map<number, Asignatura>();
              resp.data.forEach((a) => {
                if (a.asignatura?.id_asignatura && a.asignatura?.nombre) {
                  uniqueMap.set(a.asignatura.id_asignatura, {
                    id_asignatura: a.asignatura.id_asignatura,
                    nombre: a.asignatura.nombre,
                  });
                }
              });
              asigs = Array.from(uniqueMap.values());
            } catch {
              asigs = await asignacionesService.getAsignaturasPorCurso(
                Number(cursoId)
              );
            }
          } else {
            asigs = await asignacionesService.getAsignaturasPorCurso(
              Number(cursoId)
            );
          }
        }
        setAsignaturas(asigs);
      } catch (e: any) {
        setError(e?.message || 'Error al cargar datos del curso');
      } finally {
        setLoading(false);
      }
    })();
  }, [cursoId, usuario?.role, cursos]);

  // al seleccionar asignatura: cargar formato y construir columnas
  useEffect(() => {
    if (!asignaturaId) {
      setFormato(null);
      setColumnas([]);
      setRows([]);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar formato para determinar nivel educativo
        const f = await notasService.obtenerFormatoEvaluacion(
          Number(asignaturaId)
        );
        setFormato(f);

        // Cargar catálogo de tipos de actividad (RECOMENDADO)
        const catalogo = await notasService.obtenerCatalogoTiposActividad(
          Number(asignaturaId)
        );

        // construir columnas dinámicas desde el catálogo
        const cols: CeldaNota[] = [];

        catalogo.forEach((act) => {
          if (act.permite_multiples_instancias) {
            // Para actividades que permiten múltiples instancias (ej: Tarea)
            // Crear dos instancias por defecto: Tarea 1, Tarea 2
            cols.push({
              key: `${act.id_tipo_actividad}-1`,
              id_tipo_actividad: act.id_tipo_actividad,
              numero_actividad: 1,
              label: `${act.nombre} 1`,
            });
            cols.push({
              key: `${act.id_tipo_actividad}-2`,
              id_tipo_actividad: act.id_tipo_actividad,
              numero_actividad: 2,
              label: `${act.nombre} 2`,
            });
          } else {
            // Actividades únicas (ej: Revisión de libros y cuadernos)
            cols.push({
              key: `${act.id_tipo_actividad}-0`,
              id_tipo_actividad: act.id_tipo_actividad,
              numero_actividad: undefined,
              label: act.nombre,
            });
          }
        });

        // Agregar columnas de exámenes según el nivel
        if (f.nivel === 'BASICA') {
          cols.push({
            key: 'examen_mensual',
            id_tipo_actividad: -1,
            label: 'Examen Mensual',
          });
        } else {
          // Bachillerato
          if (f.incluye_examen_parcial) {
            cols.push({
              key: 'examen_parcial',
              id_tipo_actividad: -2,
              label: 'Examen Parcial',
            });
          }
          if (f.incluye_examen_periodo) {
            cols.push({
              key: 'examen_mensual',
              id_tipo_actividad: -3,
              label: 'Examen del Periodo',
            });
          }
        }

        setColumnas(cols);

        // construir filas iniciales por alumno
        const baseRows: RowNotas[] = alumnos.map((al) => ({
          alumno: al,
          valores: Object.fromEntries(
            cols
              .filter((c) => !c.key.startsWith('examen_'))
              .map((c) => [c.key, ''])
          ),
          examen_mensual: '',
          examen_parcial: '',
        }));
        setRows(baseRows);

        // cargar notas existentes por alumno de forma escalonada
        await cargarNotasExistentes(baseRows, Number(asignaturaId), mes);
      } catch (e: any) {
        setError(e?.message || 'Error al cargar formato de evaluación');
      } finally {
        setLoading(false);
      }
    })();
  }, [asignaturaId, alumnos, mes]);

  const cargarNotasExistentes = async (
    rowsBase: RowNotas[],
    idAsignatura: number,
    mesNum: number
  ) => {
    const anio = new Date().getFullYear();
    const nuevos: RowNotas[] = [...rowsBase];

    try {
      // Cargar todas las notas del mes en una sola petición (optimizado)
      const todasLasNotas = await notasService.consultarNotasSimplificadas({
        id_asignatura: idAsignatura,
        mes: mesNum,
        anio: anio,
      });

      // Mapear las notas a las filas correspondientes
      nuevos.forEach((row) => {
        const notaAlumno = todasLasNotas.find(
          (n) => n.id_alumno === row.alumno.id_alumno
        );
        if (notaAlumno) {
          aplicarNotaEnRow(row, notaAlumno);
        }
      });

      setRows([...nuevos]);
    } catch (error) {
      console.error('Error al cargar notas existentes:', error);
      // No mostrar error al usuario, simplemente dejar los campos vacíos
    }
  };

  const aplicarNotaEnRow = (row: RowNotas, nota: NotaMensualResponse) => {
    // mapear actividades
    const nuevosValores = { ...row.valores };
    columnas.forEach((c) => {
      if (c.key.startsWith('examen_')) return;

      // Buscar la actividad correspondiente
      // Para actividades únicas (sin numero_actividad), comparar solo el tipo
      // Para actividades múltiples (con numero_actividad), comparar tipo y número
      const a = nota.actividades?.find((x) => {
        if (c.numero_actividad === undefined) {
          // Actividad única: solo comparar id_tipo_actividad
          return x.id_tipo_actividad === c.id_tipo_actividad;
        } else {
          // Actividad múltiple: comparar id_tipo_actividad y numero_actividad
          return (
            x.id_tipo_actividad === c.id_tipo_actividad &&
            x.numero_actividad === c.numero_actividad
          );
        }
      });

      nuevosValores[c.key] = a?.nota != null ? a.nota.toString() : '';
    });
    row.valores = nuevosValores;
    row.examen_mensual =
      nota.examen_mensual != null ? String(nota.examen_mensual) : '';
    // algunos modelos pueden llamar a examen de periodo igual que examen_mensual
    (row as any).examen_parcial =
      (nota as any).examen_parcial != null
        ? String((nota as any).examen_parcial)
        : row.examen_parcial;
    row.calculos = {
      promedio_puro_actividades: nota.promedio_puro_actividades,
      nota_mensual: nota.nota_mensual,
      aporte_al_trimestre: nota.aporte_al_trimestre,
    };
  };

  const onChangeNota = (rowIndex: number, key: string, value: string) => {
    setRows((prev) => {
      const copy = [...prev];
      const r = { ...copy[rowIndex] };
      if (key === 'examen_mensual') r.examen_mensual = sanitizeNota(value);
      else if (key === 'examen_parcial') r.examen_parcial = sanitizeNota(value);
      else r.valores = { ...r.valores, [key]: sanitizeNota(value) };
      copy[rowIndex] = r;
      return copy;
    });
  };

  const sanitizeNota = (v: string) => {
    if (v === '') return '';
    const n = parseFloat(v);
    if (isNaN(n)) return '';
    if (n < 0) return '0';
    if (n > 10) return '10';
    return v;
  };

  const buildDto = (
    row: RowNotas
  ): { ok: boolean; payload?: any; error?: string } => {
    if (!asignaturaId) return { ok: false, error: 'Seleccione asignatura' };
    // construir actividades ingresadas
    const actividades: ActividadEvaluacion[] = columnas
      .filter((c) => !c.key.startsWith('examen_'))
      .map((c) => ({ key: c.key, valor: row.valores[c.key], c }))
      .filter((x) => x.valor !== '')
      .map((x) => ({
        id_tipo_actividad: x.c.id_tipo_actividad,
        numero_actividad: x.c.numero_actividad,
        nota: parseFloat(x.valor),
      }));

    const hasInputs =
      actividades.length > 0 ||
      row.examen_mensual !== '' ||
      row.examen_parcial !== '';
    if (!hasInputs) return { ok: false, error: 'Ingrese al menos una nota' };

    const dto = {
      id_alumno: row.alumno.id_alumno,
      id_asignatura: Number(asignaturaId),
      mes,
      anio: new Date().getFullYear(),
      actividades,
      examen_mensual: row.examen_mensual
        ? parseFloat(row.examen_mensual)
        : undefined,
      examen_parcial: row.examen_parcial
        ? parseFloat(row.examen_parcial)
        : undefined,
    };
    return { ok: true, payload: dto };
  };

  const guardarFila = async (rowIndex: number) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[rowIndex] = { ...copy[rowIndex], saving: true, error: null };
      return copy;
    });
    try {
      const row = rows[rowIndex];
      const { ok, payload, error: e } = buildDto(row);
      if (!ok) throw new Error(e);
      const res = await notasService.crearNotaSimplificada(payload!);
      // aplicar resultados
      setRows((prev) => {
        const copy = [...prev];
        const r = { ...copy[rowIndex] };
        aplicarNotaEnRow(r, res);
        r.saving = false;
        r.savedAt = Date.now();
        copy[rowIndex] = r;
        return copy;
      });
    } catch (err: any) {
      setRows((prev) => {
        const copy = [...prev];
        copy[rowIndex] = {
          ...copy[rowIndex],
          saving: false,
          error: err?.message || 'Error al guardar',
        };
        return copy;
      });
    }
  };

  const guardarTodo = async () => {
    if (!rows.length) return;
    setGlobalSuccess(null);
    setError(null);
    // guardar en grupos para no saturar
    const order = [...rows.keys()];
    for (const i of order) {
      await guardarFila(i);
    }
    setGlobalSuccess(
      'Notas guardadas/actualizadas para todos los alumnos visibles'
    );
  };

  const puedeGuardar = Boolean(
    cursoId && asignaturaId && formato && alumnos.length
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" /> Ingreso de Notas
            Mensuales por Curso
          </h1>
          <p className="text-gray-600 mt-1">
            {nombresMeses[mes - 1]} {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {globalSuccess && (
        <Alert className="border-green-500 text-green-700 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{globalSuccess}</AlertDescription>
        </Alert>
      )}

      {/* Filtros: Curso / Asignatura / Mes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Curso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={cursoId}
              onChange={(e) =>
                setCursoId(e.target.value ? Number(e.target.value) : '')
              }
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">-- Seleccione un curso --</option>
              {cursos.map((c, idx) => (
                <option
                  key={c.id_curso ?? idx}
                  value={c.id_curso ?? ''}
                  disabled={c.id_curso == null}
                >
                  {c.nombre} {c.seccion ? `- ${c.seccion}` : ''}{' '}
                  {c.gradoAcademico ? `(${c.gradoAcademico.nombre})` : ''}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Asignatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={asignaturaId}
              onChange={(e) =>
                setAsignaturaId(e.target.value ? Number(e.target.value) : '')
              }
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              disabled={loading || !cursoId}
            >
              <option value="">-- Seleccione una asignatura --</option>
              {asignaturas.map((a) => (
                <option key={a.id_asignatura} value={a.id_asignatura}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {nombresMeses[m - 1]}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de ingreso */}
      {cursoId && asignaturaId && formato && (
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Evaluaciones del mes
              <span className="text-sm font-normal text-gray-500">
                (
                {formato.nivel === 'BASICA'
                  ? 'Educación Básica'
                  : 'Bachillerato'}
                )
              </span>
            </CardTitle>
            <div className="flex items-center gap-3">
              <Button
                onClick={guardarTodo}
                disabled={!puedeGuardar || loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar todo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left sticky left-0 bg-gray-50 z-10">
                      Alumno
                    </th>
                    {columnas.map((col) => (
                      <th
                        key={col.key}
                        className="px-3 py-2 text-left whitespace-nowrap"
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left whitespace-nowrap">
                      Promedio
                    </th>
                    {formato.nivel === 'BASICA' && (
                      <th className="px-3 py-2 text-left whitespace-nowrap">
                        Aporte Trimestre
                      </th>
                    )}
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.alumno.id_alumno} className="border-b">
                      <td className="px-3 py-2 sticky left-0 bg-white z-10 whitespace-nowrap">
                        {row.alumno.apellido}, {row.alumno.nombre}
                      </td>
                      {columnas.map((col) => (
                        <td key={col.key} className="px-2 py-1">
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            max={10}
                            value={
                              col.key === 'examen_mensual'
                                ? row.examen_mensual
                                : col.key === 'examen_parcial'
                                  ? row.examen_parcial
                                  : row.valores[col.key] || ''
                            }
                            onChange={(e) =>
                              onChangeNota(idx, col.key, e.target.value)
                            }
                            className="w-28 p-1 border rounded-md focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 font-semibold text-blue-600">
                        {row.calculos?.nota_mensual != null
                          ? row.calculos.nota_mensual.toFixed(2)
                          : '-'}
                      </td>
                      {formato.nivel === 'BASICA' && (
                        <td className="px-3 py-2">
                          {row.calculos?.aporte_al_trimestre != null
                            ? row.calculos.aporte_al_trimestre.toFixed(2)
                            : '-'}
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => guardarFila(idx)}
                            disabled={row.saving}
                            className="flex items-center gap-1"
                          >
                            {row.saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            {row.saving ? 'Guardando...' : 'Guardar'}
                          </Button>
                          {row.savedAt && !row.saving && !row.error && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                          {row.error && (
                            <span className="text-red-600 text-xs">
                              {row.error}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={5 + columnas.length}
                        className="px-3 py-6 text-center text-gray-500"
                      >
                        No hay alumnos para este curso
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {!cursoId && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Seleccione un curso para comenzar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
