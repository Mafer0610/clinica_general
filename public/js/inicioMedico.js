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

// ===== GESTIÓN DE MODALES =====
const Modal = {
  abrir: (id) => {
    const modal = document.getElementById(`modal${id.charAt(0).toUpperCase() + id.slice(1)}`);
    if (modal) {
      modal.style.display = 'flex';
    }
  },
  cerrar: (id) => {
    const modal = document.getElementById(`modal${id.charAt(0).toUpperCase() + id.slice(1)}`);
    if (modal) {
      modal.style.display = 'none';
    }
  }
};

// ===== CARGAR DATOS AL INICIAR =====
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🔄 Inicializando aplicación...');
  
  const medicoId = localStorage.getItem('userId');
  console.log('👤 ID del médico:', medicoId);
  
  if (medicoId) {
    await cargarCitasMedico(medicoId);
  } else {
    console.error('❌ No se encontró ID de médico en localStorage');
  }

  configurarEventListeners();
  configurarBusquedaPacientes();
  configurarFormularios();
});

// ===== CONFIGURAR EVENT LISTENERS =====
function configurarEventListeners() {
  console.log('🔧 Configurando event listeners...');

  document.addEventListener('click', async (e) => {
    const modalTrigger = e.target.closest('[data-modal]');
    const modalClose = e.target.closest('[data-close]');
    const pickerTrigger = e.target.closest('[data-picker]');

    if (modalTrigger) {
      e.preventDefault();
      const modalName = modalTrigger.dataset.modal;
      console.log('📂 Abriendo modal:', modalName);
      
      if (modalName === 'perfil') {
        await cargarPerfilMedico();
      }
      
      Modal.abrir(modalName);
    }
    
    if (modalClose) {
      e.preventDefault();
      console.log('❌ Cerrando modal:', modalClose.dataset.close);
      Modal.cerrar(modalClose.dataset.close);
      limpiarFormularioCita();
    }
    
    if (pickerTrigger) {
      const input = document.getElementById(pickerTrigger.dataset.picker);
      if (input && input.showPicker) {
        input.showPicker();
      }
    }
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        if (modal.id === 'modalCita') {
          limpiarFormularioCita();
        }
      }
    });
  });

  const profileIcon = document.querySelector('.profile-icon');
  if (profileIcon) {
    console.log('✅ Icono de perfil encontrado');
    profileIcon.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('👤 Click en icono de perfil detectado');
      await cargarPerfilMedico();
      Modal.abrir('perfil');
    });
  }
}

// ===== BUSQUEDA DE PACIENTES CON SUGERENCIAS =====
function configurarBusquedaPacientes() {
  const searchInput = document.getElementById('pacienteSearch');
  const suggestionsDiv = document.getElementById('pacienteSuggestions');
  const pacienteIdInput = document.getElementById('pacienteId');
  
  let pacientes = [];
  
  // Cargar todos los pacientes al inicio
  async function cargarPacientes() {
    try {
      const response = await fetch(`${API_BASE_URL}/patients`);
      const data = await response.json();
      
      if (data.success) {
        pacientes = data.patients;
        console.log(`✅ ${pacientes.length} pacientes cargados para búsqueda`);
      }
    } catch (error) {
      console.error('❌ Error cargando pacientes:', error);
    }
  }
  
  cargarPacientes();
  
  // Búsqueda en tiempo real
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    
    if (searchTerm.length < 2) {
      suggestionsDiv.classList.remove('show');
      pacienteIdInput.value = '';
      return;
    }
    
    const resultados = pacientes.filter(p => {
      const nombreCompleto = `${p.nombre} ${p.apellidos}`.toLowerCase();
      return nombreCompleto.includes(searchTerm);
    });
    
    mostrarSugerencias(resultados);
  });
  
  function mostrarSugerencias(resultados) {
    suggestionsDiv.innerHTML = '';
    
    if (resultados.length === 0) {
      suggestionsDiv.innerHTML = '<div class="no-suggestions">No se encontraron pacientes</div>';
      suggestionsDiv.classList.add('show');
      return;
    }
    
    resultados.forEach(paciente => {
      const item = document.createElement('div');
      item.className = 'patient-suggestion-item';
      item.innerHTML = `
        <div class="patient-suggestion-name">${paciente.nombre} ${paciente.apellidos}</div>
        <div class="patient-suggestion-details">
          ${paciente.sexo} • ${paciente.edad || 'N/A'} años • Tel: ${paciente.telefono}
        </div>
      `;
      
      item.addEventListener('click', () => {
        searchInput.value = `${paciente.nombre} ${paciente.apellidos}`;
        pacienteIdInput.value = paciente._id;
        suggestionsDiv.classList.remove('show');
        console.log('✅ Paciente seleccionado:', paciente._id);
      });
      
      suggestionsDiv.appendChild(item);
    });
    
    suggestionsDiv.classList.add('show');
  }
  
  // Cerrar sugerencias al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
      suggestionsDiv.classList.remove('show');
    }
  });
}

