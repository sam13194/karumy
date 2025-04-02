/**
 * Karumy Cosmeticos - Manejo de Datos de Productos
 * Sistema para cargar y gestionar productos desde un archivo JSON
 */

// Clase para manejar la carga y gestión de productos
class ProductosManager {
    constructor() {
        this.productos = [];
        this.categorias = [];
        this.dataLoaded = false;
        this.loadPromise = this.cargarDatos();
    }

    // Cargar datos desde JSON
    async cargarDatos() {
        try {
            const response = await fetch('assets/data/productos.json');
            const data = await response.json();
            
            this.productos = data.productos || [];
            this.categorias = data.categorias || [];
            this.dataLoaded = true;
            
            console.log('Datos cargados:', this.productos.length, 'productos y', this.categorias.length, 'categorías');
            return true;
        } catch (error) {
            console.error('Error al cargar los datos de productos:', error);
            return false;
        }
    }

    // Asegurarse de que los datos estén cargados antes de cualquier operación
    async asegurarDatosCargados() {
        if (!this.dataLoaded) {
            await this.loadPromise;
        }
    }

    // Obtener todos los productos
    async obtenerTodosLosProductos() {
        await this.asegurarDatosCargados();
        return this.productos;
    }

    // Obtener productos por categoría
    async obtenerProductosPorCategoria(categoriaId) {
        await this.asegurarDatosCargados();
        return this.productos.filter(producto => producto.categoria === categoriaId);
    }

    // Obtener un producto por ID
    async obtenerProductoPorId(id) {
        await this.asegurarDatosCargados();
        return this.productos.find(producto => producto.id === id);
    }

    // Obtener productos relacionados
    async obtenerProductosRelacionados(producto) {
        await this.asegurarDatosCargados();
        
        if (!producto || !producto.productos_relacionados) {
            return [];
        }
        
        return this.productos.filter(p => producto.productos_relacionados.includes(p.id));
    }

    // Obtener productos destacados (puede ser nuevos, ofertas, etc.)
    async obtenerProductosDestacados(cantidad = 4) {
        await this.asegurarDatosCargados();
        
        // Priorizar nuevos y ofertas
        const destacados = [
            ...this.productos.filter(p => p.es_nuevo),
            ...this.productos.filter(p => p.es_oferta && !p.es_nuevo)
        ];
        
        // Si no hay suficientes destacados, agregar otros productos
        if (destacados.length < cantidad) {
            const otrosProductos = this.productos.filter(p => !p.es_nuevo && !p.es_oferta);
            destacados.push(...otrosProductos);
        }
        
        // Devolver la cantidad solicitada sin duplicados
        return [...new Set(destacados)].slice(0, cantidad);
    }

    // Obtener productos por búsqueda
    async buscarProductos(termino) {
        await this.asegurarDatosCargados();
        
        const terminoLower = termino.toLowerCase();
        
        return this.productos.filter(producto => 
            producto.nombre.toLowerCase().includes(terminoLower) ||
            producto.categoria_nombre.toLowerCase().includes(terminoLower) ||
            producto.descripcion_corta.toLowerCase().includes(terminoLower) ||
            producto.etiquetas.some(tag => tag.toLowerCase().includes(terminoLower))
        );
    }

    // Obtener todas las categorías
    async obtenerTodasLasCategorias() {
        await this.asegurarDatosCargados();
        return this.categorias;
    }

    // Obtener una categoría por ID
    async obtenerCategoriaPorId(id) {
        await this.asegurarDatosCargados();
        return this.categorias.find(categoria => categoria.id === id);
    }

