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
    console.log('✅ Email del usuario:', currentUserEmail);
    
    await cargarDatosMedico();
    await cargarProximaCita(userEmail);
    configurarModalPerfil();
    
    // ✅ IMPORTANTE: Configurar botones DESPUÉS de cargar la cita
    console.log('🔧 Configurando event listeners de botones...');
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
        console.log('📥 Solicitando próximas citas para:', email);
        
        const response = await fetch(`${API_BASE_URL}/patient-profile/appointments/upcoming/${encodeURIComponent(email)}`);
        const data = await response.json();

        console.log('📦 Respuesta del servidor:', data);

        if (data.success) {
            if (data.appointments && data.appointments.length > 0) {
                proximaCita = data.appointments[0];
                console.log('✅ Próxima cita encontrada:', proximaCita);
                
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
            console.log('✅ Datos del paciente cargados');
        }
    } catch (error) {
        console.error('❌ Error cargando datos del paciente:', error);
    }
}

// ===== MOSTRAR PRÓXIMA CITA =====
function mostrarProximaCita() {
    if (!proximaCita) {
        console.error('❌ No hay cita para mostrar');
        return;
    }

    console.log('📋 Mostrando cita en la UI...');

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

    console.log('✅ Datos mostrados en la UI');
    actualizarEstadoConfirmacion();
}

// ===== ACTUALIZAR ESTADO DE CONFIRMACIÓN =====
function actualizarEstadoConfirmacion() {
    console.log('🔄 Actualizando estado de confirmación...');
    console.log('   Estado actual de la cita:', proximaCita.estado);
    console.log('   Confirmada:', proximaCita.confirmada);
    
    const btnConfirmar = document.querySelector('.btn-submit:first-of-type');
    const btnCancelar = document.querySelector('.btn-submit:last-of-type');

    if (!btnConfirmar || !btnCancelar) {
        console.error('❌ No se encontraron los botones en el DOM');
        return;
    }

    if (proximaCita.confirmada) {
        console.log('✅ Cita confirmada - Actualizando botón a verde');
        btnConfirmar.innerHTML = '<i class="fas fa-check-circle"></i> Asistencia Confirmada';
        btnConfirmar.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        btnConfirmar.disabled = true;
        btnConfirmar.style.cursor = 'not-allowed';
        btnConfirmar.style.opacity = '0.8';
    } else {
        console.log('⏳ Cita pendiente - Botón azul normal');
        btnConfirmar.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar Asistencia';
        btnConfirmar.style.background = 'linear-gradient(135deg, #0F3759 0%, #1C4D8C 100%)';
        btnConfirmar.disabled = false;
        btnConfirmar.style.cursor = 'pointer';
        btnConfirmar.style.opacity = '1';
    }

    if (proximaCita.estado === 'cancelada') {
        console.log('⚠️ Cita cancelada - Deshabilitando botones');
        btnConfirmar.disabled = true;
        btnCancelar.disabled = true;
        btnConfirmar.style.opacity = '0.5';
        btnCancelar.style.opacity = '0.5';
        
        const container = document.querySelector('.form-section:last-child');
        const existingAlert = container.querySelector('.alert-cancelada');
        
        if (!existingAlert) {
            container.insertAdjacentHTML('afterbegin', `
                <div class="alert-cancelada" style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="color: #856404; font-size: 24px; margin-bottom: 10px;"></i>
                    <p style="color: #856404; font-weight: 600; margin: 0;">Esta cita ha sido cancelada</p>
                </div>
            `);
        }
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
    console.log('🔧 Configurando event listeners...');
    
    const btnConfirmar = document.querySelector('.btn-submit:first-of-type');
    const btnCancelar = document.querySelector('.btn-submit:last-of-type');
    
    if (!btnConfirmar) {
        console.error('❌ No se encontró el botón de confirmar');
        return;
    }
    
    if (!btnCancelar) {
        console.error('❌ No se encontró el botón de cancelar');
        return;
    }
    
    console.log('✅ Botones encontrados');
    
    // Remover listeners previos (si existen)
    btnConfirmar.replaceWith(btnConfirmar.cloneNode(true));
    btnCancelar.replaceWith(btnCancelar.cloneNode(true));
    
    // Obtener referencias actualizadas
    const newBtnConfirmar = document.querySelector('.btn-submit:first-of-type');
    const newBtnCancelar = document.querySelector('.btn-submit:last-of-type');
    
    // Agregar nuevos listeners
    newBtnConfirmar.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('🖱️ Click en CONFIRMAR ASISTENCIA');
        await confirmarAsistencia();
    });
    
    newBtnCancelar.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('🖱️ Click en CANCELAR CITA');
        await cancelarCita();
    });
    
    console.log('✅ Event listeners configurados correctamente');
}

