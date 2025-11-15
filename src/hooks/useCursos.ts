import { useState, useEffect } from 'react';
import { historialNotasService } from '../api/services/historialNotasService';
import type { CursoHistorial } from '../types/historial-notas.types';

export const useCursos = () => {
  const [cursos, setCursos] = useState<CursoHistorial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCursos = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await historialNotasService.getCursos();
        setCursos(data);
      } catch (err: any) {
        setError('Error al cargar cursos');
        console.error('Error cursos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCursos();
  }, []);

  return { cursos, loading, error };
};
