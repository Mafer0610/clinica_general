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

// ===== CARGAR HISTORIAL AL INICIAR =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Cargando historial de citas...');
    
    const userEmail = localStorage.getItem('userEmail');
    
    if (!userEmail) {
        console.error('❌ No se encontró email del usuario');
        alert('Error: No se encontró información del usuario. Por favor inicia sesión nuevamente.');
        window.location.href = '../html/index.html';
        return;
    }

    await cargarHistorialCitas(userEmail);
    configurarModalPerfil();
});

// ===== CARGAR HISTORIAL DE CITAS =====
async function cargarHistorialCitas(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/patient-profile/appointments/history/${encodeURIComponent(email)}`);
        const data = await response.json();

        if (data.success) {
            if (data.appointments && data.appointments.length > 0) {
                console.log(`✅ Se cargaron ${data.appointments.length} citas del historial`);
                mostrarHistorialCitas(data.appointments);
            } else {
                console.log('⚠️ No hay citas en el historial');
                mostrarMensajeSinCitas();
            }
        } else {
            console.error('❌ Error cargando historial:', data.error);
            mostrarMensajeError();
        }
    } catch (error) {
        console.error('❌ Error conectando con el servidor:', error);
        mostrarMensajeError();
    }
}

// ===== MOSTRAR HISTORIAL DE CITAS =====
function mostrarHistorialCitas(appointments) {
    const container = document.querySelector('.container');
    container.innerHTML = ''; // Limpiar contenido actual

    appointments.forEach((cita, index) => {
        const fecha = new Date(cita.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const tipoCita = TIPOS_CITA[cita.tipoCita] || cita.tipo || 'Consulta General';
        const hora = cita.hora || 'N/A';
        const sintomas = cita.descripcion || 'Sin descripción';
        const diagnostico = cita.diagnostico || 'Pendiente';

        const citaHTML = `
            <div class="form-section">
                <h2 class="section-title">${fechaFormateada}</h2>
                <div class="form-row">
                    <div class="form-group">
                        <label>Hora de la cita</label>
                        <input type="text" value="${hora}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Tipo de Consulta</label>
                        <input type="text" value="${tipoCita}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Estado</label>
                        <input type="text" value="${obtenerEstadoCita(cita.estado)}" readonly>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Síntomas</label>
                        <textarea readonly>${sintomas}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Diagnóstico</label>
                        <textarea readonly>${diagnostico}</textarea>
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', citaHTML);
    });
}

// ===== OBTENER ESTADO DE LA CITA =====
function obtenerEstadoCita(estado) {
    const estados = {
        'pendiente': 'Pendiente',
        'confirmada': 'Confirmada',
        'en_curso': 'En Curso',
        'completada': 'Completada',
        'cancelada': 'Cancelada',
        'no_asistio': 'No Asistió'
    };
    
    return estados[estado] || 'Desconocido';
}

// ===== MOSTRAR MENSAJE SIN CITAS =====
function mostrarMensajeSinCitas() {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="form-section" style="text-align: center; padding: 60px 20px;">
            <i class="fas fa-calendar-times" style="font-size: 64px; color: #6B8199; margin-bottom: 20px;"></i>
            <h2 style="color: #0F3759; margin-bottom: 15px;">No hay citas en tu historial</h2>
            <p style="color: #6B8199; font-size: 1.1em; margin-bottom: 30px;">
                Aún no has tenido citas médicas. Una vez que asistas a tus citas, aparecerán aquí.
            </p>
            <a href="inicioPaciente.html" class="btn-submit" style="display: inline-block; text-decoration: none;">
                <i class="fas fa-calendar-plus"></i> Agendar Primera Cita
            </a>
        </div>
    `;
}

// ===== MOSTRAR MENSAJE DE ERROR =====
function mostrarMensajeError() {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="form-section" style="text-align: center; padding: 60px 20px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: #ff6b6b; margin-bottom: 20px;"></i>
            <h2 style="color: #0F3759; margin-bottom: 15px;">Error al cargar el historial</h2>
            <p style="color: #6B8199; font-size: 1.1em; margin-bottom: 30px;">
                No se pudo conectar con el servidor. Por favor intenta nuevamente.
            </p>
            <button onclick="location.reload()" class="btn-submit">
                <i class="fas fa-redo"></i> Reintentar
            </button>
        </div>
    `;
}

// ===== CONFIGURAR MODAL DE PERFIL =====
function configurarModalPerfil() {
    const profileIcon = document.getElementById('profileIconPacientes');
    const modal = document.getElementById('modalPerfil');
    const closeBtn = modal.querySelector('.modal-close');

    profileIcon.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}