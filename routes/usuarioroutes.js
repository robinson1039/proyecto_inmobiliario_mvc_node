import express from 'express';
import{ formularioLogin, autenticar, cerrarSesion,formularioRegistro, formularioOlvidePassword, resetPassword,registrar, confirmar, comprobarToken, nuevoPassword } from '../controllers/usuarioController.js'

// routing son los endponits que va soportar la app 

const router = express.Router();
router.get('/login', formularioLogin)
router.post('/login', autenticar)
router.post('/cerrar-sesion', cerrarSesion)
router.get('/registro', formularioRegistro)
router.post('/registro', registrar)
router.get('/olvide-password', formularioOlvidePassword)
router.get('/confirmar/:token', confirmar)
router.post('/olvide-password', resetPassword)

// almacena el nuevo password 
router.get('/olvide-password/:token', comprobarToken)
router.post('/olvide-password/:token', nuevoPassword)

export default router