    // Formatear precio en formato colombiano
    formatearPrecio(precio) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(precio);
    }

    // Obtener datos de producto para el carrito
    async obtenerDatosProductoParaCarrito(productoId, opciones = {}, cantidad = 1) {
        await this.asegurarDatosCargados();
        
        const producto = await this.obtenerProductoPorId(productoId);
        if (!producto) return null;
        
        // Calcular precio con opciones adicionales
        let precioFinal = producto.precio_oferta || producto.precio;
        
        // Sumar precios adicionales de opciones seleccionadas
        if (opciones) {
            Object.entries(opciones).forEach(([tipoOpcion, valorSeleccionado]) => {
                if (producto.opciones && producto.opciones[tipoOpcion]) {
                    const opcion = producto.opciones[tipoOpcion].find(op => op.valor === valorSeleccionado);
                    if (opcion && opcion.precio_adicional) {
                        precioFinal += opcion.precio_adicional;
                    }
                }
            });
        }
        
        // Construir objeto para el carrito
        return {
            id: producto.id,
            name: producto.nombre,
            price: precioFinal,
            image: producto.imagen_principal || this.obtenerImagenPlaceholder(producto.categoria),
            quantity: cantidad,
            options: opciones
        };
    }

    // Obtener imagen placeholder basada en categoría
    obtenerImagenPlaceholder(categoriaId) {
        const categoria = this.categorias.find(cat => cat.id === categoriaId);
        if (categoria && categoria.imagen) {
            return categoria.imagen;
        }
        return 'assets/img/placeholder.jpg';
    }
}

// Crear instancia global del gestor de productos
window.productosManager = new ProductosManager();

// Función para renderizar una card de producto (para catálogo y sliders)
function renderizarProductoCard(producto) {
    // Determinar si hay precio de oferta
    const tieneOferta = producto.precio_oferta !== null;
    const precioMostrar = tieneOferta ? producto.precio_oferta : producto.precio;
    const precioFormateado = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(precioMostrar);
    
    // Crear etiquetas (nuevo, oferta)
    let etiquetasHTML = '';
    if (producto.es_nuevo || producto.es_oferta) {
        etiquetasHTML = '<div class="product-tags">';
        if (producto.es_nuevo) {
            etiquetasHTML += '<span class="product-tag tag-new">Nuevo</span>';
        }
        if (producto.es_oferta) {
            etiquetasHTML += '<span class="product-tag tag-sale">Oferta</span>';
        }
        etiquetasHTML += '</div>';
    }
    
    // Determinar imagen o placeholder
    let imagenHTML = '';
    if (producto.imagen_principal) {
        imagenHTML = `<img src="${producto.imagen_principal}" alt="${producto.nombre}">`;
    } else {
        // Buscar el ícono de la categoría
        const categoriaInfo = window.productosManager.categorias.find(cat => cat.id === producto.categoria);
        const icono = categoriaInfo ? categoriaInfo.icono : 'fas fa-spa';
        
        imagenHTML = `
            <div class="image-placeholder">
                <i class="${icono}"></i>
            </div>
        `;
    }
    
    // Crear HTML para precio (con oferta si aplica)
    let precioHTML = '';
    if (tieneOferta) {
        const precioOriginalFormateado = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(producto.precio);
        
        precioHTML = `
            <span class="old-price">${precioOriginalFormateado}</span>
            ${precioFormateado}
        `;
    } else {
        precioHTML = precioFormateado;
    }
    
    // Armar HTML de la card
    return `
        <div class="product-card" data-product-id="${producto.id}">
            <div class="product-image">
                ${imagenHTML}
                ${etiquetasHTML}
            </div>
            <div class="product-info">
                <h3 class="product-name">${producto.nombre}</h3>
                <div class="product-category">${producto.categoria_nombre}</div>
                <div class="product-price">
                    ${precioHTML}
                </div>
                <div class="product-actions">
                    <a href="producto.html?id=${producto.id}" class="view-product">Ver detalles</a>
                    <button class="add-to-cart-btn" data-product-id="${producto.id}">Añadir</button>
                </div>
            </div>
        </div>
    `;
}

