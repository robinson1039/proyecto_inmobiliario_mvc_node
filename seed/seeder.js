import { exit } from 'node:process'
import categorias from "./categorias.js";
import precios from './precios.js';
import usuarios from './usuarios.js';
import db from "../config/db.js";
import {Categoria, Precio, Usuario} from "../models/index.js"  

const importarDatos = async () => {
    try {

        //autenticar
        await db.authenticate()
        //general columnas 
        await db.sync()
        // insertar datos
        /*
        este metodo usa 2 await si un uqey no depende del otro no es buena idea usarlo
        await Categoria.bulkCreate(categorias)
        await Precio.bulkCreate(precios)
        */
       // insertar datos con promise all
       await Promise.all([
         Categoria.bulkCreate(categorias),
         Precio.bulkCreate(precios),
         Usuario.bulkCreate(usuarios)
       ])
        console.log('Datos importados correctmente')
        exit()  /// con 0 o vacio exit() quiere decir que finalizo la tarea de forma exitosa si pones un 1 es por que hay un error 
    } catch (error) {
        console.log(error)
        exit(1)
    }
}

const eliminarDatos = async () => {
    try {
        /* si son pocos modelos esta forma sirve si son muchos no e sla mejor forma
        await Promise.all([
            Categoria.destroy({where: {}, truncate: true}),
            Precio.destroy({where: {}, truncate: true})
          ])
        */
        await db.sync({force: true})
        exit()
    } catch (error) {
        console.log(error)
        exit(1)
    }
}

if(process.argv[2] === "-i"){  // desde el package.json se llana esta funcion "db:importar": "node ./seed/seeder.js -i" se vuelve un arreglo y toma "-i"
    importarDatos()
}
if(process.argv[2] === "-e"){  // desde el package.json se llana esta funcion "db:eliminar": "node ./seed/seeder.js -e" se vuelve un arreglo y toma "-e"
    eliminarDatos()
}