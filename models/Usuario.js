import { DataTypes } from "sequelize"
import db from '../config/db.js'
import bcrypt from "bcrypt"

const Usuario = db.define('usuarios', {
    nombre:{
        /// sequalize tiene un formato para configurar los atributos de la tabla 
        type: DataTypes.STRING,
        allowNull: false        /// el dato no puede ser vacio 
    },
    email:{
        type: DataTypes.STRING,
        allowNull: false 
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false 
    },
    token: DataTypes.STRING,
    confirmado: DataTypes.BOOLEAN
}, {
    hooks: {
        beforeCreate: async function(usuario){
            const salt = await bcrypt.genSalt(10) // el numero de codifcicaciones que hara 
            usuario.password = await bcrypt.hash(usuario.password, salt)
        }
    },
    scopes: {
      eliminarPassword:{
        attributes: {
            exclude:['password', 'token', 'confirmado', 'createdAt', 'updatedAt']
        }
      }  
    }
})

// metodos personalizados 

Usuario.prototype.verificarPassword = function(password){       /// se crea un metodo en el prototype para ser llamado posteriormente donde haya una instancia de el objeto Ususario
    return bcrypt.compareSync(password, this.password)
}

export default Usuario 