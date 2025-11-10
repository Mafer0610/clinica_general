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

// ========== FUNCIÓN PARA VERIFICAR DISPONIBILIDAD DE HORARIO ==========
async function verificarDisponibilidadHorario(medicoId, fecha, hora, appointmentIdExcluir = null) {
    try {
        console.log('🔍 Verificando disponibilidad de horario...');
        console.log(`   📅 Fecha: ${fecha}`);
        console.log(`   🕐 Hora: ${hora}`);
        console.log(`   👨‍⚕️ Médico: ${medicoId}`);

        // Parsear la hora solicitada
        const [horaInicio, minutosInicio] = hora.split(':').map(num => parseInt(num, 10));
        
        // Crear fecha completa con hora de inicio
        const fechaObj = new Date(fecha);
        const inicioSolicitado = new Date(
            fechaObj.getFullYear(),
            fechaObj.getMonth(),
            fechaObj.getDate(),
            horaInicio,
            minutosInicio,
            0,
            0
        );

        // Calcular hora de fin (1 hora después)
        const finSolicitado = new Date(inicioSolicitado);
        finSolicitado.setHours(finSolicitado.getHours() + 1);

        console.log(`   🔹 Inicio solicitado: ${inicioSolicitado.toLocaleString('es-MX')}`);
        console.log(`   🔹 Fin del bloque: ${finSolicitado.toLocaleString('es-MX')}`);

        // Obtener todas las citas del médico para ese día
        const inicioDia = new Date(fechaObj);
        inicioDia.setHours(0, 0, 0, 0);
        
        const finDia = new Date(fechaObj);
        finDia.setHours(23, 59, 59, 999);

        const citasDelDia = await AppointmentRepository.findByMedicoAndDateRange(
            medicoId,
            inicioDia.toISOString(),
            finDia.toISOString()
        );

        console.log(`   📊 Citas encontradas ese día: ${citasDelDia.length}`);

        // Verificar conflictos de horario
        for (const cita of citasDelDia) {
            // Excluir la cita actual si estamos actualizando
            if (appointmentIdExcluir && cita._id.toString() === appointmentIdExcluir) {
                continue;
            }

            // Saltar citas canceladas
            if (cita.estado === 'cancelada') {
                continue;
            }

            // Crear fecha+hora de la cita existente
            const [horaCitaH, horaCitaM] = cita.hora.split(':').map(num => parseInt(num, 10));
            const fechaCitaObj = new Date(cita.fecha);
            const inicioCita = new Date(
                fechaCitaObj.getFullYear(),
                fechaCitaObj.getMonth(),
                fechaCitaObj.getDate(),
                horaCitaH,
                horaCitaM,
                0,
                0
            );

            // Calcular fin de la cita existente (1 hora después)
            const finCita = new Date(inicioCita);
            finCita.setHours(finCita.getHours() + 1);

            console.log(`   🔸 Cita existente: ${inicioCita.toLocaleString('es-MX')} - ${finCita.toLocaleString('es-MX')}`);

            // Verificar si hay conflicto
            // Un conflicto ocurre si:
            // 1. El inicio solicitado está dentro del bloque ocupado
            // 2. El fin solicitado está dentro del bloque ocupado
            // 3. El bloque solicitado contiene completamente el bloque ocupado
            const hayConflicto = 
                (inicioSolicitado >= inicioCita && inicioSolicitado < finCita) || // Inicia durante cita existente
                (finSolicitado > inicioCita && finSolicitado <= finCita) ||       // Termina durante cita existente
                (inicioSolicitado <= inicioCita && finSolicitado >= finCita);     // Contiene la cita existente

            if (hayConflicto) {
                console.log('   ❌ CONFLICTO DETECTADO');
                return {
                    disponible: false,
                    mensaje: `Ya existe una cita agendada a las ${cita.hora}. El horario estará disponible después de las ${finCita.getHours()}:${String(finCita.getMinutes()).padStart(2, '0')}`,
                    citaConflicto: {
                        paciente: cita.pacienteNombre,
                        hora: cita.hora,
                        horaDisponible: `${finCita.getHours()}:${String(finCita.getMinutes()).padStart(2, '0')}`
                    }
                };
            }
        }

        console.log('   ✅ Horario disponible');
        return {
            disponible: true,
            mensaje: 'Horario disponible'
        };

    } catch (error) {
        console.error('❌ Error verificando disponibilidad:', error);
        throw error;
    }
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
        
        const appointments = await AppointmentRepository.findByDateRange(
            fechaInicio.toISOString(),
            fechaFin.toISOString()
        );
        
        console.log(`✅ Se encontraron ${appointments.length} citas del servidor`);
        
        const enrichedAppointments = await Promise.all(
            appointments.map(async (appointment) => {
                try {
                    const nombreExistente = appointment.pacienteNombre;
                    let patient = null;
                    
                    if (appointment.pacienteId) {
                        try {
                            const patientResponse = await PatientRepository.findById(appointment.pacienteId.toString());
                            if (patientResponse) {
                                patient = patientResponse;
                            }
                        } catch (fetchError) {
                            console.warn(`⚠️ No se pudo cargar paciente ${appointment.pacienteId}:`, fetchError.message);
                        }
                    }
                    
                    return {
                        ...appointment,
                        pacienteNombre: patient 
                            ? `${patient.nombre} ${patient.apellidos}` 
                            : nombreExistente || 'Paciente desconocido'
                    };
                } catch (error) {
                    console.error('❌ Error procesando cita:', error);
                    return {
                        ...appointment,
                        pacienteNombre: appointment.pacienteNombre || 'Paciente desconocido'
                    };
                }
            })
        );
        
        console.log('✅ Citas enriquecidas con información de pacientes');
        
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
        console.error('❌ Error obteniendo citas por rango:', error);
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
        console.error('❌ Error obteniendo citas del médico:', error);
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

// ========== CREAR CITA (CON VALIDACIÓN DE DISPONIBILIDAD) ==========
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

        // ✅ VERIFICAR DISPONIBILIDAD DE HORARIO
        const disponibilidad = await verificarDisponibilidadHorario(medicoId, fecha, hora);
        
        if (!disponibilidad.disponible) {
            console.log('❌ Horario no disponible');
            return res.status(409).json({
                success: false,
                error: 'Horario no disponible',
                mensaje: disponibilidad.mensaje,
                conflicto: disponibilidad.citaConflicto
            });
        }
        
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
        
        console.log('✅ Cita creada exitosamente');
        
        res.status(201).json({
            success: true,
            message: 'Cita creada exitosamente',
            appointmentId: result.insertedId
        });
    } catch (error) {
        console.error('❌ Error creando cita:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Error al crear cita',
            details: error.message
        });
    }
});