// Cargar productos en página de catálogo
async function cargarProductosEnCatalogo() {
    const productosContainer = document.querySelector('.products-grid');
    if (!productosContainer) return;
    
    try {
        // Esperar a que los datos estén cargados
        await window.productosManager.loadPromise;
        
        // Obtener todos los productos o filtrar por categoría si es necesario
        const urlParams = new URLSearchParams(window.location.search);
        const categoriaId = urlParams.get('categoria');
        
        let productos = [];
        if (categoriaId) {
            productos = await window.productosManager.obtenerProductosPorCategoria(categoriaId);
            
            // Actualizar título si estamos en una categoría específica
            const categoria = await window.productosManager.obtenerCategoriaPorId(categoriaId);
            if (categoria) {
                document.querySelector('.catalog-title').textContent = categoria.nombre;
                document.querySelector('.catalog-description').textContent = categoria.descripcion;
            }
        } else {
            productos = await window.productosManager.obtenerTodosLosProductos();
        }
        
        // Aplicar ordenamiento según el valor seleccionado
        const sortBy = document.getElementById('sortBy').value;
        ordenarProductos(productos, sortBy);
        
        // Mostrar contador de productos
        const productCountElement = document.getElementById('product-count');
        if (productCountElement) {
            productCountElement.textContent = `Mostrando ${productos.length} productos`;
        }
        
        // Renderizar cada producto
        let html = '';
        productos.forEach(producto => {
            html += renderizarProductoCard(producto);
        });
        
        productosContainer.innerHTML = html;
        
        // Añadir event listeners para los botones de añadir al carrito
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const productId = this.getAttribute('data-product-id');
                
                // Obtener datos del producto para el carrito
                const productData = await window.productosManager.obtenerDatosProductoParaCarrito(productId);
                
                // Añadir al carrito
                if (window.karumyCart && productData) {
                    window.karumyCart.addItem(productData);
                }
            });
        });
    } catch (error) {
        console.error('Error al cargar productos en catálogo:', error);
        productosContainer.innerHTML = '<p class="error-message">Ha ocurrido un error al cargar los productos. Por favor, intenta nuevamente más tarde.</p>';
    }
}

// Función para ordenar productos según el criterio seleccionado
function ordenarProductos(productos, criterio) {
    switch(criterio) {
        case 'price_asc':
            productos.sort((a, b) => (a.precio_oferta || a.precio) - (b.precio_oferta || b.precio));
            break;
        case 'price_desc':
            productos.sort((a, b) => (b.precio_oferta || b.precio) - (a.precio_oferta || a.precio));
            break;
        case 'name_asc':
            productos.sort((a, b) => a.nombre.localeCompare(b.nombre));
            break;
        case 'name_desc':
            productos.sort((a, b) => b.nombre.localeCompare(a.nombre));
            break;
        case 'newest':
            productos.sort((a, b) => {
                // Si hay fecha de lanzamiento, usarla; de lo contrario, usar ID como aproximación
                const fechaA = a.fecha_lanzamiento ? new Date(a.fecha_lanzamiento) : a.id;
                const fechaB = b.fecha_lanzamiento ? new Date(b.fecha_lanzamiento) : b.id;
                return fechaB - fechaA;
            });
            break;
        // Por defecto (relevance), no hacemos nada o podríamos implementar un algoritmo de relevancia
    }
    return productos;
}

// Función para cargar los productos destacados en la página de inicio
async function cargarProductosDestacados() {
    const productosContainer = document.querySelector('.featured-products .products-grid');
    if (!productosContainer) return;
    
    try {
        // Esperar a que los datos estén cargados
        await window.productosManager.loadPromise;
        
        // Obtener productos destacados
        const productos = await window.productosManager.obtenerProductosDestacados(4);
        
        // Renderizar cada producto
        let html = '';
        productos.forEach(producto => {
            html += renderizarProductoCard(producto);
        });
        
        productosContainer.innerHTML = html;
        
        // Añadir event listeners para los botones de añadir al carrito
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const productId = this.getAttribute('data-product-id');
                
                // Obtener datos del producto para el carrito
                const productData = await window.productosManager.obtenerDatosProductoParaCarrito(productId);
                
                // Añadir al carrito
                if (window.karumyCart && productData) {
                    window.karumyCart.addItem(productData);
                }
            });
        });
    } catch (error) {
        console.error('Error al cargar productos destacados:', error);
    }
}

