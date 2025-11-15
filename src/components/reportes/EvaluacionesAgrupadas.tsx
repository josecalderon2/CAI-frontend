import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { EvaluacionPendiente } from '../../api/services/reportesAdminService';

interface Props {
  evaluacionesAgrupadas: Record<string, Record<string, EvaluacionPendiente[]>>;
  onVerAlumnos: (idEvaluacion: number) => void;
}

export function EvaluacionesAgrupadas({
  evaluacionesAgrupadas,
  onVerAlumnos,
}: Props) {
  const [cursoExpandido, setCursoExpandido] = useState<string | null>(null);
  const [asignaturaExpandida, setAsignaturaExpandida] = useState<string | null>(
    null
  );

  const toggleCurso = (nombreCurso: string) => {
    setCursoExpandido(cursoExpandido === nombreCurso ? null : nombreCurso);
    // Al colapsar un curso, también colapsamos asignaturas
    if (cursoExpandido === nombreCurso) {
      setAsignaturaExpandida(null);
    }
  };

  const toggleAsignatura = (nombreAsignatura: string) => {
    setAsignaturaExpandida(
      asignaturaExpandida === nombreAsignatura ? null : nombreAsignatura
    );
  };

  if (Object.keys(evaluacionesAgrupadas).length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <p className="text-lg font-medium text-gray-900">
          ¡Excelente! No hay evaluaciones pendientes
        </p>
        <p className="text-gray-500 mt-1">
          Todas las evaluaciones tienen notas registradas
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="divide-y">
        {Object.entries(evaluacionesAgrupadas).map(
          ([nombreCurso, asignaturas]) => {
            const totalPendientesCurso = Object.values(asignaturas)
              .flat()
              .reduce((sum, ev) => sum + ev.pendientes, 0);

            return (
              <div key={nombreCurso}>
                <button
                  onClick={() => toggleCurso(nombreCurso)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    {cursoExpandido === nombreCurso ? (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                    <h3 className="font-medium text-gray-900">{nombreCurso}</h3>
                    <span className="text-xs text-gray-500">
                      ({Object.keys(asignaturas).length} asignaturas)
                    </span>
                  </div>
                  <div>
                    {totalPendientesCurso > 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        {totalPendientesCurso}
                      </Badge>
                    ) : (
                      <Badge className="bg-green-600 text-xs">✓</Badge>
                    )}
                  </div>
                </button>

                {cursoExpandido === nombreCurso && (
                  <div className="bg-gray-50 pl-6">
                    {Object.entries(asignaturas).map(
                      ([nombreAsignatura, evaluaciones]) => {
                        const totalPendientesAsignatura = evaluaciones.reduce(
                          (sum, ev) => sum + ev.pendientes,
                          0
                        );

                        return (
                          <div key={nombreAsignatura}>
                            <button
                              onClick={() => toggleAsignatura(nombreAsignatura)}
                              className="w-full px-4 py-2 flex items-center justify-between hover:bg-white"
                            >
                              <div className="flex items-center gap-2">
                                {asignaturaExpandida === nombreAsignatura ? (
                                  <ChevronDown className="w-3 h-3 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 text-gray-500" />
                                )}
                                <h4 className="text-sm font-medium text-gray-800">
                                  {nombreAsignatura}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  ({evaluaciones.length})
                                </span>
                              </div>
                              <div>
                                {totalPendientesAsignatura > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {totalPendientesAsignatura}
                                  </Badge>
                                )}
                              </div>
                            </button>

                            {asignaturaExpandida === nombreAsignatura && (
                              <div className="bg-white pl-6">
                                {evaluaciones.map((evaluacion) => (
                                  <div
                                    key={evaluacion.id_evaluacion}
                                    className="px-4 py-2 flex items-center justify-between border-t text-sm"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900">
                                        {evaluacion.nombre}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        {evaluacion.registrados}/
                                        {evaluacion.total_alumnos} registrados
                                        {evaluacion.trimestre &&
                                          ` • T${evaluacion.trimestre}`}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {evaluacion.pendientes > 0 ? (
                                        <Button
                                          onClick={() =>
                                            onVerAlumnos(
                                              evaluacion.id_evaluacion
                                            )
                                          }
                                          size="sm"
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          Ver {evaluacion.pendientes}
                                        </Button>
                                      ) : (
                                        <Badge className="bg-green-600 text-xs">
                                          ✓
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>
    </Card>
  );
}
