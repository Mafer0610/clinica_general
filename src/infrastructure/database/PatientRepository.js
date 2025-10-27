const connections = require('./connections');

const PatientRepository = {
    async findAll() {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const patients = await clinicConn.collection('patients').find({}).toArray();
            return patients;
        } catch (error) {
            console.error("Error al obtener pacientes:", error.message);
            throw error;
        }
    },

    async findById(patientId) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const ObjectId = require('mongodb').ObjectId;
            const patient = await clinicConn.collection('patients')
                .findOne({ _id: new ObjectId(patientId) });
            
            return patient;
        } catch (error) {
            console.error("Error al buscar paciente:", error.message);
            throw error;
        }
    },

    async findByUserId(userId) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const patient = await clinicConn.collection('patients')
                .findOne({ userId: userId });
            
            return patient;
        } catch (error) {
            console.error("Error al buscar paciente por userId:", error.message);
            throw error;
        }
    },

    async findByEmail(email) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            console.log('🔍 Buscando paciente con email:', email);
            const patient = await clinicConn.collection('patients')
                .findOne({ correo: email });
            
            if (patient) {
                console.log('✅ Paciente encontrado:', patient.nombre);
            } else {
                console.log('⚠️ No se encontró paciente con ese email');
            }
            
            return patient;
        } catch (error) {
            console.error("Error al buscar paciente por email:", error.message);
            throw error;
        }
    },

    async save(patientData) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            console.log('💾 Guardando paciente:', patientData.nombre);
            
            const result = await clinicConn.collection('patients').insertOne({
                ...patientData,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log('✅ Paciente guardado con ID:', result.insertedId);
            
            return result;
        } catch (error) {
            console.error("Error al guardar paciente:", error.message);
            console.error("Stack:", error.stack);
            throw error;
        }
    },

    async update(patientId, updateData) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            console.log('🔄 Actualizando paciente:', patientId);
            console.log('📝 Datos a actualizar:', JSON.stringify(updateData, null, 2));

            const ObjectId = require('mongodb').ObjectId;
            
            // Agregar timestamp de actualización
            const dataWithTimestamp = {
                ...updateData,
                updatedAt: new Date()
            };
            
            // Realizar la actualización
            const result = await clinicConn.collection('patients').findOneAndUpdate(
                { _id: new ObjectId(patientId) },
                { $set: dataWithTimestamp },
                { 
                    returnDocument: 'after', // Devolver documento actualizado
                    returnOriginal: false    // No devolver el original
                }
            );

            console.log('📊 Resultado de la actualización:', result);

            // Verificar si se encontró y actualizó el documento
            if (!result.value && !result.ok) {
                console.error('❌ No se encontró el paciente con ID:', patientId);
                return null;
            }

            // El documento actualizado está en result.value (para findOneAndUpdate)
            const updatedPatient = result.value || result;
            
            if (!updatedPatient) {
                console.error('❌ No se pudo obtener el documento actualizado');
                return null;
            }

            console.log('✅ Paciente actualizado correctamente:', updatedPatient.nombre);
            
            return updatedPatient;
        } catch (error) {
            console.error("❌ Error al actualizar paciente:", error.message);
            console.error("Stack:", error.stack);
            throw error;
        }
    },

    async searchByName(searchTerm) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const regex = new RegExp(searchTerm, 'i');
            const patients = await clinicConn.collection('patients').find({
                $or: [
                    { nombre: regex },
                    { apellidos: regex }
                ]
            }).toArray();

            return patients;
        } catch (error) {
            console.error("Error al buscar pacientes:", error.message);
            throw error;
        }
    }
};

module.exports = PatientRepository;