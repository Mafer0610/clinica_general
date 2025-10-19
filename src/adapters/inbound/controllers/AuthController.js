/*Manejo de peticiones HTTP - Actualizado*/
const express = require('express');
const AuthService = require('../../../application/services/AuthService');

const router = express.Router();

// ========== REGISTRO ==========
router.post('/register', async (req, res) => {
    try {
        const { username, password, email, role } = req.body;

        // Validaciones básicas
        if (!username || !password || !email) {
            return res.status(400).json({ 
                error: "Faltan campos requeridos: username, password, email" 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                error: "La contraseña debe tener al menos 6 caracteres" 
            });
        }

        const result = await AuthService.register(username, password, email, role);
        
        if (result.error) {
            return res.status(400).json(result);
        }

        res.status(201).json(result);
    } catch (error) {
        console.error("❌ Error en el registro:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// ========== LOGIN ==========
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validaciones básicas
        if (!username || !password) {
            return res.status(400).json({ 
                error: "Faltan campos requeridos: username, password" 
            });
        }

        const result = await AuthService.login(username, password);
        
        if (result.error) {
            return res.status(401).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error("❌ Error en el login:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// ========== VALIDAR TOKEN ==========
router.post('/validate-token', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ 
                error: "Token requerido" 
            });
        }

        const result = await AuthService.validateToken(token);
        
        if (!result.valid) {
            return res.status(401).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error("❌ Error validando token:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// ========== OBTENER USUARIO POR ID ==========
router.get('/user/:id', async (req, res) => {
    try {
        const result = await AuthService.getUserById(req.params.id);
        
        if (result.error) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error("❌ Error obteniendo usuario:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// ========== ACTUALIZAR USUARIO ==========
router.put('/user/:id', async (req, res) => {
    try {
        const { username, email, role } = req.body;
        
        const updateData = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (role) updateData.role = role;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                error: "No hay datos para actualizar" 
            });
        }

        const result = await AuthService.updateUser(req.params.id, updateData);
        
        if (result.error) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error("❌ Error actualizando usuario:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// ========== ELIMINAR USUARIO (SOFT DELETE) ==========
router.delete('/user/:id', async (req, res) => {
    try {
        const result = await AuthService.deleteUser(req.params.id);
        
        if (result.error) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error("❌ Error eliminando usuario:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;