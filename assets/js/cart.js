/**
 * Karumy Cosmeticos - Sistema de Carrito con localStorage
 * Maneja todas las operaciones del carrito de compras utilizando almacenamiento local
 */

// Clase principal para el manejo del carrito
class ShoppingCart {
    constructor() {
        this.cartItems = [];
        this.loadCart();
        this.updateCartDisplay();
    }

    // Cargar carrito desde localStorage
    loadCart() {
        const savedCart = localStorage.getItem('karumyCart');
        if (savedCart) {
            try {
                this.cartItems = JSON.parse(savedCart);
            } catch (e) {
                console.error('Error al cargar el carrito:', e);
                this.cartItems = [];
            }
        }
    }

    // Guardar carrito en localStorage
    saveCart() {
        localStorage.setItem('karumyCart', JSON.stringify(this.cartItems));
        this.updateCartDisplay();
    }

    // Añadir producto al carrito
    addItem(product) {
        // Verificar si el producto ya existe en el carrito
        const existingItem = this.cartItems.find(
            item => item.id === product.id && 
                   this.compareOptions(item.options, product.options)
        );

        if (existingItem) {
            existingItem.quantity += product.quantity || 1;
        } else {
            // Asegurar que el producto tiene todas las propiedades necesarias
            const newItem = {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image || 'assets/img/placeholder.jpg',
                quantity: product.quantity || 1,
                options: product.options || {}
            };
            this.cartItems.push(newItem);
        }

        this.saveCart();
        this.showNotification('Producto añadido al carrito');
    }

    // Comparar opciones de producto (variantes, tamaños, etc.)
    compareOptions(options1, options2) {
        if (!options1 && !options2) return true;
        if (!options1 || !options2) return false;
        
        const keys1 = Object.keys(options1);
        const keys2 = Object.keys(options2);
        
        if (keys1.length !== keys2.length) return false;
        
        return keys1.every(key => options1[key] === options2[key]);
    }

    // Actualizar cantidad de un producto
    updateQuantity(productId, options, newQuantity) {
        const itemIndex = this.cartItems.findIndex(
            item => item.id === productId && 
                   this.compareOptions(item.options, options)
        );

        if (itemIndex !== -1) {
            if (newQuantity <= 0) {
                // Si la cantidad es 0 o menor, eliminar el producto
                this.cartItems.splice(itemIndex, 1);
            } else {
                // Actualizar la cantidad
                this.cartItems[itemIndex].quantity = newQuantity;
            }
            this.saveCart();
        }
    }

    // Eliminar producto del carrito
    removeItem(productId, options) {
        const itemIndex = this.cartItems.findIndex(
            item => item.id === productId && 
                   this.compareOptions(item.options, options)
        );

        if (itemIndex !== -1) {
            this.cartItems.splice(itemIndex, 1);
            this.saveCart();
            this.showNotification('Producto eliminado del carrito');
        }
    }

    // Vaciar completamente el carrito
    clearCart() {
        this.cartItems = [];
        this.saveCart();
        this.showNotification('Carrito vaciado');
    }

    // Calcular subtotal del carrito
    getSubtotal() {
        return this.cartItems.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    // Calcular impuestos (19% IVA Colombia)
    getTax() {
        return this.getSubtotal() * 0.19;
    }

    // Calcular total del carrito
    getTotal() {
        return this.getSubtotal() + this.getTax();
    }

    // Obtener número total de productos en el carrito
    getTotalItems() {
        return this.cartItems.reduce((total, item) => {
            return total + item.quantity;
        }, 0);
    }

    // Actualizar visualización del contador del carrito
    updateCartDisplay() {
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            const itemCount = this.getTotalItems();
            cartCountElement.textContent = itemCount;
            
            // Mostrar/ocultar contador según contenido
            if (itemCount > 0) {
                cartCountElement.classList.add('active');
            } else {
                cartCountElement.classList.remove('active');
            }
        }
    }

    // Mostrar notificación temporal
    showNotification(message) {
        // Buscar o crear el contenedor de notificaciones
        let notificationContainer = document.getElementById('notification-container');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            document.body.appendChild(notificationContainer);
        }
        
        // Crear notificación
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Añadir al contenedor
        notificationContainer.appendChild(notification);
        
