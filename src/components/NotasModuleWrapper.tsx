import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import NotasIngresoBasica2025 from './NotasIngresoBasica2025';
import NotasIngresoMensualCurso from './NotasIngresoMensualCurso';

/**
 * Componente wrapper que detecta el tipo de sistema de evaluación
 * y muestra el componente adecuado:
 *
 * - BÁSICA 2025: Sistema nuevo con evaluaciones mensuales (35%) y trimestrales (65%)
 * - BACHILLERATO: Sistema categorizado con múltiples categorías y porcentajes
 * - BÁSICA (antiguo): Sistema antiguo 70-30%
 */
export default function NotasModuleWrapper() {
  const [sistemaDetectado, setSistemaDetectado] = useState<
    'BASICA_2025' | 'BACHILLERATO' | 'LOADING' | null
  >(null);
  const [error] = useState<string | null>(null);

  // Si ya se detectó el sistema, mostrar el componente adecuado
  if (sistemaDetectado === 'BASICA_2025') {
    return <NotasIngresoBasica2025 />;
  }

  if (sistemaDetectado === 'BACHILLERATO') {
    return <NotasIngresoMensualCurso />;
  }

  // Pantalla de selección/detección
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            📚 Sistema de Ingreso de Notas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {sistemaDetectado === 'LOADING' ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">
                Detectando sistema de evaluación...
              </p>
            </div>
          ) : (
            <>
              {/* Selección manual de sistema */}
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">
                    Seleccione el tipo de sistema
                  </h3>
                  <p className="text-sm text-gray-600">
                    Elija el sistema de evaluación que desea utilizar
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card BÁSICA 2025 */}
                  <Card
                    className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500"
                    onClick={() => setSistemaDetectado('BASICA_2025')}
                  >
                    <CardHeader className="bg-blue-50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        📅 BÁSICA 2025
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-2">
                      <p className="text-sm text-gray-700">
                        <strong>Nuevo sistema</strong> con evaluaciones
                        mensuales y trimestrales
                      </p>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>✓ Evaluaciones Mensuales (35%)</div>
                        <div className="ml-4">• Tareas (5%)</div>
                        <div className="ml-4">• Revisión de libros (15%)</div>
                        <div className="ml-4">• Laboratorio (15%)</div>
                        <div className="mt-2">
                          ✓ Evaluaciones Trimestrales (65%)
                        </div>
                        <div className="ml-4">
                          • Actividad Integradora (25%)
                        </div>
                        <div className="ml-4">• Autoevaluación (10%)</div>
                        <div className="ml-4">• Examen (30%)</div>
                      </div>
                      <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                        Ingresar Notas BÁSICA
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Card BACHILLERATO */}
                  <Card
                    className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-500"
                    onClick={() => setSistemaDetectado('BACHILLERATO')}
                  >
                    <CardHeader className="bg-purple-50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        📊 BACHILLERATO
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-2">
                      <p className="text-sm text-gray-700">
                        <strong>Sistema categorizado</strong> con componentes
                        ponderados
                      </p>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>✓ Actividades (25%)</div>
                        <div>✓ Tareas (5%)</div>
                        <div>✓ Coevaluación (5%)</div>
                        <div>✓ Laboratorio (10%)</div>
                        <div>✓ Examen Parcial (25%)</div>
                        <div>✓ Examen del Periodo (30%)</div>
                      </div>
                      <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                        Ingresar Notas BACHILLERATO
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Información adicional */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">ℹ️ Información</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>
                    • El sistema se detectará automáticamente según la
                    asignatura seleccionada
                  </li>
                  <li>• BÁSICA 2025 es el nuevo sistema para grados 1º-9º</li>
                  <li>• BACHILLERATO es para 1º-2º año de bachillerato</li>
                  <li>
                    • Ambos sistemas guardan las notas de forma individual
                  </li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
