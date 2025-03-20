/**
 * Karumy Cosmeticos - Sistema de Checkout con WhatsApp
 * Maneja la funcionalidad del proceso de checkout y la generación del mensaje de WhatsApp
 */

document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página de checkout
    const checkoutForm = document.getElementById('checkout-form');
    if (!checkoutForm) return;

    // Referencia al carrito
    const cart = window.karumyCart;
    if (!cart || cart.cartItems.length === 0) {
        // Redirigir al carrito si está vacío
        window.location.href = 'carrito.html';
        return;
    }

    // Renderizar resumen del pedido
    renderOrderSummary();

    // Event listener para el formulario de checkout
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);

    // Función para renderizar el resumen del pedido
    function renderOrderSummary() {
        const orderSummaryContainer = document.getElementById('order-summary');
        if (!orderSummaryContainer) return;

        // Limpiar contenedor
        orderSummaryContainer.innerHTML = '';

        // Encabezado de la tabla
        const headerRow = document.createElement('div');
        headerRow.className = 'order-summary-header';
        headerRow.innerHTML = `
            <div class="summary-col product-col">Producto</div>
            <div class="summary-col quantity-col">Cantidad</div>
            <div class="summary-col price-col">Precio</div>
            <div class="summary-col subtotal-col">Subtotal</div>
        `;
        orderSummaryContainer.appendChild(headerRow);

        // Formatear precios en formato colombiano
        const formatCurrency = (value) => {
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
            }).format(value);
        };

        // Productos
        cart.cartItems.forEach(item => {
            const itemRow = document.createElement('div');
            itemRow.className = 'order-summary-item';

            // Crear texto de opciones
            let optionsText = '';
            if (item.options && Object.keys(item.options).length > 0) {
                optionsText = Object.entries(item.options)
                    .map(([key, value]) => `<span class="item-option">${key}: ${value}</span>`)
                    .join('');
            }

            itemRow.innerHTML = `
                <div class="summary-col product-col">
                    <div class="product-info">
                        <img src="${item.image}" alt="${item.name}" class="summary-product-img">
                        <div class="summary-product-details">
                            <h4>${item.name}</h4>
                            ${optionsText ? `<div class="summary-product-options">${optionsText}</div>` : ''}
                        </div>
                    </div>
                </div>
                <div class="summary-col quantity-col">${item.quantity}</div>
                <div class="summary-col price-col">${formatCurrency(item.price)}</div>
                <div class="summary-col subtotal-col">${formatCurrency(item.price * item.quantity)}</div>
            `;

            orderSummaryContainer.appendChild(itemRow);
        });

        // Totales
        const subtotal = cart.getSubtotal();
        const tax = cart.getTax();
        const total = cart.getTotal();

        const totalsContainer = document.createElement('div');
        totalsContainer.className = 'order-summary-totals';
        totalsContainer.innerHTML = `
            <div class="summary-total-row">
                <div class="total-label">Subtotal:</div>
                <div class="total-value">${formatCurrency(subtotal)}</div>
            </div>
            <div class="summary-total-row">
                <div class="total-label">IVA (19%):</div>
                <div class="total-value">${formatCurrency(tax)}</div>
            </div>
            <div class="summary-total-row total-final">
                <div class="total-label">Total:</div>
                <div class="total-value">${formatCurrency(total)}</div>
            </div>
        `;

        orderSummaryContainer.appendChild(totalsContainer);
    }

    // Manejar envío del formulario de checkout
    function handleCheckoutSubmit(e) {
        e.preventDefault();
        
        // Validar formulario
        const formData = new FormData(checkoutForm);
        const customerData = {};
        let isValid = true;
        
        // Capturar datos del formulario y validar campos obligatorios
        for (const [key, value] of formData.entries()) {
            customerData[key] = value.trim();
            
            // Verificar campos requeridos (marcados con required en HTML)
            const input = checkoutForm.querySelector(`[name="${key}"]`);
            if (input.hasAttribute('required') && !value.trim()) {
                highlightInvalidField(input);
                isValid = false;
            } else {
                removeInvalidHighlight(input);
            }
        }
        
        // Email simple validation
        const emailField = checkoutForm.querySelector('[name="email"]');
        if (emailField && emailField.value) {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailField.value)) {
                highlightInvalidField(emailField);
                showValidationError('Por favor, introduce un correo electrónico válido');
                return;
            }
        }
        
        // Detener si no es válido
        if (!isValid) {
            showValidationError('Por favor, completa todos los campos obligatorios');
            return;
        }
        
        // Generar mensaje de WhatsApp
        const whatsappMessage = generateWhatsAppMessage(customerData);
        
        // Codificar para URL
        const encodedMessage = encodeURIComponent(whatsappMessage);
        
        // Número de WhatsApp de la tienda (actualizar con el número correcto)
        const phoneNumber = '573225201123'; // Actualizar con el número real sin +
        
        // URL para WhatsApp
        const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
        // Almacenar datos del pedido en localStorage para la página de confirmación
        localStorage.setItem('karumyLastOrder', JSON.stringify({
            customerData,
            items: cart.cartItems,
            subtotal: cart.getSubtotal(),
            tax: cart.getTax(),
            total: cart.getTotal(),
            orderDate: new Date().toISOString()
        }));
        
        // Limpiar carrito
        cart.clearCart();
        
        // Redirigir a WhatsApp
        window.location.href = whatsappURL;
    }

    // Generar mensaje de WhatsApp
    function generateWhatsAppMessage(customerData) {
        // Formatear precios en formato colombiano
        const formatCurrency = (value) => {
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
            }).format(value);
        };
        
        let message = '¡Hola! Me gustaría realizar el siguiente pedido:\n\n';
        
        // Datos del cliente
        message += '*DATOS DEL CLIENTE*\n';
        message += `Nombre: ${customerData.nombre}\n`;
        message += customerData.telefono ? `Teléfono: ${customerData.telefono}\n` : '';
        message += customerData.email ? `Email: ${customerData.email}\n` : '';
        message += customerData.direccion ? `Dirección: ${customerData.direccion}\n` : '';
        message += customerData.ciudad ? `Ciudad: ${customerData.ciudad}\n` : '';
        message += customerData.comentarios ? `Comentarios: ${customerData.comentarios}\n` : '';
        message += customerData.metodoPago ? `Método de pago: ${customerData.metodoPago}\n` : '';
        
        // Productos
        message += '\n*PRODUCTOS*\n';
        
        cart.cartItems.forEach(item => {
            message += `▪️ ${item.quantity} x ${item.name}`;
            
            // Añadir opciones si existen
            if (item.options && Object.keys(item.options).length > 0) {
                const optionsText = Object.entries(item.options)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
                message += ` (${optionsText})`;
            }
            
            // Precio unitario y subtotal
            message += ` - ${formatCurrency(item.price)} c/u = ${formatCurrency(item.price * item.quantity)}\n`;
        });
        
        // Totales
        message += '\n*RESUMEN*\n';
        message += `Subtotal: ${formatCurrency(cart.getSubtotal())}\n`;
        message += `IVA (19%): ${formatCurrency(cart.getTax())}\n`;
        message += `TOTAL: ${formatCurrency(cart.getTotal())}\n`;
        
        // Mensaje final
        message += '\nGracias por tu pedido. ¿Podrías confirmarme los detalles?';
        
        return message;
    }

    // Helpers para validación
    function highlightInvalidField(field) {
        field.classList.add('invalid');
    }

    function removeInvalidHighlight(field) {
        field.classList.remove('invalid');
    }

    function showValidationError(message) {
        // Buscar o crear el contenedor de errores
        let errorContainer = document.getElementById('validation-errors');
        
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.id = 'validation-errors';
            const formActions = document.querySelector('.checkout-form-actions');
            if (formActions) {
                formActions.parentNode.insertBefore(errorContainer, formActions);
            } else {
                checkoutForm.appendChild(errorContainer);
            }
        }
        
        errorContainer.textContent = message;
        errorContainer.classList.add('show-error');
        
        // Scroll hasta el error
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});
