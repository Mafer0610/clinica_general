document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ generarReporte.js cargado');
  
  const hoy = new Date().toISOString().split('T')[0];
  const fechaInicio = document.getElementById('fechaInicio');
  const fechaFinal = document.getElementById('fechaFinal');
  
  if (fechaInicio && fechaFinal) {
    fechaInicio.setAttribute('max', hoy);
    fechaFinal.setAttribute('max', hoy);
    
    fechaInicio.addEventListener('change', function() {
      fechaFinal.setAttribute('min', this.value);
      if (fechaFinal.value && fechaFinal.value < this.value) {
        fechaFinal.value = '';
        console.log('⚠️ Fecha final limpiada porque era menor que la fecha de inicio');
      }
    });
    
    fechaFinal.addEventListener('change', function() {
      if (fechaInicio.value && this.value < fechaInicio.value) {
        alert('⚠️ La fecha final no puede ser menor que la fecha de inicio');
        this.value = '';
      }
    });
    
    console.log('✅ Restricciones de fecha configuradas');
  } else {
    console.error('❌ No se encontraron elementos de fecha en el DOM');
  }
});

// ===== FUNCIÓN AUXILIAR PARA FORMATEAR FECHAS =====
function formatearFecha(fecha) {
  const [año, mes, día] = fecha.split('-');
  return `${día}/${mes}/${año}`;
}

