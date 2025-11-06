const API_BASE_URL = 'http://localhost:3002/api';

let pacientes = [];
let recetasCache = {};
let expedientesCache = {};

document.addEventListener('DOMContentLoaded', async function() {
    await cargarPacientes();
    configurarBusqueda();
    configurarModalPerfil();
});

async function cargarPacientes() {
    try {
        const response = await fetch(`${API_BASE_URL}/patients`);
        const data = await response.json();
        
        if (data.success && data.patients) {
            pacientes = data.patients;
            mostrarListaPacientes(pacientes);
        } else {
            console.error('❌ Error al cargar pacientes:', data.error);
            mostrarMensajeError('No se pudieron cargar los pacientes');
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        mostrarMensajeError('Error de conexión con el servidor');
    }
}

function mostrarListaPacientes(listaPacientes) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';
    
    if (listaPacientes.length === 0) {
        searchResults.innerHTML = `
            <div class="no-results">
                <i class="fas fa-user-times"></i>
                <p>No se encontraron pacientes</p>
            </div>
        `;
        return;
    }
    
    listaPacientes.forEach(paciente => {
        const card = crearTarjetaPaciente(paciente);
        searchResults.appendChild(card);
    });
}

function crearTarjetaPaciente(paciente) {
    const card = document.createElement('div');
    card.className = 'patient-card';
    card.dataset.id = paciente._id;
    
    card.innerHTML = `
        <div class="patient-icon">
            <i class="fas fa-user-injured"></i>
        </div>
        <div class="patient-info">
            <div class="patient-name">${paciente.nombre} ${paciente.apellidos}</div>
            <div class="patient-detail"><strong>Edad:</strong> ${paciente.edad || 'N/A'} años</div>
            <div class="patient-detail"><strong>Teléfono:</strong> ${paciente.telefono || 'N/A'}</div>
            <div class="patient-detail" data-registros="${paciente._id}"><strong>Registros:</strong> Ver registros</div>
        </div>
    `;
    
    card.addEventListener('click', async () => {
        document.querySelectorAll('.patient-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        await mostrarDetallePaciente(paciente, card);
    });
    
    return card;
}

async function mostrarDetallePaciente(paciente, card) {
    const patientNameDetail = document.getElementById('patientNameDetail');
    const recordsContainer = document.querySelector('.records-container');
    const detailPlaceholder = document.querySelector('.detail-placeholder');
    const detailContent = document.querySelector('.detail-content');
    
    patientNameDetail.textContent = `${paciente.nombre} ${paciente.apellidos}`;
    
    recordsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #0F3759;"></i>
            <p style="color: #6B8199; margin-top: 15px;">Cargando registros...</p>
        </div>
    `;
    
    detailPlaceholder.style.display = 'none';
    detailContent.style.display = 'block';
    
    try {
        const [expedientes, recetas] = await Promise.all([
            cargarExpedientesPaciente(paciente._id),
            cargarRecetasPaciente(paciente._id)
        ]);
        
        if (card) {
            const totalRegistros = expedientes.length + recetas.length;
            const registrosElement = card.querySelector('[data-registros]');
            if (registrosElement) {
                registrosElement.innerHTML = `<strong>Registros:</strong> ${totalRegistros} (${expedientes.length} exp, ${recetas.length} rec)`;
            }
        }
        
        const registrosAgrupados = agruparRegistrosPorFecha(expedientes, recetas);
        mostrarRegistrosAgrupados(registrosAgrupados);
        
    } catch (error) {
        console.error('❌ Error cargando registros:', error);
        recordsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar registros</p>
                <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #0F3759; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Reintentar
                </button>
            </div>
        `;
    }
}

