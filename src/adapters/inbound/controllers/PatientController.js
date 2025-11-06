//src/adapters/inbound/controllers/PatientController.js

//src/adapters/inbound/controllers/PatientController.js

const express = require('express');
const PatientRepository = require('../../../infrastructure/database/PatientRepository');

// ========== IMPORTAR VALIDACIONES ==========
const { handleValidationErrors } = require('../middleware/validationHandler');
const {
    createPatientValidation,
    updatePatientValidation,
    patientIdValidation,
    searchPatientValidation,
    addHistoryValidation
} = require('../validators/patientValidators');

const router = express.Router();

// ========== OBTENER TODOS LOS PACIENTES ==========
router.get('/', async (req, res) => {
    try {
        console.log('📥 Solicitud GET /api/patients recibida');
        const patients = await PatientRepository.findAll();
        
        console.log(`✅ Se encontraron ${patients.length} pacientes`);
        
        res.json({
            success: true,
            patients: patients,
            count: patients.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo pacientes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener pacientes',
            details: error.message
        });
    }
});

// ========== OBTENER PACIENTE POR ID ==========
router.get('/:id', ...patientIdValidation, handleValidationErrors, async (req, res) => {
    try {
        console.log('📥 Solicitud GET /api/patients/:id recibida para ID:', req.params.id);
        const patient = await PatientRepository.findById(req.params.id);
        
        if (!patient) {
            console.log('⚠️ Paciente no encontrado');
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }
        
        console.log('✅ Paciente encontrado:', patient.nombre);
        
        res.json({
            success: true,
            patient: patient
        });
    } catch (error) {
        console.error('❌ Error obteniendo paciente:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener paciente',
            details: error.message
        });
    }
});

// ========== BUSCAR PACIENTES POR NOMBRE ==========
router.get('/search/:term', ...searchPatientValidation, handleValidationErrors, async (req, res) => {
    try {
        const patients = await PatientRepository.searchByName(req.params.term);
                
        res.json({
            success: true,
            patients: patients,
            count: patients.length
        });
    } catch (error) {
        console.error('❌ Error buscando pacientes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al buscar pacientes',
            details: error.message
        });
    }
});

// ========== CREAR PACIENTE ==========
router.post('/', ...createPatientValidation, handleValidationErrors, async (req, res) => {
    try {
        const {
            nombre,
            apellidos,
            fechaNacimiento,
            sexo,
            telefono,
            telefonoEmergencia,
            domicilio,
            correo,
            alergias,
            padecimientos,
            tipoSanguineo
        } = req.body;
        
        // Calcular edad
        const birthDate = new Date(fechaNacimiento);
        const today = new Date();
        let edad = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            edad--;
        }
                
        const patientData = {
            nombre,
            apellidos,
            fechaNacimiento: new Date(fechaNacimiento),
            edad,
            sexo,
            telefono,
            telefonoEmergencia,
            domicilio,
            correo: correo || null,
            alergias: alergias || 'Ninguna',
            padecimientos: padecimientos || 'Sin padecimientos',
            tipoSanguineo: tipoSanguineo || null,
            historialMedico: []
        };
        
        const result = await PatientRepository.save(patientData);
                
        res.status(201).json({
            success: true,
            message: 'Paciente creado exitosamente',
            patientId: result.insertedId
        });
    } catch (error) {
        console.error('Error creando paciente:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear paciente',
            details: error.message
        });
    }
});

// ========== ACTUALIZAR PACIENTE ==========
router.put('/:id', ...updatePatientValidation, handleValidationErrors, async (req, res) => {
    try {        
        const updateData = { ...req.body };
        delete updateData._id;
        
        if (updateData.fechaNacimiento) {
            updateData.fechaNacimiento = new Date(updateData.fechaNacimiento);
            
            const birthDate = updateData.fechaNacimiento;
            const today = new Date();
            let edad = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                edad--;
            }
            updateData.edad = edad;
        }
        
        const updatedPatient = await PatientRepository.update(req.params.id, updateData);
        
        if (!updatedPatient) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }
                
        res.json({
            success: true,
            message: 'Paciente actualizado exitosamente',
            patient: updatedPatient
        });
    } catch (error) {
        console.error('Error actualizando paciente:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar paciente',
            details: error.message
        });
    }
});

// ========== AGREGAR ENTRADA AL HISTORIAL ==========
router.post('/:id/historial', ...addHistoryValidation, handleValidationErrors, async (req, res) => {
    try {
        console.log('📥 Agregando entrada al historial del paciente:', req.params.id);
        
        const { fecha, tipoCita, descripcion, medicamentosPrevios } = req.body;
        
        const patient = await PatientRepository.findById(req.params.id);
        
        if (!patient) {
            console.log('Paciente no encontrado');
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }
        
        const historialEntry = {
            fecha: fecha ? new Date(fecha) : new Date(),
            tipoCita: tipoCita || 'Consulta General',
            descripcion: descripcion || '',
            medicamentosPrevios: medicamentosPrevios || []
        };
        
        const historialMedico = patient.historialMedico || [];
        historialMedico.push(historialEntry);
        
        console.log('Actualizando historial médico...');
        const updatedPatient = await PatientRepository.update(req.params.id, {
            historialMedico: historialMedico
        });
        
        res.json({
            success: true,
            message: 'Entrada agregada al historial médico',
            patient: updatedPatient
        });
    } catch (error) {
        console.error('Error agregando entrada al historial:', error);
        res.status(500).json({
            success: false,
            error: 'Error al agregar entrada al historial',
            details: error.message
        });
    }
});

module.exports = router;