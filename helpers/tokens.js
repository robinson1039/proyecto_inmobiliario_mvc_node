import jwt from 'jsonwebtoken'

const generarJWT = datos => jwt.sign({ id: datos.id, nombre: datos.nombre },process.env.JWT_SECRET,{ expiresIn: '1d' })                      /// si eliminas las llaves de un arrow function deja implicito el return 
        
    


const generarId = ()=>  Math.random().toString(32).substring(2) + Date.now().toString(32)

export {
    generarId,
    generarJWT
}