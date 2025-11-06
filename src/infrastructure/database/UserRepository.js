const { getUserModel } = require('../../domain/entities/UserModel');
const connections = require('./connections');

const UserRepository = {
    async findByUsername(username) {
        try {
            const authConn = await connections.connectAuth();
            
            if (authConn.readyState !== 1) {
                throw new Error('MongoDB Auth no está conectado');
            }

            const UserModel = await getUserModel();
            const user = await UserModel.findOne({ username }).maxTimeMS(5000);
            return user;
        } catch (error) {
            console.error("Error al buscar usuario por username:", error.message);
            throw error;
        }
    },

    async findByEmail(email) {
        try {
            const authConn = await connections.connectAuth();
            
            if (authConn.readyState !== 1) {
                throw new Error('MongoDB Auth no está conectado');
            }

            const UserModel = await getUserModel();
            const user = await UserModel.findOne({ email }).maxTimeMS(5000);
            return user;
        } catch (error) {
            console.error("Error al buscar usuario por email:", error.message);
            throw error;
        }
    },

    async findById(userId) {
        try {
            const authConn = await connections.connectAuth();
            
            if (authConn.readyState !== 1) {
                throw new Error('MongoDB Auth no está conectado');
            }

            console.log('🔍 UserRepository.findById - Buscando:', userId);
            const UserModel = await getUserModel();
            const user = await UserModel.findById(userId).maxTimeMS(5000);
            
            if (user) {
                console.log('✅ Usuario encontrado en Repository:', user.username);
            } else {
                console.log(' Usuario NO encontrado en Repository');
            }
            
            return user;
        } catch (error) {
            console.error(" Error al buscar usuario por ID:", error.message);
            throw error;
        }
    },

    async save(userData) {
        try {
            const authConn = await connections.connectAuth();
            
            if (authConn.readyState !== 1) {
                throw new Error('MongoDB Auth no está conectado');
            }

            console.log('💾 Guardando nuevo usuario:', userData.username);
            const UserModel = await getUserModel();
            const user = new UserModel(userData);
            const savedUser = await user.save();
            console.log('✅ Usuario guardado con ID:', savedUser._id);
            return savedUser;
        } catch (error) {
            console.error(" Error al guardar usuario:", error.message);
            
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                console.error(` Duplicado detectado en campo: ${field}`);
            }
            
            throw error;
        }
    },

    async update(userId, updateData) {
        try {
            const authConn = await connections.connectAuth();
            
            if (authConn.readyState !== 1) {
                throw new Error('MongoDB Auth no está conectado');
            }

            console.log('🔄 UserRepository.update');
            console.log('📋 ID:', userId);
            console.log('📝 Update data:', JSON.stringify(updateData, null, 2));

            const UserModel = await getUserModel();
            
            // Verificar que el usuario existe
            const userBefore = await UserModel.findById(userId);
            if (!userBefore) {
                console.log(' Usuario no encontrado');
                return null;
            }
            
            console.log('📌 Usuario antes de actualizar:', {
                username: userBefore.username,
                nombre: userBefore.nombre,
                apellidos: userBefore.apellidos,
                cedula: userBefore.cedula,
                telefono: userBefore.telefono
            });

            // Realizar actualización
            const updatedUser = await UserModel.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { 
                    new: true,           // Retornar documento actualizado
                    runValidators: true  // Ejecutar validaciones del schema
                }
            );

            if (!updatedUser) {
                console.log(' Actualización falló');
                return null;
            }

            console.log('✅ Usuario actualizado');
            console.log('📌 Usuario después de actualizar:', {
                username: updatedUser.username,
                nombre: updatedUser.nombre,
                apellidos: updatedUser.apellidos,
                cedula: updatedUser.cedula,
                telefono: updatedUser.telefono
            });

            return updatedUser;
        } catch (error) {
            console.error(" Error en update:", error.message);
            console.error('Stack:', error.stack);
            throw error;
        }
    },

    async updateLastLogin(userId) {
        try {
            const authConn = await connections.connectAuth();
            
            if (authConn.readyState !== 1) {
                throw new Error('MongoDB Auth no está conectado');
            }

            console.log('⏰ Actualizando último login de:', userId);
            const UserModel = await getUserModel();
            const user = await UserModel.findByIdAndUpdate(
                userId,
                { $set: { lastLogin: new Date() } },
                { new: true }
            ).maxTimeMS(5000);
            console.log('✅ Último login actualizado');
            return user;
        } catch (error) {
            console.error("Error al actualizar último login:", error.message);
            throw error;
        }
    },

    async findAll(filters = {}) {
        try {
            const authConn = await connections.connectAuth();
            
            if (authConn.readyState !== 1) {
                throw new Error('MongoDB Auth no está conectado');
            }

            const UserModel = await getUserModel();
            const users = await UserModel.find(filters).maxTimeMS(5000);
            return users;
        } catch (error) {
            console.error("Error al obtener usuarios:", error.message);
            throw error;
        }
    },

    async count(filters = {}) {
        try {
            const authConn = await connections.connectAuth();
            
            if (authConn.readyState !== 1) {
                throw new Error('MongoDB Auth no está conectado');
            }

            const UserModel = await getUserModel();
            const count = await UserModel.countDocuments(filters).maxTimeMS(5000);
            console.log('Total:', count);
            return count;
        } catch (error) {
            console.error("Error al contar usuarios:", error.message);
            throw error;
        }
    }
};

module.exports = UserRepository;