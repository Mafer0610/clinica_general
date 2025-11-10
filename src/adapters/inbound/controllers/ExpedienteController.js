const express = require('express');
const ExpedienteRepository = require('../../../infrastructure/database/ExpedienteRepository');
const PatientRepository = require('../../../infrastructure/database/PatientRepository');

// Agregar método findByPacienteId al ExpedienteRepository
ExpedienteRepository.findByPacienteId = async function(pacienteId) {
    try {
        const connections = require('../../../infrastructure/database/connections');
        const clinicConn = await connections.connectClinic();
        
        if (clinicConn.readyState !== 1) {
            throw new Error('MongoDB Clinic no está conectado');
        }

        const ObjectId = require('mongodb').ObjectId;
        const expediente = await clinicConn.collection('expedientes')
            .findOne({ pacienteId: new ObjectId(pacienteId) });
        
        return expediente;
    } catch (error) {
        console.error('Error buscando expediente por pacienteId:', error);
        throw error;
    }
};

const router = express.Router();

// ========== OBTENER O CREAR EXPEDIENTE POR PACIENTE ID ==========
router.get('/paciente/:pacienteId', async (req, res) => {
    try {
        console.log('📥 GET /api/expedientes/paciente/:pacienteId');
        console.log('📋 pacienteId:', req.params.pacienteId);
        
        const patient = await PatientRepository.findById(req.params.pacienteId);
        
        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }
        
        const expediente = await ExpedienteRepository.findOrCreateByPacienteId(req.params.pacienteId);
        
        const expedienteConIdString = {
            ...expediente,
            _id: expediente._id.toString()
        };
        
        const expedienteCompleto = {
            expediente: expedienteConIdString,
            paciente: {
                nombre: patient.nombre,
                apellidos: patient.apellidos,
                fechaNacimiento: patient.fechaNacimiento,
                edad: patient.edad,
                sexo: patient.sexo,
                telefono: patient.telefono,
                telefonoEmergencia: patient.telefonoEmergencia,
                domicilio: patient.domicilio,
                correo: patient.correo,
                alergias: patient.alergias,
                padecimientos: patient.padecimientos,
                tipoSanguineo: patient.tipoSanguineo
            }
        };
        
        res.json({
            success: true,
            data: expedienteCompleto
        });
    } catch (error) {
        console.error('❌ Error obteniendo expediente:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener expediente',
            details: error.message
        });
    }
});

// ========== OBTENER CONSULTAS DEL EXPEDIENTE (HISTORIAL) ==========
router.get('/paciente/:pacienteId/consultas', async (req, res) => {
    try {
        console.log('📥 GET /api/expedientes/paciente/:pacienteId/consultas');
        console.log('📋 pacienteId:', req.params.pacienteId);
        
        const expediente = await ExpedienteRepository.findByPacienteId(req.params.pacienteId);
        
        if (!expediente) {
            return res.json({
                success: true,
                consultas: [],
                message: 'No hay expediente para este paciente'
            });
        }
        
        // Ordenar consultas por fecha (más reciente primero)
        const consultasOrdenadas = expediente.consultas.sort((a, b) => 
            new Date(b.fechaConsulta) - new Date(a.fechaConsulta)
        );
        
        res.json({
            success: true,
            consultas: consultasOrdenadas,
            count: consultasOrdenadas.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo consultas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener consultas',
            details: error.message
        });
    }
});

// ========== ACTUALIZAR HISTORIA CLÍNICA ==========
router.put('/:expedienteId/historia-clinica', async (req, res) => {
    try {
        console.log('📥 PUT /api/expedientes/:expedienteId/historia-clinica');
        console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));
        
        const { historiaClinica } = req.body;
        
        if (!historiaClinica || typeof historiaClinica !== 'object') {
            console.error('❌ Historia clínica inválida o no proporcionada');
            return res.status(400).json({
                success: false,
                error: 'Datos de historia clínica requeridos',
                received: req.body
            });
        }
        
        console.log('🔄 Actualizando expediente:', req.params.expedienteId);
        
        const updatedExpediente = await ExpedienteRepository.updateHistoriaClinica(
            req.params.expedienteId,
            historiaClinica
        );
        
        if (!updatedExpediente) {
            console.error('❌ Expediente no encontrado');
            return res.status(404).json({
                success: false,
                error: 'Expediente no encontrado'
            });
        }
        
        console.log('✅ Historia clínica actualizada correctamente');
        
        res.json({
            success: true,
            message: 'Historia clínica actualizada correctamente',
            expediente: updatedExpediente
        });
    } catch (error) {
        console.error('❌ Error actualizando historia clínica:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar historia clínica',
            details: error.message
        });
    }
});

