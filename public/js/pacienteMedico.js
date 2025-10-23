// ===== CONFIGURACIÓN API =====
const API_BASE_URL = 'http://localhost:3002/api';

// ===== CARGAR PACIENTES AL INICIO =====
document.addEventListener('DOMContentLoaded', async function() {
  await cargarPacientes();
});

// ===== FUNCIÓN PARA CARGAR PACIENTES DESDE LA BD =====
async function cargarPacientes() {
  try {
    const response = await fetch(`${API_BASE_URL}/patients`);
    const data = await response.json();

    if (data.success && data.patients) {
      renderizarPacientes(data.patients);
    } else {
      console.error('Error al cargar pacientes:', data.error);
      mostrarMensajeError('No se pudieron cargar los pacientes');
    }
  } catch (error) {
    console.error('Error conectando con el servidor:', error);
    mostrarMensajeError('Error de conexión con el servidor');
  }
}

// ===== RENDERIZAR PACIENTES EN EL GRID =====
function renderizarPacientes(patients) {
  const patientsGrid = document.getElementById('patientsGrid');
  patientsGrid.innerHTML = '';

  if (patients.length === 0) {
    patientsGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 40px; color: #6B8199;">No hay pacientes registrados</p>';
    return;
  }

  patients.forEach(patient => {
    const card = crearTarjetaPaciente(patient);
    patientsGrid.appendChild(card);
  });
}

// ===== CREAR TARJETA DE PACIENTE =====
function crearTarjetaPaciente(patient) {
  const card = document.createElement('div');
  card.className = 'patient-card';
  card.setAttribute('data-name', `${patient.nombre} ${patient.apellidos}`);
  card.setAttribute('data-patient-id', patient._id);

  // Calcular última cita (si existe)
  let ultimaCita = 'Sin citas';
  if (patient.historialMedico && patient.historialMedico.length > 0) {
    const ultimaConsulta = patient.historialMedico[patient.historialMedico.length - 1];
    if (ultimaConsulta.fecha) {
      ultimaCita = new Date(ultimaConsulta.fecha).toLocaleDateString('es-MX');
    }
  }

  card.innerHTML = `
    <div class="patient-icon">
      <i class="fas fa-user"></i>
    </div>
    <div class="patient-info">
      <h4 class="patient-name">${patient.nombre} ${patient.apellidos}.</h4>
      <p class="patient-detail"><strong>Sexo:</strong> ${patient.sexo || 'N/A'}</p>
      <p class="patient-detail"><strong>Edad:</strong> ${patient.edad || 'N/A'}</p>
      <p class="patient-detail"><strong>Ultima Cita:</strong> ${ultimaCita}</p>
    </div>
  `;

  // Event listener para abrir modal con información
  card.addEventListener('click', async () => {
    await abrirModalPaciente(patient._id);
  });

  return card;
}

// ===== MAPA DE TIPOS DE CITA =====
const TIPOS_CITA = {
  '1': 'Consulta médica',
  '2': 'Consulta general',
  '3': 'Revisión',
  '4': 'Control',
  '5': 'Seguimiento'
};