// ===== CARGAR PERFIL DEL MÉDICO =====
async function cargarPerfilMedico() {
  console.log('📥 Cargando perfil del médico...');
  
  try {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
      console.error('❌ No se encontró ID de usuario');
      limpiarCamposPerfil();
      return;
    }

    const response = await fetch(`http://localhost:3001/auth/user/${userId}`);
    const data = await response.json();

    if (data.success && data.user) {
      const user = data.user;
      
      document.getElementById('nombre').value = user.nombre || '';
      document.getElementById('apellidos').value = user.apellidos || '';
      document.getElementById('cedula').value = user.cedula || '';
      document.getElementById('telefono').value = user.telefono || '';
      document.getElementById('correo').value = user.email || '';
      
      console.log('✅ Perfil cargado correctamente');
    } else {
      console.warn('⚠️ No se encontraron datos del usuario');
      limpiarCamposPerfil();
    }
  } catch (error) {
    console.error('❌ Error cargando perfil:', error);
    limpiarCamposPerfil();
  }
}

function limpiarCamposPerfil() {
  document.getElementById('nombre').value = '';
  document.getElementById('apellidos').value = '';
  document.getElementById('cedula').value = '';
  document.getElementById('telefono').value = '';
  document.getElementById('correo').value = '';
}

// ===== CARGAR CITAS DEL MÉDICO =====
async function cargarCitasMedico(medicoId) {
  try {
    console.log('📅 Cargando citas del médico...');
    const response = await fetch(`${API_BASE_URL}/appointments/medico/${medicoId}`);
    const data = await response.json();

    if (data.success && data.appointments) {
      console.log(`✅ Se cargaron ${data.appointments.length} citas`);
      renderizarCitasEnCalendario(data.appointments);
    } else {
      console.error('❌ Error al cargar citas:', data.error);
    }
  } catch (error) {
    console.error('❌ Error conectando con el servidor:', error);
  }
}

// ===== RENDERIZAR CITAS EN CALENDARIO =====
function renderizarCitasEnCalendario(appointments) {
  document.querySelectorAll('.appointment-simple').forEach(el => el.remove());

  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diff);
  lunes.setHours(0, 0, 0, 0);

  const fechasSemana = [];
  for (let i = 0; i < 5; i++) {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + i);
    fechasSemana.push(fecha);
  }

  appointments.forEach(cita => {
    const fechaCita = new Date(cita.fecha);
    
    const diaIndex = fechasSemana.findIndex(fecha => 
      fecha.toDateString() === fechaCita.toDateString()
    );

    if (diaIndex !== -1) {
      const [hora] = cita.hora.split(':');
      const horaInt = parseInt(hora);

      if (horaInt >= 9 && horaInt <= 21) {
        const filaIndex = horaInt - 9;
        const columnaIndex = diaIndex + 1;

        const filas = document.querySelectorAll('.schedule tbody tr');
        if (filas[filaIndex]) {
          const celda = filas[filaIndex].cells[columnaIndex];
          
          if (celda) {
            const tipoCita = TIPOS_CITA[cita.tipoCita] || 'Consulta';
            
            const citaElement = document.createElement('div');
            citaElement.className = 'appointment-simple';
            citaElement.innerHTML = `
              <div class="appointment-title">${cita.pacienteNombre || 'Paciente'}</div>
              <div class="appointment-update">${tipoCita}</div>
            `;
            
            citaElement.addEventListener('click', () => {
              mostrarDetallesCita(cita);
            });
            
            celda.appendChild(citaElement);
          }
        }
      }
    }
  });
}

