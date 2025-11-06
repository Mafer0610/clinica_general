// src/adapters/inbound/validators/appointmentValidators.js

const { body, param, query } = require('express-validator');

/**
 * Validación para crear cita
 */
const createAppointmentValidation = [
    body('pacienteId')
        .trim()
        .notEmpty().withMessage('ID de paciente es requerido')
        .isMongoId().withMessage('ID de paciente inválido'),
    
    body('pacienteNombre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 }).withMessage('Nombre de paciente debe tener entre 2 y 200 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Nombre solo puede contener letras y espacios')
        .escape(),
    
    body('medicoId')
        .trim()
        .notEmpty().withMessage('ID de médico es requerido')
        .isMongoId().withMessage('ID de médico inválido'),
    
    body('fecha')
        .notEmpty().withMessage('Fecha es requerida')
        .custom((value) => {
            // Acepta formatos ISO8601 o YYYY-MM-DD
            const isoDate = new Date(value);
            if (isNaN(isoDate.getTime())) {
                throw new Error('Fecha inválida');
            }
            
            // No permitir fechas muy antiguas (más de 1 año atrás)
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            
            if (isoDate < oneYearAgo) {
                throw new Error('La fecha no puede ser mayor a 1 año en el pasado');
            }
            
            // No permitir fechas muy futuras (más de 1 año adelante)
            const oneYearAhead = new Date();
            oneYearAhead.setFullYear(oneYearAhead.getFullYear() + 1);
            
            if (isoDate > oneYearAhead) {
                throw new Error('La fecha no puede ser mayor a 1 año en el futuro');
            }
            
            return true;
        }),
    
    body('hora')
        .trim()
        .notEmpty().withMessage('Hora es requerida')
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora inválida (formato: HH:MM)'),
    
    body('tipoCita')
        .trim()
        .notEmpty().withMessage('Tipo de cita es requerido')
        .isLength({ min: 3, max: 100 }).withMessage('Tipo de cita debe tener entre 3 y 100 caracteres')
        .escape(),
    
    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Descripción muy larga (máx 1000 caracteres)')
        .escape(),
    
    body('sintomas')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Síntomas muy largo (máx 1000 caracteres)')
        .escape()
];

/**
 * Validación para actualizar cita
 */
const updateAppointmentValidation = [
    param('id')
        .trim()
        .notEmpty().withMessage('ID de cita requerido')
        .isMongoId().withMessage('ID de cita inválido'),
    
    body('pacienteId')
        .optional()
        .trim()
        .isMongoId().withMessage('ID de paciente inválido'),
    
    body('pacienteNombre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 }).withMessage('Nombre de paciente inválido')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Nombre solo puede contener letras')
        .escape(),
    
    body('medicoId')
        .optional()
        .trim()
        .isMongoId().withMessage('ID de médico inválido'),
    
    body('fecha')
        .optional()
        .custom((value) => {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                throw new Error('Fecha inválida');
            }
            return true;
        }),
    
    body('hora')
        .optional()
        .trim()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora inválida'),
    
    body('tipoCita')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('Tipo de cita inválido')
        .escape(),
    
    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Descripción muy larga')
        .escape(),
    
    body('sintomas')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Síntomas muy largo')
        .escape(),
    
    body('estado')
        .optional()
        .trim()
        .isIn(['pendiente', 'confirmada', 'cancelada', 'completada'])
        .withMessage('Estado inválido'),
    
    body('recordatorioEnviado')
        .optional()
        .isBoolean().withMessage('recordatorioEnviado debe ser boolean'),
    
    body('confirmada')
        .optional()
        .isBoolean().withMessage('confirmada debe ser boolean')
];

/**
 * Validación para ID de cita
 */
const appointmentIdValidation = [
    param('id')
        .trim()
        .notEmpty().withMessage('ID de cita requerido')
        .isMongoId().withMessage('ID de cita inválido')
];

/**
 * Validación para rango de fechas
 */
const dateRangeValidation = [
    query('startDate')
        .notEmpty().withMessage('Fecha de inicio es requerida')
        .isISO8601().withMessage('Fecha de inicio inválida'),
    
    query('endDate')
        .notEmpty().withMessage('Fecha de fin es requerida')
        .isISO8601().withMessage('Fecha de fin inválida')
        .custom((endDate, { req }) => {
            const start = new Date(req.query.startDate);
            const end = new Date(endDate);
            
            if (end < start) {
                throw new Error('Fecha de fin debe ser posterior a fecha de inicio');
            }
            
            // Opcional: limitar el rango máximo (ej: 1 año)
            const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 año en ms
            if ((end - start) > maxRange) {
                throw new Error('El rango de fechas no puede ser mayor a 1 año');
            }
            
            return true;
        })
];

/**
 * Validación para ID de médico
 */
const medicoIdValidation = [
    param('medicoId')
        .trim()
        .notEmpty().withMessage('ID de médico requerido')
        .isMongoId().withMessage('ID de médico inválido')
];

/**
 * Validación para ID de paciente en rutas
 */
const patientIdValidation = [
    param('patientId')
        .trim()
        .notEmpty().withMessage('ID de paciente requerido')
        .isMongoId().withMessage('ID de paciente inválido')
];

module.exports = {
    createAppointmentValidation,
    updateAppointmentValidation,
    appointmentIdValidation,
    dateRangeValidation,
    medicoIdValidation,
    patientIdValidation
};