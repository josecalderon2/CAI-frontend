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
  Eye,
} from 'lucide-react';
import type { Asignatura } from '../../api/services/asignaturasService';
import {
  reportesOrientadorService,
  type ReporteEvaluacionesAsignatura,
} from '../../api/services/reportesOrientadorService';
import { CalificacionesEvaluacionView } from './CalificacionesEvaluacionView.tsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Props {
  asignaturas: Asignatura[];
  onVolver: () => void;
}

export function EvaluacionesPorAsignaturaView({
  asignaturas,
  onVolver,
}: Props) {
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] =
    useState<string>('');
  const [anio, setAnio] = useState<string>('2025');
  const [reporte, setReporte] = useState<ReporteEvaluacionesAsignatura | null>(
    null
  );
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vistaCalificaciones, setVistaCalificaciones] = useState(false);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<
    number | null
  >(null);

  const cargarReporte = async () => {
    if (!asignaturaSeleccionada) {
      setError('Debe seleccionar una asignatura');
      return;
    }

    try {
      setCargando(true);
      setError(null);
      console.log('🔄 Cargando evaluaciones para:', {
        asignatura: asignaturaSeleccionada,
        anio,
      });
      const data = await reportesOrientadorService.getEvaluacionesByAsignatura(
        parseInt(asignaturaSeleccionada),
        parseInt(anio)
      );

      console.log('📊 Data recibida:', data);
      console.log('📋 Estructura data:', {
        keys: Object.keys(data),
        distribucionPorcentajes: data.distribucionPorcentajes,
        distribucionLength: data.distribucionPorcentajes?.length,
        totalPorcentaje: data.totalPorcentaje,
      });

      // Validar que la respuesta tenga la estructura esperada
      if (!data || typeof data !== 'object') {
        throw new Error('Respuesta inválida del servidor');
      }

      // Asegurar que distribucionPorcentajes sea siempre un array
      const reporteValidado = {
        ...data,
        distribucionPorcentajes: Array.isArray(data.distribucionPorcentajes)
          ? data.distribucionPorcentajes
          : [],
      };

      console.log('✅ Reporte validado:', reporteValidado);
      setReporte(reporteValidado);
    } catch (err) {
      console.error('❌ Error al cargar reporte:', err);
      setError(
        'Error al cargar las evaluaciones. Por favor, intenta de nuevo.'
      );
    } finally {
      setCargando(false);
    }
  };

  const verCalificaciones = (idEvaluacion: number) => {
    setEvaluacionSeleccionada(idEvaluacion);
    setVistaCalificaciones(true);
  };

  const volverAEvaluaciones = () => {
    setVistaCalificaciones(false);
    setEvaluacionSeleccionada(null);
  };

  const exportarPDF = () => {
    if (!reporte || !reporte.distribucionPorcentajes) return;

    const doc = new jsPDF();

    // Encabezado
    doc.setFontSize(16);
    doc.text('Reporte de Evaluaciones', 14, 15);
    doc.setFontSize(10);
    doc.text(`Año Académico: ${reporte.anio_academico}`, 14, 22);
    doc.text(`Total: ${reporte.totalPorcentaje}%`, 14, 28);

    let startY = 35;

    // Tabla por cada tipo de evaluación
    reporte.distribucionPorcentajes.forEach((grupo) => {
      doc.setFontSize(12);
      doc.text(
        `${grupo.tipo} - ${grupo.porcentajeBase}% (${grupo.cantidad} evaluaciones)`,
        14,
        startY
      );

      const tableData = grupo.evaluaciones.map((ev) => [
        ev.nombre,
        `${grupo.porcentajeCadaUna.toFixed(2)}%`,
      ]);

      autoTable(doc, {
        startY: startY + 5,
        head: [['Evaluación', 'Porcentaje']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      startY = (doc as any).lastAutoTable.finalY + 10;
    });

    doc.save(`evaluaciones_asignatura_${anio}.pdf`);
  };

  const exportarExcel = () => {
    if (!reporte || !reporte.distribucionPorcentajes) return;

    const worksheetData: any[] = [
      ['Reporte de Evaluaciones'],
      [],
      ['Año Académico:', reporte.anio_academico],
      ['Total Porcentaje:', `${reporte.totalPorcentaje}%`],
      [],
    ];

    // Agregar cada tipo de evaluación
    reporte.distribucionPorcentajes.forEach((grupo) => {
      worksheetData.push([
        `${grupo.tipo} - ${grupo.porcentajeBase}% (${grupo.cantidad} evaluaciones)`,
      ]);
      worksheetData.push(['Evaluación', 'Porcentaje Individual']);
      grupo.evaluaciones.forEach((ev) => {
        worksheetData.push([
          ev.nombre,
          `${grupo.porcentajeCadaUna.toFixed(2)}%`,
        ]);
      });
      worksheetData.push([]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Evaluaciones');
    XLSX.writeFile(workbook, `evaluaciones_asignatura_${anio}.xlsx`);
  };

  if (vistaCalificaciones && evaluacionSeleccionada) {
    return (
      <CalificacionesEvaluacionView
        idEvaluacion={evaluacionSeleccionada}
        onVolver={volverAEvaluaciones}
      />
    );
  }

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
              Evaluaciones por Asignatura
            </h2>
            <p className="text-gray-600 mt-1">
              Consulta las evaluaciones creadas en tus asignaturas
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
              <label className="text-sm font-medium mb-2 block">
                Asignatura
              </label>
              <Select
                value={asignaturaSeleccionada}
                onValueChange={setAsignaturaSeleccionada}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una asignatura" />
                </SelectTrigger>
                <SelectContent>
                  {asignaturas.map((asignatura) => (
                    <SelectItem
                      key={asignatura.id_asignatura}
                      value={asignatura.id_asignatura.toString()}
                    >
                      {asignatura.nombre} - {asignatura.curso?.nombre}
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
                  <p className="text-sm text-gray-600">Año Académico</p>
                  <p className="font-semibold">{reporte.anio_academico}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipos de Evaluación</p>
                  <p className="font-semibold text-blue-600">
                    {reporte.distribucionPorcentajes.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Porcentaje</p>
                  <p className="font-semibold text-green-600">
                    {reporte.totalPorcentaje}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distribución por Tipo de Evaluación */}
          {reporte.distribucionPorcentajes &&
          reporte.distribucionPorcentajes.length > 0 ? (
            reporte.distribucionPorcentajes.map((grupo, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {grupo.tipo}
                      <Badge variant="outline" className="ml-3">
                        {grupo.porcentajeBase}%
                      </Badge>
                    </span>
                    <span className="text-sm font-normal text-gray-600">
                      {grupo.cantidad} evaluaciones -{' '}
                      {grupo.porcentajeCadaUna.toFixed(2)}% cada una
                    </span>
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
                          <th className="text-left p-3 font-semibold">
                            Porcentaje
                          </th>
                          <th className="text-left p-3 font-semibold">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.evaluaciones.map((evaluacion) => (
                          <tr
                            key={evaluacion.id_evaluacion}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-3">{evaluacion.nombre}</td>
                            <td className="p-3">
                              <Badge variant="outline">
                                {grupo.porcentajeCadaUna.toFixed(2)}%
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  verCalificaciones(evaluacion.id_evaluacion)
                                }
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Calificaciones
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>
                  No hay evaluaciones registradas para esta asignatura en el año{' '}
                  {anio}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