// ========== ACTUALIZAR CITA (CON VALIDACIÓN DE DISPONIBILIDAD) ==========
router.put('/:id', updateAppointmentValidation, handleValidationErrors, async (req, res) => {
    try {
        const updateData = { ...req.body };
        delete updateData._id;
        
        // Si se está cambiando fecha u hora, verificar disponibilidad
        if (updateData.fecha || updateData.hora) {
            // Obtener cita actual
            const citaActual = await AppointmentRepository.findById(req.params.id);
            
            if (!citaActual) {
                return res.status(404).json({
                    success: false,
                    error: 'Cita no encontrada'
                });
            }
            
            // Usar la fecha y hora actualizadas o las existentes
            const fechaVerificar = updateData.fecha ? new Date(updateData.fecha) : citaActual.fecha;
            const horaVerificar = updateData.hora || citaActual.hora;
            const medicoVerificar = updateData.medicoId || citaActual.medicoId;
            
            // Verificar disponibilidad (excluyendo esta cita)
            const disponibilidad = await verificarDisponibilidadHorario(
                medicoVerificar,
                fechaVerificar,
                horaVerificar,
                req.params.id
            );
            
            if (!disponibilidad.disponible) {
                console.log('❌ Horario no disponible para actualización');
                return res.status(409).json({
                    success: false,
                    error: 'Horario no disponible',
                    mensaje: disponibilidad.mensaje,
                    conflicto: disponibilidad.citaConflicto
                });
            }
        }
        
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

// ========== ELIMINAR CITA ==========
router.delete('/:id', appointmentIdValidation, handleValidationErrors, async (req, res) => {
    try {
        console.log('🗑️ DELETE /api/appointments/:id');
        console.log('📋 Appointment ID:', req.params.id);
        
        const clinicConn = await require('../../../infrastructure/database/connections').connectClinic();
        
        if (clinicConn.readyState !== 1) {
            throw new Error('MongoDB Clinic no está conectado');
        }

        const ObjectId = require('mongodb').ObjectId;
        
        const citaExistente = await clinicConn.collection('appointments')
            .findOne({ _id: new ObjectId(req.params.id) });
        
        if (!citaExistente) {
            return res.status(404).json({
                success: false,
                error: 'Cita no encontrada'
            });
        }
        
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

// ========== VERIFICAR DISPONIBILIDAD DE HORARIO (ENDPOINT PÚBLICO) ==========
router.post('/verificar-disponibilidad', async (req, res) => {
    try {
        const { medicoId, fecha, hora, appointmentId } = req.body;
        
        if (!medicoId || !fecha || !hora) {
            return res.status(400).json({
                success: false,
                error: 'medicoId, fecha y hora son requeridos'
            });
        }
        
        const disponibilidad = await verificarDisponibilidadHorario(
            medicoId,
            fecha,
            hora,
            appointmentId || null
        );
        
        res.json({
            success: true,
            ...disponibilidad
        });
    } catch (error) {
        console.error('❌ Error verificando disponibilidad:', error);
        res.status(500).json({
            success: false,
            error: 'Error al verificar disponibilidad'
        });
    }
});

module.exports = router;