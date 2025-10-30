const mongoose = require('mongoose');

// ========== SCHEMA DE PACIENTES ==========
const PatientSchema = new mongoose.Schema({
    correo: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    apellidos: {
        type: String,
        required: true,
        trim: true
    },
    fechaNacimiento: {
        type: Date,
        default: null
    },
    edad: {
        type: Number,
        default: null
    },
    sexo: {
        type: String,
        enum: ['Masculino', 'Femenino', null],
        default: null
    },
    tipoSanguineo: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null, ''],
        default: null
    },
    alergias: {
        type: String,
        default: 'Ninguna'
    },
    padecimientos: {
        type: String,
        default: 'Sin padecimientos'
    },
    telefono: {
        type: String,
        default: ''
    },
    telefonoEmergencia: {
        type: String,
        default: ''
    },
    domicilio: {
        type: String,
        default: ''
    },
    historialMedico: [{
        fecha: Date,
        tipoCita: String,
        descripcion: String,
        medicamentosPrevios: [String]
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'patients'
});

PatientSchema.index({ correo: 1 });
PatientSchema.index({ nombre: 1, apellidos: 1 });

// ========== SCHEMA DE CITAS ==========
const AppointmentSchema = new mongoose.Schema({
    pacienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    pacienteNombre: {
        type: String,
        default: 'Paciente'
    },
    medicoId: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        required: true
    },
    hora: {
        type: String,
        required: true
    },
    tipoCita: {
        type: String,
        default: '2'
    },
    descripcion: {
        type: String,
        default: ''
    },
    sintomas: {
        type: String,
        default: ''
    },
    diagnostico: {
        type: String,
        default: ''
    },
    estado: {
        type: String,
        enum: ['pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio'],
        default: 'pendiente'
    },
    recordatorioEnviado: {
        type: Boolean,
        default: false
    },
    confirmada: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'appointments'
});

AppointmentSchema.index({ pacienteId: 1 });
AppointmentSchema.index({ medicoId: 1 });
AppointmentSchema.index({ fecha: 1 });
AppointmentSchema.index({ estado: 1 });

