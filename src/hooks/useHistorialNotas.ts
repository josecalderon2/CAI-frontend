import { useState, useEffect, useMemo } from 'react';
import { historialNotasService } from '../api/services/historialNotasService';
import type {
  NotaHistorial,
  NotasAgrupadasPorAsignatura,
} from '../types/historial-notas.types';

export const useHistorialNotas = (alumnoId: number | null, anio?: string) => {
  const [notas, setNotas] = useState<NotaHistorial[]>([]);
  const [agrupadas, setAgrupadas] = useState<NotasAgrupadasPorAsignatura>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!alumnoId) {
      setNotas([]);
      setAgrupadas({});
      return;
    }
    const fetchHistorial = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await historialNotasService.getHistorialNotas(
          alumnoId,
          anio
        );
        setNotas(data);
        const grouped: NotasAgrupadasPorAsignatura = {};
        data.forEach((n) => {
          const key = n.asignatura.nombre;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(n);
        });
        setAgrupadas(grouped);
      } catch (err: any) {
        setError('Error al cargar historial de notas');
        console.error('Error historial notas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistorial();
  }, [alumnoId, anio]);

  const promedioGeneral = useMemo(() => {
    if (notas.length === 0) return 0;
    const suma = notas.reduce((acc, n) => acc + n.calificacion, 0);
    return parseFloat((suma / notas.length).toFixed(2));
  }, [notas]);

  return { notas, agrupadas, loading, error, promedioGeneral };
};
