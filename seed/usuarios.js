import bcrypt from 'bcrypt'
const usuarios = [{
    nombre: 'Robin',
    email: 'robinson10394@gmail.com',
    confirmado: 1,
    password: bcrypt.hashSync('password',10)
}]

export default usuarios