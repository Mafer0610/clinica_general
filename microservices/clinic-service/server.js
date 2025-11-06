const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connections = require('../../src/infrastructure/database/connections');
const rabbitmq = require('../../shared/rabbitmq/RabbitMQClient');

const ReminderService = require('../../src/application/services/ReminderService');
const AuthController = require('../../src/adapters/inbound/controllers/AuthController');
const PatientController = require('../../src/adapters/inbound/controllers/PatientController');
const AppointmentController = require('../../src/adapters/inbound/controllers/AppointmentController');
const PatientProfileController = require('../../src/adapters/inbound/controllers/PatientProfileController');
const ExpedienteController = require('../../src/adapters/inbound/controllers/ExpedienteController');
const RecetaController = require('../../src/adapters/inbound/controllers/RecetaController');

const app = express();
const PORT = process.env.PORT || 3002;

const corsOptions = {
    origin: ['http://localhost:3001', 'http://localhost:3002', 'http://127.0.0.1:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Access-Token'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== SERVIR ARCHIVOS ESTÁTICOS ==========
app.use(express.static(path.join(__dirname, '../../public')));
app.use('/css', express.static(path.join(__dirname, '../../public/css')));
app.use('/js', express.static(path.join(__dirname, '../../public/js')));
app.use('/html', express.static(path.join(__dirname, '../../public/html')));

// ========== MIDDLEWARE DE VALIDACIÓN DE CONEXIÓN ==========
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
        console.error(' Error validando conexión:', error);
        return res.status(503).json({
            error: 'Servicio no disponible',
            message: 'Error de conexión a la base de datos.'
        });
    }
};

// Rutas de autenticación
app.use('/auth', AuthController);
app.use('/api/patients', validateMongoConnection, PatientController);
app.use('/api/appointments', validateMongoConnection, AppointmentController);
app.use('/api/patient-profile', validateMongoConnection, PatientProfileController);
app.use('/api/expedientes', validateMongoConnection, ExpedienteController);
app.use('/api/recetas', validateMongoConnection, RecetaController);

// Ruta raíz - Login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/html/index.html'));
});

// Ruta explícita para index.html
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/html/index.html'));
});

// Ruta para registro
app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/html/register.html'));
});

// Ruta para inicio médico
app.get('/inicioMedico.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/html/inicioMedico.html'));
});

// Ruta para inicio paciente
app.get('/inicioPaciente.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/html/inicioPaciente.html'));
});

// Ruta para pacientes médico
app.get('/pacienteMedico.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/html/pacienteMedico.html'));
});

// ========== HEALTH CHECK ==========
app.get('/health', async (req, res) => {
    const status = connections.getStatus();
    res.json({
        service: 'Clinic Service',
        status: 'OK',
        port: PORT,
        timestamp: new Date().toISOString(),
        mongodb: {
            auth: status.auth.status,
            clinic: status.clinic.status
        },
        rabbitmq: rabbitmq.channel ? 'connected' : 'disconnected'
    });
});