// Función para cargar un producto individual en la página de producto
async function cargarProductoIndividual() {
    try {
        // Obtener el ID del producto de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const productoId = urlParams.get('id');
        
        if (!productoId) {
            console.error('No se especificó un ID de producto en la URL');
            return;
        }
        
        // Esperar a que los datos estén cargados
        await window.productosManager.loadPromise;
        
        // Obtener el producto por ID
        const producto = await window.productosManager.obtenerProductoPorId(productoId);
        
        if (!producto) {
            console.error('No se encontró el producto con ID:', productoId);
            return;
        }
        
        console.log('Cargando producto:', producto.nombre);
        
        // Actualizar el título de la página
        document.title = `${producto.nombre} | Karumy Cosmeticos`;
        
        // Actualizar elementos de la página con la información del producto
        document.querySelector('.product-title').textContent = producto.nombre;
        document.querySelector('.product-category').textContent = producto.categoria_nombre;
        
        // Actualizar breadcrumbs
        const breadcrumbProducto = document.querySelector('.product-breadcrumbs span:last-child');
        if (breadcrumbProducto) {
            breadcrumbProducto.textContent = producto.nombre;
        }
        
        const breadcrumbCategoria = document.querySelector('.product-breadcrumbs a:nth-child(5)');
        if (breadcrumbCategoria) {
            breadcrumbCategoria.textContent = producto.categoria_nombre;
            breadcrumbCategoria.href = `catalogo.html?categoria=${producto.categoria_id}`;
        }
        
        // Actualizar precio
        const precioElement = document.querySelector('.product-price');
        if (precioElement) {
            if (producto.precio_oferta) {
                const precioOriginalFormateado = window.productosManager.formatearPrecio(producto.precio);
                const precioOfertaFormateado = window.productosManager.formatearPrecio(producto.precio_oferta);
                
                precioElement.innerHTML = `
                    <span class="old-price">${precioOriginalFormateado}</span>
                    ${precioOfertaFormateado}
                `;
            } else {
                precioElement.textContent = window.productosManager.formatearPrecio(producto.precio);
            }
        }
        
        // Actualizar descripción corta
        const descripcionElement = document.querySelector('.product-description p');
        if (descripcionElement) {
            descripcionElement.textContent = producto.descripcion_corta || 'Descripción no disponible';
        }
        
        // Actualizar beneficios
        const beneficiosList = document.querySelector('.features-list');
        if (beneficiosList && producto.beneficios && producto.beneficios.length > 0) {
            beneficiosList.innerHTML = '';
            producto.beneficios.forEach(beneficio => {
                const li = document.createElement('li');
                li.textContent = beneficio;
                beneficiosList.appendChild(li);
            });
        }
        
        // Actualizar imagen principal
        const mainImageElement = document.getElementById('main-product-image');
        if (mainImageElement && producto.imagen_principal) {
            mainImageElement.src = producto.imagen_principal;
            mainImageElement.alt = producto.nombre;
        }
        
        // Actualizar galería de imágenes
        const thumbsContainer = document.querySelector('.gallery-thumbs');
        if (thumbsContainer && producto.imagenes && producto.imagenes.length > 0) {
            thumbsContainer.innerHTML = '';
            
            // Añadir imagen principal como primer thumb
            const thumbPrincipal = document.createElement('div');
            thumbPrincipal.className = 'thumb active';
            thumbPrincipal.setAttribute('data-image', producto.imagen_principal);
            thumbPrincipal.innerHTML = `<img src="${producto.imagen_principal}" alt="${producto.nombre} - Vista principal">`;
            thumbsContainer.appendChild(thumbPrincipal);
            
            // Añadir imágenes adicionales
            producto.imagenes.forEach((imagen, index) => {
                const thumb = document.createElement('div');
                thumb.className = 'thumb';
                thumb.setAttribute('data-image', imagen);
                thumb.innerHTML = `<img src="${imagen}" alt="${producto.nombre} - Vista ${index + 2}">`;
                thumbsContainer.appendChild(thumb);
            });
            
            // Añadir event listeners a los nuevos thumbs
            document.querySelectorAll('.thumb').forEach(thumb => {
                thumb.addEventListener('click', function() {
                    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    
                    const imageSrc = this.getAttribute('data-image');
                    if (imageSrc !== 'placeholder') {
                        mainImageElement.src = imageSrc;
                    }
                });
            });
        }
        
        // Actualizar metadatos
        const skuElement = document.querySelector('.meta-item:nth-child(1) .meta-label + span');
        if (skuElement) {
            skuElement.textContent = producto.sku || 'N/A';
        }
        
        const categoriaMetaElement = document.querySelector('.meta-item:nth-child(2) .meta-label + span');
        if (categoriaMetaElement) {
            categoriaMetaElement.textContent = producto.categoria_nombre;
        }
        
        const etiquetasElement = document.querySelector('.meta-item:nth-child(3) .meta-label + span');
        if (etiquetasElement && producto.etiquetas) {
            etiquetasElement.textContent = producto.etiquetas.join(', ');
        }
        
        // Actualizar contenido de los tabs
        actualizarContenidoTabs(producto);
        
        // Actualizar ID del producto en el botón de añadir al carrito
        const addToCartBtn = document.getElementById('add-to-cart');
        if (addToCartBtn) {
            addToCartBtn.setAttribute('data-product-id', producto.id);
        }
        
        // Actualizar ID del contenedor de detalles del producto
        const productDetailContainer = document.querySelector('.product-detail');
        if (productDetailContainer) {
            productDetailContainer.id = producto.id;
        }
        
        // Cargar productos relacionados
        await cargarProductosRelacionados(producto);
        
    } catch (error) {
        console.error('Error al cargar el producto individual:', error);
    }
}

