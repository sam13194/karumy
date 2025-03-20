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

// Cargar producto en página de producto individual
async function cargarProductoIndividual() {
    // Verificar si estamos en la página de producto
    const productDetailContainer = document.querySelector('.product-detail');
    if (!productDetailContainer) return;
    
    try {
        // Obtener ID del producto desde la URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (!productId) {
            window.location.href = 'catalogo.html';
            return;
        }
        
        // Esperar a que los datos estén cargados
        await window.productosManager.loadPromise;
        
        // Obtener datos del producto
        const producto = await window.productosManager.obtenerProductoPorId(productId);
        
        if (!producto) {
            productDetailContainer.innerHTML = '<p class="error-message">Producto no encontrado</p>';
            return;
        }
        
        // Actualizar ID del contenedor
        productDetailContainer.id = producto.id;
        
        // Actualizar título de la página
        document.title = `${producto.nombre} - Karumy Cosmeticos`;
        
        // Actualizar breadcrumbs
        const breadcrumbsContainer = document.querySelector('.product-breadcrumbs');
        if (breadcrumbsContainer) {
            breadcrumbsContainer.innerHTML = `
                <a href="index.html">Inicio</a>
                <span>/</span>
                <a href="catalogo.html">Productos</a>
                <span>/</span>
                <a href="catalogo.html?categoria=${producto.categoria}">${producto.categoria_nombre}</a>
                <span>/</span>
                <span>${producto.nombre}</span>
            `;
        }
        
        // Actualizar imagen principal
        const mainImageContainer = document.getElementById('main-product-image');
        if (mainImageContainer) {
            if (producto.imagen_principal) {
                mainImageContainer.src = producto.imagen_principal;
            } else {
                // Si no hay imagen, reemplazar por un placeholder
                const mainImageParent = mainImageContainer.parentElement;
                mainImageParent.innerHTML = `
                    <div class="image-placeholder">
                        <i class="${producto.categoria ? window.productosManager.categorias.find(c => c.id === producto.categoria)?.icono || 'fas fa-spa' : 'fas fa-spa'}"></i>
                    </div>
                `;
            }
        }
        
        // Actualizar miniaturas
        const thumbsContainer = document.querySelector('.gallery-thumbs');
        if (thumbsContainer) {
            // Limpiar thumbs existentes
            thumbsContainer.innerHTML = '';
            
            // Añadir imagen principal como primer thumb
            let thumbsHTML = '';
            
            if (producto.imagen_principal) {
                thumbsHTML += `
                    <div class="thumb active" data-image="${producto.imagen_principal}">
                        <img src="${producto.imagen_principal}" alt="${producto.nombre} - Vista principal">
                    </div>
                `;
            } else {
                thumbsHTML += `
                    <div class="thumb active" data-image="placeholder">
                        <div class="image-placeholder">
                            <i class="${producto.categoria ? window.productosManager.categorias.find(c => c.id === producto.categoria)?.icono || 'fas fa-spa' : 'fas fa-spa'}"></i>
                        </div>
                    </div>
                `;
            }
            
            // Añadir imágenes adicionales como thumbs
            if (producto.imagenes_adicionales && producto.imagenes_adicionales.length > 0) {
                producto.imagenes_adicionales.forEach((imagen, index) => {
                    thumbsHTML += `
                        <div class="thumb" data-image="${imagen}">
                            <img src="${imagen}" alt="${producto.nombre} - Vista ${index + 2}">
                        </div>
                    `;
                });
            }
            
            // Añadir placeholders para completar la galería
            const totalThumbs = 4; // Total deseado de miniaturas
            const actualThumbs = 1 + (producto.imagenes_adicionales?.length || 0);
            
            for (let i = actualThumbs; i < totalThumbs; i++) {
                thumbsHTML += `
                    <div class="thumb" data-image="placeholder">
                        <div class="image-placeholder">
                            <i class="fas fa-${i === 1 ? 'spa' : i === 2 ? 'leaf' : 'tint'}"></i>
                        </div>
                    </div>
                `;
            }
            
            thumbsContainer.innerHTML = thumbsHTML;
            
            // Añadir event listeners a los thumbs
            document.querySelectorAll('.thumb').forEach(thumb => {
                thumb.addEventListener('click', function() {
                    // Activar thumb
                    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Cambiar imagen principal
                    const imageSrc = this.getAttribute('data-image');
                    const mainImage = document.getElementById('main-product-image');
                    
                    if (imageSrc !== 'placeholder' && mainImage) {
                        mainImage.src = imageSrc;
                    }
                });
            });
        }
        
        // Actualizar información del producto
        document.querySelector('.product-title').textContent = producto.nombre;
        document.querySelector('.product-category').textContent = producto.categoria_nombre;
        
        // Actualizar precio
        const precioContainer = document.querySelector('.product-price-container');
        if (precioContainer) {
            let precioHTML = '';
            
            if (producto.precio_oferta !== null) {
                // Mostrar precio original y oferta
                precioHTML = `
                    <span class="old-price">${window.productosManager.formatearPrecio(producto.precio)}</span>
                    <div class="product-price">${window.productosManager.formatearPrecio(producto.precio_oferta)}</div>
                    <span class="sale-badge">Oferta</span>
                `;
            } else {
                // Mostrar solo precio normal
                precioHTML = `
                    <div class="product-price">${window.productosManager.formatearPrecio(producto.precio)}</div>
                `;
            }
            
            precioContainer.innerHTML = precioHTML;
        }
        
        // Actualizar descripción corta
        document.querySelector('.product-description').innerHTML = `<p>${producto.descripcion_corta}</p>`;
        
        // Actualizar beneficios
        const beneficiosContainer = document.querySelector('.features-list');
        if (beneficiosContainer && producto.beneficios) {
            let beneficiosHTML = '';
            
            producto.beneficios.forEach(beneficio => {
                beneficiosHTML += `<li>${beneficio}</li>`;
            });
            
            beneficiosContainer.innerHTML = beneficiosHTML;
        }
        
        // Actualizar opciones del producto (tamaños, colores, etc.)
        const opcionesContainer = document.querySelector('.product-options');
        if (opcionesContainer && producto.opciones) {
            let opcionesHTML = '';
            
            // Procesar cada tipo de opción
            Object.entries(producto.opciones).forEach(([tipoOpcion, opciones]) => {
                // Capitalizar primera letra del tipo
                const tipoCapitalizado = tipoOpcion.charAt(0).toUpperCase() + tipoOpcion.slice(1);
                
                opcionesHTML += `
                    <div class="option-group">
                        <label for="${tipoOpcion}" class="option-label">${tipoCapitalizado}</label>
                        <select id="${tipoOpcion}" name="${tipoOpcion}" class="option-select">
                `;
                
                // Añadir cada opción
                opciones.forEach(opcion => {
                    const textoAdicional = opcion.precio_adicional ? ` (+${window.productosManager.formatearPrecio(opcion.precio_adicional)})` : '';
                    opcionesHTML += `<option value="${opcion.valor}">${opcion.valor}${textoAdicional}</option>`;
                });
                
                opcionesHTML += `
                        </select>
                    </div>
                `;
            });
            
            opcionesContainer.innerHTML = opcionesHTML;
        }
        
        // Actualizar metadatos del producto (SKU, categoría, etiquetas)
        const metaContainer = document.querySelector('.product-meta');
        if (metaContainer) {
            let etiquetasText = producto.etiquetas ? producto.etiquetas.join(', ') : '';
            
            metaContainer.innerHTML = `
                <div class="meta-item">
                    <span class="meta-label">SKU:</span> ${producto.sku}
                </div>
                <div class="meta-item">
                    <span class="meta-label">Categoría:</span> ${producto.categoria_nombre}
                </div>
                <div class="meta-item">
                    <span class="meta-label">Etiquetas:</span> ${etiquetasText}
                </div>
            `;
        }
        
        // Actualizar tabs de contenido
        // Tab de descripción
        const descriptionTab = document.getElementById('description-tab');
        if (descriptionTab && producto.descripcion_completa) {
            let descHTML = '<h3>Descripción detallada</h3>';
            
            // Convertir array de párrafos a HTML
            producto.descripcion_completa.forEach(parrafo => {
                descHTML += `<p>${parrafo}</p>`;
            });
            
            // Añadir beneficios
            if (producto.beneficios && producto.beneficios.length > 0) {
                descHTML += '<h3>Principales beneficios:</h3><ul>';
                
                producto.beneficios.forEach(beneficio => {
                    // Extraer y destacar título si existe (formato: "Título: descripción")
                    if (beneficio.includes(':')) {
                        const [titulo, desc] = beneficio.split(':');
                        descHTML += `<li><strong>${titulo}:</strong>${desc}</li>`;
                    } else {
                        descHTML += `<li>${beneficio}</li>`;
                    }
                });
                
                descHTML += '</ul>';
            }
            
            descriptionTab.innerHTML = descHTML;
        }
        
        // Tab de ingredientes
        const ingredientsTab = document.getElementById('ingredients-tab');
        if (ingredientsTab && producto.ingredientes) {
            let ingHTML = '<h3>Ingredientes</h3>';
            
            ingHTML += '<p>Nuestra ' + producto.nombre + ' está formulada con ingredientes de alta calidad seleccionados por sus propiedades nutritivas y cuidadosamente combinados para maximizar sus beneficios:</p>';
            
            ingHTML += '<ul>';
            producto.ingredientes.forEach(ingrediente => {
                // Extraer y destacar el nombre del ingrediente si existe (formato: "Ingrediente: descripción")
                if (ingrediente.includes(':')) {
                    const [nombre, desc] = ingrediente.split(':');
                    ingHTML += `<li><strong>${nombre}:</strong>${desc}</li>`;
                } else {
                    ingHTML += `<li>${ingrediente}</li>`;
                }
            });
            ingHTML += '</ul>';
            
            ingHTML += '<p><strong>Sin:</strong> Parabenos, sulfatos, colorantes artificiales, fragancias sintéticas ni ingredientes de origen animal.</p>';
            
            ingredientsTab.innerHTML = ingHTML;
        }
        
        // Tab de modo de uso
        const howToUseTab = document.getElementById('how-to-use-tab');
        if (howToUseTab && producto.modo_uso) {
            let useHTML = '<h3>Modo de uso</h3>';
            
            useHTML += '<p>Para obtener los mejores resultados con nuestra ' + producto.nombre + ', sigue estos sencillos pasos:</p>';
            
            useHTML += '<ol>';
            producto.modo_uso.forEach(paso => {
                // Extraer y destacar el título del paso si existe (formato: "Título: descripción")
                if (paso.includes(':')) {
                    const [titulo, desc] = paso.split(':');
                    useHTML += `<li><strong>${titulo}:</strong>${desc}</li>`;
                } else {
                    useHTML += `<li>${paso}</li>`;
                }
            });
            useHTML += '</ol>';
            
            howToUseTab.innerHTML = useHTML;
        }
        
        // Actualizar slider de productos relacionados
        await cargarProductosRelacionados(producto);
        
        // Configurar botón de añadir al carrito
        const addToCartButton = document.getElementById('add-to-cart');
        if (addToCartButton) {
            addToCartButton.addEventListener('click', async function() {
                // Recopilar información del producto y opciones seleccionadas
                const opciones = {};
                
                // Obtener opciones seleccionadas (tamaños, colores, etc.)
                if (producto.opciones) {
                    Object.keys(producto.opciones).forEach(tipoOpcion => {
                        const selectElement = document.getElementById(tipoOpcion);
                        if (selectElement) {
                            opciones[tipoOpcion] = selectElement.value;
                        }
                    });
                }
                
                // Obtener cantidad
                const cantidad = parseInt(document.getElementById('product-quantity').value || '1');
                
                // Obtener datos del producto para el carrito
                const productData = await window.productosManager.obtenerDatosProductoParaCarrito(
                    producto.id,
                    opciones,
                    cantidad
                );
                
                // Añadir al carrito
                if (window.karumyCart && productData) {
                    window.karumyCart.addItem(productData);
                }
            });
        }
    } catch (error) {
        console.error('Error al cargar producto individual:', error);
        productDetailContainer.innerHTML = '<p class="error-message">Ha ocurrido un error al cargar el producto. Por favor, intenta nuevamente más tarde.</p>';
    }
}

