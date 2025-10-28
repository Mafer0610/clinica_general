// ===== CONFIGURACIÓN API =====
const API_BASE_URL = 'http://localhost:3002/api';

// ===== MAPA DE TIPOS DE CITA =====
const TIPOS_CITA = {
  '1': 'Consulta médica',
  '2': 'Consulta general',
  '3': 'Revisión',
  '4': 'Control',
  '5': 'Seguimiento'
};

// ===== CONFIGURAR RESTRICCIONES DE FECHA AL CARGAR =====
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ generarReporte.js cargado');
  
  const hoy = new Date().toISOString().split('T')[0];
  const fechaInicio = document.getElementById('fechaInicio');
  const fechaFinal = document.getElementById('fechaFinal');
  
  if (fechaInicio && fechaFinal) {
    fechaInicio.setAttribute('max', hoy);
    fechaFinal.setAttribute('max', hoy);
    
    // Validar que fecha final no sea menor que fecha inicio
    fechaInicio.addEventListener('change', function() {
      fechaFinal.setAttribute('min', this.value);
    });
    
    console.log('✅ Restricciones de fecha configuradas');
  }
  
  // Configurar el botón de generar PDF
  const btnGenerar = document.querySelector('.btn-generar-pdf');
  if (btnGenerar) {
    btnGenerar.addEventListener('click', generarReportePDF);
    console.log('✅ Event listener del botón configurado');
  }
});

