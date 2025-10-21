// ===== CONFIGURACIÓN API =====
const API_BASE_URL = 'http://localhost:3002/api';

// ===== GESTIÓN UNIFICADA DE MODALES =====
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
  
  // Obtener ID del médico del localStorage
  const medicoId = localStorage.getItem('userId');
  console.log('👤 ID del médico:', medicoId);
  
  if (medicoId) {
    await cargarCitasMedico(medicoId);
    await cargarPacientesParaSelect();
  } else {
    console.error('❌ No se encontró ID de médico en localStorage');
  }

  // Configurar event listeners
  configurarEventListeners();
  configurarFormularios();
});

// ===== CONFIGURAR EVENT LISTENERS =====
function configurarEventListeners() {
  console.log('🔧 Configurando event listeners...');

  // Event listener para abrir modales
  document.addEventListener('click', async (e) => {
    const modalTrigger = e.target.closest('[data-modal]');
    const modalClose = e.target.closest('[data-close]');
    const pickerTrigger = e.target.closest('[data-picker]');

    if (modalTrigger) {
      e.preventDefault();
      const modalName = modalTrigger.dataset.modal;
      console.log('📂 Abriendo modal:', modalName);
      
      // Si es el modal de perfil, cargar datos primero
      if (modalName === 'perfil') {
        await cargarPerfilMedico();
      }
      
      Modal.abrir(modalName);
    }
    
    if (modalClose) {
      e.preventDefault();
      console.log('❌ Cerrando modal:', modalClose.dataset.close);
      Modal.cerrar(modalClose.dataset.close);
    }
    
    if (pickerTrigger) {
      const input = document.getElementById(pickerTrigger.dataset.picker);
      if (input && input.showPicker) {
        input.showPicker();
      }
    }
  });

  // Cerrar modales al hacer clic en el overlay
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });

  // Event listener específico para el icono de perfil
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
  } else {
    console.error('❌ No se encontró el icono de perfil');
  }
}

// ===== FUNCIÓN PARA CARGAR PERFIL DEL MÉDICO =====
async function cargarPerfilMedico() {
  console.log('📥 Cargando perfil del médico...');
  
  try {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
      console.error('❌ No se encontró ID de usuario en localStorage');
      limpiarCamposPerfil();
      return;
    }

    console.log('🔍 Buscando usuario:', userId);

    // Obtener datos del usuario desde Auth Service
    const response = await fetch(`http://localhost:3001/auth/user/${userId}`);
    const data = await response.json();

    console.log('📦 Respuesta del servidor:', data);

    if (data.success && data.user) {
      const user = data.user;
      
      // Llenar campos del formulario
      document.getElementById('nombre').value = user.nombre || '';
      document.getElementById('apellidos').value = user.apellidos || '';
      document.getElementById('cedula').value = user.cedula || '';
      document.getElementById('telefono').value = user.telefono || '';
      document.getElementById('correo').value = user.email || '';
      
      console.log('✅ Perfil del médico cargado correctamente');
    } else {
      console.warn('⚠️ No se encontraron datos del usuario');
      limpiarCamposPerfil();
    }
  } catch (error) {
    console.error('❌ Error cargando perfil del médico:', error);
    limpiarCamposPerfil();
  }
}

// ===== FUNCIÓN PARA LIMPIAR CAMPOS DEL PERFIL =====
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

// ===== RENDERIZAR CITAS EN EL CALENDARIO =====
function renderizarCitasEnCalendario(appointments) {
  // Limpiar citas existentes
  document.querySelectorAll('.appointment-simple').forEach(el => el.remove());

  // Obtener fecha actual de inicio de semana (lunes)
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diff);
  lunes.setHours(0, 0, 0, 0);

  // Crear fechas para cada día de la semana
  const fechasSemana = [];
  for (let i = 0; i < 5; i++) {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + i);
    fechasSemana.push(fecha);
  }

  // Filtrar y colocar citas en el calendario
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
            const citaElement = document.createElement('div');
            citaElement.className = 'appointment-simple';
            citaElement.innerHTML = `
              <div class="appointment-title">${cita.pacienteNombre || 'Paciente'}</div>
              <div class="appointment-update">${cita.tipo || 'Consulta'}</div>
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

// ===== MOSTRAR DETALLES DE UNA CITA =====
function mostrarDetallesCita(cita) {
  const fechaFormateada = new Date(cita.fecha).toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  alert(`