// Cargar productos relacionados en la página de producto
async function cargarProductosRelacionados(producto) {
    const sliderTrack = document.querySelector('.slider-track');
    if (!sliderTrack || !producto) return;
    
    try {
        // Obtener productos relacionados
        const relacionados = await window.productosManager.obtenerProductosRelacionados(producto);
        
        if (relacionados.length === 0) {
            // Si no hay relacionados, ocultar sección
            document.querySelector('.related-products').style.display = 'none';
            return;
        }
        
        // Generar HTML
        let html = '';
        
        relacionados.forEach(productoRel => {
            html += `
                <div class="slider-item">
                    ${renderizarProductoCard(productoRel)}
                </div>
            `;
        });
        
        sliderTrack.innerHTML = html;
        
        // Reiniciar slider
        inicializarSlider();
        
        // Añadir event listeners para botones de añadir al carrito
        sliderTrack.querySelectorAll('.add-to-cart-btn').forEach(btn => {
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
        console.error('Error al cargar productos relacionados:', error);
        document.querySelector('.related-products').style.display = 'none';
    }
}

// Inicializar slider de productos relacionados
function inicializarSlider() {
    const sliderTrack = document.querySelector('.slider-track');
    const sliderItems = document.querySelectorAll('.slider-item');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    
    if (!sliderTrack || !sliderItems.length || !prevBtn || !nextBtn) return;
    
    let currentIndex = 0;
    const slideWidth = sliderItems[0].offsetWidth;
    const gap = 30; // Debe coincidir con el gap en CSS
    
    function getVisibleItems() {
        const containerWidth = document.querySelector('.slider-container').offsetWidth;
        return Math.floor(containerWidth / (slideWidth + gap));
    }
    
    function updateSlider() {
        const visibleItems = getVisibleItems();
        const maxIndex = sliderItems.length - visibleItems;
        
        if (currentIndex < 0) currentIndex = 0;
        if (currentIndex > maxIndex) currentIndex = maxIndex;
        
        const offset = -currentIndex * (slideWidth + gap);
        sliderTrack.style.transform = `translateX(${offset}px)`;
        
        // Activar/desactivar botones según posición
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex >= maxIndex;
        
        // Reflejar estado visual
        prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
        nextBtn.style.opacity = currentIndex >= maxIndex ? '0.5' : '1';
    }
    
    // Event listeners para navegación
    prevBtn.addEventListener('click', function() {
        currentIndex--;
        updateSlider();
    });
    
    nextBtn.addEventListener('click', function() {
        currentIndex++;
        updateSlider();
    });
    
    // Inicializar
    updateSlider();
    
    // Actualizar en resize
    window.addEventListener('resize', updateSlider);
    
    return {
        update: updateSlider
    };
}

// Cargar productos destacados en la página de inicio
async function cargarProductosDestacados() {
    const destacadosContainer = document.querySelector('.productos-carousel .carousel-track');
    if (!destacadosContainer) return;
    
    try {
        // Esperar a que los datos estén cargados
        await window.productosManager.loadPromise;
        
        // Obtener productos destacados
        const destacados = await window.productosManager.obtenerProductosDestacados(8);
        
        // Generar HTML
        let html = '';
        
        destacados.forEach(producto => {
            html += `
                <div class="producto-slide">
                    ${renderizarProductoCard(producto)}
                </div>
            `;
        });
        
        destacadosContainer.innerHTML = html;
        
        // Añadir event listeners para botones de añadir al carrito
        destacadosContainer.querySelectorAll('.add-to-cart-btn').forEach(btn => {
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

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Cargar productos según la página actual
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'index.html' || currentPage === '') {
        cargarProductosDestacados();
    } else if (currentPage === 'catalogo.html') {
        cargarProductosEnCatalogo();
    } else if (currentPage === 'producto.html') {
        cargarProductoIndividual();
    }
});
