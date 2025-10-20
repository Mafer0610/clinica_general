const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const rabbitmq = require('../../shared/rabbitmq/RabbitMQClient');
const AuthController = require('../../src/adapters/inbound/controllers/AuthController');

const app = express();
const PORT = process.env.PORT || 3001;

// ========== MIDDLEWARE ==========
const corsOptions = {
    origin: ['http://localhost:5000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Access-Token'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== CONEXIÓN MONGODB MEJORADA ==========
async function connectMongoDB() {
    try {
        console.log('🔗 Intentando conectar a MongoDB...');
        console.log('📍 URI:', process.env.MONGO_URI.substring(0, 50) + '...');

        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "auth",
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            w: 'majority'
        });

        console.log('✅ Conectado a MongoDB - BD Auth');
        console.log('📍 Base de datos:', mongoose.connection.name);
        console.log('📍 Estado de conexión:', mongoose.connection.readyState); // 1 = conectado
        
        return true;
    } catch (err) {
        console.error('❌ Error de conexión MongoDB:', err.message);
        return false;
    }
}

// ========== RABBITMQ INICIALIZACIÓN ==========
async function initRabbitMQ() {
    try {
        await rabbitmq.connect();
        
        // Crear exchanges
        await rabbitmq.assertExchange('user.events', 'topic');
        await rabbitmq.assertExchange('clinic.events', 'topic');
        
        // Crear colas
        await rabbitmq.assertQueue('user.created');
        await rabbitmq.assertQueue('user.updated');
        await rabbitmq.assertQueue('user.deleted');
        
        // Vincular colas a exchanges
        await rabbitmq.bindQueue('user.created', 'user.events', 'user.created');
        await rabbitmq.bindQueue('user.updated', 'user.events', 'user.updated');
        await rabbitmq.bindQueue('user.deleted', 'user.events', 'user.deleted');
        
        console.log('✅ RabbitMQ inicializado en Auth Service');
    } catch (error) {
        console.error('❌ Error inicializando RabbitMQ:', error.message);
    }
}

// ========== MIDDLEWARE DE VALIDACIÓN DE MONGODB ==========
const validateMongoConnection = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        console.error('⚠️ Solicitud rechazada: MongoDB no está conectado');
        return res.status(503).json({
            error: 'Servicio no disponible',
            message: 'La base de datos no está conectada. Intenta nuevamente en unos segundos.'
        });
    }
    next();
};

// ========== RUTAS (con validación de MongoDB) ==========
app.use('/auth', validateMongoConnection, AuthController);

// Health check
app.get('/health', (req, res) => {
    res.json({
        service: 'Auth Service',
        status: 'OK',
        port: PORT,
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        mongoState: mongoose.connection.readyState, // 0 = desconectado, 1 = conectado
        rabbitmq: rabbitmq.channel ? 'connected' : 'disconnected'
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'DJFA Auth Service',
        version: '1.0.0',
        endpoints: {
            register: 'POST /auth/register',
            login: 'POST /auth/login',
            health: 'GET /health'
        }
    });
});

// ========== MANEJO DE ERRORES ==========
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.path,
        method: req.method
    });
});

// ========== INICIAR SERVIDOR (ORDEN CORREGIDO) ==========
async function startServer() {
    try {
        // ⚠️ PRIMERO: Conectar a MongoDB y ESPERAR
        console.log('🔄 Paso 1: Conectando a MongoDB...');
        const mongoConnected = await connectMongoDB();
        
        if (!mongoConnected) {
            console.error('❌ No se pudo conectar a MongoDB. Reintentando en 5 segundos...');
            setTimeout(startServer, 5000);
            return;
        }

        // SEGUNDO: Esperar 1 segundo adicional para asegurar que la conexión esté completamente lista
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar estado final de MongoDB
        if (mongoose.connection.readyState !== 1) {
            console.error('❌ MongoDB conectado pero no está listo. Estado:', mongoose.connection.readyState);
            setTimeout(startServer, 3000);
            return;
        }
        
        console.log('✅ MongoDB confirmado listo para recibir queries');

        // TERCERO: Inicializar RabbitMQ
        console.log('🔄 Paso 2: Inicializando RabbitMQ...');
        await initRabbitMQ();

        // CUARTO: Escuchar en el puerto
        console.log('🔄 Paso 3: Iniciando servidor Express...');
        app.listen(PORT, () => {
            console.log('');
            console.log('═══════════════════════════════════════════════════');
            console.log(`🚀 Auth Service escuchando en http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🗄️  MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Conectado' : '❌ Desconectado'}`);
            console.log(`🐰 RabbitMQ: ${rabbitmq.channel ? '✅ Conectado' : '❌ Desconectado'}`);
            console.log('═══════════════════════════════════════════════════');
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

startServer();

// ========== GRACEFUL SHUTDOWN ==========
process.on('SIGINT', async () => {
    console.log('\n⏹️ Cerrando Auth Service...');
    try {
        await rabbitmq.close();
        await mongoose.connection.close();
        console.log('✅ Conexiones cerradas correctamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al cerrar:', error);
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

module.exports = app;