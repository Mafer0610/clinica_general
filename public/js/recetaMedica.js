const API_BASE_URL = 'http://localhost:3002/api';

let currentPatient = null;
let currentMedico = null;

document.addEventListener('DOMContentLoaded', async function() {
    document.getElementById('pacienteFecha').valueAsDate = new Date();
    
    await cargarDatosIniciales();
});

// ===== CARGAR DATOS DEL PACIENTE Y MÉDICO =====
async function cargarDatosIniciales() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const pacienteId = urlParams.get('pacienteId');
        const nombrePaciente = urlParams.get('paciente');
        
        if (nombrePaciente) {
            document.getElementById('pacienteNombre').value = decodeURIComponent(nombrePaciente);
        }
        
        if (pacienteId) {
            await cargarDatosPaciente(pacienteId);
        }
        await cargarDatosMedico();
        
    } catch (error) {
        console.error(' Error cargando datos iniciales:', error);
    }
}

// ===== CARGAR DATOS COMPLETOS DEL PACIENTE =====
async function cargarDatosPaciente(pacienteId) {
    try {
        console.log('📥 Cargando datos del paciente:', pacienteId);
        
        const response = await fetch(`${API_BASE_URL}/patients/${pacienteId}`);
        const data = await response.json();
        
        if (data.success && data.patient) {
            currentPatient = data.patient;
            document.getElementById('pacienteNombre').value = 
                `${currentPatient.nombre} ${currentPatient.apellidos}`;
            
            if (currentPatient.fechaNacimiento) {
                const edad = calcularEdad(currentPatient.fechaNacimiento);
                document.getElementById('pacienteEdad').value = edad;
            } else if (currentPatient.edad) {
                document.getElementById('pacienteEdad').value = currentPatient.edad;
            }
            
        } else {
            console.warn('⚠️ No se encontraron datos del paciente');
        }
    } catch (error) {
        console.error(' Error cargando datos del paciente:', error);
    }
}

// ===== CALCULAR EDAD =====
function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    
    return edad;
}

// ===== CARGAR DATOS DEL MÉDICO =====
async function cargarDatosMedico() {
    try {
        const medicoId = localStorage.getItem('userId');
        
        if (!medicoId) {
            console.warn('⚠️ No se encontró ID de médico');
            return;
        }
        
        console.log('👨‍⚕️ Cargando datos del médico:', medicoId);
        
        const response = await fetch(`http://localhost:3001/auth/user/${medicoId}`);
        const data = await response.json();
        
        if (data.success && data.user) {
            currentMedico = data.user;
            const nombreMedico = `${currentMedico.nombre || 'Dr.'} ${currentMedico.apellidos || 'Asignado'}`;
            document.getElementById('doctorNombre').textContent = nombreMedico;
            
            if (currentMedico.cedula) {
                document.getElementById('doctorCedula').textContent = currentMedico.cedula;
            }
        } else {
            console.warn('⚠️ No se encontraron datos del médico');
        }
    } catch (error) {
        console.error(' Error cargando datos del médico:', error);
    }
}

