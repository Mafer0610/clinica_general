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

        // ✅ CAMBIO CRÍTICO: Verificar cada 15 minutos en lugar de cada hora
        // '*/15 * * * *' = cada 15 minutos
        // Esto asegura que no perdemos citas
        this.cronJob = cron.schedule('*/15 * * * *', async () => {
            console.log('\n🔔 ===== EJECUTANDO VERIFICACIÓN DE RECORDATORIOS =====');
            console.log(`📅 Fecha/Hora: ${new Date().toLocaleString('es-MX')}`);
            await this.verificarYEnviarRecordatorios();
        });

        this.isRunning = true;
        console.log('✅ Servicio de recordatorios iniciado');
        console.log('⏰ Se verificarán citas cada 15 minutos');
        console.log('📧 Se enviarán recordatorios 2 horas antes de cada cita\n');

        // ✅ EJECUTAR VERIFICACIÓN INMEDIATA AL INICIAR
        console.log('🚀 Ejecutando verificación inicial...');
        setTimeout(() => {
            this.verificarYEnviarRecordatorios();
        }, 5000);
    }

    detener() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.isRunning = false;
            console.log('🛑 Servicio de recordatorios detenido');
        }
    }

    /**
     * ✅ MÉTODO NUEVO: Verificar y enviar recordatorios
     */
    async verificarYEnviarRecordatorios() {
        try {
            const ahora = new Date();
            
            // ✅ CORRECCIÓN: Buscar desde INICIO del día actual hasta FIN del día siguiente
            const inicioHoy = new Date(ahora);
            inicioHoy.setHours(0, 0, 0, 0);
            
            const finMañana = new Date(ahora);
            finMañana.setDate(finMañana.getDate() + 1);
            finMañana.setHours(23, 59, 59, 999);

            console.log('🔍 Buscando citas entre:');
            console.log(`   📅 Desde: ${inicioHoy.toLocaleString('es-MX')}`);
            console.log(`   📅 Hasta: ${finMañana.toLocaleString('es-MX')}`);

            const citas = await AppointmentRepository.findByDateRange(
                inicioHoy.toISOString(),
                finMañana.toISOString()
            );

            console.log(`📊 Total de citas próximas: ${citas.length}`);
            
            // ✅ AÑADIR: Mostrar TODAS las citas encontradas con detalles
            if (citas.length > 0) {
                console.log('\n📋 Lista de citas encontradas:');
                citas.forEach((cita, index) => {
                    const fechaHora = this.construirFechaHoraCita(cita.fecha, cita.hora);
                    const tiempoRestante = fechaHora - ahora;
                    const horasRestantes = tiempoRestante / (1000 * 60 * 60);
                    
                    console.log(`\n   ${index + 1}. ${cita.pacienteNombre}`);
                    console.log(`      📅 Fecha BD: ${new Date(cita.fecha).toLocaleDateString('es-MX')}`);
                    console.log(`      🕐 Hora: ${cita.hora}`);
                    console.log(`      📆 Fecha+Hora: ${fechaHora.toLocaleString('es-MX')}`);
                    console.log(`      ⏰ Faltan: ${horasRestantes.toFixed(2)} horas`);
                    console.log(`      🔔 Recordatorio enviado: ${cita.recordatorioEnviado ? 'SÍ' : 'NO'}`);
                });
                console.log('');
            }

            let recordatoriosEnviados = 0;
            let recordatoriosFallidos = 0;

            for (const cita of citas) {
                // ✅ VERIFICACIÓN 1: Ya se envió recordatorio
                if (cita.recordatorioEnviado) {
                    continue; // No mostrar mensaje para no saturar logs
                }

                // ✅ VERIFICACIÓN 2: Construir fecha+hora de la cita
                const fechaHoraCita = this.construirFechaHoraCita(cita.fecha, cita.hora);
                
                // ✅ VERIFICACIÓN 3: Cita ya pasó
                if (fechaHoraCita < ahora) {
                    continue; // No mostrar mensaje para citas pasadas
                }

                // ✅ VERIFICACIÓN 4: Calcular tiempo restante
                const tiempoRestante = fechaHoraCita - ahora;
                const horasRestantes = tiempoRestante / (1000 * 60 * 60);
                const minutosRestantes = (tiempoRestante / (1000 * 60)) % 60;

                console.log(`\n🔍 ===== EVALUANDO CITA =====`);
                console.log(`👤 Paciente: ${cita.pacienteNombre}`);
                console.log(`📅 Fecha cita: ${fechaHoraCita.toLocaleDateString('es-MX')}`);
                console.log(`🕐 Hora cita: ${cita.hora}`);
                console.log(`📆 Fecha+Hora completa: ${fechaHoraCita.toLocaleString('es-MX')}`);
                console.log(`⏰ Tiempo restante: ${Math.floor(horasRestantes)}h ${Math.floor(minutosRestantes)}min`);
                console.log(`⏰ Horas exactas: ${horasRestantes.toFixed(2)}`);

                // ✅ VERIFICACIÓN 5: Ventana de recordatorio (1.5 a 3 horas)
                if (horasRestantes >= 1.5 && horasRestantes <= 3) {
                    console.log(`✅ ¡DENTRO DE VENTANA! Enviando recordatorio...`);

                    const resultado = await this.enviarRecordatorio(cita);
                    
                    if (resultado.success) {
                        recordatoriosEnviados++;
                    } else {
                        recordatoriosFallidos++;
                    }
                } else if (horasRestantes < 1.5) {
                    console.log(`⚠️ MUY CERCA: Faltan solo ${horasRestantes.toFixed(2)}h (ventana: 1.5-3h)`);
                } else {
                    console.log(`⏭️ MUY LEJOS: Faltan ${horasRestantes.toFixed(2)}h (ventana: 1.5-3h)`);
                }
            }

            console.log('\n📊 ===== RESUMEN =====');
            console.log(`✅ Recordatorios enviados: ${recordatoriosEnviados}`);
            console.log(`❌ Recordatorios fallidos: ${recordatoriosFallidos}`);
            console.log('========================\n');

        } catch (error) {
            console.error('❌ Error en verificación de recordatorios:', error);
            console.error('Stack:', error.stack);
        }
    }

    async enviarRecordatorio(cita) {
        try {
            // 🔍 VERIFICAR DATOS DEL PACIENTE
            console.log(`\n📥 Obteniendo datos del paciente: ${cita.pacienteId}`);
            
            const paciente = await PatientRepository.findById(cita.pacienteId.toString());
            
            if (!paciente) {
                console.log(`   ❌ Paciente no encontrado: ${cita.pacienteId}`);
                return { success: false, error: 'Paciente no encontrado' };
            }

            if (!paciente.correo) {
                console.log(`   ⚠️ Paciente sin email: ${paciente.nombre}`);
                return { success: false, error: 'Sin email' };
            }

            console.log(`   ✅ Paciente encontrado: ${paciente.nombre}`);
            console.log(`   📧 Email: ${paciente.correo}`);

            // 🔍 MAPEAR TIPO DE CITA
            const TIPOS_CITA = {
                '1': 'Consulta médica',
                '2': 'Consulta general',
                '3': 'Revisión',
                '4': 'Control',
                '5': 'Seguimiento'
            };
            const tipoCitaTexto = TIPOS_CITA[cita.tipoCita] || 'Consulta General';

            // 📦 PREPARAR DATOS
            const datosCita = {
                pacienteNombre: cita.pacienteNombre || `${paciente.nombre} ${paciente.apellidos}`,
                fecha: cita.fecha,
                hora: cita.hora,
                tipoCita: tipoCitaTexto,
                descripcion: cita.descripcion || cita.sintomas || ''
            };

            console.log(`   📤 Enviando email a: ${paciente.correo}`);

            // 📧 ENVIAR EMAIL
            const resultado = await EmailService.enviarRecordatorioCita(
                paciente.correo,
                datosCita
            );

            if (resultado.success) {
                // ✅ MARCAR COMO ENVIADO
                await AppointmentRepository.update(cita._id.toString(), {
                    recordatorioEnviado: true
                });
                console.log(`   ✅ Recordatorio enviado y marcado en BD`);
                return { success: true };
            } else {
                console.log(`   ❌ Error: ${resultado.error}`);
                return { success: false, error: resultado.error };
            }

        } catch (error) {
            console.error(`   ❌ Error enviando recordatorio:`, error.message);
            console.error('Stack:', error.stack);
            return { success: false, error: error.message };
        }
    }

    construirFechaHoraCita(fecha, hora) {
        // ✅ MEJORADO: Manejar correctamente fechas de MongoDB
        const fechaObj = new Date(fecha);
        
        // Validar que la hora existe y tiene formato correcto
        if (!hora || !hora.includes(':')) {
            console.error('⚠️ Hora inválida:', hora);
            return fechaObj;
        }
        
        const [hours, minutes] = hora.split(':').map(num => parseInt(num, 10));
        
        // ✅ CRÍTICO: Crear nueva fecha en zona horaria local
        const fechaHora = new Date(
            fechaObj.getFullYear(),
            fechaObj.getMonth(),
            fechaObj.getDate(),
            hours,
            minutes,
            0,
            0
        );
        
        console.log(`   🔧 Fecha construida:`);
        console.log(`      - Fecha BD: ${fechaObj.toISOString()}`);
        console.log(`      - Hora: ${hora}`);
        console.log(`      - Resultado: ${fechaHora.toLocaleString('es-MX')}`);
        
        return fechaHora;
    }

    async verificarAhora() {
        console.log('🔔 Verificación manual solicitada...');
        await this.verificarYEnviarRecordatorios();
    }

    /**
     * 🆕 MÉTODO NUEVO: Enviar recordatorio para TODAS las citas futuras (prueba)
     */
    async probarRecordatorios() {
        try {
            console.log('\n🧪 ===== MODO PRUEBA: ENVIANDO RECORDATORIOS =====');
            
            const ahora = new Date();
            const mañana = new Date(ahora);
            mañana.setDate(mañana.getDate() + 7); // Próximos 7 días
            
            const citas = await AppointmentRepository.findByDateRange(
                ahora.toISOString(),
                mañana.toISOString()
            );

            console.log(`📊 Total de citas en próximos 7 días: ${citas.length}`);

            let enviados = 0;
            let fallidos = 0;

            for (const cita of citas) {
                console.log(`\n📧 Enviando recordatorio de prueba:`);
                console.log(`   👤 Paciente: ${cita.pacienteNombre}`);
                console.log(`   📅 Fecha: ${new Date(cita.fecha).toLocaleDateString('es-MX')}`);
                console.log(`   🕐 Hora: ${cita.hora}`);

                const resultado = await this.enviarRecordatorio(cita);
                
                if (resultado.success) {
                    enviados++;
                } else {
                    fallidos++;
                }
            }

            console.log('\n📊 ===== RESUMEN PRUEBA =====');
            console.log(`✅ Recordatorios enviados: ${enviados}`);
            console.log(`❌ Recordatorios fallidos: ${fallidos}`);
            console.log('============================\n');

            return { enviados, fallidos };
        } catch (error) {
            console.error('❌ Error en modo prueba:', error);
            return { enviados: 0, fallidos: 0 };
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            cronExpression: this.cronJob ? '*/15 * * * *' : null,
            description: 'Verifica cada 15 minutos y envía recordatorios 2h antes de cada cita'
        };
    }
}

module.exports = new ReminderService();