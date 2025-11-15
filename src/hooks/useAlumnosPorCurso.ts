import { useState, useEffect } from 'react';
import { historialNotasService } from '../api/services/historialNotasService';
import type { AlumnoHistorial } from '../types/historial-notas.types';

export const useAlumnosPorCurso = (cursoId: number | null, anio?: string) => {
  const [alumnos, setAlumnos] = useState<AlumnoHistorial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cursoId) {
      setAlumnos([]);
      return;
    }
    const fetchAlumnos = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await historialNotasService.getAlumnosPorCurso(
          cursoId,
          anio
        );
        setAlumnos(data.alumnos);
      } catch (err: any) {
        setError('Error al cargar alumnos del curso');
        console.error('Error alumnos curso:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlumnos();
  }, [cursoId, anio]);

  return { alumnos, loading, error };
};
