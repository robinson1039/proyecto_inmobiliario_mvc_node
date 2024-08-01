(function(){
    const lat =  6.2262987;
    const lng = -75.597363;
    const mapa = L.map('mapa-inicio').setView([lat, lng ], 16);

    let markers = new L.featureGroup().addTo(mapa)

    let propiedades = []
   // filtros 

    const filtros = {
        categoria: '',
        precio: ''
    }
    const categoriasSelect = document.querySelector('#categorias')
    const preciosSelect = document.querySelector('#precios')
 

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);

    // filtrado de categorias y precios 
    categoriasSelect.addEventListener('change', e => {
        filtros.categoria = +e.target.value
        filtrarPropiedades()
    })

    preciosSelect.addEventListener('change', e => {
        filtros.precio = +e.target.value
        filtrarPropiedades()
    })
    const  obtenerPropiedades = async () => {
        try {
            const url = '/api/propiedades'
            const respuesta = await fetch(url)
            propiedades = await respuesta.json()
            mostraPropiedades(propiedades)
            

        } catch (error) {
            console.log(error)
        }
    }



    const mostraPropiedades = propiedades => {
        
        // limpiar los markers previos 

        markers.clearLayers()
       
       propiedades.forEach(propiedad => {
            // agregar pines
            const marker= new L.marker([propiedad?.lat, propiedad?.lng], {
                autoPan: true
            })
            .addTo(mapa)
            .bindPopup(`
                    <p class="text-gray-600 font-bold">${propiedad?.categoria.nombre}</p>
                    <h1 class="text-xs l font-extrabold uppercase my-3">${propiedad?.titulo}</h1>
                    <img src="/uploads/${propiedad?.imagen}" alt="imagen de la propiedad${propiedad?.titulo}">
                    <p class="text-gray-600 font-bold">${propiedad?.precio.nombre}</p>
                    <a href="/propiedad/${propiedad?.id}" class="bg-indigo-500 block p-2 text-center font-bold uppercase">Ver propiedad</a>
                `)

            markers.addLayer(marker)
       })
    }

    const filtrarPropiedades = () => {
        const resultado = propiedades.filter(filtrarCategoria).filter(filtrarPrecio)
        mostraPropiedades(resultado)
    }
    const filtrarCategoria= propiedad => filtros.categoria ? propiedad.categoriaId === filtros.categoria : propiedad
    const filtrarPrecio= propiedad => filtros.precio ? propiedad.precioId === filtros.precio : propiedad

    obtenerPropiedades()
})()
