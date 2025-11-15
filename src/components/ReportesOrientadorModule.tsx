import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  FileText,
  ClipboardList,
  User,
  FileBarChart,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  asignaturasService,
  type Asignatura,
} from '../api/services/asignaturasService';
import { api } from '../api/axiosConfig';
import type { Alumno } from '../types';

// Subcomponentes (importaremos después)
import { EvaluacionesPorAsignaturaView } from './reportes/EvaluacionesPorAsignaturaView.tsx';
import { ReporteDetalladoAlumnoView } from './reportes/ReporteDetalladoAlumnoView.tsx';
import { BoletaMensualView } from './reportes/BoletaMensualView.tsx';

type VistaReporte =
  | 'menu'
  | 'evaluaciones-asignatura'
  | 'reporte-detallado'
  | 'boleta-mensual';

export function ReportesOrientadorModule() {
  const [vistaActual, setVistaActual] = useState<VistaReporte>('menu');
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para navegación (reservados para futuras funcionalidades)
  // const [asignaturaSeleccionada, setAsignaturaSeleccionada] =
  //   useState<Asignatura | null>(null);
  // const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<Alumno | null>(
  //   null
  // );

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      setCargando(true);
      setError(null);
      const [asignaturasData, alumnosResponse] = await Promise.all([
        asignaturasService.findMisAsignaturas(),
        api.get<Alumno[]>('/alumnos', { params: { activo: true } }),
      ]);
      setAsignaturas(asignaturasData);
      setAlumnos(alumnosResponse.data);
    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const volverAlMenu = () => {
    setVistaActual('menu');
    // setAsignaturaSeleccionada(null);
    // setAlumnoSeleccionado(null);
  };

  const irAEvaluacionesAsignatura = () => {
    setVistaActual('evaluaciones-asignatura');
  };

  const irAReporteDetallado = () => {
    setVistaActual('reporte-detallado');
  };

  const irABoletaMensual = () => {
    setVistaActual('boleta-mensual');
  };

  // Renderizar menú principal
  const renderMenu = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Reportes del Orientador
          </h2>
          <p className="text-gray-600 mt-1">
            Consulta reportes de notas y evaluaciones de tus asignaturas
          </p>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mis Asignaturas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {asignaturas.length}
                </p>
              </div>
              <ClipboardList className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Alumnos</p>
                <p className="text-2xl font-bold text-green-600">
                  {alumnos.length}
                </p>
              </div>
              <User className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Año Académico</p>
                <p className="text-2xl font-bold text-purple-600">2025</p>
              </div>
              <FileBarChart className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reportes Disponibles - Estilo estandarizado */}
      <Card className="border-t-4 border-t-blue-600">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Reportes Disponibles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Reporte: Evaluaciones por Asignatura */}
            <Card
              className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-blue-500 hover:border-l-blue-600 hover:bg-blue-50"
              onClick={irAEvaluacionesAsignatura}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <ClipboardList className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        Evaluaciones por Asignatura
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Consulta todas las evaluaciones creadas en tus
                        asignaturas, filtradas por trimestre y mes
                      </p>
                      <Badge className="bg-blue-100 text-blue-800 mt-2">
                        {asignaturas.length} asignaturas disponibles
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 ml-4 hidden sm:flex"
                  >
                    Generar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reporte: Detallado por Trimestre/Periodo */}
            <Card
              className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-indigo-500 hover:border-l-indigo-600 hover:bg-indigo-50"
              onClick={irAReporteDetallado}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition-colors">
                      <FileBarChart className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        Reporte Detallado por Periodo
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Consulta todas las evaluaciones de un trimestre/periodo
                        con notas, conducta y asistencia del alumno
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-indigo-100 text-indigo-800">
                          Para Padres
                        </Badge>
                        <Badge className="bg-indigo-100 text-indigo-800">
                          Trimestre/Periodo
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 ml-4 hidden sm:flex"
                  >
                    Generar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reporte: Boleta Mensual */}
            <Card
              className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-purple-500 hover:border-l-purple-600 hover:bg-purple-50"
              onClick={irABoletaMensual}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                        Boleta Mensual
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Consulta todas las evaluaciones, notas, asistencia y
                        conducta de un mes específico
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-purple-100 text-purple-800">
                          Para Padres
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-800">
                          Mensual
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 ml-4 hidden sm:flex"
                  >
                    Generar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900">
                <strong>Nota:</strong> Los reportes solo muestran información de
                las asignaturas que tienes asignadas actualmente. Para ver
                reportes completos de todos los alumnos, contacta al
                administrador.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Renderizar vista según estado
  const renderVista = () => {
    if (cargando) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Cargando datos...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-red-600 text-center mb-4">{error}</p>
          <Button onClick={cargarDatosIniciales}>Reintentar</Button>
        </div>
      );
    }

    switch (vistaActual) {
      case 'evaluaciones-asignatura':
        return (
          <EvaluacionesPorAsignaturaView
            asignaturas={asignaturas}
            onVolver={volverAlMenu}
          />
        );
      case 'reporte-detallado':
        return (
          <ReporteDetalladoAlumnoView
            alumnos={alumnos}
            onVolver={volverAlMenu}
          />
        );
      case 'boleta-mensual':
        return <BoletaMensualView alumnos={alumnos} onVolver={volverAlMenu} />;
      default:
        return renderMenu();
    }
  };

  return <div>{renderVista()}</div>;
}
