// Karumy Cosmeticos - Script unificado para página de producto
// Versión: 1.0
// Unifica todas las funcionalidades en un solo archivo para evitar duplicación de eventos

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Karumy] Inicializando página de producto...');
    
    // Determinar la página actual
    const currentPage = window.location.pathname.split('/').pop();
    console.log('[Karumy] Página actual:', currentPage);
    
    // ==== INICIALIZACIÓN SEGÚN LA PÁGINA ====
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
        // ==== INICIALIZACIÓN DE LA PÁGINA DE PRODUCTO ====
        
        // 1. Inicializar galería de imágenes
        inicializarGaleriaImagenes();
        
        // 2. Inicializar tabs de información
        inicializarTabsProducto();
        
        // 3. Inicializar control de cantidad
        inicializarControlCantidad();
        
        // 4. Cargar datos del producto actual
        cargarProductoIndividual();
        
        // IMPORTANTE: No inicializamos aquí el botón de añadir al carrito
        // Esto se hará al final del script para evitar duplicados
    }
});

// ==== FUNCIONES DE INICIALIZACIÓN DE COMPONENTES ====

// Inicializar galería de imágenes
function inicializarGaleriaImagenes() {
    const mainImage = document.getElementById('main-product-image');
    const thumbs = document.querySelectorAll('.thumb');
    
    if (!mainImage || thumbs.length === 0) {
        console.log('[Karumy] No se encontró la galería de imágenes');
        return;
    }
    
    thumbs.forEach(thumb => {
        thumb.addEventListener('click', function() {
            // Remover clase active de todos los thumbs
            thumbs.forEach(t => t.classList.remove('active'));
            
            // Añadir clase active al thumb clickeado
            this.classList.add('active');
            
            // Actualizar imagen principal
            const imageSrc = this.getAttribute('data-image');
            
            if (imageSrc !== 'placeholder') {
                mainImage.src = imageSrc;
            } else {
                console.log('Esta vista no está disponible actualmente');
            }
        });
    });
    
    console.log('[Karumy] Galería de imágenes inicializada');
}

// Inicializar tabs de información
function inicializarTabsProducto() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (!tabButtons.length || !tabContents.length) {
        console.log('[Karumy] No se encontraron tabs de producto');
        return;
    }
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover clase active de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Añadir clase active al botón clickeado
            button.classList.add('active');
            
            // Mostrar el contenido correspondiente
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    console.log('[Karumy] Tabs de producto inicializados');
}

// Inicializar control de cantidad
function inicializarControlCantidad() {
    const quantityInput = document.getElementById('product-quantity');
    const decreaseBtn = document.getElementById('decrease-quantity');
    const increaseBtn = document.getElementById('increase-quantity');
    
    if (!quantityInput || !decreaseBtn || !increaseBtn) {
        console.log('[Karumy] No se encontró el control de cantidad');
        return;
    }
    
    decreaseBtn.addEventListener('click', function() {
        let quantity = parseInt(quantityInput.value);
        if (quantity > 1) {
            quantityInput.value = quantity - 1;
        }
    });
    
    increaseBtn.addEventListener('click', function() {
        let quantity = parseInt(quantityInput.value);
        quantityInput.value = quantity + 1;
    });
    
    // Validar entrada directa en el campo
    quantityInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value === '' || parseInt(this.value) < 1) {
            this.value = '1';
        }
    });
    
    console.log('[Karumy] Control de cantidad inicializado');
}

// ==== FUNCIONES EXISTENTES PARA MANEJO DE PRODUCTOS ====

// Aquí deberías incluir todas las funciones existentes como:
// - cargarProductoIndividual()
// - cargarProductosRelacionados()
// - actualizarGaleriaProducto()
// - etc.

// Puedes mantener estas funciones tal como estaban en tu código original
// siempre que no incluyan inicialización de eventos duplicados

// ==== SOLUCIÓN FINAL PARA EL BOTÓN DE AÑADIR AL CARRITO ====

