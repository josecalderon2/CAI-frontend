-- =====================================================
-- CONSULTAS DE DEBUG PARA CURSOS Y ASIGNATURAS
-- Usuario: Orientador ID = 1
-- Basado en schema.prisma del proyecto CAI
-- =====================================================

-- ============================================================
-- PASO 1: VERIFICAR DATOS DEL ORIENTADOR
-- ============================================================
-- Esta consulta verifica que el orientador existe y está activo
SELECT 
    id_orientador,
    nombre,
    apellido,
    email,
    activo,
    id_cargo_administrativo,
    "createdAt",
    "updatedAt"
FROM orientadores
WHERE id_orientador = 1;
-- Resultado esperado: 1 fila con los datos del orientador
-- Si no hay resultados: El orientador ID=1 no existe

-- ============================================================
-- PASO 2: VER TODOS LOS CURSOS DEL SISTEMA
-- ============================================================
SELECT 
    c.id_curso,
    c.nombre AS curso_nombre,
    c.seccion,
    c.aula,
    c.activo,
    c.id_orientador,
    c.anio_academico,
    o.nombre AS orientador_nombre,
    o.apellido AS orientador_apellido,
    o.email AS orientador_email,
    ga.nombre AS grado_nombre
FROM "Curso" c
LEFT JOIN orientadores o ON c.id_orientador = o.id_orientador
LEFT JOIN "Grado_Academico" ga ON c.id_grado_academico = ga.id_grado_academico
WHERE c.activo = true
ORDER BY c.id_curso;
-- Resultado esperado: Lista de todos los cursos activos
-- Busca si alguno tiene id_orientador = 1

-- Resultado esperado: Lista de todos los cursos activos
-- Busca si alguno tiene id_orientador = 1

-- ============================================================
-- PASO 3: CURSOS DIRECTAMENTE ASIGNADOS AL ORIENTADOR ID=1
-- ============================================================
-- Método 1: Por campo id_orientador directo en tabla Curso
SELECT 
    c.id_curso,
    c.nombre,
    c.seccion,
    c.id_orientador,
    c.activo,
    c.anio_academico,
    ga.nombre AS grado_nombre
FROM "Curso" c
LEFT JOIN "Grado_Academico" ga ON c.id_grado_academico = ga.id_grado_academico
WHERE 
    c.id_orientador = 1
    AND c.activo = true
ORDER BY c.id_curso;
-- Resultado esperado: Cursos donde el orientador ID=1 es el orientador titular
-- Si está vacío: No hay cursos asignados directamente

-- ============================================================
-- PASO 4: ASIGNATURAS DE ESOS CURSOS
-- ============================================================
-- Ver si los cursos del orientador tienen asignaturas creadas
SELECT 
    a.id_asignatura,
    a.nombre AS asignatura_nombre,
    a.id_curso,
    c.nombre AS curso_nombre,
    c.seccion,
    c.id_orientador
FROM "Asignatura" a
INNER JOIN "Curso" c ON a.id_curso = c.id_curso
WHERE 
    c.id_orientador = 1
    AND c.activo = true
ORDER BY a.id_curso, a.id_asignatura;
-- Resultado esperado: Lista de asignaturas de los cursos del orientador
-- Si está vacío: Los cursos no tienen asignaturas creadas ⚠️

-- ============================================================
-- PASO 5: VERIFICAR AsignaturaOrientador (docentes por asignatura)
-- ============================================================
-- El orientador puede estar asignado a asignaturas específicas
SELECT 
    ao.id_asignatura_orientador,
    ao.id_asignatura,
    ao.id_orientador,
    ao.anio_academico,
    ao.activo,
    ao.fecha_asignacion,
    ao.fecha_fin,
    a.nombre AS asignatura_nombre,
    c.id_curso,
    c.nombre AS curso_nombre,
    c.seccion
FROM "AsignaturaOrientador" ao
INNER JOIN "Asignatura" a ON ao.id_asignatura = a.id_asignatura
INNER JOIN "Curso" c ON a.id_curso = c.id_curso
WHERE 
    ao.id_orientador = 1
    AND ao.activo = true
    AND c.activo = true
