// src/adapters/inbound/controllers/PatientProfileController.js

const express = require('express');
const PatientRepository = require('../../../infrastructure/database/PatientRepository');
const AppointmentRepository = require('../../../infrastructure/database/AppointmentRepository');
const { handleValidationErrors } = require('../middleware/validationHandler');
const {
    patientProfileEmailValidation,
    upsertPatientProfileValidation,
    appointmentActionValidation
} = require('../validators/expedienteValidators');

const router = express.Router();

// ========== OBTENER PERFIL COMPLETO DEL PACIENTE POR EMAIL ==========
router.get('/profile/:email', patientProfileEmailValidation, handleValidationErrors, async (req, res) => {
    try {
        const emailBuscado = decodeURIComponent(req.params.email);
        console.log('📥 Obteniendo perfil del paciente con email:', emailBuscado);
        
        const patient = await PatientRepository.findByEmail(emailBuscado);
        
        if (!patient) {
            console.log('⚠️ Paciente no encontrado con email:', emailBuscado);
            return res.json({
                success: true,
                hasProfile: false,
                patient: null,
                searchedEmail: emailBuscado
            });
        }

        console.log('✅ Paciente encontrado:', patient.nombre);
        
        const appointments = await AppointmentRepository.findByPatientId(patient._id.toString());
        
        res.json({
            success: true,
            hasProfile: true,
            patient: patient,
            appointments: appointments || [],
            appointmentsCount: appointments?.length || 0
        });
    } catch (error) {
        console.error('❌ Error obteniendo perfil del paciente:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener perfil del paciente',
            details: error.message
        });
    }
});

