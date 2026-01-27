import nodemailer from 'nodemailer'
import { env } from '@/lib/env'

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
})

interface SendPasswordResetEmailParams {
  to: string
  token: string
  userName?: string | null
}

export async function sendPasswordResetEmail({
  to,
  token,
  userName,
}: SendPasswordResetEmailParams): Promise<boolean> {
  const resetLink = `${env.APP_URL}/reset-password?token=${token}`
  const expiryMinutes = env.PASSWORD_RESET_EXPIRY_MINUTES

  const greeting = userName ? `Bonjour ${userName} / Hello ${userName}` : 'Bonjour / Hello'

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation du mot de passe / Password reset</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🔐 CRM</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">${greeting},</p>
    
    <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0;"><strong>🇫🇷 Français</strong></p>
      <p style="margin: 0;">Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien expire dans <strong>${expiryMinutes} minutes</strong>.</p>
    </div>
    
    <div style="background: #f8f9fa; border-left: 4px solid #764ba2; padding: 15px; margin-bottom: 25px;">
      <p style="margin: 0 0 10px 0;"><strong>🇬🇧 English</strong></p>
      <p style="margin: 0;">You have requested a password reset. Click the button below to create a new password. This link expires in <strong>${expiryMinutes} minutes</strong>.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Réinitialiser / Reset Password
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 25px;">
      <strong>🇫🇷</strong> Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.<br>
      <strong>🇬🇧</strong> If you didn't request this reset, simply ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">
    
    <p style="font-size: 12px; color: #999; margin: 0;">
      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
      If the button doesn't work, copy this link to your browser:<br>
      <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
    </p>
  </div>
</body>
</html>
`

  const textContent = `
${greeting},

🇫🇷 FRANÇAIS
Vous avez demandé la réinitialisation de votre mot de passe.
Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe.
Ce lien expire dans ${expiryMinutes} minutes.

🇬🇧 ENGLISH
You have requested a password reset.
Click the link below to create a new password.
This link expires in ${expiryMinutes} minutes.

Réinitialiser / Reset: ${resetLink}

Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
If you didn't request this reset, simply ignore this email.
`

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: '🔐 Réinitialisation du mot de passe / Password reset',
      text: textContent,
      html: htmlContent,
    })
    return true
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return false
  }
}
