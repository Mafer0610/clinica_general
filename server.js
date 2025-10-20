const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// CORS
app.use(cors({
    origin: ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:5000'],
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a MongoDB - BD Clínica
mongoose.connect(process.env.MONGO_URI, {
    dbName: "clinica",
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: 'majority'
})
.then(() => {
    console.log('✅ Conectado a MongoDB - BD Clínica');
    console.log('📍 Base de datos:', mongoose.connection.name);
})
.catch(err => {
    console.error('❌ Error de conexión MongoDB:', err.message);
});

// Rutas
const authRoutes = require('./src/adapters/inbound/controllers/AuthController');
app.use('/auth', authRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        service: 'Main Server',
        status: 'OK',
        port: 5000,
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor principal en http://localhost:${PORT}`);
    console.log(`📍 Abre en tu navegador: http://localhost:${PORT}`);
});