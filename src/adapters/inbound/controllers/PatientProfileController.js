const express = require('express');
const PatientRepository = require('../../../infrastructure/database/PatientRepository');
const AppointmentRepository = require('../../../infrastructure/database/AppointmentRepository');

const router = express.Router();

// ========== OBTENER PERFIL COMPLETO DEL PACIENTE POR EMAIL ==========
router.get('/profile/:email', async (req, res) => {
    try {
        console.log('📥 Obteniendo perfil del paciente con email:', req.params.email);
        
        // Buscar paciente por email
        const patient = await PatientRepository.findByEmail(req.params.email);
        
        if (!patient) {
            console.log('⚠️ Paciente no encontrado con email:', req.params.email);
            return res.json({
                success: true,
                hasProfile: false,
                patient: null
            });
        }

        console.log('✅ Paciente encontrado:', patient.nombre);
        
        // Obtener citas del paciente
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
            error: 'Error al obtener perfil del paciente'
        });
    }
});

// ========== CREAR O ACTUALIZAR PERFIL DEL PACIENTE ==========
router.post('/profile/upsert', async (req, res) => {
    try {
        console.log('📥 Crear/Actualizar perfil del paciente');
        
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

        // Validaciones
        if (!email || !nombre || !apellidos) {
            return res.status(400).json({
                success: false,
                error: 'Email, nombre y apellidos son requeridos'
            });
        }

        // Buscar si ya existe
        let patient = await PatientRepository.findByEmail(email);

        if (patient) {
            // Actualizar paciente existente
            console.log('🔄 Actualizando paciente existente:', patient._id);
            
            const updateData = {};
            if (nombre) updateData.nombre = nombre;
            if (apellidos) updateData.apellidos = apellidos;
            if (fechaNacimiento) {
                updateData.fechaNacimiento = new Date(fechaNacimiento);
                // Calcular edad
                const birthDate = new Date(fechaNacimiento);
                const today = new Date();
                let edad = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    edad--;
                }
                updateData.edad = edad;
            }
            if (sexo) updateData.sexo = sexo;
            if (telefono) updateData.telefono = telefono;
            if (telefonoEmergencia) updateData.telefonoEmergencia = telefonoEmergencia;
            if (domicilio) updateData.domicilio = domicilio;
            if (alergias !== undefined) updateData.alergias = alergias;
            if (padecimientos !== undefined) updateData.padecimientos = padecimientos;
            if (tipoSanguineo) updateData.tipoSanguineo = tipoSanguineo;

            const updatedPatient = await PatientRepository.update(patient._id.toString(), updateData);

            return res.json({
                success: true,
                message: 'Perfil actualizado correctamente',
                patient: updatedPatient,
                isNew: false
            });
        } else {
            // Crear nuevo paciente
            console.log('✨ Creando nuevo perfil de paciente');
            
            // Calcular edad si hay fecha de nacimiento
            let edad = null;
            if (fechaNacimiento) {
                const birthDate = new Date(fechaNacimiento);
                const today = new Date();
                edad = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    edad--;
                }
            }

            const patientData = {
                correo: email,
                nombre: nombre,
                apellidos: apellidos,
                fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
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

            const result = await PatientRepository.save(patientData);
            const newPatient = await PatientRepository.findById(result.insertedId.toString());

            return res.status(201).json({
                success: true,
                message: 'Perfil creado correctamente',
                patient: newPatient,
                isNew: true
            });
        }
    } catch (error) {
        console.error('❌ Error en upsert de perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error al guardar perfil del paciente'
        });
    }
});

// ========== OBTENER PRÓXIMAS CITAS DEL PACIENTE ==========
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
        
        // Filtrar solo citas futuras y ordenar por fecha
        const now = new Date();
        const upcomingAppointments = appointments
            .filter(apt => new Date(apt.fecha) >= now)
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

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
        
        // Filtrar solo citas pasadas y ordenar por fecha descendente
        const now = new Date();
        const pastAppointments = appointments
            .filter(apt => new Date(apt.fecha) < now)
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

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

module.exports = router;