// Función para actualizar el contenido de los tabs
function actualizarContenidoTabs(producto) {
    // Tab de descripción detallada
    const descriptionTab = document.getElementById('description-tab');
    if (descriptionTab) {
        // Mantener el título h3
        const titulo = descriptionTab.querySelector('h3');
        descriptionTab.innerHTML = '';
        descriptionTab.appendChild(titulo);
        
        if (producto.descripcion_detallada) {
            // Añadir párrafos de la descripción detallada
            if (typeof producto.descripcion_detallada === 'string') {
                // Si es un string, dividirlo en párrafos
                const parrafos = producto.descripcion_detallada.split('\n\n');
                parrafos.forEach(parrafo => {
                    const p = document.createElement('p');
                    p.textContent = parrafo;
                    descriptionTab.appendChild(p);
                });
            } else if (Array.isArray(producto.descripcion_detallada)) {
                // Si es un array, cada elemento es un párrafo
                producto.descripcion_detallada.forEach(parrafo => {
                    const p = document.createElement('p');
                    p.textContent = parrafo;
                    descriptionTab.appendChild(p);
                });
            }
            
            // Añadir beneficios detallados si existen
            if (producto.beneficios_detallados && producto.beneficios_detallados.length > 0) {
                const h3 = document.createElement('h3');
                h3.textContent = 'Principales beneficios:';
                descriptionTab.appendChild(h3);
                
                const ul = document.createElement('ul');
                producto.beneficios_detallados.forEach(beneficio => {
                    const li = document.createElement('li');
                    
                    if (typeof beneficio === 'object' && beneficio.titulo && beneficio.descripcion) {
                        const strong = document.createElement('strong');
                        strong.textContent = beneficio.titulo + ': ';
                        li.appendChild(strong);
                        li.appendChild(document.createTextNode(beneficio.descripcion));
                    } else {
                        li.textContent = beneficio;
                    }
                    
                    ul.appendChild(li);
                });
                descriptionTab.appendChild(ul);
            }
        } else {
            // Mostrar mensaje por defecto si no hay descripción detallada
            const p = document.createElement('p');
            p.textContent = `${producto.nombre} es un producto de alta calidad de Karumy Cosmeticos. Estamos trabajando en una descripción detallada. Mientras tanto, puedes contactarnos para más información.`;
            descriptionTab.appendChild(p);
        }
    }
    
    // Tab de ingredientes
    const ingredientsTab = document.getElementById('ingredients-tab');
    if (ingredientsTab) {
        // Mantener el título h3
        const titulo = ingredientsTab.querySelector('h3');
        ingredientsTab.innerHTML = '';
        ingredientsTab.appendChild(titulo);
        
        if (producto.ingredientes && producto.ingredientes.length > 0) {
            // Añadir párrafo introductorio
            const p = document.createElement('p');
            p.textContent = producto.ingredientes_intro || `Nuestro producto ${producto.nombre} está formulado con ingredientes de alta calidad seleccionados por sus propiedades nutritivas:`;
            ingredientsTab.appendChild(p);
            
            // Añadir lista de ingredientes
            const ul = document.createElement('ul');
            producto.ingredientes.forEach(ingrediente => {
                const li = document.createElement('li');
                
                if (typeof ingrediente === 'object' && ingrediente.nombre && ingrediente.descripcion) {
                    const strong = document.createElement('strong');
                    strong.textContent = ingrediente.nombre + ': ';
                    li.appendChild(strong);
                    li.appendChild(document.createTextNode(ingrediente.descripcion));
                } else {
                    li.textContent = ingrediente;
                }
                
                ul.appendChild(li);
            });
            ingredientsTab.appendChild(ul);
            
            // Añadir información "Sin" ingredientes nocivos
            if (producto.sin_ingredientes && producto.sin_ingredientes.length > 0) {
                const pSin = document.createElement('p');
                const strong = document.createElement('strong');
                strong.textContent = 'Sin: ';
                pSin.appendChild(strong);
                pSin.appendChild(document.createTextNode(producto.sin_ingredientes.join(', ') + '.'));
                ingredientsTab.appendChild(pSin);
            }
        } else {
            // Mostrar mensaje por defecto si no hay ingredientes
            const p = document.createElement('p');
            p.textContent = `La información detallada de ingredientes para ${producto.nombre} estará disponible próximamente. Todos nuestros productos están formulados con ingredientes naturales de alta calidad.`;
            ingredientsTab.appendChild(p);
        }
    }
    
    // Tab de modo de uso
    const howToUseTab = document.getElementById('how-to-use-tab');
    if (howToUseTab) {
        // Mantener el título h3
        const titulo = howToUseTab.querySelector('h3');
        howToUseTab.innerHTML = '';
        howToUseTab.appendChild(titulo);
        
        if (producto.modo_uso) {
            // Añadir párrafo introductorio
            const p = document.createElement('p');
            p.textContent = producto.modo_uso_intro || `Para obtener los mejores resultados con nuestro producto ${producto.nombre}, sigue estos sencillos pasos:`;
            howToUseTab.appendChild(p);
            
            // Añadir pasos numerados
            if (producto.modo_uso.pasos && producto.modo_uso.pasos.length > 0) {
                const ol = document.createElement('ol');
                producto.modo_uso.pasos.forEach(paso => {
                    const li = document.createElement('li');
                    
                    if (typeof paso === 'object' && paso.titulo && paso.descripcion) {
                        const strong = document.createElement('strong');
                        strong.textContent = paso.titulo + ': ';
                        li.appendChild(strong);
                        li.appendChild(document.createTextNode(paso.descripcion));
                    } else {
                        li.textContent = paso;
                    }
                    
                    ol.appendChild(li);
                });
                howToUseTab.appendChild(ol);
            }
            
            // Añadir consejos adicionales
            if (producto.modo_uso.consejos && producto.modo_uso.consejos.length > 0) {
                const pConsejos = document.createElement('p');
                const strong = document.createElement('strong');
                strong.textContent = 'Consejos adicionales:';
                pConsejos.appendChild(strong);
                howToUseTab.appendChild(pConsejos);
                
                const ul = document.createElement('ul');
                producto.modo_uso.consejos.forEach(consejo => {
                    const li = document.createElement('li');
                    li.textContent = consejo;
                    ul.appendChild(li);
                });
                howToUseTab.appendChild(ul);
            }
        } else {
            // Mostrar mensaje por defecto si no hay modo de uso
            const p = document.createElement('p');
            p.textContent = `Para usar ${producto.nombre}, aplica una pequeña cantidad sobre la piel limpia y seca con movimientos circulares suaves. Para mejores resultados, úsalo diariamente como parte de tu rutina de cuidado personal.`;
            howToUseTab.appendChild(p);
            
            const pConsulta = document.createElement('p');
            pConsulta.textContent = `Para instrucciones más específicas, por favor contáctanos o consulta con un especialista.`;
            howToUseTab.appendChild(pConsulta);
        }
    }
    
    // Tab de opiniones
    const reviewsTab = document.getElementById('reviews-tab');
    if (reviewsTab) {
        // Mantener el título h3
        const titulo = reviewsTab.querySelector('h3');
        reviewsTab.innerHTML = '';
        reviewsTab.appendChild(titulo);
        
        if (producto.opiniones && producto.opiniones.length > 0) {
            // Añadir opiniones
            producto.opiniones.forEach(opinion => {
                const reviewDiv = document.createElement('div');
                reviewDiv.className = 'review';
                
                // Crear header de la opinión
                const headerDiv = document.createElement('div');
                headerDiv.className = 'review-header';
                
                // Nombre del reviewer
                const nameDiv = document.createElement('div');
                nameDiv.className = 'reviewer-name';
                nameDiv.textContent = opinion.nombre;
                headerDiv.appendChild(nameDiv);
                
                // Rating con estrellas
                const ratingDiv = document.createElement('div');
                ratingDiv.className = 'review-rating';
                for (let i = 1; i <= 5; i++) {
                    const star = document.createElement('i');
                    star.className = i <= opinion.rating ? 'fas fa-star' : 'far fa-star';
                    ratingDiv.appendChild(star);
                }
                headerDiv.appendChild(ratingDiv);
                
                // Fecha
                const dateDiv = document.createElement('div');
                dateDiv.className = 'review-date';
                dateDiv.textContent = opinion.fecha;
                headerDiv.appendChild(dateDiv);
                
                reviewDiv.appendChild(headerDiv);
                
                // Contenido de la opinión
                const contentDiv = document.createElement('div');
                contentDiv.className = 'review-content';
                const p = document.createElement('p');
                p.textContent = opinion.texto;
                contentDiv.appendChild(p);
                
                reviewDiv.appendChild(contentDiv);
                
                // Añadir la opinión completa al tab
                reviewsTab.appendChild(reviewDiv);
            });
        } else {
            // Mostrar mensaje si no hay opiniones
            const noReviewsP = document.createElement('p');
            noReviewsP.textContent = 'Aún no hay opiniones para este producto. ¡Sé el primero en opinar!';
            reviewsTab.appendChild(noReviewsP);
            
            // Añadir formulario o botón para dejar opinión
            const reviewCTA = document.createElement('div');
            reviewCTA.className = 'review-cta';
            reviewCTA.innerHTML = `
                <p>¿Has usado ${producto.nombre}? Comparte tu experiencia con otros clientes.</p>
                <button class="btn-primary" id="write-review-btn">Escribir una opinión</button>
            `;
            reviewsTab.appendChild(reviewCTA);
            
            // Añadir event listener al botón (puedes implementar la funcionalidad después)
            setTimeout(() => {
                const writeReviewBtn = document.getElementById('write-review-btn');
                if (writeReviewBtn) {
                    writeReviewBtn.addEventListener('click', function() {
                        alert('Próximamente podrás dejar tu opinión. ¡Gracias por tu interés!');
                    });
                }
            }, 100);
        }
    }
}

