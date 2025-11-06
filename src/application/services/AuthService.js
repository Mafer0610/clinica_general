/*Lógica de login, registro, etc. con RabbitMQ - VERSIÓN COMPLETA*/
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserRepository = require('../../infrastructure/database/UserRepository');

// Importar RabbitMQ solo si está disponible (para evitar errores en desarrollo)
let rabbitmq;
try {
    rabbitmq = require('../../../shared/rabbitmq/RabbitMQClient');
} catch (error) {
    console.warn('⚠️ RabbitMQ no disponible en este contexto');
}

const AuthService = {
    /**
     * Registrar nuevo usuario
     */
    async register(username, password, email, role = 'user') {
        try {
            // Validar que el usuario no exista
            const existingUser = await UserRepository.findByUsername(username);
            if (existingUser) {
                return { error: "El usuario ya existe" };
            }

            // Validar que el email no exista
            const existingEmail = await UserRepository.findByEmail(email);
            if (existingEmail) {
                return { error: "El email ya está registrado" };
            }

            // Hash de la contraseña
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Crear usuario
            const newUser = { 
                username, 
                password: hashedPassword, 
                email,
                role,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const savedUser = await UserRepository.save(newUser);
            console.log("✅ Usuario guardado en MongoDB:", savedUser._id);

            // Publicar evento de usuario creado en RabbitMQ
            if (rabbitmq && rabbitmq.channel) {
                try {
                    await rabbitmq.publish('user.events', 'user.created', {
                        userId: savedUser._id.toString(),
                        username: savedUser.username,
                        email: savedUser.email,
                        role: savedUser.role,
                        createdAt: savedUser.createdAt
                    });
                    console.log("📤 Evento 'user.created' publicado");
                } catch (error) {
                    console.error(" Error publicando evento:", error.message);
                }
            }

            return { 
                success: true,
                message: "Usuario registrado correctamente",
                userId: savedUser._id
            };
        } catch (error) {
            console.error(" Error en registro:", error);
            return { error: "Error al registrar usuario" };
        }
    },

    /**
     * Iniciar sesión
     */
    async login(username, password) {
        try {
            // Buscar usuario
            const user = await UserRepository.findByUsername(username);
            if (!user) {
                return { error: "Usuario no encontrado" };
            }

            // Verificar si el usuario está activo
            if (!user.isActive) {
                return { error: "Usuario inactivo" };
            }

            // Verificar contraseña
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return { error: "Contraseña incorrecta" };
            }

            // Generar token JWT
            const token = jwt.sign(
                { 
                    id: user._id,
                    username: user.username,
                    role: user.role 
                }, 
                process.env.JWT_SECRET || 'secret_temporal', 
                { expiresIn: '24h' }
            );

            // Actualizar último login
            await UserRepository.updateLastLogin(user._id);

            // Publicar evento de login
            if (rabbitmq && rabbitmq.channel) {
                try {
                    await rabbitmq.publish('user.events', 'user.login', {
                        userId: user._id.toString(),
                        username: user.username,
                        role: user.role,
                        timestamp: new Date()
                    });
                    console.log("📤 Evento 'user.login' publicado");
                } catch (error) {
                    console.error(" Error publicando evento de login:", error.message);
                }
            }

            return { 
                success: true, 
                token, 
                role: user.role,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            };
        } catch (error) {
            console.error(" Error en login:", error);
            return { error: "Error al iniciar sesión" };
        }
    },

    /**
     * Actualizar usuario
     */
    async updateUser(userId, updateData) {
        try {
            const updatedUser = await UserRepository.update(userId, {
                ...updateData,
                updatedAt: new Date()
            });

            if (!updatedUser) {
                return { error: "Usuario no encontrado" };
            }

            // Publicar evento de actualización
            if (rabbitmq && rabbitmq.channel) {
                try {
                    await rabbitmq.publish('user.events', 'user.updated', {
                        userId: userId,
                        updatedFields: Object.keys(updateData),
                        timestamp: new Date()
                    });
                    console.log("📤 Evento 'user.updated' publicado");
                } catch (error) {
                    console.error(" Error publicando evento:", error.message);
                }
            }

            return { 
                success: true, 
                message: "Usuario actualizado correctamente",
                user: updatedUser
            };
        } catch (error) {
            console.error(" Error actualizando usuario:", error);
            return { error: "Error al actualizar usuario" };
        }
    },

    /**
     * Eliminar usuario (soft delete)
     */
    async deleteUser(userId) {
        try {
            // Soft delete: marcar como inactivo en lugar de eliminar
            const result = await UserRepository.update(userId, {
                isActive: false,
                deletedAt: new Date()
            });

            if (!result) {
                return { error: "Usuario no encontrado" };
            }

            // Publicar evento de eliminación
            if (rabbitmq && rabbitmq.channel) {
                try {
                    await rabbitmq.publish('user.events', 'user.deleted', {
                        userId: userId,
                        timestamp: new Date()
                    });
                    console.log("📤 Evento 'user.deleted' publicado");
                } catch (error) {
                    console.error(" Error publicando evento:", error.message);
                }
            }

            return { 
                success: true, 
                message: "Usuario eliminado correctamente"
            };
        } catch (error) {
            console.error(" Error eliminando usuario:", error);
            return { error: "Error al eliminar usuario" };
        }
    },

    /**
     * Validar token JWT
     */
    async validateToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_temporal');
            return { 
                valid: true, 
                user: decoded 
            };
        } catch (error) {
            return { 
                valid: false, 
                error: "Token inválido o expirado" 
            };
        }
    },

    /**
     * Obtener usuario por ID
     */
    async getUserById(userId) {
        try {
            const user = await UserRepository.findById(userId);
            if (!user) {
                return { error: "Usuario no encontrado" };
            }

            // No devolver la contraseña
            const { password, ...userWithoutPassword } = user.toObject ? user.toObject() : user;

            return { 
                success: true, 
                user: userWithoutPassword 
            };
        } catch (error) {
            console.error(" Error obteniendo usuario:", error);
            return { error: "Error al obtener usuario" };
        }
    },

    /**
     * Cambiar contraseña
     */
    async changePassword(userId, oldPassword, newPassword) {
        try {
            const user = await UserRepository.findById(userId);
            if (!user) {
                return { error: "Usuario no encontrado" };
            }

            // Verificar contraseña antigua
            const isValid = await bcrypt.compare(oldPassword, user.password);
            if (!isValid) {
                return { error: "Contraseña actual incorrecta" };
            }

            // Hash de la nueva contraseña
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Actualizar contraseña
            await UserRepository.update(userId, {
                password: hashedPassword,
                updatedAt: new Date()
            });

            return { 
                success: true, 
                message: "Contraseña cambiada correctamente" 
            };
        } catch (error) {
            console.error(" Error cambiando contraseña:", error);
            return { error: "Error al cambiar contraseña" };
        }
    },

    /**
     * Obtener todos los usuarios (solo admin)
     */
    async getAllUsers(filters = {}) {
        try {
            const users = await UserRepository.findAll(filters);
            
            // Remover contraseñas
            const usersWithoutPasswords = users.map(user => {
                const { password, ...userWithoutPassword } = user.toObject ? user.toObject() : user;
                return userWithoutPassword;
            });

            return { 
                success: true, 
                users: usersWithoutPasswords,
                count: usersWithoutPasswords.length
            };
        } catch (error) {
            console.error(" Error obteniendo usuarios:", error);
            return { error: "Error al obtener usuarios" };
        }
    }
};

module.exports = AuthService;