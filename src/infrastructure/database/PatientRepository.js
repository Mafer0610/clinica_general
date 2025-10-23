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

    // NUEVA FUNCIÓN: Buscar por email
    async findByEmail(email) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const patient = await clinicConn.collection('patients')
                .findOne({ correo: email });
            
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

            const result = await clinicConn.collection('patients').insertOne({
                ...patientData,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            return result;
        } catch (error) {
            console.error("Error al guardar paciente:", error.message);
            throw error;
        }
    },

    async update(patientId, updateData) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const ObjectId = require('mongodb').ObjectId;
            const result = await clinicConn.collection('patients').findOneAndUpdate(
                { _id: new ObjectId(patientId) },
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
            console.error("Error al actualizar paciente:", error.message);
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