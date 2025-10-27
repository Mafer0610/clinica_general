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
        tipo: String,
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
    tipo: {
        type: String,
        enum: [
            'Consulta General',
            'Consulta de Seguimiento',
            'Consulta médica',
            'Revision General',
            'Consulta de Control',
            'Consulta de Emergencia',
            'Primera Consulta'
        ],
        default: 'Consulta General'
    },
    tipoCita: {
        type: String,
        default: null
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
const MedicalRecordSchema = new mongoose.Schema({
    pacienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    citaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        default: null
    },
    fecha: {
        type: Date,
        required: true,
        default: Date.now
    },
    diagnostico: {
        type: String,
        required: true
    },
    tratamiento: {
        type: String,
        default: ''
    },
    signos_vitales: {
        peso: { type: Number, default: null },
        estatura: { type: Number, default: null },
        imc: { type: Number, default: null },
        fc: { type: Number, default: null },  // Frecuencia cardíaca
        fr: { type: Number, default: null },  // Frecuencia respiratoria
        ta: { type: String, default: '' },    // Tensión arterial
        temp: { type: Number, default: null }, // Temperatura
        saturacion: { type: Number, default: null } // SpO2
    },
    prescripcion: {
        type: String,
        default: ''
    },
    recomendaciones: {
        type: String,
        default: ''
    },
    estudios_realizados: [{
        tipo: String,
        resultado: String,
        fecha: Date
    }],
    antecedentes: {
        heredofamiliares: String,
        personales_no_patologicos: String,
        personales_patologicos: String,
        interrogatorio_sistemas: String
    },
    exploracion_fisica: {
        habitus_exterior: String,
        cabeza_cuello: String,
        torax: String,
        abdomen: String,
        extremidades: String,
        genitales: String,
        neurologico: String
    },
    pronostico: {
        tipo: {
            type: String,
            enum: ['Bueno', 'Favorable', 'Reservado', 'Reservado a evolución', 'Grave', 'Malo'],
            default: 'Favorable'
        },
        observaciones: String
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
    collection: 'medical_records'
});

// Índices
MedicalRecordSchema.index({ pacienteId: 1 });
MedicalRecordSchema.index({ citaId: 1 });
MedicalRecordSchema.index({ fecha: -1 });

// Exportar modelos
module.exports = {
    Patient: mongoose.model('Patient', PatientSchema),
    Appointment: mongoose.model('Appointment', AppointmentSchema),
    MedicalRecord: mongoose.model('MedicalRecord', MedicalRecordSchema)
};