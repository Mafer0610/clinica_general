// src/adapters/inbound/validators/expedienteValidators.js

const { body, param } = require('express-validator');

/**
 * Validación para ID de expediente
 */
const expedienteIdValidation = [
    param('expedienteId')
        .trim()
        .notEmpty().withMessage('ID de expediente requerido')
        .isMongoId().withMessage('ID de expediente inválido')
];

/**
 * Validación para ID de paciente
 */
const pacienteIdValidation = [
    param('pacienteId')
        .trim()
        .notEmpty().withMessage('ID de paciente requerido')
        .isMongoId().withMessage('ID de paciente inválido')
];

/**
 * Validación para actualizar historia clínica
 */
const updateHistoriaClinicaValidation = [
    param('expedienteId')
        .trim()
        .notEmpty().withMessage('ID de expediente requerido')
        .isMongoId().withMessage('ID de expediente inválido'),
    
    body('historiaClinica')
        .notEmpty().withMessage('Historia clínica es requerida')
        .isObject().withMessage('Historia clínica debe ser un objeto'),
    
    body('historiaClinica.antecedentesPersonales')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Antecedentes personales muy largos')
        .escape(),
    
    body('historiaClinica.antecedentesFamiliares')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Antecedentes familiares muy largos')
        .escape(),
    
    body('historiaClinica.alergias')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Alergias muy largas')
        .escape(),
    
    body('historiaClinica.padecimientosActuales')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Padecimientos actuales muy largos')
        .escape()
];

/**
 * Validación para actualizar resultados de estudios
 */
const updateResultadosEstudiosValidation = [
    param('expedienteId')
        .trim()
        .notEmpty().withMessage('ID de expediente requerido')
        .isMongoId().withMessage('ID de expediente inválido'),
    
    body('resultadosEstudios')
        .notEmpty().withMessage('Resultados de estudios son requeridos')
        .isObject().withMessage('Resultados de estudios debe ser un objeto')
];

/**
 * Validación para agregar consulta
 */
const addConsultaValidation = [
    param('expedienteId')
        .trim()
        .notEmpty().withMessage('ID de expediente requerido')
        .isMongoId().withMessage('ID de expediente inválido'),
    
    body('fechaConsulta')
        .notEmpty().withMessage('Fecha de consulta es requerida')
        .custom((value) => {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                throw new Error('Formato de fecha inválido');
            }
            
            // No permitir fechas futuras (más de 1 día adelante)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(23, 59, 59, 999);
            
            if (date > tomorrow) {
                throw new Error('La fecha de consulta no puede ser futura');
            }
            
            return true;
        }),
    
    body('motivoConsulta')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Motivo de consulta muy largo')
        .escape(),
    
    body('diagnostico')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Diagnóstico muy largo')
        .escape(),
    
    body('tratamiento')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Tratamiento muy largo')
        .escape(),
    
    body('observaciones')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Observaciones muy largas')
        .escape(),
    
    body('signosVitales')
        .optional()
        .isObject().withMessage('Signos vitales debe ser un objeto'),
    
    body('signosVitales.presionArterial')
        .optional()
        .trim()
        .matches(/^\d{2,3}\/\d{2,3}$/).withMessage('Presión arterial inválida (formato: 120/80)'),
    
    body('signosVitales.frecuenciaCardiaca')
        .optional()
        .isInt({ min: 30, max: 250 }).withMessage('Frecuencia cardíaca inválida (30-250 bpm)'),
    
    body('signosVitales.temperatura')
        .optional()
        .isFloat({ min: 30, max: 45 }).withMessage('Temperatura inválida (30-45°C)'),
    
    body('signosVitales.peso')
        .optional()
        .isFloat({ min: 1, max: 500 }).withMessage('Peso inválido (1-500 kg)'),
    
    body('signosVitales.altura')
        .optional()
        .isFloat({ min: 20, max: 300 }).withMessage('Altura inválida (20-300 cm)'),
    
    body('medicamentosRecetados')
        .optional()
        .isArray().withMessage('Medicamentos recetados debe ser un array'),
    
    body('medicamentosRecetados.*.nombre')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Nombre de medicamento muy largo')
        .escape(),
    
    body('medicamentosRecetados.*.dosis')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Dosis muy larga')
        .escape(),
    
    body('medicamentosRecetados.*.frecuencia')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Frecuencia muy larga')
        .escape(),
    
    body('creadoPor')
        .optional()
        .trim()
        .isMongoId().withMessage('ID de médico inválido')
];

/**
 * Validación para perfil de paciente por email
 */
const patientProfileEmailValidation = [
    param('email')
        .trim()
        .notEmpty().withMessage('Email es requerido')
        .isEmail().withMessage('Email debe ser válido')
        .normalizeEmail()
];

/**
 * Validación para upsert de perfil de paciente
 */
const upsertPatientProfileValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email es requerido')
        .isEmail().withMessage('Email debe ser válido')
        .normalizeEmail()
        .isLength({ max: 100 }).withMessage('Email muy largo'),
    
    body('nombre')
        .trim()
        .notEmpty().withMessage('Nombre es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Nombre solo puede contener letras y espacios')
        .escape(),
    
    body('apellidos')
        .trim()
        .notEmpty().withMessage('Apellidos son requeridos')
        .isLength({ min: 2, max: 100 }).withMessage('Apellidos debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Apellidos solo puede contener letras y espacios')
        .escape(),
    
    body('fechaNacimiento')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('Fecha de nacimiento inválida')
        .custom((value) => {
            if (!value) return true;
            const date = new Date(value);
            const now = new Date();
            const age = now.getFullYear() - date.getFullYear();
            if (age < 0 || age > 120) {
                throw new Error('Fecha de nacimiento inválida (edad debe ser entre 0 y 120 años)');
            }
            return true;
        }),
    
    body('sexo')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['M', 'F', 'Masculino', 'Femenino']).withMessage('Sexo inválido')
    .customSanitizer(value => {
        if (value === 'M') return 'Masculino';
        if (value === 'F') return 'Femenino';
        return value;
    })
    .escape(),
    
    body('telefono')
        .optional()
        .trim()
        .isLength({ min: 10, max: 15 }).withMessage('Teléfono debe tener entre 10 y 15 dígitos')
        .matches(/^\d+$/).withMessage('Teléfono solo puede contener números'),
    
    body('telefonoEmergencia')
        .optional()
        .trim()
        .isLength({ min: 10, max: 15 }).withMessage('Teléfono de emergencia debe tener entre 10 y 15 dígitos')
        .matches(/^\d+$/).withMessage('Teléfono de emergencia solo puede contener números'),
    
    body('domicilio')
        .optional()
        .trim()
        .isLength({ max: 300 }).withMessage('Domicilio muy largo')
        .escape(),
    
    body('alergias')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Alergias muy largas')
        .escape(),
    
    body('padecimientos')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Padecimientos muy largos')
        .escape(),
    
    body('tipoSanguineo')
        .optional({ checkFalsy: true })
        .trim()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Tipo sanguíneo inválido')
];

/**
 * Validación para confirmar/cancelar cita
 */
const appointmentActionValidation = [
    param('appointmentId')
        .trim()
        .notEmpty().withMessage('ID de cita requerido')
        .isMongoId().withMessage('ID de cita inválido')
];

module.exports = {
    expedienteIdValidation,
    pacienteIdValidation,
    updateHistoriaClinicaValidation,
    updateResultadosEstudiosValidation,
    addConsultaValidation,
    patientProfileEmailValidation,
    upsertPatientProfileValidation,
    appointmentActionValidation
};