// ===== MOSTRAR DETALLES DE CITA =====
function mostrarDetallesCita(cita) {
  const fechaFormateada = new Date(cita.fecha).toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const tipoCita = TIPOS_CITA[cita.tipoCita] || 'Consulta';

  alert(`
📅 Tipo: ${tipoCita}
👤 Paciente: ${cita.pacienteNombre || 'N/A'}
📆 Fecha: ${fechaFormateada}
🕐 Hora: ${cita.hora}
📝 Descripción: ${cita.descripcion || 'Sin descripción'}
  `.trim());
}

// ===== CONFIGURAR FORMULARIOS =====
function configurarFormularios() {
  const forms = {
    cita: async () => {
      console.log('📅 Guardando cita...');
      
      const pacienteId = document.getElementById('pacienteId').value;
      const pacienteNombre = document.getElementById('pacienteSearch').value;
      const descripcion = document.getElementById('descripcion').value;
      const fecha = document.getElementById('fecha').value;
      const hora = document.getElementById('hora').value;
      const tipoCita = document.getElementById('tipoCita').value;
      const medicoId = localStorage.getItem('userId');

      // Validaciones
      if (!pacienteId || !pacienteNombre) {
        alert('⚠️ Por favor selecciona un paciente de la lista');
        return;
      }

      if (!fecha || !hora) {
        alert('⚠️ Por favor completa la fecha y hora');
        return;
      }

      if (!tipoCita) {
        alert('⚠️ Por favor selecciona el tipo de cita');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/appointments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pacienteId: pacienteId,
            pacienteNombre: pacienteNombre,
            medicoId: medicoId,
            fecha: fecha,
            hora: hora,
            tipoCita: tipoCita,
            descripcion: descripcion || ''
          })
        });

        const data = await response.json();

        if (data.success) {
          alert('✅ Cita agendada correctamente!');
          Modal.cerrar('cita');
          limpiarFormularioCita();
          await cargarCitasMedico(medicoId);
        } else {
          alert('❌ Error al agendar cita: ' + (data.error || 'Error desconocido'));
        }
      } catch (error) {
        console.error('❌ Error al agendar cita:', error);
        alert('❌ Error de conexión al agendar cita');
      }
    },
    
    reportes: () => {
      const inicio = document.getElementById('fechaInicio').value;
      const final = document.getElementById('fechaFinal').value;

      if (!inicio || !final) {
        alert('Por favor seleccione ambas fechas');
        return;
      }

      alert(`Generando reporte PDF desde ${inicio} hasta ${final}`);
      Modal.cerrar('reportes');
    },
    
    perfil: async () => {
      try {
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
          alert('❌ Error: No se encontró ID de usuario');
          return;
        }

        const nombre = document.getElementById('nombre').value.trim();
        const apellidos = document.getElementById('apellidos').value.trim();
        const cedula = document.getElementById('cedula').value.trim();
        const telefono = document.getElementById('telefono').value.trim();

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
          Modal.cerrar('perfil');
          await cargarPerfilMedico();
        } else {
          alert('❌ Error: ' + (data.error || 'No se pudo actualizar el perfil'));
        }
      } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error de conexión: ' + error.message);
      }
    }
  };

  document.querySelectorAll('[data-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formName = form.dataset.form;
      forms[formName]();
    });
  });
}

// ===== LIMPIAR FORMULARIO DE CITA =====
function limpiarFormularioCita() {
  document.getElementById('pacienteSearch').value = '';
  document.getElementById('pacienteId').value = '';
  document.getElementById('descripcion').value = '';
  document.getElementById('fecha').value = '';
  document.getElementById('hora').value = '';
  document.getElementById('tipoCita').value = '';
  document.getElementById('pacienteSuggestions').classList.remove('show');
}