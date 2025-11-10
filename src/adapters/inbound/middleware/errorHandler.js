// src/adapters/inbound/middleware/errorHandler.js

const { AppError } = require('../../../core/errors/AppError');
const logger = require('../../../infrastructure/logger/logger');

/**
 * Middleware centralizado para manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  // Log del error
  logError(err, req);

  // Si es un error operacional esperado
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        ...(err.details && { details: err.details }),
        timestamp: err.timestamp
      }
    });
  }

  // Errores de MongoDB/Mongoose
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return handleMongoError(err, res);
  }

  if (err.name === 'ValidationError') {
    return handleMongooseValidationError(err, res);
  }

  if (err.name === 'CastError') {
    return handleCastError(err, res);
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token inválido',
        timestamp: new Date().toISOString()
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token expirado',
        timestamp: new Date().toISOString()
      }
    });
  }

  // Error genérico (NO mostrar stack trace en producción)
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDevelopment 
        ? err.message 
        : 'Ha ocurrido un error interno del servidor',
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { stack: err.stack })
    }
  });
};

/**
 * Manejo de errores de MongoDB
 */
const handleMongoError = (err, res) => {
  // Error de duplicado (código 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: `El ${field} ya existe en el sistema`,
        field: field,
        timestamp: new Date().toISOString()
      }
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'DATABASE_ERROR',
      message: 'Error de base de datos',
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Manejo de errores de validación de Mongoose
 */
const handleMongooseValidationError = (err, res) => {
  const errors = Object.values(err.errors).map(error => ({
    field: error.path,
    message: error.message,
    value: error.value
  }));

  return res.status(422).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Errores de validación',
      details: errors,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Manejo de errores de casteo (IDs inválidos)
 */
const handleCastError = (err, res) => {
  return res.status(400).json({
    success: false,
    error: {
      code: 'INVALID_ID',
      message: `ID inválido: ${err.value}`,
      field: err.path,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Logging de errores
 */
const logError = (err, req) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    error: {
      name: err.name,
      message: err.message,
      code: err.errorCode || err.code,
      statusCode: err.statusCode || 500,
      stack: err.stack
    },
    ...(req.user && { userId: req.user.id })
  };

  // Log según severidad
  if (err.isOperational) {
    logger.warn('Error operacional:', errorLog);
  } else {
    logger.error('Error crítico:', errorLog);
  }
};

/**
 * Middleware para rutas no encontradas (404)
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Manejo de errores asíncronos (wrapper)
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};