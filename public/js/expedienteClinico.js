// ===== CONFIGURACIÓN API =====
const API_BASE_URL = 'http://localhost:3002/api';

// ===== VARIABLES GLOBALES =====
let expedienteId = null;
let pacienteId = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
  inicializarFechas();
  inicializarEventos();
  cargarDatosPaciente();
  verificarJsPDF();
});

// ===== INICIALIZAR FECHAS =====
function inicializarFechas() {
  const ahora = new Date();
  const fechaHoy = ahora.toISOString().split('T')[0];
  const horaActual = ahora.toTimeString().slice(0, 5);
  
  document.getElementById('fechaApertura').textContent = fechaHoy;
  document.getElementById('horaApertura').textContent = horaActual;
  document.getElementById('fechaConsulta').value = fechaHoy;
  document.getElementById('horaConsulta').value = horaActual;
  document.getElementById('fechaImpresion').textContent = formatearFecha(ahora);
  document.getElementById('fechaFirma').textContent = fechaHoy;
  document.getElementById('horaFirma').textContent = horaActual;
  document.getElementById('fechaFirmaPaciente').textContent = fechaHoy;
}

// ===== INICIALIZAR EVENTOS =====
function inicializarEventos() {
  document.getElementById('fechaNacimiento').addEventListener('change', calcularEdad);
  
  document.getElementById('peso').addEventListener('input', calcularIMC);
  document.getElementById('talla').addEventListener('input', calcularIMC);
  
  const printOriginal = window.print;
  window.print = function() {
    if (validarCamposObligatorios()) {
      printOriginal.call(window);
    }
  };
}

