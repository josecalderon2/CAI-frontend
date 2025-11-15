import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cursosService, type Curso } from '../../api/services/cursosService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { Alumno } from '../../types';
import {
  reportesOrientadorService,
  type ReporteNotasAlumno,
  type ReporteBoletaAlumno,
} from '../../api/services/reportesOrientadorService';
import { api } from '../../api/axiosConfig';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Props {
  alumnos: Alumno[];
  onVolver: () => void;
}

export function NotasAlumnoView({ alumnos, onVolver }: Props) {
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string>('');
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<string>('');
  const [anio, setAnio] = useState<string>('2025');
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [alumnosFiltrados, setAlumnosFiltrados] = useState<Alumno[]>([]);
  const [cargandoCursos, setCargandoCursos] = useState(false);
  const [reporte, setReporte] = useState<ReporteNotasAlumno | null>(null);
  const [alumnoInfo, setAlumnoInfo] = useState<{
    nombre: string;
    apellido: string;
  } | null>(null);
  const [conductasResumen, setConductasResumen] = useState<
    ReporteBoletaAlumno['conductasResumen'] | null
  >(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar cursos al montar
  useEffect(() => {
    const cargarCursos = async () => {
      try {
        setCargandoCursos(true);
        const data = await cursosService.list({ activo: true, limit: 100 });
        setCursos(data.items);
      } catch (err) {
        console.error('Error al cargar cursos:', err);
      } finally {
        setCargandoCursos(false);
      }
    };
    cargarCursos();
  }, []);

  // Filtrar alumnos cuando cambia el curso seleccionado
  useEffect(() => {
    const filtrarAlumnos = async () => {
      if (!cursoSeleccionado) {
        setAlumnosFiltrados([]);
        setAlumnoSeleccionado('');
        return;
      }

      try {
        // Obtener alumnos del curso seleccionado
        const data = await cursosService.getAlumnosPorCurso(
          parseInt(cursoSeleccionado)
        );
        setAlumnosFiltrados(data as any);
        setAlumnoSeleccionado(''); // Reset alumno al cambiar curso
      } catch (err) {
        console.error('Error al cargar alumnos del curso:', err);
        setAlumnosFiltrados([]);
      }
    };
    filtrarAlumnos();
  }, [cursoSeleccionado]);

  const cargarReporte = async () => {
    if (!cursoSeleccionado) {
      setError('Debe seleccionar un curso');
      return;
    }
    if (!alumnoSeleccionado) {
      setError('Debe seleccionar un alumno');
      return;
    }

    try {
      setCargando(true);
      setError(null);

      // Cargar notas y conductas en paralelo
      const [data, boletaData] = await Promise.all([
        reportesOrientadorService.getNotasAlumno(
          parseInt(alumnoSeleccionado),
          parseInt(anio)
        ),
        reportesOrientadorService.getBoletaAlumno(
          parseInt(alumnoSeleccionado),
          parseInt(anio)
        ),
      ]);

      // ReporteNotasAlumno es un array directo
      if (!Array.isArray(data)) {
        throw new Error('Formato de respuesta inválido');
      }

      setReporte(data);
      setConductasResumen(boletaData.conductasResumen);

      // Extraer info del alumno seleccionado
      const alumno = alumnos.find(
        (a) => a.id_alumno === parseInt(alumnoSeleccionado)
      );
      if (alumno) {
        setAlumnoInfo({ nombre: alumno.nombre, apellido: alumno.apellido });
      }
    } catch (err) {
      console.error('Error al cargar notas:', err);
      setError(
        'Error al cargar las notas del alumno. Por favor, intenta de nuevo.'
      );
    } finally {
      setCargando(false);
    }
  };

  const exportarPDF = () => {
    if (!reporte || reporte.length === 0 || !alumnoInfo) return;

    const doc = new jsPDF();

    // Encabezado
    doc.setFontSize(16);
    doc.text('Historial de Notas del Alumno', 14, 15);
    doc.setFontSize(11);
    doc.text(`Alumno: ${alumnoInfo.nombre} ${alumnoInfo.apellido}`, 14, 22);
    doc.text(`Año Académico: ${anio}`, 14, 28);
    doc.text(`Total de Notas: ${reporte.length}`, 14, 34);

    // Tabla de notas
    const tableData = reporte.map((nota) => [
        // Legacy component refactored: delegates to new HistorialNotasPage architecture
        // Kept only for backward compatibility with existing imports
        import { HistorialNotasPage } from '../historial-notas/HistorialNotasPage';

        interface Props {
          onVolver: () => void;
        }

        export function NotasAlumnoView({ onVolver }: Props) {
          return <HistorialNotasPage onVolver={onVolver} />;
      head: [
        ['Asignatura', 'Evaluación', 'Tipo', 'Nota', '%', 'Trim.', 'Fecha'],
      ]),
      [],
      ['Registro de Conducta'],
      [],
      ['Total de Infracciones:', conductasResumen?.total || 0],
      [
        'Puntos Acumulados:',
        conductasResumen?.detalles.reduce(
          (sum, c) => sum + c.infraccion.puntos,
          0
        ) || 0,
      ],
      [],
      [
        'Fecha',
        'Categoría',
        'Artículo',
        'Descripción',
        'Puntos',
        'Observación',
      ],
      ...(conductasResumen && conductasResumen.detalles.length > 0
        ? conductasResumen.detalles.map((conducta) => [
            new Date(conducta.fecha).toLocaleDateString('es-ES'),
            conducta.infraccion.categoria,
            conducta.infraccion.articulo,
            conducta.infraccion.descripcion,
            conducta.infraccion.puntos,
            conducta.observacion || 'Sin observación',
          ])
        : [['No hay infracciones registradas', '', '', '', '', '']]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Notas');
    XLSX.writeFile(
      workbook,
      `notas_${alumnoInfo.nombre}_${alumnoInfo.apellido}_${anio}.xlsx`
    );
  };

  // Agrupar notas por asignatura
  const notasPorAsignatura = reporte?.reduce(
    (acc, nota) => {
      const asignaturaId = nota.asignatura.id_asignatura;
      if (!acc[asignaturaId]) {
        acc[asignaturaId] = {
          nombre: nota.asignatura.nombre,
          notas: [],
        };
      }
      acc[asignaturaId].notas.push(nota);
      return acc;
    },
    {} as Record<number, { nombre: string; notas: ReporteNotasAlumno }>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onVolver}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Historial de Notas del Alumno
            </h2>
            <p className="text-gray-600 mt-1">
              Selecciona un curso y luego un alumno para ver su historial
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4">
              <label className="text-sm font-medium mb-2 block">Curso</label>
              <Select
                value={cursoSeleccionado}
                onValueChange={setCursoSeleccionado}
                disabled={cargandoCursos}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map((curso) => (
                    <SelectItem
                      key={curso.id_curso}
                      value={curso.id_curso!.toString()}
                    >
                      {curso.gradoAcademico?.nombre} "{curso.seccion}"
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-4">
              <label className="text-sm font-medium mb-2 block">Alumno</label>
              <Select
                value={alumnoSeleccionado}
                onValueChange={setAlumnoSeleccionado}
                disabled={!cursoSeleccionado || alumnosFiltrados.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !cursoSeleccionado
                        ? 'Primero selecciona un curso'
                        : 'Selecciona un alumno'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {alumnosFiltrados.map((alumno) => (
                    <SelectItem
                      key={alumno.id_alumno}
                      value={alumno.id_alumno!.toString()}
                    >
                      {alumno.nombre} {alumno.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">
                Año Académico
              </label>
              <Select value={anio} onValueChange={setAnio}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Button
                onClick={cargarReporte}
                className="w-full"
                disabled={cargando || !cursoSeleccionado || !alumnoSeleccionado}
              >
                {cargando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generar Reporte
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado */}
      {reporte && (
        <>
          {/* Resumen */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Resumen del Reporte</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={exportarPDF}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button
                  size="sm"
                  onClick={exportarExcel}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Alumno</p>
                  <p className="font-semibold">
                    {alumnoInfo?.nombre} {alumnoInfo?.apellido}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Año Académico</p>
                  <p className="font-semibold">{anio}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Notas</p>
                  <p className="font-semibold text-blue-600">
                    {reporte.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas agrupadas por asignatura */}
          {notasPorAsignatura &&
            Object.values(notasPorAsignatura).map((asignatura) => (
              <Card key={asignatura.nombre}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{asignatura.nombre}</span>
                    <Badge variant="outline">
                      {asignatura.notas.length} notas
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold">
                            Evaluación
                          </th>
                          <th className="text-left p-3 font-semibold">Tipo</th>
                          <th className="text-left p-3 font-semibold">Nota</th>
                          <th className="text-left p-3 font-semibold">
                            Porcentaje
                          </th>
                          <th className="text-left p-3 font-semibold">
                            Trimestre
                          </th>
                          <th className="text-left p-3 font-semibold">Mes</th>
                          <th className="text-left p-3 font-semibold">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asignatura.notas.map((nota) => (
                          <tr
                            key={nota.id_nota}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-3">{nota.evaluacion.nombre}</td>
                            <td className="p-3">
                              {nota.evaluacion.tipoEvaluacion.nombre}
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-lg">
                                {nota.calificacion.toFixed(1)}
                              </span>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">
                                {nota.evaluacion.tipoEvaluacion.porcentaje}%
                              </Badge>
                            </td>
                            <td className="p-3">
                              T{nota.evaluacion.trimestre}
                            </td>
                            <td className="p-3">Mes {nota.evaluacion.mes}</td>
                            <td className="p-3">
                              {new Date(nota.fecha_registro).toLocaleDateString(
                                'es-ES',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}

          {reporte.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Este alumno no tiene notas registradas en tus asignaturas para
                  el año {anio}.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Sección de Conductas */}
          {conductasResumen && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Registro de Conducta</span>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {conductasResumen.total} infracciones
                    </Badge>
                    <Badge variant="destructive">
                      {conductasResumen.detalles.reduce(
                        (sum, c) => sum + c.infraccion.puntos,
                        0
                      )}{' '}
                      puntos
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conductasResumen.detalles.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold">Fecha</th>
                          <th className="text-left p-3 font-semibold">
                            Categoría
                          </th>
                          <th className="text-left p-3 font-semibold">
                            Artículo
                          </th>
                          <th className="text-left p-3 font-semibold">
                            Descripción
                          </th>
                          <th className="text-left p-3 font-semibold">
                            Puntos
                          </th>
                          <th className="text-left p-3 font-semibold">
                            Observación
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {conductasResumen.detalles.map((conducta) => (
                          <tr
                            key={conducta.id_conducta}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-3">
                              {new Date(conducta.fecha).toLocaleDateString(
                                'es-ES',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )}
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  conducta.infraccion.categoria === 'MUY_GRAVE'
                                    ? 'destructive'
                                    : conducta.infraccion.categoria === 'GRAVE'
                                      ? 'destructive'
                                      : 'outline'
                                }
                              >
                                {conducta.infraccion.categoria}
                              </Badge>
                            </td>
                            <td className="p-3">
                              {conducta.infraccion.articulo}
                            </td>
                            <td className="p-3">
                              {conducta.infraccion.descripcion}
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-red-600">
                                {conducta.infraccion.puntos}
                              </span>
                            </td>
                            <td className="p-3">
                              {conducta.observacion || 'Sin observación'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 text-center text-green-600 bg-green-50 rounded-lg">
                    ✓ El alumno no tiene infracciones registradas
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
