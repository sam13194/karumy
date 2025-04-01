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
    } else if (currentPage === 'producto.html') {
        cargarProductoIndividual();
    }
});
