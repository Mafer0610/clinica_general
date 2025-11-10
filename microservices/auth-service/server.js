const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connections = require('../../src/infrastructure/database/connections');
const rabbitmq = require('../../shared/rabbitmq/RabbitMQClient');
const AuthController = require('../../src/adapters/inbound/controllers/AuthController');

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
    origin: ['http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Access-Token'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const validateMongoConnection = async (req, res, next) => {
    try {
        const authConn = await connections.connectAuth();
        if (authConn.readyState !== 1) {
            console.error('⚠️ Solicitud rechazada: MongoDB Auth no está conectado');
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

app.use('/auth', validateMongoConnection, AuthController);

app.get('/health', async (req, res) => {
    const status = connections.getStatus();
    res.json({
        service: 'Auth Service',
        status: 'OK',
        port: PORT,
        timestamp: new Date().toISOString(),
        mongodb: status.auth.status,
        database: status.auth.database,
        rabbitmq: rabbitmq.channel ? 'connected' : 'disconnected'
    });
});

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

app.use((err, req, res, next) => {
    console.error(' Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

app.use((req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.path,
        method: req.method
    });
});

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
        
        ('✅ RabbitMQ inicializado en Auth Service');
    } catch (error) {
        console.error(' Error inicializando RabbitMQ:', error.message);
    }
}

// ========== INICIAR SERVIDOR ==========
async function startServer() {
    try {
        ('🔄 Paso 1: Conectando a MongoDB Auth...');
        await connections.connectAuth();
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const authConn = await connections.connectAuth();
        if (authConn.readyState !== 1) {
            console.error(' MongoDB conectado pero no está listo');
            setTimeout(startServer, 3000);
            return;
        }
        
        ('✅ MongoDB Auth confirmado listo');

        ('🔄 Paso 2: Inicializando RabbitMQ...');
        await initRabbitMQ();

        ('🔄 Paso 3: Iniciando servidor Express...');
        app.listen(PORT, () => {
            ('');
            ('═══════════════════════════════════════════════════');
            (`🚀 Auth Service escuchando en http://localhost:${PORT}`);
            (`📊 Health check: http://localhost:${PORT}/health`);
            (`🗄️  MongoDB Auth: ✅ Conectado`);
            (`🐰 RabbitMQ: ${rabbitmq.channel ? '✅ Conectado' : ' Desconectado'}`);
            ('═══════════════════════════════════════════════════');
            ('');
        });

    } catch (error) {
        console.error(' Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

startServer();

// ========== GRACEFUL SHUTDOWN ==========
process.on('SIGINT', async () => {
    ('\n⏹️ Cerrando Auth Service...');
    try {
        await rabbitmq.close();
        await connections.closeAll();
        console.log('✅ Conexiones cerradas correctamente');
        process.exit(0);
    } catch (error) {
        console.error(' Error al cerrar:', error);
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(' Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;