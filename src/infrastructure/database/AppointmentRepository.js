const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connections = require('../../src/infrastructure/database/connections');
const rabbitmq = require('../../shared/rabbitmq/RabbitMQClient');

// Importar controladores
const PatientController = require('../../src/adapters/inbound/controllers/PatientController');
const AppointmentController = require('../../src/adapters/inbound/controllers/AppointmentController');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
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
app.use(express.static(path.join(__dirname, '../../public')));

// Middleware de validación de conexión MongoDB
const validateMongoConnection = async (req, res, next) => {
    try {
        const clinicConn = await connections.connectClinic();
        if (clinicConn.readyState !== 1) {
            console.error('⚠️ Solicitud rechazada: MongoDB Clinic no está conectado');
            return res.status(503).json({
                error: 'Servicio no disponible',
                message: 'La base de datos no está conectada. Intenta nuevamente en unos segundos.'
            });
        }
        next();
    } catch (error) {
        console.error('❌ Error validando conexión:', error);
        return res.status(503).json({
            error: 'Servicio no disponible',
            message: 'Error de conexión a la base de datos.'
        });
    }
};

// ========== RUTAS API ==========
app.use('/api/patients', validateMongoConnection, PatientController);
app.use('/api/appointments', validateMongoConnection, AppointmentController);

// Health check
app.get('/health', async (req, res) => {
    const status = connections.getStatus();
    res.json({
        service: 'Clinic Service',
        status: 'OK',
        port: PORT,
        timestamp: new Date().toISOString(),
        mongodb: status.clinic.status,
        database: status.clinic.database,
        rabbitmq: rabbitmq.channel ? 'connected' : 'disconnected'
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'DJFA Clinic Service',
        version: '1.0.0',
        endpoints: {
            patients: 'GET/POST /api/patients',
            patient: 'GET/PUT /api/patients/:id',
            appointments: 'GET/POST /api/appointments',
            appointment: 'PUT /api/appointments/:id',
            health: 'GET /health'
        }
    });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.path,
        method: req.method
    });
});

// Inicializar RabbitMQ
async function initRabbitMQ() {
    try {
        await rabbitmq.connect();
        
        await rabbitmq.assertExchange('user.events', 'topic');
        await rabbitmq.assertExchange('clinic.events', 'topic');
        
        await rabbitmq.assertQueue('patient.created');
        await rabbitmq.assertQueue('appointment.created');
        await rabbitmq.assertQueue('appointment.updated');
        await rabbitmq.assertQueue('medical_record.created');
        
        await rabbitmq.bindQueue('patient.created', 'clinic.events', 'patient.created');
        await rabbitmq.bindQueue('appointment.created', 'clinic.events', 'appointment.created');
        await rabbitmq.bindQueue('appointment.updated', 'clinic.events', 'appointment.updated');
        await rabbitmq.bindQueue('medical_record.created', 'clinic.events', 'medical_record.created');
        
        // Escuchar eventos de usuarios
        await rabbitmq.consume('user.created', async (message) => {
            console.log('👤 Nuevo usuario creado:', message);
            
            if (message.role === 'user') {
                try {
                    console.log('📝 Creando perfil de paciente para usuario:', message.userId);
                    
                    await rabbitmq.publish('clinic.events', 'patient.created', {
                        userId: message.userId,
                        username: message.username,
                        email: message.email,
                        createdAt: new Date()
                    });
                } catch (error) {
                    console.error('❌ Error creando perfil de paciente:', error);
                }
            }
        });
        
        await rabbitmq.consume('user.updated', async (message) => {
            console.log('🔄 Usuario actualizado:', message);
        });
        
        await rabbitmq.consume('user.deleted', async (message) => {
            console.log('🗑️ Usuario eliminado:', message);
        });
        
        console.log('✅ RabbitMQ inicializado en Clinic Service');
    } catch (error) {
        console.error('❌ Error inicializando RabbitMQ:', error.message);
    }
}

// ========== INICIAR SERVIDOR ==========
async function startServer() {
    try {
        console.log('🔄 Paso 1: Conectando a MongoDB Clinic...');
        await connections.connectClinic();
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const clinicConn = await connections.connectClinic();
        if (clinicConn.readyState !== 1) {
            console.error('❌ MongoDB conectado pero no está listo');
            setTimeout(startServer, 3000);
            return;
        }
        
        console.log('✅ MongoDB Clinic confirmado listo');

        console.log('🔄 Paso 2: Inicializando RabbitMQ...');
        await initRabbitMQ();

        console.log('🔄 Paso 3: Iniciando servidor Express...');
        app.listen(PORT, () => {
            console.log('');
            console.log('═══════════════════════════════════════════════════');
            console.log(`🚀 Clinic Service escuchando en http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🗄️  MongoDB Clinic: ✅ Conectado a base de datos 'dclinica'`);
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
    console.log('\n⏹️ Cerrando Clinic Service...');
    try {
        await rabbitmq.close();
        await connections.closeAll();
        console.log('✅ Conexiones cerradas correctamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al cerrar:', error);
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;