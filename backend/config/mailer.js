const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function enviarCorreoRecuperacion(destinatario, nombre, enlace, minutosVigencia) {
    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: destinatario,
        subject: 'Recupera tu contraseña',
        html: `
            <p>Hola ${nombre || ''},</p>
            <p>Recibimos una solicitud para restablecer tu contraseña. Este enlace vence en ${minutosVigencia} minutos:</p>
            <p><a href="${enlace}">${enlace}</a></p>
            <p>Si no solicitaste este cambio, puedes ignorar este correo; tu contraseña actual seguirá funcionando.</p>
        `,
    });
}

async function enviarCorreoCodigo2FA(destinatario, nombre, codigo, minutosVigencia) {
    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: destinatario,
        subject: 'Tu código de verificación',
        html: `
            <p>Hola ${nombre || ''},</p>
            <p>Tu código de verificación para iniciar sesión es:</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${codigo}</p>
            <p>Vence en ${minutosVigencia} minutos. Si no intentaste iniciar sesión, cambia tu contraseña de inmediato.</p>
        `,
    });
}

module.exports = { enviarCorreoRecuperacion, enviarCorreoCodigo2FA };