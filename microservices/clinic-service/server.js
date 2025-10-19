const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const rabbitmq = require('../../shared/rabbitmq/RabbitMQClient');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Conexión a MongoDB (BD Clinica)
mongoose.connect(process.env.MONGO_URI, {
    dbName: "clinica"
})
.then(() => console.log('✅ Conectado a MongoDB - BD Clinica'))
.catch(err => console.error('❌ Error de conexión MongoDB:', err));

// Inicializar RabbitMQ
async function initRabbitMQ() {
    try {
        await rabbitmq.connect();
        
        // Crear exchanges
        await rabbitmq.assertExchange('user.events', 'topic');
        await rabbitmq.assertExchange('clinic.events', 'topic');
        
        // Crear colas para datos clínicos
        await rabbitmq.assertQueue('patient.created');
        await rabbitmq.assertQueue('appointment.created');
        await rabbitmq.assertQueue('appointment.updated');
        await rabbitmq.assertQueue('medical_record.created');
        
        // Vincular colas
        await rabbitmq.bindQueue('patient.created', 'clinic.events', 'patient.created');
        await rabbitmq.bindQueue('appointment.created', 'clinic.events', 'appointment.created');
        await rabbitmq.bindQueue('appointment.updated', 'clinic.events', 'appointment.updated');
        await rabbitmq.bindQueue('medical_record.created', 'clinic.events', 'medical_record.created');
        
        // Escuchar eventos de usuarios
        await rabbitmq.consume('user.created', async (message) => {
            console.log('👤 Nuevo usuario creado:', message);
            
            // Crear perfil de paciente si el rol es 'user'
            if (message.role === 'user') {
                try {
                    // Aquí crearías el documento inicial en la colección patients
                    console.log('📝 Creando perfil de paciente para usuario:', message.userId);
                    
                    // Publicar evento de paciente creado
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
            // Actualizar información relacionada en BD clínica
        });
        
        await rabbitmq.consume('user.deleted', async (message) => {
            console.log('🗑️ Usuario eliminado:', message);
            // Manejar eliminación (soft delete recomendado)
        });
        
        console.log('✅ RabbitMQ inicializado en Clinic Service');
    } catch (error) {
        console.error('❌ Error inicializando RabbitMQ:', error.message);
    }
}

// ========== RUTAS DE PACIENTES ==========
const patientRoutes = express.Router();

// Obtener todos los pacientes
patientRoutes.get('/', async (req, res) => {
    try {
        const patients = await mongoose.connection.db
            .collection('patients')
            .find({})
            .toArray();
        
        res.json(patients);
    } catch (error) {
        console.error('Error obteniendo pacientes:', error);
        res.status(500).json({ error: 'Error obteniendo pacientes' });
    }
});

// Crear nuevo paciente
patientRoutes.post('/', async (req, res) => {
    try {
        const patientData = {
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date(),
            historialMedico: []
        };
        
        const result = await mongoose.connection.db
            .collection('patients')
            .insertOne(patientData);
        
        // Publicar evento
        await rabbitmq.publish('clinic.events', 'patient.created', {
            patientId: result.insertedId,
            ...patientData
        });
        
        res.status(201).json({
            message: 'Paciente creado exitosamente',
            patientId: result.insertedId
        });
    } catch (error) {
        console.error('Error creando paciente:', error);
        res.status(500).json({ error: 'Error creando paciente' });
    }
});

// Obtener paciente por ID
patientRoutes.get('/:id', async (req, res) => {
    try {
        const patient = await mongoose.connection.db
            .collection('patients')
            .findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        
        if (!patient) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        res.json(patient);
    } catch (error) {
        console.error('Error obteniendo paciente:', error);
        res.status(500).json({ error: 'Error obteniendo paciente' });
    }
});

// ========== RUTAS DE CITAS ==========
const appointmentRoutes = express.Router();

// Obtener todas las citas
appointmentRoutes.get('/', async (req, res) => {
    try {
        const appointments = await mongoose.connection.db
            .collection('appointments')
            .find({})
            .toArray();
        
        res.json(appointments);
    } catch (error) {
        console.error('Error obteniendo citas:', error);
        res.status(500).json({ error: 'Error obteniendo citas' });
    }
});

// Crear nueva cita
appointmentRoutes.post('/', async (req, res) => {
    try {
        const appointmentData = {
            ...req.body,
            estado: 'pendiente',
            recordatorioEnviado: false,
            confirmada: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await mongoose.connection.db
            .collection('appointments')
            .insertOne(appointmentData);
        
        // Publicar evento
        await rabbitmq.publish('clinic.events', 'appointment.created', {
            appointmentId: result.insertedId,
            ...appointmentData
        });
        
        res.status(201).json({
            message: 'Cita creada exitosamente',
            appointmentId: result.insertedId
        });
    } catch (error) {
        console.error('Error creando cita:', error);
        res.status(500).json({ error: 'Error creando cita' });
    }
});

// ========== RUTAS DE EXPEDIENTES MÉDICOS ==========
const medicalRecordRoutes = express.Router();

// Obtener expedientes médicos de un paciente
medicalRecordRoutes.get('/patient/:patientId', async (req, res) => {
    try {
        const records = await mongoose.connection.db
            .collection('medical_records')
            .find({ pacienteId: req.params.patientId })
            .toArray();
        
        res.json(records);
    } catch (error) {
        console.error('Error obteniendo expedientes:', error);
        res.status(500).json({ error: 'Error obteniendo expedientes' });
    }
});

// Crear nuevo expediente médico
medicalRecordRoutes.post('/', async (req, res) => {
    try {
        const recordData = {
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await mongoose.connection.db
            .collection('medical_records')
            .insertOne(recordData);
        
        // Publicar evento
        await rabbitmq.publish('clinic.events', 'medical_record.created', {
            recordId: result.insertedId,
            ...recordData
        });
        
        res.status(201).json({
            message: 'Expediente médico creado exitosamente',
            recordId: result.insertedId
        });
    } catch (error) {
        console.error('Error creando expediente:', error);
        res.status(500).json({ error: 'Error creando expediente' });
    }
});

// Registrar rutas
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
    res.json({
        service: 'Clinic Service',
        status: 'OK',
        port: PORT,
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        rabbitmq: rabbitmq.channel ? 'connected' : 'disconnected'
    });
});

// Servir frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/html', 'index.html'));
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
    console.log(`🚀 Clinic Service escuchando en http://localhost:${PORT}`);
    await initRabbitMQ();
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
    console.log('\n⏹️ Cerrando Clinic Service...');
    await rabbitmq.close();
    await mongoose.connection.close();
    process.exit(0);
});

module.exports = app;