// ===== CARGAR EXPEDIENTES DEL PACIENTE =====
async function cargarExpedientesPaciente(pacienteId) {
    try {
        if (expedientesCache[pacienteId]) {
            return expedientesCache[pacienteId];
        }        
        const response = await fetch(`${API_BASE_URL}/expedientes/paciente/${pacienteId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data?.expediente?.consultas) {
            const consultas = data.data.expediente.consultas;
            expedientesCache[pacienteId] = consultas;
            return consultas;
        }
        
        return [];
    } catch (error) {
        console.error('❌ Error cargando expedientes:', error);
        return [];
    }
}

async function cargarRecetasPaciente(pacienteId) {
    try {
        if (recetasCache[pacienteId]) {
            return recetasCache[pacienteId];
        }        
        const response = await fetch(`${API_BASE_URL}/recetas/paciente/${pacienteId}`);
        const data = await response.json();
        
        if (data.success && data.recetas) {
            recetasCache[pacienteId] = data.recetas;
            return data.recetas;
        }
        
        return [];
    } catch (error) {
        console.error('❌ Error cargando recetas:', error);
        return [];
    }
}

function agruparRegistrosPorFecha(expedientes, recetas) {
    const grupos = {};
    
    expedientes.forEach(exp => {
        const fecha = new Date(exp.fechaConsulta);
        const fechaKey = fecha.toISOString().split('T')[0];
        
        if (!grupos[fechaKey]) {
            grupos[fechaKey] = {
                fecha: fecha,
                registros: []
            };
        }
        
        grupos[fechaKey].registros.push({
            tipo: 'expediente',
            data: exp
        });
    });
    
    recetas.forEach(receta => {
        const fecha = new Date(receta.fecha);
        const fechaKey = fecha.toISOString().split('T')[0];
        
        if (!grupos[fechaKey]) {
            grupos[fechaKey] = {
                fecha: fecha,
                registros: []
            };
        }
        
        grupos[fechaKey].registros.push({
            tipo: 'receta',
            data: receta
        });
    });
    
    return Object.values(grupos).sort((a, b) => b.fecha - a.fecha);
}

function mostrarRegistrosAgrupados(grupos) {
    const recordsContainer = document.querySelector('.records-container');
    
    if (grupos.length === 0) {
        recordsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-folder-open"></i>
                <p>No hay registros médicos para este paciente</p>
            </div>
        `;
        return;
    }
    
    recordsContainer.innerHTML = '';
    
    grupos.forEach(grupo => {
        const folder = crearCarpetaFecha(grupo);
        recordsContainer.appendChild(folder);
    });
}

function crearCarpetaFecha(grupo) {
    const folder = document.createElement('div');
    folder.className = 'folder';
    
    const fechaFormateada = formatearFecha(grupo.fecha);
    
    const header = document.createElement('div');
    header.className = 'folder-header';
    header.innerHTML = `
        <i class="fas fa-folder"></i>
        <span class="folder-date">${fechaFormateada}</span>
        <i class="fas fa-chevron-down folder-toggle"></i>
    `;
    
    const content = document.createElement('div');
    content.className = 'folder-content';
    
    const registrosOrdenados = grupo.registros.sort((a, b) => {
        if (a.tipo === 'expediente' && b.tipo === 'receta') return -1;
        if (a.tipo === 'receta' && b.tipo === 'expediente') return 1;
        return 0;
    });
    
    registrosOrdenados.forEach(registro => {
        const item = crearItemRegistro(registro);
        content.appendChild(item);
    });
    
    folder.appendChild(header);
    folder.appendChild(content);
    
    header.addEventListener('click', () => {
        folder.classList.toggle('active');
    });
    
    return folder;
}

function crearItemRegistro(registro) {
    const item = document.createElement('div');
    item.className = 'record-item';
    
    if (registro.tipo === 'expediente') {
        const exp = registro.data;
        const hora = exp.horaConsulta || '00:00';
        const descripcion = exp.padecimientoActual || exp.diagnosticoPrincipal || 'Consulta médica';
        
        item.innerHTML = `
            <i class="fas fa-file-medical"></i>
            <div class="record-info">
                <h4>Expediente Clínico</h4>
                <p>${descripcion.substring(0, 60)}${descripcion.length > 60 ? '...' : ''}</p>
                <span class="record-time">${hora}</span>
            </div>
            <button class="btn-view-record">
                <i class="fas fa-eye"></i> Ver
            </button>
        `;
        
        const btnVer = item.querySelector('.btn-view-record');
        btnVer.addEventListener('click', (e) => {
            e.stopPropagation();
            mostrarModalExpediente(exp);
        });
        
    } else if (registro.tipo === 'receta') {
        const receta = registro.data;
        const hora = new Date(receta.fecha).toLocaleTimeString('es-MX', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const descripcion = receta.diagnostico || 'Receta médica';
        
        item.innerHTML = `
            <i class="fas fa-file-prescription"></i>
            <div class="record-info">
                <h4>Receta Médica</h4>
                <p>${descripcion.substring(0, 60)}${descripcion.length > 60 ? '...' : ''}</p>
                <span class="record-time">${hora}</span>
            </div>
            <button class="btn-view-record">
                <i class="fas fa-eye"></i> Ver
            </button>
        `;
        
        const btnVer = item.querySelector('.btn-view-record');
        btnVer.addEventListener('click', (e) => {
            e.stopPropagation();
            mostrarModalReceta(receta);
        });
    }
    
    return item;
}

function mostrarModalExpediente(expediente) {    
    const modal = document.getElementById('recordModal');
    const title = document.getElementById('recordModalTitle');
    const content = document.getElementById('recordModalContent');
    
    title.textContent = 'Expediente Clínico';
    
    content.innerHTML = `
        <div class="record-content">
            <div class="record-section">
                <h4 class="record-section-title">Información de la Consulta</h4>
                <div class="record-field">
                    <span class="record-label">Fecha:</span>
                    <span class="record-value">${formatearFecha(new Date(expediente.fechaConsulta))}</span>
                </div>
                <div class="record-field">
                    <span class="record-label">Hora:</span>
                    <span class="record-value">${expediente.horaConsulta || 'N/A'}</span>
                </div>
                <div class="record-field">
                    <span class="record-label">Tipo:</span>
                    <span class="record-value">${expediente.tipoConsulta || 'N/A'}</span>
                </div>
                <div class="record-field">
                    <span class="record-label">Motivo:</span>
                    <span class="record-value">${expediente.padecimientoActual || 'N/A'}</span>
                </div>
            </div>
            
            ${expediente.signosVitales ? `
            <div class="record-section">
                <h4 class="record-section-title">Signos Vitales</h4>
                <div class="record-field">
                    <span class="record-label">Presión Arterial:</span>
                    <span class="record-value">${expediente.signosVitales.presion || 'N/A'}</span>
                </div>
                <div class="record-field">
                    <span class="record-label">Frecuencia Cardíaca:</span>
                    <span class="record-value">${expediente.signosVitales.frecuenciaCardiaca || 'N/A'} lpm</span>
                </div>
                <div class="record-field">
                    <span class="record-label">Temperatura:</span>
                    <span class="record-value">${expediente.signosVitales.temperatura || 'N/A'} °C</span>
                </div>
                <div class="record-field">
                    <span class="record-label">Peso:</span>
                    <span class="record-value">${expediente.signosVitales.peso || 'N/A'} kg</span>
                </div>
            </div>
            ` : ''}
            
            <div class="record-section">
                <h4 class="record-section-title">Diagnóstico</h4>
                <div class="record-field">
                    <span class="record-label">Primario:</span>
                    <span class="record-value">${expediente.diagnosticoPrincipal || 'N/A'}</span>
                </div>
                ${expediente.diagnosticosSecundarios ? `
                <div class="record-field">
                    <span class="record-label">Secundarios:</span>
                    <span class="record-value">${expediente.diagnosticosSecundarios}</span>
                </div>
                ` : ''}
            </div>
            
            ${expediente.medicamentos && expediente.medicamentos.length > 0 ? `
            <div class="record-section">
                <h4 class="record-section-title">Medicamentos</h4>
                ${expediente.medicamentos.map(med => `
                    <div class="prescription-item">
                        <div class="prescription-header">
                            <span class="prescription-name">${med.nombre}</span>
                            <span class="prescription-dosage">${med.dosis}</span>
                        </div>
                        <div class="prescription-instructions">
                            ${med.via} - ${med.frecuencia} - ${med.duracion}
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${expediente.indicacionesGenerales ? `
            <div class="record-section">
                <h4 class="record-section-title">Indicaciones</h4>
                <div class="record-field">
                    <span class="record-value">${expediente.indicacionesGenerales}</span>
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'flex';
}

function mostrarModalReceta(receta) {
    const modal = document.getElementById('recordModal');
    const title = document.getElementById('recordModalTitle');
    const content = document.getElementById('recordModalContent');
    
    title.textContent = 'Receta Médica';
    
    content.innerHTML = `
        <div class="record-content">
            <div class="record-section">
                <h4 class="record-section-title">Información General</h4>
                <div class="record-field">
                    <span class="record-label">Fecha:</span>
                    <span class="record-value">${formatearFecha(new Date(receta.fecha))}</span>
                </div>
                <div class="record-field">
                    <span class="record-label">Paciente:</span>
                    <span class="record-value">${receta.pacienteNombre}</span>
                </div>
                <div class="record-field">
                    <span class="record-label">Edad:</span>
                    <span class="record-value">${receta.pacienteEdad || 'N/A'} años</span>
                </div>
                <div class="record-field">
                    <span class="record-label">Médico:</span>
                    <span class="record-value">${receta.medicoNombre}</span>
                </div>
                ${receta.medicoCedula ? `
                <div class="record-field">
                    <span class="record-label">Cédula:</span>
                    <span class="record-value">${receta.medicoCedula}</span>
                </div>
                ` : ''}
            </div>
            
            ${receta.peso || receta.estatura || receta.frecuenciaCardiaca ? `
            <div class="record-section">
                <h4 class="record-section-title">Signos Vitales</h4>
                ${receta.peso ? `
                <div class="record-field">
                    <span class="record-label">Peso:</span>
                    <span class="record-value">${receta.peso} kg</span>
                </div>
                ` : ''}
                ${receta.estatura ? `
                <div class="record-field">
                    <span class="record-label">Estatura:</span>
                    <span class="record-value">${receta.estatura} cm</span>
                </div>
                ` : ''}
                ${receta.frecuenciaCardiaca ? `
                <div class="record-field">
                    <span class="record-label">Frecuencia Cardíaca:</span>
                    <span class="record-value">${receta.frecuenciaCardiaca} lpm</span>
                </div>
                ` : ''}
                ${receta.frecuenciaRespiratoria ? `
                <div class="record-field">
                    <span class="record-label">Frecuencia Respiratoria:</span>
                    <span class="record-value">${receta.frecuenciaRespiratoria} rpm</span>
                </div>
                ` : ''}
                ${receta.tensionArterial ? `
                <div class="record-field">
                    <span class="record-label">Tensión Arterial:</span>
                    <span class="record-value">${receta.tensionArterial} mmHg</span>
                </div>
                ` : ''}
                ${receta.temperatura ? `
                <div class="record-field">
                    <span class="record-label">Temperatura:</span>
                    <span class="record-value">${receta.temperatura} °C</span>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            ${receta.diagnostico ? `
            <div class="record-section">
                <h4 class="record-section-title">Diagnóstico</h4>
                <div class="record-field">
                    <span class="record-value">${receta.diagnostico}</span>
                </div>
            </div>
            ` : ''}
            
            <div class="record-section">
                <h4 class="record-section-title">Prescripción</h4>
                <div class="record-field">
                    <span class="record-value" style="white-space: pre-wrap;">${receta.prescripcion}</span>
                </div>
            </div>
            
            ${receta.recomendaciones ? `
            <div class="record-section">
                <h4 class="record-section-title">Recomendaciones</h4>
                <div class="record-field">
                    <span class="record-value" style="white-space: pre-wrap;">${receta.recomendaciones}</span>
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'flex';
}

function cerrarModal() {
    document.getElementById('recordModal').style.display = 'none';
}

document.getElementById('closeRecordModal').addEventListener('click', cerrarModal);
document.getElementById('closeRecordModalBtn').addEventListener('click', cerrarModal);

window.addEventListener('click', (e) => {
    const modal = document.getElementById('recordModal');
    if (e.target === modal) {
        cerrarModal();
    }
});

function configurarBusqueda() {
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        if (searchTerm.length > 0) {
            clearSearch.classList.add('show');
            const resultados = pacientes.filter(p => {
                const nombreCompleto = `${p.nombre} ${p.apellidos}`.toLowerCase();
                return nombreCompleto.includes(searchTerm);
            });
            mostrarListaPacientes(resultados);
        } else {
            clearSearch.classList.remove('show');
            mostrarListaPacientes(pacientes);
        }
    });
    
    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        clearSearch.classList.remove('show');
        mostrarListaPacientes(pacientes);
        searchInput.focus();
    });
}

function formatearFecha(fecha) {
    return fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function mostrarMensajeError(mensaje) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = `
        <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff6b6b; margin-bottom: 20px;"></i>
            <p style="color: #6B8199; font-size: 1.1em;">${mensaje}</p>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #0F3759; color: white; border: none; border-radius: 8px; cursor: pointer;">
                Reintentar
            </button>
        </div>
    `;
}

function configurarModalPerfil() {
    const profileIcon = document.querySelector('.profile-icon');
    const modal = document.getElementById('modalPerfil');
    const closeBtn = modal?.querySelector('.modal-close');
    const form = modal?.querySelector('.modal-form-perfil');

    if (!profileIcon || !modal) return;

    profileIcon.addEventListener('click', async () => {
        await cargarPerfilMedico();
        modal.style.display = 'block';
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarPerfilMedico();
        });
    }
}