// ===== GUARDAR RECETA EN BASE DE DATOS =====
async function guardarReceta() {
    try {
        if (!currentPatient || !currentPatient._id) {
            console.error(' No hay datos del paciente');
            return false;
        }
        
        const recetaData = {
            pacienteId: currentPatient._id.toString(),
            pacienteNombre: document.getElementById('pacienteNombre').value,
            pacienteEdad: parseInt(document.getElementById('pacienteEdad').value) || null,
            medicoId: localStorage.getItem('userId') || '',
            medicoNombre: currentMedico ? 
                `${currentMedico.nombre || 'Dr.'} ${currentMedico.apellidos || 'Asignado'}` : 
                'Dr. Asignado',
            medicoCedula: currentMedico?.cedula || '',
            peso: document.getElementById('pacientePeso').value,
            estatura: document.getElementById('pacienteEstatura').value,
            frecuenciaCardiaca: document.getElementById('pacienteFC').value,
            frecuenciaRespiratoria: document.getElementById('pacienteFR').value,
            tensionArterial: document.getElementById('pacienteTA').value,
            temperatura: document.getElementById('pacienteTemp').value,
            diagnostico: document.getElementById('pacienteDiagnostico').value,
            prescripcion: document.getElementById('prescripcionTexto').value,
            recomendaciones: document.getElementById('recomendacionesTexto').value,
            fecha: document.getElementById('pacienteFecha').value
        };
        
        const response = await fetch(`${API_BASE_URL}/recetas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(recetaData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Receta guardada correctamente:', data.recetaId);
            return true;
        } else {
            console.error(' Error guardando receta:', data.error);
            return false;
        }
    } catch (error) {
        console.error(' Error guardando receta:', error);
        return false;
    }
}

// ===== GENERAR PDF (CON GUARDADO AUTOMÁTICO) =====
async function generarPDF() {
    const guardado = await guardarReceta();
    
    if (!guardado) {
        console.warn('⚠️ La receta no se pudo guardar, pero se generará el PDF');
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

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
    doc.setFillColor(15, 55, 89);
    doc.rect(10, 10, 25, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('djfa', 22.5, 26, { align: 'center' });

    doc.setFillColor(184, 205, 224);
    doc.roundedRect(150, 10, 50, 18, 3, 3, 'F');
    doc.setTextColor(15, 55, 89);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('RECETA', 175, 22, { align: 'center' });

    doc.setDrawColor(15, 55, 89);
    doc.setLineWidth(0.5);
    doc.line(10, 38, 200, 38);

    // ========== INFORMACIÓN DEL DOCTOR ==========
    doc.setTextColor(15, 55, 89);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    
    const nombreMedico = currentMedico ? 
        `Dr. ${currentMedico.nombre || ''} ${currentMedico.apellidos || ''}`.trim() : 
        'Dr. Cosme Fulanito';
    doc.text(nombreMedico, 200, 45, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(107, 129, 153);
    doc.text('Médico General', 200, 50, { align: 'right' });
    
    const cedula = currentMedico?.cedula || '123456789';
    doc.text(`Ced. Prof. ${cedula}`, 200, 54, { align: 'right' });

    // ========== INFORMACIÓN DEL PACIENTE ==========
    let y = 65;
    doc.setTextColor(15, 55, 89);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    
    doc.text('Paciente:', 10, y);
    doc.setFont(undefined, 'normal');
    doc.text(pacienteNombre, 30, y);
    
    doc.setDrawColor(107, 129, 153);
    doc.setLineWidth(0.3);
    doc.line(30, y + 1, 200, y + 1);

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

    const startYPrescripcion = y;
    const endYPrescripcion = 220;
    const lineSpacing = 7;
    
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    for (let lineY = startYPrescripcion; lineY < endYPrescripcion; lineY += lineSpacing) {
        doc.line(10, lineY, 200, lineY);
    }

    if (prescripcion) {
        doc.setTextColor(15, 55, 89);
        const lineasPrescripcion = doc.splitTextToSize(prescripcion, 185);
        let textY = startYPrescripcion - 2;
        
        lineasPrescripcion.forEach((linea) => {
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

    const startYRecomendaciones = y;
    const endYRecomendaciones = 270;
    
    for (let lineY = startYRecomendaciones; lineY < endYRecomendaciones; lineY += lineSpacing) {
        doc.line(10, lineY, 200, lineY);
    }

    if (recomendaciones) {
        doc.setTextColor(15, 55, 89);
        const lineasRecomendaciones = doc.splitTextToSize(recomendaciones, 185);
        let textY = startYRecomendaciones - 2;
        
        lineasRecomendaciones.forEach((linea) => {
            if (textY > endYRecomendaciones - 5) return;
            doc.text(linea, 12, textY);
            textY += lineSpacing;
        });
    }

    // ========== FOOTER ==========
    const footerY = 260;
    doc.setFillColor(184, 205, 224);
    doc.roundedRect(8, footerY, 194, 31, 6, 6, 'F');

    doc.setTextColor(15, 55, 89);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    
    doc.text('Avenida Siempre Viva # 117', 12, footerY + 12);
    doc.text('961-117-1231', 12, footerY + 18);

    doc.setDrawColor(15, 55, 89);
    doc.setLineWidth(0.5);
    doc.line(150, footerY + 25, 195, footerY + 25);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Firma del Médico', 172.5, footerY + 30, { align: 'center' });

    const nombreArchivo = `Receta_${pacienteNombre.replace(/\s+/g, '_') || 'Paciente'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);
    
    if (guardado) {
        alert('✅ Receta guardada y descargada correctamente');
    }
}
function volverPacientes() {
    window.location.href = 'pacienteMedico.html';
}