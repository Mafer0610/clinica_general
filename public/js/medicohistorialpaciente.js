document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    const searchResults = document.getElementById('searchResults');
    const patientDetailView = document.getElementById('patientDetailView');
    const detailContent = document.querySelector('.detail-content');
    const detailPlaceholder = document.querySelector('.detail-placeholder');
    const patientNameDetail = document.getElementById('patientNameDetail');
    const recordsContainer = document.querySelector('.records-container');
    const recordModal = document.getElementById('recordModal');
    const closeRecordModal = document.getElementById('closeRecordModal');
    const closeRecordModalBtn = document.getElementById('closeRecordModalBtn');
    const recordModalTitle = document.getElementById('recordModalTitle');
    const recordModalContent = document.getElementById('recordModalContent');

    // Datos de ejemplo (en una aplicación real, estos vendrían de una base de datos)
    const pacientes = [
        { 
            id: 1, 
            nombre: "María González López", 
            edad: 45, 
            telefono: "555-1234", 
            expedientes: [
                {
                    fecha: "2023-11-15",
                    expedientes: [
                        {
                            tipo: "Expediente Clínico",
                            descripcion: "Consulta de rutina - Control de presión arterial",
                            hora: "10:30 AM",
                            contenido: {
                                motivo: "Consulta de rutina - Control de presión arterial",
                                sintomas: "Dolor de cabeza, mareos ocasionales",
                                presion: "130/85 mmHg",
                                frecuencia: "78 lpm",
                                temperatura: "36.8°C",
                                diagnostico: "Hipertensión arterial controlada",
                                observaciones: "Paciente responde bien al tratamiento actual. Mantener dosis."
                            }
                        },
                        {
                            tipo: "Receta Médica",
                            descripcion: "Medicamentos para hipertensión",
                            hora: "10:45 AM",
                            contenido: {
                                diagnostico: "Hipertensión arterial",
                                medicamentos: [
                                    { nombre: "Losartán", dosis: "50 mg", instrucciones: "Tomar una tableta cada 24 horas por la mañana" },
                                    { nombre: "Hidroclorotiazida", dosis: "25 mg", instrucciones: "Tomar una tableta cada 24 horas por la mañana" }
                                ],
                                duracion: "30 días",
                                control: "Regresar en 1 mes para revisión"
                            }
                        }
                    ]
                },
                {
                    fecha: "2023-10-20",
                    expedientes: [
                        {
                            tipo: "Expediente Clínico",
                            descripcion: "Revisión post-operatoria",
                            hora: "09:15 AM",
                            contenido: {
                                motivo: "Revisión post-operatoria",
                                sintomas: "Dolor moderado en zona operatoria",
                                presion: "125/80 mmHg",
                                frecuencia: "72 lpm",
                                temperatura: "36.9°C",
                                diagnostico: "Recuperación post-operatoria satisfactoria",
                                observaciones: "Herida quirúrgica en buen estado. Continuar con cuidados."
                            }
                        }
                    ]
                }
            ]
        },
        { 
            id: 2, 
            nombre: "Carlos Rodríguez Pérez", 
            edad: 62, 
            telefono: "555-5678",
            expedientes: [
                {
                    fecha: "2023-11-10",
                    expedientes: [
                        {
                            tipo: "Expediente Clínico",
                            descripcion: "Control de diabetes",
                            hora: "11:00 AM",
                            contenido: {
                                motivo: "Control de diabetes",
                                sintomas: "Niveles de glucosa elevados en ayunas",
                                presion: "140/90 mmHg",
                                frecuencia: "76 lpm",
                                temperatura: "36.7°C",
                                diagnostico: "Diabetes tipo 2 controlada",
                                observaciones: "Ajustar dosis de metformina según niveles de glucosa"
                            }
                        }
                    ]
                }
            ]
        },
        { 
            id: 3, 
            nombre: "Ana Martínez Sánchez", 
            edad: 38, 
            telefono: "555-9012",
            expedientes: []
        }
    ];

    // Inicializar lista de pacientes
    mostrarResultados(pacientes);

    // Mostrar/ocultar limpiar búsqueda
    searchInput.addEventListener('input', function() {
        if (this.value.length > 0) {
            clearSearch.style.display = 'block';
            buscarPacientes(this.value);
        } else {
            clearSearch.style.display = 'none';
            mostrarResultados(pacientes);
        }
    });

    // Limpiar búsqueda
    clearSearch.addEventListener('click', function() {
        searchInput.value = '';
        clearSearch.style.display = 'none';
        mostrarResultados(pacientes);
    });

    // Función de búsqueda
    function buscarPacientes(termino) {
        const resultados = pacientes.filter(paciente => 
            paciente.nombre.toLowerCase().includes(termino.toLowerCase())
        );
        
        mostrarResultados(resultados);
    }

    // Mostrar resultados de búsqueda
    function mostrarResultados(resultados) {
        if (resultados.length === 0) {
            searchResults.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-user-times"></i>
                    <p>No se encontraron pacientes</p>
                </div>
            `;
            return;
        }

        searchResults.innerHTML = resultados.map(paciente => `
            <div class="patient-card" data-id="${paciente.id}">
                <div class="patient-icon">
                    <i class="fas fa-user-injured"></i>
                </div>
                <div class="patient-info">
                    <div class="patient-name">${paciente.nombre}</div>
                    <div class="patient-detail"><strong>Edad:</strong> ${paciente.edad} años</div>
                    <div class="patient-detail"><strong>Teléfono:</strong> ${paciente.telefono}</div>
                    <div class="patient-detail"><strong>Expedientes:</strong> ${paciente.expedientes.length} citas registradas</div>
                </div>
            </div>
        `).join('');

        // Agregar eventos a las tarjetas de pacientes
        document.querySelectorAll('.patient-card').forEach(card => {
            card.addEventListener('click', function() {
                // Remover selección anterior
                document.querySelectorAll('.patient-card').forEach(c => c.classList.remove('selected'));
                
                // Seleccionar actual
                this.classList.add('selected');
                
                const pacienteId = this.getAttribute('data-id');
                const paciente = pacientes.find(p => p.id == pacienteId);
                mostrarDetallePaciente(paciente);
            });
        });
    }

    // Mostrar detalle del paciente
    function mostrarDetallePaciente(paciente) {
        patientNameDetail.textContent = paciente.nombre;
        
        // Mostrar expedientes
        mostrarExpedientesPaciente(paciente.expedientes);
        
        // Cambiar vista
        detailPlaceholder.style.display = 'none';
        detailContent.style.display = 'block';
    }

    // Mostrar expedientes del paciente
    function mostrarExpedientesPaciente(expedientes) {
        if (expedientes.length === 0) {
            recordsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-folder-open"></i>
                    <p>No hay expedientes registrados</p>
                </div>
            `;
            return;
        }

        recordsContainer.innerHTML = expedientes.map(expediente => `
            <div class="folder" data-date="${expediente.fecha}">
                <div class="folder-header">
                    <i class="fas fa-folder"></i>
                    <span class="folder-date">${formatearFecha(expediente.fecha)}</span>
                    <i class="fas fa-chevron-down folder-toggle"></i>
                </div>
                <div class="folder-content">
                    ${expediente.expedientes.map(registro => `
                        <div class="record-item">
                            <i class="${registro.tipo === 'Expediente Clínico' ? 'fas fa-file-medical' : 'fas fa-file-prescription'}"></i>
                            <div class="record-info">
                                <h4>${registro.tipo}</h4>
                                <p>${registro.descripcion}</p>
                                <span class="record-time">${registro.hora}</span>
                            </div>
                            <button class="btn-view-record" data-tipo="${registro.tipo}" data-descripcion="${registro.descripcion}">
                                <i class="fas fa-eye"></i> Ver
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        // Agregar eventos a las carpetas
        document.querySelectorAll('.folder').forEach(folder => {
            const header = folder.querySelector('.folder-header');
            header.addEventListener('click', function() {
                folder.classList.toggle('active');
            });
        });

        // Agregar eventos a los botones de ver
        document.querySelectorAll('.btn-view-record').forEach(btn => {
            btn.addEventListener('click', function() {
                const tipo = this.getAttribute('data-tipo');
                const descripcion = this.getAttribute('data-descripcion');
                const fecha = this.closest('.folder').getAttribute('data-date');
                
                // Encontrar el contenido del registro
                const expedienteCompleto = expedientes.find(e => e.fecha === fecha);
                const registro = expedienteCompleto.expedientes.find(r => 
                    r.tipo === tipo && r.descripcion === descripcion
                );
                
                if (registro) {
                    mostrarModalRegistro(registro);
                }
            });
        });
    }

    // Mostrar modal con el contenido del registro
    function mostrarModalRegistro(registro) {
        recordModalTitle.textContent = registro.tipo;
        
        if (registro.tipo === 'Expediente Clínico') {
            recordModalContent.innerHTML = `
                <div class="record-content">
                    <div class="record-section">
                        <h4 class="record-section-title">Información de la Consulta</h4>
                        <div class="record-field">
                            <span class="record-label">Fecha:</span>
                            <span class="record-value">${formatearFecha(registro.contenido.fecha || '2023-11-15')}</span>
                        </div>
                        <div class="record-field">
                            <span class="record-label">Motivo:</span>
                            <span class="record-value">${registro.descripcion}</span>
                        </div>
                        <div class="record-field">
                            <span class="record-label">Síntomas:</span>
                            <span class="record-value">${registro.contenido.sintomas}</span>
                        </div>
                    </div>
                    
                    <div class="record-section">
                        <h4 class="record-section-title">Signos Vitales</h4>
                        <div class="record-field">
                            <span class="record-label">Presión Arterial:</span>
                            <span class="record-value">${registro.contenido.presion}</span>
                        </div>
                        <div class="record-field">
                            <span class="record-label">Frecuencia Cardíaca:</span>
                            <span class="record-value">${registro.contenido.frecuencia}</span>
                        </div>
                        <div class="record-field">
                            <span class="record-label">Temperatura:</span>
                            <span class="record-value">${registro.contenido.temperatura}</span>
                        </div>
                    </div>
                    
                    <div class="record-section">
                        <h4 class="record-section-title">Diagnóstico</h4>
                        <div class="record-field">
                            <span class="record-label">Primario:</span>
                            <span class="record-value">${registro.contenido.diagnostico}</span>
                        </div>
                        <div class="record-field">
                            <span class="record-label">Observaciones:</span>
                            <span class="record-value">${registro.contenido.observaciones}</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (registro.tipo === 'Receta Médica') {
            recordModalContent.innerHTML = `
                <div class="record-content">
                    <div class="record-section">
                        <h4 class="record-section-title">Información de la Receta</h4>
                        <div class="record-field">
                            <span class="record-label">Fecha:</span>
                            <span class="record-value">${formatearFecha(registro.contenido.fecha || '2023-11-15')}</span>
                        </div>
                        <div class="record-field">
                            <span class="record-label">Diagnóstico:</span>
                            <span class="record-value">${registro.contenido.diagnostico}</span>
                        </div>
                    </div>
                    
                    <div class="record-section">
                        <h4 class="record-section-title">Medicamentos Recetados</h4>
                        ${registro.contenido.medicamentos.map(med => `
                            <div class="prescription-item">
                                <div class="prescription-header">
                                    <span class="prescription-name">${med.nombre}</span>
                                    <span class="prescription-dosage">${med.dosis}</span>
                                </div>
                                <div class="prescription-instructions">
                                    ${med.instrucciones}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="record-section">
                        <h4 class="record-section-title">Instrucciones Adicionales</h4>
                        <div class="record-field">
                            <span class="record-label">Duración:</span>
                            <span class="record-value">${registro.contenido.duracion}</span>
                        </div>
                        <div class="record-field">
                            <span class="record-label">Control:</span>
                            <span class="record-value">${registro.contenido.control}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        recordModal.style.display = 'flex';
    }

    // Cerrar modal
    function cerrarModal() {
        recordModal.style.display = 'none';
    }

    closeRecordModal.addEventListener('click', cerrarModal);
    closeRecordModalBtn.addEventListener('click', cerrarModal);

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(e) {
        if (e.target === recordModal) {
            cerrarModal();
        }
    });

    // Función auxiliar para formatear fechas
    function formatearFecha(fechaStr) {
        const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(fechaStr).toLocaleDateString('es-ES', opciones);
    }
});