        // Añadir clase para activar animación
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notificationContainer.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Renderizar contenido del carrito en la página de carrito
    renderCartPage() {
        const cartContainer = document.getElementById('cart-items-container');
        const subtotalElement = document.getElementById('cart-subtotal');
        const taxElement = document.getElementById('cart-tax');
        const totalElement = document.getElementById('cart-total');
        const emptyCartMessage = document.getElementById('empty-cart-message');
        const cartActionsContainer = document.getElementById('cart-actions');
        
        if (!cartContainer) return;
        
        // Limpiar contenedor
        cartContainer.innerHTML = '';
        
        // Mostrar mensaje si el carrito está vacío
        if (this.cartItems.length === 0) {
            if (emptyCartMessage) emptyCartMessage.style.display = 'block';
            if (cartActionsContainer) cartActionsContainer.style.display = 'none';
            return;
        }
        
        // Ocultar mensaje de carrito vacío y mostrar acciones
        if (emptyCartMessage) emptyCartMessage.style.display = 'none';
        if (cartActionsContainer) cartActionsContainer.style.display = 'flex';
        
        // Crear elementos para cada producto
        this.cartItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            
            // Crear opciones de texto si existen
            let optionsText = '';
            if (item.options && Object.keys(item.options).length > 0) {
                optionsText = Object.entries(item.options)
                    .map(([key, value]) => `<span class="item-option">${key}: ${value}</span>`)
                    .join('');
            }
            
            // Formatear precio en formato colombiano
            const formattedPrice = new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
            }).format(item.price);
            
            const formattedSubtotal = new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
            }).format(item.price * item.quantity);
            
            // Crear HTML del item
            itemElement.innerHTML = `
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <h3 class="item-name">${item.name}</h3>
                    ${optionsText ? `<div class="item-options">${optionsText}</div>` : ''}
                    <div class="item-price">${formattedPrice}</div>
                </div>
                <div class="item-quantity">
                    <button class="quantity-btn decrease" data-id="${item.id}" data-options='${JSON.stringify(item.options)}'>-</button>
                    <input type="number" value="${item.quantity}" min="1" class="quantity-input" data-id="${item.id}" data-options='${JSON.stringify(item.options)}'>
                    <button class="quantity-btn increase" data-id="${item.id}" data-options='${JSON.stringify(item.options)}'>+</button>
                </div>
                <div class="item-subtotal">${formattedSubtotal}</div>
                <button class="remove-item-btn" data-id="${item.id}" data-options='${JSON.stringify(item.options)}'>
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            
            cartContainer.appendChild(itemElement);
        });
        
        // Actualizar totales
        const subtotal = this.getSubtotal();
        const tax = this.getTax();
        const total = this.getTotal();
        
        // Formatear valores monetarios
        const formatCurrency = (value) => {
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
            }).format(value);
        };
        
        if (subtotalElement) subtotalElement.textContent = formatCurrency(subtotal);
        if (taxElement) taxElement.textContent = formatCurrency(tax);
        if (totalElement) totalElement.textContent = formatCurrency(total);
        
        // Añadir event listeners para botones
        this.addCartPageEventListeners();
    }

    // Añadir event listeners para la página del carrito
    addCartPageEventListeners() {
        // Botones de incremento/decremento
        document.querySelectorAll('.quantity-btn.decrease').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const options = JSON.parse(btn.dataset.options || '{}');
                const input = btn.nextElementSibling;
                let quantity = parseInt(input.value) - 1;
                
                // Mínimo 1 producto
                if (quantity < 1) quantity = 1;
                
                input.value = quantity;
                this.updateQuantity(id, options, quantity);
                this.renderCartPage();
            });
        });
        
        document.querySelectorAll('.quantity-btn.increase').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const options = JSON.parse(btn.dataset.options || '{}');
                const input = btn.previousElementSibling;
                const quantity = parseInt(input.value) + 1;
                
                input.value = quantity;
                this.updateQuantity(id, options, quantity);
                this.renderCartPage();
            });
        });
        
        // Inputs de cantidad
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', () => {
                const id = input.dataset.id;
                const options = JSON.parse(input.dataset.options || '{}');
                let quantity = parseInt(input.value);
                
                // Validar cantidad mínima
                if (quantity < 1 || isNaN(quantity)) quantity = 1;
                
                input.value = quantity;
                this.updateQuantity(id, options, quantity);
                this.renderCartPage();
            });
        });
        
        // Botones de eliminación
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const options = JSON.parse(btn.dataset.options || '{}');
                
                this.removeItem(id, options);
                this.renderCartPage();
            });
        });
        
        // Botón de vaciar carrito
        const clearCartBtn = document.getElementById('clear-cart-btn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
                    this.clearCart();
                    this.renderCartPage();
                }
            });
        }
    }
}

// Inicializar carrito cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia global del carrito
    window.karumyCart = new ShoppingCart();
    
    // Si estamos en la página del carrito, renderizarla
    if (document.getElementById('cart-items-container')) {
        window.karumyCart.renderCartPage();
    }
    
    // Event listeners para botones "Añadir al carrito" en todo el sitio
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Obtener datos del producto
            const productCard = btn.closest('.product-card, .producto-card, .product-detail');
            if (!productCard) return;
            
            // Capturar ID, nombre, precio y opciones
            const productId = productCard.dataset.productId || productCard.id;
            const productName = productCard.querySelector('.product-name, .producto-info h3, .product-title')?.textContent;
            
            // Para el precio, eliminar cualquier símbolo de moneda y convertir a número
            const priceText = productCard.querySelector('.product-price, .price')?.textContent;
            const price = priceText ? 
                parseFloat(priceText.replace(/[^\d]/g, '')) : 
                0;
            
            // Capturar imagen
            const imgElement = productCard.querySelector('img');
            const productImage = imgElement ? imgElement.src : null;
            
            // Obtener opciones seleccionadas (como variantes o tamaños)
            const options = {};
            productCard.querySelectorAll('select, input[type="radio"]:checked').forEach(el => {
                if (el.name) {
                    options[el.name] = el.value;
                }
            });
            
            // Obtener cantidad
            const quantityInput = productCard.querySelector('input[type="number"]');
            const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
            
            // Crear objeto de producto
            const product = {
                id: productId,
                name: productName,
                price: price,
                image: productImage,
                quantity: quantity,
                options: options
            };
            
            // Añadir al carrito
            window.karumyCart.addItem(product);
        });
    });
});
