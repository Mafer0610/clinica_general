const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar JWT en las peticiones
 */
const verifyToken = (req, res, next) => {
    // Obtener token del header
    const token = req.headers['authorization']?.split(' ')[1] || 
                  req.headers['x-access-token'] ||
                  req.query.token;

    if (!token) {
        return res.status(403).json({ 
            error: 'Token requerido para autenticación' 
        });
    }

    try {
        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_temporal');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ 
            error: 'Token inválido o expirado' 
        });
    }
};

/**
 * Middleware para verificar roles específicos
 */
const verifyRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Usuario no autenticado' 
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'No tienes permisos para acceder a este recurso' 
            });
        }

        next();
    };
};

/**
 * Middleware para verificar que sea admin
 */
const isAdmin = verifyRole('admin');

/**
 * Middleware para verificar que sea médico
 */
const isMedico = verifyRole('medico', 'admin');

/**
 * Middleware para verificar que sea paciente
 */
const isPaciente = verifyRole('user', 'admin');

module.exports = {
    verifyToken,
    verifyRole,
    isAdmin,
    isMedico,
    isPaciente
};