const mongoose = require('mongoose');
const connections = require('./connections');

const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    password: { 
        type: String, 
        required: true,
        minlength: 6
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    role: { 
        type: String, 
        enum: ['admin', 'user', 'medico'], 
        default: 'user',
        required: true 
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: null
    },
    deletedAt: {
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