ORDER BY ao.id_asignatura;
-- Resultado esperado: Asignaturas donde el orientador ID=1 da clases
-- Si está vacío: No está asignado como docente de ninguna asignatura

-- ============================================================
-- PASO 6: VERIFICAR Historial_curso_orientador
-- ============================================================
-- Verificar asignaciones históricas vigentes
SELECT 
    hco.id_historial_curso_orientador,
    hco.id_curso,
    hco.id_orientador,
    hco.es_orientador,
    hco.id_asignatura,
    hco.anio_academico,
    hco.fecha_asignacion,
    hco.fecha_fin,
    c.nombre AS curso_nombre,
    c.seccion,
    a.nombre AS asignatura_nombre
FROM "Historial_curso_orientador" hco
INNER JOIN "Curso" c ON hco.id_curso = c.id_curso
LEFT JOIN "Asignatura" a ON hco.id_asignatura = a.id_asignatura
WHERE 
    hco.id_orientador = 1
    AND c.activo = true
    AND (hco.fecha_fin IS NULL OR hco.fecha_fin > CURRENT_DATE)
ORDER BY hco.anio_academico DESC, hco.id_curso;
-- Resultado esperado: Historial de asignaciones vigentes
-- Si está vacío: No hay asignaciones históricas activas

-- ============================================================
-- PASO 7: CONSULTA CONSOLIDADA - TODOS LOS CURSOS DEL ORIENTADOR
-- ============================================================
-- Esta es la consulta que debería usar el endpoint /cursos/asignados/:id
SELECT DISTINCT
    c.id_curso,
    c.nombre,
    c.seccion,
    c.descripcion,
    c.id_grado_academico,
    c.id_orientador,
    c.cupo,
    c.aula,
    c.activo,
    c.anio_academico,
    ga.nombre AS grado_nombre
FROM "Curso" c
LEFT JOIN "Grado_Academico" ga ON c.id_grado_academico = ga.id_grado_academico
WHERE 
    c.activo = true
    AND (
        -- Opción 1: Es orientador titular del curso
        c.id_orientador = 1
        
        OR
        
        -- Opción 2: Está en el historial como orientador o docente (vigente)
        EXISTS (
            SELECT 1 
            FROM "Historial_curso_orientador" hco
            WHERE hco.id_curso = c.id_curso
                AND hco.id_orientador = 1
                AND (hco.fecha_fin IS NULL OR hco.fecha_fin > CURRENT_DATE)
        )
        
        OR
        
        -- Opción 3: Está asignado a alguna asignatura del curso
        EXISTS (
            SELECT 1
            FROM "Asignatura" a
            INNER JOIN "AsignaturaOrientador" ao ON a.id_asignatura = ao.id_asignatura
            WHERE a.id_curso = c.id_curso
                AND ao.id_orientador = 1
                AND ao.activo = true
        )
    )
ORDER BY c.id_curso;
-- Resultado esperado: Todos los cursos donde el orientador ID=1 tiene algún rol
-- Para ver las asignaturas de cada curso, usa el PASO 4

-- PASO 7B: Ver asignaturas por curso (ejecuta después del PASO 7)
SELECT 
    c.id_curso,
    c.nombre AS curso_nombre,
    a.id_asignatura,
    a.nombre AS asignatura_nombre
FROM "Curso" c
LEFT JOIN "Asignatura" a ON a.id_curso = c.id_curso
WHERE c.id_curso IN (
    SELECT DISTINCT c2.id_curso
    FROM "Curso" c2
    WHERE c2.activo = true AND (
        c2.id_orientador = 1
        OR EXISTS (
            SELECT 1 FROM "Historial_curso_orientador" hco
            WHERE hco.id_curso = c2.id_curso AND hco.id_orientador = 1
                AND (hco.fecha_fin IS NULL OR hco.fecha_fin > CURRENT_DATE)
        )
        OR EXISTS (
            SELECT 1 FROM "Asignatura" a2
            INNER JOIN "AsignaturaOrientador" ao ON a2.id_asignatura = ao.id_asignatura
            WHERE a2.id_curso = c2.id_curso AND ao.id_orientador = 1 AND ao.activo = true
        )
    )
)
ORDER BY c.id_curso, a.id_asignatura;
-- ⚠️ IMPORTANTE: Si un curso no tiene asignaturas, aparecerá con id_asignatura = NULL