// ===== CARGAR DATOS DEL PACIENTE =====
async function cargarDatosPaciente() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    pacienteId = urlParams.get('pacienteId');
    
    if (!pacienteId) {
      alert('⚠️ No se especificó ID de paciente');
      return;
    }

    console.log('📥 Cargando expediente del paciente:', pacienteId);
    
    const response = await fetch(`${API_BASE_URL}/expedientes/paciente/${pacienteId}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Error al cargar expediente');
    }

    expedienteId = data.data.expediente._id;
    console.log('✅ Expediente ID:', expedienteId);
    console.log('📋 Número de expediente:', data.data.expediente.numeroExpediente);

    // ✅ IMPORTANTE: Convertir ObjectId a string si es necesario
    if (typeof expedienteId === 'object' && expedienteId.$oid) {
      expedienteId = expedienteId.$oid;
      console.log('🔄 ID convertido a string:', expedienteId);
    } else if (typeof expedienteId === 'object' && expedienteId.toString) {
      expedienteId = expedienteId.toString();
      console.log('🔄 ID convertido a string:', expedienteId);
    }

    // Cargar datos del paciente
    const paciente = data.data.paciente;
    const expediente = data.data.expediente;

    // 1. Datos generales del paciente
    document.getElementById('numExpediente').textContent = expediente.numeroExpediente;
    document.getElementById('nombrePaciente').value = `${paciente.nombre} ${paciente.apellidos}`;
    document.getElementById('fechaNacimiento').value = paciente.fechaNacimiento ? 
      new Date(paciente.fechaNacimiento).toISOString().split('T')[0] : '';
    document.getElementById('edadPaciente').value = paciente.edad ? paciente.edad + ' años' : '';
    document.getElementById('sexoPaciente').value = paciente.sexo || '';
    document.getElementById('domicilio').value = paciente.domicilio || '';
    document.getElementById('telefono').value = paciente.telefono || '';
    document.getElementById('telEmergencia').value = paciente.telefonoEmergencia || '';
    document.getElementById('correo').value = paciente.correo || '';

    // 2. Historia Clínica
    if (expediente.historiaClinica) {
      const hc = expediente.historiaClinica;
      
      document.getElementById('antecedentesHF').value = hc.antecedentesHF || '';
      document.getElementById('tipoSangre').value = hc.tipoSanguineo || paciente.tipoSanguineo || '';
      document.getElementById('tabaquismo').value = hc.tabaquismo || 'No';
      document.getElementById('cigarrosDia').value = hc.cigarrosDia || '';
      document.getElementById('anosFumando').value = hc.anosFumando || '';
      document.getElementById('alcoholismo').value = hc.alcoholismo || 'No';
      document.getElementById('sustancias').value = hc.sustancias || 'No';
      document.getElementById('especificarSustancia').value = hc.especificarSustancia || '';
      document.getElementById('habitosGenerales').value = hc.habitosGenerales || '';
      document.getElementById('alergias').value = hc.alergias || paciente.alergias || 'Ninguna';
      document.getElementById('cirugias').value = hc.cirugias || '';
      document.getElementById('enfermedadesCronicas').value = hc.enfermedadesCronicas?.otras || '';
      document.getElementById('interrogatorioSistemas').value = hc.interrogatorioSistemas || '';
      
      // Checkboxes de enfermedades crónicas
      if (hc.enfermedadesCronicas) {
        document.getElementById('diabetesCheck').checked = hc.enfermedadesCronicas.diabetes || false;
        document.getElementById('hipertensionCheck').checked = hc.enfermedadesCronicas.hipertension || false;
        document.getElementById('asmaCheck').checked = hc.enfermedadesCronicas.asma || false;
        document.getElementById('epilepsiaCheck').checked = hc.enfermedadesCronicas.epilepsia || false;
        document.getElementById('cancerCheck').checked = hc.enfermedadesCronicas.cancer || false;
        document.getElementById('tuberculosisCheck').checked = hc.enfermedadesCronicas.tuberculosis || false;
        document.getElementById('vihCheck').checked = hc.enfermedadesCronicas.vih || false;
      }
    }

    // 5. Resultados de estudios
    document.getElementById('resultadosEstudios').value = expediente.resultadosEstudios || '';

    console.log('✅ Datos del expediente cargados correctamente');
  } catch (error) {
    console.error('❌ Error cargando datos del paciente:', error);
    alert('Error al cargar datos del expediente: ' + error.message);
  }
}

// ===== GUARDAR EXPEDIENTE =====
async function guardarExpediente() {
  try {
    if (!expedienteId || !pacienteId) {
      alert('⚠️ No se puede guardar: faltan datos del expediente');
      return false;
    }

    if (!validarCamposObligatorios()) {
      return false;
    }

    console.log('💾 Guardando expediente...');

    const medicoId = localStorage.getItem('userId');

    // 1. Guardar Historia Clínica
    const historiaClinica = {
      antecedentesHF: getValue('antecedentesHF'),
      tipoSanguineo: getValue('tipoSangre') || null,
      tabaquismo: getValue('tabaquismo'),
      cigarrosDia: parseInt(getValue('cigarrosDia')) || null,
      anosFumando: parseInt(getValue('anosFumando')) || null,
      alcoholismo: getValue('alcoholismo'),
      sustancias: getValue('sustancias'),
      especificarSustancia: getValue('especificarSustancia'),
      habitosGenerales: getValue('habitosGenerales'),
      alergias: getValue('alergias'),
      cirugias: getValue('cirugias'),
      enfermedadesCronicas: {
        diabetes: document.getElementById('diabetesCheck').checked,
        hipertension: document.getElementById('hipertensionCheck').checked,
        asma: document.getElementById('asmaCheck').checked,
        epilepsia: document.getElementById('epilepsiaCheck').checked,
        cancer: document.getElementById('cancerCheck').checked,
        tuberculosis: document.getElementById('tuberculosisCheck').checked,
        vih: document.getElementById('vihCheck').checked,
        otras: getValue('enfermedadesCronicas')
      },
      interrogatorioSistemas: getValue('interrogatorioSistemas')
    };

    const responseHC = await fetch(`${API_BASE_URL}/expedientes/${expedienteId}/historia-clinica`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ historiaClinica })
    });

    if (!responseHC.ok) throw new Error('Error guardando historia clínica');

    // 2. Guardar Resultados de Estudios
    const responseEstudios = await fetch(`${API_BASE_URL}/expedientes/${expedienteId}/resultados-estudios`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resultadosEstudios: getValue('resultadosEstudios') })
    });

    if (!responseEstudios.ok) throw new Error('Error guardando resultados de estudios');

    // 3. Guardar Consulta Actual
    const medicamentosArray = [];
    const tablaMed = document.getElementById('tablaMedicamentos');
    const filasMed = tablaMed.getElementsByTagName('tr');
    
    for (let i = 0; i < filasMed.length; i++) {
      const inputs = filasMed[i].getElementsByTagName('input');
      const selects = filasMed[i].getElementsByTagName('select');
      
      if (inputs.length > 0 && inputs[0].value) {
        medicamentosArray.push({
          nombre: inputs[0].value,
          presentacion: inputs[1].value,
          dosis: inputs[2].value,
          via: selects[0].value,
          frecuencia: inputs[3].value,
          duracion: inputs[4].value
        });
      }
    }

    const consultaData = {
      fechaConsulta: getValue('fechaConsulta'),
      horaConsulta: getValue('horaConsulta'),
      tipoConsulta: getValue('tipoConsulta'),
      padecimientoActual: getValue('padecimientoActual'),
      signosVitales: {
        peso: parseFloat(getValue('peso')) || null,
        talla: parseFloat(getValue('talla')) || null,
        imc: getValue('imc'),
        temperatura: parseFloat(getValue('temperatura')) || null,
        presion: getValue('presion'),
        frecuenciaCardiaca: parseInt(getValue('frecuenciaCardiaca')) || null,
        frecuenciaRespiratoria: parseInt(getValue('frecuenciaRespiratoria')) || null,
        saturacion: parseInt(getValue('saturacion')) || null,
        glucosa: parseInt(getValue('glucosa')) || null
      },
      exploracionFisica: {
        habitusExterior: getValue('habitusExterior'),
        cabezaCuello: getValue('exploracionCabeza'),
        torax: getValue('exploracionTorax'),
        abdomen: getValue('exploracionAbdomen'),
        miembros: getValue('exploracionMiembros'),
        genitales: getValue('exploracionGenitales'),
        neurologico: getValue('neurologico')
      },
      diagnosticoPrincipal: getValue('diagnosticoPrincipal'),
      diagnosticosSecundarios: getValue('diagnosticosSecundarios'),
      pronostico: {
        tipo: getValue('pronostico'),
        observaciones: getValue('observacionesPronostico')
      },
      planEstudios: getValue('planEstudios'),
      medicamentos: medicamentosArray,
      indicacionesGenerales: getValue('indicacionesGenerales'),
      solicitaInterconsulta: getValue('solicitaInterconsulta') === 'Sí',
      especialidadInterconsulta: getValue('especialidadInterconsulta'),
      motivoInterconsulta: getValue('motivoInterconsulta'),
      solicitaReferencia: getValue('solicitaReferencia') === 'Sí',
      establecimientoReceptor: getValue('establecimientoReceptor'),
      motivoEnvio: getValue('motivoEnvio'),
      terapeuticaEmpleada: getValue('terapeuticaEmpleada'),
      observacionesAdicionales: getValue('observacionesAdicionales'),
      requiereConsentimiento: getValue('requiereConsentimiento') === 'Sí',
      tipoProcedimiento: getValue('tipoProcedimiento'),
      creadoPor: medicoId
    };

    const responseConsulta = await fetch(`${API_BASE_URL}/expedientes/${expedienteId}/consulta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consultaData)
    });

    if (!responseConsulta.ok) throw new Error('Error guardando consulta');

    console.log('✅ Expediente guardado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error guardando expediente:', error);
    alert('Error al guardar expediente: ' + error.message);
    return false;
  }
}

