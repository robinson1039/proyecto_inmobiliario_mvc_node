import express from 'express'
import csurf from 'csurf'
import cookieParser from 'cookie-parser'
import usuarioRountes from './routes/usuarioroutes.js'
import propiedadesRoutes from './routes/propiedadesRoutes.js'
import appRoutes from './routes/appRoutes.js'
import apiRoutes from './routes/apiRoutes.js'
import db from './config/db.js'


// crear la app 
const app = express()

// habilitar lectura de datos de formularios xpress.urlencoded es propio de express 
app.use( express.urlencoded({extended: true}))

//habilitar cookie parser 
app.use(cookieParser())

//Habiltar CSRF
app.use(csurf({cookie: true}))


//conexion a la base de datos 
try {
    await db.authenticate(); // authenticate es un metodo de sequalize 
    db.sync() //Genera la tabla en la DB si no esxiste 
    console.log('Conecxion correcta')
} catch (error) {
    console.log(error)
}

// habilitar pug .set se usa para gregar configuracion
app.set('view engine', 'pug')
app.set('views', './views')

//carpeta publica

app.use(express.static('public'))

// routing
// .get busca la ruta exacta pero si ponemos .use buscar cualqueora que inicie con '/'
app.use('/', appRoutes)
app.use('/auth', usuarioRountes)
app.use('/', propiedadesRoutes)
app.use('/api', apiRoutes)





// definir un puerto y arrancar proyecto 
const port = process.env.PORT || 3000
app.listen(port, ()=>{
    console.log(`el puerto usado es el ${port}`)
})