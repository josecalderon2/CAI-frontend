import { useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { X, Loader2, UserCircle2 } from 'lucide-react';
import { reportesAdminService } from '../../api/services/reportesAdminService';
import type { AlumnosPendientesResponse } from '../../api/services/reportesAdminService';

interface Props {
  idEvaluacion: number;
  onClose: () => void;
}

export function ModalAlumnosPendientes({ idEvaluacion, onClose }: Props) {
  const [data, setData] = useState<AlumnosPendientesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        setError(null);
        const response =
          await reportesAdminService.getPendientesEvaluacion(idEvaluacion);
        setData(response);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            'Error al cargar alumnos pendientes. Por favor, intenta de nuevo.'
        );
        console.error('Error al cargar alumnos:', err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [idEvaluacion]);

  // Click fuera del modal para cerrar
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Alumnos Pendientes</h3>
            {data && (
              <p className="text-sm text-gray-600">{data.evaluacion.nombre}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="text-gray-600 mt-3">Cargando alumnos...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          ) : data ? (
            <>
              {/* Resumen */}
              <div className="mb-4 p-3 bg-gray-50 rounded border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {data.registrados} de {data.total_alumnos} registrados
                  </span>
                  <Badge
                    variant={
                      data.pendientes.length > 0 ? 'destructive' : 'default'
                    }
                  >
                    {data.pendientes.length} pendientes
                  </Badge>
                </div>
              </div>

              {/* Lista de Alumnos */}
              {data.pendientes.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Alumnos sin calificación
                  </p>
                  {data.pendientes.map((alumno) => (
                    <div
                      key={alumno.id_alumno}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded border hover:bg-gray-100"
                    >
                      <UserCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm flex-1">
                        {alumno.nombre} {alumno.apellido}
                      </span>
                      <span className="text-xs text-gray-500">
                        ID: {alumno.id_alumno}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-green-600">
                    ✓ Todos los alumnos tienen nota registrada
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
