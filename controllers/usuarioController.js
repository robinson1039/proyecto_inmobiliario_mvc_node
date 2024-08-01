import  { check, validationResult } from 'express-validator'
import bcrypt from 'bcrypt'
import Usuario from "../models/Usuario.js"
import { generarId, generarJWT } from "../helpers/tokens.js"
import { emailRegistro, emailOlvidePassword } from '../helpers/email.js'

const formularioLogin = (req, res) => {
    res.render('auth/login', {
        pagina: 'Iniciar sesion',
        csrfToken: req.csrfToken()
    })
}
const autenticar = async (req, res) => {
    //validar email y password para inicar sesion 
    await check('email').isEmail().trim().withMessage('El email no es valido').run(req)                      // en el check se pone el name que se coloco en el form y el run() ejecuta la validacion
    await check('password').trim().notEmpty().withMessage('El password es obligatorio').run(req)   

    let resultado = validationResult(req)                                                                       // guarda los errores en un array 
    // verificar que el resultado este vacio
    if(!resultado.isEmpty()){
        //errores
       return res.render('auth/login', {
            pagina: 'Iniciar sesion',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
        })
    }

    const { email, password } = req.body

    // comprobar si el usuario existe

    const usuario = await Usuario.findOne({where: {email}})
    if(!usuario){
        return res.render('auth/login', {
            pagina: 'Iniciar sesion',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El usuario no existe'}]
        })
    }
    if(!usuario.confirmado){
        return res.render('auth/login', {
            pagina: 'Iniciar sesion',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'Tu cuanta no a sido confirmada'}]
        })
    }

    /// comprobar el password
    if(!usuario.verificarPassword(password)){
        return res.render('auth/login', {
            pagina: 'Iniciar sesion',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El password el incorrecto'}]
        })
    } // el metodo devulve un true o un false 

    // aunteticar al usuario

    const token = generarJWT({id: usuario.id, nombre: usuario.nombre}) 
    //almacenar en cookies

    return res.cookie('_token', token, {
        httpOnly: true,
        //secure: true, //solo valio para certidicados ssl
        //sameSite: true
    }).redirect('/mis-propiedades')
}
const cerrarSesion = (req, res) => {
    
    return res.clearCookie('_token').status(200).redirect('/auth/login')
}
const formularioRegistro = (req, res) => {
    res.render('auth/registro', {
        pagina: 'Registro',
        csrfToken: req.csrfToken()
    })
}
const registrar = async (req, res) => {
    // validacion 
    await check('nombre').notEmpty().trim().withMessage('El nombre no puede estar vacio').run(req)                     // en el check se pone el name que se coloco en el form y el run() ejecuta la validacion
    await check('email').isEmail().trim().withMessage('El email no es valido').run(req)       
    await check('password').trim().isLength({min: 6}).withMessage('El password es muy corto').run(req)   
    await check('repetir_password').trim().equals(req.body.password).withMessage('Los password no coinciden').run(req);
               
    let resultado = validationResult(req)                                                                       // guarda los errores en un array 
    // verificar que el resultado este vacio
    if(!resultado.isEmpty()){
        //errores
       return res.render('auth/registro', {
            pagina: 'Crea cuenta',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
            usuario:{
                nombre: req.body.nombre,
                email: req.body.email 
            }
        })
    }
    // extraer los datos 
    const{ nombre, email, password} = req.body
    // validar que el usuario no exista 
    const existeUsuario = await Usuario.findOne({ where : { email } })   // findOne() busca la primera coincidencia  
    if(existeUsuario){
        return res.render('auth/registro', {
            pagina: 'Crea cuenta',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'el usuario ya esta registrado'}],
            usuario:{
                nombre: req.body.nombre,
                email: req.body.email 
            }
        })
    }

    // almacenar usuario 
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId()
    })

    //envioa email de confirmacion

    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    // mostrar confirmacion 
    res.render('templates/mensaje',{
        pagina: 'Cuenta creada correctamente',
        mensaje: 'Hemos enviado un email de conformacion presiona en el enlace'
    })
}
// funcion que compueba una cuenta 
const confirmar = async (req, res) =>{

    const { token } = req.params

    // verificar si el tokn es valido
    const usuario = await Usuario.findOne({where: {token}})
    if(!usuario){
        return res.render('auth/confirmar-cuenta',{
            pagina: 'Error al confirmar tu cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta',
            error: true
        })
    }
    /// confirmar cuenta 
    usuario.token = null
    usuario.confirmado = true
    await usuario.save()   ///metodo del orm para guardar cambios en la base de datos 
    return res.render('auth/confirmar-cuenta',{
        pagina: 'Cuenta confirmada',
        mensaje: 'La cuenta se confirmo correctamente'
    })

}
const formularioOlvidePassword = (req, res) => {
    res.render('auth/olvide-password', {
        pagina: 'Olvide contrasenia',
        csrfToken: req.csrfToken()
    })
}

const resetPassword = async (req, res) =>{                     // en el check se pone el name que se coloco en el form y el run() ejecuta la validacion
    await check('email').isEmail().trim().withMessage('El email no es valido').run(req)           
    let resultado = validationResult(req)                                                                       // guarda los errores en un array 
    // verificar que el resultado este vacio
    if(!resultado.isEmpty()){
        //errores
       return res.render('auth/olvide-password', {
            pagina: 'Olvide contrasenia',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    // buscar que el ususrio exista 
    const {email} = req.body
    const usuario = await Usuario.findOne({where: {email}})
    if(!usuario){
        //errores
       return res.render('auth/olvide-password', {
            pagina: 'recuepra tu acceso a bienes raices',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'el email no pertenece a ningun usuario'}]
        })
    }
    // general un token y enviar un email
    usuario.token = generarId()
    await usuario.save()

    // email a enviar 
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    })
    // redenrizar un mensaje
    res.render('templates/mensaje',{
        pagina: 'Restablece tu password',
        mensaje: 'Hemos enviado un email con las instrucciones'
    }) 
}

const  comprobarToken = async (req, res) => {
    const {token} = req.params

    const usuario = await Usuario.findOne({where: {token}})

    if(!usuario){
        return res.render('auth/confirmar-cuenta',{
            pagina: 'Restablece tu password',
            mensaje: 'Hubo un error al validar tu informacion',
            error: true
        })
    }

    //mostrar formulario para modificar el password
    res.render('auth/reset-password',{
        pagina: 'Restablece tu password',
        csrfToken: req.csrfToken(),
    })
}
const nuevoPassword = async (req, res) => {
    // validar password
    await check('password').trim().isLength({min: 6}).withMessage('El password es muy corto').run(req)
    let resultado = validationResult(req)
    if(!resultado.isEmpty()){
        //errores
       return res.render('auth/reset-password', {
            pagina: 'Restablece tu password',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    const {token} = req.params
    const {password} = req.body

    /// indentificar usuarios
    const usuario = await Usuario.findOne({where: {token}})
    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash(password, salt)
    usuario.token = null

    await usuario.save()

    res.render('auth/confirmar-cuenta', {
        pagina: 'Password restablecido',
        mensaje: 'El password se gurado correctamente'
    })
    
}
export{
    formularioLogin,
    autenticar,
    cerrarSesion,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword
}
