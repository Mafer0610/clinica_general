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
function openModalInfoPaciente(nombre, tel, correo, sexo, domicilio, alergias, emergencia, historial) {
  // Rellenar información del contacto
  document.getElementById('infoPacienteNombre').textContent = nombre;
  document.getElementById('infoPacienteTel').textContent = tel;
  document.getElementById('infoPacienteCorreo').textContent = correo;
  document.getElementById('infoPacienteSexo').textContent = sexo + '.';
  document.getElementById('infoPacienteDomicilio').textContent = domicilio;
  document.getElementById('infoPacienteAlergias').textContent = alergias;
  document.getElementById('infoPacienteEmergencia').textContent = emergencia;
  
  // Rellenar historial de citas
  const historialContainer = document.getElementById('historialCitas');
  historialContainer.innerHTML = '';
  
  historial.forEach(function(cita) {
    const citaElement = document.createElement('div');
    citaElement.className = 'historial-item';
    citaElement.innerHTML = `<strong>${cita.fecha}</strong> | ${cita.tipo}.`;
    historialContainer.appendChild(citaElement);
  });
  
  // Mostrar modal
  document.getElementById('modalInfoPaciente').style.display = 'flex';
}

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

// Manejo del formulario de añadir paciente
document.getElementById('formAddPaciente').addEventListener('submit', function(e) {
  e.preventDefault();
  
  // Obtener valores del formulario
  const nombreCompleto = document.getElementById('nombreCompleto').value;
  const edad = document.getElementById('edadPaciente').value;
  const sexo = document.getElementById('sexoPaciente').value;
  const telefono = document.getElementById('telPaciente').value;
  const email = document.getElementById('emailPaciente').value;
  const domicilio = document.getElementById('domicilioPaciente').value;
  const alergias = document.getElementById('alergiasPaciente').value || 'Ninguna';
  const emergencia = document.getElementById('emergenciaPaciente').value;
  
  // Fecha actual para "Última Cita"
  const fechaActual = new Date().toLocaleDateString('es-MX', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
  
  // Crear nueva tarjeta de paciente
  const nuevaTarjeta = document.createElement('div');
  nuevaTarjeta.className = 'patient-card';
  nuevaTarjeta.setAttribute('data-name', nombreCompleto);
  
  // Historial vacío para nuevo paciente
  const historialVacio = [];
  
  nuevaTarjeta.onclick = function() {
    openModalInfoPaciente(
      nombreCompleto,
      telefono,
      email,
      sexo,
      domicilio,
      alergias,
      emergencia,
      historialVacio
    );
  };
  
  nuevaTarjeta.innerHTML = `
    <div class="patient-icon">
      <i class="fas fa-user"></i>
    </div>
    <div class="patient-info">
      <h4 class="patient-name">${nombreCompleto}.</h4>
      <p class="patient-detail"><strong>Sexo:</strong> ${sexo}</p>
      <p class="patient-detail"><strong>Edad:</strong> ${edad}</p>
      <p class="patient-detail"><strong>Ultima Cita:</strong> Sin citas</p>
    </div>
  `;
  
  // Agregar la tarjeta al grid
  patientsGrid.appendChild(nuevaTarjeta);
  
  // Mostrar mensaje de éxito
  alert('¡Paciente añadido correctamente!');
  
  // Cerrar modal y limpiar formulario
  closeModalAddPaciente();
});

// ===== FUNCIÓN PARA VER EXPEDIENTE CLÍNICO =====
function verExpedienteClinico() {
  const nombrePaciente = document.getElementById('infoPacienteNombre').textContent;
  window.location.href = `expedienteClinico.html?paciente=${encodeURIComponent(nombrePaciente)}`;
}

// ===== FUNCIÓN PARA GENERAR RECETA =====
function generarReceta() {
  const nombrePaciente = document.getElementById('infoPacienteNombre').textContent;
  window.location.href = `recetaMedica.html?paciente=${encodeURIComponent(nombrePaciente)}`;
}