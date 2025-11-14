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
  BarChart3,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { Asignatura } from '../../api/services/asignaturasService';
import {
  reportesAdminService,
  type DistribucionNotas,
} from '../../api/services/reportesAdminService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Props {
  asignaturas: Asignatura[];
  onVolver: () => void;
}

export function DistribucionAsignaturaView({ asignaturas, onVolver }: Props) {
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] =
    useState<string>('');
  const [anio, setAnio] = useState<string>('2025');
  const [distribucion, setDistribucion] = useState<DistribucionNotas | null>(
    null
  );
  const [asignaturaInfo, setAsignaturaInfo] = useState<{
    nombre: string;
  } | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('📊 DistribucionAsignaturaView - Estado:', {
    asignaturas: asignaturas.length,
    asignaturaSeleccionada,
    anio,
    tieneDistribucion: !!distribucion,
    distribucion,
    cargando,
    error,
  });

  const cargarDistribucion = async () => {
    console.log('🚀 Iniciando carga de distribución...', {
      asignaturaSeleccionada,
      anio,
    });

    if (!asignaturaSeleccionada) {
      console.error('❌ No hay asignatura seleccionada');
      setError('Debe seleccionar una asignatura');
      return;
    }

    try {
      setCargando(true);
      setError(null);

      console.log('📡 Llamando al servicio con:', {
        asignaturaId: parseInt(asignaturaSeleccionada),
        params: { anio },
      });

      const data = await reportesAdminService.getDistribucionAsignatura(
        parseInt(asignaturaSeleccionada),
        { anio }
      );

      console.log('✅ Datos recibidos del servicio:', {
        count: data.count,
        min: data.min,
        max: data.max,
        mean: data.mean,
        median: data.median,
        stddev: data.stddev,
        datosCompletos: data,
      });

      setDistribucion(data);

      // Extraer info de la asignatura seleccionada
      const asignatura = asignaturas.find(
        (a) => a.id_asignatura === parseInt(asignaturaSeleccionada)
      );
      console.log('📚 Asignatura encontrada:', asignatura);

      if (asignatura) {
        setAsignaturaInfo({ nombre: asignatura.nombre });
      }
    } catch (err) {
      console.error('❌ Error al cargar distribución:', err);
      console.error('📋 Detalles del error:', {
        message: err instanceof Error ? err.message : 'Error desconocido',
        response: (err as any)?.response?.data,
        status: (err as any)?.response?.status,
      });
      setError(
        'Error al cargar la distribución de notas. Por favor, intenta de nuevo.'
      );
    } finally {
      setCargando(false);
      console.log('🏁 Carga finalizada');
    }
  };

  const exportarPDF = () => {
    if (!distribucion || distribucion.count === 0 || !asignaturaInfo) return;

    const doc = new jsPDF();

    // Encabezado
    doc.setFontSize(16);
    doc.text('Distribución Estadística de Calificaciones', 14, 15);
    doc.setFontSize(11);
    doc.text(`Asignatura: ${asignaturaInfo.nombre}`, 14, 22);
    doc.text(`Año Académico: ${anio}`, 14, 28);

    // Estadísticas
    const statsData = [
      ['Total de Notas', distribucion.count.toString()],
      ['Nota Mínima', distribucion.min?.toFixed(2) || 'N/A'],
      ['Nota Máxima', distribucion.max?.toFixed(2) || 'N/A'],
      ['Promedio (Media)', distribucion.mean?.toFixed(2) || 'N/A'],
      ['Mediana', distribucion.median?.toFixed(2) || 'N/A'],
      ['Desviación Estándar', distribucion.stddev?.toFixed(2) || 'N/A'],
    ];

    autoTable(doc, {
      startY: 35,
      head: [['Métrica', 'Valor']],
      body: statsData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 11 },
    });

    doc.save(
      `distribucion_${asignaturaInfo.nombre.replace(/\s+/g, '_')}_${anio}.pdf`
    );
  };

  const exportarExcel = () => {
    if (!distribucion || distribucion.count === 0 || !asignaturaInfo) return;

    const worksheetData = [
      ['Distribución Estadística de Calificaciones'],
      [],
      ['Asignatura:', asignaturaInfo.nombre],
      ['Año Académico:', anio],
      [],
      ['Métrica', 'Valor'],
      ['Total de Notas', distribucion.count],
      ['Nota Mínima', distribucion.min],
      ['Nota Máxima', distribucion.max],
      ['Promedio (Media)', distribucion.mean],
      ['Mediana', distribucion.median],
      ['Desviación Estándar', distribucion.stddev],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Distribución');
    XLSX.writeFile(
      workbook,
      `distribucion_${asignaturaInfo.nombre.replace(/\s+/g, '_')}_${anio}.xlsx`
    );
  };

  const getInterpretacionDesviacion = (stddev: number | null) => {
    if (!stddev) return { texto: 'N/A', color: 'gray' };
    if (stddev < 1) return { texto: 'Muy homogéneo', color: 'green' };
    if (stddev < 1.5) return { texto: 'Homogéneo', color: 'blue' };
    if (stddev < 2) return { texto: 'Moderado', color: 'yellow' };
    return { texto: 'Muy disperso', color: 'red' };
  };

  const interpretacion = getInterpretacionDesviacion(
    distribucion?.stddev || null
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
              Distribución Estadística de Calificaciones
            </h2>
            <p className="text-gray-600 mt-1">
              Analiza métricas estadísticas de notas por asignatura
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div>
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
                      {asignatura.nombre}
                      {asignatura.curso?.nombre &&
                        ` - ${asignatura.curso.nombre}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
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

            <div className="flex flex-col md:items-end">
              <label className="text-sm font-medium mb-2 block invisible select-none">Acción</label>
              <Button
                onClick={cargarDistribucion}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analizar
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
      {!distribucion && !error && !cargando && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-indigo-900 mb-2">
              Analiza la Distribución de Calificaciones
            </h3>
            <p className="text-indigo-700 mb-4">
              Selecciona una asignatura y el año académico para obtener
              estadísticas detalladas de las calificaciones.
            </p>
            <p className="text-sm text-indigo-600">
              📊 Verás métricas como: mínimo, máximo, promedio, mediana y
              desviación estándar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resultado */}
      {distribucion && (
        <>
          {/* Resumen */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Estadísticas de Distribución</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportarPDF}
                  className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportarExcel}
                  className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Asignatura</p>
                  <p className="font-semibold">{asignaturaInfo?.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Año Académico</p>
                  <p className="font-semibold">{anio}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Notas</p>
                  <p className="font-semibold text-indigo-600">
                    {distribucion.count}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas Estadísticas */}
          {distribucion.count > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Nota Mínima */}
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Nota Mínima
                        </p>
                        <p className="text-3xl font-bold text-red-600">
                          {distribucion.min?.toFixed(2) || 'N/A'}
                        </p>
                      </div>
                      <TrendingDown className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Promedio */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Promedio (Media)
                        </p>
                        <p className="text-3xl font-bold text-blue-600">
                          {distribucion.mean?.toFixed(2) || 'N/A'}
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Nota Máxima */}
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Nota Máxima
                        </p>
                        <p className="text-3xl font-bold text-green-600">
                          {distribucion.max?.toFixed(2) || 'N/A'}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Métricas Adicionales */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Métricas de Tendencia Central y Dispersión
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Mediana */}
                    <div className="border-l-4 border-l-purple-500 pl-4">
                      <p className="text-sm text-gray-600 mb-2">Mediana</p>
                      <p className="text-2xl font-bold text-purple-600 mb-1">
                        {distribucion.median?.toFixed(2) || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Valor central de la distribución
                      </p>
                    </div>

                    {/* Desviación Estándar */}
                    <div className="border-l-4 border-l-orange-500 pl-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Desviación Estándar
                      </p>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-2xl font-bold text-orange-600">
                          {distribucion.stddev?.toFixed(2) || 'N/A'}
                        </p>
                        <Badge
                          className={`bg-${interpretacion.color}-100 text-${interpretacion.color}-800`}
                        >
                          {interpretacion.texto}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        Medida de dispersión de las calificaciones
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interpretación */}
              <Card className="bg-indigo-50 border-indigo-200">
                <CardHeader>
                  <CardTitle className="text-indigo-900">
                    Interpretación de Resultados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-indigo-900">
                    <p>
                      <strong>Promedio General:</strong> El promedio de{' '}
                      {distribucion.mean?.toFixed(2)} indica el rendimiento
                      general en esta asignatura.
                    </p>
                    <p>
                      <strong>Rango de Notas:</strong> Las calificaciones van
                      desde {distribucion.min?.toFixed(2)} hasta{' '}
                      {distribucion.max?.toFixed(2)}, con una amplitud de{' '}
                      {(
                        (distribucion.max || 0) - (distribucion.min || 0)
                      ).toFixed(2)}{' '}
                      puntos.
                    </p>
                    <p>
                      <strong>
                        Desviación Estándar ({distribucion.stddev?.toFixed(2)}):
                      </strong>{' '}
                      {distribucion.stddev && distribucion.stddev < 1.5
                        ? 'Las notas están bastante agrupadas cerca del promedio, indicando rendimiento homogéneo.'
                        : 'Hay una dispersión considerable en las notas, indicando diferentes niveles de rendimiento.'}
                    </p>
                    <p>
                      <strong>
                        Mediana ({distribucion.median?.toFixed(2)}):
                      </strong>{' '}
                      {distribucion.mean &&
                      distribucion.median &&
                      Math.abs(distribucion.mean - distribucion.median) < 0.5
                        ? 'Está muy cerca del promedio, indicando una distribución simétrica.'
                        : 'Difiere del promedio, puede haber valores extremos que afectan la media.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  No hay notas registradas para esta asignatura en el año {anio}
                  .
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
