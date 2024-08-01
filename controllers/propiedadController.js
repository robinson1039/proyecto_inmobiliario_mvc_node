import {unlink} from 'node:fs/promises'
import { validationResult } from "express-validator"
import {Precio, Categoria, Propiedad, Mensaje, Usuario} from "../models/index.js"
import { esVendedor, formatearFecha } from '../helpers/index.js'

const admin = async (req, res) => {
    // leer querys parametros de la URL

    const{pagina: paginaActual} = req.query
    const expresion = /^[1-9]$/   // ^= que empiece con digitos en este caso $= que finalice con digitos 
    if(!expresion.test(paginaActual)){
        res.redirect('/mis-propiedades?pagina=1')
    }

    try {
        const {id} = req.usuario

        //limites y offset

        const limit = 10;
        const offset = ((paginaActual * limit) - limit)

        const [propiedades, total] = await Promise.all([
             Propiedad.findAll({
                limit: limit,
                offset: offset,
                where: {
                    usuarioId: id
                },
                include: [
                    {model: Categoria, as:'categoria'},
                    {model: Precio, as:'precio'},
                    {model: Mensaje, as: 'mensajes'}
                ]
            }),
            Propiedad.count({
                where: {
                    usuarioId: id
                }
            })
        ])
        console.log(total)
        res.render('propiedades/admin', {
            pagina: 'Mis propiedades',
            propiedades,   // igual a propiedades: propiedades
            csrfToken: req.csrfToken(),
            paginas: Math.ceil(total / limit),
            paginaActual: Number(paginaActual),
            total,
            offset,
            limit
            
        }) 
    } catch (error) {
        console.log(error)
    }

    
}

// formulario para crear una propiedad
const crear = async (req, res) => {
    //Consultar modelo de precios y categorias
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])
    res.render('propiedades/crear', {
        pagina: 'Crear propiedad',
        csrfToken: req.csrfToken(),
        categorias,     // es iagual que tener categorias: categorias
        precios,
        datos: {}
    })

}

const guardar = async (req, res) => {
    // resultado d ela validacion 
    let resultado = validationResult(req)

    if(!resultado.isEmpty()){
        //consultar modello de precio y categoria solo si hay un error para mostrra los datos 
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])
       return res.render('propiedades/crear', {
            pagina: 'Crear propiedad',
            csrfToken: req.csrfToken(),
            categorias,     // es iagual que tener categorias: categorias
            precios,
            errores: resultado.array(),
            datos: req.body
        })
    }
    // crear un registro
    const {titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId, categoria: categoriaId} = req.body

    const { id:usuarioId } = req.usuario

    try {
        const propiedadGuardada = await Propiedad.create({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioId,
            categoriaId,
            usuarioId,
            imagen: ''

        })
        const { id } = propiedadGuardada
        res.redirect(`/propiedades/agregar-imagen/${id}`)
    } catch (error) {
        console.log(error)
    }
}

