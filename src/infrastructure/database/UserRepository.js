const UserModel = require('./UserModel');
const mongoose = require('mongoose');

const UserRepository = {
    async findByUsername(username) {
        try {
            // Validar que mongoose esté conectado
            if (mongoose.connection.readyState !== 1) {
                throw new Error('MongoDB no está conectado');
            }

            console.log('🔍 Buscando usuario por username:', username);
            const user = await UserModel.findOne({ username }).maxTimeMS(5000);
            console.log('✅ Búsqueda completada');
            return user;
        } catch (error) {
            console.error("❌ Error al buscar usuario por username:", error.message);
            throw error;
        }
    },

    async findByEmail(email) {
        try {
            if (mongoose.connection.readyState !== 1) {
                throw new Error('MongoDB no está conectado');
            }

            console.log('🔍 Buscando usuario por email:', email);
            const user = await UserModel.findOne({ email }).maxTimeMS(5000);
            console.log('✅ Búsqueda completada');
            return user;
        } catch (error) {
            console.error("❌ Error al buscar usuario por email:", error.message);
            throw error;
        }
    },

    async findById(userId) {
        try {
            if (mongoose.connection.readyState !== 1) {
                throw new Error('MongoDB no está conectado');
            }

            console.log('🔍 Buscando usuario por ID:', userId);
            const user = await UserModel.findById(userId).maxTimeMS(5000);
            console.log('✅ Búsqueda completada');
            return user;
        } catch (error) {
            console.error("❌ Error al buscar usuario por ID:", error.message);
            throw error;
        }
    },

    async save(userData) {
        try {
            if (mongoose.connection.readyState !== 1) {
                throw new Error('MongoDB no está conectado');
            }

            console.log('💾 Guardando nuevo usuario:', userData.username);
            const user = new UserModel(userData);
            const savedUser = await user.save();
            console.log('✅ Usuario guardado con ID:', savedUser._id);
            return savedUser;
        } catch (error) {
            console.error("❌ Error al guardar usuario:", error.message);
            throw error;
        }
    },

    async update(userId, updateData) {
        try {
            if (mongoose.connection.readyState !== 1) {
                throw new Error('MongoDB no está conectado');
            }

            console.log('🔄 Actualizando usuario:', userId);
            const user = await UserModel.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, runValidators: true }
            ).maxTimeMS(5000);
            console.log('✅ Usuario actualizado');
            return user;
        } catch (error) {
            console.error("❌ Error al actualizar usuario:", error.message);
            throw error;
        }
    },

    async updateLastLogin(userId) {
        try {
            if (mongoose.connection.readyState !== 1) {
                throw new Error('MongoDB no está conectado');
            }

            console.log('⏰ Actualizando último login de:', userId);
            const user = await UserModel.findByIdAndUpdate(
                userId,
                { $set: { lastLogin: new Date() } },
                { new: true }
            ).maxTimeMS(5000);
            console.log('✅ Último login actualizado');
            return user;
        } catch (error) {
            console.error("❌ Error al actualizar último login:", error.message);
            throw error;
        }
    },

    async findAll(filters = {}) {
        try {
            if (mongoose.connection.readyState !== 1) {
                throw new Error('MongoDB no está conectado');
            }

            console.log('🔍 Obteniendo usuarios con filtros:', filters);
            const users = await UserModel.find(filters).maxTimeMS(5000);
            console.log('✅ Se obtuvieron', users.length, 'usuarios');
            return users;
        } catch (error) {
            console.error("❌ Error al obtener usuarios:", error.message);
            throw error;
        }
    },

    async delete(userId) {
        try {
            if (mongoose.connection.readyState !== 1) {
                throw new Error('MongoDB no está conectado');
            }

            console.log('🗑️ Eliminando usuario:', userId);
            const user = await UserModel.findByIdAndDelete(userId).maxTimeMS(5000);
            console.log('✅ Usuario eliminado');
            return user;
        } catch (error) {
            console.error("❌ Error al eliminar usuario:", error.message);
            throw error;
        }
    },

    async softDelete(userId) {
        try {
            if (mongoose.connection.readyState !== 1) {
                throw new Error('MongoDB no está conectado');
            }

            console.log('🗑️ Soft delete de usuario:', userId);
            const user = await UserModel.findByIdAndUpdate(
                userId,
                { 
                    $set: { 
                        isActive: false,
                        deletedAt: new Date()
                    } 
                },
                { new: true }
            ).maxTimeMS(5000);
            console.log('✅ Usuario marcado como inactivo');
            return user;
        } catch (error) {
            console.error("❌ Error al realizar soft delete:", error.message);
            throw error;
        }
    },

    async count(filters = {}) {
        try {
            if (mongoose.connection.readyState !== 1) {
                throw new Error('MongoDB no está conectado');
            }

            console.log('📊 Contando usuarios');
            const count = await UserModel.countDocuments(filters).maxTimeMS(5000);
            console.log('✅ Total:', count);
            return count;
        } catch (error) {
            console.error("❌ Error al contar usuarios:", error.message);
            throw error;
        }
    }
};

module.exports = UserRepository;