// Establecer la fecha actual por defecto
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('pacienteFecha').valueAsDate = new Date();
    
    // Cargar información del paciente desde URL params (si se pasa)
    const urlParams = new URLSearchParams(window.location.search);
    const nombrePaciente = urlParams.get('paciente');
    
    if (nombrePaciente) {
        document.getElementById('pacienteNombre').value = nombrePaciente;
    }
});

// Función para generar PDF
async function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Obtener valores de los campos
    const pacienteNombre = document.getElementById('pacienteNombre').value || '';
    const pacienteEdad = document.getElementById('pacienteEdad').value || '';
    const pacienteFecha = document.getElementById('pacienteFecha').value || '';
    const pacientePeso = document.getElementById('pacientePeso').value || '';
    const pacienteEstatura = document.getElementById('pacienteEstatura').value || '';
    const pacienteFC = document.getElementById('pacienteFC').value || '';
    const pacienteFR = document.getElementById('pacienteFR').value || '';
    const pacienteTA = document.getElementById('pacienteTA').value || '';
    const pacienteTemp = document.getElementById('pacienteTemp').value || '';
    const pacienteDiagnostico = document.getElementById('pacienteDiagnostico').value || '';
    const prescripcion = document.getElementById('prescripcionTexto').value || '';
    const recomendaciones = document.getElementById('recomendacionesTexto').value || '';

    // Borde exterior de toda la página
    doc.setDrawColor(15, 55, 89);
    doc.setLineWidth(0.8);
    doc.rect(5, 5, 200, 287);

    // ========== HEADER ==========
    // Logo cuadrado
    doc.setFillColor(15, 55, 89);
    doc.rect(10, 10, 25, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('djfa', 22.5, 26, { align: 'center' });

    // Título RECETA (lado derecho)
    doc.setFillColor(184, 205, 224);
    doc.roundedRect(150, 10, 50, 18, 3, 3, 'F');
    doc.setTextColor(15, 55, 89);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('RECETA', 175, 22, { align: 'center' });

    // Línea separadora del header
    doc.setDrawColor(15, 55, 89);
    doc.setLineWidth(0.5);
    doc.line(10, 38, 200, 38);

    // ========== INFORMACIÓN DEL DOCTOR ==========
    doc.setTextColor(15, 55, 89);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Dr. Cosme Fulanito', 200, 45, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(107, 129, 153);
    doc.text('Médico General', 200, 50, { align: 'right' });
    doc.text('Ced. Prof. 123456789', 200, 54, { align: 'right' });

    // ========== INFORMACIÓN DEL PACIENTE ==========
    let y = 65;
    doc.setTextColor(15, 55, 89);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    
    // Paciente (campo completo)
    doc.text('Paciente:', 10, y);
    doc.setFont(undefined, 'normal');
    doc.text(pacienteNombre, 30, y);
    
    // Línea debajo del nombre
    doc.setDrawColor(107, 129, 153);
    doc.setLineWidth(0.3);
    doc.line(30, y + 1, 200, y + 1);

    // Primera fila de campos
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Edad:', 10, y);
    doc.setFont(undefined, 'normal');
    doc.text(pacienteEdad ? pacienteEdad + ' años' : '', 24, y);
    doc.line(24, y + 1, 50, y + 1);

    doc.setFont(undefined, 'bold');
    doc.text('Fecha:', 55, y);
    doc.setFont(undefined, 'normal');
    doc.text(pacienteFecha, 71, y);
    doc.line(71, y + 1, 105, y + 1);

    doc.setFont(undefined, 'bold');
    doc.text('Peso:', 110, y);
    doc.setFont(undefined, 'normal');
    doc.text(pacientePeso ? pacientePeso + ' kg' : '', 123, y);
    doc.line(123, y + 1, 150, y + 1);

    doc.setFont(undefined, 'bold');
    doc.text('Estatura:', 155, y);
    doc.setFont(undefined, 'normal');
    doc.text(pacienteEstatura ? pacienteEstatura + ' cm' : '', 173, y);
    doc.line(173, y + 1, 200, y + 1);

    // Segunda fila de campos
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.text('F.C.:', 10, y);
    doc.setFont(undefined, 'normal');
    doc.text(pacienteFC ? pacienteFC + ' lpm' : '', 22, y);
    doc.line(22, y + 1, 50, y + 1);

    doc.setFont(undefined, 'bold');
    doc.text('F.R.:', 55, y);
    doc.setFont(undefined, 'normal');
    doc.text(pacienteFR ? pacienteFR + ' rpm' : '', 67, y);
    doc.line(67, y + 1, 95, y + 1);

    doc.setFont(undefined, 'bold');
    doc.text('T.A.:', 100, y);
    doc.setFont(undefined, 'normal');
    doc.text(pacienteTA ? pacienteTA + ' mmHg' : '', 112, y);
    doc.line(112, y + 1, 145, y + 1);

    doc.setFont(undefined, 'bold');
    doc.text('Temp:', 150, y);
    doc.setFont(undefined, 'normal');
    doc.text(pacienteTemp ? pacienteTemp + ' °C' : '', 165, y);
    doc.line(165, y + 1, 200, y + 1);

    // Diagnóstico
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Diagnóstico:', 10, y);
    doc.setFont(undefined, 'normal');
    doc.text(pacienteDiagnostico, 33, y);
    doc.line(33, y + 1, 200, y + 1);

    // ========== ÁREA DE PRESCRIPCIÓN ==========
    y += 12;
    doc.setFont(undefined, 'bold');
    doc.text('Prescripción:', 10, y);

    y += 6;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);

    // Área de texto con líneas para prescripción
    const startYPrescripcion = y;
    const endYPrescripcion = 220;
    const lineSpacing = 7;
    
    // Dibujar líneas para escribir prescripción
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    for (let lineY = startYPrescripcion; lineY < endYPrescripcion; lineY += lineSpacing) {
        doc.line(10, lineY, 200, lineY);
    }

    // Escribir la prescripción
    if (prescripcion) {
        doc.setTextColor(15, 55, 89);
        const lineasPrescripcion = doc.splitTextToSize(prescripcion, 185);
        let textY = startYPrescripcion - 2;
        
        lineasPrescripcion.forEach((linea, index) => {
            if (textY > endYPrescripcion - 4) return;
            doc.text(linea, 12, textY);
            textY += lineSpacing;
        });
    }

    // ========== ÁREA DE RECOMENDACIONES ==========
    y = endYPrescripcion + 5;
    doc.setFont(undefined, 'bold');
    doc.text('Recomendaciones:', 10, y);

    y += 6;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);

    // Área de texto con líneas para recomendaciones
    const startYRecomendaciones = y;
    const endYRecomendaciones = 270;
    
    // Dibujar líneas para escribir recomendaciones
    for (let lineY = startYRecomendaciones; lineY < endYRecomendaciones; lineY += lineSpacing) {
        doc.line(10, lineY, 200, lineY);
    }

    // Escribir las recomendaciones
    if (recomendaciones) {
        doc.setTextColor(15, 55, 89);
        const lineasRecomendaciones = doc.splitTextToSize(recomendaciones, 185);
        let textY = startYRecomendaciones - 2;
        
        lineasRecomendaciones.forEach((linea, index) => {
            if (textY > endYRecomendaciones - 5) return;
            doc.text(linea, 12, textY);
            textY += lineSpacing;
        });
    }

    // ========== FOOTER ==========
    const footerY = 260;
    doc.setFillColor(184, 205, 224); // mismo color
    doc.roundedRect(8, footerY, 194, 31, 6, 6, 'F');

    // Iconos y texto del footer
    doc.setTextColor(15, 55, 89);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    
    // Dirección
    doc.text('Avenida Siempre Viva # 117', 12, footerY + 12);
    
    // Teléfono
    doc.text('961-117-1231', 12, footerY + 18);

    // Espacio para firma (lado derecho)
    doc.setDrawColor(15, 55, 89);
    doc.setLineWidth(0.5);
    doc.line(150, footerY + 25, 195, footerY + 25);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Firma del Médico', 172.5, footerY + 30, { align: 'center' });

    // Descargar PDF
    const nombreArchivo = `Receta_${pacienteNombre.replace(/\s+/g, '_') || 'Paciente'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);
}

// Función para volver a la página de pacientes
function volverPacientes() {
    window.location.href = 'pacienteMedico.html';
}