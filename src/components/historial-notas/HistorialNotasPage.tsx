import React, { useState } from 'react';
import { useCursos } from '../../hooks/useCursos';
import { useAlumnosPorCurso } from '../../hooks/useAlumnosPorCurso';
import { useHistorialNotas } from '../../hooks/useHistorialNotas';
import { FiltrosHistorial } from './FiltrosHistorial';
import { NotasAgrupadasPorAsignaturaComponent } from './NotasAgrupadasPorAsignatura';

interface Props {
  onVolver?: () => void;
}

export const HistorialNotasPage: React.FC<Props> = ({ onVolver }) => {
  const [cursoSeleccionado, setCursoSeleccionado] = useState<number | null>(
    null
  );
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<number | null>(
    null
  );
  const anio = new Date().getFullYear().toString();

  const { cursos, loading: loadingCursos } = useCursos();
  const { alumnos, loading: loadingAlumnos } = useAlumnosPorCurso(
    cursoSeleccionado,
    anio
  );
  const {
    agrupadas,
    loading: loadingHistorial,
    error,
    promedioGeneral,
  } = useHistorialNotas(alumnoSeleccionado, anio);

  const alumnoInfo = alumnos.find((a) => a.id_alumno === alumnoSeleccionado);
  const cursoInfo = cursos.find((c) => c.id_curso === cursoSeleccionado);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900">
            Historial de Notas del Alumno
          </h2>
          <p className="text-sm text-gray-600">
            Selecciona un curso y luego un alumno para ver su historial completo
          </p>
        </div>
        {onVolver && (
          <button
            onClick={onVolver}
            className="px-3 py-2 text-sm rounded border border-gray-300 hover:bg-gray-100"
          >
            Volver
          </button>
        )}
      </div>

      {/* Filtros */}
      <FiltrosHistorial
        cursos={cursos}
        loadingCursos={loadingCursos}
        alumnos={alumnos}
        loadingAlumnos={loadingAlumnos}
        cursoSeleccionado={cursoSeleccionado}
        alumnoSeleccionado={alumnoSeleccionado}
        onChangeCurso={setCursoSeleccionado}
        onChangeAlumno={setAlumnoSeleccionado}
        anio={anio}
      />

      {/* Info Alumno */}
      {alumnoInfo && cursoInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-semibold">
            {alumnoInfo.nombre.charAt(0)}
            {alumnoInfo.apellido.charAt(0)}
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900">
              {alumnoInfo.nombre} {alumnoInfo.apellido}
            </p>
            <p className="text-gray-600 text-xs">
              {cursoInfo.nombre}{' '}
              {cursoInfo.seccion ? `"${cursoInfo.seccion}"` : ''} • Año {anio}
            </p>
            {Object.keys(agrupadas).length > 0 && (
              <p className="text-xs mt-1 text-gray-700">
                Promedio general:{' '}
                <span className="font-semibold">
                  {promedioGeneral.toFixed(2)}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {loadingHistorial && alumnoSeleccionado && (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-10 w-10 rounded-full border-2 border-b-transparent border-blue-600" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
          {error}
        </div>
      )}

      {/* Historial */}
      {!loadingHistorial &&
        alumnoSeleccionado &&
        Object.keys(agrupadas).length > 0 && (
          <NotasAgrupadasPorAsignaturaComponent agrupadas={agrupadas} />
        )}

      {/* Empty */}
      {!loadingHistorial &&
        alumnoSeleccionado &&
        Object.keys(agrupadas).length === 0 && (
          <div className="text-center py-12 text-sm">
            <p className="text-gray-600">
              No hay notas registradas para este alumno.
            </p>
          </div>
        )}

      {/* Initial guidance */}
      {!alumnoSeleccionado && (
        <div className="text-center py-12 text-sm text-gray-600">
          Selecciona un curso y un alumno para iniciar.
        </div>
      )}
    </div>
  );
};
