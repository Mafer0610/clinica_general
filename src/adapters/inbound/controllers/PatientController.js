const express = require('express');
const PatientRepository = require('../../../infrastructure/database/PatientRepository');

const router = express.Router();

// ========== OBTENER TODOS LOS PACIENTES ==========
router.get('/', async (req, res) => {
    try {
        const patients = await PatientRepository.findAll();
        
        res.json({
            success: true,
            patients: patients,
            count: patients.length
        });
    } catch (error) {
        console.error('Error obteniendo pacientes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener pacientes'
        });
    }
});

// ========== OBTENER PACIENTE POR ID ==========
router.get('/:id', async (req, res) => {
    try {
        const patient = await PatientRepository.findById(req.params.id);
        
        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }
        
        res.json({
            success: true,
            patient: patient
        });
    } catch (error) {
        console.error('Error obteniendo paciente:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener paciente'
        });
    }
});

// ========== BUSCAR PACIENTES POR NOMBRE ==========
router.get('/search/:term', async (req, res) => {
    try {
        const patients = await PatientRepository.searchByName(req.params.term);
        
        res.json({
            success: true,
            patients: patients,
            count: patients.length
        });
    } catch (error) {
        console.error('Error buscando pacientes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al buscar pacientes'
        });
    }
});

// ========== CREAR PACIENTE ==========
router.post('/', async (req, res) => {
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
        
        // Validaciones básicas
        if (!nombre || !apellidos || !fechaNacimiento || !sexo || !telefono || !telefonoEmergencia || !domicilio) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos'
            });
        }
        
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
            error: 'Error al crear paciente'
        });
    }
});

// ========== ACTUALIZAR PACIENTE ==========
router.put('/:id', async (req, res) => {
    try {
        const updateData = { ...req.body };
        delete updateData._id; // No actualizar el _id
        
        // Si se actualiza la fecha de nacimiento, recalcular edad
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
            error: 'Error al actualizar paciente'
        });
    }
});

// ========== AGREGAR ENTRADA AL HISTORIAL MÉDICO ==========
router.post('/:id/historial', async (req, res) => {
    try {
        const { fecha, tipo, descripcion, medicamentosPrevios } = req.body;
        
        const patient = await PatientRepository.findById(req.params.id);
        
        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }
        
        const historialEntry = {
            fecha: fecha ? new Date(fecha) : new Date(),
            tipo: tipo || 'Consulta General',
            descripcion: descripcion || '',
            medicamentosPrevios: medicamentosPrevios || []
        };
        
        const historialMedico = patient.historialMedico || [];
        historialMedico.push(historialEntry);
        
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
            error: 'Error al agregar entrada al historial'
        });
    }
});

module.exports = router;