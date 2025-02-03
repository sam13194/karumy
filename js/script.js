document.addEventListener('DOMContentLoaded', () => {
    // Animación de elementos al scroll
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.producto-card, .beneficio, blockquote');
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight * 0.9) {
                element.classList.add('animate-in');
            }
        });
    };

    // Navbar transparente que se vuelve sólida al scroll
    const handleNavbar = () => {
        const nav = document.querySelector('.fixed-nav');
        if (window.scrollY > 100) {
            nav.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            nav.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        } else {
            nav.style.backgroundColor = 'transparent';
            nav.style.boxShadow = 'none';
        }
    };

    // Event listeners
    window.addEventListener('scroll', () => {
        animateOnScroll();
        handleNavbar();
    });

    // Smooth scroll mejorado
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            const navHeight = document.querySelector('.fixed-nav').offsetHeight;
            const targetPosition = target.offsetTop - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });

    // Formulario con feedback visual
    const form = document.getElementById('contactForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = 'Enviando...';
        submitBtn.disabled = true;

        // Simular envío
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        submitBtn.innerHTML = '¡Enviado!';
        submitBtn.style.backgroundColor = '#4CAF50';
        form.reset();

        setTimeout(() => {
            submitBtn.innerHTML = 'Enviar';
            submitBtn.disabled = false;
            submitBtn.style.backgroundColor = '';
        }, 3000);
    });

    // Obtener todas las secciones
    const sections = Array.from(document.getElementsByTagName('section'));
    let currentSectionIndex = 0;
    let isScrolling = false;

    // Función para ir a la siguiente/anterior sección
    const goToSection = (direction) => {
        if (isScrolling) return;
        
        isScrolling = true;
        currentSectionIndex = Math.max(0, Math.min(sections.length - 1, 
            currentSectionIndex + direction));
        
        sections[currentSectionIndex].scrollIntoView({ behavior: 'smooth' });
        
        setTimeout(() => {
            isScrolling = false;
        }, 1000);
    };

    // Manejar eventos de teclado
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            goToSection(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            goToSection(-1);
        }
    });

    // Manejar scroll con rueda del mouse
    let wheelTimeout;
    document.addEventListener('wheel', (e) => {
        clearTimeout(wheelTimeout);
        
        wheelTimeout = setTimeout(() => {
            if (Math.abs(e.deltaY) > 50) {
                goToSection(e.deltaY > 0 ? 1 : -1);
            }
        }, 50);
    }, { passive: true });

    // Actualizar índice actual al hacer scroll
    window.addEventListener('scroll', () => {
        clearTimeout(wheelTimeout);
        
        wheelTimeout = setTimeout(() => {
            const middle = window.innerHeight / 2;
            
            currentSectionIndex = sections.findIndex(section => {
                const rect = section.getBoundingClientRect();
                return rect.top <= middle && rect.bottom >= middle;
            });
        }, 50);
    });

    // Modal y Galería
    const modal = document.getElementById('modal-mantequilla');
    const modalTrigger = document.querySelector('a[href="#mantequilla"]');
    const closeModal = document.querySelector('.close-modal');
    const images = document.querySelectorAll('.gallery-container img');
    const prevBtn = document.querySelector('.gallery-nav.prev');
    const nextBtn = document.querySelector('.gallery-nav.next');
    let currentImageIndex = 0;

    const showImage = (index) => {
        images.forEach(img => img.classList.remove('active'));
        images[index].classList.add('active');
        updateGalleryProgress();
    };

    modalTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('active'), 10);
        document.body.style.overflow = 'hidden';
        showImage(currentImageIndex);
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    prevBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        showImage(currentImageIndex);
    });

    nextBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        showImage(currentImageIndex);
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Crear indicadores de scroll mejorados
    const createScrollIndicators = () => {
        const scrollIndicator = document.createElement('div');
        scrollIndicator.className = 'scroll-indicator';
        
        sections.forEach((section, index) => {
            const dot = document.createElement('div');
            dot.className = 'scroll-dot';
            dot.setAttribute('data-index', index);
            
            // Añadir título al hover
            dot.title = section.id || `Sección ${index + 1}`;
            
            dot.addEventListener('click', () => {
                const targetSection = sections[index];
                const offset = 60; // Ajuste para el header fijo
                const targetPosition = targetSection.offsetTop - offset;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            });
            
            scrollIndicator.appendChild(dot);
        });
        
        document.body.appendChild(scrollIndicator);
        // Activar el primer indicador al cargar
        document.querySelector('.scroll-dot').classList.add('active');
    };

    // Actualizar indicadores de scroll mejorado
    const updateScrollIndicators = () => {
        const scrollPosition = window.pageYOffset;
        const dots = document.querySelectorAll('.scroll-dot');
        
        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop - (window.innerHeight / 3);
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                dots[index].classList.add('active');
                currentSectionIndex = index;
            } else {
                dots[index].classList.remove('active');
            }
        });
    };

    // Manejar botón de scroll down
    const scrollDownBtn = document.querySelector('.scroll-down-btn');
    scrollDownBtn.addEventListener('click', () => {
        goToSection(currentSectionIndex + 1);
    });

    // Ocultar/Mostrar botón de scroll down
    const toggleScrollButton = () => {
        if (currentSectionIndex >= sections.length - 1) {
            scrollDownBtn.style.opacity = '0';
            scrollDownBtn.style.pointerEvents = 'none';
        } else {
            scrollDownBtn.style.opacity = '1';
            scrollDownBtn.style.pointerEvents = 'auto';
        }
    };

    // Actualizar navegación activa
    const updateActiveNav = () => {
        const navLinks = document.querySelectorAll('.fixed-nav a');
        const currentSection = sections[currentSectionIndex];
        
        navLinks.forEach(link => {
            const sectionId = link.getAttribute('href').substring(1);
            link.classList.toggle('active', currentSection.id === sectionId);
        });
    };

    // Crear indicadores de progreso de la galería
    const createGalleryProgress = () => {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'gallery-progress';
        
        images.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            dot.addEventListener('click', () => {
                currentImageIndex = index;
                showImage(currentImageIndex);
            });
            progressContainer.appendChild(dot);
        });
        
        document.querySelector('.modal-gallery').appendChild(progressContainer);
    };

    // Actualizar indicadores de progreso de la galería
    const updateGalleryProgress = () => {
        document.querySelectorAll('.progress-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === currentImageIndex);
        });
    };

    // Inicialización
    createScrollIndicators();
    createGalleryProgress();
    updateScrollIndicators(); // Actualización inicial
    toggleScrollButton();

    // Observador de secciones visibles
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.3 });

    sections.forEach(section => observer.observe(section));

    // Asegurar que los indicadores se actualicen después de cualquier scroll
    window.addEventListener('scroll', () => {
        requestAnimationFrame(updateScrollIndicators);
    }, { passive: true });
});
