const API_BASE_URL = 'http://localhost:3002/api';

document.addEventListener('DOMContentLoaded', async function() {
  await cargarPacientes();
  
  const profileIcon = document.getElementById('profileIconPacientes');
  if (profileIcon) {
    profileIcon.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('👤 Click en icono de perfil detectado');
      await cargarPerfilMedicoEnPacientes();
      openModalPerfilPacientes();
    });
  }
});

async function cargarPerfilMedicoEnPacientes() {  
  try {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
      console.error(' No se encontró ID de usuario');
      limpiarCamposPerfilMedico();
      return;
    }

    const response = await fetch(`http://localhost:3001/auth/user/${userId}`);
    const data = await response.json();

    if (data.success && data.user) {
      const user = data.user;
      
      document.getElementById('nombrePacientes').value = user.nombre || '';
      document.getElementById('apellidosPacientes').value = user.apellidos || '';
      document.getElementById('cedulaPacientes').value = user.cedula || '';
      document.getElementById('telefonoPacientes').value = user.telefono || '';
      document.getElementById('correoPacientes').value = user.email || '';
    } else {
      console.warn('⚠️ No se encontraron datos del usuario');
      limpiarCamposPerfilMedico();
    }
  } catch (error) {
    console.error(' Error cargando perfil:', error);
    limpiarCamposPerfilMedico();
  }
}

function limpiarCamposPerfilMedico() {
  document.getElementById('nombrePacientes').value = '';
  document.getElementById('apellidosPacientes').value = '';
  document.getElementById('cedulaPacientes').value = '';
  document.getElementById('telefonoPacientes').value = '';
  document.getElementById('correoPacientes').value = '';
}

