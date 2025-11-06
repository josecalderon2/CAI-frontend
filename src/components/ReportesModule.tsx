import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { FileText, Calendar, BarChart3 } from 'lucide-react';

interface ReportesModuleProps {
  onNavigate: (section: string) => void;
}

export function ReportesModule({ onNavigate }: ReportesModuleProps) {
  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-l-purple-600">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Reportes de Asistencia y Conducta
        </h1>
        <p className="text-gray-600 mt-2 flex items-center">
          <FileText className="w-4 h-4 mr-2 text-purple-600" />
          Genera reportes mensuales, trimestrales y anuales de tus cursos
        </p>
      </div>

      {/* Reportes de Asistencia y Conducta */}
      <Card className="border-t-4 border-t-purple-600">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <span>Reportes Disponibles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Reporte Mensual */}
            <Card
              className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-teal-500 hover:border-l-teal-600 hover:bg-teal-50"
              onClick={() => onNavigate('asistencia?tab=resumen-mensual')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="bg-teal-100 p-3 rounded-lg group-hover:bg-teal-200 transition-colors">
                      <Calendar className="w-6 h-6 text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                        Reporte Conductual
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Genera el reporte de asistencia y conducta de un mes
                        específico
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 ml-4 hidden sm:flex"
                  >
                    Generar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reporte Trimestral */}
            <Card
              className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-indigo-500 hover:border-l-indigo-600 hover:bg-indigo-50"
              onClick={() => onNavigate('asistencia?tab=resumen-trimestral')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition-colors">
                      <BarChart3 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        Reporte Trimestral
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Consolidado de asistencia y conducta por trimestre
                        académico
                      </p>
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

            {/* Reporte Anual */}
            <Card
              className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-purple-500 hover:border-l-purple-600 hover:bg-purple-50"
              onClick={() => onNavigate('asistencia?tab=resumen-anual')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                        Reporte Conductual Anual
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Consolidado anual de asistencia con totales de
                        justificadas, injustificadas y atrasos
                      </p>
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

            {/* Reporte Trimestral Consolidado Anual */}
            <Card
              className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-pink-500 hover:border-l-pink-600 hover:bg-pink-50"
              onClick={() =>
                onNavigate('asistencia?tab=resumen-trimestral-consolidado')
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="bg-pink-100 p-3 rounded-lg group-hover:bg-pink-200 transition-colors">
                      <BarChart3 className="w-6 h-6 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                        Reporte Trimestral Consolidado
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Detalle de los tres trimestres con asistencia, conducta
                        e infracciones consolidadas por trimestre
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-pink-600 hover:bg-pink-700 ml-4 hidden sm:flex"
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
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Información sobre los Reportes
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              • <strong>Reporte Conductual:</strong> Muestra las asistencias y
              conducta de los alumnos durante un mes específico.
            </p>
            <p>
              • <strong>Reporte Trimestral:</strong> Consolida la información de
              un trimestre completo incluyendo infracciones y puntuación de
              conducta.
            </p>
            <p>
              • <strong>Reporte Anual:</strong> Resume todo el año lectivo con
              totales de justificadas, injustificadas y atrasos.
            </p>
            <p>
              • <strong>Reporte Trimestral Consolidado:</strong> Muestra el
              detalle completo de los tres trimestres del año académico con
              asistencia, conducta, infracciones y promedios por trimestre.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
