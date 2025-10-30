const connections = require('./connections');

const ExpedienteRepository = {
    /**
     * Generar número de expediente único
     */
    async generarNumeroExpediente() {
        try {
            const ahora = new Date();
            const año = ahora.getFullYear();
            const mes = String(ahora.getMonth() + 1).padStart(2, '0');
            
            // Buscar el último expediente del año actual
            const clinicConn = await connections.connectClinic();
            const ultimoExpediente = await clinicConn.collection('expedientes')
                .find({ numeroExpediente: new RegExp(`^EC-${año}-`) })
                .sort({ numeroExpediente: -1 })
                .limit(1)
                .toArray();
            
            let consecutivo = 1;
            if (ultimoExpediente.length > 0) {
                const ultimoNumero = ultimoExpediente[0].numeroExpediente;
                const partes = ultimoNumero.split('-');
                consecutivo = parseInt(partes[2]) + 1;
            }
            
            const numeroExpediente = `EC-${año}-${String(consecutivo).padStart(3, '0')}`;
            return numeroExpediente;
        } catch (error) {
            console.error('Error generando número de expediente:', error);
            throw error;
        }
    },

    /**
     * Buscar o crear expediente por pacienteId
     */
    async findOrCreateByPacienteId(pacienteId) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const ObjectId = require('mongodb').ObjectId;
            let expediente = await clinicConn.collection('expedientes')
                .findOne({ pacienteId: new ObjectId(pacienteId) });
            
            if (!expediente) {
                console.log('📄 Creando nuevo expediente para paciente:', pacienteId);
                const numeroExpediente = await this.generarNumeroExpediente();
                
                const nuevoExpediente = {
                    pacienteId: new ObjectId(pacienteId),
                    numeroExpediente: numeroExpediente,
                    historiaClinica: {
                        antecedentesHF: '',
                        tipoSanguineo: null,
                        tabaquismo: 'No',
                        cigarrosDia: null,
                        anosFumando: null,
                        alcoholismo: 'No',
                        sustancias: 'No',
                        especificarSustancia: '',
                        habitosGenerales: '',
                        alergias: 'Ninguna',
                        cirugias: '',
                        enfermedadesCronicas: {
                            diabetes: false,
                            hipertension: false,
                            asma: false,
                            epilepsia: false,
                            cancer: false,
                            tuberculosis: false,
                            vih: false,
                            otras: ''
                        },
                        interrogatorioSistemas: ''
                    },
                    resultadosEstudios: '',
                    consultas: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
                const result = await clinicConn.collection('expedientes').insertOne(nuevoExpediente);
                expediente = { ...nuevoExpediente, _id: result.insertedId };
                console.log('✅ Expediente creado:', numeroExpediente);
            }
            
            return expediente;
        } catch (error) {
            console.error('Error buscando/creando expediente:', error);
            throw error;
        }
    },

    /**
     * Actualizar historia clínica del expediente
     */
    async updateHistoriaClinica(expedienteId, historiaClinica) {
        try {
            console.log('🔄 ExpedienteRepository.updateHistoriaClinica');
            console.log('📋 expedienteId recibido:', expedienteId);
            console.log('📋 tipo de expedienteId:', typeof expedienteId);
            
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const { ObjectId } = require('mongodb');
            
            // ✅ Validar que el ID sea válido antes de convertir
            if (!ObjectId.isValid(expedienteId)) {
                console.error('❌ ID de expediente inválido:', expedienteId);
                throw new Error('ID de expediente inválido');
            }
            
            const objectId = new ObjectId(expedienteId);
            console.log('🔑 ObjectId creado:', objectId.toString());
            
            // Primero verificar si existe el documento
            const existe = await clinicConn.collection('expedientes').findOne({ _id: objectId });
            console.log('🔍 Expediente existe antes de actualizar:', existe ? '✅ SÍ' : '❌ NO');
            
            if (!existe) {
                console.error('❌ El expediente no existe en la BD');
                console.log('💡 Buscando todos los expedientes...');
                const todos = await clinicConn.collection('expedientes').find({}).toArray();
                console.log(`📊 Total de expedientes en BD: ${todos.length}`);
                todos.forEach(exp => {
                    console.log(`   - ID: ${exp._id} | Paciente: ${exp.pacienteId} | Número: ${exp.numeroExpediente}`);
                });
                return null;
            }
            
            console.log('💾 Ejecutando actualización en MongoDB...');
            
            // ✅ SOLUCIÓN: Usar updateOne + findOne en lugar de findOneAndUpdate
            const updateResult = await clinicConn.collection('expedientes').updateOne(
                { _id: objectId },
                { 
                    $set: { 
                        historiaClinica: historiaClinica,
                        updatedAt: new Date() 
                    } 
                }
            );

            console.log('📊 Documentos modificados:', updateResult.modifiedCount);

            if (updateResult.modifiedCount === 0) {
                console.error('❌ No se pudo actualizar el expediente');
                return null;
            }

            // Obtener el documento actualizado
            const expedienteActualizado = await clinicConn.collection('expedientes').findOne({ _id: objectId });
            console.log('✅ Expediente actualizado correctamente');

            return expedienteActualizado;
        } catch (error) {
            console.error('❌ Error actualizando historia clínica:', error);
            console.error('Stack:', error.stack);
            throw error;
        }
    },

    /**
     * Actualizar resultados de estudios
     */
    async updateResultadosEstudios(expedienteId, resultadosEstudios) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const { ObjectId } = require('mongodb');
            const objectId = new ObjectId(expedienteId);
            
            const updateResult = await clinicConn.collection('expedientes').updateOne(
                { _id: objectId },
                { 
                    $set: { 
                        resultadosEstudios: resultadosEstudios,
                        updatedAt: new Date() 
                    } 
                }
            );

            if (updateResult.modifiedCount === 0) {
                console.error('❌ No se pudo actualizar resultados de estudios');
                return null;
            }

            const expedienteActualizado = await clinicConn.collection('expedientes').findOne({ _id: objectId });
            return expedienteActualizado;
        } catch (error) {
            console.error('Error actualizando resultados de estudios:', error);
            throw error;
        }
    },

    /**
     * Agregar consulta al expediente
     */
    async addConsulta(expedienteId, consultaData) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const { ObjectId } = require('mongodb');
            const objectId = new ObjectId(expedienteId);
            
            const consulta = {
                ...consultaData,
                fechaCreacion: new Date()
            };
            
            const updateResult = await clinicConn.collection('expedientes').updateOne(
                { _id: objectId },
                { 
                    $push: { consultas: consulta },
                    $set: { updatedAt: new Date() }
                }
            );

            if (updateResult.modifiedCount === 0) {
                console.error('❌ No se pudo agregar consulta');
                return null;
            }

            const expedienteActualizado = await clinicConn.collection('expedientes').findOne({ _id: objectId });
            return expedienteActualizado;
        } catch (error) {
            console.error('Error agregando consulta:', error);
            throw error;
        }
    },

    /**
     * Obtener todas las consultas de un expediente
     */
    async getConsultas(expedienteId) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const ObjectId = require('mongodb').ObjectId;
            const expediente = await clinicConn.collection('expedientes')
                .findOne(
                    { _id: new ObjectId(expedienteId) },
                    { projection: { consultas: 1 } }
                );
            
            return expediente ? expediente.consultas : [];
        } catch (error) {
            console.error('Error obteniendo consultas:', error);
            throw error;
        }
    },

    /**
     * Obtener expediente completo
     */
    async findById(expedienteId) {
        try {
            const clinicConn = await connections.connectClinic();
            
            if (clinicConn.readyState !== 1) {
                throw new Error('MongoDB Clinic no está conectado');
            }

            const ObjectId = require('mongodb').ObjectId;
            const expediente = await clinicConn.collection('expedientes')
                .findOne({ _id: new ObjectId(expedienteId) });
            
            return expediente;
        } catch (error) {
            console.error('Error obteniendo expediente:', error);
            throw error;
        }
    }
};

module.exports = ExpedienteRepository;