// ===== GENERAR PDF =====
async function generarPDFExpediente() {
  // Primero guardar el expediente
  const guardado = await guardarExpediente();
  
  if (!guardado) {
    return;
  }

  if (typeof window.jspdf === 'undefined') {
    alert('Error: La librería jsPDF no se ha cargado correctamente. Por favor, recarga la página.');
    return;
  }

  if (!validarCamposObligatorios()) {
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const config = {
    margenIzq: 12,
    margenDer: 198,
    anchoUtil: 186,
    lineHeight: 5,
    y: 10
  };

  function dibujarMarco() {
    doc.setDrawColor(15, 55, 89);
    doc.setLineWidth(0.5);
    doc.rect(8, 8, 194, 279);
  }

  dibujarMarco();

  config.y = generarHeaderPDF(doc, config);
  config.y = generarDatosPacientePDF(doc, config);
  config.y = generarHistoriaClinicaPDF(doc, config);
  config.y = generarPadecimientoActualPDF(doc, config);
  config.y = generarExploracionFisicaPDF(doc, config);
  config.y = generarResultadosEstudiosPDF(doc, config);
  config.y = generarDiagnosticosPDF(doc, config);
  config.y = generarPronosticoPDF(doc, config);
  config.y = generarTratamientoPDF(doc, config);
  generarFirmasPDF(doc, config);

  const nombrePaciente = getValue('nombrePaciente').replace(/\s+/g, '_') || 'Paciente';
  const fecha = getValue('fechaConsulta').replace(/-/g, '');
  doc.save(`Expediente_${nombrePaciente}_${fecha}.pdf`);
  
  alert('✅ Expediente guardado y PDF generado correctamente');
}

function verificarJsPDF() {
  if (typeof window.jspdf === 'undefined') {
    console.warn('jsPDF no se ha cargado. El botón de descarga PDF podría no funcionar.');
  } else {
  }
}

function calcularEdad() {
  const fechaNac = new Date(this.value);
  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const mes = hoy.getMonth() - fechaNac.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--;
  }
  
  document.getElementById('edadPaciente').value = edad + ' años';
}

