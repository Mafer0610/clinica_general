// ===== CONFIGURACIÓN API =====
const API_BASE_URL = 'http://localhost:3002/api';

// ===== VARIABLES GLOBALES =====
let currentUserEmail = null;
let currentPatientData = null;
let defaultMedicoId = null;

// ===== CARGAR DATOS AL INICIAR =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Inicializando Inicio Paciente...');
    
    // Obtener email del usuario logueado desde localStorage
    const userEmail = localStorage.getItem('userEmail');
    
    if (!userEmail) {
        console.error('❌ No se encontró email del usuario');
        alert('Error: No se encontró información del usuario. Por favor inicia sesión nuevamente.');
        window.location.href = '../html/index.html';
        return;
    }

    currentUserEmail = userEmail;
    console.log('✅ Email del usuario:', currentUserEmail);

    // Obtener un médico por defecto (el primero disponible)
    await obtenerMedicoPorDefecto();

    // Cargar perfil del paciente
    await cargarPerfilPaciente();
    
    // Configurar modal de perfil
    configurarModalPerfil();
});

// ===== OBTENER MÉDICO POR DEFECTO =====
async function obtenerMedicoPorDefecto() {
    try {
        console.log('🔍 Buscando médico por defecto...');
        
        // Intentar obtener un médico del sistema
        const response = await fetch('http://localhost:3001/auth/users?role=medico');
        const data = await response.json();

        if (data.success && data.users && data.users.length > 0) {
            defaultMedicoId = data.users[0]._id || data.users[0].id;
            console.log('✅ Médico por defecto encontrado:', defaultMedicoId);
            localStorage.setItem('defaultMedicoId', defaultMedicoId);
        } else {
            // Si no hay médicos, usar el userId del sistema como fallback
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
                console.log('📋 Datos del paciente:', {
                    nombre: data.patient.nombre,
                    apellidos: data.patient.apellidos,
                    telefono: data.patient.telefono,
                    correo: data.patient.correo
                });
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
    // Datos Personales
    document.getElementById('nombre').value = patient.nombre || '';
    document.getElementById('apellido').value = patient.apellidos || '';
    
    // Fecha y hora (dejar vacíos para nueva cita)
    document.getElementById('fecha').value = '';
    document.getElementById('hora').value = '';
    
    // Síntomas (dejar vacío)
    document.getElementById('sintomas').value = '';
    
    // Información de Contacto
    document.getElementById('correo').value = patient.correo || currentUserEmail;
    document.getElementById('telefono').value = patient.telefono || '';
    document.getElementById('emergencia').value = patient.telefonoEmergencia || '';
    
    // Información Médica
    document.getElementById('sanguineo').value = patient.tipoSanguineo || '';
    document.getElementById('alergias').value = patient.alergias || 'Sin alergias';
    document.getElementById('padecimiento').value = patient.padecimientos || 'Sin padecimiento médico';
    document.getElementById('domicilio').value = patient.domicilio || '';
}

// ===== MOSTRAR FORMULARIO VACÍO =====
function mostrarFormularioVacio() {
    console.log('📝 Mostrando formulario vacío para completar perfil');
    
    // Solo pre-llenar el correo
    document.getElementById('correo').value = currentUserEmail;
    
    // Dejar los demás campos vacíos
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

// ===== GENERAR CITA =====
document.querySelector('.btn-submit').addEventListener('click', async function(e) {
    e.preventDefault();
    
    console.log('🔄 Generando cita...');
    
    // Obtener datos del formulario
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
        alert('⚠️ Por favor completa tu nombre y apellidos');
        return;
    }
    
    if (!fecha || !hora) {
        alert('⚠️ Por favor selecciona fecha y hora para la cita');
        return;
    }
    
    if (!sintomas) {
        alert('⚠️ Por favor describe tus síntomas');
        return;
    }
    
    if (!telefono || !emergencia) {
        alert('⚠️ Por favor completa los teléfonos de contacto');
        return;
    }
    
    if (!domicilio) {
        alert('⚠️ Por favor completa tu domicilio');
        return;
    }

    try {
        // Paso 1: Crear o actualizar perfil del paciente
        console.log('📝 Actualizando perfil del paciente...');
        console.log('📋 Datos a guardar:', {
            email: currentUserEmail,
            nombre: nombre,
            apellidos: apellidos,
            tipoSanguineo: tipoSanguineo || null
        });
        
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
                domicilio: domicilio,
                alergias: alergias,
                padecimientos: padecimientos,
                tipoSanguineo: tipoSanguineo || null, // ASEGURARSE QUE SE ENVÍE
                sexo: currentPatientData?.sexo || null,
                fechaNacimiento: currentPatientData?.fechaNacimiento || null
            })
        });

        const profileData = await profileResponse.json();

        if (!profileData.success) {
            throw new Error(profileData.error || 'Error al actualizar perfil');
        }

        console.log('✅ Perfil actualizado correctamente');
        console.log('📋 Respuesta del perfil:', profileData);
        const patientId = profileData.patient._id;
        console.log('🆔 Patient ID obtenido:', patientId);

        // VALIDACIÓN CRÍTICA: Verificar que tenemos un patientId válido
        if (!patientId) {
            throw new Error('No se pudo obtener el ID del paciente');
        }

        // Paso 2: Crear la cita
        console.log('📅 Creando cita...');
        console.log('📋 Datos de la cita:', {
            pacienteId: patientId,
            pacienteNombre: `${nombre} ${apellidos}`,
            medicoId: defaultMedicoId,
            fecha: fecha,
            hora: hora
        });
        
        const appointmentResponse = await fetch(`${API_BASE_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pacienteId: patientId, // USAR EL ID CORRECTO
                pacienteNombre: `${nombre} ${apellidos}`,
                medicoId: defaultMedicoId, // USAR EL MÉDICO OBTENIDO
                fecha: fecha,
                hora: hora,
                tipoCita: '2', // Consulta general
                descripcion: sintomas
            })
        });

        const appointmentData = await appointmentResponse.json();
        console.log('📋 Respuesta de la cita:', appointmentData);

        if (!appointmentData.success) {
            throw new Error(appointmentData.error || 'Error al crear cita');
        }

        console.log('✅ Cita creada correctamente');
        
        alert('✅ ¡Cita generada correctamente!\n\nFecha: ' + fecha + '\nHora: ' + hora);
        
        // Redirigir a próxima cita
        window.location.href = 'proximaCitaPaciente.html';
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error al generar la cita: ' + error.message);
    }
});

// ===== CONFIGURAR MODAL DE PERFIL =====
function configurarModalPerfil() {
    const profileIcon = document.getElementById('profileIconPacientes');
    const modal = document.getElementById('modalPerfil');
    const closeBtn = modal.querySelector('.modal-close');
    const form = modal.querySelector('.modal-form-perfil');

    // Abrir modal
    profileIcon.addEventListener('click', async () => {
        await cargarDatosModalPerfil();
        modal.style.display = 'block';
    });

    // Cerrar modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Cerrar al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Guardar cambios del perfil
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarCambiosPerfil();
    });
}

// ===== CARGAR DATOS EN MODAL DE PERFIL =====
async function cargarDatosModalPerfil() {
    try {
        console.log('📥 Cargando datos del modal de perfil...');
        
        // Obtener datos del usuario desde auth service
        const userId = localStorage.getItem('userId');
        console.log('🆔 User ID:', userId);
        
        const response = await fetch(`http://localhost:3001/auth/user/${userId}`);
        const data = await response.json();

        console.log('📋 Respuesta auth:', data);

        if (data.success && data.user) {
            // Si el paciente tiene perfil, usar esos datos primero
            if (currentPatientData) {
                console.log('✅ Usando datos del perfil del paciente');
                document.getElementById('nombreModal').value = currentPatientData.nombre || '';
                document.getElementById('apellidosModal').value = currentPatientData.apellidos || '';
                document.getElementById('telefonoModal').value = currentPatientData.telefono || '';
                document.getElementById('emergenciaModal').value = currentPatientData.telefonoEmergencia || '';
            } else {
                // Si no tiene perfil, usar datos del auth
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

        // Actualizar en auth service
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

        // Actualizar perfil de paciente si existe
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
        
        // Recargar datos
        await cargarPerfilPaciente();
        
    } catch (error) {
        console.error('❌ Error guardando perfil:', error);
        alert('❌ Error al guardar cambios: ' + error.message);
    }
}