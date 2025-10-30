import * as XLSX from 'xlsx';
import type {
  ResumenTrimestralResponse,
  InfraccionResumen,
  CategoriaInfraccion,
} from '../api/services/asistenciaService';

interface ExcelData {
  resumen: ResumenTrimestralResponse[];
  nombreCurso: string;
  trimestre: number;
  anio: number;
}

/**
 * Genera un archivo Excel con el formato especificado para el resumen trimestral
 *
 * Estructura:
 * - Fila 1: Título general (combinada A-K)
 * - Fila 2: Categorías principales (TRIMESTRE, INASISTENCIAS, FALTAS, CÁLCULO CONDUCTA)
 * - Fila 3: Subcategorías (Menos Graves, Graves, Muy Graves)
 * - Fila 4: Columnas específicas de datos
 * - Fila 5+: Datos de alumnos
 */
export function generarExcelResumenTrimestral(data: ExcelData): void {
  const { resumen, nombreCurso, trimestre, anio } = data;

  // Crear un nuevo libro de trabajo
  const wb = XLSX.utils.book_new();

  // Nombre de los trimestres
  const nombresTrimestre = [
    'PRIMER TRIMESTRE (ENERO - ABRIL)',
    'SEGUNDO TRIMESTRE (MAYO - AGOSTO)',
    'TERCER TRIMESTRE (SEPTIEMBRE - DICIEMBRE)',
  ];

  // Crear los datos del Excel
  const ws_data: any[][] = [];

  // ============================================
  // FILA 1: Título general (combinada A-K)
  // ============================================
  ws_data.push([
    `RESUMEN ${nombresTrimestre[trimestre - 1]} - ${nombreCurso.toUpperCase()} - AÑO ${anio}`,
  ]);

  // ============================================
  // FILA 2: Categorías principales
  // ============================================
  ws_data.push([
    nombresTrimestre[trimestre - 1], // A-B combinadas
    '',
    'INASISTENCIAS', // C-D combinadas
    '',
    'FALTAS', // E-J combinadas
    '',
    '',
    '',
    '',
    '',
    'CÁLCULO CONDUCTA', // K (combinada verticalmente 2-4)
  ]);

  // ============================================
  // FILA 3: Subcategorías
  // ============================================
  ws_data.push([
    'No', // A (combinada verticalmente 3-4)
    'NOMBRE', // B (combinada verticalmente 3-4)
    'P', // C (combinada verticalmente 3-4)
    'SP', // D (combinada verticalmente 3-4)
    'Menos Graves', // E-F combinadas
    '',
    'Graves', // G-H combinadas
    '',
    'Muy Graves', // I-J combinadas
    '',
    '', // K (ya está en fila 2)
  ]);

  // ============================================
  // FILA 4: Columnas de datos específicas
  // ============================================
  ws_data.push([
    '', // A (ya está en fila 3)
    '', // B (ya está en fila 3)
    '', // C (ya está en fila 3)
    '', // D (ya está en fila 3)
    'Cant.', // E
    'Artículo', // F
    'Cant.', // G
    'Artículo', // H
    'Cant.', // I
    'Artículo', // J
    '', // K (ya está en fila 2)
  ]);

  // ============================================
  // FILAS 5+: Datos de alumnos
  // ============================================
  resumen.forEach((alumno, index) => {
    // Agrupar infracciones por categoría
    const infraccionesPorCategoria: Record<
      CategoriaInfraccion,
      InfraccionResumen[]
    > = {
      MENOS_GRAVE: [],
      GRAVE: [],
      MUY_GRAVE: [],
    };

    alumno.infracciones.forEach((inf) => {
      infraccionesPorCategoria[inf.categoria].push(inf);
    });

    // ✅ Obtener cantidades y artículos con protección contra undefined
    const menosGravesCount = infraccionesPorCategoria.MENOS_GRAVE.reduce(
      (sum, inf) => sum + (inf.cantidad ?? 1),
      0
    );
    const menosGravesArticulos = infraccionesPorCategoria.MENOS_GRAVE.map(
      (inf) => `${inf.articulo}: ${inf.descripcion} (${inf.cantidad ?? 1})`
    ).join(' | ');

    const gravesCount = infraccionesPorCategoria.GRAVE.reduce(
      (sum, inf) => sum + (inf.cantidad ?? 1),
      0
    );
    const gravesArticulos = infraccionesPorCategoria.GRAVE.map(
      (inf) => `${inf.articulo}: ${inf.descripcion} (${inf.cantidad ?? 1})`
    ).join(' | ');

    const muyGravesCount = infraccionesPorCategoria.MUY_GRAVE.reduce(
      (sum, inf) => sum + (inf.cantidad ?? 1),
      0
    );
    const muyGravesArticulos = infraccionesPorCategoria.MUY_GRAVE.map(
      (inf) => `${inf.articulo}: ${inf.descripcion} (${inf.cantidad ?? 1})`
    ).join(' | ');

    ws_data.push([
      index + 1, // A: No
      `${alumno.nombre} ${alumno.apellido}`, // B: NOMBRE
      alumno.justificadas, // C: P (justificadas)
      alumno.injustificadas, // D: SP (injustificadas)
      menosGravesCount || '', // E: Cantidad Menos Graves
      menosGravesArticulos || '-', // F: Artículos Menos Graves
      gravesCount || '', // G: Cantidad Graves
      gravesArticulos || '-', // H: Artículos Graves
      muyGravesCount || '', // I: Cantidad Muy Graves
      muyGravesArticulos || '-', // J: Artículos Muy Graves
      (alumno.puntajeConducta ?? 10).toFixed(1), // K: CÁLCULO CONDUCTA
    ]);
  });

  // Crear la hoja de cálculo
  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // ============================================
  // COMBINAR CELDAS
  // ============================================
  if (!ws['!merges']) ws['!merges'] = [];

  // Fila 1: A1:K1 (Título general)
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } });

  // Fila 2: Categorías principales
  ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }); // A2:B2 (TRIMESTRE)
  ws['!merges'].push({ s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }); // C2:D2 (INASISTENCIAS)
  ws['!merges'].push({ s: { r: 1, c: 4 }, e: { r: 1, c: 9 } }); // E2:J2 (FALTAS)
  ws['!merges'].push({ s: { r: 1, c: 10 }, e: { r: 3, c: 10 } }); // K2:K4 (CÁLCULO CONDUCTA vertical)

  // Fila 3: Subcategorías y columnas verticales
  ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 3, c: 0 } }); // A3:A4 (No)
  ws['!merges'].push({ s: { r: 2, c: 1 }, e: { r: 3, c: 1 } }); // B3:B4 (NOMBRE)
  ws['!merges'].push({ s: { r: 2, c: 2 }, e: { r: 3, c: 2 } }); // C3:C4 (P)
  ws['!merges'].push({ s: { r: 2, c: 3 }, e: { r: 3, c: 3 } }); // D3:D4 (SP)
  ws['!merges'].push({ s: { r: 2, c: 4 }, e: { r: 2, c: 5 } }); // E3:F3 (Menos Graves)
  ws['!merges'].push({ s: { r: 2, c: 6 }, e: { r: 2, c: 7 } }); // G3:H3 (Graves)
  ws['!merges'].push({ s: { r: 2, c: 8 }, e: { r: 2, c: 9 } }); // I3:J3 (Muy Graves)

  // ============================================
  // ANCHOS DE COLUMNA
  // ============================================
  ws['!cols'] = [
    { wch: 5 }, // A: No
    { wch: 30 }, // B: NOMBRE
    { wch: 8 }, // C: P
    { wch: 8 }, // D: SP
    { wch: 8 }, // E: Cant. Menos Graves
    { wch: 25 }, // F: Artículo Menos Graves
    { wch: 8 }, // G: Cant. Graves
    { wch: 25 }, // H: Artículo Graves
    { wch: 8 }, // I: Cant. Muy Graves
    { wch: 25 }, // J: Artículo Muy Graves
    { wch: 15 }, // K: CÁLCULO CONDUCTA
  ];

  // ============================================
  // ESTILOS Y FORMATO
  // ============================================
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    fill: { fgColor: { rgb: '4472C4' } }, // Azul
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  };

  const categoryStyle = {
    font: { bold: true, color: { rgb: '000000' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    fill: { fgColor: { rgb: '92D050' } }, // Verde claro
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  };

  const dataStyle = {
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  };

  const dataStyleLeft = {
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  };

  // Aplicar estilos a las celdas del encabezado
  // Fila 1 (Título)
  const titleCell = ws['A1'];
  if (titleCell) {
    titleCell.s = headerStyle;
  }

  // Filas 2-4 (Categorías)
  for (let row = 1; row <= 3; row++) {
    for (let col = 0; col <= 10; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      if (ws[cellRef]) {
        ws[cellRef].s = categoryStyle;
      }
    }
  }

  // Aplicar estilos a las filas de datos
  for (let row = 4; row < ws_data.length; row++) {
    const isEven = (row - 4) % 2 === 0;
    const fillColor = isEven ? 'FFFFFF' : 'F2F2F2'; // Blanco y gris claro

    for (let col = 0; col <= 10; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      if (ws[cellRef]) {
        // Columnas que van alineadas a la izquierda: B (NOMBRE), F, H, J (Artículos)
        if (col === 1 || col === 5 || col === 7 || col === 9) {
          ws[cellRef].s = {
            ...dataStyleLeft,
            fill: { fgColor: { rgb: fillColor } },
          };
        } else {
          ws[cellRef].s = {
            ...dataStyle,
            fill: { fgColor: { rgb: fillColor } },
          };
        }
      }
    }
  }

  // Agregar la hoja al libro
  XLSX.utils.book_append_sheet(wb, ws, 'Resumen Trimestral');

  // Generar el archivo
  const nombreArchivo = `Resumen_Trimestre_${trimestre}_${nombreCurso.replace(
    /\s+/g,
    '_'
  )}_${anio}.xlsx`;
  XLSX.writeFile(wb, nombreArchivo);
}