function calcularIMC() {
  const peso = parseFloat(document.getElementById('peso').value);
  const talla = parseFloat(document.getElementById('talla').value) / 100;
  
  if (peso && talla && talla > 0) {
    const imc = (peso / (talla * talla)).toFixed(2);
    let clasificacion = '';
    
    if (imc < 18.5) clasificacion = ' (Bajo peso)';
    else if (imc < 25) clasificacion = ' (Normal)';
    else if (imc < 30) clasificacion = ' (Sobrepeso)';
    else if (imc < 35) clasificacion = ' (Obesidad I)';
    else if (imc < 40) clasificacion = ' (Obesidad II)';
    else clasificacion = ' (Obesidad III)';
    
    document.getElementById('imc').value = imc + clasificacion;
  }
}

function agregarFilaMedicamento() {
  const tabla = document.getElementById('tablaMedicamentos');
  const nuevaFila = tabla.insertRow();
  nuevaFila.innerHTML = `
    <td><input type="text" placeholder="Nombre genérico"></td>
    <td><input type="text" placeholder="mg/ml/tab"></td>
    <td><input type="text" placeholder="Cantidad"></td>
    <td>
      <select style="width: 100%; padding: 5px;">
        <option value="Oral">Oral</option>
        <option value="IV">IV</option>
        <option value="IM">IM</option>
        <option value="SC">SC</option>
        <option value="Tópica">Tópica</option>
        <option value="Inhalatoria">Inhalatoria</option>
        <option value="Rectal">Rectal</option>
        <option value="Oftálmica">Oftálmica</option>
      </select>
    </td>
    <td><input type="text" placeholder="c/8h, c/12h"></td>
    <td><input type="text" placeholder="7 días"></td>
  `;
}

function toggleInterconsulta() {
  const solicita = document.getElementById('solicitaInterconsulta').value === 'Sí';
  document.getElementById('especialidadInterconsulta').disabled = !solicita;
  document.getElementById('motivoInterconsulta').disabled = !solicita;
}

function toggleReferencia() {
  const solicita = document.getElementById('solicitaReferencia').value === 'Sí';
  document.getElementById('establecimientoReceptor').disabled = !solicita;
  document.getElementById('motivoEnvio').disabled = !solicita;
  document.getElementById('terapeuticaEmpleada').disabled = !solicita;
}

function validarCamposObligatorios() {
  const camposObligatorios = [
    {id: 'nombrePaciente', label: 'Nombre Completo'},
    {id: 'fechaNacimiento', label: 'Fecha de Nacimiento'},
    {id: 'sexoPaciente', label: 'Sexo'},
    {id: 'domicilio', label: 'Domicilio'},
    {id: 'telefono', label: 'Teléfono'},
    {id: 'telEmergencia', label: 'Teléfono de Emergencia'},
    {id: 'fechaConsulta', label: 'Fecha de Consulta'},
    {id: 'horaConsulta', label: 'Hora de Consulta'},
    {id: 'peso', label: 'Peso'},
    {id: 'talla', label: 'Talla'},
    {id: 'temperatura', label: 'Temperatura'},
    {id: 'presion', label: 'Tensión Arterial'},
    {id: 'frecuenciaCardiaca', label: 'Frecuencia Cardíaca'},
    {id: 'frecuenciaRespiratoria', label: 'Frecuencia Respiratoria'},
    {id: 'diagnosticoPrincipal', label: 'Diagnóstico Principal'},
    {id: 'pronostico', label: 'Pronóstico'}
  ];

  let camposFaltantes = [];
  camposObligatorios.forEach(campo => {
    const elemento = document.getElementById(campo.id);
    if (!elemento.value || elemento.value.trim() === '') {
      camposFaltantes.push(campo.label);
    }
  });

  if (camposFaltantes.length > 0) {
    alert('Faltan los siguientes campos obligatorios:\n\n' + camposFaltantes.join('\n'));
    return false;
  }
  return true;
}

