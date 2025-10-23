const express = require('express');
const AppointmentRepository = require('../../../infrastructure/database/AppointmentRepository');
const PatientRepository = require('../../../infrastructure/database/PatientRepository');

const router = express.Router();

// ========== OBTENER TODAS LAS CITAS ==========
router.get('/', async (req, res) => {
    try {
        const appointments = await AppointmentRepository.findAll();
        
        // Enriquecer con información del paciente
        const enrichedAppointments = await Promise.all(
            appointments.map(async (appointment) => {
                const patient = await PatientRepository.findById(appointment.pacienteId);
                return {
                    ...appointment,
                    pacienteNombre: patient ? `${patient.nombre} ${patient.apellidos}` : 'Paciente desconocido'
                };
            })
        );
        
        res.json({
            success: true,
            appointments: enrichedAppointments,
            count: enrichedAppointments.length
        });
    } catch (error) {
        console.error('Error obteniendo citas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener citas'
        });
    }
});

// ========== OBTENER CITAS POR RANGO DE FECHAS ==========
router.get('/range', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Fechas de inicio y fin requeridas'
            });
        }
        
        const appointments = await AppointmentRepository.findByDateRange(startDate, endDate);
        
        res.json({
            success: true,
            appointments: appointments,
            count: appointments.length
        });
    } catch (error) {
        console.error('Error obteniendo citas por rango:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener citas'
        });
    }
});

// ========== OBTENER CITAS DE UN MÉDICO ==========
router.get('/medico/:medicoId', async (req, res) => {
    try {
        const appointments = await AppointmentRepository.findByMedicoId(req.params.medicoId);
        
        // Enriquecer con información del paciente
        const enrichedAppointments = await Promise.all(
            appointments.map(async (appointment) => {
                const patient = await PatientRepository.findById(appointment.pacienteId);
                return {
                    ...appointment,
                    pacienteNombre: patient ? `${patient.nombre} ${patient.apellidos}` : 'Paciente desconocido'
                };
            })
        );
        
        res.json({
            success: true,
            appointments: enrichedAppointments,
            count: enrichedAppointments.length
        });
    } catch (error) {
        console.error('Error obteniendo citas del médico:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener citas'
        });
    }
});

// ========== OBTENER CITAS DE UN PACIENTE ==========
router.get('/patient/:patientId', async (req, res) => {
    try {
        const appointments = await AppointmentRepository.findByPatientId(req.params.patientId);
        
        res.json({
            success: true,
            appointments: appointments,
            count: appointments.length
        });
    } catch (error) {
        console.error('Error obteniendo citas del paciente:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener citas'
        });
    }
});

// ========== CREAR CITA ==========
router.post('/', async (req, res) => {
    try {
        const {
            pacienteId,
            pacienteNombre,
            medicoId,
            fecha,
            hora,
            tipoCita,
            descripcion
        } = req.body;
        
        // Validaciones
        if (!pacienteId || !medicoId || !fecha || !hora || !tipoCita) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos'
            });
        }
        
        const ObjectId = require('mongodb').ObjectId;
        
        const appointmentData = {
            pacienteId: new ObjectId(pacienteId),
            pacienteNombre: pacienteNombre,
            medicoId: medicoId,
            fecha: new Date(fecha),
            hora: hora,
            tipoCita: tipoCita,
            descripcion: descripcion || '',
            estado: 'pendiente',
            recordatorioEnviado: false,
            confirmada: false
        };
        
        const result = await AppointmentRepository.save(appointmentData);
        
        res.status(201).json({
            success: true,
            message: 'Cita creada exitosamente',
            appointmentId: result.insertedId
        });
    } catch (error) {
        console.error('Error creando cita:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear cita'
        });
    }
});

// ========== ACTUALIZAR CITA ==========
router.put('/:id', async (req, res) => {
    try {
        const updateData = { ...req.body };
        delete updateData._id; // No actualizar el _id
        
        if (updateData.fecha) {
            updateData.fecha = new Date(updateData.fecha);
        }
        
        if (updateData.pacienteId) {
            const ObjectId = require('mongodb').ObjectId;
            updateData.pacienteId = new ObjectId(updateData.pacienteId);
        }
        
        const updatedAppointment = await AppointmentRepository.update(req.params.id, updateData);
        
        if (!updatedAppointment) {
            return res.status(404).json({
                success: false,
                error: 'Cita no encontrada'
            });
        }
        
        res.json({
            success: true,
            message: 'Cita actualizada exitosamente',
            appointment: updatedAppointment
        });
    } catch (error) {
        console.error('Error actualizando cita:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar cita'
        });
    }
});

module.exports = router;