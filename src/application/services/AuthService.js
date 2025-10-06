/*Lógica de login, registro, etc.*/
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserRepository = require('../../infrastructure/database/UserRepository');

const AuthService = {
    async register(username, password, role) {
        const existingUser = await UserRepository.findByUsername(username);
        if (existingUser) {
            return { error: "El usuario ya existe" };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { username, password: hashedPassword, role };

        const savedUser = await UserRepository.save(newUser);
        console.log("Usuario guardado en MongoDB:", savedUser);

        return { message: "Usuario registrado correctamente" };
    },

    async login(username, password) {
        const user = await UserRepository.findByUsername(username);
        if (!user) {
            return { error: "Usuario no encontrado" };
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return { error: "Contraseña incorrecta" };
        }

        const token = jwt.sign({ id: user._id, role: user.role }, 'secret', { expiresIn: '1h' });
        return { success: true, token, role: user.role };
    }
};

module.exports = AuthService;