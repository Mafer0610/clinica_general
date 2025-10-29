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
let currentUserEmail = null;
let medicoData = null;

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

    currentUserEmail = userEmail;
    await cargarDatosMedico();
    await cargarProximaCita(userEmail);
    configurarModalPerfil();
    configurarBotones();
});

// ===== CARGAR DATOS DEL MÉDICO =====
async function cargarDatosMedico() {
    try {
        console.log('👨‍⚕️ Cargando datos del médico...');
        
        const medicoId = '68f6eea656098b06a1707209';
        
        const response = await fetch(`http://localhost:3001/auth/user/${medicoId}`);
        const data = await response.json();

        if (data.success && data.user) {
            medicoData = data.user;
            console.log('✅ Médico cargado:', medicoData.nombre, medicoData.apellidos);
        } else {
            console.warn('⚠️ No se pudo cargar info del médico');
            medicoData = {
                nombre: 'Dr.',
                apellidos: 'Asignado'
            };
        }
    } catch (error) {
        console.error('❌ Error cargando médico:', error);
        medicoData = {
            nombre: 'Dr.',
            apellidos: 'Asignado'
        };
    }
}

// ===== CARGAR PRÓXIMA CITA ==========
async function cargarProximaCita(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/patient-profile/appointments/upcoming/${encodeURIComponent(email)}`);
        const data = await response.json();

        if (data.success) {
            if (data.appointments && data.appointments.length > 0) {
                proximaCita = data.appointments[0];
                console.log('✅ Próxima cita encontrada');
                
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

    // Mostrar datos reales del médico
    if (medicoData) {
        document.getElementById('nombre-doctor').value = medicoData.nombre || 'Dr.';
        document.getElementById('apellido-doctor').value = medicoData.apellidos || 'Asignado';
    } else {
        document.getElementById('nombre-doctor').value = 'Dr.';
        document.getElementById('apellido-doctor').value = 'Asignado';
    }

    if (patientData) {
        document.getElementById('nombre-paciente').value = patientData.nombre || '';
        document.getElementById('apellido-paciente').value = patientData.apellidos || '';
    } else if (proximaCita.pacienteNombre) {
        const nombres = proximaCita.pacienteNombre.split(' ');
        document.getElementById('nombre-paciente').value = nombres[0] || '';
        document.getElementById('apellido-paciente').value = nombres.slice(1).join(' ') || '';
    }

    const fechaISO = proximaCita.fecha.split('T')[0];
    
    document.getElementById('fecha-cita').value = fechaISO;
    document.getElementById('hora-cita').value = proximaCita.hora || '';

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
    
    let nombreMedico = 'Dr.';
    let apellidoMedico = 'Asignado';
    
    if (medicoData) {
        nombreMedico = medicoData.nombre || 'Dr.';
        apellidoMedico = medicoData.apellidos || 'Asignado';
    }
    
    container.innerHTML = `
        <div class="form-section">
            <h2 class="section-title">Doctor Asignado</h2>
            <div class="form-row">
                <div class="form-group">
                    <label for="nombre-doctor">Nombre</label>
                    <input type="text" id="nombre-doctor" value="${nombreMedico}" readonly>
                </div>
                <div class="form-group">
                    <label for="apellido-doctor">Apellido</label>
                    <input type="text" id="apellido-doctor" value="${apellidoMedico}" readonly>
                </div>
            </div>
        </div>
        
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
    const btnConfirmar = document.querySelector('.btn-submit:first-of-type');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async (e) => {
            e.preventDefault();
            await confirmarAsistencia();
        });
    }

    const btnCancelar = document.querySelector('.btn-submit:last-of-type');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', async (e) => {
            e.preventDefault();
            await cancelarCita();
        });
    }
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
    const form = modal.querySelector('.modal-form-perfil');

    profileIcon.addEventListener('click', async () => {
        await cargarDatosModalPerfil();
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarCambiosPerfil();
    });
}

// ===== CARGAR DATOS EN MODAL DE PERFIL =====
async function cargarDatosModalPerfil() {
    try {
        console.log('📥 Cargando datos del modal de perfil...');
        
        const userId = localStorage.getItem('userId');
        console.log('🆔 User ID:', userId);
        
        const response = await fetch(`http://localhost:3001/auth/user/${userId}`);
        const data = await response.json();

        console.log('📋 Respuesta auth:', data);

        if (data.success && data.user) {
            if (patientData) {
                console.log('✅ Usando datos del perfil del paciente');
                document.getElementById('nombre').value = patientData.nombre || '';
                document.getElementById('apellidos').value = patientData.apellidos || '';
                document.getElementById('telefono').value = patientData.telefono || '';
                document.getElementById('emergencia').value = patientData.telefonoEmergencia || '';
            } else {
                console.log('⚠️ Usando datos del auth (sin perfil completo)');
                document.getElementById('nombre').value = data.user.nombre || '';
                document.getElementById('apellidos').value = data.user.apellidos || '';
                document.getElementById('telefono').value = data.user.telefono || '';
                document.getElementById('emergencia').value = '';
            }
            
            document.getElementById('correo').value = data.user.email || '';
            
            console.log('✅ Modal de perfil cargado');
        } else {
            console.error('❌ No se encontraron datos del usuario');
        }
    } catch (error) {
        console.error('❌ Error cargando datos del modal:', error);
    }
}

// ===== GUARDAR CAMBIOS DEL PERFIL =====
async function guardarCambiosPerfil() {
    try {
        const nombre = document.getElementById('nombre').value.trim();
        const apellidos = document.getElementById('apellidos').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        const emergencia = document.getElementById('emergencia').value.trim();

        const userId = localStorage.getItem('userId');
        const authResponse = await fetch(`http://localhost:3001/auth/user/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: nombre,
                apellidos: apellidos,
                telefono: telefono
            })
        });

        const authData = await authResponse.json();

        if (!authData.success) {
            throw new Error('Error al actualizar usuario');
        }

        if (patientData) {
            const profileResponse = await fetch(`${API_BASE_URL}/patient-profile/profile/upsert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: currentUserEmail,
                    nombre: nombre,
                    apellidos: apellidos,
                    telefono: telefono,
                    telefonoEmergencia: emergencia,
                    domicilio: patientData.domicilio,
                    alergias: patientData.alergias,
                    padecimientos: patientData.padecimientos,
                    tipoSanguineo: patientData.tipoSanguineo,
                    sexo: patientData.sexo,
                    fechaNacimiento: patientData.fechaNacimiento
                })
            });

            const profileData = await profileResponse.json();

            if (!profileData.success) {
                throw new Error('Error al actualizar perfil de paciente');
            }
        }

        alert('✅ Perfil actualizado correctamente');
        document.getElementById('modalPerfil').style.display = 'none';
        
        await cargarDatosPaciente(currentUserEmail);
        mostrarProximaCita();
        
    } catch (error) {
        console.error('❌ Error guardando perfil:', error);
        alert('❌ Error al guardar cambios: ' + error.message);
    }
}