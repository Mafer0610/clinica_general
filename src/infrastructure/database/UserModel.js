const mongoose = require('mongoose');

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
    timestamps: true, // Agrega automáticamente createdAt y updatedAt
    collection: 'users'
});

// NO AGREGAR ÍNDICES AQUÍ - ya están definidos con unique: true arriba
// UserSchema.index({ username: 1 }); // REMOVER
// UserSchema.index({ email: 1 }); // REMOVER
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

// Middleware para actualizar updatedAt antes de guardar
UserSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Método para ocultar información sensible
UserSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', UserSchema, 'users');