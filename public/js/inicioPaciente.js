// ===== CONFIGURACIÓN API =====
const API_BASE_URL = 'http://localhost:3002/api';

// ===== VARIABLES GLOBALES =====
let currentUserEmail = null;
let currentPatientData = null;
let defaultMedicoId = null;

// ===== CARGAR DATOS AL INICIAR =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Inicializando Inicio Paciente...');
    
    const userEmail = localStorage.getItem('userEmail');
    
    if (!userEmail) {
        console.error('❌ No se encontró email del usuario');
        alert('Error: No se encontró información del usuario. Por favor inicia sesión nuevamente.');
        window.location.href = '../html/index.html';
        return;
    }

    currentUserEmail = userEmail;
    console.log('✅ Email del usuario:', currentUserEmail);

    await obtenerMedicoPorDefecto();
    await cargarPerfilPaciente();
    configurarModalPerfil();
});

// ===== FUNCIÓN GENERAR CITA =====
async function generarCita() {
    try {        
        // Obtener valores de los campos
        const nombre = document.getElementById('nombre').value.trim();
        const apellidos = document.getElementById('apellido').value.trim();
        const fecha = document.getElementById('fecha').value;
        const hora = document.getElementById('hora').value;
        const sintomas = document.getElementById('sintomas').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        const emergencia = document.getElementById('emergencia').value.trim();
        const tipoSanguineo = document.getElementById('sanguineo').value.trim();
        const alergias = document.getElementById('alergias').value.trim();
        const padecimientos = document.getElementById('padecimiento').value.trim();
        const domicilio = document.getElementById('domicilio').value.trim();
        
        // Validaciones
        if (!nombre || !apellidos) {
            console.error('❌ Validación fallida: nombre o apellidos vacíos');
            alert('⚠️ Por favor completa tu nombre y apellidos');
            return;
        }
        
        if (!fecha || !hora) {
            console.error('❌ Validación fallida: fecha u hora vacías');
            alert('⚠️ Por favor selecciona fecha y hora para la cita');
            return;
        }
        
        if (!sintomas) {
            console.error('❌ Validación fallida: síntomas vacíos');
            alert('⚠️ Por favor describe tus síntomas');
            return;
        }
        
        if (!telefono || !emergencia) {
            console.error('❌ Validación fallida: teléfonos vacíos');
            alert('⚠️ Por favor completa los teléfonos de contacto');
            return;
        }
        
        if (!domicilio) {
            console.error('❌ Validación fallida: domicilio vacío');
            alert('⚠️ Por favor completa tu domicilio');
            return;
        }
        
        console.log('✅ Todas las validaciones pasaron');
        const profilePayload = {
            email: currentUserEmail,
            nombre: nombre,
            apellidos: apellidos,
            telefono: telefono,
            telefonoEmergencia: emergencia,
            domicilio: domicilio,
            alergias: alergias,
            padecimientos: padecimientos,
            tipoSanguineo: tipoSanguineo || null,
            sexo: currentPatientData?.sexo || null,
            fechaNacimiento: currentPatientData?.fechaNacimiento || null
        };
        
        const profileResponse = await fetch(`${API_BASE_URL}/patient-profile/profile/upsert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profilePayload)
        });

        const profileData = await profileResponse.json();

        if (!profileData.success) {
            console.error('❌ Error en respuesta del perfil:', profileData.error);
            
            if (currentPatientData && currentPatientData._id) {
                console.log('⚠️ Usando paciente existente:', currentPatientData._id);
                const patientId = currentPatientData._id;
                await crearCita(patientId, nombre, apellidos, fecha, hora, sintomas);
                return;
            }
            
            throw new Error(profileData.error || 'Error al actualizar perfil');
        }

        console.log('✅ Perfil actualizado correctamente');
        
        const patientId = profileData.patient?._id || profileData.patient?.id;
        console.log('🆔 Patient ID obtenido:', patientId);

        if (!patientId) {
            console.error('❌ No se obtuvo patientId');
            console.error('📋 profileData completo:', profileData);
            throw new Error('No se pudo obtener el ID del paciente');
        }

        
        // ✅ FORMATO ESTANDARIZADO - Igual que médico - SIN DUPLICAR SINTOMAS
        const appointmentPayload = {
            pacienteId: patientId,
            pacienteNombre: `${nombre} ${apellidos}`,
            medicoId: defaultMedicoId,
            fecha: fecha,
            hora: hora,
            tipoCita: '2',
            descripcion: sintomas,
            estado: 'pendiente',
            recordatorioEnviado: false,
            confirmada: false
        };
        
        const appointmentResponse = await fetch(`${API_BASE_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointmentPayload)
        });


        const appointmentData = await appointmentResponse.json();
        console.log('📥 Response data:', JSON.stringify(appointmentData, null, 2));

        if (!appointmentData.success) {
            console.error('❌ Error en respuesta de cita:', appointmentData.error);
            throw new Error(appointmentData.error || 'Error al crear cita');
        }

        console.log('✅ Cita creada correctamente');
        
        alert('✅ ¡Cita generada correctamente!\n\nFecha: ' + fecha + '\nHora: ' + hora);
        
        window.location.href = 'proximaCitaPaciente.html';
        
    } catch (error) {
        console.error('❌ ERROR CRÍTICO');
        
        alert('❌ Error al generar la cita: ' + error.message);
    }
}

