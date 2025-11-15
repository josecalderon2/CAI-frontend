import { useEffect, useState } from 'react';
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
import { cursosService, type Curso } from '../../api/services/cursosService';
import {
  reportesOrientadorService,
  type BoletaMensualResponse,
} from '../../api/services/reportesOrientadorService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Props {
  alumnos: Alumno[];
  onVolver: () => void;
}

const MESES = [
  { valor: 1, nombre: 'Enero' },
  { valor: 2, nombre: 'Febrero' },
  { valor: 3, nombre: 'Marzo' },
  { valor: 4, nombre: 'Abril' },
  { valor: 5, nombre: 'Mayo' },
  { valor: 6, nombre: 'Junio' },
  { valor: 7, nombre: 'Julio' },
  { valor: 8, nombre: 'Agosto' },
  { valor: 9, nombre: 'Septiembre' },
  { valor: 10, nombre: 'Octubre' },
  { valor: 11, nombre: 'Noviembre' },
  { valor: 12, nombre: 'Diciembre' },
];

export function BoletaMensualView({ alumnos, onVolver }: Props) {
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<string>('');
  const [anio, setAnio] = useState<string>('2025');
  const [mesSeleccionado, setMesSeleccionado] = useState<string>('');
  const [boleta, setBoleta] = useState<BoletaMensualResponse | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string>('');
  const [alumnosFiltrados, setAlumnosFiltrados] = useState<Alumno[]>(alumnos);

  // Cargar cursos del orientador
  useEffect(() => {
    const cargarCursos = async () => {
      try {
        const data = await cursosService.getMisCursos();
        setCursos(data || []);
      } catch (e) {
        console.error('Error cargando cursos del orientador', e);
      }
    };
    cargarCursos();
  }, []);

  // Cuando cambia el curso, filtrar alumnos
  useEffect(() => {
    const filtrarAlumnos = async () => {
      if (!cursoSeleccionado) {
        setAlumnosFiltrados(alumnos);
        return;
      }
      try {
        const lista = await cursosService.getAlumnosPorCurso(
          parseInt(cursoSeleccionado)
        );
        const mapped: Alumno[] = lista.map((a) => ({
          id_alumno: a.id_alumno,
          nombre: a.nombre,
          apellido: a.apellido,
          genero: 'N',
          fechaNacimiento: '',
          nacionalidad: '',
        }));
        setAlumnosFiltrados(mapped);
      } catch (e) {
        console.error('Error cargando alumnos por curso', e);
        setAlumnosFiltrados(alumnos);
      }
    };
    setAlumnoSeleccionado('');
    setBoleta(null);
    filtrarAlumnos();
  }, [cursoSeleccionado, alumnos]);

  const cargarBoleta = async () => {
    if (!alumnoSeleccionado) {
      setError('Debe seleccionar un alumno');
      return;
    }
    if (!mesSeleccionado) {
      setError('Debe seleccionar un mes');
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const data = await reportesOrientadorService.getBoletaMensual(
        parseInt(alumnoSeleccionado),
        {
          mes: parseInt(mesSeleccionado),
          anio,
        }
      );

      setBoleta(data);
    } catch (err: any) {
      console.error('Error al cargar boleta mensual:', err);
      setError(
        'Error al cargar la boleta mensual. Por favor, intenta de nuevo.'
      );
    } finally {
      setCargando(false);
    }
  };

  const exportarPDF = () => {
    if (!boleta) return;

    const doc = new jsPDF();

    // Encabezado
    doc.setFontSize(18);
    doc.text('BOLETA MENSUAL', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(boleta.periodo_academico.descripcion, 105, 22, {
      align: 'center',
    });

    // Información del alumno
    doc.setFontSize(12);
    doc.text('Información del Alumno', 14, 32);
    doc.setFontSize(10);
    doc.text(
      `Nombre: ${boleta.alumno.nombre} ${boleta.alumno.apellido}`,
      14,
      38
    );
    doc.text(`Matrícula: ${boleta.alumno.numeroMatricula}`, 14, 44);
    doc.text(`Curso: ${boleta.curso.nombre}`, 14, 50);
    doc.text(`Orientador: ${boleta.curso.orientador}`, 14, 56);

    let currentY = 66;

    // Promedio general del mes
    doc.setFontSize(12);
    doc.text(
      `Promedio General del Mes: ${boleta.promedio_general_mes?.toFixed(2) || 'N/A'}`,
      14,
      currentY
    );
    currentY += 10;

    // Asignaturas y evaluaciones
    boleta.asignaturas.forEach((asignatura) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.text(asignatura.nombre, 14, currentY);
      currentY += 6;
      doc.setFontSize(9);
      doc.text(`Orientador: ${asignatura.orientador}`, 14, currentY);
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
        `Promedio Mensual: ${asignatura.promedio_mensual?.toFixed(2) || 'N/A'}`,
        14,
        currentY
      );
      currentY += 8;
    });

    // Asistencia
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(12);
    doc.text('Asistencia del Mes', 14, currentY);
    currentY += 6;
    doc.setFontSize(9);
    doc.text(`Total Días: ${boleta.asistencia.total_dias}`, 14, currentY);
    currentY += 5;
    doc.text(`Presentes: ${boleta.asistencia.presentes}`, 14, currentY);
    currentY += 5;
    doc.text(`Ausentes: ${boleta.asistencia.ausentes}`, 14, currentY);
    currentY += 5;
    doc.text(`Tardanzas: ${boleta.asistencia.tardanzas}`, 14, currentY);
    currentY += 5;
    doc.text(
      `% Asistencia: ${boleta.asistencia.porcentaje_asistencia?.toFixed(1) || 0}%`,
      14,
      currentY
    );
    currentY += 10;

    // Conducta
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(12);
    doc.text('Registro de Conducta del Mes', 14, currentY);
    currentY += 6;
    doc.setFontSize(9);
    doc.text(`Total infracciones: ${boleta.conductas.total}`, 14, currentY);
    currentY += 5;
    doc.text(
      `Puntos acumulados: ${boleta.conductas.puntos_acumulados}`,
      14,
      currentY
    );
    currentY += 6;

    if (boleta.conductas.detalles.length > 0) {
      const conductasData = boleta.conductas.detalles.map((conducta) => [
        new Date(conducta.fecha).toLocaleDateString(),
        conducta.infraccion.categoria.replace('_', ' '),
        conducta.infraccion.articulo,
        conducta.infraccion.descripcion,
        conducta.infraccion.puntos.toString(),
        conducta.observacion,
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [
          [
            'Fecha',
            'Categoría',
            'Artículo',
            'Descripción',
            'Puntos',
            'Observación',
          ],
        ],
        body: conductasData,
        theme: 'striped',
        headStyles: { fillColor: [220, 38, 38], fontSize: 8 },
        styles: { fontSize: 7 },
      });
    } else {
      doc.setFontSize(9);
      doc.text('✓ Sin registros de conducta en este mes', 14, currentY);
    }

    doc.save(
      `boleta_mensual_${boleta.alumno.numeroMatricula}_${boleta.periodo_academico.nombre_mes}_${boleta.periodo_academico.anio}.pdf`
    );
  };

  const exportarExcel = () => {
    if (!boleta) return;

    const worksheetData = [
      ['BOLETA MENSUAL'],
      [boleta.periodo_academico.descripcion],
      [],
      ['INFORMACIÓN DEL ALUMNO'],
      ['Nombre:', `${boleta.alumno.nombre} ${boleta.alumno.apellido}`],
      ['Matrícula:', boleta.alumno.numeroMatricula],
      ['Curso:', boleta.curso.nombre],
      ['Orientador:', boleta.curso.orientador],
      [],
      ['PROMEDIO GENERAL DEL MES:', boleta.promedio_general_mes || 'N/A'],
      [],
    ];

    boleta.asignaturas.forEach((asignatura) => {
      worksheetData.push(
        [`ASIGNATURA: ${asignatura.nombre}`],
        [`Orientador: ${asignatura.orientador}`],
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
        ['Promedio Mensual:', asignatura.promedio_mensual?.toString() || 'N/A'],
        []
      );
    });

    worksheetData.push(
      [],
      ['ASISTENCIA DEL MES'],
      ['Total Días:', boleta.asistencia.total_dias.toString()],
      ['Presentes:', boleta.asistencia.presentes.toString()],
      ['Ausentes:', boleta.asistencia.ausentes.toString()],
      ['Tardanzas:', boleta.asistencia.tardanzas.toString()],
      ['Porcentaje:', `${boleta.asistencia.porcentaje_asistencia || 0}%`],
      [],
      ['CONDUCTA'],
      ['Total infracciones:', boleta.conductas.total.toString()],
      ['Puntos acumulados:', boleta.conductas.puntos_acumulados.toString()]
    );

    if (boleta.conductas.detalles.length > 0) {
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
        ...boleta.conductas.detalles.map((c) => [
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Boleta');
    XLSX.writeFile(
      workbook,
      `boleta_mensual_${boleta.alumno.numeroMatricula}_${boleta.periodo_academico.nombre_mes}_${boleta.periodo_academico.anio}.xlsx`
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
            <h2 className="text-2xl font-bold text-gray-900">Boleta Mensual</h2>
            <p className="text-gray-600 mt-1">
              Consulta todas las evaluaciones, notas y asistencia del mes
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
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div className="md:col-span-3">
              <label className="text-sm font-medium mb-2 block">Curso</label>
              <Select
                value={cursoSeleccionado}
                onValueChange={setCursoSeleccionado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un curso (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map((curso) => (
                    <SelectItem
                      key={curso.id_curso}
                      value={curso.id_curso!.toString()}
                    >
                      {curso.nombre}
                      {curso.seccion ? ` - ${curso.seccion}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <label className="text-sm font-medium mb-2 block">Alumno</label>
              <Select
                value={alumnoSeleccionado}
                onValueChange={(value) => {
                  setAlumnoSeleccionado(value);
                  setBoleta(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un alumno" />
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
              <label className="text-sm font-medium mb-2 block">Mes</label>
              <Select
                value={mesSeleccionado}
                onValueChange={setMesSeleccionado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona mes" />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((mes) => (
                    <SelectItem key={mes.valor} value={mes.valor.toString()}>
                      {mes.nombre}
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
              <label className="text-sm font-medium mb-2 block text-transparent select-none">
                Acción
              </label>
              <Button
                onClick={cargarBoleta}
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
      {boleta && (
        <>
          {/* Botones de exportación */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={exportarPDF}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar a PDF
            </Button>
            <Button
              onClick={exportarExcel}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
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
                    {boleta.alumno.nombre} {boleta.alumno.apellido}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Número de Matrícula</p>
                  <p className="font-semibold">
                    {boleta.alumno.numeroMatricula}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Curso</p>
                  <p className="font-semibold">{boleta.curso.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Periodo</p>
                  <p className="font-semibold">
                    {boleta.periodo_academico.descripcion}
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
                    Promedio General del Mes:
                  </span>
                </div>
                <span className="font-bold text-3xl text-blue-600">
                  {boleta.promedio_general_mes?.toFixed(2) || 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Asignaturas con evaluaciones */}
          {boleta.asignaturas.map((asignatura) => (
            <Card key={asignatura.id_asignatura}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5" />
                    <span>{asignatura.nombre}</span>
                  </div>
                  <Badge variant="outline" className="text-blue-600">
                    Promedio: {asignatura.promedio_mensual?.toFixed(2) || 'N/A'}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Orientador: {asignatura.orientador}
                </p>
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

                {/* Desglose de promedio */}
                {(asignatura.desglose_promedio.tareas !== null ||
                  asignatura.desglose_promedio.revisiones !== null ||
                  asignatura.desglose_promedio.laboratorios !== null) && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold mb-2">
                      Desglose del Promedio Mensual:
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {asignatura.desglose_promedio.tareas !== null && (
                        <div>
                          <span className="text-gray-600">Tareas: </span>
                          <span className="font-semibold">
                            {asignatura.desglose_promedio.tareas.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {asignatura.desglose_promedio.revisiones !== null && (
                        <div>
                          <span className="text-gray-600">Revisiones: </span>
                          <span className="font-semibold">
                            {asignatura.desglose_promedio.revisiones.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {asignatura.desglose_promedio.laboratorios !== null && (
                        <div>
                          <span className="text-gray-600">Laboratorios: </span>
                          <span className="font-semibold">
                            {asignatura.desglose_promedio.laboratorios.toFixed(
                              2
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Asistencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Asistencia del Mes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Días</p>
                  <p className="font-bold text-2xl">
                    {boleta.asistencia.total_dias}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Presentes</p>
                  <p className="font-bold text-2xl text-green-600">
                    {boleta.asistencia.presentes}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Ausentes</p>
                  <p className="font-bold text-2xl text-red-600">
                    {boleta.asistencia.ausentes}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Tardanzas</p>
                  <p className="font-bold text-2xl text-yellow-600">
                    {boleta.asistencia.tardanzas}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Porcentaje</p>
                  <p className="font-bold text-2xl text-blue-600">
                    {boleta.asistencia.porcentaje_asistencia?.toFixed(1) ||
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
                <span>Registro de Conducta del Mes</span>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-red-600">
                    {boleta.conductas.total} infracciones
                  </Badge>
                  <Badge variant="outline" className="text-orange-600">
                    {boleta.conductas.puntos_acumulados} puntos
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {boleta.conductas.detalles.length > 0 ? (
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
                      </tr>
                    </thead>
                    <tbody>
                      {boleta.conductas.detalles.map((conducta) => (
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
                                conducta.infraccion.categoria.includes('GRAVE')
                                  ? 'bg-red-600 text-white'
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-green-50 rounded-lg">
                  <p className="text-green-800 font-medium">
                    ✓ El alumno no tiene registros de conducta en este mes
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
