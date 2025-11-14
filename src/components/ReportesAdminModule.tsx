import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { FileText, BarChart3, CheckCircle, Loader2, AlertCircle, Award } from 'lucide-react';
import { cursosService, type Curso } from '../api/services/cursosService';
import { asignaturasService, type Asignatura } from '../api/services/asignaturasService';
import { evaluacionesService, type Evaluacion } from '../api/services/evaluacionesService';

// Subcomponentes
import { RankingCursoView } from './reportes/RankingCursoView';
import { DistribucionAsignaturaView } from './reportes/DistribucionAsignaturaView';
import { PendientesEvaluacionView } from './reportes/PendientesEvaluacionView';

type VistaReporte =
  | 'menu'
  | 'ranking-curso'
  | 'distribucion-asignatura'
  | 'pendientes-evaluacion';

export function ReportesAdminModule() {
  const [vistaActual, setVistaActual] = useState<VistaReporte>('menu');
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      setCargando(true);
      setError(null);
      const [cursosData, asignaturasData, evaluacionesData] = await Promise.all([
        cursosService.list({ activo: true }),
        asignaturasService.findAll(),
        evaluacionesService.findAll(),
      ]);
      setCursos(cursosData.items);
      setAsignaturas(asignaturasData);
      setEvaluaciones(evaluacionesData);
    } catch (err) {
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const volverAlMenu = () => setVistaActual('menu');
  const irARankingCurso = () => setVistaActual('ranking-curso');
  const irADistribucionAsignatura = () => setVistaActual('distribucion-asignatura');
  const irAPendientesEvaluacion = () => setVistaActual('pendientes-evaluacion');

  // Menú principal
  const renderMenu = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes Institucionales</h2>
          <p className="text-gray-600 mt-1">Reportes avanzados para análisis y supervisión académica</p>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cursos</p>
                <p className="text-2xl font-bold text-blue-600">{cursos.length}</p>
              </div>
              <Award className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Asignaturas</p>
                <p className="text-2xl font-bold text-green-600">{asignaturas.length}</p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Evaluaciones</p>
                <p className="text-2xl font-bold text-purple-600">{evaluaciones.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reportes Disponibles */}
      <Card className="border-t-4 border-t-blue-600">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Reportes Disponibles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Ranking Curso */}
            <Card
              className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-blue-500 hover:border-l-blue-600 hover:bg-blue-50"
              onClick={irARankingCurso}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Award className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Ranking de Mejores Alumnos por Curso</h3>
                      <p className="text-sm text-gray-600 mt-1">Consulta el top de alumnos con mejor promedio general en cada curso</p>
                      <Badge className="bg-blue-100 text-blue-800 mt-2">{cursos.length} cursos disponibles</Badge>
                    </div>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 hidden sm:inline-flex self-start mt-1">Generar</Button>
                </div>
              </CardContent>
            </Card>

            {/* Distribución Asignatura */}
            <Card
              className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-green-500 hover:border-l-green-600 hover:bg-green-50"
              onClick={irADistribucionAsignatura}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
                      <BarChart3 className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">Distribución Estadística de Calificaciones</h3>
                      <p className="text-sm text-gray-600 mt-1">Analiza estadísticas de notas: mínimo, máximo, promedio, mediana y desviación estándar</p>
                      <Badge className="bg-green-100 text-green-800 mt-2">{asignaturas.length} asignaturas</Badge>
                    </div>
                  </div>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 hidden sm:inline-flex self-start mt-1">Generar</Button>
                </div>
              </CardContent>
            </Card>

            {/* Evaluaciones Pendientes */}
            <Card
              className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-indigo-500 hover:border-l-indigo-600 hover:bg-indigo-50"
              onClick={irAPendientesEvaluacion}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition-colors">
                      <CheckCircle className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Alumnos con Evaluaciones Pendientes</h3>
                      <p className="text-sm text-gray-600 mt-1">Supervisa qué alumnos aún no tienen calificación registrada por evaluación</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-indigo-100 text-indigo-800">Supervisión</Badge>
                        <Badge className="bg-indigo-100 text-indigo-800">{evaluaciones.length} evaluaciones</Badge>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" onClick={irAPendientesEvaluacion} className="bg-indigo-600 hover:bg-indigo-700 hidden sm:inline-flex self-start mt-1">Generar</Button>
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
                <strong>Nota:</strong> Estos reportes institucionales solo están disponibles para usuarios con roles de <strong>Administrador</strong> o <strong>Personal Académico</strong>. Los reportes muestran información de todos los cursos, asignaturas y evaluaciones del sistema.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Vista dinámica
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
      case 'ranking-curso':
        return <RankingCursoView cursos={cursos} onVolver={volverAlMenu} />;
      case 'distribucion-asignatura':
        return <DistribucionAsignaturaView asignaturas={asignaturas} onVolver={volverAlMenu} />;
      case 'pendientes-evaluacion':
        return <PendientesEvaluacionView evaluaciones={evaluaciones} onVolver={volverAlMenu} />;
      default:
        return renderMenu();
    }
  };

  return <div>{renderVista()}</div>;
}
