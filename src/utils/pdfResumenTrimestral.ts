import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  ResumenTrimestralResponse,
  InfraccionResumen,
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

  // Preparar datos para la tabla
  const tableData = resumen.map((alumno) => {
    // Agrupar infracciones por categoría
    const menosGraves = alumno.infracciones.filter(
      (inf) => inf.categoria === 'MENOS_GRAVE'
    ).length;
    const graves = alumno.infracciones.filter(
      (inf) => inf.categoria === 'GRAVE'
    ).length;
    const muyGraves = alumno.infracciones.filter(
      (inf) => inf.categoria === 'MUY_GRAVE'
    ).length;

    return [
      `${alumno.nombre} ${alumno.apellido}`,
      alumno.justificadas.toString(),
      alumno.injustificadas.toString(),
      menosGraves.toString(),
      graves.toString(),
      muyGraves.toString(),
      (alumno.puntajeConducta ?? 10).toFixed(2),
    ];
  });

  // Generar tabla con autoTable
  autoTable(doc, {
    startY: 33,
    head: [
      [
        'Alumno',
        'Justificadas (E)',
        'Injustificadas (SP)',
        'Menos Grave (-1)',
        'Grave (-2)',
        'Muy Grave (-3)',
        'Nota Conducta',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [146, 208, 80], // Verde similar al Excel
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 60 }, // Alumno
      1: { halign: 'center', cellWidth: 25 }, // Justificadas
      2: { halign: 'center', cellWidth: 28 }, // Injustificadas
      3: { halign: 'center', cellWidth: 25 }, // Menos Grave
      4: { halign: 'center', cellWidth: 20 }, // Grave
      5: { halign: 'center', cellWidth: 25 }, // Muy Grave
      6: { halign: 'center', cellWidth: 25, fontStyle: 'bold' }, // Nota Conducta
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], // Gris claro para filas alternadas
    },
    margin: { left: 15, right: 15 },
    // Colorear celdas según valores
    didParseCell: (data) => {
      if (data.section === 'body') {
        // Columna de Nota Conducta (última columna)
        if (data.column.index === 6) {
          const nota = parseFloat(data.cell.text[0]);
          if (nota >= 8) {
            data.cell.styles.fillColor = [198, 239, 206]; // Verde claro
            data.cell.styles.textColor = [0, 100, 0]; // Verde oscuro
          } else if (nota >= 6) {
            data.cell.styles.fillColor = [255, 235, 156]; // Amarillo claro
            data.cell.styles.textColor = [153, 102, 0]; // Amarillo oscuro
          } else {
            data.cell.styles.fillColor = [255, 199, 206]; // Rojo claro
            data.cell.styles.textColor = [156, 0, 6]; // Rojo oscuro
          }
        }
      }
    },
  });

  // Agregar sección de detalle de infracciones (si hay)
  const alumnosConInfracciones = resumen.filter(
    (alumno) => alumno.infracciones.length > 0
  );

  if (alumnosConInfracciones.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || 33;

    // Título de la sección de infracciones
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE INFRACCIONES', 15, finalY + 10);

    // Crear tabla de infracciones por alumno
    alumnosConInfracciones.forEach((alumno, index) => {
      const startY =
        index === 0 ? finalY + 15 : (doc as any).lastAutoTable.finalY + 8;

      // Verificar si hay espacio en la página
      if (startY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
      }

      // Nombre del alumno
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const yPos = index === 0 ? startY : (doc as any).lastAutoTable.finalY + 8;
      doc.text(`${alumno.nombre} ${alumno.apellido}`, 15, yPos);

      // Tabla de infracciones
      const infraccionesData = alumno.infracciones.map(
        (inf: InfraccionResumen) => [
          inf.categoria,
          inf.articulo,
          inf.descripcion,
          inf.cantidad.toString(),
        ]
      );

      autoTable(doc, {
        startY: yPos + 3,
        head: [['Categoría', 'Artículo', 'Descripción', 'Cantidad']],
        body: infraccionesData,
        theme: 'striped',
        headStyles: {
          fillColor: [68, 114, 196], // Azul
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 1.5,
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 100 },
          3: { cellWidth: 20, halign: 'center' },
        },
        margin: { left: 15, right: 15 },
      });
    });
  }

  // Pie de página con fecha de generación
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`,
    15,
    doc.internal.pageSize.getHeight() - 10
  );

  // Guardar el PDF
  const nombreArchivo = `Resumen_Trimestral_T${trimestre}_${anio}_${nombreCurso.replace(/\s+/g, '_')}.pdf`;
  doc.save(nombreArchivo);
}
