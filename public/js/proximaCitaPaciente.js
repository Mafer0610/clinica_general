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

// ===== VARIABLES GLOBALES =====
let proximaCita = null;
let patientData = null;

// ===== CARGAR PRÓXIMA CITA AL INICIAR =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Cargando próxima cita...');
    
    const userEmail = localStorage.getItem('userEmail');
    
    if (!userEmail) {
        console.error('❌ No se encontró email del usuario');
        alert('Error: No se encontró información del usuario. Por favor inicia sesión nuevamente.');
        window.location.href = '../html/index.html';
        return;
    }

    await cargarProximaCita(userEmail);
    configurarModalPerfil();
    configurarBotones();
});

// ===== CARGAR PRÓXIMA CITA ==========
async function cargarProximaCita(email) {
    try {
        // Cargar perfil del paciente y sus citas
        const response = await fetch(`${API_BASE_URL}/patient-profile/appointments/upcoming/${encodeURIComponent(email)}`);
        const data = await response.json();

        if (data.success) {
            if (data.appointments && data.appointments.length > 0) {
                proximaCita = data.appointments[0]; // La primera es la más próxima
                console.log('✅ Próxima cita encontrada:', proximaCita);
                
                // Cargar datos del paciente
                await cargarDatosPaciente(email);
                
                mostrarProximaCita();
            } else {
                console.log('⚠️ No hay próximas citas');
                mostrarMensajeSinCitas();
            }
        } else {
            console.error('❌ Error cargando próximas citas:', data.error);
            mostrarMensajeError();
        }
    } catch (error) {
        console.error('❌ Error conectando con el servidor:', error);
        mostrarMensajeError();
    }
}

// ===== CARGAR DATOS DEL PACIENTE =====
async function cargarDatosPaciente(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/patient-profile/profile/${encodeURIComponent(email)}`);
        const data = await response.json();

        if (data.success && data.hasProfile) {
            patientData = data.patient;
        }
    } catch (error) {
        console.error('❌ Error cargando datos del paciente:', error);
    }
}

// ===== MOSTRAR PRÓXIMA CITA =====
function mostrarProximaCita() {
    if (!proximaCita) return;

    // Datos del Doctor (por ahora genérico, después se puede vincular con médicos reales)
    document.getElementById('nombre-doctor').value = 'Dr. Asignado';
    document.getElementById('apellido-doctor').value = 'Sistema DJFA';

    // Datos del Paciente
    if (patientData) {
        document.getElementById('nombre-paciente').value = patientData.nombre || '';
        document.getElementById('apellido-paciente').value = patientData.apellidos || '';
    } else if (proximaCita.pacienteNombre) {
        const nombres = proximaCita.pacienteNombre.split(' ');
        document.getElementById('nombre-paciente').value = nombres[0] || '';
        document.getElementById('apellido-paciente').value = nombres.slice(1).join(' ') || '';
    }

    // CORRECCIÓN: Datos de la Cita - Formatear fecha correctamente
    const fechaISO = proximaCita.fecha.split('T')[0]; // Obtener solo YYYY-MM-DD
    
    document.getElementById('fecha-cita').value = fechaISO;
    document.getElementById('hora-cita').value = proximaCita.hora || '';

    // Actualizar estado de confirmación
    actualizarEstadoConfirmacion();
}

// ===== ACTUALIZAR ESTADO DE CONFIRMACIÓN =====
function actualizarEstadoConfirmacion() {
    const btnConfirmar = document.querySelector('.btn-submit:first-of-type');
    const btnCancelar = document.querySelector('.btn-submit:last-of-type');

    if (proximaCita.confirmada) {
        btnConfirmar.textContent = '✅ Asistencia Confirmada';
        btnConfirmar.style.backgroundColor = '#28a745';
        btnConfirmar.disabled = true;
        btnConfirmar.style.cursor = 'not-allowed';
    }

    if (proximaCita.estado === 'cancelada') {
        btnConfirmar.disabled = true;
        btnCancelar.disabled = true;
        btnConfirmar.style.opacity = '0.5';
        btnCancelar.style.opacity = '0.5';
        
        // Mostrar mensaje de cancelación
        const container = document.querySelector('.form-section:last-child');
        container.insertAdjacentHTML('afterbegin', `
            <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="color: #856404; font-size: 24px; margin-bottom: 10px;"></i>
                <p style="color: #856404; font-weight: 600; margin: 0;">Esta cita ha sido cancelada</p>
            </div>
        `);
    }
}

// ===== MOSTRAR MENSAJE SIN CITAS =====
function mostrarMensajeSinCitas() {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="form-section" style="text-align: center; padding: 60px 20px;">
            <i class="fas fa-calendar-check" style="font-size: 64px; color: #6B8199; margin-bottom: 20px;"></i>
            <h2 style="color: #0F3759; margin-bottom: 15px;">No tienes próximas citas</h2>
            <p style="color: #6B8199; font-size: 1.1em; margin-bottom: 30px;">
                Actualmente no tienes citas programadas. ¿Deseas agendar una nueva cita?
            </p>
            <a href="inicioPaciente.html" class="btn-submit" style="display: inline-block; text-decoration: none;">
                <i class="fas fa-calendar-plus"></i> Agendar Nueva Cita
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
            <h2 style="color: #0F3759; margin-bottom: 15px;">Error al cargar la cita</h2>
            <p style="color: #6B8199; font-size: 1.1em; margin-bottom: 30px;">
                No se pudo conectar con el servidor. Por favor intenta nuevamente.
            </p>
            <button onclick="location.reload()" class="btn-submit">
                <i class="fas fa-redo"></i> Reintentar
            </button>
        </div>
    `;
}

// ===== CONFIGURAR BOTONES =====
function configurarBotones() {
    // Botón Confirmar Asistencia
    const btnConfirmar = document.querySelector('.btn-submit:first-of-type');
    btnConfirmar.addEventListener('click', async (e) => {
        e.preventDefault();
        await confirmarAsistencia();
    });

    // Botón Cancelar Cita
    const btnCancelar = document.querySelector('.btn-submit:last-of-type');
    btnCancelar.addEventListener('click', async (e) => {
        e.preventDefault();
        await cancelarCita();
    });
}

// ===== CONFIRMAR ASISTENCIA =====
async function confirmarAsistencia() {
    if (!proximaCita) return;

    const confirmar = confirm('¿Confirmas tu asistencia a esta cita?');
    if (!confirmar) return;

    try {
        const response = await fetch(`${API_BASE_URL}/patient-profile/appointments/${proximaCita._id}/confirm`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Asistencia confirmada correctamente');
            proximaCita.confirmada = true;
            proximaCita.estado = 'confirmada';
            actualizarEstadoConfirmacion();
        } else {
            alert('❌ Error al confirmar asistencia: ' + data.error);
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error al confirmar asistencia');
    }
}

// ===== CANCELAR CITA =====
async function cancelarCita() {
    if (!proximaCita) return;

    const confirmar = confirm('⚠️ ¿Estás seguro de que deseas cancelar esta cita?\n\nEsta acción no se puede deshacer.');
    if (!confirmar) return;

    try {
        const response = await fetch(`${API_BASE_URL}/patient-profile/appointments/${proximaCita._id}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Cita cancelada correctamente');
            proximaCita.estado = 'cancelada';
            actualizarEstadoConfirmacion();
        } else {
            alert('❌ Error al cancelar cita: ' + data.error);
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error al cancelar cita');
    }
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