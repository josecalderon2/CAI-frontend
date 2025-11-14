import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
  BookOpen,
  Calendar,
  TrendingUp,
  User,
} from 'lucide-react';
import type { Alumno } from '../../types';
import {
  reportesOrientadorService,
  type ReporteDetalladoAlumno,
} from '../../api/services/reportesOrientadorService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Props {
  alumnos: Alumno[];
  onVolver: () => void;
}

export function ReporteDetalladoAlumnoView({ alumnos, onVolver }: Props) {
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<string>('');
  const [anio, setAnio] = useState<string>('2025');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>('');
  const [reporte, setReporte] = useState<ReporteDetalladoAlumno | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular promedio general del periodo si no viene del backend o es inválido
  const calcularPromedioGeneral = (): number | null => {
    if (!reporte) return null;

    const asignaturasConPromedio = reporte.asignaturas.filter(
      (asig) => asig.promedio_periodo !== null && !isNaN(asig.promedio_periodo)
    );

    if (asignaturasConPromedio.length === 0) return null;

    const suma = asignaturasConPromedio.reduce(
      (total, asig) => total + (asig.promedio_periodo || 0),
      0
    );

    return suma / asignaturasConPromedio.length;
  };

  const promedioGeneralMostrar = (): string => {
    // Intentar usar el promedio del backend primero
    if (
      reporte?.promedio_general_periodo !== null &&
      reporte?.promedio_general_periodo !== undefined &&
      !isNaN(reporte.promedio_general_periodo)
    ) {
      return reporte.promedio_general_periodo.toFixed(2);
    }

    // Si no hay promedio del backend, calcular localmente
    const promedioCalculado = calcularPromedioGeneral();
    if (promedioCalculado !== null && !isNaN(promedioCalculado)) {
      return promedioCalculado.toFixed(2);
    }

    return 'N/A';
  };

  const cargarReporte = async () => {
    if (!alumnoSeleccionado) {
      setError('Debe seleccionar un alumno');
      return;
    }

    if (!periodoSeleccionado) {
      setError('Debe seleccionar un trimestre/periodo');
      return;
    }

    try {
      setCargando(true);
      setError(null);

      // Determinar si es trimestre o periodo basado en el reporte anterior
      const params: { anio?: string; trimestre?: number; periodo?: number } = {
        anio,
      };

      // Si el alumno ya tiene un reporte cargado, usar es_bachillerato
      // Si no, asumimos que el selector muestra el tipo correcto
      if (reporte?.curso.es_bachillerato) {
        params.periodo = parseInt(periodoSeleccionado);
      } else if (reporte && !reporte.curso.es_bachillerato) {
        params.trimestre = parseInt(periodoSeleccionado);
      } else {
        // Primera carga - intentar con trimestre por defecto (la mayoría son básica)
        params.trimestre = parseInt(periodoSeleccionado);
      }

      const data = await reportesOrientadorService.getReporteDetalladoAlumno(
        parseInt(alumnoSeleccionado),
        params
      );

      setReporte(data);
    } catch (err: any) {
      console.error('Error al cargar reporte:', err);

      // Si falló con trimestre, intentar con periodo
      if (err?.response?.status === 400 && !reporte) {
        try {
          const data =
            await reportesOrientadorService.getReporteDetalladoAlumno(
              parseInt(alumnoSeleccionado),
              { anio, periodo: parseInt(periodoSeleccionado) }
            );
          setReporte(data);
          return;
        } catch (secondErr) {
          console.error('Error en segundo intento:', secondErr);
        }
      }

      setError(
        'Error al cargar el reporte del alumno. Por favor, intenta de nuevo.'
      );
    } finally {
      setCargando(false);
    }
  };

  const exportarPDF = () => {
    if (!reporte) return;

    const doc = new jsPDF();

    // Encabezado
    doc.setFontSize(18);
    doc.text('REPORTE DETALLADO DEL ALUMNO', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(
      `${reporte.periodo_academico.nombre} - ${reporte.periodo_academico.anio}`,
      105,
      22,
      {
        align: 'center',
      }
    );

    // Información del alumno
    doc.setFontSize(12);
    doc.text('Información del Alumno', 14, 32);
    doc.setFontSize(10);
    doc.text(
      `Nombre: ${reporte.alumno.nombre} ${reporte.alumno.apellido}`,
      14,
      38
    );
    doc.text(`Matrícula: ${reporte.alumno.numeroMatricula}`, 14, 44);
    doc.text(`Curso: ${reporte.curso.nombre}`, 14, 50);

    let currentY = 60;

    // Asignaturas y evaluaciones
    reporte.asignaturas.forEach((asignatura) => {
      doc.setFontSize(12);
      doc.text(asignatura.nombre, 14, currentY);
      currentY += 6;
      doc.setFontSize(9);
      doc.text(`Orientador: ${asignatura.orientador || 'N/A'}`, 14, currentY);
      currentY += 4;

      const evaluacionesData = asignatura.evaluaciones.map((evaluacion) => [
        evaluacion.nombre,
        evaluacion.tipo,
        `${evaluacion.porcentaje}%`,
        evaluacion.nota !== null ? evaluacion.nota.toFixed(1) : 'Pendiente',
        evaluacion.fecha_registro
          ? new Date(evaluacion.fecha_registro).toLocaleDateString()
          : '-',
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Evaluación', 'Tipo', '%', 'Nota', 'Fecha']],
        body: evaluacionesData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
        styles: { fontSize: 7 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 4;
      doc.setFontSize(10);
      doc.text(
        `Promedio: ${asignatura.promedio_periodo?.toFixed(2) || 'N/A'}`,
        14,
        currentY
      );
      currentY += 8;

      // Nueva página si es necesario
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
    });

    // Promedio general
    doc.setFontSize(12);
    doc.text(
      `Promedio General del ${reporte.periodo_academico.nombre}: ${promedioGeneralMostrar()}`,
      14,
      currentY
    );

    doc.save(
      `reporte_${reporte.alumno.numeroMatricula}_${reporte.alumno.nombre}_${reporte.alumno.apellido}_${reporte.periodo_academico.nombre}.pdf`
    );
  };

  const exportarExcel = () => {
    if (!reporte) return;

    const worksheetData = [
      ['REPORTE DETALLADO DEL ALUMNO'],
      [
        `${reporte.periodo_academico.nombre} - ${reporte.periodo_academico.anio}`,
      ],
      [],
      ['INFORMACIÓN DEL ALUMNO'],
      ['Nombre:', `${reporte.alumno.nombre} ${reporte.alumno.apellido}`],
      ['Matrícula:', reporte.alumno.numeroMatricula],
      ['Curso:', reporte.curso.nombre],
      [],
    ];

    reporte.asignaturas.forEach((asignatura) => {
      worksheetData.push(
        [`ASIGNATURA: ${asignatura.nombre}`],
        [`Orientador: ${asignatura.orientador || 'N/A'}`],
        [],
        ['Evaluación', 'Tipo', 'Porcentaje', 'Nota', 'Fecha'],
        ...asignatura.evaluaciones.map((evaluacion) => [
          evaluacion.nombre,
          evaluacion.tipo,
          evaluacion.porcentaje.toString(),
          evaluacion.nota !== null ? evaluacion.nota.toString() : 'Pendiente',
          evaluacion.fecha_registro
            ? new Date(evaluacion.fecha_registro).toLocaleDateString()
            : '-',
        ]),
        [],
        [
          'Promedio de la asignatura:',
          asignatura.promedio_periodo?.toString() || 'N/A',
        ],
        []
      );
    });

    worksheetData.push(
      [],
      ['PROMEDIO GENERAL DEL PERIODO:', promedioGeneralMostrar()],
      [],
      ['ASISTENCIA'],
      ['Total registros:', reporte.asistencia.total_registros.toString()],
      ['Presentes:', reporte.asistencia.presentes.toString()],
      ['Ausentes:', reporte.asistencia.ausentes.toString()],
      ['Tardanzas:', reporte.asistencia.tardanzas.toString()],
      ['Porcentaje:', `${reporte.asistencia.porcentaje_asistencia || 0}%`],
      [],
      ['CONDUCTA'],
      ['Total infracciones:', reporte.conductas.total.toString()],
      ['Puntos acumulados:', reporte.conductas.puntos_acumulados.toString()]
    );

    if (reporte.conductas.detalles.length > 0) {
      worksheetData.push(
        [],
        [
          'Fecha',
          'Categoría',
          'Artículo',
          'Descripción',
          'Puntos',
          'Observación',
        ],
        ...reporte.conductas.detalles.map((c) => [
          new Date(c.fecha).toLocaleDateString(),
          c.infraccion.categoria,
          c.infraccion.articulo,
          c.infraccion.descripcion,
          c.infraccion.puntos.toString(),
          c.observacion,
        ])
      );
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
    XLSX.writeFile(
      workbook,
      `reporte_${reporte.alumno.numeroMatricula}_${reporte.alumno.nombre}_${reporte.alumno.apellido}_${reporte.periodo_academico.nombre}.xlsx`
    );
  };

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
              Reporte Detallado del Alumno
            </h2>
            <p className="text-gray-600 mt-1">
              Consulta todas las evaluaciones del trimestre/periodo
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
              <label className="text-sm font-medium mb-2 block">Alumno</label>
              <Select
                value={alumnoSeleccionado}
                onValueChange={(value) => {
                  setAlumnoSeleccionado(value);
                  setReporte(null); // Reset reporte cuando cambia alumno
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un alumno" />
                </SelectTrigger>
                <SelectContent>
                  {alumnos.map((alumno) => (
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

            <div className="md:col-span-3">
              <label className="text-sm font-medium mb-2 block">
                {reporte?.curso.es_bachillerato ? 'Periodo' : 'Trimestre'}
              </label>
              <Select
                value={periodoSeleccionado}
                onValueChange={setPeriodoSeleccionado}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={`Selecciona ${reporte?.curso.es_bachillerato ? 'periodo' : 'trimestre'}`}
                  />
                </SelectTrigger>
                <SelectContent>
                  {reporte?.curso.es_bachillerato ? (
                    <>
                      <SelectItem value="1">Periodo 1</SelectItem>
                      <SelectItem value="2">Periodo 2</SelectItem>
                      <SelectItem value="3">Periodo 3</SelectItem>
                      <SelectItem value="4">Periodo 4</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="1">Trimestre 1</SelectItem>
                      <SelectItem value="2">Trimestre 2</SelectItem>
                      <SelectItem value="3">Trimestre 3</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <Button
                onClick={cargarReporte}
                className="w-full"
                disabled={cargando}
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
          {/* Botones de exportación */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={exportarPDF}>
              <Download className="w-4 h-4 mr-2" />
              Exportar a PDF
            </Button>
            <Button variant="outline" onClick={exportarExcel}>
              <Download className="w-4 h-4 mr-2" />
              Exportar a Excel
            </Button>
          </div>

          {/* Información del Alumno */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Información del Alumno</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre Completo</p>
                  <p className="font-semibold">
                    {reporte.alumno.nombre} {reporte.alumno.apellido}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Número de Matrícula</p>
                  <p className="font-semibold">
                    {reporte.alumno.numeroMatricula}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Curso</p>
                  <p className="font-semibold">{reporte.curso.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Periodo Académico</p>
                  <p className="font-semibold">
                    {reporte.periodo_academico.nombre} -{' '}
                    {reporte.periodo_academico.anio}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Promedio General */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <span className="font-semibold text-lg">
                    Promedio General del {reporte.periodo_academico.nombre}:
                  </span>
                </div>
                <span className="font-bold text-3xl text-blue-600">
                  {promedioGeneralMostrar()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Asignaturas con evaluaciones */}
          {reporte.asignaturas.map((asignatura) => (
            <Card key={asignatura.id_asignatura}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5" />
                    <span>{asignatura.nombre}</span>
                  </div>
                  <Badge variant="outline" className="text-blue-600">
                    Promedio: {asignatura.promedio_periodo?.toFixed(2) || 'N/A'}
                  </Badge>
                </CardTitle>
                {asignatura.orientador && (
                  <p className="text-sm text-gray-600">
                    Orientador: {asignatura.orientador}
                  </p>
                )}
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
                        <th className="text-left p-3 font-semibold">
                          Porcentaje
                        </th>
                        <th className="text-left p-3 font-semibold">Nota</th>
                        <th className="text-left p-3 font-semibold">Fecha</th>
                        <th className="text-left p-3 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asignatura.evaluaciones.map((evaluacion) => (
                        <tr
                          key={evaluacion.id_evaluacion}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3">{evaluacion.nombre}</td>
                          <td className="p-3">
                            <Badge variant="outline">{evaluacion.tipo}</Badge>
                          </td>
                          <td className="p-3">{evaluacion.porcentaje}%</td>
                          <td className="p-3">
                            {evaluacion.nota !== null ? (
                              <span
                                className={`font-semibold text-lg ${
                                  evaluacion.nota >= 6.0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {evaluacion.nota.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-gray-400">Pendiente</span>
                            )}
                          </td>
                          <td className="p-3 text-sm">
                            {evaluacion.fecha_registro
                              ? new Date(
                                  evaluacion.fecha_registro
                                ).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '-'}
                          </td>
                          <td className="p-3">
                            {evaluacion.nota !== null ? (
                              <Badge
                                className={
                                  evaluacion.nota >= 6.0
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                {evaluacion.nota >= 6.0
                                  ? 'Aprobado'
                                  : 'Reprobado'}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-orange-600"
                              >
                                Pendiente
                              </Badge>
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

          {/* Asistencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Resumen de Asistencia (Año Completo)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Registros</p>
                  <p className="font-bold text-2xl">
                    {reporte.asistencia.total_registros}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Presentes</p>
                  <p className="font-bold text-2xl text-green-600">
                    {reporte.asistencia.presentes}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Ausentes</p>
                  <p className="font-bold text-2xl text-red-600">
                    {reporte.asistencia.ausentes}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Tardanzas</p>
                  <p className="font-bold text-2xl text-yellow-600">
                    {reporte.asistencia.tardanzas}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Porcentaje</p>
                  <p className="font-bold text-2xl text-blue-600">
                    {reporte.asistencia.porcentaje_asistencia?.toFixed(1) ||
                      '0.0'}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conducta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Registro de Conducta</span>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-red-600">
                    {reporte.conductas.total} infracciones
                  </Badge>
                  <Badge variant="outline" className="text-orange-600">
                    {reporte.conductas.puntos_acumulados} puntos
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reporte.conductas.detalles.length > 0 ? (
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
                        <th className="text-left p-3 font-semibold">Puntos</th>
                        <th className="text-left p-3 font-semibold">
                          Observación
                        </th>
                        <th className="text-left p-3 font-semibold">
                          Orientador
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.conductas.detalles.map((conducta) => (
                        <tr
                          key={conducta.id_conducta}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3 text-sm">
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
                              className={
                                conducta.infraccion.categoria === 'MUY_GRAVE'
                                  ? 'bg-red-600 text-white'
                                  : conducta.infraccion.categoria === 'GRAVE'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {conducta.infraccion.categoria.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">
                            {conducta.infraccion.articulo}
                          </td>
                          <td className="p-3 text-sm">
                            {conducta.infraccion.descripcion}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-red-600">
                              {conducta.infraccion.puntos} pts
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">
                            {conducta.observacion}
                          </td>
                          <td className="p-3 text-sm">
                            {conducta.orientador || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-green-50 rounded-lg">
                  <p className="text-green-800 font-medium">
                    ✓ El alumno no tiene registros de conducta en este periodo
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
