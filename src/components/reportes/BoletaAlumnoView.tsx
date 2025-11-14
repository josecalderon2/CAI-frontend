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
  User,
  BookOpen,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import type { Alumno } from '../../types';
import {
  reportesOrientadorService,
  type ReporteBoletaAlumno,
} from '../../api/services/reportesOrientadorService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Props {
  alumnos: Alumno[];
  onVolver: () => void;
}

export function BoletaAlumnoView({ alumnos, onVolver }: Props) {
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<string>('');
  const [anio, setAnio] = useState<string>('2025');
  const [reporte, setReporte] = useState<ReporteBoletaAlumno | null>(null);
  const [alumnoInfo, setAlumnoInfo] = useState<{
    nombre: string;
    apellido: string;
    nie: string;
  } | null>(null);
  const [cursoNombre, setCursoNombre] = useState<string>('');
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
      const data = await reportesOrientadorService.getBoletaAlumno(
        parseInt(alumnoSeleccionado),
        parseInt(anio)
      );

      // Validar estructura
      if (!data.finalesAsignatura || !Array.isArray(data.finalesAsignatura)) {
        throw new Error('Formato de respuesta inválido');
      }

      setReporte(data);

      // Extraer info del alumno y curso desde el primer finalAsignatura o desde la lista
      const alumno = alumnos.find(
        (a) => a.id_alumno === parseInt(alumnoSeleccionado)
      );
      if (alumno) {
        setAlumnoInfo({
          nombre: alumno.nombre,
          apellido: alumno.apellido,
          nie: 'N/A', // NIE not available in Alumno type
        });
      }

      // Extraer nombre del curso (asumiendo que todas las asignaturas son del mismo curso)
      if (data.finalesAsignatura.length > 0) {
        // El curso info vendría del alumno object en la respuesta real
        setCursoNombre('Curso no especificado'); // Placeholder
      }
    } catch (err) {
      console.error('Error al cargar boleta:', err);
      setError(
        'Error al cargar la boleta del alumno. Por favor, intenta de nuevo.'
      );
    } finally {
      setCargando(false);
    }
  };

  const exportarPDF = () => {
    if (!reporte || reporte.finalesAsignatura.length === 0 || !alumnoInfo)
      return;

    const doc = new jsPDF();

    // Encabezado
    doc.setFontSize(18);
    doc.text('BOLETA DE CALIFICACIONES', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Año Académico: ${anio}`, 105, 22, {
      align: 'center',
    });

    // Información del alumno
    doc.setFontSize(12);
    doc.text('Información del Alumno', 14, 32);
    doc.setFontSize(10);
    doc.text(`Nombre: ${alumnoInfo.nombre} ${alumnoInfo.apellido}`, 14, 38);
    doc.text(`NIE: ${alumnoInfo.nie}`, 14, 44);
    doc.text(`Curso: ${cursoNombre}`, 14, 50);

    // Tabla de asignaturas
    const asignaturasData = reporte.finalesAsignatura.map((asig) => [
      asig.asignatura.nombre,
      asig.promedioFinal.toFixed(2),
      asig.aprobado ? 'Aprobado' : 'Reprobado',
    ]);

    autoTable(doc, {
      startY: 56,
      head: [['Asignatura', 'Promedio Final', 'Estado']],
      body: asignaturasData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    let finalY = (doc as any).lastAutoTable.finalY + 10;

    // Promedio General
    doc.setFontSize(12);
    if (reporte.finalAlumno) {
      doc.text(
        `Promedio General: ${reporte.finalAlumno.promedioGeneral.toFixed(2)}`,
        14,
        finalY
      );
      finalY += 10;
    }

    // Asistencia
    doc.text('Resumen de Asistencia', 14, finalY);
    doc.setFontSize(10);
    finalY += 6;
    const ausencias = reporte.asistencia.total - reporte.asistencia.presentes;
    doc.text(
      `Total Días: ${reporte.asistencia.total} | Asistencias: ${reporte.asistencia.presentes} | Ausencias: ${ausencias}`,
      14,
      finalY
    );
    finalY += 6;
    doc.text(
      `Porcentaje de Asistencia: ${reporte.asistencia.porcentaje?.toFixed(1) || '0.0'}%`,
      14,
      finalY
    );

    // Conductas
    if (
      reporte.conductasResumen &&
      reporte.conductasResumen.detalles.length > 0
    ) {
      finalY += 10;
      doc.setFontSize(12);
      doc.text('Registro de Conducta', 14, finalY);

      const conductasData = reporte.conductasResumen.detalles.map((c) => [
        new Date(c.fecha).toLocaleDateString(),
        c.infraccion.categoria,
        c.infraccion.descripcion,
      ]);

      autoTable(doc, {
        startY: finalY + 4,
        head: [['Fecha', 'Categoría', 'Descripción']],
        body: conductasData,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
      });
    }

    doc.save(`boleta_${alumnoInfo.nombre}_${alumnoInfo.apellido}_${anio}.pdf`);
  };

  const exportarExcel = () => {
    if (!reporte || reporte.finalesAsignatura.length === 0 || !alumnoInfo)
      return;

    const ausencias = reporte.asistencia.total - reporte.asistencia.presentes;

    const worksheetData = [
      ['BOLETA DE CALIFICACIONES'],
      [`Año Académico: ${anio}`],
      [],
      ['INFORMACIÓN DEL ALUMNO'],
      ['Nombre:', `${alumnoInfo.nombre} ${alumnoInfo.apellido}`],
      ['NIE:', alumnoInfo.nie],
      ['Curso:', cursoNombre],
      [],
      ['ASIGNATURAS'],
      ['Asignatura', 'Promedio Final', 'Estado'],
      ...reporte.finalesAsignatura.map((asig) => [
        asig.asignatura.nombre,
        asig.promedioFinal,
        asig.aprobado ? 'Aprobado' : 'Reprobado',
      ]),
      [],
      ['Promedio General:', reporte.finalAlumno?.promedioGeneral || 'N/A'],
      [],
      ['ASISTENCIA'],
      ['Total Días:', reporte.asistencia.total],
      ['Asistencias:', reporte.asistencia.presentes],
      ['Ausencias:', ausencias],
      ['Porcentaje:', `${reporte.asistencia.porcentaje || 0}%`],
    ];

    if (
      reporte.conductasResumen &&
      reporte.conductasResumen.detalles.length > 0
    ) {
      worksheetData.push(
        [],
        ['REGISTRO DE CONDUCTA'],
        ['Fecha', 'Categoría', 'Artículo', 'Descripción', 'Puntos'],
        ...reporte.conductasResumen.detalles.map((c) => [
          new Date(c.fecha).toLocaleDateString(),
          c.infraccion.categoria,
          c.infraccion.articulo,
          c.infraccion.descripcion,
          c.infraccion.puntos,
        ])
      );
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Boleta');
    XLSX.writeFile(
      workbook,
      `boleta_${alumnoInfo.nombre}_${alumnoInfo.apellido}_${anio}.xlsx`
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
              Boleta Completa del Alumno
            </h2>
            <p className="text-gray-600 mt-1">
              Consulta la boleta completa con promedios, asistencia y conducta
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
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

            <div className="flex items-end">
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
                    Generar Boleta
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
                    {alumnoInfo?.nombre} {alumnoInfo?.apellido}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">NIE</p>
                  <p className="font-semibold">{alumnoInfo?.nie}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Curso</p>
                  <p className="font-semibold">{cursoNombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Año Académico</p>
                  <p className="font-semibold">{anio}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asignaturas y Promedios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>Calificaciones por Asignatura</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">
                        Asignatura
                      </th>
                      <th className="text-left p-3 font-semibold">
                        Promedio Final
                      </th>
                      <th className="text-left p-3 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.finalesAsignatura.map((final) => (
                      <tr key={final.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{final.asignatura.nombre}</td>
                        <td className="p-3">
                          <span className="font-semibold text-lg">
                            {final.promedioFinal.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={
                              final.aprobado
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {final.aprobado ? 'Aprobado' : 'Reprobado'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-lg">
                      Promedio General:
                    </span>
                  </div>
                  <span className="font-bold text-2xl text-blue-600">
                    {reporte.finalAlumno?.promedioGeneral.toFixed(2) || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-900">
                      <strong>Nota:</strong> Esta boleta solo incluye las
                      asignaturas que impartes como orientador. Para ver la
                      boleta completa del alumno, consulta con el administrador.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asistencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Resumen de Asistencia</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Días</p>
                  <p className="font-bold text-2xl">
                    {reporte.asistencia.total}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Asistencias</p>
                  <p className="font-bold text-2xl text-green-600">
                    {reporte.asistencia.presentes}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Ausencias</p>
                  <p className="font-bold text-2xl text-red-600">
                    {reporte.asistencia.total - reporte.asistencia.presentes}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Porcentaje</p>
                  <p className="font-bold text-2xl text-blue-600">
                    {reporte.asistencia.porcentaje?.toFixed(1) || '0.0'}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conducta */}
          {reporte.conductasResumen.detalles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Registro de Conducta</span>
                  <Badge variant="outline" className="text-red-600">
                    {reporte.conductasResumen.total} infracciones
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.conductasResumen.detalles.map((conducta) => (
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
                              className={
                                conducta.infraccion.categoria === 'MUY_GRAVE'
                                  ? 'bg-red-600 text-white'
                                  : conducta.infraccion.categoria === 'GRAVE'
                                    ? 'bg-red-100 text-red-800'
                                    : conducta.infraccion.categoria ===
                                        'MENOS_GRAVE'
                                      ? 'bg-orange-100 text-orange-800'
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {reporte.conductasResumen.detalles.length === 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6 text-center">
                <p className="text-green-800 font-medium">
                  ✓ El alumno no tiene registros de conducta en este período
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