// ========== SCHEMA DE EXPEDIENTES MÉDICOS ==========
const ExpedienteSchema = new mongoose.Schema({
    // ===== RELACIÓN CON PACIENTE =====
    pacienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    numeroExpediente: {
        type: String,
        required: true,
        unique: true
    },
    
    // ===== 2. HISTORIA CLÍNICA (NOM 6.1) =====
    historiaClinica: {
        // 2.1 Antecedentes Heredo-Familiares
        antecedentesHF: {
            type: String,
            default: ''
        },
        
        // 2.2 Antecedentes Personales No Patológicos
        tipoSanguineo: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null, ''],
            default: null
        },
        tabaquismo: {
            type: String,
            enum: ['No', 'Sí', 'Ex-fumador'],
            default: 'No'
        },
        cigarrosDia: { type: Number, default: null },
        anosFumando: { type: Number, default: null },
        alcoholismo: {
            type: String,
            enum: ['No', 'Ocasional', 'Frecuente', 'Crónico'],
            default: 'No'
        },
        sustancias: {
            type: String,
            enum: ['No', 'Sí'],
            default: 'No'
        },
        especificarSustancia: { type: String, default: '' },
        habitosGenerales: { type: String, default: '' },
        
        // 2.3 Antecedentes Personales Patológicos
        alergias: { type: String, default: 'Ninguna' },
        cirugias: { type: String, default: '' },
        enfermedadesCronicas: {
            diabetes: { type: Boolean, default: false },
            hipertension: { type: Boolean, default: false },
            asma: { type: Boolean, default: false },
            epilepsia: { type: Boolean, default: false },
            cancer: { type: Boolean, default: false },
            tuberculosis: { type: Boolean, default: false },
            vih: { type: Boolean, default: false },
            otras: { type: String, default: '' }
        },
        
        // 2.4 Interrogatorio por Aparatos y Sistemas
        interrogatorioSistemas: { type: String, default: '' }
    },
    
    // ===== 5. RESULTADOS DE ESTUDIOS (NOM 6.1.3) =====
    resultadosEstudios: {
        type: String,
        default: ''
    },
    
    // ===== CONSULTAS DEL EXPEDIENTE =====
    consultas: [{
        // 3. Padecimiento Actual
        fechaConsulta: { type: Date, required: true },
        horaConsulta: { type: String, default: '' },
        tipoConsulta: {
            type: String,
            enum: ['Primera vez', 'Subsecuente', 'Urgencia'],
            default: 'Primera vez'
        },
        padecimientoActual: { type: String, default: '' },
        
        // 4. Exploración Física - Signos Vitales
        signosVitales: {
            peso: { type: Number, default: null },
            talla: { type: Number, default: null },
            imc: { type: String, default: '' },
            temperatura: { type: Number, default: null },
            presion: { type: String, default: '' },
            frecuenciaCardiaca: { type: Number, default: null },
            frecuenciaRespiratoria: { type: Number, default: null },
            saturacion: { type: Number, default: null },
            glucosa: { type: Number, default: null }
        },
        
        // 4.2 Exploración Física Completa
        exploracionFisica: {
            habitusExterior: { type: String, default: '' },
            cabezaCuello: { type: String, default: '' },
            torax: { type: String, default: '' },
            abdomen: { type: String, default: '' },
            miembros: { type: String, default: '' },
            genitales: { type: String, default: '' },
            neurologico: { type: String, default: '' }
        },
        
        // 6. Diagnóstico(s)
        diagnosticoPrincipal: { type: String, default: '' },
        diagnosticosSecundarios: { type: String, default: '' },
        
        // 7. Pronóstico
        pronostico: {
            tipo: {
                type: String,
                enum: ['Bueno', 'Favorable', 'Reservado', 'Reservado a evolución', 'Grave', 'Malo'],
                default: 'Favorable'
            },
            observaciones: { type: String, default: '' }
        },
        
        // 8. Plan de Estudios
        planEstudios: { type: String, default: '' },
        
        // 9. Indicación Terapéutica
        medicamentos: [{
            nombre: String,
            presentacion: String,
            dosis: String,
            via: String,
            frecuencia: String,
            duracion: String
        }],
        indicacionesGenerales: { type: String, default: '' },
        
        // 10. Interconsulta
        solicitaInterconsulta: { type: Boolean, default: false },
        especialidadInterconsulta: { type: String, default: '' },
        motivoInterconsulta: { type: String, default: '' },
        
        // 11. Referencia/Traslado
        solicitaReferencia: { type: Boolean, default: false },
        establecimientoReceptor: { type: String, default: '' },
        motivoEnvio: { type: String, default: '' },
        terapeuticaEmpleada: { type: String, default: '' },
        
        // 12. Observaciones Adicionales
        observacionesAdicionales: { type: String, default: '' },
        
        // 13. Consentimiento Informado
        requiereConsentimiento: { type: Boolean, default: false },
        tipoProcedimiento: { type: String, default: '' },
        
        // Metadata de la consulta
        creadoPor: { type: String, default: '' }, // ID del médico
        fechaCreacion: { type: Date, default: Date.now }
    }],
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'expedientes'
});

// Índices para Expedientes
ExpedienteSchema.index({ pacienteId: 1 });
ExpedienteSchema.index({ numeroExpediente: 1 }, { unique: true });
ExpedienteSchema.index({ 'consultas.fechaConsulta': -1 });

// Exportar modelos
module.exports = {
    Patient: mongoose.model('Patient', PatientSchema),
    Appointment: mongoose.model('Appointment', AppointmentSchema),
    Expediente: mongoose.model('Expediente', ExpedienteSchema)
};