document.getElementById('formPerfilPacientes').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  try {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
      alert(' Error: No se encontró ID de usuario');
      return;
    }

    const nombre = document.getElementById('nombrePacientes').value.trim();
    const apellidos = document.getElementById('apellidosPacientes').value.trim();
    const cedula = document.getElementById('cedulaPacientes').value.trim();
    const telefono = document.getElementById('telefonoPacientes').value.trim();

    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (apellidos) updateData.apellidos = apellidos;
    if (cedula) updateData.cedula = cedula;
    if (telefono) updateData.telefono = telefono;

    if (Object.keys(updateData).length === 0) {
      alert('⚠️ No hay cambios para guardar');
      return;
    }

    const response = await fetch(`http://localhost:3001/auth/user/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('✅ Perfil actualizado correctamente!');
      closeModalPerfilPacientes();
      await cargarPerfilMedicoEnPacientes();
    } else {
      alert(' Error: ' + (data.error || 'No se pudo actualizar el perfil'));
    }
  } catch (error) {
    console.error(' Error:', error);
    alert(' Error de conexión: ' + error.message);
  }
});

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

function crearTarjetaPaciente(patient) {
  const card = document.createElement('div');
  card.className = 'patient-card';
  card.setAttribute('data-name', `${patient.nombre} ${patient.apellidos}`);
  card.setAttribute('data-patient-id', patient._id);

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

  card.addEventListener('click', async () => {
    await abrirModalPaciente(patient._id);
  });

  return card;
}

const TIPOS_CITA = {
  '1': 'Consulta médica',
  '2': 'Consulta general',
  '3': 'Revisión',
  '4': 'Control',
  '5': 'Seguimiento'
};

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
          const citaElement = document.createElement('div');
          citaElement.className = 'historial-item';
          const fechaISO = cita.fecha.split('T')[0];
          const [year, month, day] = fechaISO.split('-');
          const fechaFormateada = `${day}/${month}/${year}`;
          
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

const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const patientsGrid = document.getElementById('patientsGrid');
const noResults = document.getElementById('noResults');

searchInput.addEventListener('input', function() {
  const searchTerm = this.value.toLowerCase().trim();
  const patientCards = patientsGrid.querySelectorAll('.patient-card');
  let visibleCount = 0;

  if (searchTerm) {
    clearSearch.classList.add('show');
  } else {
    clearSearch.classList.remove('show');
  }

  patientCards.forEach(card => {
    const patientName = card.getAttribute('data-name').toLowerCase();
    if (patientName.includes(searchTerm)) {
      card.style.display = 'flex';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  if (visibleCount === 0 && searchTerm) {
    noResults.style.display = 'block';
    patientsGrid.style.display = 'none';
  } else {
    noResults.style.display = 'none';
    patientsGrid.style.display = 'grid';
  }
});

clearSearch.addEventListener('click', function() {
  searchInput.value = '';
  searchInput.dispatchEvent(new Event('input'));
  searchInput.focus();
});

function closeModalInfoPaciente() {
  document.getElementById('modalInfoPaciente').style.display = 'none';
}

function openModalPerfilPacientes() {
  document.getElementById('modalPerfilPacientes').style.display = 'flex';
}

function closeModalPerfilPacientes() {
  document.getElementById('modalPerfilPacientes').style.display = 'none';
}

function openModalAddPaciente() {
  document.getElementById('modalAddPaciente').style.display = 'flex';
}

function closeModalAddPaciente() {
  document.getElementById('modalAddPaciente').style.display = 'none';
  document.getElementById('formAddPaciente').reset();
}

document.addEventListener('DOMContentLoaded', function() {
  const profileIcon = document.getElementById('profileIconPacientes');
  if (profileIcon) {
    profileIcon.addEventListener('click', openModalPerfilPacientes);
  }
});

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

document.getElementById('formAddPaciente').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const nombreElem = document.getElementById('nombrePaciente');
  const apellidosElem = document.getElementById('apellidosPaciente');
  const edadElem = document.getElementById('edadPaciente');
  const sexoElem = document.getElementById('sexoPaciente');
  const telElem = document.getElementById('telPaciente');
  const emailElem = document.getElementById('emailPaciente');
  const domicilioElem = document.getElementById('domicilioPaciente');
  const alergiasElem = document.getElementById('alergiasPaciente');
  const emergenciaElem = document.getElementById('emergenciaPaciente');
  
  if (!nombreElem) {
    console.error(' Campo nombrePaciente no encontrado');
    alert('Error: Campo de nombre no encontrado. Por favor recarga la página.');
    return;
  }

  if (!apellidosElem) {
    console.error(' Campo apellidosPaciente no encontrado');
    alert('Error: Campo de apellidos no encontrado. Por favor recarga la página.');
    return;
  }
  
  if (!edadElem) {
    console.error(' Campo edadPaciente no encontrado');
    alert('Error: Campo de edad no encontrado. Por favor recarga la página.');
    return;
  }
  
  if (!sexoElem) {
    console.error(' Campo sexoPaciente no encontrado');
    alert('Error: Campo de sexo no encontrado. Por favor recarga la página.');
    return;
  }
  
  if (!telElem) {
    console.error(' Campo telPaciente no encontrado');
    alert('Error: Campo de teléfono no encontrado. Por favor recarga la página.');
    return;
  }
  
  if (!emailElem) {
    console.error(' Campo emailPaciente no encontrado');
    alert('Error: Campo de email no encontrado. Por favor recarga la página.');
    return;
  }
  
  if (!domicilioElem) {
    console.error(' Campo domicilioPaciente no encontrado');
    alert('Error: Campo de domicilio no encontrado. Por favor recarga la página.');
    return;
  }
  
  if (!emergenciaElem) {
    console.error(' Campo emergenciaPaciente no encontrado');
    alert('Error: Campo de teléfono de emergencia no encontrado. Por favor recarga la página.');
    return;
  }
  
  const nombre = nombreElem.value.trim();
  const apellidos = apellidosElem.value.trim();
  
  const edad = parseInt(edadElem.value);
  const sexo = sexoElem.value;
  const telefono = telElem.value.trim();
  const email = emailElem.value.trim();
  const domicilio = domicilioElem.value.trim();
  const alergias = alergiasElem ? alergiasElem.value.trim() : 'Ninguna';
  const emergencia = emergenciaElem.value.trim();
  
  if (!nombre || !apellidos) {
    alert('⚠️ Por favor ingresa nombre y apellidos completos');
    return;
  }
  
  if (!sexo) {
    alert('⚠️ Por favor selecciona el sexo');
    return;
  }
  
  if (isNaN(edad) || edad < 0 || edad > 120) {
    alert('⚠️ Por favor ingresa una edad válida (0-120)');
    return;
  }
  
  if (!telefono) {
    alert('⚠️ Por favor ingresa el teléfono');
    return;
  }
  
  if (!email) {
    alert('⚠️ Por favor ingresa el correo electrónico');
    return;
  }
  
  if (!domicilio) {
    alert('⚠️ Por favor ingresa el domicilio');
    return;
  }
  
  if (!emergencia) {
    alert('⚠️ Por favor ingresa el teléfono de emergencia');
    return;
  }
  
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
    console.log('📥 Respuesta del servidor:', data);

    if (data.success) {
      console.log('✅ Paciente creado exitosamente');
      alert('✅ ¡Paciente añadido correctamente!');
      closeModalAddPaciente();
      await cargarPacientes();
    } else {
      console.error(' Error del servidor:', data.error);
      alert(' Error al añadir paciente: ' + (data.error || 'Error desconocido'));
    }
  } catch (error) {
    console.error(' Error de conexión:', error);
    alert(' Error de conexión al añadir paciente: ' + error.message);
  }
});

function verExpedienteClinico() {
  const patientId = document.getElementById('modalInfoPaciente').getAttribute('data-current-patient-id');
  const nombrePaciente = document.getElementById('infoPacienteNombre').textContent;
  window.location.href = `expedienteClinico.html?pacienteId=${patientId}&paciente=${encodeURIComponent(nombrePaciente)}`;
}

function generarReceta() {
  const patientId = document.getElementById('modalInfoPaciente').getAttribute('data-current-patient-id');
  const nombrePaciente = document.getElementById('infoPacienteNombre').textContent;
  window.location.href = `recetaMedica.html?pacienteId=${patientId}&paciente=${encodeURIComponent(nombrePaciente)}`;
}

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