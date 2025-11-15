import React, { useState } from 'react';
import type {
  NotasAgrupadasPorAsignatura,
  NotaHistorial,
} from '../../types/historial-notas.types';

interface Props {
  agrupadas: NotasAgrupadasPorAsignatura;
}

export const NotasAgrupadasPorAsignaturaComponent: React.FC<Props> = ({
  agrupadas,
}) => {
  const [open, setOpen] = useState<string | null>(null);

  const toggle = (key: string) => setOpen(open === key ? null : key);

  const promedioAsignatura = (notas: NotaHistorial[]) => {
    if (notas.length === 0) return 0;
    const suma = notas.reduce((acc, n) => acc + n.calificacion, 0);
    return parseFloat((suma / notas.length).toFixed(2));
  };

  const colorNota = (n: number) => {
    if (n >= 7) return 'text-green-600 bg-green-50';
    if (n >= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold text-gray-900">
          Historial por Asignatura
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {Object.keys(agrupadas).length} asignatura(s) con notas registradas
        </p>
      </div>
      <div className="divide-y">
        {Object.entries(agrupadas).map(([asig, notas]) => {
          const prom = promedioAsignatura(notas);
          const abierto = open === asig;
          return (
            <div key={asig} className="border-l-4 border-purple-500">
              <button
                onClick={() => toggle(asig)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{abierto ? '📂' : '📁'}</span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{asig}</p>
                    <p className="text-xs text-gray-500">
                      {notas.length} evaluación(es)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className={`px-2 py-1 rounded text-sm font-semibold ${colorNota(prom)}`}
                  >
                    {prom.toFixed(2)}
                  </div>
                  <span className="text-xs text-gray-400">
                    {abierto ? '▼' : '▶'}
                  </span>
                </div>
              </button>
              {abierto && (
                <div className="bg-gray-50 px-4 pb-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase">
                        <th className="py-2 text-left">Evaluación</th>
                        <th className="py-2 text-left">Tipo</th>
                        <th className="py-2 text-left">Trimestre</th>
                        <th className="py-2 text-left">Mes</th>
                        <th className="py-2 text-left">Calificación</th>
                        <th className="py-2 text-left">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notas.map((n) => (
                        <tr
                          key={n.id_nota}
                          className="border-t border-gray-200 hover:bg-white"
                        >
                          <td className="py-2 font-medium text-gray-900">
                            {n.evaluacion.nombre}
                          </td>
                          <td className="py-2 text-gray-600">
                            <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                              {n.evaluacion.tipoEvaluacion.nombre}
                            </span>
                          </td>
                          <td className="py-2 text-gray-600">
                            {n.evaluacion.trimestre
                              ? `T${n.evaluacion.trimestre}`
                              : '-'}
                          </td>
                          <td className="py-2 text-gray-600">
                            {n.evaluacion.mes
                              ? new Date(
                                  2025,
                                  n.evaluacion.mes - 1
                                ).toLocaleDateString('es', { month: 'long' })
                              : '-'}
                          </td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-1 rounded font-semibold ${colorNota(n.calificacion)}`}
                            >
                              {n.calificacion.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-2 text-gray-600">
                            {new Date(n.fecha_registro).toLocaleDateString(
                              'es'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
