// src/adapters/inbound/validators/patientValidators.js

const { body, param, query } = require('express-validator');

/**
 * Validación para crear paciente
 */
const createPatientValidation = [
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
        .notEmpty().withMessage('Fecha de nacimiento es requerida')
        .isISO8601().withMessage('Fecha de nacimiento inválida')
        .custom((value) => {
            const date = new Date(value);
            const now = new Date();
            const age = now.getFullYear() - date.getFullYear();
            if (age < 0 || age > 120) {
                throw new Error('Fecha de nacimiento inválida (edad debe ser entre 0 y 120 años)');
            }
            return true;
        }),
    
    body('sexo')
        .trim()
        .notEmpty().withMessage('Sexo es requerido')
        .isIn(['M', 'F', 'Masculino', 'Femenino']).withMessage('Sexo debe ser M, F, Masculino o Femenino')
        .escape(),
    
    body('telefono')
        .trim()
        .notEmpty().withMessage('Teléfono es requerido')
        .isLength({ min: 10, max: 15 }).withMessage('Teléfono debe tener entre 10 y 15 dígitos')
        .matches(/^\d+$/).withMessage('Teléfono solo puede contener números'),
    
    body('telefonoEmergencia')
        .trim()
        .notEmpty().withMessage('Teléfono de emergencia es requerido')
        .isLength({ min: 10, max: 15 }).withMessage('Teléfono de emergencia debe tener entre 10 y 15 dígitos')
        .matches(/^\d+$/).withMessage('Teléfono de emergencia solo puede contener números'),
    
    body('domicilio')
        .trim()
        .notEmpty().withMessage('Domicilio es requerido')
        .isLength({ min: 10, max: 300 }).withMessage('Domicilio debe tener entre 10 y 300 caracteres')
        .escape(),
    
    body('correo')
        .optional({ checkFalsy: true })
        .trim()
        .isEmail().withMessage('Correo electrónico inválido')
        .normalizeEmail()
        .isLength({ max: 100 }).withMessage('Correo muy largo'),
    
    body('alergias')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Alergias muy largo (máx 500 caracteres)')
        .escape(),
    
    body('padecimientos')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Padecimientos muy largo (máx 500 caracteres)')
        .escape(),
    
    body('tipoSanguineo')
        .optional({ checkFalsy: true })
        .trim()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Tipo sanguíneo inválido')
];

/**
 * Validación para actualizar paciente
 */
const updatePatientValidation = [
    param('id')
        .trim()
        .notEmpty().withMessage('ID de paciente requerido')
        .isMongoId().withMessage('ID de paciente inválido'),
    
    body('nombre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Nombre solo puede contener letras y espacios')
        .escape(),
    
    body('apellidos')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Apellidos debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Apellidos solo puede contener letras y espacios')
        .escape(),
    
    body('fechaNacimiento')
        .optional()
        .isISO8601().withMessage('Fecha de nacimiento inválida')
        .custom((value) => {
            const date = new Date(value);
            const now = new Date();
            const age = now.getFullYear() - date.getFullYear();
            if (age < 0 || age > 120) {
                throw new Error('Fecha de nacimiento inválida');
            }
            return true;
        }),
    
    body('sexo')
        .optional()
        .trim()
        .isIn(['M', 'F', 'Masculino', 'Femenino']).withMessage('Sexo inválido')
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
        .isLength({ min: 10, max: 300 }).withMessage('Domicilio debe tener entre 10 y 300 caracteres')
        .escape(),
    
    body('correo')
        .optional({ checkFalsy: true })
        .trim()
        .isEmail().withMessage('Correo electrónico inválido')
        .normalizeEmail(),
    
    body('alergias')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Alergias muy largo')
        .escape(),
    
    body('padecimientos')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Padecimientos muy largo')
        .escape(),
    
    body('tipoSanguineo')
        .optional({ checkFalsy: true })
        .trim()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Tipo sanguíneo inválido')
];

/**
 * Validación para ID de paciente
 */
const patientIdValidation = [
    param('id')
        .trim()
        .notEmpty().withMessage('ID de paciente requerido')
        .isMongoId().withMessage('ID de paciente inválido')
];

/**
 * Validación para búsqueda de pacientes
 */
const searchPatientValidation = [
    param('term')
        .trim()
        .notEmpty().withMessage('Término de búsqueda requerido')
        .isLength({ min: 2, max: 100 }).withMessage('Término de búsqueda debe tener entre 2 y 100 caracteres')
        .escape()
];

/**
 * Validación para agregar entrada al historial médico
 */
const addHistoryValidation = [
    param('id')
        .trim()
        .notEmpty().withMessage('ID de paciente requerido')
        .isMongoId().withMessage('ID de paciente inválido'),
    
    body('fecha')
        .optional()
        .isISO8601().withMessage('Fecha inválida'),
    
    body('tipoCita')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Tipo de cita muy largo')
        .escape(),
    
    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Descripción muy larga (máx 2000 caracteres)')
        .escape(),
    
    body('medicamentosPrevios')
        .optional()
        .isArray().withMessage('Medicamentos previos debe ser un array')
];

module.exports = {
    createPatientValidation,
    updatePatientValidation,
    patientIdValidation,
    searchPatientValidation,
    addHistoryValidation
};