-- ============================================================
-- PASO 8: RESUMEN ESTADÍSTICO
-- ============================================================
-- Cuántos cursos tiene el orientador por cada método
SELECT 
    'Cursos como orientador titular' AS tipo,
    COUNT(*) AS cantidad
FROM "Curso" c
WHERE c.id_orientador = 1 AND c.activo = true

UNION ALL

SELECT 
    'Cursos por AsignaturaOrientador' AS tipo,
    COUNT(DISTINCT c.id_curso) AS cantidad
FROM "AsignaturaOrientador" ao
INNER JOIN "Asignatura" a ON ao.id_asignatura = a.id_asignatura
INNER JOIN "Curso" c ON a.id_curso = c.id_curso
WHERE ao.id_orientador = 1 AND ao.activo = true AND c.activo = true

UNION ALL

SELECT 
    'Cursos por Historial vigente' AS tipo,
    COUNT(DISTINCT hco.id_curso) AS cantidad
FROM "Historial_curso_orientador" hco
INNER JOIN "Curso" c ON hco.id_curso = c.id_curso
WHERE hco.id_orientador = 1 
    AND c.activo = true
    AND (hco.fecha_fin IS NULL OR hco.fecha_fin > CURRENT_DATE)

UNION ALL

SELECT 
    'Total cursos únicos (combinados)' AS tipo,
    COUNT(DISTINCT c.id_curso) AS cantidad
FROM "Curso" c
WHERE c.activo = true
    AND (
        c.id_orientador = 1
        OR EXISTS (
            SELECT 1 FROM "Historial_curso_orientador" hco
            WHERE hco.id_curso = c.id_curso AND hco.id_orientador = 1
                AND (hco.fecha_fin IS NULL OR hco.fecha_fin > CURRENT_DATE)
        )
        OR EXISTS (
            SELECT 1 FROM "Asignatura" a
            INNER JOIN "AsignaturaOrientador" ao ON a.id_asignatura = ao.id_asignatura
            WHERE a.id_curso = c.id_curso AND ao.id_orientador = 1 AND ao.activo = true
        )
    );
-- Resultado esperado: Tabla resumen con cantidades por cada método

-- ============================================================
-- PASO 9: VER ALUMNOS DE UN CURSO ESPECÍFICO
-- ============================================================
-- Reemplaza el número 1 en WHERE con el ID del curso que quieras verificar
SELECT 
    a.id_alumno,
    a.nombre,
    a.apellido,
    COALESCE(a."numeroMatricula", 'N/A') AS rut,
    a.activo,
    ac.estado,
    ac."anioAcademico",
    ac."fechaInscripcion"
FROM "Alumno" a
INNER JOIN "AlumnoCurso" ac ON a.id_alumno = ac."alumnoId"
WHERE 
    ac."cursoId" = 1  -- ⚠️ CAMBIA ESTE NÚMERO por el id_curso del PASO 7
    AND ac.estado = 'ACTIVO'
    AND a.activo = true
ORDER BY a.apellido, a.nombre;
-- Resultado esperado: Lista de alumnos activos del curso
-- Si está vacío: El curso no tiene alumnos inscritos

