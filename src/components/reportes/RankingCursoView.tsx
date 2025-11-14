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
  Award,
  Loader2,
  AlertCircle,
  Trophy,
  Medal,
} from 'lucide-react';
import type { Curso } from '../../api/services/cursosService';
import {
  reportesAdminService,
  type RankingAlumno,
} from '../../api/services/reportesAdminService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Props {
  cursos: Curso[];
  onVolver: () => void;
}

export function RankingCursoView({ cursos, onVolver }: Props) {
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string>('');
  const [anio, setAnio] = useState<string>('2025');
  const [top, setTop] = useState<string>('10');
  const [ranking, setRanking] = useState<RankingAlumno[] | null>(null);
  const [cursoInfo, setCursoInfo] = useState<{ nombre: string } | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🎯 RankingCursoView - Estado:', {
    cursos: cursos.length,
    cursoSeleccionado,
    anio,
    top,
    tieneRanking: !!ranking,
    cantidadRanking: ranking?.length,
    cargando,
    error,
  });

  const cargarRanking = async () => {
    console.log('🚀 Iniciando carga de ranking...', {
      cursoSeleccionado,
      anio,
      top,
    });

    if (!cursoSeleccionado) {
      console.error('❌ No hay curso seleccionado');
      setError('Debe seleccionar un curso');
      return;
    }

    try {
      setCargando(true);
      setError(null);

      console.log('📡 Llamando al servicio con:', {
        cursoId: parseInt(cursoSeleccionado),
        params: { anio, top: parseInt(top) },
      });

      const data = await reportesAdminService.getRankingCurso(
        parseInt(cursoSeleccionado),
        { anio, top: parseInt(top) }
      );

      console.log('✅ Datos recibidos del servicio:', {
        cantidad: data.length,
        datos: data,
      });

      setRanking(data);

      // Extraer info del curso seleccionado
      const curso = cursos.find(
        (c) => c.id_curso === parseInt(cursoSeleccionado)
      );
      console.log('📚 Curso encontrado:', curso);

      if (curso) {
        setCursoInfo({ nombre: curso.nombre });
      }
    } catch (err) {
      console.error('❌ Error al cargar ranking:', err);
      console.error('📋 Detalles del error:', {
        message: err instanceof Error ? err.message : 'Error desconocido',
        response: (err as any)?.response?.data,
        status: (err as any)?.response?.status,
      });
      setError(
        'Error al cargar el ranking del curso. Por favor, intenta de nuevo.'
      );
    } finally {
      setCargando(false);
      console.log('🏁 Carga finalizada');
    }
  };

  const exportarPDF = () => {
    if (!ranking || ranking.length === 0 || !cursoInfo) return;

    const doc = new jsPDF();

    // Encabezado
    doc.setFontSize(16);
    doc.text('Ranking de Mejores Alumnos', 14, 15);
    doc.setFontSize(11);
    doc.text(`Curso: ${cursoInfo.nombre}`, 14, 22);
    doc.text(`Año Académico: ${anio}`, 14, 28);
    doc.text(`Top ${top} Alumnos`, 14, 34);

    // Tabla de ranking
    const tableData = ranking.map((item, index) => [
      `#${index + 1}`,
      `${item.alumno.nombre} ${item.alumno.apellido}`,
      item.alumno.numeroMatricula,
      item.promedioGeneral.toFixed(2),
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Posición', 'Alumno', 'Matrícula', 'Promedio General']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 10 },
    });

    doc.save(`ranking_${cursoInfo.nombre.replace(/\s+/g, '_')}_${anio}.pdf`);
  };

  const exportarExcel = () => {
    if (!ranking || ranking.length === 0 || !cursoInfo) return;

    const worksheetData = [
      ['Ranking de Mejores Alumnos'],
      [],
      ['Curso:', cursoInfo.nombre],
      ['Año Académico:', anio],
      ['Top:', `${top} alumnos`],
      [],
      ['Posición', 'Nombre', 'Apellido', 'Matrícula', 'Promedio General'],
      ...ranking.map((item, index) => [
        index + 1,
        item.alumno.nombre,
        item.alumno.apellido,
        item.alumno.numeroMatricula,
        item.promedioGeneral,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ranking');
    XLSX.writeFile(
      workbook,
      `ranking_${cursoInfo.nombre.replace(/\s+/g, '_')}_${anio}.xlsx`
    );
  };

  const getMedalIcon = (position: number) => {
    if (position === 0) return <Trophy className="w-6 h-6 text-amber-500" />;
    if (position === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (position === 2) return <Medal className="w-6 h-6 text-amber-700" />;
    return null;
  };

  const getMedalBgColor = (position: number) => {
    if (position === 0) return 'bg-amber-50 border-amber-200';
    if (position === 1) return 'bg-gray-50 border-gray-200';
    if (position === 2) return 'bg-orange-50 border-orange-200';
    return 'bg-white';
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
              Ranking de Mejores Alumnos por Curso
            </h2>
            <p className="text-gray-600 mt-1">
              Consulta el top de alumnos con mejor promedio general
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
          {/* Filtros alineados: cada columna mantiene misma separación mediante label (botón usa label invisible) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            <div>
              <label className="text-sm font-medium mb-2 block">Curso</label>
              <Select
                value={cursoSeleccionado}
                onValueChange={setCursoSeleccionado}
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
                      {curso.nombre}
                      {curso.seccion && ` - ${curso.seccion}`}
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

            <div>
              <label className="text-sm font-medium mb-2 block">
                Top Alumnos
              </label>
              <Select value={top} onValueChange={setTop}>
                <SelectTrigger>
                  <SelectValue placeholder="Cantidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Top 5</SelectItem>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="15">Top 15</SelectItem>
                  <SelectItem value="20">Top 20</SelectItem>
                  <SelectItem value="50">Top 50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botón con label invisible para mantener altura uniforme */}
            <div className="md:col-span-1 flex flex-col md:items-end">
              <label className="text-sm font-medium mb-2 block invisible select-none">Acción</label>
              <Button
                onClick={cargarRanking}
                className="w-full md:w-auto min-w-[180px] bg-blue-600 hover:bg-blue-700 shadow-sm border border-blue-600 text-white"
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4 mr-2 text-white" />
                    Generar Ranking
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
      {!ranking && !error && !cargando && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-8 text-center">
            <Award className="w-16 h-16 text-amber-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-amber-900 mb-2">
              Genera el Ranking de Mejores Alumnos
            </h3>
            <p className="text-amber-700 mb-4">
              Selecciona un curso, el año académico y la cantidad de alumnos que
              deseas visualizar en el ranking.
            </p>
            <p className="text-sm text-amber-600">
              💡 El ranking mostrará a los alumnos ordenados por su promedio
              general de mayor a menor.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resultado */}
      {ranking && (
        <>
          {/* Resumen */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Ranking de Excelencia Académica</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportarPDF}
                  className="border-amber-600 text-amber-600 hover:bg-amber-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportarExcel}
                  className="border-amber-600 text-amber-600 hover:bg-amber-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Curso</p>
                  <p className="font-semibold">{cursoInfo?.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Año Académico</p>
                  <p className="font-semibold">{anio}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Top Alumnos</p>
                  <p className="font-semibold text-amber-600">{top}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Alumnos Listados</p>
                  <p className="font-semibold text-blue-600">
                    {ranking.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Ranking */}
          {ranking.length > 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {ranking.map((item, index) => (
                    <Card
                      key={item.id}
                      className={`border-l-4 ${getMedalBgColor(index)}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-700 font-bold text-lg">
                              {index < 3
                                ? getMedalIcon(index)
                                : `#${index + 1}`}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900">
                                {item.alumno.nombre} {item.alumno.apellido}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Matrícula: {item.alumno.numeroMatricula}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600 mb-1">
                              Promedio General
                            </p>
                            <Badge className="bg-amber-600 text-white text-xl px-4 py-2">
                              {item.promedioGeneral.toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  No hay alumnos con promedios calculados para este curso en el
                  año {anio}.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
