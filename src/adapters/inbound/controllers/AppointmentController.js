const express = require('express');
const AppointmentRepository = require('../../../infrastructure/database/AppointmentRepository');
const PatientRepository = require('../../../infrastructure/database/PatientRepository');

// ========== IMPORTAR VALIDACIONES ==========
const { handleValidationErrors } = require('../middleware/validationHandler');
const {
    createAppointmentValidation,
    updateAppointmentValidation,
    appointmentIdValidation,
    dateRangeValidation,
    medicoIdValidation,
    patientIdValidation
} = require('../validators/appointmentValidators');

const router = express.Router();

// ========== FUNCIÓN AUXILIAR PARA CONVERTIR TIPO ==========
function obtenerTipoPorNumero(numero) {
    const tipos = {
        '1': 'Consulta médica',
        '2': 'Consulta General',
        '3': 'Revision General',
        '4': 'Consulta de Control',
        '5': 'Consulta de Seguimiento'
    };
    return tipos[numero] || 'Consulta General';
}

// ========== OBTENER TODAS LAS CITAS ==========
router.get('/', async (req, res) => {
    try {
        const appointments = await AppointmentRepository.findAll();
        
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
router.get('/range', ...dateRangeValidation, handleValidationErrors, async (req, res) => {
    try {
        console.log('📥 GET /api/appointments/range');
        console.log('📋 Query params:', req.query);
        
        const { startDate, endDate } = req.query;
        
        const fechaInicio = new Date(startDate);
        const fechaFin = new Date(endDate);
        
        console.log('📅 Rango de fechas:', {
            inicio: fechaInicio.toISOString(),
            fin: fechaFin.toISOString()
        });
        
        // Obtener citas del repositorio
        const appointments = await AppointmentRepository.findByDateRange(
            fechaInicio.toISOString(),
            fechaFin.toISOString()
        );
        
        console.log(`✅ Se encontraron ${appointments.length} citas`);
        
        // Enriquecer con información del paciente
        const enrichedAppointments = await Promise.all(
            appointments.map(async (appointment) => {
                try {
                    const patient = await PatientRepository.findById(appointment.pacienteId.toString());
                    return {
                        ...appointment,
                        pacienteNombre: patient 
                            ? `${patient.nombre} ${patient.apellidos}` 
                            : appointment.pacienteNombre || 'Paciente desconocido'
                    };
                } catch (error) {
                    console.error('Error obteniendo paciente:', error);
                    return {
                        ...appointment,
                        pacienteNombre: appointment.pacienteNombre || 'Paciente desconocido'
                    };
                }
            })
        );
        
        console.log('✅ Citas enriquecidas con información de pacientes');
        
        // Respuesta exitosa
        res.json({
            success: true,
            appointments: enrichedAppointments,
            count: enrichedAppointments.length,
            dateRange: {
                start: fechaInicio.toISOString(),
                end: fechaFin.toISOString()
            }
        });
        
    } catch (error) {
        console.error(' Error obteniendo citas por rango:', error);
        console.error('Stack:', error.stack);
        
        res.status(500).json({
            success: false,
            error: 'Error al obtener citas',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ========== OBTENER CITAS DE UN MÉDICO ==========
router.get('/medico/:medicoId', ...medicoIdValidation, handleValidationErrors, async (req, res) => {
    try {
        console.log('📥 GET /medico/:medicoId - ID:', req.params.medicoId);
        
        const appointments = await AppointmentRepository.findByMedicoId(req.params.medicoId);
        
        console.log(`📊 Citas encontradas en BD: ${appointments.length}`);
        
        // Log cada cita para debug
        appointments.forEach((apt, i) => {
            console.log(`  ${i+1}. ${apt.pacienteNombre} - ${apt.fecha} - Estado: ${apt.estado}`);
        });
        
        const enrichedAppointments = await Promise.all(
            appointments.map(async (appointment) => {
                try {
                    const patient = await PatientRepository.findById(appointment.pacienteId);
                    return {
                        ...appointment,
                        pacienteNombre: patient ? `${patient.nombre} ${patient.apellidos}` : appointment.pacienteNombre || 'Paciente desconocido'
                    };
                } catch (error) {
                    console.warn(`⚠️ Error cargando paciente ${appointment.pacienteId}:`, error.message);
                    return {
                        ...appointment,
                        pacienteNombre: appointment.pacienteNombre || 'Paciente desconocido'
                    };
                }
            })
        );
        
        console.log(`✅ Enviando ${enrichedAppointments.length} citas al frontend`);
        
        res.json({
            success: true,
            appointments: enrichedAppointments,
            count: enrichedAppointments.length
        });
    } catch (error) {
        console.error(' Error obteniendo citas del médico:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener citas'
        });
    }
});

// ========== OBTENER CITAS DE UN PACIENTE ==========
router.get('/patient/:patientId', ...patientIdValidation, handleValidationErrors, async (req, res) => {
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
router.post('/', ...createAppointmentValidation, handleValidationErrors, async (req, res) => {
    try {
        console.log('📥 POST /api/appointments');
        console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));
        
        const {
            pacienteId,
            pacienteNombre,
            medicoId,
            fecha,
            hora,
            tipoCita,
            descripcion,
            sintomas
        } = req.body;
        
        const ObjectId = require('mongodb').ObjectId;
        
        const tipoFinal = tipoCita;
        
        let fechaDate;
        
        if (fecha.includes('T')) {
            fechaDate = new Date(fecha);
            console.log('📅 Fecha ISO recibida:', fecha);
        } else {
            const [year, month, day] = fecha.split('-');
            fechaDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
            console.log('📅 Fecha simple recibida:', fecha);
        }
        
        const appointmentData = {
            pacienteId: new ObjectId(pacienteId),
            pacienteNombre: pacienteNombre || 'Paciente',
            medicoId: medicoId,
            fecha: fechaDate,
            hora: hora,
            tipoCita: tipoFinal,
            descripcion: descripcion || '',
            sintomas: sintomas || descripcion || '',
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
        console.error(' Error creando cita:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Error al crear cita',
            details: error.message
        });
    }
});

// ========== ACTUALIZAR CITA ==========
router.put('/:id', updateAppointmentValidation, handleValidationErrors, async (req, res) => {
    try {
        const updateData = { ...req.body };
        delete updateData._id;
        
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

// ELIMINAR CITA (agregar antes de module.exports)
router.delete('/:id', appointmentIdValidation, handleValidationErrors, async (req, res) => {
    try {
        console.log('🗑️ DELETE /api/appointments/:id');
        console.log('📋 Appointment ID:', req.params.id);
        
        const clinicConn = await require('../../../infrastructure/database/connections').connectClinic();
        
        if (clinicConn.readyState !== 1) {
            throw new Error('MongoDB Clinic no está conectado');
        }

        const ObjectId = require('mongodb').ObjectId;
        
        // Verificar que la cita existe
        const citaExistente = await clinicConn.collection('appointments')
            .findOne({ _id: new ObjectId(req.params.id) });
        
        if (!citaExistente) {
            return res.status(404).json({
                success: false,
                error: 'Cita no encontrada'
            });
        }
        
        // Eliminar la cita
        const result = await clinicConn.collection('appointments')
            .deleteOne({ _id: new ObjectId(req.params.id) });
        
        if (result.deletedCount === 0) {
            return res.status(500).json({
                success: false,
                error: 'No se pudo eliminar la cita'
            });
        }
        
        console.log('✅ Cita eliminada correctamente');
        
        res.json({
            success: true,
            message: 'Cita eliminada correctamente',
            deletedId: req.params.id
        });
    } catch (error) {
        console.error('❌ Error eliminando cita:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar cita',
            details: error.message
        });
    }
});

module.exports = router;