-- ============================================================
-- PASO 10: DIAGNÓSTICO - ¿POR QUÉ NO APARECEN CURSOS?
-- ============================================================
-- Esta consulta te dice exactamente qué falta
SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM orientadores WHERE id_orientador = 1) 
        THEN '❌ El orientador ID=1 no existe'
        WHEN NOT EXISTS (SELECT 1 FROM orientadores WHERE id_orientador = 1 AND activo = true) 
        THEN '❌ El orientador ID=1 existe pero está inactivo'
        WHEN NOT EXISTS (SELECT 1 FROM "Curso" WHERE activo = true) 
        THEN '❌ No hay cursos activos en el sistema'
        WHEN NOT EXISTS (
            SELECT 1 FROM "Curso" c 
            WHERE c.activo = true AND (
                c.id_orientador = 1
                OR EXISTS (SELECT 1 FROM "Historial_curso_orientador" hco WHERE hco.id_curso = c.id_curso AND hco.id_orientador = 1)
                OR EXISTS (
                    SELECT 1 FROM "Asignatura" a
                    INNER JOIN "AsignaturaOrientador" ao ON a.id_asignatura = ao.id_asignatura
                    WHERE a.id_curso = c.id_curso AND ao.id_orientador = 1 AND ao.activo = true
                )
            )
        ) THEN '❌ El orientador ID=1 no tiene cursos asignados (ni directamente, ni por historial, ni por asignaturas)'
        WHEN NOT EXISTS (
            SELECT 1 FROM "Curso" c
            INNER JOIN "Asignatura" a ON a.id_curso = c.id_curso
            WHERE c.activo = true AND (
                c.id_orientador = 1
                OR EXISTS (SELECT 1 FROM "Historial_curso_orientador" hco WHERE hco.id_curso = c.id_curso AND hco.id_orientador = 1)
                OR EXISTS (
                    SELECT 1 FROM "AsignaturaOrientador" ao 
                    WHERE ao.id_asignatura = a.id_asignatura AND ao.id_orientador = 1 AND ao.activo = true
                )
            )
        ) THEN '⚠️ El orientador tiene cursos asignados PERO ninguno tiene asignaturas creadas'
        ELSE '✅ Todo está correcto - El orientador tiene cursos con asignaturas'
    END AS diagnostico;

-- ============================================================
-- PASO 11: CREAR DATOS DE PRUEBA (SI TODO ESTÁ VACÍO)
-- ============================================================
-- ⚠️ SOLO EJECUTA ESTO SI NO HAY DATOS Y QUIERES PROBAR

-- Paso 11.1: Verificar si existe un grado académico
-- SELECT * FROM "Grado_Academico" LIMIT 1;

-- Paso 11.2: Crear un curso de prueba para el orientador ID=1
/*
INSERT INTO "Curso" (nombre, seccion, descripcion, id_grado_academico, id_orientador, cupo, aula, activo, anio_academico)
VALUES 
    ('Matemáticas Avanzadas', 'A', 'Curso de matemáticas nivel avanzado', 1, 1, 30, 'Aula 101', true, '2025')
RETURNING id_curso;
*/

-- Paso 11.3: Crear asignaturas para ese curso (reemplaza :id_curso con el ID del paso anterior)
/*
INSERT INTO "Asignatura" (nombre, id_curso)
VALUES 
    ('Álgebra', :id_curso),
    ('Geometría', :id_curso),
    ('Cálculo', :id_curso)
RETURNING id_asignatura, nombre;
*/

-- Paso 11.4: Asignar el orientador a las asignaturas
/*
INSERT INTO "AsignaturaOrientador" (id_asignatura, id_orientador, anio_academico, activo)
SELECT 
    a.id_asignatura,
    1 AS id_orientador,
    '2025' AS anio_academico,
    true AS activo
FROM "Asignatura" a
WHERE a.id_curso = :id_curso;
*/

-- ============================================================
-- INSTRUCCIONES DE USO
-- ============================================================
/*
1. Ejecuta las consultas en orden (PASO 1 a PASO 10)
2. Anota los resultados de cada paso
3. El PASO 10 te dará el diagnóstico exacto del problema
4. Si todo está vacío, puedes usar el PASO 11 para crear datos de prueba
5. Comparte los resultados con el equipo para solucionar el problema

RESULTADO ESPERADO PARA QUE FUNCIONE EL FRONTEND:
- PASO 1: 1 fila (orientador existe y está activo)
- PASO 7: Al menos 1 fila con asignaturas != NULL en el JSON
- PASO 9: Al menos 1 alumno en el curso

Si PASO 7 devuelve filas pero asignaturas es NULL:
  → Los cursos existen pero NO tienen asignaturas creadas
  → SOLUCIÓN: Crear asignaturas para esos cursos

Si PASO 7 está vacío:
  → El orientador no tiene cursos asignados
  → SOLUCIÓN: Asignar cursos al orientador o crear nuevos cursos
*/
