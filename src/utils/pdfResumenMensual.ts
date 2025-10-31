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

  // Generar tabla con autoTable
  autoTable(doc, {
    startY: 35,
    head: [
      ['Alumno', 'Justificadas (E)', 'Injustificadas (SP)', 'Atrasos (A)'],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [146, 208, 80], // Verde similar al Excel
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 80 }, // Alumno
      1: { halign: 'center', cellWidth: 35 }, // Justificadas
      2: { halign: 'center', cellWidth: 35 }, // Injustificadas
      3: { halign: 'center', cellWidth: 35 }, // Atrasos
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], // Gris claro para filas alternadas
    },
    margin: { left: 15, right: 15 },
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
