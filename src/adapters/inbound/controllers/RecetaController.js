const express = require('express');
const RecetaRepository = require('../../../infrastructure/database/RecetaRepository');
const PatientRepository = require('../../../infrastructure/database/PatientRepository');

const router = express.Router();

// ========== GUARDAR NUEVA RECETA ==========
router.post('/', async (req, res) => {
    try {
        console.log('📥 POST /api/recetas');
        console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));
        
        const {
            pacienteId,
            pacienteNombre,
            pacienteEdad,
            medicoId,
            medicoNombre,
            medicoCedula,
            peso,
            estatura,
            frecuenciaCardiaca,
            frecuenciaRespiratoria,
            tensionArterial,
            temperatura,
            diagnostico,
            prescripcion,
            recomendaciones,
            fecha
        } = req.body;
        
        // Validaciones básicas
        if (!pacienteId || !pacienteNombre || !prescripcion) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: pacienteId, pacienteNombre, prescripcion'
            });
        }
        
        const ObjectId = require('mongodb').ObjectId;
        
        const recetaData = {
            pacienteId: new ObjectId(pacienteId),
            pacienteNombre: pacienteNombre,
            pacienteEdad: pacienteEdad || null,
            medicoId: medicoId || '',
            medicoNombre: medicoNombre || 'Dr. Asignado',
            medicoCedula: medicoCedula || '',
            peso: peso || '',
            estatura: estatura || '',
            frecuenciaCardiaca: frecuenciaCardiaca || '',
            frecuenciaRespiratoria: frecuenciaRespiratoria || '',
            tensionArterial: tensionArterial || '',
            temperatura: temperatura || '',
            diagnostico: diagnostico || '',
            prescripcion: prescripcion,
            recomendaciones: recomendaciones || '',
            fecha: fecha ? new Date(fecha) : new Date()
        };
        
        const result = await RecetaRepository.save(recetaData);
        
        res.status(201).json({
            success: true,
            message: 'Receta guardada exitosamente',
            recetaId: result.insertedId
        });
    } catch (error) {
        console.error('❌ Error guardando receta:', error);
        res.status(500).json({
            success: false,
            error: 'Error al guardar receta',
            details: error.message
        });
    }
});

// ========== OBTENER RECETAS DE UN PACIENTE ==========
router.get('/paciente/:patientId', async (req, res) => {
    try {
        console.log('📥 GET /api/recetas/paciente/:patientId');
        console.log('📋 patientId:', req.params.patientId);
        
        const recetas = await RecetaRepository.findByPatientId(req.params.patientId);
        
        res.json({
            success: true,
            recetas: recetas,
            count: recetas.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo recetas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener recetas',
            details: error.message
        });
    }
});

// ========== OBTENER RECETA POR ID ==========
router.get('/:recetaId', async (req, res) => {
    try {
        console.log('📥 GET /api/recetas/:recetaId');
        console.log('📋 recetaId:', req.params.recetaId);
        
        const receta = await RecetaRepository.findById(req.params.recetaId);
        
        if (!receta) {
            return res.status(404).json({
                success: false,
                error: 'Receta no encontrada'
            });
        }
        
        res.json({
            success: true,
            receta: receta
        });
    } catch (error) {
        console.error('❌ Error obteniendo receta:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener receta',
            details: error.message
        });
    }
});

module.exports = router;