// ===== CONFIRMAR ASISTENCIA =====
async function confirmarAsistencia() {
    console.log('📝 Función confirmarAsistencia() iniciada');
    
    if (!proximaCita) {
        console.error('❌ No hay cita para confirmar');
        alert('Error: No se encontró información de la cita');
        return;
    }

    // Si ya está confirmada, no hacer nada
    if (proximaCita.confirmada) {
        console.log('⚠️ La cita ya está confirmada');
        return;
    }

    const confirmar = confirm('¿Confirmas tu asistencia a esta cita?');
    if (!confirmar) {
        console.log('❌ Usuario canceló la confirmación');
        return;
    }

    try {
        console.log('📤 Enviando petición de confirmación...');
        console.log('   URL:', `${API_BASE_URL}/patient-profile/appointments/${proximaCita._id}/confirm`);
        
        // Mostrar loading en el botón
        const btnConfirmar = document.querySelector('.btn-submit:first-of-type');
        const textoOriginal = btnConfirmar.innerHTML;
        btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Confirmando...';
        btnConfirmar.disabled = true;

        const response = await fetch(`${API_BASE_URL}/patient-profile/appointments/${proximaCita._id}/confirm`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('📥 Respuesta recibida:', response.status);
        
        const data = await response.json();
        console.log('📦 Datos de respuesta:', data);

        if (data.success) {
            console.log('✅ Confirmación exitosa');
            
            // Actualizar estado local
            proximaCita.confirmada = true;
            proximaCita.estado = 'confirmada';
            
            // Actualizar UI
            actualizarEstadoConfirmacion();
            
            // Mostrar notificación
            mostrarNotificacionExito('✅ Asistencia confirmada correctamente');
        } else {
            console.error('❌ Error en la respuesta:', data.error);
            // Restaurar botón
            btnConfirmar.innerHTML = textoOriginal;
            btnConfirmar.disabled = false;
            
            alert('❌ Error al confirmar asistencia: ' + data.error);
        }
    } catch (error) {
        console.error('❌ Error en confirmación:', error);
        
        // Restaurar botón
        const btnConfirmar = document.querySelector('.btn-submit:first-of-type');
        btnConfirmar.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar Asistencia';
        btnConfirmar.disabled = false;
        
        alert('❌ Error al confirmar asistencia. Por favor intenta nuevamente.');
    }
}

// ===== CANCELAR CITA =====
async function cancelarCita() {
    console.log('🗑️ Función cancelarCita() iniciada');
    
    if (!proximaCita) {
        console.error('❌ No hay cita para cancelar');
        alert('Error: No se encontró información de la cita');
        return;
    }

    const confirmar = confirm(
        '⚠️ ¿Estás seguro de que deseas ELIMINAR esta cita?\n\n' +
        '⚡ Esta acción es PERMANENTE y no se puede deshacer.\n\n' +
        'La cita será eliminada completamente del sistema.'
    );
    
    if (!confirmar) {
        console.log('❌ Usuario canceló la eliminación');
        return;
    }

    try {
        console.log('📤 Enviando petición de eliminación...');
        console.log('   URL:', `${API_BASE_URL}/appointments/${proximaCita._id}`);
        
        // Mostrar loading
        const btnCancelar = document.querySelector('.btn-submit:last-of-type');
        const textoOriginal = btnCancelar.innerHTML;
        btnCancelar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        btnCancelar.disabled = true;

        const response = await fetch(`${API_BASE_URL}/appointments/${proximaCita._id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('📥 Respuesta recibida:', response.status);
        
        const data = await response.json();
        console.log('📦 Datos de respuesta:', data);

        if (data.success) {
            console.log('✅ Cita eliminada correctamente');
            
            // Mostrar notificación
            mostrarNotificacionExito('✅ Cita cancelada y eliminada correctamente');
            
            // Redirigir después de 2 segundos
            setTimeout(() => {
                console.log('🔄 Redirigiendo a inicioPaciente.html...');
                window.location.href = 'inicioPaciente.html';
            }, 2000);
        } else {
            console.error('❌ Error en la respuesta:', data.error);
            throw new Error(data.error || 'Error al eliminar cita');
        }
    } catch (error) {
        console.error('❌ Error eliminando cita:', error);
        
        // Restaurar botón
        const btnCancelar = document.querySelector('.btn-submit:last-of-type');
        btnCancelar.innerHTML = '<i class="fas fa-times-circle"></i> Cancelar Cita';
        btnCancelar.disabled = false;
        
        alert('❌ Error al eliminar la cita: ' + error.message + '\n\nPor favor intenta nuevamente.');
    }
}

// ===== MOSTRAR NOTIFICACIÓN DE ÉXITO =====
function mostrarNotificacionExito(mensaje) {
    const notificacion = document.createElement('div');
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 600;
        font-size: 16px;
    `;
    notificacion.innerHTML = `
        <i class="fas fa-check-circle" style="margin-right: 10px;"></i>
        ${mensaje}
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
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
        const userId = localStorage.getItem('userId');
        const response = await fetch(`http://localhost:3001/auth/user/${userId}`);
        const data = await response.json();

        if (data.success && data.user) {
            if (patientData) {
                document.getElementById('nombre').value = patientData.nombre || '';
                document.getElementById('apellidos').value = patientData.apellidos || '';
                document.getElementById('telefono').value = patientData.telefono || '';
                document.getElementById('emergencia').value = patientData.telefonoEmergencia || '';
            } else {
                document.getElementById('nombre').value = data.user.nombre || '';
                document.getElementById('apellidos').value = data.user.apellidos || '';
                document.getElementById('telefono').value = data.user.telefono || '';
                document.getElementById('emergencia').value = '';
            }
            
            document.getElementById('correo').value = data.user.email || '';
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

console.log('✅ proximaCitaPaciente.js cargado completamente');