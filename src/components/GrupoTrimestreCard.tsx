import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Calendar,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Award,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

interface EvaluacionPorMes {
  mes: number;
  evaluaciones: any[];
  porcentajeTotal: number;
  tiposFaltantes: any[];
  tiposExistentes: Map<number, any>;
  estaCompleto: boolean;
}

interface Props {
  grupo: {
    asignatura: { id_asignatura: number; nombre: string };
    trimestre: number | null;
    periodo: number | null;
    evaluacionesMensuales: EvaluacionPorMes[];
    evaluacionesTrimestrales: any[];
    porcentajeTotalTrimestral: number;
    tiposFaltantesTrimestral: any[];
    estaCompleto: boolean;
  };
  onDelete: (evaluacion: any) => void;
  onAddEvaluacion: (
    asignatura: number,
    trimestre: number | null,
    periodo: number | null,
    mes: number | null
  ) => void;
  getNombreMes: (mes: number) => string;
}

export function GrupoTrimestreCard({
  grupo,
  onDelete,
  onAddEvaluacion,
  getNombreMes,
}: Props) {
  // Estado para controlar qué meses están expandidos
  const [mesesExpandidos, setMesesExpandidos] = useState<Set<number>>(
    new Set(grupo.evaluacionesMensuales.map((m) => m.mes))
  );

  // Función para toggle expandir/contraer un mes
  const toggleMes = (mes: number) => {
    setMesesExpandidos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mes)) {
        newSet.delete(mes);
      } else {
        newSet.add(mes);
      }
      return newSet;
    });
  };

  // Calcular el porcentaje real de las evaluaciones mensuales
  // Los 3 meses juntos representan el 35% del trimestre
  // Si hay 3 meses completos (cada uno al 100% interno) = 35% del trimestre
  // Si hay 1 mes completo = 35/3 = 11.67% del trimestre
  // Si hay 2 meses completos = 35*2/3 = 23.33% del trimestre

  // Cada mes tiene 35% interno, pero representa 35/3 del trimestre cuando está completo
  const porcentajePorMesCompleto = 35 / 3; // ~11.67%
  const totalMensual = grupo.evaluacionesMensuales.reduce((sum, mes) => {
    // mes.porcentajeTotal está en escala de 35% (100% interno del mes)
    // Lo convertimos a la proporción del trimestre
    const proporcionDelTrimestre =
      (mes.porcentajeTotal / 35) * porcentajePorMesCompleto;
    return sum + proporcionDelTrimestre;
  }, 0);

  const totalGeneral = totalMensual + grupo.porcentajeTotalTrimestral;

  return (
    <Card className="overflow-visible">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 flex-1">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">
                {grupo.asignatura.nombre}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                {grupo.trimestre && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-50 border-green-200 text-green-700"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Trimestre {grupo.trimestre}
                  </Badge>
                )}
                {grupo.periodo && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 border-blue-200 text-blue-700"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Periodo {grupo.periodo}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() =>
                onAddEvaluacion(
                  grupo.asignatura.id_asignatura,
                  grupo.trimestre,
                  grupo.periodo,
                  null
                )
              }
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = '#1d4ed8')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = '#2563eb')
              }
            >
              <Plus
                style={{ width: '16px', height: '16px', color: '#ffffff' }}
              />
              <span style={{ color: '#ffffff' }}>Nueva Evaluación</span>
            </button>
            <div className="flex items-center gap-2">
              {grupo.estaCompleto ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              )}
              <div className="text-right">
                <span
                  className={`text-lg font-bold ${
                    grupo.estaCompleto
                      ? 'text-green-600'
                      : totalGeneral > 100
                        ? 'text-red-600'
                        : 'text-orange-600'
                  }`}
                >
                  {totalGeneral.toFixed(1)}%
                </span>
                <p className="text-xs text-gray-500">
                  {grupo.estaCompleto
                    ? 'Completo'
                    : `Falta ${(100 - totalGeneral).toFixed(1)}%`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                grupo.estaCompleto
                  ? 'bg-green-600'
                  : totalGeneral > 100
                    ? 'bg-red-600'
                    : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min(totalGeneral, 100)}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* EVALUACIONES MENSUALES */}
        {grupo.evaluacionesMensuales.length > 0 && (
          <div className="border-b">
            <div className="bg-purple-50 px-6 py-3 border-b">
              <h4 className="font-semibold text-purple-900">
                Evaluaciones Mensuales (35% del trimestre)
              </h4>
            </div>

            {grupo.evaluacionesMensuales.map((mes) => {
              const estaExpandido = mesesExpandidos.has(mes.mes);
              return (
                <div key={mes.mes} className="border-b last:border-b-0">
                  <div className="bg-purple-25 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleMes(mes.mes)}
                        className="p-1 hover:bg-purple-100 rounded transition-colors"
                        title={estaExpandido ? 'Contraer' : 'Expandir'}
                      >
                        {estaExpandido ? (
                          <ChevronDown className="w-4 h-4 text-purple-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-purple-600" />
                        )}
                      </button>
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-900">
                        {getNombreMes(mes.mes)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {mes.porcentajeTotal}% / 35%
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          onAddEvaluacion(
                            grupo.asignatura.id_asignatura,
                            grupo.trimestre,
                            null,
                            mes.mes
                          )
                        }
                        style={{
                          backgroundColor: '#f3e8ff',
                          color: '#7c3aed',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #d8b4fe',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e9d5ff';
                          e.currentTarget.style.borderColor = '#c084fc';
                          e.currentTarget.style.boxShadow =
                            '0 2px 4px rgba(124,58,237,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3e8ff';
                          e.currentTarget.style.borderColor = '#d8b4fe';
                          e.currentTarget.style.boxShadow =
                            '0 1px 2px rgba(0,0,0,0.05)';
                        }}
                      >
                        <Plus
                          style={{
                            width: '14px',
                            height: '14px',
                            color: '#7c3aed',
                          }}
                        />
                        <span style={{ color: '#7c3aed' }}>
                          Evaluación mensual de {getNombreMes(mes.mes)}
                        </span>
                      </button>
                      {!mes.estaCompleto && (
                        <span className="text-xs text-orange-600 font-medium">
                          Falta {(35 - mes.porcentajeTotal).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mostrar tabla solo si está expandido */}
                  {estaExpandido && (
                    <>
                      <div className="px-6">
                        <table
                          className="w-full border-collapse"
                          style={{ tableLayout: 'fixed' }}
                        >
                          <colgroup>
                            <col style={{ width: '30%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '10%' }} />
                          </colgroup>
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                                Nombre
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                                Tipo
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                                Porcentaje
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                                Puntaje
                              </th>
                              <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {mes.evaluaciones.map((evaluacion) => (
                              <tr
                                key={evaluacion.id_evaluacion}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="py-3 px-4 font-medium overflow-hidden">
                                  {evaluacion.nombre}
                                </td>
                                <td className="py-3 px-4">
                                  <Badge
                                    variant="outline"
                                    className="text-purple-700 border-purple-200 bg-purple-50"
                                  >
                                    {evaluacion.tipoEvaluacion.nombre}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-20 bg-gray-200 rounded-full h-2 flex-shrink-0">
                                      <div
                                        className="h-2 rounded-full bg-purple-600"
                                        style={{
                                          width: `${evaluacion.tipoEvaluacion.porcentaje}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-sm font-semibold whitespace-nowrap">
                                      {evaluacion.tipoEvaluacion.porcentaje %
                                        1 ===
                                      0
                                        ? evaluacion.tipoEvaluacion.porcentaje.toFixed(
                                            0
                                          )
                                        : evaluacion.tipoEvaluacion.porcentaje
                                            .toFixed(2)
                                            .replace(/\.?0+$/, '')}
                                      %
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center space-x-1">
                                    <Award className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm whitespace-nowrap">
                                      {evaluacion.puntaje_minimo} -{' '}
                                      {evaluacion.puntaje_maximo}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onDelete(evaluacion)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Tipos faltantes del mes */}
                      {mes.tiposFaltantes.length > 0 && (
                        <div className="px-6 py-2 bg-yellow-50">
                          <p className="text-xs text-yellow-800">
                            Faltan:{' '}
                            {mes.tiposFaltantes
                              .map((t) => `${t.nombre} (${t.porcentaje}%)`)
                              .join(', ')}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* EVALUACIONES TRIMESTRALES */}
        {grupo.evaluacionesTrimestrales.length > 0 && (
          <div>
            <div className="bg-green-50 px-6 py-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-green-900">
                    Evaluaciones Trimestrales (65% del trimestre)
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {grupo.porcentajeTotalTrimestral}% / 65%
                  </Badge>
                </div>
                <button
                  onClick={() =>
                    onAddEvaluacion(
                      grupo.asignatura.id_asignatura,
                      grupo.trimestre,
                      grupo.periodo,
                      null
                    )
                  }
                  style={{
                    backgroundColor: '#ecfdf5',
                    color: '#047857',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #86efac',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#d1fae5';
                    e.currentTarget.style.borderColor = '#4ade80';
                    e.currentTarget.style.boxShadow =
                      '0 2px 4px rgba(4,120,87,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ecfdf5';
                    e.currentTarget.style.borderColor = '#86efac';
                    e.currentTarget.style.boxShadow =
                      '0 1px 2px rgba(0,0,0,0.05)';
                  }}
                >
                  <Plus
                    style={{ width: '14px', height: '14px', color: '#047857' }}
                  />
                  <span style={{ color: '#047857' }}>
                    Evaluación trimestral
                  </span>
                </button>
              </div>
            </div>

            <div className="px-6">
              <table
                className="w-full border-collapse"
                style={{ tableLayout: 'fixed' }}
              >
                <colgroup>
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Nombre
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Tipo
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Porcentaje
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Puntaje
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {grupo.evaluacionesTrimestrales.map((evaluacion) => (
                    <tr
                      key={evaluacion.id_evaluacion}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-medium overflow-hidden">
                        {evaluacion.nombre}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className="text-green-700 border-green-200 bg-green-50"
                        >
                          {evaluacion.tipoEvaluacion.nombre}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2 flex-shrink-0">
                            <div
                              className="h-2 rounded-full bg-green-600"
                              style={{
                                width: `${evaluacion.tipoEvaluacion.porcentaje}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold whitespace-nowrap">
                            {evaluacion.tipoEvaluacion.porcentaje}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <Award className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm whitespace-nowrap">
                            {evaluacion.puntaje_minimo} -{' '}
                            {evaluacion.puntaje_maximo}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(evaluacion)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tipos faltantes trimestrales */}
            {grupo.tiposFaltantesTrimestral.length > 0 && (
              <div className="px-6 py-2 bg-yellow-50">
                <p className="text-xs text-yellow-800">
                  Faltan:{' '}
                  {grupo.tiposFaltantesTrimestral
                    .map((t) => `${t.nombre} (${t.porcentaje}%)`)
                    .join(', ')}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
