// Render bloquea las conexiones SMTP salientes (puertos 25, 465 y 587) en el
// plan gratuito de sus servicios web, así que enviar correos con nodemailer
// por SMTP directo (como se hacía antes) se queda colgado con un error
// "ETIMEDOUT" hasta que se agota el tiempo. Para mantener el hosting
// gratuito, los correos ahora se envían a través de la API HTTP de Brevo
// (https://api.brevo.com), que sí funciona sin problema porque usa HTTPS
// normal, no un puerto SMTP.
//
// Variable de entorno necesaria: BREVO_API_KEY (se obtiene en el panel de
// Brevo, en SMTP & API -> API Keys). El remitente (from) sigue tomándose de
// SMTP_FROM / SMTP_USER, pero ese correo debe estar verificado como
// remitente en la cuenta de Brevo antes de poder enviar.

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

async function enviarCorreo({ destinatario, nombreDestinatario, asunto, html }) {
    const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json',
            'accept': 'application/json',
        },
        body: JSON.stringify({
            sender: {
                name: 'Sigat',
                email: process.env.SMTP_FROM || process.env.SMTP_USER,
            },
            to: [{ email: destinatario, name: nombreDestinatario || undefined }],
            subject: asunto,
            htmlContent: html,
        }),
    });

    if (!response.ok) {
        const cuerpoError = await response.text();
        throw new Error(`Brevo respondió ${response.status} al enviar el correo: ${cuerpoError}`);
    }
}

async function enviarCorreoRecuperacion(destinatario, nombre, enlace, minutosVigencia) {
    await enviarCorreo({
        destinatario,
        nombreDestinatario: nombre,
        asunto: 'Recupera tu contraseña',
        html: `
            <p>Hola ${nombre || ''},</p>
            <p>Recibimos una solicitud para restablecer tu contraseña. Este enlace vence en ${minutosVigencia} minutos:</p>
            <p><a href="${enlace}">${enlace}</a></p>
            <p>Si no solicitaste este cambio, puedes ignorar este correo; tu contraseña actual seguirá funcionando.</p>
        `,
    });
}

async function enviarCorreoCodigo2FA(destinatario, nombre, codigo, minutosVigencia) {
    await enviarCorreo({
        destinatario,
        nombreDestinatario: nombre,
        asunto: 'Tu código de verificación',
        html: `
            <p>Hola ${nombre || ''},</p>
            <p>Tu código de verificación para iniciar sesión es:</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${codigo}</p>
            <p>Vence en ${minutosVigencia} minutos. Si no intentaste iniciar sesión, cambia tu contraseña de inmediato.</p>
        `,
    });
}

module.exports = { enviarCorreoRecuperacion, enviarCorreoCodigo2FA };
