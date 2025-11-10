// src/infrastructure/logger/logger.js

const winston = require('winston');
const path = require('path');

// Definir niveles de log personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Colores para cada nivel
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(colors);

// Formato de log
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para consola (desarrollo)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// ✅ Path absoluto a la carpeta logs (desde src/infrastructure/logger/ hacia logs/)
const logsDir = path.join(__dirname, '../../../logs');

// Transports (dónde se guardan los logs)
const transports = [
  // Logs de errores
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),  // ✅ Path absoluto
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // Logs combinados
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),  // ✅ Path absoluto
    maxsize: 5242880,
    maxFiles: 5
  }),
  
  // Console en desarrollo
  ...(process.env.NODE_ENV !== 'production' 
    ? [new winston.transports.Console({ format: consoleFormat })]
    : []
  )
];

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false
});

// Stream para Morgan (HTTP logging)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = logger;