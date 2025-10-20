const { getUserModel } = require('./UserModel');
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

            console.log('Buscando usuario por ID:', userId);
            const UserModel = await getUserModel();
            const user = await UserModel.findById(userId).maxTimeMS(5000);
            console.log('Búsqueda completada');
            return user;
        } catch (error) {
            console.error("Error al buscar usuario por ID:", error.message);
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
            console.error("❌ Error al guardar usuario:", error.message);
            
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                console.error(`❌ Duplicado detectado en campo: ${field}`);
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

            const UserModel = await getUserModel();
            const user = await UserModel.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, runValidators: true }
            ).maxTimeMS(5000);
            return user;
        } catch (error) {
            console.error("Error al actualizar usuario:", error.message);
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
            console.log('Último login actualizado');
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