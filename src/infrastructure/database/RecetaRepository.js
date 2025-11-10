const connections = require('./connections');

const RecetaRepository = {
    async save(recetaData) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            console.log('💾 Guardando receta para paciente:', recetaData.pacienteNombre);
            
            const result = await clinicConn.collection('recetas').insertOne({
                ...recetaData,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log('✅ Receta guardada con ID:', result.insertedId);
            
            return result;
        } catch (error) {
            console.error(' Error al guardar receta:', error.message);
            throw error;
        }
    },

    /**
     * Obtener todas las recetas de un paciente
     */
    async findByPatientId(patientId) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const ObjectId = require('mongodb').ObjectId;
            const recetas = await clinicConn.collection('recetas')
                .find({ pacienteId: new ObjectId(patientId) })
                .sort({ fecha: -1 })
                .toArray();
            
            console.log(`✅ Se encontraron ${recetas.length} recetas para el paciente`);
            return recetas;
        } catch (error) {
            console.error(' Error al buscar recetas:', error.message);
            throw error;
        }
    },

    /**
     * Obtener receta por ID
     */
    async findById(recetaId) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const ObjectId = require('mongodb').ObjectId;
            const receta = await clinicConn.collection('recetas')
                .findOne({ _id: new ObjectId(recetaId) });
            
            return receta;
        } catch (error) {
            console.error(' Error al buscar receta por ID:', error.message);
            throw error;
        }
    },

    /**
     * Obtener recetas por rango de fechas (para el paciente)
     */
    async findByPatientAndDateRange(patientId, startDate, endDate) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const ObjectId = require('mongodb').ObjectId;
            const recetas = await clinicConn.collection('recetas')
                .find({
                    pacienteId: new ObjectId(patientId),
                    fecha: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                })
                .sort({ fecha: -1 })
                .toArray();
            
            return recetas;
        } catch (error) {
            console.error(' Error al buscar recetas por rango:', error.message);
            throw error;
        }
    }
};

module.exports = RecetaRepository;