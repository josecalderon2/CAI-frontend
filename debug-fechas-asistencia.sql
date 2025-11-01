-- 🔍 DEBUG: Verificar fechas guardadas en la base de datos
-- Ejecuta estas queries en tu cliente SQL para ver qué está pasando

-- 1️⃣ Ver todas las asistencias del curso 1 (con sus fechas exactas)
SELECT 
  id_asistencia,
  id_alumno,
  estado,
  fecha,
  DATE(fecha) as fecha_solo_dia,
  TIME(fecha) as hora,
  TIMESTAMPDIFF(HOUR, fecha, UTC_TIMESTAMP()) as horas_diff_utc,
  anio_academico,
  trimestre,
  creadoEn
FROM asistencia
WHERE id_alumno IN (
  SELECT alumnoId 
  FROM alumnoCurso 
  WHERE cursoId = 1 AND estado = 'ACTIVO'
)
ORDER BY fecha DESC
LIMIT 20;

-- 2️⃣ Ver asistencias del 31 de octubre de 2025 (diferentes interpretaciones de fecha)
SELECT 
  id_asistencia,
  id_alumno,
  estado,
  fecha,
  '2025-10-31' as fecha_buscada,
  CASE 
    WHEN DATE(fecha) = '2025-10-31' THEN '✅ Coincide'
    ELSE '❌ No coincide'
  END as match_fecha
FROM asistencia
WHERE id_alumno IN (
  SELECT alumnoId 
  FROM alumnoCurso 
  WHERE cursoId = 1 AND estado = 'ACTIVO'
)
AND fecha >= '2025-10-31 00:00:00'
AND fecha <= '2025-10-31 23:59:59'
ORDER BY fecha DESC;

-- 3️⃣ Ver con el rango que usa el backend (zona horaria UTC-6)
SELECT 
  id_asistencia,
  id_alumno,
  estado,
  fecha,
  '2025-10-31T06:00:00.000Z' as rango_inicio_backend,
  '2025-11-01T05:59:59.999Z' as rango_fin_backend
FROM asistencia
WHERE id_alumno IN (
  SELECT alumnoId 
  FROM alumnoCurso 
  WHERE cursoId = 1 AND estado = 'ACTIVO'
)
AND fecha >= '2025-10-31T06:00:00.000Z'
AND fecha <= '2025-11-01T05:59:59.999Z'
ORDER BY fecha DESC;

-- 4️⃣ Contar asistencias por día (últimos 30 días)
SELECT 
  DATE(fecha) as dia,
  COUNT(*) as cantidad_registros,
  GROUP_CONCAT(DISTINCT estado) as estados
FROM asistencia
WHERE id_alumno IN (
  SELECT alumnoId 
  FROM alumnoCurso 
  WHERE cursoId = 1 AND estado = 'ACTIVO'
)
AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(fecha)
ORDER BY dia DESC;

-- 5️⃣ Ver la configuración de zona horaria del servidor
SELECT @@global.time_zone as zona_global, 
       @@session.time_zone as zona_sesion,
       NOW() as hora_servidor,
       UTC_TIMESTAMP() as hora_utc;
