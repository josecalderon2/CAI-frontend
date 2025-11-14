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
  CheckCircle,
  Loader2,
  AlertCircle,
  ClipboardList,
  UserX,
} from 'lucide-react';
import type { Evaluacion } from '../../api/services/evaluacionesService';
import {
  reportesAdminService,
  type EvaluacionPendientes,
} from '../../api/services/reportesAdminService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Props {
  evaluaciones: Evaluacion[];
  onVolver: () => void;
}

export function PendientesEvaluacionView({ evaluaciones, onVolver }: Props) {
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] =
    useState<string>('');
  const [reporte, setReporte] = useState<EvaluacionPendientes | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('✅ PendientesEvaluacionView - Estado:', {
    evaluaciones: evaluaciones.length,
    evaluacionSeleccionada,
    tieneReporte: !!reporte,
    reporte,
    cargando,
    error,
  });

  const cargarReporte = async () => {
    console.log('🚀 Iniciando carga de pendientes...', {
      evaluacionSeleccionada,
    });

    if (!evaluacionSeleccionada) {
      console.error('❌ No hay evaluación seleccionada');
      setError('Debe seleccionar una evaluación');
      return;
    }

    try {
      setCargando(true);
      setError(null);

      console.log('📡 Llamando al servicio con:', {
        evaluacionId: parseInt(evaluacionSeleccionada),
      });

      const data = await reportesAdminService.getPendientesEvaluacion(
        parseInt(evaluacionSeleccionada)
      );

      console.log('✅ Datos recibidos del servicio:', {
        evaluacion: data.evaluacion,
        total_alumnos: data.total_alumnos,
        registrados: data.registrados,
        pendientes: data.pendientes.length,
        datosCompletos: data,
      });

      setReporte(data);
    } catch (err) {
      console.error('❌ Error al cargar pendientes:', err);
      console.error('📋 Detalles del error:', {
        message: err instanceof Error ? err.message : 'Error desconocido',
        response: (err as any)?.response?.data,
        status: (err as any)?.response?.status,
      });
      setError(
        'Error al cargar los alumnos pendientes. Por favor, intenta de nuevo.'
      );
    } finally {
      setCargando(false);
      console.log('🏁 Carga finalizada');
    }
  };

  const exportarPDF = () => {
    if (!reporte) return;

    const doc = new jsPDF();

    const porcentaje = (reporte.registrados / reporte.total_alumnos) * 100;

    // Encabezado
    doc.setFontSize(16);
    doc.text('Reporte de Evaluaciones Pendientes', 14, 15);
    doc.setFontSize(11);
    doc.text(`Evaluación: ${reporte.evaluacion.nombre}`, 14, 22);
    doc.text(
      `Progreso: ${reporte.registrados}/${reporte.total_alumnos} (${porcentaje.toFixed(1)}%)`,
      14,
      28
    );

    if (reporte.pendientes.length > 0) {
      // Tabla de pendientes
      const tableData = reporte.pendientes.map((alumno) => [
        `${alumno.nombre} ${alumno.apellido}`,
        'Sin calificación',
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['Alumno', 'Estado']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [244, 63, 94] },
        styles: { fontSize: 10 },
      });
    } else {
      doc.text('✅ Todos los alumnos tienen calificación registrada', 14, 35);
    }

    doc.save(
      `pendientes_${reporte.evaluacion.nombre.replace(/\s+/g, '_')}.pdf`
    );
  };

  const exportarExcel = () => {
    if (!reporte) return;

    const porcentaje = (reporte.registrados / reporte.total_alumnos) * 100;

    const worksheetData = [
      ['Reporte de Evaluaciones Pendientes'],
      [],
      ['Evaluación:', reporte.evaluacion.nombre],
      ['Total Alumnos:', reporte.total_alumnos],
      ['Notas Registradas:', reporte.registrados],
      ['Pendientes:', reporte.pendientes.length],
      ['Progreso:', `${porcentaje.toFixed(1)}%`],
      [],
      ['Alumnos Pendientes'],
      ['Nombre', 'Apellido'],
      ...reporte.pendientes.map((alumno) => [alumno.nombre, alumno.apellido]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pendientes');
    XLSX.writeFile(
      workbook,
      `pendientes_${reporte.evaluacion.nombre.replace(/\s+/g, '_')}.xlsx`
    );
  };

  const getEstadoBadge = () => {
    if (!reporte) return null;
    const porcentaje = (reporte.registrados / reporte.total_alumnos) * 100;

    if (porcentaje === 100) {
      return (
        <Badge className="bg-green-100 text-green-800 text-base px-3 py-1">
          🟢 Completo
        </Badge>
      );
    } else if (porcentaje >= 80) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 text-base px-3 py-1">
          🟡 Casi Completo
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 text-base px-3 py-1">
          🔴 Pendiente
        </Badge>
      );
    }
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
              Alumnos con Evaluaciones Pendientes
            </h2>
            <p className="text-gray-600 mt-1">
              Supervisa el progreso de registro de calificaciones
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Evaluación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Evaluación
              </label>
              <Select
                value={evaluacionSeleccionada}
                onValueChange={setEvaluacionSeleccionada}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una evaluación" />
                </SelectTrigger>
                <SelectContent>
                  {evaluaciones.map((evaluacion) => (
                    <SelectItem
                      key={evaluacion.id_evaluacion}
                      value={evaluacion.id_evaluacion.toString()}
                    >
                      {evaluacion.nombre} - {evaluacion.asignatura.nombre}{' '}
                      {evaluacion.trimestre && `(T${evaluacion.trimestre})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col md:items-end md:justify-start">
              <label className="text-sm font-medium mb-2 block invisible select-none">Acción</label>
              <Button
                onClick={cargarReporte}
                className="w-full md:w-auto min-w-[180px] bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Consultar
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

      {/* Mensaje inicial */}
      {!reporte && !error && !cargando && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="p-8 text-center">
            <ClipboardList className="w-16 h-16 text-rose-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-rose-900 mb-2">
              Supervisa las Evaluaciones Pendientes
            </h3>
            <p className="text-rose-700 mb-4">
              Selecciona una evaluación para ver qué alumnos aún no tienen
              calificación registrada.
            </p>
            <p className="text-sm text-rose-600">
              ✅ Podrás ver el progreso de registro y la lista de alumnos
              pendientes.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resultado */}
      {reporte && (
        <>
          {/* Resumen */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Estado de la Evaluación</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportarPDF}
                  className="border-rose-600 text-rose-600 hover:bg-rose-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportarExcel}
                  className="border-rose-600 text-rose-600 hover:bg-rose-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Evaluación</p>
                    <p className="font-semibold text-lg">
                      {reporte.evaluacion.nombre}
                    </p>
                  </div>
                  <div className="flex items-center justify-end">
                    {getEstadoBadge()}
                  </div>
                </div>

                {/* Barra de Progreso */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      Progreso de Registro
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {reporte.registrados}/{reporte.total_alumnos} (
                      {(
                        (reporte.registrados / reporte.total_alumnos) *
                        100
                      ).toFixed(1)}
                      %)
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-rose-600 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold transition-all duration-500"
                      style={{
                        width: `${(reporte.registrados / reporte.total_alumnos) * 100}%`,
                      }}
                    >
                      {(
                        (reporte.registrados / reporte.total_alumnos) *
                        100
                      ).toFixed(0)}
                      %
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Alumnos</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {reporte.total_alumnos}
                    </p>
                  </div>
                  <ClipboardList className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Notas Registradas
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {reporte.registrados}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-rose-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Pendientes</p>
                    <p className="text-3xl font-bold text-rose-600">
                      {reporte.pendientes.length}
                    </p>
                  </div>
                  <UserX className="w-8 h-8 text-rose-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Pendientes */}
          {reporte.pendientes.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserX className="w-5 h-5 text-rose-600" />
                  <span>
                    Alumnos sin Calificación ({reporte.pendientes.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {reporte.pendientes.map((alumno) => (
                    <Card
                      key={alumno.id_alumno}
                      className="border-l-4 border-l-rose-500"
                    >
                      <CardContent className="p-3">
                        <p className="font-semibold text-gray-900">
                          {alumno.nombre} {alumno.apellido}
                        </p>
                        <Badge
                          variant="outline"
                          className="mt-1 text-rose-600 border-rose-600"
                        >
                          Sin calificación
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-900 mb-2">
                  ¡Evaluación Completa!
                </h3>
                <p className="text-green-700">
                  Todos los alumnos tienen su calificación registrada para esta
                  evaluación.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