async function cargarPerfilMedico() {
    try {
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
            console.error('❌ No se encontró ID de usuario');
            return;
        }

        const response = await fetch(`http://localhost:3001/auth/user/${userId}`);
        const data = await response.json();

        if (data.success && data.user) {
            document.getElementById('nombre').value = data.user.nombre || '';
            document.getElementById('apellidos').value = data.user.apellidos || '';
            document.getElementById('cedula').value = data.user.cedula || '';
            document.getElementById('telefono').value = data.user.telefono || '';
            document.getElementById('correo').value = data.user.email || '';
        }
    } catch (error) {
        console.error('❌ Error cargando perfil:', error);
    }
}

async function guardarPerfilMedico() {
    try {
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
            alert('❌ Error: No se encontró ID de usuario');
            return;
        }

        const updateData = {
            nombre: document.getElementById('nombre').value.trim(),
            apellidos: document.getElementById('apellidos').value.trim(),
            cedula: document.getElementById('cedula').value.trim(),
            telefono: document.getElementById('telefono').value.trim()
        };

        const response = await fetch(`http://localhost:3001/auth/user/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert('✅ Perfil actualizado correctamente');
            document.getElementById('modalPerfil').style.display = 'none';
        } else {
            alert('❌ Error: ' + (data.error || 'No se pudo actualizar el perfil'));
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error de conexión: ' + error.message);
    }
}