📅 Cita: ${cita.tipo || 'Consulta General'}
👤 Paciente: ${cita.pacienteNombre || 'N/A'}
📆 Fecha: ${fechaFormateada}
🕐 Hora: ${cita.hora}
📝 Descripción: ${cita.descripcion || 'Sin descripción'}
📊 Estado: ${cita.estado || 'pendiente'}
  `.trim());
}

// ===== CARGAR PACIENTES PARA EL SELECT =====
async function cargarPacientesParaSelect() {
  try {
    const response = await fetch(`${API_BASE_URL}/patients`);
    const data = await response.json();

    if (data.success && data.patients) {
      const select = document.getElementById('paciente');
      select.innerHTML = '<option value="">Seleccionar paciente</option>';
      
      data.patients.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient._id;
        option.textContent = `${patient.nombre} ${patient.apellidos}`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('❌ Error al cargar pacientes:', error);
  }
}

// ===== CONFIGURAR FORMULARIOS =====
function configurarFormularios() {
  console.log('📝 Configurando formularios...');

  const forms = {
    cita: async () => {
      console.log('📅 Guardando cita...');
      const pacienteId = document.getElementById('paciente').value;
      const descripcion = document.getElementById('descripcion').value;
      const fecha = document.getElementById('fecha').value;
      const hora = document.getElementById('hora').value;
      const tipoCita = document.getElementById('tipoCita').value;
      const medicoId = localStorage.getItem('userId');

      if (!pacienteId || !fecha || !hora) {
        alert('Por favor completa todos los campos requeridos');
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
            medicoId: medicoId,
            fecha: fecha,
            hora: hora,
            tipo: tipoCita || 'Consulta General',
            descripcion: descripcion || ''
          })
        });

        const data = await response.json();

        if (data.success) {
          alert('✅ Cita agendada correctamente!');
          Modal.cerrar('cita');
          await cargarCitasMedico(medicoId);
          document.querySelector('[data-form="cita"]').reset();
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
      console.log('💾 Guardando perfil...');
      try {
        const userId = localStorage.getItem('userId');
        console.log('👤 ID del usuario:', userId);
        
        if (!userId) {
          alert('❌ Error: No se encontró ID de usuario');
          return;
        }

        // Obtener valores (pueden estar vacíos)
        const updateData = {
          nombre: document.getElementById('nombre').value.trim(),
          apellidos: document.getElementById('apellidos').value.trim(),
          cedula: document.getElementById('cedula').value.trim(),
          telefono: document.getElementById('telefono').value.trim(),
          email: document.getElementById('correo').value.trim()
        };

        console.log('📤 Datos a enviar:', updateData);
        console.log('🌐 URL:', `http://localhost:3001/auth/user/${userId}`);

        // Enviar actualización
        const response = await fetch(`http://localhost:3001/auth/user/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });

        console.log('📡 Status de respuesta:', response.status);
        console.log('📡 Status text:', response.statusText);

        const data = await response.json();
        console.log('📥 Respuesta completa:', data);

        if (response.ok && data.success) {
          alert('✅ Perfil actualizado correctamente!');
          Modal.cerrar('perfil');
        } else {
          alert('❌ Error al actualizar perfil: ' + (data.error || 'Error desconocido'));
          console.error('❌ Detalles del error:', data);
        }
      } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        console.error('❌ Stack trace:', error.stack);
        alert('❌ Error de conexión al actualizar perfil: ' + error.message);
      }
    }
  };

  // Asignar eventos a formularios
  document.querySelectorAll('[data-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formName = form.dataset.form;
      forms[formName]();
    });
  });
}