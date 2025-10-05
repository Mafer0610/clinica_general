const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ error: "El usuario ya existe" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, role });

        await newUser.save();
        console.log("Usuario guardado en MongoDB:", newUser);

        res.json({ message: "Usuario registrado correctamente" });
    } catch (error) {
        console.error("Error en el registro:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(400).json({ error: "Contraseña incorrecta" });

        const token = jwt.sign({ id: user._id, role: user.role }, 'secret', { expiresIn: '1h' });

        res.json({ success: true, token, role: user.role });
    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;