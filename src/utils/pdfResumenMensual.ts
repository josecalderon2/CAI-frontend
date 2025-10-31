import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ResumenMensualResponse } from '../api/services/asistenciaService';

interface PDFDataMensual {
  resumen: ResumenMensualResponse[];
  nombreCurso: string;
  mes: number;
  anio: number;
}

const nombresMeses = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function generarPDFResumenMensual(data: PDFDataMensual): void {
  const { resumen, nombreCurso, mes, anio } = data;

  // Crear documento PDF en formato carta (letter)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  // Configurar fuente
  doc.setFont('helvetica');

  // Título principal
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const titulo = `RESUMEN MENSUAL - ${nombresMeses[mes - 1]} ${anio}`;
  const tituloWidth = doc.getTextWidth(titulo);
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(titulo, (pageWidth - tituloWidth) / 2, 20);

  // Subtítulo con nombre del curso
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const subtitulo = nombreCurso.toUpperCase();
  const subtituloWidth = doc.getTextWidth(subtitulo);
  doc.text(subtitulo, (pageWidth - subtituloWidth) / 2, 28);

  // Preparar datos para la tabla
  const tableData = resumen.map((alumno) => [
    `${alumno.nombre} ${alumno.apellido}`,
    alumno.justificadas.toString(),
    alumno.injustificadas.toString(),
    alumno.atrasos.toString(),
  ]);

  // Generar tabla con autoTable - Diseño idéntico al componente
  autoTable(doc, {
    startY: 35,
    head: [
      ['Alumno', 'Justificadas (E)', 'Injustificadas (SP)', 'Atrasos (A)'],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [229, 229, 229], // Gris claro base
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 10,
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3,
      lineWidth: 0.3,
      lineColor: [200, 200, 200],
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 80, fontStyle: 'bold' }, // Alumno
      1: { halign: 'center', cellWidth: 35 }, // Justificadas
      2: { halign: 'center', cellWidth: 35 }, // Injustificadas
      3: { halign: 'center', cellWidth: 35 }, // Atrasos
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // Gris muy claro para filas alternadas
    },
    margin: { left: 15, right: 15 },
    // Colorear headers según el componente
    didDrawCell: (data) => {
      if (data.section === 'head' && data.row.index === 0) {
        const { cell, doc } = data;
        
        // Aplicar colores de fondo según columna
        if (data.column.index === 1) {
          // Justificadas (E) - Verde
          doc.setFillColor(220, 252, 231); // bg-green-50
          doc.rect(cell.x, cell.y, cell.width, cell.height, 'F');
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.text('Justificadas (E)', cell.x + cell.width / 2, cell.y + cell.height / 2, {
            align: 'center',
            baseline: 'middle',
          });
        } else if (data.column.index === 2) {
          // Injustificadas (SP) - Naranja
          doc.setFillColor(255, 237, 213); // bg-orange-50
          doc.rect(cell.x, cell.y, cell.width, cell.height, 'F');
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.text('Injustificadas (SP)', cell.x + cell.width / 2, cell.y + cell.height / 2, {
            align: 'center',
            baseline: 'middle',
          });
        } else if (data.column.index === 3) {
          // Atrasos (A) - Rojo
          doc.setFillColor(254, 226, 226); // bg-red-50
          doc.rect(cell.x, cell.y, cell.width, cell.height, 'F');
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.text('Atrasos (A)', cell.x + cell.width / 2, cell.y + cell.height / 2, {
            align: 'center',
            baseline: 'middle',
          });
        }
        
        // Dibujar bordes
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(cell.x, cell.y, cell.width, cell.height, 'S');
      }
    },
  });

  // Pie de página con fecha de generación
  const finalY = (doc as any).lastAutoTable.finalY || 35;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`,
    15,
    finalY + 10
  );

  // Guardar el PDF
  const nombreArchivo = `Resumen_Mensual_${nombresMeses[mes - 1]}_${anio}_${nombreCurso.replace(/\s+/g, '_')}.pdf`;
  doc.save(nombreArchivo);
}
