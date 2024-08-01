import  Sequelize  from "sequelize"
import dotenv from "dotenv"
dotenv.config({path: '.env'})

const db = new Sequelize(process.env.BD_NOMBRE, process.env.BD_USER, process.env.BD_PASS,{ //process es un metodo propio de node y giurada estas variables del archivo .env
    host: process.env.BD_HOTS,
    port: 3306,
    dialect: 'mysql',
    define:{
        timestamps: true
    },
    pool: {
        max:5,
        min: 0, 
        acquire:30000, // tiempo antes de marcar un error
        idle:10000      //tiempo para quitar la conexiona a la BD si nadie la esta usando 
    },
    operatorAliases: false //elimina un herramienta que ya es obsleta en sequalize 
})

export default db;