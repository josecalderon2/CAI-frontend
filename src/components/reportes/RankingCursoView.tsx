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

    // Agregar información del curso
    if (ranking[0]?.estadisticasComparativas) {
      doc.text(
        `Promedio del Curso: ${ranking[0].estadisticasComparativas.promedioCurso.toFixed(2)}`,
        14,
        40
      );
      doc.text(
        `Total de Alumnos: ${ranking[0].estadisticasComparativas.totalAlumnosConNotas}`,
        14,
        46
      );
    }

    // Tabla de ranking
    const tableData = ranking.map((item, index) => [
      `#${index + 1}`,
      `${item.alumno.nombre} ${item.alumno.apellido}`,
      item.alumno.numeroMatricula,
      item.promedioGeneral.toFixed(2),
      item.estadisticasComparativas
        ? `${item.estadisticasComparativas.diferenciaConPromedio > 0 ? '+' : ''}${item.estadisticasComparativas.diferenciaConPromedio.toFixed(2)}`
        : 'N/A',
      item.estadisticasComparativas
        ? `Top ${item.estadisticasComparativas.posicionPorcentaje}%`
        : 'N/A',
    ]);

    autoTable(doc, {
      startY: ranking[0]?.estadisticasComparativas ? 52 : 40,
      head: [
        ['Pos.', 'Alumno', 'Matrícula', 'Promedio', 'vs Curso', 'Percentil'],
      ],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 8 },
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
    ];

    // Agregar estadísticas del curso si están disponibles
    if (ranking[0]?.estadisticasComparativas) {
      worksheetData.push(
        [
          'Promedio del Curso:',
          ranking[0].estadisticasComparativas.promedioCurso.toString(),
        ],
        [
          'Total de Alumnos:',
          ranking[0].estadisticasComparativas.totalAlumnosConNotas.toString(),
        ],
        []
      );
    }

    worksheetData.push(
      [
        'Posición',
        'Nombre',
        'Apellido',
        'Matrícula',
        'Total Asignaturas',
        'Total Notas',
        'Promedio General',
        'Diferencia vs Curso',
        'Supera Promedio',
        'Top Percentil',
      ],
      ...ranking.map((item, index) => [
        (index + 1).toString(),
        item.alumno.nombre,
        item.alumno.apellido,
        item.alumno.numeroMatricula,
        item.totalAsignaturas.toString(),
        item.totalNotas.toString(),
        item.promedioGeneral.toString(),
        item.estadisticasComparativas?.diferenciaConPromedio.toString() ||
          'N/A',
        item.estadisticasComparativas?.superaPromedioCurso ? 'SÍ' : 'NO',
        item.estadisticasComparativas
          ? `${item.estadisticasComparativas.posicionPorcentaje}%`
          : 'N/A',
      ]),
      [],
      ['Detalle por Asignatura'],
      []
    );

    // Agregar detalle de cada alumno con sus asignaturas
    ranking.forEach((item, index) => {
      worksheetData.push([
        `#${index + 1} - ${item.alumno.nombre} ${item.alumno.apellido}`,
      ]);
      worksheetData.push([
        'Asignatura',
        'Promedio',
        'Total Notas',
        'Nota Más Alta',
        'Nota Más Baja',
      ]);

      item.detalleAsignaturas.forEach((asig) => {
        worksheetData.push([
          asig.nombre,
          asig.promedio.toString(),
          asig.total_notas.toString(),
          asig.nota_mas_alta.toString(),
          asig.nota_mas_baja.toString(),
        ]);
      });

      worksheetData.push([]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ranking');
    XLSX.writeFile(
      workbook,
      `ranking_${cursoInfo.nombre.replace(/\s+/g, '_')}_${anio}.xlsx`
    );
  };

  const getMedalIcon = (position: number) => {
    if (position === 0)
      return <Trophy className="w-8 h-8 text-yellow-500" fill="currentColor" />;
    if (position === 1)
      return <Medal className="w-8 h-8 text-gray-400" fill="currentColor" />;
    if (position === 2)
      return <Medal className="w-8 h-8 text-orange-600" fill="currentColor" />;
    return null;
  };

  const getMedalBgColor = (position: number) => {
    if (position === 0) return 'bg-yellow-50 border-yellow-300 border-2';
    if (position === 1) return 'bg-gray-50 border-gray-300 border-2';
    if (position === 2) return 'bg-orange-50 border-orange-300 border-2';
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
              <label className="text-sm font-medium mb-2 block invisible select-none">
                Acción
              </label>
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
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
                {ranking[0]?.estadisticasComparativas && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">
                        Promedio del Curso
                      </p>
                      <p className="font-semibold text-purple-600">
                        {ranking[0].estadisticasComparativas.promedioCurso.toFixed(
                          2
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Alumnos</p>
                      <p className="font-semibold text-gray-700">
                        {
                          ranking[0].estadisticasComparativas
                            .totalAlumnosConNotas
                        }
                      </p>
                    </div>
                  </>
                )}
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
                      key={item.alumnoId}
                      className={`border-l-4 ${getMedalBgColor(index)}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex items-center justify-center ${index < 3 ? 'w-16 h-16' : 'w-12 h-12'} rounded-full ${index < 3 ? 'bg-white shadow-md' : 'bg-amber-100'} ${index < 3 ? '' : 'text-amber-700 font-bold text-lg'}`}
                              >
                                {index < 3
                                  ? getMedalIcon(index)
                                  : `#${index + 1}`}
                              </div>
                              {index < 3 && (
                                <div className="flex flex-col">
                                  <span
                                    className={`font-bold text-xs ${index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : 'text-orange-600'}`}
                                  >
                                    {index === 0
                                      ? '1º LUGAR'
                                      : index === 1
                                        ? '2º LUGAR'
                                        : '3º LUGAR'}
                                  </span>
                                  <span
                                    className={`text-xs font-medium ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-500' : 'text-orange-500'}`}
                                  >
                                    {index === 0
                                      ? 'ORO'
                                      : index === 1
                                        ? 'PLATA'
                                        : 'BRONCE'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3
                                className={`${index < 3 ? 'text-xl' : 'text-lg'} font-bold text-gray-900`}
                              >
                                {item.alumno.nombre} {item.alumno.apellido}
                              </h3>
                              <div className="flex gap-3 mt-1">
                                <p className="text-sm text-gray-600">
                                  Matrícula: {item.alumno.numeroMatricula}
                                </p>
                                <span className="text-gray-400">•</span>
                                <p className="text-sm text-gray-600">
                                  {item.totalAsignaturas} asignaturas
                                </p>
                                <span className="text-gray-400">•</span>
                                <p className="text-sm text-gray-600">
                                  {item.totalNotas} notas
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">
                                Promedio General
                              </p>
                              <Badge className="bg-amber-600 text-white text-xl px-4 py-2">
                                {item.promedioGeneral.toFixed(2)}
                              </Badge>
                            </div>
                            {item.estadisticasComparativas && (
                              <div className="flex flex-col gap-1 items-end">
                                <Badge
                                  variant={
                                    item.estadisticasComparativas
                                      .superaPromedioCurso
                                      ? 'default'
                                      : 'outline'
                                  }
                                  className={`text-xs ${item.estadisticasComparativas.superaPromedioCurso ? 'bg-green-600' : 'border-gray-400 text-gray-700'}`}
                                >
                                  {item.estadisticasComparativas
                                    .superaPromedioCurso
                                    ? '↑'
                                    : '↓'}{' '}
                                  {item.estadisticasComparativas
                                    .diferenciaConPromedio > 0
                                    ? '+'
                                    : ''}
                                  {item.estadisticasComparativas.diferenciaConPromedio.toFixed(
                                    2
                                  )}{' '}
                                  vs curso
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  Top{' '}
                                  {
                                    item.estadisticasComparativas
                                      .posicionPorcentaje
                                  }
                                  %
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Detalle de asignaturas */}
                        {item.detalleAsignaturas &&
                          item.detalleAsignaturas.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                Detalle por Asignatura
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {item.detalleAsignaturas.map((asig) => (
                                  <div
                                    key={asig.id_asignatura}
                                    className="bg-gray-50 rounded-lg p-3"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex-1">
                                        <h5 className="font-semibold text-sm text-gray-900">
                                          {asig.nombre}
                                        </h5>
                                        <p className="text-xs text-gray-600">
                                          {asig.total_notas} evaluaciones
                                        </p>
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className="text-sm font-bold"
                                      >
                                        {asig.promedio.toFixed(2)}
                                      </Badge>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-600">
                                      <span>
                                        Más alta:{' '}
                                        <span className="font-semibold text-green-600">
                                          {asig.nota_mas_alta.toFixed(2)}
                                        </span>
                                      </span>
                                      <span>
                                        Más baja:{' '}
                                        <span className="font-semibold text-red-600">
                                          {asig.nota_mas_baja.toFixed(2)}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