// ========== CREAR O ACTUALIZAR PERFIL DEL PACIENTE ==========
router.post('/profile/upsert', upsertPatientProfileValidation, handleValidationErrors, async (req, res) => {
    try {
        console.log('📥 POST /api/patient-profile/profile/upsert');
        console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));
        
        const {
            email,
            nombre,
            apellidos,
            fechaNacimiento,
            sexo,
            telefono,
            telefonoEmergencia,
            domicilio,
            alergias,
            padecimientos,
            tipoSanguineo
        } = req.body;

        if (!email) {
            console.error('❌ Email no proporcionado');
            return res.status(400).json({
                success: false,
                error: 'Email es requerido'
            });
        }

        if (!nombre || !apellidos) {
            console.error('❌ Nombre o apellidos no proporcionados');
            return res.status(400).json({
                success: false,
                error: 'Nombre y apellidos son requeridos'
            });
        }

        let patient = await PatientRepository.findByEmail(email);

        if (patient) {
            console.log('🔄 Actualizando paciente existente:', patient._id);
            
            const updateData = {};
            
            if (nombre !== undefined) updateData.nombre = nombre;
            if (apellidos !== undefined) updateData.apellidos = apellidos;
            
            if (fechaNacimiento !== undefined && fechaNacimiento !== null) {
                try {
                    updateData.fechaNacimiento = new Date(fechaNacimiento);
                    
                    const birthDate = new Date(fechaNacimiento);
                    const today = new Date();
                    let edad = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        edad--;
                    }
                    updateData.edad = edad;
                    console.log('📅 Edad calculada:', edad);
                } catch (error) {
                    console.error('❌ Error procesando fechaNacimiento:', error);
                }
            }
            
            if (sexo !== undefined) updateData.sexo = sexo;
            if (telefono !== undefined) updateData.telefono = telefono;
            if (telefonoEmergencia !== undefined) updateData.telefonoEmergencia = telefonoEmergencia;
            if (domicilio !== undefined) updateData.domicilio = domicilio;
            if (alergias !== undefined) updateData.alergias = alergias || 'Ninguna';
            if (padecimientos !== undefined) updateData.padecimientos = padecimientos || 'Sin padecimientos';
            
            if (tipoSanguineo !== undefined) {
                if (tipoSanguineo === '' || tipoSanguineo === null) {
                    updateData.tipoSanguineo = null;
                } else {
                    updateData.tipoSanguineo = tipoSanguineo;
                }
                console.log('💉 Actualizando tipo sanguíneo:', updateData.tipoSanguineo);
            }

            console.log('📝 Datos a actualizar:', JSON.stringify(updateData, null, 2));

            const updatedPatient = await PatientRepository.update(patient._id.toString(), updateData);

            if (!updatedPatient) {
                console.error('❌ No se pudo actualizar el paciente');
                return res.status(500).json({
                    success: false,
                    error: 'Error al actualizar paciente'
                });
            }

            console.log('✅ Paciente actualizado:', updatedPatient.nombre);

            return res.json({
                success: true,
                message: 'Perfil actualizado correctamente',
                patient: updatedPatient,
                isNew: false
            });
            
        } else {
            console.log('✨ Creando nuevo perfil de paciente');
            
            let edad = null;
            let fechaNacimientoDate = null;
            
            if (fechaNacimiento) {
                try {
                    fechaNacimientoDate = new Date(fechaNacimiento);
                    const today = new Date();
                    edad = today.getFullYear() - fechaNacimientoDate.getFullYear();
                    const monthDiff = today.getMonth() - fechaNacimientoDate.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < fechaNacimientoDate.getDate())) {
                        edad--;
                    }
                    console.log('📅 Edad calculada:', edad);
                } catch (error) {
                    console.error('❌ Error procesando fechaNacimiento:', error);
                    fechaNacimientoDate = null;
                }
            }

            const patientData = {
                correo: email,
                nombre: nombre,
                apellidos: apellidos,
                fechaNacimiento: fechaNacimientoDate,
                edad: edad,
                sexo: sexo || null,
                telefono: telefono || '',
                telefonoEmergencia: telefonoEmergencia || '',
                domicilio: domicilio || '',
                alergias: alergias || 'Ninguna',
                padecimientos: padecimientos || 'Sin padecimientos',
                tipoSanguineo: tipoSanguineo || null,
                historialMedico: []
            };

            console.log('📝 Datos del nuevo paciente:', JSON.stringify(patientData, null, 2));

            const result = await PatientRepository.save(patientData);
            
            if (!result || !result.insertedId) {
                console.error('❌ No se pudo crear el paciente');
                return res.status(500).json({
                    success: false,
                    error: 'Error al crear paciente'
                });
            }
            
            const newPatient = await PatientRepository.findById(result.insertedId.toString());

            if (!newPatient) {
                console.error('❌ No se pudo recuperar el paciente creado');
                return res.status(500).json({
                    success: false,
                    error: 'Error al recuperar paciente creado'
                });
            }

            console.log('✅ Nuevo paciente creado:', newPatient.nombre);

            return res.status(201).json({
                success: true,
                message: 'Perfil creado correctamente',
                patient: newPatient,
                isNew: true
            });
        }
    } catch (error) {
        console.error('❌ ERROR CRÍTICO en upsert de perfil:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Error al guardar perfil del paciente',
            details: error.message
        });
    }
});

// ========== OBTENER PRÓXIMAS CITAS DEL PACIENTE (FILTRADAS) ==========
router.get('/appointments/upcoming/:email', async (req, res) => {
    try {
        console.log('📥 Obteniendo próximas citas para:', req.params.email);
        
        const patient = await PatientRepository.findByEmail(req.params.email);
        
        if (!patient) {
            return res.json({
                success: true,
                appointments: []
            });
        }

        const appointments = await AppointmentRepository.findByPatientId(patient._id.toString());
        
        const now = new Date();
        const upcomingAppointments = appointments
            .filter(apt => {
                // ✅ CAMBIO: Excluir citas confirmadas
                if (apt.confirmada === true) {
                    console.log(`⏭️ Excluyendo cita confirmada: ${apt.pacienteNombre} - ${apt.fecha}`);
                    return false;
                }
                
                // ✅ CAMBIO: Excluir citas con estado "confirmada"
                if (apt.estado === 'confirmada') {
                    console.log(`⏭️ Excluyendo por estado confirmada: ${apt.pacienteNombre} - ${apt.fecha}`);
                    return false;
                }
                
                // Crear fecha completa con hora
                const [hours, minutes] = apt.hora.split(':');
                const aptDate = new Date(apt.fecha);
                aptDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                
                // Solo citas futuras
                return aptDate > now;
            })
            .sort((a, b) => {
                const dateA = new Date(a.fecha);
                const [hoursA, minutesA] = a.hora.split(':');
                dateA.setHours(parseInt(hoursA), parseInt(minutesA));
                
                const dateB = new Date(b.fecha);
                const [hoursB, minutesB] = b.hora.split(':');
                dateB.setHours(parseInt(hoursB), parseInt(minutesB));
                
                return dateA - dateB;
            });

        console.log(`✅ Citas próximas (sin confirmadas): ${upcomingAppointments.length}`);

        res.json({
            success: true,
            appointments: upcomingAppointments,
            count: upcomingAppointments.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo próximas citas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener próximas citas'
        });
    }
});

