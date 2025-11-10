// src/core/errors/AppError.js

/**
 * Clase base para errores personalizados de la aplicación
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = null, details = null) {
    super(message);
    
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true; // Errores que esperamos y podemos manejar
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error 400 - Bad Request
 */
class BadRequestError extends AppError {
  constructor(message = 'Solicitud inválida', details = null) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

/**
 * Error 401 - Unauthorized
 */
class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado', details = null) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

/**
 * Error 403 - Forbidden
 */
class ForbiddenError extends AppError {
  constructor(message = 'Acceso prohibido', details = null) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

/**
 * Error 404 - Not Found
 */
class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado', details = null) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

/**
 * Error 409 - Conflict
 */
class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual', details = null) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * Error 422 - Unprocessable Entity (para validaciones)
 */
class ValidationError extends AppError {
  constructor(message = 'Datos de entrada inválidos', errors = []) {
    super(message, 422, 'VALIDATION_ERROR', errors);
  }
}

/**
 * Error 500 - Internal Server Error
 */
class InternalServerError extends AppError {
  constructor(message = 'Error interno del servidor', details = null) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details);
    this.isOperational = false; // Este tipo de error no es esperado
  }
}

/**
 * Error 503 - Service Unavailable
 */
class ServiceUnavailableError extends AppError {
  constructor(message = 'Servicio no disponible', details = null) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
  ServiceUnavailableError
};