const agregarImagen = async (req, res) => {
    const {id} = req.params  
    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }
    // validar que la propiedad no este publicada
    if(propiedad.publicado){
        return res.redirect('/mis-propiedades')
    }
    //Validar que la propiedad pertenece a quien visita esta pagina 
    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()){
        return res.redirect('/mis-propiedades')
    }


    res.render('propiedades/agregar-imagen', {
        pagina: `Agragar imagen: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        propiedad
    })
}

const almacenarImagen = async (req, res, next) => {
    const {id} = req.params  
    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }
    // validar que la propiedad no este publicada
    if(propiedad.publicado){
        return res.redirect('/mis-propiedades')
    }
    //Validar que la propiedad pertenece a quien visita esta pagina 
    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()){
        return res.redirect('/mis-propiedades')
    }
    try {
        // almacenar imagen y publicar propiedad
        propiedad.imagen = req.file.filename
        propiedad.publicado = 1
        await propiedad.save()
        next()
    } catch (error) {
        console.log(error)
    }
}

const editar = async (req, res) => {

        const { id } = req.params

        // validar que la propiedad exista
        const propiedad = await Propiedad.findByPk(id)

        if(!propiedad) {
            return res.redirect('/mis-propiedades')
        }
        //validar que quien crea la URL es quien  creo la propiedad
        if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
            return res.redirect('/mis-propiedades')
        }

        //Consultar modelo de precios y categorias
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])
        res.render('propiedades/editar', {
            pagina: `Editar propiedad: ${propiedad.titulo}`,
            csrfToken: req.csrfToken(),
            categorias,     // es iagual que tener categorias: categorias
            precios,
            datos: propiedad
        })
}

const guardarCambios = async (req, res) => {
       // Verificar la validacion
       let resultado = validationResult(req)

       if(!resultado.isEmpty()){
           //consultar modello de precio y categoria solo si hay un error para mostrra los datos 
           const [categorias, precios] = await Promise.all([
               Categoria.findAll(),
               Precio.findAll()
           ])
          return res.render('propiedades/editar', {
            pagina: 'Editar propiedad',
            csrfToken: req.csrfToken(),
            categorias,     // es iagual que tener categorias: categorias
            precios,
            errores: resultado.array(),
            datos: req.body
        })
       }
       const {id} = req.params

       // validar que la proteccion exita 
       const propiedad = await Propiedad.findByPk(id)

       if(!propiedad) {
           return res.redirect('/mis-propiedades')
       }
       //validar que quien crea la URL es quien  creo la propiedad
       if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
           return res.redirect('/mis-propiedades')
       }
       // reescribir el onjeto y acrualizarlo
       try {
            const {titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId, categoria: categoriaId} = req.body
            propiedad.set({
                titulo,
                descripcion,
                habitaciones,
                estacionamiento,
                wc,
                calle,
                lat,
                lng,
                precioId,
                categoriaId
            })
            await propiedad.save()
            res.redirect('/mis-propiedades')
       } catch (error) {
            console.log(error)
       }
}  

const eliminar = async (req, res) => {
    const {id} = req.params

       // validar que la proteccion exita 
       const propiedad = await Propiedad.findByPk(id)

       if(!propiedad) {
           return res.redirect('/mis-propiedades')
       }
       //validar que quien crea la URL es quien  creo la propiedad
       if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
           return res.redirect('/mis-propiedades')
       }
       // eliminar imagen
       await unlink(`public/uploads/${propiedad.imagen}`)
        console.log('emiminado')
       // elimianr propiedad
       await propiedad.destroy()
       res.redirect('/mis-propiedades')
}
//modificar el estado de la propiedad
const cambiarEstado = async(req, res) =>{
    const {id} = req.params

    // validar que la proteccion exita 
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad) {
        return res.redirect('/mis-propiedades')
    }
    //validar que quien crea la URL es quien  creo la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades')
    }
    //Actualizar

    propiedad.publicado = !propiedad.publicado

    await propiedad.save()

    res.json({
        resultado: true
    })
}

// muestra una propiedad

const mostraPropiedad = async (req,res) =>{

    const {id} = req.params

    // comprobar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id,{
        include: [
            {model: Categoria, as:'categoria'},
            {model: Precio, as:'precio'}
        ]
    })
    
    if(!propiedad || !propiedad.publicado){
        return res.redirect('/404')
    }
    res.render('propiedades/mostrar',{
        propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId)

    })  
}

const enviarMensaje = async (req, res) => {
    const {id} = req.params

    // comprobar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id,{
        include: [
            {model: Categoria, as:'categoria'},
            {model: Precio, as:'precio'}
        ]
    })
    
    if(!propiedad){
        return res.redirect('/404')
    }
    // renderizar los errores 
    let resultado = validationResult(req)

    if(!resultado.isEmpty()){
       return res.render('propiedades/mostrar',{
            propiedad,
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
            errores: resultado.array()
    
        })
    }

    const { mensaje } = req.body
    const { id: propiedadId } = req.params  // id: sirve para renombrar el valor 
    const { id: usuarioId } = req.usuario

    //almacenar mensaje
    await Mensaje.create({
        mensaje,
        propiedadId,
        usuarioId
    })
    // res.render('propiedades/mostrar',{
    //     propiedad,
    //     pagina: propiedad.titulo,
    //     csrfToken: req.csrfToken(),
    //     usuario: req.usuario,
    //     esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
    //     enviado: true

    // })
    res.redirect('/')
}

// leer mensajes recibidos
const verMensajes = async (req, res) => {
    const {id} = req.params

    // validar que la proteccion exita 
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            {model: Mensaje, as: 'mensajes',
                include: [
                    {model: Usuario.scope('eliminarPassword'), as: 'usuario'}
                ]
            }
        ]
    })

    if(!propiedad) {
        return res.redirect('/mis-propiedades')
    }
    //validar que quien crea la URL es quien  creo la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades')
    }
    res.render('propiedades/mensajes',{
        pagina: 'Mensajes',
        mensajes: propiedad.mensajes,
        formatearFecha

    })
}
export {
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen,
    editar,
    guardarCambios,
    eliminar,
    cambiarEstado,
    mostraPropiedad,
    enviarMensaje,
    verMensajes
}