// ===== FUNCIÓN PRINCIPAL PARA GENERAR REPORTE =====
async function generarReportePDF(e) {
  e.preventDefault();
  
  console.log('🚀 Iniciando generación de reporte...');

  const fechaInicio = document.getElementById('fechaInicio').value;
  const fechaFinal = document.getElementById('fechaFinal').value;

  // ✅ VALIDACIÓN 1: Verificar que ambas fechas estén seleccionadas
  if (!fechaInicio || !fechaFinal) {
    alert('⚠️ Por favor selecciona ambas fechas (inicio y final)');
    console.error('❌ Fechas no seleccionadas');
    return;
  }

  console.log('📅 Fechas seleccionadas:', fechaInicio, 'al', fechaFinal);

  // ✅ VALIDACIÓN 2: Verificar que la fecha de inicio no sea mayor que la fecha final
  if (new Date(fechaInicio) > new Date(fechaFinal)) {
    alert('⚠️ La fecha de inicio no puede ser mayor que la fecha final');
    console.error('❌ Rango de fechas inválido');
    return;
  }

  // ✅ VALIDACIÓN 3: Verificar que no sean fechas futuras
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  if (new Date(fechaInicio) > hoy || new Date(fechaFinal) > hoy) {
    alert('⚠️ No se pueden seleccionar fechas futuras');
    console.error('❌ Fechas futuras detectadas');
    return;
  }

  // ✅ VERIFICAR QUE JSPDF ESTÉ DISPONIBLE
  if (typeof window.jspdf === 'undefined') {
    alert('❌ Error: La librería jsPDF no está cargada. Por favor recarga la página.');
    console.error('❌ jsPDF no disponible');
    return;
  }

  const btnOriginal = e.target;
  const textoOriginal = btnOriginal.innerHTML;

  try {
    // Mostrar mensaje de carga
    btnOriginal.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
    btnOriginal.disabled = true;

    // ✅ OBTENER CITAS REALES DEL RANGO SELECCIONADO
    console.log('📥 Obteniendo citas del servidor...');
    
    const url = `${API_BASE_URL}/appointments/range?startDate=${fechaInicio}&endDate=${fechaFinal}`;
    console.log('🌐 URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📦 Datos recibidos:', data);

    if (!data.success) {
      throw new Error('Error al obtener las citas del servidor');
    }

    console.log(`✅ Se encontraron ${data.appointments.length} citas`);

    // ✅ VALIDACIÓN 4: Verificar que haya citas en el rango
    if (data.appointments.length === 0) {
      alert('⚠️ No se encontraron citas en el rango de fechas seleccionado');
      console.warn('⚠️ No hay citas para mostrar');
      btnOriginal.innerHTML = textoOriginal;
      btnOriginal.disabled = false;
      return;
    }

    // ✅ PREPARAR DATOS PARA EL PDF
    console.log('📊 Preparando datos para PDF...');
    
    const citasParaPDF = data.appointments.map((cita, index) => {
      // Formatear fecha
      const fechaISO = cita.fecha.split('T')[0];
      const [year, month, day] = fechaISO.split('-');
      const fechaFormateada = `${day}/${month}/${year.slice(2)}`;
      
      // Obtener diagnóstico o descripción
      const diagnostico = cita.diagnostico || cita.descripcion || cita.sintomas || 'Pendiente';
      const diagnosticoCorto = diagnostico.length > 35 
        ? diagnostico.substring(0, 35) + '...' 
        : diagnostico;
      
      return [
        (index + 1).toString(),
        cita.pacienteNombre || 'Paciente',
        diagnosticoCorto,
        fechaFormateada
      ];
    });

    console.log('📄 Generando PDF...');

    // ✅ GENERAR PDF CON DATOS REALES
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Colores
    const COLORS = {
      primary: [15, 55, 89],
      secondary: [28, 77, 140],
      white: [255, 255, 255],
      gray: [120, 120, 120]
    };

    const LAYOUT = {
      table: {
        startY: 55,
        rowHeight: 10,
        columnWidth: 45
      }
    };

    const headers = ['No.', 'Paciente', 'Diagnóstico', 'Fecha'];
    const dataRows = citasParaPDF;

    const tableTotalWidth = headers.length * LAYOUT.table.columnWidth;
    const tableStartX = (210 - tableTotalWidth) / 2;

    // Fondo blanco
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

    // Total de citas
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.gray);
    doc.text(`Total de citas: ${dataRows.length}`, 105, 48, { align: 'center' });

    // Encabezado de tabla
    doc.setFillColor(...COLORS.primary);
    doc.rect(tableStartX - 2, LAYOUT.table.startY - 6, tableTotalWidth + 4, 8, 'F');

    doc.setFontSize(11);
    doc.setTextColor(...COLORS.white);
    doc.setFont(undefined, 'bold');

    headers.forEach((header, index) => {
      doc.text(
        header,
        tableStartX + index * LAYOUT.table.columnWidth + 2,
        LAYOUT.table.startY - 1
      );
    });

    // Filas de datos
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(10);

    dataRows.forEach((row, rowIndex) => {
      const y = LAYOUT.table.startY + 10 + rowIndex * LAYOUT.table.rowHeight;

      row.forEach((cell, cellIndex) => {
        doc.text(cell, tableStartX + cellIndex * LAYOUT.table.columnWidth + 2, y);
      });

      // Línea divisoria
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(tableStartX, y + 2, tableStartX + tableTotalWidth, y + 2);
    });

    // Pie de página
    const footerY = LAYOUT.table.startY + 15 + dataRows.length * LAYOUT.table.rowHeight;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generado el ${new Date().toLocaleDateString('es-MX')} - DJFA Systems`,
      105,
      footerY,
      { align: 'center' }
    );

    // Guardar PDF
    const nombreArchivo = `Reporte_Clinico_${fechaInicio}_${fechaFinal}.pdf`;
    console.log('💾 Guardando PDF:', nombreArchivo);
    doc.save(nombreArchivo);

    console.log('✅ PDF generado exitosamente');

    // Restaurar botón
    btnOriginal.innerHTML = textoOriginal;
    btnOriginal.disabled = false;

    // Cerrar modal
    const modal = document.getElementById('modalReportes');
    if (modal) {
      modal.style.display = 'none';
    }

    // Limpiar campos
    document.getElementById('fechaInicio').value = '';
    document.getElementById('fechaFinal').value = '';

  } catch (error) {
    console.error('❌ Error generando reporte:', error);
    console.error('Stack:', error.stack);
    alert('❌ Error al generar el reporte: ' + error.message);
    
    // Restaurar botón
    btnOriginal.innerHTML = textoOriginal;
    btnOriginal.disabled = false;
  }
}

// ===== FUNCIÓN AUXILIAR =====
function formatearFecha(fecha) {
  const [año, mes, día] = fecha.split('-');
  return `${día}/${mes}/${año}`;
}