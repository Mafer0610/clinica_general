/*implementación con mongo*/
const UserModel = require('./UserModel');

const UserRepository = {
    async findByUsername(username) {
        try {
            return await UserModel.findOne({ username });
        } catch (error) {
            console.error("Error al buscar usuario:", error);
            throw error;
        }
    },

    async save(userData) {
        try {
            const user = new UserModel(userData);
            return await user.save();
        } catch (error) {
            console.error("Error al guardar usuario:", error);
            throw error;
        }
    }
};

module.exports = UserRepository;