// Función para cargar productos relacionados
async function cargarProductosRelacionados(producto) {
    try {
        // Esperar a que los datos estén cargados
        await window.productosManager.loadPromise;
        
        // Obtener productos de la misma categoría (excluyendo el producto actual)
        const productosRelacionados = await window.productosManager.obtenerProductosPorCategoria(producto.categoria, 4, producto.id);
        
        // Si no hay productos relacionados específicos, intentar obtener productos destacados
        let productosAMostrar = productosRelacionados.length > 0 ? 
            productosRelacionados : 
            await window.productosManager.obtenerProductosDestacados(4, producto.id);
        
        // Limitar a 4 productos
        productosAMostrar = productosAMostrar.slice(0, 4);
        
        // Obtener el contenedor de productos relacionados
        const contenedorRelacionados = document.querySelector('.related-products .products-grid');
        if (!contenedorRelacionados) {
            console.error('No se encontró el contenedor de productos relacionados');
            return;
        }
        
        // Limpiar el contenedor
        contenedorRelacionados.innerHTML = '';
        
        // Añadir los productos relacionados
        productosAMostrar.forEach(productoRelacionado => {
            // Crear el elemento de producto con el mismo formato que en el catálogo
            const productoElement = document.createElement('div');
            productoElement.className = 'product-card';
            productoElement.setAttribute('data-product-id', productoRelacionado.id);
            
            // Formatear precio
            let precioHTML = '';
            if (productoRelacionado.precio_oferta) {
                const precioOriginalFormateado = window.productosManager.formatearPrecio(productoRelacionado.precio);
                const precioOfertaFormateado = window.productosManager.formatearPrecio(productoRelacionado.precio_oferta);
                
                precioHTML = `
                    <div class="product-price">
                        <span class="old-price">${precioOriginalFormateado}</span>
                        <span class="current-price">${precioOfertaFormateado}</span>
                    </div>
                `;
            } else {
                precioHTML = `
                    <div class="product-price">
                        <span class="current-price">${window.productosManager.formatearPrecio(productoRelacionado.precio)}</span>
                    </div>
                `;
            }
            
            // Crear etiquetas de nuevo y oferta
            const etiquetasHTML = [];
            if (productoRelacionado.es_nuevo) {
                etiquetasHTML.push('<span class="product-tag new-tag">Nuevo</span>');
            }
            if (productoRelacionado.es_oferta) {
                etiquetasHTML.push('<span class="product-tag sale-tag">Oferta</span>');
            }
            
            // Construir HTML del producto
            productoElement.innerHTML = `
                <div class="product-image">
                    <a href="producto.html?id=${productoRelacionado.id}">
                        <img src="${productoRelacionado.imagen_principal}" alt="${productoRelacionado.nombre}">
                    </a>
                    <div class="product-actions">
                        <button class="action-btn quick-view-btn" data-product-id="${productoRelacionado.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn add-to-cart-btn" data-product-id="${productoRelacionado.id}">
                            <i class="fas fa-shopping-cart"></i>
                        </button>
                        <button class="action-btn add-to-wishlist-btn" data-product-id="${productoRelacionado.id}">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                    <div class="product-tags">
                        ${etiquetasHTML.join('')}
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">
                        <a href="producto.html?id=${productoRelacionado.id}">${productoRelacionado.nombre}</a>
                    </h3>
                    <div class="product-category">${productoRelacionado.categoria_nombre}</div>
                    ${precioHTML}
                </div>
            `;
            
            // Añadir el producto al contenedor
            contenedorRelacionados.appendChild(productoElement);
        });
        
        // Añadir event listeners a los botones
        document.querySelectorAll('.related-products .quick-view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                abrirVistaRapida(productId);
            });
        });
        
        document.querySelectorAll('.related-products .add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                window.cartManager.agregarAlCarrito(productId, 1);
            });
        });
        
        document.querySelectorAll('.related-products .add-to-wishlist-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                window.wishlistManager.toggleWishlistItem(productId);
                actualizarIconoWishlist(this, productId);
            });
        });
        
    } catch (error) {
        console.error('Error al cargar productos relacionados:', error);
    }
}

