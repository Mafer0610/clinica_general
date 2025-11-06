// src/adapters/inbound/middleware/validationHandler.js

const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

/**
 * Sanitiza strings removiendo HTML y limitando longitud
 */
const sanitizeString = (value, maxLength = 255) => {
    if (typeof value !== 'string') return '';
    
    const sanitized = sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {}
    });
    
    return sanitized.trim().substring(0, maxLength);
};

/**
 * Reglas de validación para crear/actualizar pacientes
 */
const patientValidationRules = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras')
        .customSanitizer(value => sanitizeString(value, 100)),
    
    body('apellidos')
        .trim()
        .notEmpty().withMessage('Los apellidos son requeridos')
        .isLength({ min: 2, max: 100 }).withMessage('Los apellidos deben tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Los apellidos solo pueden contener letras')
        .customSanitizer(value => sanitizeString(value, 100)),
    
    body('fechaNacimiento')
        .notEmpty().withMessage('La fecha de nacimiento es requerida')
        .isISO8601().withMessage('Fecha de nacimiento inválida')
        .custom(value => {
            const date = new Date(value);
            const now = new Date();
            const minDate = new Date('1900-01-01');
            
            if (date > now) {
                throw new Error('La fecha de nacimiento no puede ser futura');
            }
            if (date < minDate) {
                throw new Error('La fecha de nacimiento es inválida');
            }
            return true;
        }),
    
    body('sexo')
        .notEmpty().withMessage('El sexo es requerido')
        .isIn(['M', 'F', 'Masculino', 'Femenino', 'Otro'])
        .withMessage('Sexo inválido. Opciones válidas: M, F, Masculino, Femenino, Otro'),
    
    body('telefono')
        .trim()
        .notEmpty().withMessage('El teléfono es requerido')
        .matches(/^[\d\s\-\+\(\)]{7,20}$/).withMessage('Teléfono inválido. Solo números y símbolos básicos')
        .customSanitizer(value => sanitizeString(value, 20)),
    
    body('telefonoEmergencia')
        .optional()
        .trim()
        .matches(/^[\d\s\-\+\(\)]{7,20}$/).withMessage('Teléfono de emergencia inválido')
        .customSanitizer(value => sanitizeString(value, 20)),
    
    body('domicilio')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('El domicilio no puede exceder 200 caracteres')
        .customSanitizer(value => sanitizeString(value, 200)),
    
    body('correo')
        .trim()
        .notEmpty().withMessage('El correo es requerido')
        .isEmail().withMessage('Correo electrónico inválido')
        .isLength({ max: 254 }).withMessage('El correo es demasiado largo')
        .normalizeEmail(),
    
    body('tipoSanguineo')
        .optional()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Tipo sanguíneo inválido. Opciones: A+, A-, B+, B-, AB+, AB-, O+, O-')
];

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        console.error(' Errores de validación:', errors.array());
        
        const formattedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            receivedValue: err.value
        }));
        
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: formattedErrors
        });
    }
    
    next();
};

module.exports = {
    patientValidationRules,
    handleValidationErrors
};