// Función auto-ejecutable para aislar el código y garantizar que se ejecute al final
(function() {
    // Esperar a que el DOM esté completamente cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixAddToCartButton);
    } else {
        // Si el DOM ya está cargado, ejecutar inmediatamente
        setTimeout(fixAddToCartButton, 500); // Pequeño retraso para asegurar que otros scripts terminen
    }
    
    function fixAddToCartButton() {
        console.log('[Karumy] Configurando botón de añadir al carrito...');
        
        // 1. Buscar el botón de añadir al carrito
        const addToCartButton = document.getElementById('add-to-cart');
        if (!addToCartButton) {
            console.log('[Karumy] Botón de añadir al carrito no encontrado en esta página');
            return;
        }
        
        // 2. Remover TODOS los event listeners existentes
        // Para hacer esto, clonamos el botón y reemplazamos el original
        const newButton = addToCartButton.cloneNode(true);
        addToCartButton.replaceWith(newButton);
        
        // 3. Añadir un ÚNICO nuevo event listener
        newButton.addEventListener('click', function(e) {
            // Detener cualquier otro comportamiento posible
            e.preventDefault();
            e.stopPropagation();
            
            console.log('[Karumy] Click en botón de añadir al carrito');
            
            // Obtener datos del producto
            const productId = document.querySelector('.product-detail').id;
            const productName = document.querySelector('.product-title').textContent;
            
            // Obtener precio actual (sin formatear)
            const priceText = document.querySelector('.product-price').textContent;
            const price = parseFloat(priceText.replace(/[^\d]/g, ''));
            
            // Obtener imagen
            const productImage = document.getElementById('main-product-image').src;
            
            // Obtener opciones seleccionadas
            const sizeSelect = document.getElementById('size');
            const selectedSize = sizeSelect ? sizeSelect.value : null;
            
            // Obtener cantidad
            const quantity = parseInt(document.getElementById('product-quantity').value);
            
            // Crear objeto de producto con opciones
            const product = {
                id: productId,
                name: productName,
                price: price,
                image: productImage,
                quantity: quantity,
                options: {
                    size: selectedSize
                }
            };
            
            // Añadir al carrito usando el gestor disponible
            if (window.karumyCart) {
                console.log(`[Karumy] Añadiendo producto: ${productName}, cantidad: ${quantity}`);
                window.karumyCart.addItem(product);
                mostrarNotificacion(`${productName} añadido al carrito`, 'success');
            } else if (window.cartManager) {
                console.log(`[Karumy] Usando cartManager para añadir: ${productId}`);
                window.cartManager.agregarAlCarrito(productId, quantity);
                mostrarNotificacion(`${productName} añadido al carrito`, 'success');
            } else {
                console.error('[Karumy] No se encontró ningún gestor de carrito');
                alert('Error: No se pudo añadir el producto al carrito');
            }
        });
        
        console.log('[Karumy] Botón de añadir al carrito configurado con un único listener');
    }
    
    // Función de notificación
    function mostrarNotificacion(mensaje, tipo = 'info') {
        // Verificar si ya existe un contenedor de notificaciones
        let notificacionesContainer = document.getElementById('notificaciones-container');
        
        if (!notificacionesContainer) {
            // Crear el contenedor si no existe
            notificacionesContainer = document.createElement('div');
            notificacionesContainer.id = 'notificaciones-container';
            notificacionesContainer.style.position = 'fixed';
            notificacionesContainer.style.top = '20px';
            notificacionesContainer.style.right = '20px';
            notificacionesContainer.style.zIndex = '9999';
            document.body.appendChild(notificacionesContainer);
        }
        
        // Crear la notificación
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo}`;
        notificacion.style.backgroundColor = tipo === 'success' ? '#4CAF50' : '#2196F3';
        notificacion.style.color = 'white';
        notificacion.style.padding = '15px 20px';
        notificacion.style.marginBottom = '10px';
        notificacion.style.borderRadius = '4px';
        notificacion.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        notificacion.style.minWidth = '250px';
        notificacion.style.opacity = '0';
        notificacion.style.transform = 'translateX(50px)';
        notificacion.style.transition = 'opacity 0.3s, transform 0.3s';
        
        notificacion.innerHTML = mensaje;
        
        // Añadir la notificación al contenedor
        notificacionesContainer.appendChild(notificacion);
        
        // Mostrar la notificación con animación
        setTimeout(() => {
            notificacion.style.opacity = '1';
            notificacion.style.transform = 'translateX(0)';
        }, 10);
        
        // Eliminar la notificación después de 3 segundos
        setTimeout(() => {
            notificacion.style.opacity = '0';
            notificacion.style.transform = 'translateX(50px)';
            
            setTimeout(() => {
                notificacionesContainer.removeChild(notificacion);
            }, 300);
        }, 3000);
    }
})();