// Función para actualizar el icono de wishlist
function actualizarIconoWishlist(button, productId) {
    const isInWishlist = window.wishlistManager.isInWishlist(productId);
    const icon = button.querySelector('i');
    
    if (isInWishlist) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        icon.classList.add('text-danger');
    } else {
        icon.classList.remove('fas');
        icon.classList.remove('text-danger');
        icon.classList.add('far');
    }
}

// Updated function to correctly set breadcrumbs for product detail page
async function updateBreadcrumbs(producto) {
    // Try different possible selectors for breadcrumbs
    const breadcrumbsContainer = document.querySelector('.product-breadcrumbs, .breadcrumbs, .product-detail-breadcrumbs');
    
    if (!breadcrumbsContainer || !producto) {
        console.error('No breadcrumbs container found or product data missing');
        return;
    }
    
    try {
        // Get the category information
        const categoria = await window.productosManager.obtenerCategoriaPorId(producto.categoria);
        const categoriaName = categoria ? categoria.nombre : 'Categoría';
        const categoriaId = categoria ? categoria.id : '';
        
        console.log('Updating breadcrumbs for product:', producto.nombre, 'category:', categoriaName);
        
        // Update the breadcrumbs HTML
        breadcrumbsContainer.innerHTML = `
            <a href="index.html">Inicio</a>
            <span>/</span>
            <a href="catalogo.html">Productos</a>
            <span>/</span>
            <a href="catalogo.html?categoria=${categoriaId}">${categoriaName}</a>
            <span>/</span>
            <span>${producto.nombre}</span>
        `;
    } catch (error) {
        console.error('Error al actualizar breadcrumbs:', error);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Cargar productos según la página actual
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'index.html' || currentPage === '') {
        cargarProductosDestacados();
    } else if (currentPage === 'catalogo.html') {
        cargarProductosEnCatalogo();
        
        // Añadir event listener para el cambio en el dropdown de ordenamiento
        const sortBySelect = document.getElementById('sortBy');
        if (sortBySelect) {
            sortBySelect.addEventListener('change', function() {
                cargarProductosEnCatalogo();
            });
        }
    } else if (currentPage === 'producto.html' || window.location.pathname.includes('producto.html')) {
        cargarProductoIndividual();
    }
});
