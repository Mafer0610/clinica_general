const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const rabbitmq = require('../../shared/rabbitmq/RabbitMQClient');
const AuthController = require('../../src/adapters/inbound/controllers/AuthController');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB (BD Auth)
mongoose.connect(process.env.MONGO_URI, {
    dbName: "auth"
})
.then(() => console.log('✅ Conectado a MongoDB - BD Auth'))
.catch(err => console.error('❌ Error de conexión MongoDB:', err));

// Inicializar RabbitMQ
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
        
        // Consumir mensajes del servicio clínico (si es necesario)
        await rabbitmq.consume('auth.requests', async (message) => {
            console.log('📩 Solicitud recibida del servicio clínico:', message);
            
            // Procesar según el tipo de solicitud
            switch(message.action) {
                case 'validate_token':
                    // Validar token y responder
                    break;
                case 'get_user_info':
                    // Obtener información de usuario
                    break;
                default:
                    console.warn('⚠️ Acción desconocida:', message.action);
            }
        });
        
        console.log('✅ RabbitMQ inicializado en Auth Service');
    } catch (error) {
        console.error('❌ Error inicializando RabbitMQ:', error.message);
    }
}

// Rutas
app.use('/auth', AuthController);

// Ruta de health check
app.get('/health', (req, res) => {
    res.json({
        service: 'Auth Service',
        status: 'OK',
        port: PORT,
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
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

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message
    });
});

// Iniciar servidor
app.listen(PORT, async () => {
    console.log(`🚀 Auth Service escuchando en http://localhost:${PORT}`);
    await initRabbitMQ();
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
    console.log('\n⏹️ Cerrando Auth Service...');
    await rabbitmq.close();
    await mongoose.connection.close();
    process.exit(0);
});

module.exports = app;