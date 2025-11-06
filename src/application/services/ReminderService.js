const cron = require('node-cron');
const AppointmentRepository = require('../../infrastructure/database/AppointmentRepository');
const PatientRepository = require('../../infrastructure/database/PatientRepository');
const EmailService = require('./EmailService');

class ReminderService {
    constructor() {
        this.cronJob = null;
        this.isRunning = false;
    }

    iniciar() {
        if (this.isRunning) {
            console.log('⚠️ El servicio de recordatorios ya está en ejecución');
            return;
        }
        this.cronJob = cron.schedule('0 * * * *', async () => {
            console.log('\n🔔 ===== EJECUTANDO VERIFICACIÓN DE RECORDATORIOS =====');
            console.log(`📅 Fecha/Hora: ${new Date().toLocaleString('es-MX')}`);
            await this.verificarYEnviarRecordatorios();
        });

        this.isRunning = true;
        console.log('✅ Servicio de recordatorios iniciado');
        console.log('⏰ Se verificarán citas cada hora');
        console.log('📧 Se enviarán recordatorios 2 horas antes de cada cita\n');

    }

    detener() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.isRunning = false;
            console.log('🛑 Servicio de recordatorios detenido');
        }
    }

    /**
     * Verificar citas y enviar recordatorios
     */
    async verificarYEnviarRecordatorios() {
        try {
            const ahora = new Date();
            
            // Calcular ventana de tiempo: 2 horas desde ahora
            const ventanaInicio = new Date(ahora.getTime() + (2 * 60 * 60 * 1000)); // +2 horas
            const ventanaFin = new Date(ahora.getTime() + (3 * 60 * 60 * 1000));    // +3 horas

            console.log('🔍 Buscando citas entre:');
            console.log(`   📅 Inicio: ${ventanaInicio.toLocaleString('es-MX')}`);
            console.log(`   📅 Fin: ${ventanaFin.toLocaleString('es-MX')}`);

            // Obtener todas las citas del día
            const inicioDelDia = new Date(ahora);
            inicioDelDia.setHours(0, 0, 0, 0);
            
            const finDelDia = new Date(ahora);
            finDelDia.setHours(23, 59, 59, 999);

            const citas = await AppointmentRepository.findByDateRange(
                inicioDelDia.toISOString(),
                finDelDia.toISOString()
            );

            console.log(`📊 Total de citas hoy: ${citas.length}`);

            let recordatoriosEnviados = 0;
            let recordatoriosFallidos = 0;

            // Filtrar citas que necesitan recordatorio
            for (const cita of citas) {
                // Verificar si ya se envió recordatorio
                if (cita.recordatorioEnviado) {
                    continue;
                }

                // Verificar si la cita ya pasó
                const fechaHoraCita = this.construirFechaHoraCita(cita.fecha, cita.hora);
                if (fechaHoraCita < ahora) {
                    continue; // Cita ya pasó
                }

                // Verificar si está en la ventana de 2 horas
                const tiempoRestante = fechaHoraCita - ahora;
                const horasRestantes = tiempoRestante / (1000 * 60 * 60);

                // Si faltan entre 2 y 3 horas, enviar recordatorio
                if (horasRestantes >= 2 && horasRestantes <= 3) {
                    console.log(`\n📧 Procesando cita:`);
                    console.log(`   👤 Paciente: ${cita.pacienteNombre}`);
                    console.log(`   📅 Fecha/Hora: ${fechaHoraCita.toLocaleString('es-MX')}`);
                    console.log(`   ⏰ Faltan: ${horasRestantes.toFixed(1)} horas`);

                    const resultado = await this.enviarRecordatorio(cita);
                    
                    if (resultado.success) {
                        recordatoriosEnviados++;
                    } else {
                        recordatoriosFallidos++;
                    }
                }
            }

            console.log('\n📊 ===== RESUMEN =====');
            console.log(`✅ Recordatorios enviados: ${recordatoriosEnviados}`);
            console.log(`❌ Recordatorios fallidos: ${recordatoriosFallidos}`);
            console.log('========================\n');

        } catch (error) {
            console.error('❌ Error en verificación de recordatorios:', error);
        }
    }

    async enviarRecordatorio(cita) {
        try {
            const paciente = await PatientRepository.findById(cita.pacienteId.toString());
            
            if (!paciente || !paciente.correo) {
                console.log(`   ⚠️ No se puede enviar: paciente sin email`);
                return { success: false, error: 'Sin email' };
            }

            const TIPOS_CITA = {
                '1': 'Consulta médica',
                '2': 'Consulta general',
                '3': 'Revisión',
                '4': 'Control',
                '5': 'Seguimiento'
            };
            const tipoCitaTexto = TIPOS_CITA[cita.tipoCita] || 'Consulta General';

            // Datos para el email
            const datosCita = {
                pacienteNombre: cita.pacienteNombre || `${paciente.nombre} ${paciente.apellidos}`,
                fecha: cita.fecha,
                hora: cita.hora,
                tipoCita: tipoCitaTexto,
                descripcion: cita.descripcion || cita.sintomas || ''
            };

            // Enviar email
            const resultado = await EmailService.enviarRecordatorioCita(
                paciente.correo,
                datosCita
            );

            if (resultado.success) {
                await AppointmentRepository.update(cita._id.toString(), {
                    recordatorioEnviado: true
                });
                console.log(`   ✅ Recordatorio enviado a: ${paciente.correo}`);
                return { success: true };
            } else {
                console.log(`   ❌ Error: ${resultado.error}`);
                return { success: false, error: resultado.error };
            }

        } catch (error) {
            console.error(`   ❌ Error enviando recordatorio:`, error.message);
            return { success: false, error: error.message };
        }
    }

    construirFechaHoraCita(fecha, hora) {
        const fechaObj = new Date(fecha);
        const [hours, minutes] = hora.split(':');
        
        const fechaHora = new Date(
            fechaObj.getFullYear(),
            fechaObj.getMonth(),
            fechaObj.getDate(),
            parseInt(hours),
            parseInt(minutes),
            0
        );
        
        return fechaHora;
    }

    async verificarAhora() {
        await this.verificarYEnviarRecordatorios();
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            cronExpression: this.cronJob ? '0 * * * *' : null,
            description: 'Verifica cada hora y envía recordatorios 2h antes de cada cita'
        };
    }
}

module.exports = new ReminderService();