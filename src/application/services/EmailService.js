const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'tu-email@gmail.com',
                pass: process.env.EMAIL_PASSWORD || 'tu-app-password'
            }
        });

        // Verificar configuración al iniciar
        this.verifyConnection();
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
        } catch (error) {
            console.error('Error en configuración de email:', error.message);
        }
    }

    async enviarRecordatorioCita(destinatario, datosCita) {
        try {
            const { pacienteNombre, fecha, hora, tipoCita, descripcion } = datosCita;

            const fechaObj = new Date(fecha);
            const fechaFormateada = fechaObj.toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0F3759 0%, #1C4D8C 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .alert-box { background: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin-bottom: 25px; border-radius: 4px; }
        .alert-box strong { color: #856404; display: block; margin-bottom: 5px; font-size: 16px; }
        .alert-box p { margin: 0; color: #856404; }
        .info-card { background: #f8f9fa; border: 2px solid #0F3759; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { display: flex; margin: 12px 0; align-items: center; }
        .info-label { font-weight: 600; color: #0F3759; min-width: 120px; font-size: 14px; }
        .info-value { color: #333; font-size: 15px; }
        .icon { display: inline-block; width: 20px; text-align: center; margin-right: 8px; }
        .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #dee2e6; }
        .footer p { margin: 5px 0; font-size: 13px; color: #6c757d; }
        .button { display: inline-block; background: #0F3759; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 600; }
        .button:hover { background: #1a5080; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 DJFA System's</h1>
            <p>Clínica Médica</p>
        </div>
        
        <div class="content">
            <div class="alert-box">
                <strong>⏰ Recordatorio de Cita</strong>
                <p>Tu cita médica está programada en aproximadamente 2 horas</p>
            </div>

            <h2 style="color: #0F3759; margin-bottom: 20px;">Detalles de tu Cita</h2>
            
            <div class="info-card">
                <div class="info-row">
                    <span class="icon">👤</span>
                    <span class="info-label">Paciente:</span>
                    <span class="info-value">${pacienteNombre}</span>
                </div>
                <div class="info-row">
                    <span class="icon">📅</span>
                    <span class="info-label">Fecha:</span>
                    <span class="info-value">${fechaFormateada}</span>
                </div>
                <div class="info-row">
                    <span class="icon">🕐</span>
                    <span class="info-label">Hora:</span>
                    <span class="info-value">${hora}</span>
                </div>
                <div class="info-row">
                    <span class="icon">📋</span>
                    <span class="info-label">Tipo de Cita:</span>
                    <span class="info-value">${tipoCita || 'Consulta General'}</span>
                </div>
                ${descripcion ? `
                <div class="info-row">
                    <span class="icon">📝</span>
                    <span class="info-label">Motivo:</span>
                    <span class="info-value">${descripcion}</span>
                </div>
                ` : ''}
            </div>

            <div style="background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #0F3759; font-size: 14px;">
                    <strong>📍 Dirección:</strong><br>
                    Avenida Siempre Viva #117<br>
                    Col. Centro, Tuxtla Gutiérrez, Chiapas
                </p>
                <p style="margin: 10px 0 0 0; color: #0F3759; font-size: 14px;">
                    <strong>📞 Contacto:</strong> 961-117-1231
                </p>
            </div>

            <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 13px;">
                    <strong>⚠️ Importante:</strong><br>
                    • Por favor llega 10 minutos antes<br>
                    • Trae tu identificación oficial<br>
                    • Si no puedes asistir, cancela con anticipación
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>DJFA System's - Clínica Médica</strong></p>
            <p>Este es un correo automático, por favor no responder</p>
            <p style="font-size: 11px; color: #999; margin-top: 10px;">
                © 2025 DJFA System's. Todos los derechos reservados.
            </p>
        </div>
    </div>
</body>
</html>
            `;

            const mailOptions = {
                from: `"DJFA System's" <${process.env.EMAIL_USER}>`,
                to: destinatario,
                subject: `⏰ Recordatorio: Cita Médica - ${fechaFormateada} a las ${hora}`,
                html: htmlContent
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            console.log('✅ Email enviado exitosamente:', info.messageId);
            console.log(`   📧 Destinatario: ${destinatario}`);
            console.log(`   📅 Cita: ${fechaFormateada} - ${hora}`);
            
            return {
                success: true,
                messageId: info.messageId,
                destinatario: destinatario
            };

        } catch (error) {
            console.error('❌ Error enviando email:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Enviar confirmación de cita
     */
    async enviarConfirmacionCita(destinatario, datosCita) {
        try {
            const { pacienteNombre, fecha, hora } = datosCita;

            const fechaObj = new Date(fecha);
            const fechaFormateada = fechaObj.toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin-bottom: 25px; border-radius: 4px; color: #155724; }
        .info-card { background: #f8f9fa; border: 2px solid #28a745; border-radius: 8px; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Cita Confirmada</h1>
        </div>
        <div class="content">
            <div class="success-box">
                <strong>¡Tu cita ha sido confirmada exitosamente!</strong>
            </div>
            <p>Hola <strong>${pacienteNombre}</strong>,</p>
            <p>Tu cita médica ha sido agendada correctamente:</p>
            <div class="info-card">
                <p><strong>📅 Fecha:</strong> ${fechaFormateada}</p>
                <p><strong>🕐 Hora:</strong> ${hora}</p>
            </div>
            <p>Recibirás un recordatorio 2 horas antes de tu cita.</p>
        </div>
    </div>
</body>
</html>
            `;

            const mailOptions = {
                from: `"DJFA System's" <${process.env.EMAIL_USER}>`,
                to: destinatario,
                subject: `Confirmación de Cita - ${fechaFormateada}`,
                html: htmlContent
            };

            await this.transporter.sendMail(mailOptions);
            
            return { success: true };
        } catch (error) {
            console.error('❌ Error enviando confirmación:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();