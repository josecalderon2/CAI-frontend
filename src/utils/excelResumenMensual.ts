import * as XLSX from 'xlsx';
import type { ResumenMensualResponse } from '../api/services/asistenciaService';

interface ExcelDataMensual {
  resumen: ResumenMensualResponse[];
  nombreCurso: string;
  mes: number;
  anio: number;
}

const nombresMeses = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
];

/**
 * Genera un archivo Excel con el formato simplificado para el resumen mensual
 * Similar al estilo del resumen trimestral
 */
export function generarExcelResumenMensual(data: ExcelDataMensual): void {
  const { resumen, nombreCurso, mes, anio } = data;

  // Crear un nuevo libro de trabajo
  const wb = XLSX.utils.book_new();

  // Crear los datos del Excel
  const ws_data: any[][] = [];

  // ============================================
  // FILA 1: Título general
  // ============================================
  ws_data.push([
    `RESUMEN MENSUAL - ${nombresMeses[mes - 1]} ${anio} - ${nombreCurso.toUpperCase()}`,
  ]);

  // ============================================
  // FILA 2: Encabezados de columnas
  // ============================================
  ws_data.push([
    'Alumno',
    'Justificadas (E)',
    'Injustificadas (SP)',
    'Atrasos (A)',
  ]);

  // ============================================
  // FILAS 3+: Datos de alumnos
  // ============================================
  resumen.forEach((alumno) => {
    ws_data.push([
      `${alumno.nombre} ${alumno.apellido}`, // Alumno
      alumno.justificadas, // Justificadas (E)
      alumno.injustificadas, // Injustificadas (SP)
      alumno.atrasos, // Atrasos (A)
    ]);
  });

  // Crear la hoja de trabajo
  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // ============================================
  // CONFIGURAR ANCHOS DE COLUMNAS
  // ============================================
  ws['!cols'] = [
    { wch: 30 }, // A: Alumno
    { wch: 18 }, // B: Justificadas
    { wch: 20 }, // C: Injustificadas
    { wch: 15 }, // D: Atrasos
  ];

  // ============================================
  // APLICAR ESTILOS
  // ============================================
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = { c: C, r: R };
      const cell_ref = XLSX.utils.encode_cell(cell_address);

      if (!ws[cell_ref]) continue;

      // Fila 1: Título (azul, texto blanco, bold)
      if (R === 0) {
        ws[cell_ref].s = {
          fill: { fgColor: { rgb: '4472C4' } },
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
        };
      }
      // Fila 2: Encabezados (verde claro, bold)
      else if (R === 1) {
        ws[cell_ref].s = {
          fill: { fgColor: { rgb: '92D050' } },
          font: { bold: true, sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
        };
      }
      // Filas de datos
      else {
        ws[cell_ref].s = {
          alignment: {
            horizontal: C === 0 ? 'left' : 'center',
            vertical: 'center',
          },
          border: {
            top: { style: 'thin', color: { rgb: 'D3D3D3' } },
            bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
            left: { style: 'thin', color: { rgb: 'D3D3D3' } },
            right: { style: 'thin', color: { rgb: 'D3D3D3' } },
          },
        };

        // Alternar color de fondo en filas de datos
        if (R % 2 === 0) {
          ws[cell_ref].s.fill = { fgColor: { rgb: 'FFFFFF' } };
        } else {
          ws[cell_ref].s.fill = { fgColor: { rgb: 'F2F2F2' } };
        }

        // Negrita para la columna de alumno
        if (C === 0) {
          ws[cell_ref].s.font = { bold: true };
        }
      }
    }
  }

  // ============================================
  // COMBINAR CELDAS DEL TÍTULO (FILA 1)
  // ============================================
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({
    s: { r: 0, c: 0 },
    e: { r: 0, c: 3 },
  });

  // Agregar la hoja al libro
  XLSX.utils.book_append_sheet(wb, ws, 'Resumen Mensual');

  // Generar y descargar el archivo
  const filename = `Resumen_Mensual_${nombresMeses[mes - 1]}_${anio}_${nombreCurso.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
}
