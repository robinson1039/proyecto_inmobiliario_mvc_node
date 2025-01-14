import nodemailer from 'nodemailer'
const emailRegistro = async(datos)=>{
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    const {email, nombre, token} = datos
    // enaviar el email
    await transport.sendMail({
        from:'Bienesraices.com',
        to: email,
        subject: 'Confirma tu cuenta',
        text: 'Confirma tu cuenta',
        html:`
            <p>Hola ${nombre}, comprueba tu cuenta en bienesraices.com</p>

            <p>Tu cuenta ya esta lista solo bedes confirmarla en el siguiente enlace:
            <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/confirmar/:${token}"> Confirmar cuenta </a></p>

            <p> Si tu no creaste esta cuenta ignora este mensaje </p>
        `
    })  /// metodos de nodemailer
}

const emailOlvidePassword = async(datos)=>{
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    const {email, nombre, token} = datos
    // enaviar el email
    await transport.sendMail({
        from:'Bienesraices.com',
        to: email,
        subject: 'Restablece tu password',
        text: 'Restablece tu password',
        html:`
            <p>Hola ${nombre}, has solicitado restablecer tu password en bienesraices.com</p>

            <p>sigue el siguiente enlace:
            <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/olvide-password/${token}"> restablecer password </a></p>

            <p> Si tu no solicitaste el cambio de password ignora este mensaje </p>
        `
    })  /// metodos de nodemailer
}
export{
    emailRegistro,
    emailOlvidePassword
}