// ========== MANEJO DE ERRORES ==========
app.use((err, req, res, next) => {
    console.error(' Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Ruta no encontrada (debe ir al final)
app.use((req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.path,
        method: req.method
    });
});

// ========== INICIALIZAR RABBITMQ ==========
async function initRabbitMQ() {
    try {
        await rabbitmq.connect();
        
        await rabbitmq.assertExchange('user.events', 'topic');
        await rabbitmq.assertExchange('clinic.events', 'topic');
        
        await rabbitmq.assertQueue('user.created');
        await rabbitmq.assertQueue('user.updated');
        await rabbitmq.assertQueue('user.deleted');
        
        await rabbitmq.bindQueue('user.created', 'user.events', 'user.created');
        await rabbitmq.bindQueue('user.updated', 'user.events', 'user.updated');
        await rabbitmq.bindQueue('user.deleted', 'user.events', 'user.deleted');
    } catch (error) {
        console.error(' Error inicializando RabbitMQ:', error.message);
    }
}

async function startServer() {
    try {
        await connections.connectAuth();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const authConn = await connections.connectAuth();
        if (authConn.readyState !== 1) {
            console.error('MongoDB Auth conectado pero no está listo');
            setTimeout(startServer, 3000);
            return;
        }
        
        await connections.connectClinic();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const clinicConn = await connections.connectClinic();
        if (clinicConn.readyState !== 1) {
            console.error('MongoDB Clinic conectado pero no está listo');
            setTimeout(startServer, 3000);
            return;
        }

        // Paso 3: RabbitMQ
        await initRabbitMQ();

        // ✅ NUEVO Paso 4: Iniciar servicio de recordatorios
        console.log('🔔 Iniciando servicio de recordatorios automáticos...');
        ReminderService.iniciar();

// ✅ Agregar ANTES de app.listen() en tu server.js

// 🧪 ENDPOINT PARA PROBAR RECORDATORIOS (verificación manual)
app.get('/api/test-reminder', async (req, res) => {
    try {
        console.log('🧪 Endpoint de prueba de recordatorios llamado');
        
        // Verificar estado del servicio
        const status = ReminderService.getStatus();
        
        res.json({
            success: true,
            message: 'Prueba de recordatorios iniciada',
            servicioActivo: status.isRunning,
            descripcion: status.description,
            nota: 'Revisa la consola del servidor para ver los logs'
        });

        // Ejecutar verificación en background
        setTimeout(() => {
            ReminderService.verificarAhora();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error en test-reminder:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 🧪 ENDPOINT PARA ENVIAR RECORDATORIOS DE TODAS LAS CITAS (MODO PRUEBA)
app.get('/api/test-reminder-all', async (req, res) => {
    try {
        console.log('🧪 Modo prueba: enviando recordatorios de TODAS las citas');
        
        const resultado = await ReminderService.probarRecordatorios();
        
        res.json({
            success: true,
            message: 'Prueba completa',
            recordatoriosEnviados: resultado.enviados,
            recordatoriosFallidos: resultado.fallidos,
            nota: 'Revisa tu email y la consola del servidor'
        });
        
    } catch (error) {
        console.error('❌ Error en test-reminder-all:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 🔍 ENDPOINT PARA VER ESTADO DEL SERVICIO
app.get('/api/reminder-status', (req, res) => {
    const status = ReminderService.getStatus();
    res.json({
        success: true,
        ...status,
        timestamp: new Date().toISOString()
    });
});

        app.listen(PORT, () => {
            console.log('');
            console.log('═══════════════════════════════════════════════════');
            console.log(`🚀 Clinic Service escuchando en http://localhost:${PORT}`);
            console.log('');
            console.log('📍 RUTAS DISPONIBLES:');
            console.log(`   🌐 LOGIN: http://localhost:${PORT}/`);
            console.log(`   📝 REGISTRO: http://localhost:${PORT}/register.html`);
            console.log(`   🏥 INICIO MÉDICO: http://localhost:${PORT}/inicioMedico.html`);
            console.log(`   👥 PACIENTES: http://localhost:${PORT}/pacienteMedico.html`);
            console.log('');
            console.log('📍 API ENDPOINTS:');
            console.log(`   👤 Auth: http://localhost:${PORT}/auth`);
            console.log(`   🏥 Pacientes: http://localhost:${PORT}/api/patients`);
            console.log(`   📅 Citas: http://localhost:${PORT}/api/appointments`);
            console.log(`   👨‍⚕️ Perfil Paciente: http://localhost:${PORT}/api/patient-profile`);
            console.log('');
            console.log('📊 ESTADO:');
            console.log(`   🗄️  MongoDB Auth: ✅ Conectado (${authConn.name})`);
            console.log(`   🗄️  MongoDB Clinic: ✅ Conectado (${clinicConn.name})`);
            console.log(`   🐰 RabbitMQ: ${rabbitmq.channel ? '✅ Conectado' : '❌ Desconectado'}`);
            console.log(`   🔔 Recordatorios: ${ReminderService.getStatus().isRunning ? '✅ Activo' : '❌ Inactivo'}`);
            console.log('');
            console.log(`   📊 Health check: http://localhost:${PORT}/health`);
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
        ReminderService.detener();
        
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
    console.error(' Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;