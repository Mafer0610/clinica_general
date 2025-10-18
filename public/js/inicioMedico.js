// ===== GESTIÓN UNIFICADA DE MODALES =====
const Modal = {
  abrir: (id) => document.getElementById(`modal${id.charAt(0).toUpperCase() + id.slice(1)}`).style.display = 'flex',
  cerrar: (id) => document.getElementById(`modal${id.charAt(0).toUpperCase() + id.slice(1)}`).style.display = 'none'
};

// Event Delegation: Un solo listener para todos los botones de abrir modales
document.addEventListener('click', (e) => {
  const modalTrigger = e.target.closest('[data-modal]');
  const modalClose = e.target.closest('[data-close]');
  const pickerTrigger = e.target.closest('[data-picker]');

  if (modalTrigger) Modal.abrir(modalTrigger.dataset.modal);
  if (modalClose) Modal.cerrar(modalClose.dataset.close);
  if (pickerTrigger) document.getElementById(pickerTrigger.dataset.picker).showPicker();
});

// Cerrar modales al hacer clic en el overlay
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });
});

// Gestión de formularios
document.addEventListener('DOMContentLoaded', () => {
  const forms = {
    cita: () => {
      alert('Cita agendada correctamente!');
      Modal.cerrar('cita');
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