// ===== ABRIR MODAL CON INFORMACIÓN DEL PACIENTE =====
async function abrirModalPaciente(patientId) {
  try {
    
    const [patientResponse, appointmentsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/patients/${patientId}`),
      fetch(`${API_BASE_URL}/appointments/patient/${patientId}`)
    ]);

    const patientData = await patientResponse.json();
    const appointmentsData = await appointmentsResponse.json();

    if (patientData.success) {
      const patient = patientData.patient;
      const appointments = appointmentsData.success ? appointmentsData.appointments : [];

      document.getElementById('infoPacienteNombre').textContent = `${patient.nombre} ${patient.apellidos}`;
      document.getElementById('infoPacienteTel').textContent = patient.telefono || 'N/A';
      document.getElementById('infoPacienteCorreo').textContent = patient.correo || 'N/A';
      document.getElementById('infoPacienteSexo').textContent = patient.sexo ? patient.sexo + '.' : 'N/A';
      document.getElementById('infoPacienteDomicilio').textContent = patient.domicilio || 'N/A';
      document.getElementById('infoPacienteAlergias').textContent = patient.alergias || 'Ninguna';
      document.getElementById('infoPacienteEmergencia').textContent = patient.telefonoEmergencia || 'N/A';

      const historialContainer = document.getElementById('historialCitas');
      historialContainer.innerHTML = '';

      if (appointments.length === 0) {
        historialContainer.innerHTML = '<p style="text-align: center; color: #6B8199; padding: 10px;">No hay citas registradas</p>';
      } else {
        const citasOrdenadas = appointments.sort((a, b) => {
          return new Date(b.fecha) - new Date(a.fecha);
        });

        citasOrdenadas.forEach(cita => {
          console.log('Procesando cita:', {
            fecha: cita.fecha,
            hora: cita.hora,
            tipoCita: cita.tipoCita,
            descripcion: cita.descripcion
          });

          const citaElement = document.createElement('div');
          citaElement.className = 'historial-item';
          
          const fecha = new Date(cita.fecha);
          const fechaFormateada = fecha.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          
          const tipoCita = TIPOS_CITA[cita.tipoCita] || cita.tipo || 'Consulta General';
          
          const hora = cita.hora || 'N/A';
                    
          citaElement.innerHTML = `
            <strong>${fechaFormateada}</strong> | 
            <span style="color: #0F3759; font-weight: 600;">${hora}</span> | 
            ${tipoCita}
            ${cita.descripcion ? `<br><span style="font-size: 0.9em; color: #6B8199; margin-left: 20px;">📝 ${cita.descripcion}</span>` : ''}
          `;
          
          historialContainer.appendChild(citaElement);
        });
      }
      document.getElementById('modalInfoPaciente').setAttribute('data-current-patient-id', patientId);

      document.getElementById('modalInfoPaciente').style.display = 'flex';
    } else {
      console.error('Error al cargar paciente:', patientData.error);
      alert('Error al cargar la información del paciente');
    }
  } catch (error) {
    console.error('Error al cargar información del paciente:', error);
    alert('Error al cargar la información del paciente');
  }
}

// ===== BÚSQUEDA DE PACIENTES =====
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const patientsGrid = document.getElementById('patientsGrid');
const noResults = document.getElementById('noResults');

searchInput.addEventListener('input', function() {
  const searchTerm = this.value.toLowerCase().trim();
  const patientCards = patientsGrid.querySelectorAll('.patient-card');
  let visibleCount = 0;

  // Mostrar/ocultar botón de limpiar
  if (searchTerm) {
    clearSearch.classList.add('show');
  } else {
    clearSearch.classList.remove('show');
  }

  // Filtrar tarjetas
  patientCards.forEach(card => {
    const patientName = card.getAttribute('data-name').toLowerCase();
    if (patientName.includes(searchTerm)) {
      card.style.display = 'flex';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  // Mostrar mensaje si no hay resultados
  if (visibleCount === 0 && searchTerm) {
    noResults.style.display = 'block';
    patientsGrid.style.display = 'none';
  } else {
    noResults.style.display = 'none';
    patientsGrid.style.display = 'grid';
  }
});

// Limpiar búsqueda
clearSearch.addEventListener('click', function() {
  searchInput.value = '';
  searchInput.dispatchEvent(new Event('input'));
  searchInput.focus();
});

// ===== MODAL INFORMACIÓN DEL PACIENTE =====
function closeModalInfoPaciente() {
  document.getElementById('modalInfoPaciente').style.display = 'none';
}

// ===== MODAL PERFIL =====
function openModalPerfilPacientes() {
  document.getElementById('modalPerfilPacientes').style.display = 'flex';
}

function closeModalPerfilPacientes() {
  document.getElementById('modalPerfilPacientes').style.display = 'none';
}

// ===== MODAL AÑADIR PACIENTE =====
function openModalAddPaciente() {
  document.getElementById('modalAddPaciente').style.display = 'flex';
}

function closeModalAddPaciente() {
  document.getElementById('modalAddPaciente').style.display = 'none';
  document.getElementById('formAddPaciente').reset();
}

// Event listener para el icono de perfil
document.addEventListener('DOMContentLoaded', function() {
  const profileIcon = document.getElementById('profileIconPacientes');
  if (profileIcon) {
    profileIcon.addEventListener('click', openModalPerfilPacientes);
  }
});

// Cerrar modales al hacer clic fuera
window.onclick = function(event) {
  const modalPerfil = document.getElementById('modalPerfilPacientes');
  const modalInfo = document.getElementById('modalInfoPaciente');
  const modalAdd = document.getElementById('modalAddPaciente');
  
  if (event.target === modalPerfil) {
    closeModalPerfilPacientes();
  }
  if (event.target === modalInfo) {
    closeModalInfoPaciente();
  }
  if (event.target === modalAdd) {
    closeModalAddPaciente();
  }
}

// Manejo del formulario de perfil
document.getElementById('formPerfilPacientes').addEventListener('submit', function(e) {
  e.preventDefault();
  alert('Perfil actualizado correctamente!');
  closeModalPerfilPacientes();
});

// ===== MANEJO DEL FORMULARIO DE AÑADIR PACIENTE =====
document.getElementById('formAddPaciente').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  // Obtener valores del formulario
  const nombreCompleto = document.getElementById('nombreCompleto').value;
  const [nombre, ...apellidosArr] = nombreCompleto.split(' ');
  const apellidos = apellidosArr.join(' ');
  const edad = parseInt(document.getElementById('edadPaciente').value);
  const sexo = document.getElementById('sexoPaciente').value;
  const telefono = document.getElementById('telPaciente').value;
  const email = document.getElementById('emailPaciente').value;
  const domicilio = document.getElementById('domicilioPaciente').value;
  const alergias = document.getElementById('alergiasPaciente').value || 'Ninguna';
  const emergencia = document.getElementById('emergenciaPaciente').value;
  
  // Calcular fecha de nacimiento aproximada
  const currentYear = new Date().getFullYear();
  const fechaNacimiento = new Date(currentYear - edad, 0, 1);

  try {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: nombre,
        apellidos: apellidos,
        fechaNacimiento: fechaNacimiento.toISOString(),
        sexo: sexo,
        telefono: telefono,
        telefonoEmergencia: emergencia,
        domicilio: domicilio,
        correo: email,
        alergias: alergias,
        padecimientos: 'Sin padecimientos'
      })
    });

    const data = await response.json();

    if (data.success) {
      alert('¡Paciente añadido correctamente!');
      closeModalAddPaciente();
      // Recargar lista de pacientes
      await cargarPacientes();
    } else {
      alert('Error al añadir paciente: ' + (data.error || 'Error desconocido'));
    }
  } catch (error) {
    console.error('Error al añadir paciente:', error);
    alert('Error de conexión al añadir paciente');
  }
});

// ===== FUNCIÓN PARA VER EXPEDIENTE CLÍNICO =====
function verExpedienteClinico() {
  const patientId = document.getElementById('modalInfoPaciente').getAttribute('data-current-patient-id');
  const nombrePaciente = document.getElementById('infoPacienteNombre').textContent;
  window.location.href = `expedienteClinico.html?pacienteId=${patientId}&paciente=${encodeURIComponent(nombrePaciente)}`;
}

// ===== FUNCIÓN PARA GENERAR RECETA =====
function generarReceta() {
  const patientId = document.getElementById('modalInfoPaciente').getAttribute('data-current-patient-id');
  const nombrePaciente = document.getElementById('infoPacienteNombre').textContent;
  window.location.href = `recetaMedica.html?pacienteId=${patientId}&paciente=${encodeURIComponent(nombrePaciente)}`;
}

// ===== FUNCIÓN AUXILIAR PARA MOSTRAR ERRORES =====
function mostrarMensajeError(mensaje) {
  const patientsGrid = document.getElementById('patientsGrid');
  patientsGrid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
      <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff6b6b; margin-bottom: 20px;"></i>
      <p style="color: #6B8199; font-size: 1.1em;">${mensaje}</p>
      <button onclick="cargarPacientes()" style="margin-top: 20px; padding: 10px 20px; background: #0F3759; color: white; border: none; border-radius: 8px; cursor: pointer;">
        Reintentar
      </button>
    </div>
  `;
}