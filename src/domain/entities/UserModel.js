const mongoose = require('mongoose');
const connections = require('../../infrastructure/database/connections');

const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true
    },
    password: { 
        type: String, 
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    role: { 
        type: String, 
        enum: ['admin', 'user', 'medico'], 
        default: 'user'
    },
    nombre: {
        type: String,
        default: '',
        trim: true
    },
    apellidos: {
        type: String,
        default: '',
        trim: true
    },
    cedula: {
        type: String,
        default: '',
        trim: true
    },
    telefono: {
        type: String,
        default: '',
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    collection: 'users'
});

UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

async function getUserModel() {
    const authConn = await connections.connectAuth();
    
    if (authConn.models.User) {
        return authConn.models.User;
    }
    
    return authConn.model('User', UserSchema, 'users');
}

module.exports = { getUserModel, UserSchema };