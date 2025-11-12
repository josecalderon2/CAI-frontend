import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import {
  Calendar,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Award,
} from 'lucide-react';

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
  const totalMensual = grupo.evaluacionesMensuales.length > 0 ? 35 : 0;
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
            <div className="bg-purple-50 px-4 py-2 border-b">
              <h4 className="font-semibold text-purple-900">
                Evaluaciones Mensuales (35% del trimestre)
              </h4>
            </div>

            {grupo.evaluacionesMensuales.map((mes) => (
              <div key={mes.mes} className="border-b last:border-b-0">
                <div className="bg-purple-25 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-900">
                      {getNombreMes(mes.mes)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {mes.porcentajeTotal}% / 35%
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onAddEvaluacion(
                          grupo.asignatura.id_asignatura,
                          grupo.trimestre,
                          null,
                          mes.mes
                        )
                      }
                      className="text-xs h-7 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 font-medium shadow-sm hover:shadow transition-all duration-200"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Agregar evaluación
                    </Button>
                    {!mes.estaCompleto && (
                      <span className="text-xs text-orange-600">
                        Falta {(35 - mes.porcentajeTotal).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Porcentaje</TableHead>
                      <TableHead>Puntaje</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mes.evaluaciones.map((evaluacion) => (
                      <TableRow key={evaluacion.id_evaluacion}>
                        <TableCell className="font-medium">
                          {evaluacion.nombre}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-purple-700 border-purple-200 bg-purple-50"
                          >
                            {evaluacion.tipoEvaluacion.nombre}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-purple-600"
                                style={{
                                  width: `${evaluacion.tipoEvaluacion.porcentaje}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-semibold">
                              {evaluacion.tipoEvaluacion.porcentaje}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Award className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">
                              {evaluacion.puntaje_minimo} -{' '}
                              {evaluacion.puntaje_maximo}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(evaluacion)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Tipos faltantes del mes */}
                {mes.tiposFaltantes.length > 0 && (
                  <div className="px-4 py-2 bg-yellow-50">
                    <p className="text-xs text-yellow-800">
                      Faltan:{' '}
                      {mes.tiposFaltantes
                        .map((t) => `${t.nombre} (${t.porcentaje}%)`)
                        .join(', ')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* EVALUACIONES TRIMESTRALES */}
        {grupo.evaluacionesTrimestrales.length > 0 && (
          <div>
            <div className="bg-green-50 px-4 py-2 border-b">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-green-900">
                  Evaluaciones Trimestrales (65% del trimestre)
                </h4>
                <Badge variant="outline" className="text-xs">
                  {grupo.porcentajeTotalTrimestral}% / 65%
                </Badge>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Porcentaje</TableHead>
                  <TableHead>Puntaje</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grupo.evaluacionesTrimestrales.map((evaluacion) => (
                  <TableRow key={evaluacion.id_evaluacion}>
                    <TableCell className="font-medium">
                      {evaluacion.nombre}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-green-700 border-green-200 bg-green-50"
                      >
                        {evaluacion.tipoEvaluacion.nombre}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-green-600"
                            style={{
                              width: `${evaluacion.tipoEvaluacion.porcentaje}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold">
                          {evaluacion.tipoEvaluacion.porcentaje}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {evaluacion.puntaje_minimo} -{' '}
                          {evaluacion.puntaje_maximo}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(evaluacion)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Tipos faltantes trimestrales */}
            {grupo.tiposFaltantesTrimestral.length > 0 && (
              <div className="px-4 py-2 bg-yellow-50">
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