// ========== OBTENER HISTORIAL DE CITAS DEL PACIENTE ==========
router.get('/appointments/history/:email', async (req, res) => {
    try {
        console.log('📥 Obteniendo historial de citas para:', req.params.email);
        
        const patient = await PatientRepository.findByEmail(req.params.email);
        
        if (!patient) {
            return res.json({
                success: true,
                appointments: []
            });
        }

        const appointments = await AppointmentRepository.findByPatientId(patient._id.toString());
        
        const now = new Date();
        const pastAppointments = appointments
            .filter(apt => {
                const [hours, minutes] = apt.hora.split(':');
                const aptDate = new Date(apt.fecha);
                aptDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                
                return aptDate < now;
            })
            .sort((a, b) => {
                const dateA = new Date(a.fecha);
                const [hoursA, minutesA] = a.hora.split(':');
                dateA.setHours(parseInt(hoursA), parseInt(minutesA));
                
                const dateB = new Date(b.fecha);
                const [hoursB, minutesB] = b.hora.split(':');
                dateB.setHours(parseInt(hoursB), parseInt(minutesB));
                
                return dateB - dateA;
            });

        res.json({
            success: true,
            appointments: pastAppointments,
            count: pastAppointments.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo historial de citas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener historial de citas'
        });
    }
});

// ========== CONFIRMAR CITA (ACTUALIZADO) ==========
router.put('/appointments/:appointmentId/confirm', appointmentActionValidation, handleValidationErrors, async (req, res) => {
    try {
        console.log('✅ Confirmando cita:', req.params.appointmentId);
        
        // ✅ CAMBIO: Actualizar AMBOS campos
        const updatedAppointment = await AppointmentRepository.update(
            req.params.appointmentId,
            {
                confirmada: true,
                estado: 'confirmada'
            }
        );

        if (!updatedAppointment) {
            return res.status(404).json({
                success: false,
                error: 'Cita no encontrada'
            });
        }

        console.log('✅ Cita confirmada exitosamente');

        res.json({
            success: true,
            message: 'Cita confirmada correctamente',
            appointment: updatedAppointment
        });
    } catch (error) {
        console.error('❌ Error confirmando cita:', error);
        res.status(500).json({
            success: false,
            error: 'Error al confirmar cita'
        });
    }
});

// ========== CANCELAR CITA (CAMBIAR A DELETE) ==========
router.delete('/appointments/:appointmentId', appointmentActionValidation, handleValidationErrors, async (req, res) => {
    try {
        console.log('🗑️ Eliminando cita:', req.params.appointmentId);
        
        const connections = require('../../../infrastructure/database/connections');
        const clinicConn = await connections.connectClinic();
        
        if (clinicConn.readyState !== 1) {
            throw new Error('MongoDB Clinic no está conectado');
        }

        const ObjectId = require('mongodb').ObjectId;
        
        // Verificar que la cita existe
        const citaExistente = await clinicConn.collection('appointments')
            .findOne({ _id: new ObjectId(req.params.appointmentId) });
        
        if (!citaExistente) {
            return res.status(404).json({
                success: false,
                error: 'Cita no encontrada'
            });
        }
        
        // ✅ CAMBIO: Eliminar en lugar de actualizar
        const result = await clinicConn.collection('appointments')
            .deleteOne({ _id: new ObjectId(req.params.appointmentId) });
        
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
            deletedId: req.params.appointmentId
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