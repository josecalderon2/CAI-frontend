import React from 'react';
import type {
  CursoHistorial,
  AlumnoHistorial,
} from '../../types/historial-notas.types';

interface Props {
  cursos: CursoHistorial[];
  loadingCursos: boolean;
  alumnos: AlumnoHistorial[];
  loadingAlumnos: boolean;
  cursoSeleccionado: number | null;
  alumnoSeleccionado: number | null;
  onChangeCurso: (cursoId: number | null) => void;
  onChangeAlumno: (alumnoId: number | null) => void;
  anio: string;
}

export const FiltrosHistorial: React.FC<Props> = ({
  cursos,
  loadingCursos,
  alumnos,
  loadingAlumnos,
  cursoSeleccionado,
  alumnoSeleccionado,
  onChangeCurso,
  onChangeAlumno,
  anio,
}) => {
  const handleCursoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChangeCurso(value ? Number(value) : null);
    onChangeAlumno(null); // reset alumno al cambiar curso
  };

  const handleAlumnoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChangeAlumno(value ? Number(value) : null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6 border border-gray-200">
      <h2 className="text-sm font-semibold mb-3 text-gray-900">Filtros</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Curso */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Curso
          </label>
          <select
            value={cursoSeleccionado || ''}
            onChange={handleCursoChange}
            disabled={loadingCursos}
            className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="">-- Selecciona --</option>
            {cursos.map((c) => (
              <option key={c.id_curso} value={c.id_curso}>
                {c.nombre} {c.seccion ? `"${c.seccion}"` : ''}
              </option>
            ))}
          </select>
          {loadingCursos && (
            <p className="text-xs text-gray-500 mt-1">Cargando cursos...</p>
          )}
        </div>

        {/* Alumno */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Alumno
          </label>
          <select
            value={alumnoSeleccionado || ''}
            onChange={handleAlumnoChange}
            disabled={!cursoSeleccionado || loadingAlumnos}
            className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="">
              {!cursoSeleccionado
                ? 'Selecciona un curso primero'
                : 'Selecciona un alumno'}
            </option>
            {alumnos.map((a) => (
              <option key={a.id_alumno} value={a.id_alumno}>
                {a.apellido}, {a.nombre}
              </option>
            ))}
          </select>
          {loadingAlumnos && cursoSeleccionado && (
            <p className="text-xs text-gray-500 mt-1">Cargando alumnos...</p>
          )}
        </div>

        {/* Año Académico (solo display) */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Año Académico
          </label>
          <input
            type="text"
            value={anio}
            disabled
            className="w-full px-2 py-2 text-sm border border-gray-300 rounded bg-gray-100 text-gray-600"
          />
        </div>
      </div>

      {/* Estado */}
      {cursoSeleccionado && alumnoSeleccionado && (
        <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded">
          <p className="text-xs text-green-700">
            ✓ Mostrando historial del alumno seleccionado
          </p>
        </div>
      )}
    </div>
  );
};
