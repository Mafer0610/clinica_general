/*implementación con mongo - Actualizado para Auth DB*/
const UserModel = require('./UserModel');

const UserRepository = {
    async findByUsername(username) {
        try {
            return await UserModel.findOne({ username });
        } catch (error) {
            console.error("❌ Error al buscar usuario por username:", error);
            throw error;
        }
    },

    async findByEmail(email) {
        try {
            return await UserModel.findOne({ email });
        } catch (error) {
            console.error("❌ Error al buscar usuario por email:", error);
            throw error;
        }
    },

    async findById(userId) {
        try {
            return await UserModel.findById(userId);
        } catch (error) {
            console.error("❌ Error al buscar usuario por ID:", error);
            throw error;
        }
    },

    async save(userData) {
        try {
            const user = new UserModel(userData);
            return await user.save();
        } catch (error) {
            console.error("❌ Error al guardar usuario:", error);
            throw error;
        }
    },

    async update(userId, updateData) {
        try {
            return await UserModel.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, runValidators: true }
            );
        } catch (error) {
            console.error("❌ Error al actualizar usuario:", error);
            throw error;
        }
    },

    async updateLastLogin(userId) {
        try {
            return await UserModel.findByIdAndUpdate(
                userId,
                { $set: { lastLogin: new Date() } },
                { new: true }
            );
        } catch (error) {
            console.error("❌ Error al actualizar último login:", error);
            throw error;
        }
    },

    async findAll(filters = {}) {
        try {
            return await UserModel.find(filters);
        } catch (error) {
            console.error("❌ Error al obtener usuarios:", error);
            throw error;
        }
    },

    async delete(userId) {
        try {
            // Hard delete (no recomendado en producción)
            return await UserModel.findByIdAndDelete(userId);
        } catch (error) {
            console.error("❌ Error al eliminar usuario:", error);
            throw error;
        }
    },

    async softDelete(userId) {
        try {
            // Soft delete: marca como inactivo
            return await UserModel.findByIdAndUpdate(
                userId,
                { 
                    $set: { 
                        isActive: false,
                        deletedAt: new Date()
                    } 
                },
                { new: true }
            );
        } catch (error) {
            console.error("❌ Error al realizar soft delete:", error);
            throw error;
        }
    },

    async count(filters = {}) {
        try {
            return await UserModel.countDocuments(filters);
        } catch (error) {
            console.error("❌ Error al contar usuarios:", error);
            throw error;
        }
    }
};

module.exports = UserRepository;