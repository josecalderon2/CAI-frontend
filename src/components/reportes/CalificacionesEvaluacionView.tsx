import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, Download, Loader2, AlertCircle } from 'lucide-react';
import {
  reportesOrientadorService,
  type ReporteCalificacionesEvaluacion,
} from '../../api/services/reportesOrientadorService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Props {
  idEvaluacion: number;
  onVolver: () => void;
}

export function CalificacionesEvaluacionView({
  idEvaluacion,
  onVolver,
}: Props) {
  const [reporte, setReporte] =
    useState<ReporteCalificacionesEvaluacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarReporte();
  }, [idEvaluacion]);

  const cargarReporte = async () => {
    try {
      setCargando(true);
      setError(null);
      console.log('🔄 Cargando calificaciones para evaluación:', idEvaluacion);
      const data =
        await reportesOrientadorService.getCalificacionesEvaluacion(
          idEvaluacion
        );

      console.log('📊 Data recibida calificaciones:', data);
      console.log('📋 Estructura data:', {
        keys: Object.keys(data),
        alumnos: data.alumnos,
        alumnosLength: data.alumnos?.length,
        alumnosIsArray: Array.isArray(data.alumnos),
      });

      // Validar y normalizar la respuesta
      const reporteValidado = {
        ...data,
        alumnos: Array.isArray(data.alumnos) ? data.alumnos : [],
        total_alumnos: data.total_alumnos || 0,
        alumnos_calificados: data.alumnos_calificados || 0,
      };

      console.log('✅ Reporte validado calificaciones:', reporteValidado);
      setReporte(reporteValidado);
    } catch (err) {
      console.error('❌ Error al cargar calificaciones:', err);
      setError(
        'Error al cargar las calificaciones. Por favor, intenta de nuevo.'
      );
    } finally {
      setCargando(false);
    }
  };

  const exportarPDF = () => {
    if (!reporte || !reporte.alumnos) return;

    const doc = new jsPDF();

    // Encabezado
    doc.setFontSize(16);
    doc.text('Calificaciones de Evaluación', 14, 15);
    doc.setFontSize(10);
    const asignaturaText =
      typeof reporte.asignatura === 'string'
        ? reporte.asignatura
        : reporte.asignatura?.nombre || 'N/A';
    const cursoText =
      typeof reporte.curso === 'string'
        ? reporte.curso
        : reporte.curso?.nombre
          ? `${reporte.curso.nombre}${reporte.curso.seccion ? ` - ${reporte.curso.seccion}` : ''}`
          : 'N/A';
    doc.text(`Evaluación: ${reporte.nombre_evaluacion}`, 14, 22);
    doc.text(`Asignatura: ${asignaturaText}`, 14, 28);
    doc.text(`Curso: ${cursoText}`, 14, 34);
    doc.text(`Total Alumnos: ${reporte.total_alumnos}`, 14, 40);
    const alumnosSinCalificar =
      reporte.total_alumnos - reporte.alumnos_calificados;
    doc.text(
      `Con Nota: ${reporte.alumnos_calificados} | Sin Nota: ${alumnosSinCalificar}`,
      14,
      46
    );

    // Tabla de calificaciones
    const tableData = reporte.alumnos.map((alumno) => [
      `${alumno.nombre} ${alumno.apellido}`,
      alumno.calificacion ? alumno.calificacion.toFixed(1) : 'Sin nota',
      alumno.tiene_calificacion ? 'Calificado' : 'Pendiente',
    ]);

    autoTable(doc, {
      startY: 52,
      head: [['Alumno', 'Calificación', 'Estado']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`calificaciones_${reporte.nombre_evaluacion}.pdf`);
  };

  const exportarExcel = () => {
    if (!reporte || !reporte.alumnos) return;

    const asignaturaText =
      typeof reporte.asignatura === 'string'
        ? reporte.asignatura
        : reporte.asignatura?.nombre || 'N/A';
    const cursoText =
      typeof reporte.curso === 'string'
        ? reporte.curso
        : reporte.curso?.nombre
          ? `${reporte.curso.nombre}${reporte.curso.seccion ? ` - ${reporte.curso.seccion}` : ''}`
          : 'N/A';

    const worksheetData = [
      ['Calificaciones de Evaluación'],
      [],
      ['Evaluación:', reporte.nombre_evaluacion],
      ['Asignatura:', asignaturaText],
      ['Curso:', cursoText],
      ['Total Alumnos:', reporte.total_alumnos],
      ['Con Nota:', reporte.alumnos_calificados],
      ['Sin Nota:', reporte.total_alumnos - reporte.alumnos_calificados],
      [],
      ['Alumno', 'Calificación', 'Estado'],
      ...reporte.alumnos.map((alumno) => [
        `${alumno.nombre} ${alumno.apellido}`,
        alumno.calificacion || 'Sin nota',
        alumno.tiene_calificacion ? 'Calificado' : 'Pendiente',
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Calificaciones');
    XLSX.writeFile(
      workbook,
      `calificaciones_${reporte.nombre_evaluacion}.xlsx`
    );
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando calificaciones...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={onVolver}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reporte) return null;

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
              Calificaciones de Evaluación
            </h2>
            <p className="text-gray-600 mt-1">{reporte.nombre_evaluacion}</p>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Información de la Evaluación</CardTitle>
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-600">Asignatura</p>
              <p className="font-semibold">{reporte.asignatura.nombre}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Curso</p>
              <p className="font-semibold">
                {reporte.curso.nombre}
                {reporte.curso.seccion ? ` - ${reporte.curso.seccion}` : ''}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Alumnos</p>
              <p className="font-semibold text-blue-600">
                {reporte.total_alumnos}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Con Nota</p>
              <p className="font-semibold text-green-600">
                {reporte.alumnos_calificados}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sin Nota</p>
              <p className="font-semibold text-orange-600">
                {reporte.total_alumnos - reporte.alumnos_calificados}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Calificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Calificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Alumno</th>
                  <th className="text-left p-3 font-semibold">Nota</th>
                  <th className="text-left p-3 font-semibold">
                    Fecha Registro
                  </th>
                  <th className="text-left p-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {reporte.alumnos.map((alumno) => (
                  <tr
                    key={alumno.id_alumno}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-3">
                      {alumno.nombre} {alumno.apellido}
                    </td>
                    <td className="p-3">
                      {alumno.tiene_calificacion ? (
                        <span className="font-semibold text-lg">
                          {alumno.calificacion?.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-400">Sin nota</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={
                          alumno.genero === 'M'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-pink-50 text-pink-700'
                        }
                      >
                        {alumno.genero === 'M' ? 'Masculino' : 'Femenino'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {alumno.tiene_calificacion ? (
                        <Badge className="bg-green-100 text-green-800">
                          Calificado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600">
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
    </div>
  );
}
