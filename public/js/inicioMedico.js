// ===== CONFIGURACIÓN API =====
const API_BASE_URL = 'http://localhost:3002/api';

// ===== GESTIÓN UNIFICADA DE MODALES =====
const Modal = {
  abrir: (id) => document.getElementById(`modal${id.charAt(0).toUpperCase() + id.slice(1)}`).style.display = 'flex',
  cerrar: (id) => document.getElementById(`modal${id.charAt(0).toUpperCase() + id.slice(1)}`).style.display = 'none'
};

// ===== CARGAR DATOS AL INICIAR =====
document.addEventListener('DOMContentLoaded', async function() {
  // Obtener ID del médico del localStorage
  const medicoId = localStorage.getItem('userId');
  if (medicoId) {
    await cargarCitasMedico(medicoId);
    await cargarPacientesParaSelect();
  } else {
    console.error('No se encontró ID de médico en localStorage');
  }
});

// ===== CARGAR CITAS DEL MÉDICO =====
async function cargarCitasMedico(medicoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments/medico/${medicoId}`);
    const data = await response.json();

    if (data.success && data.appointments) {
      renderizarCitasEnCalendario(data.appointments);
    } else {
      console.error('Error al cargar citas:', data.error);
    }
  } catch (error) {
    console.error('Error conectando con el servidor:', error);
  }
}

// ===== RENDERIZAR CITAS EN EL CALENDARIO =====
function renderizarCitasEnCalendario(appointments) {
  // Limpiar citas existentes
  document.querySelectorAll('.appointment-simple').forEach(el => el.remove());

  // Obtener fecha actual de inicio de semana (lunes)
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const diff = diaSemana === 0 ? -6 : 1 - diaSemana; // Si es domingo (0), retroceder 6 días
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diff);
  lunes.setHours(0, 0, 0, 0);

  // Crear fechas para cada día de la semana
  const fechasSemana = [];
  for (let i = 0; i < 5; i++) { // Lun-Vie
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + i);
    fechasSemana.push(fecha);
  }

  // Filtrar y colocar citas en el calendario
  appointments.forEach(cita => {
    const fechaCita = new Date(cita.fecha);
    
    // Encontrar el índice del día de la semana
    const diaIndex = fechasSemana.findIndex(fecha => 
      fecha.toDateString() === fechaCita.toDateString()
    );

    if (diaIndex !== -1) {
      // Obtener la hora de la cita
      const [hora, minutos] = cita.hora.split(':');
      const horaInt = parseInt(hora);

      // Validar que la hora esté en el rango del calendario (9-21)
      if (horaInt >= 9 && horaInt <= 21) {
        // Encontrar la celda correspondiente
        const filaIndex = horaInt - 9; // 9:00 = fila 0
        const columnaIndex = diaIndex + 1; // +1 porque la primera columna es la hora

        // Obtener todas las filas del tbody
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
            
            // Agregar evento click para ver detalles
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
    console.error('Error al cargar pacientes:', error);
  }
}

// Event Delegation: Un solo listener para todos los botones de abrir modales
document.addEventListener('click', (e) => {
  const modalTrigger = e.target.closest('[data-modal]');
  const modalClose = e.target.closest('[data-close]');
  const pickerTrigger = e.target.closest('[data-picker]');

  if (modalTrigger) Modal.abrir(modalTrigger.dataset.modal);
  if (modalClose) Modal.cerrar(modalClose.dataset.close);
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
    if (e.target === modal) modal.style.display = 'none';
  });
});

// ===== GESTIÓN DE FORMULARIOS =====
document.addEventListener('DOMContentLoaded', () => {
  const forms = {
    cita: async () => {
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
          alert('Cita agendada correctamente!');
          Modal.cerrar('cita');
          // Recargar citas
          await cargarCitasMedico(medicoId);
          // Limpiar formulario
          document.querySelector('[data-form="cita"]').reset();
        } else {
          alert('Error al agendar cita: ' + (data.error || 'Error desconocido'));
        }
      } catch (error) {
        console.error('Error al agendar cita:', error);
        alert('Error de conexión al agendar cita');
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
    perfil: () => {
      alert('Perfil actualizado correctamente!');
      Modal.cerrar('perfil');
    }
  };

  document.querySelectorAll('[data-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      forms[form.dataset.form]();
    });
  });
});