function formatearFecha(fecha) {
  return fecha.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getValue(id) {
  const elemento = document.getElementById(id);
  if (!elemento) return '';
  
  if (elemento.type === 'checkbox') {
    return elemento.checked ? 'Sí' : 'No';
  }
  
  return elemento.value || '';
}

function volverPacientes() {
  window.location.href = 'pacienteMedico.html';
}

function generarHeaderPDF(doc, config) {
  let y = config.y;
  
  doc.setFillColor(15, 55, 89);
  doc.rect(config.margenIzq, y, 20, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('DJFA', 22, y + 12, { align: 'center' });

  doc.setFillColor(184, 205, 224);
  doc.roundedRect(70, y, 85, 12, 3, 3, 'F');
  doc.setTextColor(15, 55, 89);
  doc.setFontSize(13);
  doc.text('EXPEDIENTE CLÍNICO', 112.5, y + 8, { align: 'center' });

  doc.setFillColor(240, 240, 240);
  doc.roundedRect(160, y, 38, 12, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  doc.text('No. Expediente:', 179, y + 5, { align: 'center' });
  doc.setFont(undefined, 'bold');
  doc.setFontSize(9);
  doc.text(document.getElementById('numExpediente').textContent, 179, y + 10, { align: 'center' });

  y += 20;

  doc.setFillColor(248, 249, 250);
  doc.rect(config.margenIzq, y, config.anchoUtil, 8, 'F');
  doc.setTextColor(15, 55, 89);
  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  doc.text('Establecimiento: Clínica DJFA System\'s | Dirección: Avenida Siempre Viva #117, Tuxtla Gutiérrez, Chiapas', config.margenIzq + 2, y + 3);
  doc.text(`Tel: 961-117-1231 | Fecha: ${document.getElementById('fechaApertura').textContent} | Hora: ${document.getElementById('horaApertura').textContent}`, config.margenIzq + 2, y + 6);

  return y + 12;
}

function generarDatosPacientePDF(doc, config) {
  let y = agregarSeccionPDF(doc, '1. DATOS GENERALES DEL PACIENTE (NOM 5.2.3)', config.y, config.margenIzq, config.margenDer);
  
  doc.setFontSize(8);
  agregarCampoPDF(doc, 'Nombre:', getValue('nombrePaciente'), config.margenIzq, y, 45);
  agregarCampoPDF(doc, 'Edad:', getValue('edadPaciente'), 110, y, 25);
  agregarCampoPDF(doc, 'Sexo:', getValue('sexoPaciente'), 145, y, 20);
  y += config.lineHeight;

  agregarCampoPDF(doc, 'Domicilio:', getValue('domicilio'), config.margenIzq, y, 100);
  agregarCampoPDF(doc, 'Tel:', getValue('telefono'), 145, y, 30);
  y += config.lineHeight;

  agregarCampoPDF(doc, 'Estado Civil:', getValue('estadoCivil'), config.margenIzq, y, 35);
  agregarCampoPDF(doc, 'Ocupación:', getValue('ocupacion'), 80, y, 40);
  agregarCampoPDF(doc, 'Grupo Étnico:', getValue('grupoEtnico'), 145, y, 30);
  y += config.lineHeight;

  agregarCampoPDF(doc, 'Correo:', getValue('correo'), config.margenIzq, y, 70);
  agregarCampoPDF(doc, 'Tel. Emergencia:', getValue('telEmergencia'), 145, y, 30);
  
  return y + config.lineHeight + 2;
}

function generarHistoriaClinicaPDF(doc, config) {
  let y = agregarSeccionPDF(doc, '2. HISTORIA CLÍNICA (NOM 6.1)', config.y, config.margenIzq, config.margenDer);
  
  y = agregarSubseccionPDF(doc, '2.1 Antecedentes Heredo-Familiares', y, config.margenIzq);
  y = agregarTextoMultilineaPDF(doc, getValue('antecedentesHF'), y, config.margenIzq, config.margenDer);

  y = agregarSubseccionPDF(doc, '2.2 Antecedentes Personales No Patológicos', y, config.margenIzq);
  agregarCampoPDF(doc, 'Tipo Sangre:', getValue('tipoSangre'), config.margenIzq, y, 25);
  agregarCampoPDF(doc, 'Tabaquismo:', getValue('tabaquismo'), 55, y, 20);
  agregarCampoPDF(doc, 'Cigarros/día:', getValue('cigarrosDia'), 90, y, 20);
  agregarCampoPDF(doc, 'Alcoholismo:', getValue('alcoholismo'), 125, y, 25);
  agregarCampoPDF(doc, 'Sustancias:', getValue('sustancias'), 165, y, 20);
  y += config.lineHeight;
  y = agregarTextoMultilineaPDF(doc, getValue('habitosGenerales'), y, config.margenIzq, config.margenDer);

  y = agregarSubseccionPDF(doc, '2.3 Antecedentes Personales Patológicos', y, config.margenIzq);
  agregarCampoPDF(doc, 'Alergias:', getValue('alergias'), config.margenIzq, y, 80);
  agregarCampoPDF(doc, 'Cirugías:', getValue('cirugias'), 110, y, 50);
  y += config.lineHeight;
  y = agregarTextoMultilineaPDF(doc, getValue('enfermedadesCronicas'), y, config.margenIzq, config.margenDer);

  y = agregarSubseccionPDF(doc, '2.4 Interrogatorio por Aparatos y Sistemas (NOM 6.1.1)', y, config.margenIzq);
  y = agregarTextoMultilineaPDF(doc, getValue('interrogatorioSistemas'), y, config.margenIzq, config.margenDer);

  return y;
}

function generarPadecimientoActualPDF(doc, config) {
  let y = verificarNuevaPaginaPDF(doc, config.y, 40);
  y = agregarSeccionPDF(doc, '3. PADECIMIENTO ACTUAL (NOM 6.1.1)', y, config.margenIzq, config.margenDer);
  agregarCampoPDF(doc, 'Fecha Consulta:', getValue('fechaConsulta'), config.margenIzq, y, 35);
  agregarCampoPDF(doc, 'Hora:', getValue('horaConsulta'), 70, y, 20);
  agregarCampoPDF(doc, 'Tipo:', getValue('tipoConsulta'), 105, y, 30);
  y += config.lineHeight;
  y = agregarTextoMultilineaPDF(doc, getValue('padecimientoActual'), y, config.margenIzq, config.margenDer);

  return y;
}

function generarExploracionFisicaPDF(doc, config) {
  let y = verificarNuevaPaginaPDF(doc, config.y, 50);
  y = agregarSeccionPDF(doc, '4. EXPLORACIÓN FÍSICA (NOM 6.1.2)', y, config.margenIzq, config.margenDer);
  
  y = agregarSubseccionPDF(doc, '4.1 Signos Vitales', y, config.margenIzq);
  doc.setFontSize(7);
  agregarCampoPDF(doc, 'Peso:', getValue('peso') + ' kg', config.margenIzq, y, 25);
  agregarCampoPDF(doc, 'Talla:', getValue('talla') + ' cm', 50, y, 25);
  agregarCampoPDF(doc, 'IMC:', getValue('imc'), 80, y, 30);
  agregarCampoPDF(doc, 'Temp:', getValue('temperatura') + '°C', 120, y, 25);
  agregarCampoPDF(doc, 'TA:', getValue('presion'), 155, y, 25);
  y += config.lineHeight;
  agregarCampoPDF(doc, 'FC:', getValue('frecuenciaCardiaca') + ' lpm', config.margenIzq, y, 25);
  agregarCampoPDF(doc, 'FR:', getValue('frecuenciaRespiratoria') + ' rpm', 50, y, 25);
  agregarCampoPDF(doc, 'SpO2:', getValue('saturacion') + '%', 80, y, 25);
  agregarCampoPDF(doc, 'Glucosa:', getValue('glucosa') + ' mg/dL', 120, y, 30);
  y += config.lineHeight + 1;

  doc.setFontSize(8);
  y = agregarSubseccionPDF(doc, '4.2 Exploración Física Completa', y, config.margenIzq);
  
  // Exploraciones específicas
  const exploraciones = [
    {titulo: 'Habitus Exterior', id: 'habitusExterior'},
    {titulo: 'Cabeza y Cuello', id: 'exploracionCabeza'},
    {titulo: 'Tórax', id: 'exploracionTorax'},
    {titulo: 'Abdomen', id: 'exploracionAbdomen'},
    {titulo: 'Extremidades', id: 'exploracionMiembros'}
  ];

  exploraciones.forEach(exp => {
    if (getValue(exp.id)) {
      doc.setFont(undefined, 'bold');
      doc.text(exp.titulo + ':', config.margenIzq, y);
      doc.setFont(undefined, 'normal');
      y += 4;
      y = agregarTextoMultilineaPDF(doc, getValue(exp.id), y, config.margenIzq, config.margenDer);
    }
  });

  return y;
}

function generarResultadosEstudiosPDF(doc, config) {
  let y = verificarNuevaPaginaPDF(doc, config.y, 30);
  y = agregarSeccionPDF(doc, '5. RESULTADOS DE ESTUDIOS (NOM 6.1.3)', y, config.margenIzq, config.margenDer);
  y = agregarTextoMultilineaPDF(doc, getValue('resultadosEstudios'), y, config.margenIzq, config.margenDer);

  return y;
}

function generarDiagnosticosPDF(doc, config) {
  let y = verificarNuevaPaginaPDF(doc, config.y, 25);
  y = agregarSeccionPDF(doc, '6. DIAGNÓSTICO(S) (NOM 6.1.4)', y, config.margenIzq, config.margenDer);
  agregarCampoPDF(doc, 'Principal:', getValue('diagnosticoPrincipal'), config.margenIzq, y, 100);
  y += config.lineHeight;
  if (getValue('diagnosticosSecundarios')) {
    doc.setFont(undefined, 'bold');
    doc.text('Secundarios:', config.margenIzq, y);
    doc.setFont(undefined, 'normal');
    y += 4;
    y = agregarTextoMultilineaPDF(doc, getValue('diagnosticosSecundarios'), y, config.margenIzq, config.margenDer);
  }

  return y;
}

function generarPronosticoPDF(doc, config) {
  let y = verificarNuevaPaginaPDF(doc, config.y, 20);
  y = agregarSeccionPDF(doc, '7. PRONÓSTICO (NOM 6.1.5)', y, config.margenIzq, config.margenDer);
  agregarCampoPDF(doc, 'Pronóstico:', getValue('pronostico'), config.margenIzq, y, 50);
  if (getValue('observacionesPronostico')) {
    agregarCampoPDF(doc, 'Obs:', getValue('observacionesPronostico'), 90, y, 70);
  }

  return y + config.lineHeight + 2;
}

function generarPlanEstudiosPDF(doc, config) {
  let y = verificarNuevaPaginaPDF(doc, config.y, 25);
  y = agregarSeccionPDF(doc, '8. PLAN DE ESTUDIOS', y, config.margenIzq, config.margenDer);
  y = agregarTextoMultilineaPDF(doc, getValue('planEstudios'), y, config.margenIzq, config.margenDer);

  return y;
}

function generarTratamientoPDF(doc, config) {
  let y = verificarNuevaPaginaPDF(doc, config.y, 40);
  y = agregarSeccionPDF(doc, '9. INDICACIÓN TERAPÉUTICA (NOM 6.1.6)', y, config.margenIzq, config.margenDer);
  
  // Tabla de medicamentos
  const tabla = document.getElementById('tablaMedicamentos');
  const filas = tabla.getElementsByTagName('tr');
  
  if (filas.length > 0) {
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.text('Medicamento', config.margenIzq, y);
    doc.text('Dosis', config.margenIzq + 50, y);
    doc.text('Vía', config.margenIzq + 75, y);
    doc.text('Frecuencia', config.margenIzq + 95, y);
    doc.text('Duración', config.margenIzq + 125, y);
    y += 4;
    
    doc.setFont(undefined, 'normal');
    for (let i = 0; i < filas.length; i++) {
      const inputs = filas[i].getElementsByTagName('input');
      const selects = filas[i].getElementsByTagName('select');
      
      if (inputs.length > 0 && inputs[0].value) {
        y = verificarNuevaPaginaPDF(doc, y, 10);
        doc.text(inputs[0].value, config.margenIzq, y);
        doc.text(inputs[1].value + ' ' + inputs[2].value, config.margenIzq + 50, y);
        doc.text(selects[0].value, config.margenIzq + 75, y);
        doc.text(inputs[3].value, config.margenIzq + 95, y);
        doc.text(inputs[4].value, config.margenIzq + 125, y);
        y += 4;
      }
    }
    y += 2;
  }

  doc.setFontSize(8);
  if (getValue('indicacionesGenerales')) {
    doc.setFont(undefined, 'bold');
    doc.text('Indicaciones Generales:', config.margenIzq, y);
    doc.setFont(undefined, 'normal');
    y += 4;
    y = agregarTextoMultilineaPDF(doc, getValue('indicacionesGenerales'), y, config.margenIzq, config.margenDer);
  }

  return y;
}

function generarInterconsultaPDF(doc, config) {
  if (getValue('solicitaInterconsulta') === 'Sí') {
    let y = verificarNuevaPaginaPDF(doc, config.y, 25);
    y = agregarSeccionPDF(doc, '10. INTERCONSULTA (NOM 6.3)', y, config.margenIzq, config.margenDer);
    agregarCampoPDF(doc, 'Especialidad:', getValue('especialidadInterconsulta'), config.margenIzq, y, 70);
    y += config.lineHeight;
    y = agregarTextoMultilineaPDF(doc, getValue('motivoInterconsulta'), y, config.margenIzq, config.margenDer);
    
    return y;
  }
  return config.y;
}

function generarReferenciaPDF(doc, config) {
  if (getValue('solicitaReferencia') === 'Sí') {
    let y = verificarNuevaPaginaPDF(doc, config.y, 25);
    y = agregarSeccionPDF(doc, '11. REFERENCIA/TRASLADO (NOM 6.4)', y, config.margenIzq, config.margenDer);
    agregarCampoPDF(doc, 'Establecimiento:', getValue('establecimientoReceptor'), config.margenIzq, y, 80);
    y += config.lineHeight;
    agregarCampoPDF(doc, 'Motivo:', getValue('motivoEnvio'), config.margenIzq, y, 100);
    y += config.lineHeight;
    
    return y;
  }
  return config.y;
}

function generarFirmasPDF(doc, config) {
  let y = verificarNuevaPaginaPDF(doc, config.y, 35);
  y += 5;
  
  // Líneas de firma
  doc.setDrawColor(15, 55, 89);
  doc.line(config.margenIzq, y, config.margenIzq + 70, y);
  doc.line(config.margenIzq + 90, y, config.margenIzq + 160, y);
  
  y += 4;
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('NOMBRE Y FIRMA DEL MÉDICO', config.margenIzq + 35, y, { align: 'center' });
  doc.text('NOMBRE Y FIRMA DEL PACIENTE', config.margenIzq + 125, y, { align: 'center' });
  
  y += 3;
  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  doc.text('Cédula Profesional: _________________', config.margenIzq + 35, y, { align: 'center' });
  doc.text('(o representante legal)', config.margenIzq + 125, y, { align: 'center' });
  
  y += 3;
  doc.text(`Fecha: ${document.getElementById('fechaFirma').textContent}`, config.margenIzq + 35, y, { align: 'center' });
  doc.text(`Fecha: ${document.getElementById('fechaFirmaPaciente').textContent}`, config.margenIzq + 125, y, { align: 'center' });

  // Footer
  const footerY = 280;
  doc.setFillColor(184, 205, 224);
  doc.roundedRect(10, footerY, 190, 10, 2, 2, 'F');
  
  doc.setTextColor(15, 55, 89);
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.text('Clínica DJFA System\'s | Av. Siempre Viva #117, Tuxtla Gutiérrez | Tel: 961-117-1231', 105, footerY + 4, { align: 'center' });
  doc.setFont(undefined, 'normal');
  doc.text('NOM-004-SSA3-2012: Del expediente clínico. Conservación mínima: 5 años', 105, footerY + 7.5, { align: 'center' });
}

// ========== FUNCIONES AUXILIARES PARA PDF ==========
function agregarSeccionPDF(doc, titulo, y, margenIzq, margenDer) {
  y = verificarNuevaPaginaPDF(doc, y, 15);
  
  doc.setFillColor(15, 55, 89);
  doc.rect(margenIzq, y, margenDer - margenIzq, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text(titulo, margenIzq + 2, y + 4);
  doc.setTextColor(15, 55, 89);
  
  return y + 9;
}

function agregarSubseccionPDF(doc, titulo, y, margenIzq) {
  y = verificarNuevaPaginaPDF(doc, y, 12);
  
  doc.setFillColor(107, 129, 153);
  doc.rect(margenIzq, y, 186, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text(titulo, margenIzq + 2, y + 3.5);
  doc.setTextColor(15, 55, 89);
  
  return y + 7;
}

function agregarCampoPDF(doc, etiqueta, valor, x, y, maxWidth) {
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  const anchoEtiqueta = doc.getTextWidth(etiqueta);
  doc.text(etiqueta, x, y);
  
  doc.setFont(undefined, 'normal');
  const textoValor = valor || 'N/A';
  const lineas = doc.splitTextToSize(textoValor, maxWidth - anchoEtiqueta - 2);
  doc.text(lineas[0], x + anchoEtiqueta + 1, y);
}

function agregarTextoMultilineaPDF(doc, texto, y, margenIzq, margenDer) {
  if (!texto || texto.trim() === '') {
    doc.setFont(undefined, 'italic');
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text('(Sin información registrada)', margenIzq, y);
    doc.setTextColor(15, 55, 89);
    doc.setFont(undefined, 'normal');
    return y + 6;
  }

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  const lineas = doc.splitTextToSize(texto, margenDer - margenIzq);
  
  lineas.forEach((linea) => {
    y = verificarNuevaPaginaPDF(doc, y, 10);
    doc.text(linea, margenIzq, y);
    y += 4.5;
  });
  
  return y + 2;
}

function verificarNuevaPaginaPDF(doc, y, espacioNecesario) {
  if (y + espacioNecesario > 275) {
    doc.addPage();
    // Dibujar marco en la nueva página
    doc.setDrawColor(15, 55, 89);
    doc.setLineWidth(0.5);
    doc.rect(8, 8, 194, 279);
    return 15;
  }
  return y;
}