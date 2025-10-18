document.querySelector('.btn-generar-pdf').addEventListener('click', function (e) {
  e.preventDefault();

  const fechaInicio = document.getElementById('fechaInicio').value;
  const fechaFinal = document.getElementById('fechaFinal').value;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Colores
  const COLORS = {
    primary: [15, 55, 89],     // Azul oscuro original
    secondary: [28, 77, 140],  // Azul medio
    accent: [242, 242, 242],   // Gris claro
    white: [255, 255, 255],
    gray: [120, 120, 120]
  };

  const LAYOUT = {
    margin: 20,
    table: {
      startY: 55,               // Menor espacio entre fecha y tabla
      rowHeight: 10,
      columnWidth: 45
    }
  };

  const headers = ['No. P', 'Paciente', 'Diagnóstico', 'Fecha'];
  const data = [
    ['1', 'Paciente Ejemplo 1', 'Diagnóstico A', '10/12/25'],
    ['2', 'Paciente Ejemplo 2', 'Diagnóstico B', '09/12/25'],
    ['3', 'Paciente Ejemplo 3', 'Diagnóstico C', '08/11/25'],
    ['4', 'Paciente Ejemplo 4', 'Diagnóstico D', '07/11/25']
  ];

  const tableTotalWidth = headers.length * LAYOUT.table.columnWidth;
  const tableStartX = (210 - tableTotalWidth) / 2;
  const fondoAltura = LAYOUT.table.startY + 10 + data.length * LAYOUT.table.rowHeight + 5;

  // Fondo blanco hasta el final de la tabla
  doc.setFillColor(...COLORS.white);
  doc.rect(0, 0, 210, fondoAltura, 'F');

  // Encabezado discreto
  doc.setFont('Times', 'italic');
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(12);
  doc.text("DJFA System's", 190, 15, { align: 'right' });

  // Título
  doc.setFont('Times', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(20);
  doc.text('REPORTE CLÍNICO', 105, 30, { align: 'center' });

  // Fechas
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.secondary);
  doc.text(`Del ${formatearFecha(fechaInicio)} al ${formatearFecha(fechaFinal)}`, 105, 40, { align: 'center' });

  // Encabezado de tabla con fondo azul oscuro más delgado
  doc.setFillColor(...COLORS.primary);
  doc.rect(
    tableStartX - 2,
    LAYOUT.table.startY - 6,
    tableTotalWidth + 4,
    8, // Altura más delgada
    'F'
  );

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.white);
  doc.setFont(undefined, 'bold');

  headers.forEach((header, index) => {
    doc.text(
      header,
      tableStartX + index * LAYOUT.table.columnWidth + 2,
      LAYOUT.table.startY - 1 // Ajuste vertical para centrar texto
    );
  });

  // Filas con líneas debajo
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...COLORS.primary);

  data.forEach((row, rowIndex) => {
    const y = LAYOUT.table.startY + 10 + rowIndex * LAYOUT.table.rowHeight;

    row.forEach((cell, cellIndex) => {
      doc.text(cell, tableStartX + cellIndex * LAYOUT.table.columnWidth + 2, y);
    });

    // Línea debajo
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(tableStartX, y + 2, tableStartX + tableTotalWidth, y + 2);
  });

  // Pie de página
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generado el ${new Date().toLocaleDateString()} - DJFA Systems`,
    105,
    fondoAltura + 10,
    { align: 'center' }
  );

  doc.save('reporte_clinico.pdf');
});

function formatearFecha(fecha) {
  const [año, mes, día] = fecha.split('-');
  return `${día}/${mes}/${año.slice(2)}`;
}