// ========== ACTUALIZAR RESULTADOS DE ESTUDIOS ==========
router.put('/:expedienteId/resultados-estudios', async (req, res) => {
    try {
        console.log('📥 PUT /api/expedientes/:expedienteId/resultados-estudios');
        
        const { resultadosEstudios } = req.body;
        
        const updatedExpediente = await ExpedienteRepository.updateResultadosEstudios(
            req.params.expedienteId,
            resultadosEstudios
        );
        
        if (!updatedExpediente) {
            return res.status(404).json({
                success: false,
                error: 'Expediente no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Resultados de estudios actualizados correctamente',
            expediente: updatedExpediente
        });
    } catch (error) {
        console.error('❌ Error actualizando resultados:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar resultados de estudios',
            details: error.message
        });
    }
});

// ========== GUARDAR CONSULTA COMPLETA ==========
router.post('/:expedienteId/consulta', async (req, res) => {
    try {
        console.log('📥 POST /api/expedientes/:expedienteId/consulta');
        console.log('📦 Body:', JSON.stringify(req.body, null, 2));
        
        const consultaData = req.body;
        
        if (!consultaData.fechaConsulta) {
            return res.status(400).json({
                success: false,
                error: 'Fecha de consulta requerida'
            });
        }
        
        if (typeof consultaData.fechaConsulta === 'string') {
            consultaData.fechaConsulta = new Date(consultaData.fechaConsulta);
        }
        
        const medicoId = consultaData.creadoPor || '';
        consultaData.creadoPor = medicoId;
        
        const updatedExpediente = await ExpedienteRepository.addConsulta(
            req.params.expedienteId,
            consultaData
        );
        
        if (!updatedExpediente) {
            return res.status(404).json({
                success: false,
                error: 'Expediente no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Consulta guardada correctamente',
            expediente: updatedExpediente
        });
    } catch (error) {
        console.error('❌ Error guardando consulta:', error);
        res.status(500).json({
            success: false,
            error: 'Error al guardar consulta',
            details: error.message
        });
    }
});

// ========== OBTENER HISTORIAL DE CONSULTAS ==========
router.get('/:expedienteId/consultas', async (req, res) => {
    try {
        console.log('📥 GET /api/expedientes/:expedienteId/consultas');
        
        const consultas = await ExpedienteRepository.getConsultas(req.params.expedienteId);
        
        res.json({
            success: true,
            consultas: consultas,
            count: consultas.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo consultas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener consultas',
            details: error.message
        });
    }
});

// ========== OBTENER CONSULTA ESPECÍFICA POR ID ==========
router.get('/:expedienteId/consulta/:consultaId', async (req, res) => {
    try {
        console.log('📥 GET /api/expedientes/:expedienteId/consulta/:consultaId');
        
        const { expedienteId, consultaId } = req.params;
        
        const expediente = await ExpedienteRepository.findById(expedienteId);
        
        if (!expediente) {
            return res.status(404).json({
                success: false,
                error: 'Expediente no encontrado'
            });
        }
        
        const consulta = expediente.consultas.find(c => c._id.toString() === consultaId);
        
        if (!consulta) {
            return res.status(404).json({
                success: false,
                error: 'Consulta no encontrada'
            });
        }
        
        res.json({
            success: true,
            consulta: consulta
        });
    } catch (error) {
        console.error('❌ Error obteniendo consulta:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener consulta',
            details: error.message
        });
    }
});

module.exports = router;