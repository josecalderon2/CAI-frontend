import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { X } from 'lucide-react';
import type { Curso } from '../../api/services/cursosService';

interface Props {
  cursos: Curso[];
  loadingCursos: boolean;
  filtros: {
    cursoId?: number;
    anio: string;
  };
  onChangeFiltro: (key: string, value: any) => void;
  onLimpiarFiltros: () => void;
}

export function FiltrosEvaluaciones({
  cursos,
  loadingCursos,
  filtros,
  onChangeFiltro,
  onLimpiarFiltros,
}: Props) {
  const [cursoSeleccionado, setCursoSeleccionado] = useState<Curso | null>(
    null
  );

  useEffect(() => {
    if (filtros.cursoId && cursos.length > 0) {
      const curso = cursos.find((c) => c.id_curso === filtros.cursoId);
      setCursoSeleccionado(curso || null);
    } else {
      setCursoSeleccionado(null);
    }
  }, [filtros.cursoId, cursos]);

  const handleCursoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChangeFiltro('cursoId', value ? Number(value) : undefined);
  };

  const handleAnioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeFiltro('anio', e.target.value);
  };

  const removerFiltroCurso = () => {
    onChangeFiltro('cursoId', undefined);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Filtro de Curso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Curso
            </label>
            <select
              value={filtros.cursoId || ''}
              onChange={handleCursoChange}
              disabled={loadingCursos}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Todos los cursos</option>
              {cursos.map((curso) => (
                <option key={curso.id_curso} value={curso.id_curso}>
                  {curso.nombre}
                  {curso.seccion ? ` - ${curso.seccion}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Año */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Año Académico
            </label>
            <select
              value={filtros.anio}
              onChange={handleAnioChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>

          {/* Botón Limpiar Filtros */}
          <div className="flex items-end">
            <Button
              onClick={onLimpiarFiltros}
              variant="outline"
              className="w-full"
            >
              🗑️ Limpiar Filtros
            </Button>
          </div>
        </div>

        {filtros.cursoId && cursoSeleccionado && (
          <div className="mt-3">
            <Badge
              variant="secondary"
              className="flex items-center gap-1 w-fit"
            >
              {cursoSeleccionado.nombre}
              {cursoSeleccionado.seccion && ` - ${cursoSeleccionado.seccion}`}
              <button onClick={removerFiltroCurso} className="ml-1">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
