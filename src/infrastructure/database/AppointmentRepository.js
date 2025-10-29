const connections = require('./connections');

const AppointmentRepository = {
    async findAll() {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const appointments = await clinicConn.collection('appointments').find({}).toArray();
            return appointments;
        } catch (error) {
            console.error("Error al obtener citas:", error.message);
            throw error;
        }
    },

    async findById(appointmentId) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const ObjectId = require('mongodb').ObjectId;
            const appointment = await clinicConn.collection('appointments')
                .findOne({ _id: new ObjectId(appointmentId) });
            
            return appointment;
        } catch (error) {
            console.error("Error al buscar cita:", error.message);
            throw error;
        }
    },

    async findByMedicoId(medicoId) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            console.log('🔍 Buscando citas para médico:', medicoId);
            console.log('📋 Tipo de medicoId:', typeof medicoId);
            
            // ✅ IMPORTANTE: No convertir medicoId a ObjectId porque es un string
            const appointments = await clinicConn.collection('appointments')
                .find({ 
                    medicoId: medicoId  // Buscar como string
                })
                .toArray();
            
            console.log(`📊 Total de citas encontradas: ${appointments.length}`);
            
            // Mostrar todas las citas en la BD (para debug)
            if (appointments.length === 0) {
                console.log('⚠️ No se encontraron citas. Buscando TODAS las citas en la BD...');
                const todasCitas = await clinicConn.collection('appointments').find({}).toArray();
                console.log(`📋 Total de citas en BD: ${todasCitas.length}`);
                todasCitas.forEach((apt, i) => {
                    console.log(`  ${i+1}. medicoId="${apt.medicoId}" (tipo: ${typeof apt.medicoId})`);
                    console.log(`      pacienteId="${apt.pacienteId}" - ${apt.pacienteNombre}`);
                });
            } else {
                // Mostrar las citas encontradas
                appointments.forEach((apt, i) => {
                    console.log(`  ${i+1}. ${apt.pacienteNombre} - Fecha: ${apt.fecha} - Estado: ${apt.estado}`);
                });
            }
            
            return appointments;
        } catch (error) {
            console.error("❌ Error al buscar citas por médico:", error.message);
            throw error;
        }
    },

    async findByPatientId(patientId) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const ObjectId = require('mongodb').ObjectId;
            const appointments = await clinicConn.collection('appointments')
                .find({ pacienteId: new ObjectId(patientId) })
                .toArray();
            
            return appointments;
        } catch (error) {
            console.error("Error al buscar citas por paciente:", error.message);
            throw error;
        }
    },

    async findByDateRange(startDate, endDate) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const appointments = await clinicConn.collection('appointments')
                .find({
                    fecha: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                })
                .toArray();
            
            return appointments;
        } catch (error) {
            console.error("Error al buscar citas por rango:", error.message);
            throw error;
        }
    },

    async save(appointmentData) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const result = await clinicConn.collection('appointments').insertOne({
                ...appointmentData,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            return result;
        } catch (error) {
            console.error("Error al guardar cita:", error.message);
            throw error;
        }
    },

    async update(appointmentId, updateData) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const ObjectId = require('mongodb').ObjectId;
            const result = await clinicConn.collection('appointments').findOneAndUpdate(
                { _id: new ObjectId(appointmentId) },
                { 
                    $set: { 
                        ...updateData, 
                        updatedAt: new Date() 
                    } 
                },
                { returnDocument: 'after' }
            );

            return result.value;
        } catch (error) {
            console.error("Error al actualizar cita:", error.message);
            throw error;
        }
    }
};

module.exports = AppointmentRepository;