// ===== OBTENER MÉDICO POR DEFECTO =====
async function obtenerMedicoPorDefecto() {
    try {
        console.log('🔍 Buscando médico por defecto...');
        
        const response = await fetch('http://localhost:3001/auth/users?role=medico');
        const data = await response.json();

        if (data.success && data.users && data.users.length > 0) {
            defaultMedicoId = data.users[0]._id || data.users[0].id;
            console.log('✅ Médico por defecto encontrado:', defaultMedicoId);
            localStorage.setItem('defaultMedicoId', defaultMedicoId);
        } else {
            defaultMedicoId = localStorage.getItem('userId') || 'medico_default';
            console.log('⚠️ No se encontraron médicos, usando fallback:', defaultMedicoId);
        }
    } catch (error) {
        console.error('❌ Error obteniendo médico:', error);
        defaultMedicoId = localStorage.getItem('userId') || 'medico_default';
    }
}

// ===== CARGAR PERFIL DEL PACIENTE =====
async function cargarPerfilPaciente() {
    try {
        console.log('📥 Cargando perfil del paciente...');
        console.log('📧 Email a buscar:', currentUserEmail);
        
        const response = await fetch(`${API_BASE_URL}/patient-profile/profile/${encodeURIComponent(currentUserEmail)}`);
        const data = await response.json();

        console.log('📋 Respuesta del servidor:', data);

        if (data.success) {
            if (data.hasProfile && data.patient) {
                currentPatientData = data.patient;
                console.log('✅ Perfil encontrado:', data.patient.nombre);
                mostrarDatosExistentes(data.patient);
            } else {
                console.log('⚠️ No se encontró perfil del paciente');
                mostrarFormularioVacio();
            }
        } else {
            console.error('❌ Error cargando perfil:', data.error);
            mostrarFormularioVacio();
        }
    } catch (error) {
        console.error('❌ Error conectando con el servidor:', error);
        mostrarFormularioVacio();
    }
}

// ===== MOSTRAR DATOS EXISTENTES =====
function mostrarDatosExistentes(patient) {
    document.getElementById('nombre').value = patient.nombre || '';
    document.getElementById('apellido').value = patient.apellidos || '';
    document.getElementById('fecha').value = '';
    document.getElementById('hora').value = '';
    document.getElementById('sintomas').value = '';
    document.getElementById('correo').value = patient.correo || currentUserEmail;
    document.getElementById('telefono').value = patient.telefono || '';
    document.getElementById('emergencia').value = patient.telefonoEmergencia || '';
    document.getElementById('sanguineo').value = patient.tipoSanguineo || '';
    document.getElementById('alergias').value = patient.alergias || 'Sin alergias';
    document.getElementById('padecimiento').value = patient.padecimientos || 'Sin padecimiento médico';
    document.getElementById('domicilio').value = patient.domicilio || '';
}

// ===== MOSTRAR FORMULARIO VACÍO =====
function mostrarFormularioVacio() {
    console.log('📝 Mostrando formulario vacío para completar perfil');
    document.getElementById('correo').value = currentUserEmail;
    document.getElementById('nombre').value = '';
    document.getElementById('apellido').value = '';
    document.getElementById('fecha').value = '';
    document.getElementById('hora').value = '';
    document.getElementById('sintomas').value = '';
    document.getElementById('telefono').value = '';
    document.getElementById('emergencia').value = '';
    document.getElementById('sanguineo').value = '';
    document.getElementById('alergias').value = 'Sin alergias';
    document.getElementById('padecimiento').value = 'Sin padecimiento médico';
    document.getElementById('domicilio').value = '';
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
            if (currentPatientData) {
                console.log('✅ Usando datos del perfil del paciente');
                document.getElementById('nombreModal').value = currentPatientData.nombre || '';
                document.getElementById('apellidosModal').value = currentPatientData.apellidos || '';
                document.getElementById('telefonoModal').value = currentPatientData.telefono || '';
                document.getElementById('emergenciaModal').value = currentPatientData.telefonoEmergencia || '';
            } else {
                console.log('⚠️ Usando datos del auth (sin perfil completo)');
                document.getElementById('nombreModal').value = data.user.nombre || '';
                document.getElementById('apellidosModal').value = data.user.apellidos || '';
                document.getElementById('telefonoModal').value = data.user.telefono || '';
                document.getElementById('emergenciaModal').value = '';
            }
            
            document.getElementById('correoModal').value = data.user.email || '';
            
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
        const nombre = document.getElementById('nombreModal').value.trim();
        const apellidos = document.getElementById('apellidosModal').value.trim();
        const telefono = document.getElementById('telefonoModal').value.trim();
        const emergencia = document.getElementById('emergenciaModal').value.trim();

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

        if (currentPatientData) {
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
                    domicilio: currentPatientData.domicilio,
                    alergias: currentPatientData.alergias,
                    padecimientos: currentPatientData.padecimientos,
                    tipoSanguineo: currentPatientData.tipoSanguineo,
                    sexo: currentPatientData.sexo,
                    fechaNacimiento: currentPatientData.fechaNacimiento
                })
            });

            const profileData = await profileResponse.json();

            if (!profileData.success) {
                throw new Error('Error al actualizar perfil de paciente');
            }
        }

        alert('✅ Perfil actualizado correctamente');
        document.getElementById('modalPerfil').style.display = 'none';
        
        await cargarPerfilPaciente();
        
    } catch (error) {
        console.error('❌ Error guardando perfil:', error);
        alert('❌ Error al guardar cambios: ' + error.message);
    }
}
window.generarCitaManual = generarCita;