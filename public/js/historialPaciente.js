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
let currentUserEmail = null;
let patientData = null;

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

    currentUserEmail = userEmail;
    await cargarDatosPaciente();
    await cargarHistorialCitas(userEmail);
    configurarModalPerfil();
});

// ===== CARGAR DATOS DEL PACIENTE =====
async function cargarDatosPaciente() {
    try {
        console.log('📥 Cargando perfil del paciente...');
        
        const response = await fetch(`${API_BASE_URL}/patient-profile/profile/${encodeURIComponent(currentUserEmail)}`);
        const data = await response.json();

        if (data.success && data.hasProfile && data.patient) {
            patientData = data.patient;
            console.log('✅ Perfil del paciente cargado');
        } else {
            console.log('⚠️ No se encontró perfil del paciente');
            patientData = null;
        }
    } catch (error) {
        console.error('❌ Error cargando datos del paciente:', error);
        patientData = null;
    }
}

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
    container.innerHTML = '';

    appointments.forEach((cita, index) => {
        const fechaISO = cita.fecha.split('T')[0];
        const [year, month, day] = fechaISO.split('-');
        const fechaFormateada = `${day}/${month}/${year}`;

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
        
        await cargarDatosPaciente();
        
    } catch (error) {
        console.error('❌ Error guardando perfil:', error);
        alert('❌ Error al guardar cambios: ' + error.message);
    }
}