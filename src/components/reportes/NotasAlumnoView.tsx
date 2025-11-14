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
} from 'lucide-react';
import type { Alumno } from '../../types';
import {
  reportesOrientadorService,
  type ReporteNotasAlumno,
} from '../../api/services/reportesOrientadorService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Props {
  alumnos: Alumno[];
  onVolver: () => void;
}

export function NotasAlumnoView({ alumnos, onVolver }: Props) {
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<string>('');
  const [anio, setAnio] = useState<string>('2025');
  const [reporte, setReporte] = useState<ReporteNotasAlumno | null>(null);
  const [alumnoInfo, setAlumnoInfo] = useState<{
    nombre: string;
    apellido: string;
  } | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarReporte = async () => {
    if (!alumnoSeleccionado) {
      setError('Debe seleccionar un alumno');
      return;
    }

    try {
      setCargando(true);
      setError(null);
      const data = await reportesOrientadorService.getNotasAlumno(
        parseInt(alumnoSeleccionado),
        parseInt(anio)
      );

      // ReporteNotasAlumno es un array directo
      if (!Array.isArray(data)) {
        throw new Error('Formato de respuesta inválido');
      }

      setReporte(data);

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
      nota.asignatura.nombre,
      nota.evaluacion.nombre,
      nota.evaluacion.tipoEvaluacion.nombre,
      nota.calificacion.toFixed(1),
      `${nota.evaluacion.tipoEvaluacion.porcentaje}%`,
      `T${nota.evaluacion.trimestre || 'N/A'}`,
      new Date(nota.fecha_registro).toLocaleDateString(),
    ]);

    autoTable(doc, {
      startY: 40,
      head: [
        ['Asignatura', 'Evaluación', 'Tipo', 'Nota', '%', 'Trim.', 'Fecha'],
      ],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
    });

    doc.save(`notas_${alumnoInfo.nombre}_${alumnoInfo.apellido}_${anio}.pdf`);
  };

  const exportarExcel = () => {
    if (!reporte || reporte.length === 0 || !alumnoInfo) return;

    const worksheetData = [
      ['Historial de Notas del Alumno'],
      [],
      ['Alumno:', `${alumnoInfo.nombre} ${alumnoInfo.apellido}`],
      ['Año Académico:', anio],
      ['Total de Notas:', reporte.length],
      [],
      [
        'Asignatura',
        'Evaluación',
        'Tipo',
        'Nota',
        'Porcentaje',
        'Trimestre',
        'Mes',
        'Fecha',
      ],
      ...reporte.map((nota) => [
        nota.asignatura.nombre,
        nota.evaluacion.nombre,
        nota.evaluacion.tipoEvaluacion.nombre,
        nota.calificacion,
        nota.evaluacion.tipoEvaluacion.porcentaje,
        `T${nota.evaluacion.trimestre || 'N/A'}`,
        `Mes ${nota.evaluacion.mes || 'N/A'}`,
        new Date(nota.fecha_registro).toLocaleDateString(),
      ]),
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
              Consulta todas las notas de un alumno en tus asignaturas
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
            <div className="md:col-span-5">
              <label className="text-sm font-medium mb-2 block">Alumno</label>
              <Select
                value={alumnoSeleccionado}
                onValueChange={setAlumnoSeleccionado}
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

            <div className="md:col-span-4">
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
          {/* Resumen */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Resumen del Reporte</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportarPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={exportarExcel}>
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
        </>
      )}
    </div>
  );
}