// ===== FUNCIÓN PRINCIPAL PARA GENERAR REPORTE =====
async function generarReportePDF(e) {
  e.preventDefault();
  
  console.log('🚀 Iniciando generación de reporte...');

  const fechaInicioElem = document.getElementById('fechaInicio');
  const fechaFinalElem = document.getElementById('fechaFinal');
  
  if (!fechaInicioElem || !fechaFinalElem) {
    console.error('❌ Elementos de fecha no encontrados');
    alert('⚠️ Error: No se encontraron los campos de fecha. Recarga la página.');
    return;
  }

  const fechaInicio = fechaInicioElem.value;
  const fechaFinal = fechaFinalElem.value;

  // Validaciones
  if (!fechaInicio || !fechaFinal) {
    alert('⚠️ Por favor selecciona ambas fechas (inicio y final)');
    return;
  }

  const fechaInicioDate = new Date(fechaInicio);
  const fechaFinalDate = new Date(fechaFinal);
  
  if (fechaInicioDate > fechaFinalDate) {
    alert('⚠️ La fecha de inicio no puede ser mayor que la fecha final');
    return;
  }

  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  
  if (fechaInicioDate > hoy || fechaFinalDate > hoy) {
    alert('⚠️ No se pueden seleccionar fechas futuras');
    return;
  }

  if (typeof window.jspdf === 'undefined') {
    alert('❌ Error: La librería jsPDF no está cargada. Por favor recarga la página.');
    return;
  }

  const btnOriginal = e.target;
  const textoOriginal = btnOriginal.innerHTML;

  try {
    btnOriginal.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
    btnOriginal.disabled = true;

    // Preparar fechas
    fechaInicioDate.setHours(0, 0, 0, 0);
    fechaFinalDate.setHours(23, 59, 59, 999);
    
    const url = `${API_BASE_URL}/appointments/range?startDate=${fechaInicioDate.toISOString()}&endDate=${fechaFinalDate.toISOString()}`;
    console.log('🌐 URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📦 Datos recibidos:', data);

    if (!data.success || !data.appointments || !Array.isArray(data.appointments)) {
      throw new Error('Respuesta del servidor inválida');
    }

    if (data.appointments.length === 0) {
      alert('⚠️ No se encontraron citas en el rango seleccionado');
      btnOriginal.innerHTML = textoOriginal;
      btnOriginal.disabled = false;
      return;
    }

    console.log(`✅ ${data.appointments.length} citas encontradas`);

    // Preparar datos
    const citasParaPDF = data.appointments.map((cita, index) => {
      let fechaFormateada = 'N/A';
      
      try {
        if (cita.fecha) {
          const fechaISO = cita.fecha.split('T')[0];
          const [year, month, day] = fechaISO.split('-');
          fechaFormateada = `${day}/${month}/${year.slice(2)}`;
        }
      } catch (error) {
        console.error('Error formateando fecha:', error);
      }
      
      const diagnostico = cita.diagnostico || cita.descripcion || cita.sintomas || 'Pendiente';
      const diagnosticoCorto = diagnostico.length > 35 ? diagnostico.substring(0, 35) + '...' : diagnostico;
      const nombrePaciente = cita.pacienteNombre || 'Paciente';
      
      return [
        (index + 1).toString(),
        nombrePaciente,
        diagnosticoCorto,
        fechaFormateada
      ];
    });

    // Generar PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const COLORS = {
      primary: [15, 55, 89],
      secondary: [28, 77, 140],
      white: [255, 255, 255],
      gray: [120, 120, 120]
    };

    const pageWidth = 210;
    const margins = 20;
    const availableWidth = pageWidth - (2 * margins);
    
    const columnWidths = {
      no: 15,
      paciente: availableWidth * 0.35,
      diagnostico: availableWidth * 0.40,
      fecha: availableWidth * 0.25 - 15
    };

    const tableTotalWidth = columnWidths.no + columnWidths.paciente + columnWidths.diagnostico + columnWidths.fecha;
    const tableStartX = (pageWidth - tableTotalWidth) / 2;

    // Fondo
    doc.setFillColor(...COLORS.white);
    doc.rect(0, 0, 210, 297, 'F');

    // Encabezado
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

    // Total
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.gray);
    doc.text(`Total de citas: ${citasParaPDF.length}`, 105, 48, { align: 'center' });

    const tableStartY = 55;

    // Cabecera tabla
    doc.setFillColor(...COLORS.primary);
    doc.rect(tableStartX - 2, tableStartY - 6, tableTotalWidth + 4, 8, 'F');

    doc.setFontSize(11);
    doc.setTextColor(...COLORS.white);
    doc.setFont(undefined, 'bold');

    let currentX = tableStartX + 2;
    doc.text('No.', currentX, tableStartY - 1);
    currentX += columnWidths.no;
    doc.text('Paciente', currentX, tableStartY - 1);
    currentX += columnWidths.paciente;
    doc.text('Diagnóstico', currentX, tableStartY - 1);
    currentX += columnWidths.diagnostico;
    doc.text('Fecha', currentX, tableStartY - 1);

    // Filas
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(10);

    let currentY = tableStartY + 10;
    const rowHeight = 10;

    citasParaPDF.forEach((row) => {
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
        
        doc.setFillColor(...COLORS.primary);
        doc.rect(tableStartX - 2, currentY - 6, tableTotalWidth + 4, 8, 'F');
        doc.setTextColor(...COLORS.white);
        doc.setFont(undefined, 'bold');
        
        let headerX = tableStartX + 2;
        doc.text('No.', headerX, currentY - 1);
        headerX += columnWidths.no;
        doc.text('Paciente', headerX, currentY - 1);
        headerX += columnWidths.paciente;
        doc.text('Diagnóstico', headerX, currentY - 1);
        headerX += columnWidths.diagnostico;
        doc.text('Fecha', headerX, currentY - 1);
        
        currentY += 10;
        doc.setTextColor(...COLORS.primary);
        doc.setFont(undefined, 'normal');
      }

      currentX = tableStartX + 2;
      doc.text(row[0], currentX, currentY);
      currentX += columnWidths.no;
      
      const pacienteTexto = doc.splitTextToSize(row[1], columnWidths.paciente - 5);
      doc.text(pacienteTexto[0], currentX, currentY);
      currentX += columnWidths.paciente;
      
      const diagnosticoTexto = doc.splitTextToSize(row[2], columnWidths.diagnostico - 5);
      doc.text(diagnosticoTexto[0], currentX, currentY);
      currentX += columnWidths.diagnostico;
      
      doc.text(row[3], currentX, currentY);

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(tableStartX, currentY + 2, tableStartX + tableTotalWidth, currentY + 2);
      
      currentY += rowHeight;
    });

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-MX')} - DJFA Systems`, 105, currentY + 5, { align: 'center' });

    // Guardar
    const nombreArchivo = `Reporte_Clinico_${fechaInicio}_${fechaFinal}.pdf`;
    doc.save(nombreArchivo);

    console.log('✅ PDF generado exitosamente');

    // Restaurar y limpiar
    btnOriginal.innerHTML = textoOriginal;
    btnOriginal.disabled = false;

    const modal = document.getElementById('modalReportes');
    if (modal) {
      modal.style.display = 'none';
    }

    fechaInicioElem.value = '';
    fechaFinalElem.value = '';

  } catch (error) {
    console.error('❌ ERROR:', error);
    
    let mensaje = 'Error al generar el reporte:\n\n';
    
    if (error.message.includes('fetch')) {
      mensaje += '• No se pudo conectar con el servidor\n• Verifica que esté corriendo en puerto 3002';
    } else if (error.message.includes('JSON')) {
      mensaje += '• Error procesando respuesta del servidor';
    } else {
      mensaje += error.message;
    }
    
    alert('❌ ' + mensaje);
    
    btnOriginal.innerHTML = textoOriginal;
    btnOriginal.disabled = false;
  }
}

// ===== EXPORTAR COMO GLOBAL =====
window.generarReportePDF = generarReportePDF;

console.log('✅ generarReporte.js cargado');
console.log('✅ window.generarReportePDF:', typeof window.generarReportePDF);