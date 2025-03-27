document.addEventListener('DOMContentLoaded', function() {
            // ======= Variables y funciones globales =======
            const body = document.body;
            
            // Función para comprobar si un elemento está en el viewport
            function isInViewport(element) {
                const rect = element.getBoundingClientRect();
                return (
                    rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8 &&
                    rect.bottom >= 0
                );
            }
            
            // Animación de elementos al entrar en viewport
            function animateOnScroll() {
                const sections = document.querySelectorAll('.section-container');
                
                sections.forEach(section => {
                    if (isInViewport(section) && !section.classList.contains('animated')) {
                        section.classList.add('animate-fade-in', 'animated');
                    }
                });
            }
            
            // ======= Navegación y Header =======
            const header = document.querySelector('header');
            
            // Cambiar estilo del header al hacer scroll
            function handleHeaderScroll() {
                if (window.scrollY > 100) {
                    header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                    header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                } else {
                    header.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                    header.style.boxShadow = 'none';
                }
            }
            
            // ======= Menú Móvil =======
            const menuToggle = document.querySelector('.mobile-menu-toggle');
            const closeMenu = document.querySelector('.close-mobile-menu');
            const mobileMenu = document.querySelector('.mobile-menu');
            const overlay = document.querySelector('.overlay');
            const mobileLinks = document.querySelectorAll('.mobile-menu-links a');
            
            // Abrir menú móvil
            menuToggle.addEventListener('click', () => {
                mobileMenu.classList.add('active');
                overlay.classList.add('active');
                body.style.overflow = 'hidden';
            });
            
            // Cerrar menú móvil
            function closeMenuMobile() {
                mobileMenu.classList.remove('active');
                overlay.classList.remove('active');
                body.style.overflow = '';
            }
            
            closeMenu.addEventListener('click', closeMenuMobile);
            overlay.addEventListener('click', closeMenuMobile);
            
            // Cerrar al clickear un enlace
            mobileLinks.forEach(link => {
                link.addEventListener('click', closeMenuMobile);
            });
            
            // ======= Carrusel de productos =======
            const track = document.querySelector('.carousel-track');
            const slides = document.querySelectorAll('.producto-slide');
            const dotsContainer = document.querySelector('.carousel-dots');
            const dots = document.querySelectorAll('.carousel-dots .dot');
            const prevBtn = document.querySelector('.carousel-arrow.prev');
            const nextBtn = document.querySelector('.carousel-arrow.next');
            
            // Si no existe el carrusel, no continuar
            if (track && slides.length > 0) {
                let currentIndex = 0;
                const slideCount = slides.length;
                
                // Obtener dimensiones
                function getSlideWidth() {
                    const slide = slides[0];
                    const style = window.getComputedStyle(slide);
                    return slide.offsetWidth + parseInt(style.marginRight) + parseInt(style.marginLeft);
                }
                
                // Determinar cuántos slides mostrar según el ancho
                function getVisibleSlides() {
                    const viewportWidth = window.innerWidth;
                    
                    if (viewportWidth < 576) return 1;
                    if (viewportWidth < 992) return 2;
                    return 3;
                }
                
                let slideWidth = getSlideWidth();
                let visibleSlides = getVisibleSlides();
                
                // Actualizar ancho del carrusel en resize
                function updateCarouselDimensions() {
                    slideWidth = getSlideWidth();
                    visibleSlides = getVisibleSlides();
                    goToSlide(currentIndex);
                }
                
                // Ir a un slide específico
                function goToSlide(index) {
                    // No permitir índices fuera de rango
                    const maxIndex = slideCount - visibleSlides;
                    currentIndex = Math.max(0, Math.min(index, maxIndex));
                    
                    // Mover el track
                    const offset = -currentIndex * slideWidth;
                    track.style.transform = `translateX(${offset}px)`;
                    
                    // Actualizar dots
                    dots.forEach((dot, i) => {
                        dot.classList.toggle('active', i === currentIndex);
                    });
                    
                    // Actualizar estado de botones
                    updateButtonState();
                }
                
                // Actualizar estado de botones
                function updateButtonState() {
                    prevBtn.disabled = currentIndex === 0;
                    nextBtn.disabled = currentIndex >= slideCount - visibleSlides;
                }
                
                // Iniciar el carrusel
                updateButtonState();
                
                // Eventos para botones de navegación
                prevBtn.addEventListener('click', () => {
                    goToSlide(currentIndex - 1);
                });
                
                nextBtn.addEventListener('click', () => {
                    goToSlide(currentIndex + 1);
                });
                
                // Eventos para dots
                dots.forEach((dot, index) => {
                    dot.addEventListener('click', () => {
                        goToSlide(index);
                    });
                });
                
                // Soporte para swipe en móviles
                let touchStartX = 0;
                let touchEndX = 0;
                
                track.addEventListener('touchstart', (e) => {
                    touchStartX = e.changedTouches[0].screenX;
                }, { passive: true });
                
                track.addEventListener('touchend', (e) => {
                    touchEndX = e.changedTouches[0].screenX;
                    handleSwipe();
                }, { passive: true });
                
                function handleSwipe() {
                    const swipeThreshold = 50;
                    
                    if (touchStartX - touchEndX > swipeThreshold) {
                        // Swipe a la izquierda (siguiente)
                        goToSlide(currentIndex + 1);
                    } else if (touchEndX - touchStartX > swipeThreshold) {
                        // Swipe a la derecha (anterior)
                        goToSlide(currentIndex - 1);
                    }
                }
                
                // Auto-rotación del carrusel
                let autoRotateInterval;
                
                function startAutoRotate() {
                    autoRotateInterval = setInterval(() => {
                        if (currentIndex < slideCount - visibleSlides) {
                            goToSlide(currentIndex + 1);
                        } else {
                            goToSlide(0);
                        }
                    }, 5000);
                }
                
                function stopAutoRotate() {
                    clearInterval(autoRotateInterval);
                }
                
                // Iniciar auto-rotación
                startAutoRotate();
                
                // Detener en hover o touch
                track.addEventListener('mouseenter', stopAutoRotate);
                track.addEventListener('touchstart', stopAutoRotate, { passive: true });
                
                // Reanudar al salir
                track.addEventListener('mouseleave', startAutoRotate);
                track.addEventListener('touchend', () => {
                    setTimeout(startAutoRotate, 1000);
                }, { passive: true });
                
                // Actualizar en resize
                window.addEventListener('resize', updateCarouselDimensions);
            }
            
            // ======= Indicadores Hero =======
            const heroIndicators = document.querySelectorAll('.hero-indicators .indicator');
            const scrollDownBtn = document.querySelector('.scroll-down-btn');
            
            // Activar indicador al hacer click
            heroIndicators.forEach((indicator, index) => {
                indicator.addEventListener('click', () => {
                    heroIndicators.forEach(ind => ind.classList.remove('active'));
                    indicator.classList.add('active');
                    
                    // Aquí podrías añadir código para cambiar la imagen o contenido del hero
                    console.log(`Cambiar al slide ${index + 1} del hero`);
                });
            });
            
            // Scroll down button
            if (scrollDownBtn) {
                scrollDownBtn.addEventListener('click', () => {
                    const nosotrosSection = document.getElementById('nosotros');
                    if (nosotrosSection) {
                        nosotrosSection.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            }
            
            // ======= Formulario de Contacto =======
            const contactForm = document.getElementById('contactForm');
            
            if (contactForm) {
                contactForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    // Validación básica
                    const nombre = document.getElementById('nombre');
                    const correo = document.getElementById('correo');
                    const mensaje = document.getElementById('mensaje');
                    
                    if (!nombre.value.trim() || !correo.value.trim() || !mensaje.value.trim()) {
                        alert('Por favor, completa todos los campos obligatorios.');
                        return;
                    }
                    
                    // Validar email
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(correo.value)) {
                        alert('Por favor, introduce un correo electrónico válido.');
                        return;
                    }
                    
                    // Simulación de envío
                    const submitBtn = contactForm.querySelector('.form-submit');
                    const originalText = submitBtn.textContent;
                    
                    submitBtn.textContent = 'Enviando...';
                    submitBtn.disabled = true;
                    
                    // Simular respuesta del servidor
                    setTimeout(() => {
                        alert('¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.');
                        contactForm.reset();
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                    }, 1500);
                });
            }
            
            // ======= Inicialización y Event Listeners =======
            // Ejecutar animaciones iniciales
            animateOnScroll();
            handleHeaderScroll();
            
            // Event listeners para scroll
            window.addEventListener('scroll', () => {
                animateOnScroll();
                handleHeaderScroll();
            });
            
            // Smooth scroll para enlaces internos
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        });


        // Funcionalidad adicional para el menú desplegable en mobile
