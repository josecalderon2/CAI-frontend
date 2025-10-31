import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  ResumenTrimestralResponse,
} from '../api/services/asistenciaService';

interface PDFDataTrimestral {
  resumen: ResumenTrimestralResponse[];
  nombreCurso: string;
  trimestre: number;
  anio: number;
}

export function generarPDFResumenTrimestral(data: PDFDataTrimestral): void {
  const { resumen, nombreCurso, trimestre, anio } = data;

  // Crear documento PDF en formato horizontal (landscape) para más columnas
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'letter',
  });

  // Configurar fuente
  doc.setFont('helvetica');

  // Título principal
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const titulo = `RESUMEN TRIMESTRAL - T${trimestre} ${anio}`;
  const tituloWidth = doc.getTextWidth(titulo);
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(titulo, (pageWidth - tituloWidth) / 2, 15);

  // Subtítulo con nombre del curso
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const subtitulo = nombreCurso.toUpperCase();
  const subtituloWidth = doc.getTextWidth(subtitulo);
  doc.text(subtitulo, (pageWidth - subtituloWidth) / 2, 22);

  // Leyenda de la fórmula
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  const leyenda =
    'Nota Conducta = 10 - (SP/10) - Σ(Infracciones según gravedad) | SP = Ausencias Sin Permiso';
  const leyendaWidth = doc.getTextWidth(leyenda);
  doc.text(leyenda, (pageWidth - leyendaWidth) / 2, 28);

  // Resetear color de texto
  doc.setTextColor(0, 0, 0);

  // Preparar datos para la tabla con el formato exacto del componente
  const tableData = resumen.map((alumno, index) => {
    // Agrupar infracciones por categoría con detalle de artículos
    const infraccionesPorCategoria = {
      MENOS_GRAVE: alumno.infracciones.filter((inf) => inf.categoria === 'MENOS_GRAVE'),
      GRAVE: alumno.infracciones.filter((inf) => inf.categoria === 'GRAVE'),
      MUY_GRAVE: alumno.infracciones.filter((inf) => inf.categoria === 'MUY_GRAVE'),
    };

    // Calcular cantidades
    const menosGravesCount = infraccionesPorCategoria.MENOS_GRAVE.reduce(
      (sum, inf) => sum + (inf.cantidad ?? 1),
      0
    );
    const gravesCount = infraccionesPorCategoria.GRAVE.reduce(
      (sum, inf) => sum + (inf.cantidad ?? 1),
      0
    );
    const muyGravesCount = infraccionesPorCategoria.MUY_GRAVE.reduce(
      (sum, inf) => sum + (inf.cantidad ?? 1),
      0
    );

    // Obtener artículos (descripción completa)
    const menosGravesArticulos = infraccionesPorCategoria.MENOS_GRAVE
      .map((inf) => `${inf.articulo}: ${inf.descripcion} (${inf.cantidad ?? 1})`)
      .join('\n');
    const gravesArticulos = infraccionesPorCategoria.GRAVE
      .map((inf) => `${inf.articulo}: ${inf.descripcion} (${inf.cantidad ?? 1})`)
      .join('\n');
    const muyGravesArticulos = infraccionesPorCategoria.MUY_GRAVE
      .map((inf) => `${inf.articulo}: ${inf.descripcion} (${inf.cantidad ?? 1})`)
      .join('\n');

    return [
      (index + 1).toString(), // No
      `${alumno.nombre} ${alumno.apellido}`, // Nombre
      alumno.justificadas.toString(), // P
      alumno.injustificadas.toString(), // SP
      menosGravesCount > 0 ? menosGravesCount.toString() : '', // Menos Graves Cant
      menosGravesArticulos || '-', // Menos Graves Artículo
      gravesCount > 0 ? gravesCount.toString() : '', // Graves Cant
      gravesArticulos || '-', // Graves Artículo
      muyGravesCount > 0 ? muyGravesCount.toString() : '', // Muy Graves Cant
      muyGravesArticulos || '-', // Muy Graves Artículo
      (alumno.puntajeConducta ?? 10).toFixed(1), // Cálculo Conducta
    ];
  });

  // Generar tabla con diseño idéntico al componente (estructura de 3 filas de headers)
  autoTable(doc, {
    startY: 33,
    head: [
      // Fila 1: Categorías principales
      [
        { content: 'No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'NOMBRE', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'INASISTENCIAS', colSpan: 2, styles: { halign: 'center', fillColor: [219, 234, 254] } }, // bg-blue-100
        { content: 'FALTAS', colSpan: 6, styles: { halign: 'center', fillColor: [254, 252, 232] } }, // bg-yellow-50
        { content: 'CÁLCULO\nCONDUCTA', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [250, 245, 255] } }, // bg-purple-50
      ],
      // Fila 2: Subcategorías
      [
        { content: 'P', styles: { halign: 'center', fillColor: [239, 246, 255] } }, // bg-blue-50
        { content: 'SP', styles: { halign: 'center', fillColor: [239, 246, 255] } }, // bg-blue-50
        { content: 'Menos Graves', colSpan: 2, styles: { halign: 'center', fillColor: [254, 249, 195] } }, // bg-yellow-100
        { content: 'Graves', colSpan: 2, styles: { halign: 'center', fillColor: [255, 237, 213] } }, // bg-orange-100
        { content: 'Muy Graves', colSpan: 2, styles: { halign: 'center', fillColor: [254, 226, 226] } }, // bg-red-100
      ],
      // Fila 3: Columnas específicas
      [
        { content: '', styles: { fillColor: [243, 244, 246] } }, // vacío No
        { content: '', styles: { fillColor: [243, 244, 246] } }, // vacío NOMBRE
        { content: '', styles: { fillColor: [243, 244, 246] } }, // vacío P
        { content: '', styles: { fillColor: [243, 244, 246] } }, // vacío SP
        { content: 'Cant.', styles: { halign: 'center', fillColor: [254, 252, 232], fontSize: 7 } },
        { content: 'Artículo', styles: { halign: 'center', fillColor: [254, 252, 232], fontSize: 7 } },
        { content: 'Cant.', styles: { halign: 'center', fillColor: [255, 237, 213], fontSize: 7 } },
        { content: 'Artículo', styles: { halign: 'center', fillColor: [255, 237, 213], fontSize: 7 } },
        { content: 'Cant.', styles: { halign: 'center', fillColor: [254, 226, 226], fontSize: 7 } },
        { content: 'Artículo', styles: { halign: 'center', fillColor: [254, 226, 226], fontSize: 7 } },
        { content: '', styles: { fillColor: [250, 245, 255] } }, // vacío CÁLCULO
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [146, 208, 80], // Verde base (será sobrescrito por los estilos individuales)
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8,
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2,
      lineWidth: 0.3,
      lineColor: [200, 200, 200],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 }, // No
      1: { halign: 'left', cellWidth: 35, fontStyle: 'bold' }, // Nombre
      2: { halign: 'center', cellWidth: 12 }, // P
      3: { halign: 'center', cellWidth: 12 }, // SP
      4: { halign: 'center', cellWidth: 12 }, // Menos Graves Cant
      5: { halign: 'left', cellWidth: 40 }, // Menos Graves Artículo
      6: { halign: 'center', cellWidth: 12 }, // Graves Cant
      7: { halign: 'left', cellWidth: 40 }, // Graves Artículo
      8: { halign: 'center', cellWidth: 12 }, // Muy Graves Cant
      9: { halign: 'left', cellWidth: 40 }, // Muy Graves Artículo
      10: { halign: 'center', cellWidth: 20, fontStyle: 'bold' }, // Cálculo Conducta
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // Gris muy claro para filas alternadas
    },
    margin: { left: 10, right: 10 },
    // Colorear celdas según valores (igual que el componente)
    didParseCell: (data) => {
      if (data.section === 'body') {
        // Columna de Cálculo Conducta (columna 10)
        if (data.column.index === 10) {
          const nota = parseFloat(data.cell.text[0]);
          if (nota >= 8) {
            data.cell.styles.fillColor = [187, 247, 208]; // bg-green-200
            data.cell.styles.textColor = [22, 101, 52]; // text-green-800
          } else if (nota >= 6) {
            data.cell.styles.fillColor = [254, 240, 138]; // bg-yellow-200
            data.cell.styles.textColor = [133, 77, 14]; // text-yellow-800
          } else {
            data.cell.styles.fillColor = [254, 202, 202]; // bg-red-200
            data.cell.styles.textColor = [153, 27, 27]; // text-red-800
          }
        }
      }
    },
  });

  // Pie de página con fecha de generación
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`,
    10,
    doc.internal.pageSize.getHeight() - 5
  );

  // Guardar el PDF
  const nombreArchivo = `Resumen_Trimestral_T${trimestre}_${anio}_${nombreCurso.replace(/\s+/g, '_')}.pdf`;
  doc.save(nombreArchivo);
}
