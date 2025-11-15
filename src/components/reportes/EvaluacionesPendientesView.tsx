import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { reportesAdminService } from '../../api/services/reportesAdminService';
import type { EvaluacionesPendientesResponse } from '../../api/services/reportesAdminService';
import { cursosService, type Curso } from '../../api/services/cursosService';
import { FiltrosEvaluaciones } from './FiltrosEvaluaciones';
import { EvaluacionesAgrupadas } from './EvaluacionesAgrupadas';
import { ModalAlumnosPendientes } from './ModalAlumnosPendientes';

interface Props {
  onVolver: () => void;
}

export function EvaluacionesPendientesView({ onVolver }: Props) {
  const [data, setData] = useState<EvaluacionesPendientesResponse | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filtros, setFiltros] = useState({
    cursoId: undefined as number | undefined,
    anio: new Date().getFullYear().toString(),
  });

  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<
    number | null
  >(null);

  // Cargar cursos
  useEffect(() => {
    const cargarCursos = async () => {
      try {
        setLoadingCursos(true);
        const response = await cursosService.list({ activo: true });
        setCursos(response.items);
      } catch (err) {
        console.error('Error al cargar cursos:', err);
      } finally {
        setLoadingCursos(false);
      }
    };
    cargarCursos();
  }, []);

  // Cargar evaluaciones pendientes
  const cargarEvaluaciones = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        anio: filtros.anio,
      };
      if (filtros.cursoId) params.cursoId = filtros.cursoId;

      const response =
        await reportesAdminService.getEvaluacionesPendientes(params);
      setData(response);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Error al cargar evaluaciones. Por favor, intenta de nuevo.'
      );
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  // Cargar automáticamente cuando cambian los filtros
  useEffect(() => {
    cargarEvaluaciones();
  }, [cargarEvaluaciones]);

  const setFiltro = (key: string, value: any) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      cursoId: undefined,
      anio: new Date().getFullYear().toString(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={onVolver} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
          <h2 className="text-xl font-bold text-gray-900">
            Evaluaciones Pendientes
          </h2>
        </div>
        <Button
          onClick={cargarEvaluaciones}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Filtros */}
      <FiltrosEvaluaciones
        cursos={cursos}
        loadingCursos={loadingCursos}
        filtros={filtros}
        onChangeFiltro={setFiltro}
        onLimpiarFiltros={limpiarFiltros}
      />

      {/* Loading State */}
      {loading && !data ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="text-gray-600 mt-3">Cargando evaluaciones...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : data ? (
        <>
          {/* Resumen */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Año:{' '}
                    <span className="font-semibold">{data.anio_academico}</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {data.total_evaluaciones} evaluaciones •{' '}
                    <span
                      className={
                        data.total_pendientes > 0
                          ? 'text-red-600 font-semibold'
                          : 'text-green-600 font-semibold'
                      }
                    >
                      {data.total_pendientes} pendientes
                    </span>
                  </p>
                </div>
                {data.total_pendientes === 0 && (
                  <Badge className="bg-green-600">✓ Todo completo</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vista Agrupada de Evaluaciones */}
          <EvaluacionesAgrupadas
            evaluacionesAgrupadas={data.evaluaciones_agrupadas}
            onVerAlumnos={setEvaluacionSeleccionada}
          />

          {data.total_evaluaciones === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No se encontraron evaluaciones</p>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}

      {/* Modal de Alumnos Pendientes */}
      {evaluacionSeleccionada && (
        <ModalAlumnosPendientes
          idEvaluacion={evaluacionSeleccionada}
          onClose={() => setEvaluacionSeleccionada(null)}
        />
      )}
    </div>
  );
}