document.addEventListener('DOMContentLoaded', function() {
    // Obtener todos los enlaces de menú desplegable en móvil
    const productLink = document.querySelector('.mobile-menu-links a[href="catalogo.html"]');
    const mobileSubmenu = document.querySelector('.mobile-submenu');
    
    if (productLink && mobileSubmenu) {
        // Estado inicial
        let isSubmenuVisible = false;
        mobileSubmenu.style.display = 'none';
        
        // Agregar ícono de flecha al enlace de Productos
        productLink.innerHTML += ' <i class="fas fa-chevron-down" style="float: right;"></i>';
        
        // Mostrar/ocultar submenú al hacer clic en "Productos"
        productLink.addEventListener('click', function(e) {
            e.preventDefault();
            isSubmenuVisible = !isSubmenuVisible;
            
            if (isSubmenuVisible) {
                mobileSubmenu.style.display = 'flex';
                productLink.querySelector('i').style.transform = 'rotate(180deg)';
            } else {
                mobileSubmenu.style.display = 'none';
                productLink.querySelector('i').style.transform = 'rotate(0)';
            }
        });
    }
});


/**
 * Funcionalidad para las secciones de categorías y regiones corporales
 */
document.addEventListener('DOMContentLoaded', function() {
    // Funcionalidad para las tabs de regiones corporales
    const regionTabs = document.querySelectorAll('.region-tab');
    const regionPanels = document.querySelectorAll('.region-panel');
    
    regionTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remover clase active de todas las tabs
            regionTabs.forEach(t => t.classList.remove('active'));
            
            // Añadir clase active a la tab seleccionada
            this.classList.add('active');
            
            // Obtener región seleccionada
            const region = this.getAttribute('data-region');
            
            // Ocultar todos los paneles
            regionPanels.forEach(panel => panel.classList.remove('active'));
            
            // Mostrar panel correspondiente
            document.getElementById(`${region}-panel`).classList.add('active');
        });
    });
    
    // Efecto hover para tarjetas de categorías (opcional)
    const categoryCards = document.querySelectorAll('.category-card');
    
    categoryCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.category-icon');
            if (icon) {
                icon.style.transform = 'scale(1.2)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.category-icon');
            if (icon) {
                icon.style.transform = 'scale(1)';
            }
        });
    });
    
    // Cargar dinámicamente los datos de categorías si existe el gestor de productos
    if (window.productosManager) {
        window.productosManager.loadPromise.then(() => {
            // Cuando los datos estén cargados, actualizar las categorías
            actualizarCategorias();
        });
    }
    
    // Función para actualizar las categorías con datos reales
    function actualizarCategorias() {
        // Verificar si el gestor de productos está disponible
        if (!window.productosManager || !window.productosManager.categorias) return;
        
        const categorias = window.productosManager.categorias;
        
        // Actualizar tarjetas de categorías en la sección principal
        categoryCards.forEach(card => {
            const categoriaId = card.getAttribute('data-category');
            if (!categoriaId) return;
            
            // Buscar datos de esta categoría
            const categoriaData = categorias.find(cat => cat.id === categoriaId);
            if (!categoriaData) return;
            
            // Actualizar icono si está definido
            if (categoriaData.icono) {
                const iconElement = card.querySelector('.category-icon');
                if (iconElement) {
                    iconElement.className = categoriaData.icono + ' category-icon';
                }
            }
            
            // Actualizar nombre y descripción
            const titleElement = card.querySelector('h3');
            const descElement = card.querySelector('p');
            
            if (titleElement && categoriaData.nombre) {
                titleElement.textContent = categoriaData.nombre;
            }
            
            if (descElement && categoriaData.descripcion) {
                descElement.textContent = categoriaData.descripcion;
            }
            
            // Actualizar imágenes si están definidas
            if (categoriaData.imagen) {
                const bgElement = card.querySelector('.category-image');
                if (bgElement) {
                    // Eliminar el icono
                    const iconElement = bgElement.querySelector('.category-icon');
                    if (iconElement) {
                        iconElement.style.display = 'none';
                    }
                    
                    // Añadir imagen de fondo
                    bgElement.style.backgroundImage = `url('${categoriaData.imagen}')`;
                    bgElement.style.backgroundSize = 'cover';
                    bgElement.style.backgroundPosition = 'center';
                }
            }
        });
    }
});