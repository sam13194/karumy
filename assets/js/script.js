document.addEventListener('DOMContentLoaded', function() {
    // Seleccionar todos los botones de pestañas y paneles
    let tabs = document.querySelectorAll('.region-tab');
    const panels = document.querySelectorAll('.region-panel');
    
    // Añadir evento de clic a cada pestaña
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Quitar clase activa de todas las pestañas
            tabs.forEach(t => t.classList.remove('active'));
            
            // Añadir clase activa a la pestaña seleccionada
            this.classList.add('active');
            
            // Obtener el identificador de la región
            const region = this.getAttribute('data-region');
            
            // Quitar clase activa de todos los paneles
            panels.forEach(panel => panel.classList.remove('active'));
            
            // Activar el panel correspondiente
            const targetPanel = document.getElementById(region + '-panel');
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });

    // Mobile Menu Toggle Functionality - Remove the nested DOMContentLoaded
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeMenuButton = document.querySelector('.close-mobile-menu');
    const overlay = document.querySelector('.overlay');
    
    // Toggle mobile menu when hamburger icon is clicked
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenu.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
        });
    }
    
    // Close mobile menu when X button is clicked
    if (closeMenuButton) {
        closeMenuButton.addEventListener('click', function() {
            mobileMenu.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = ''; // Re-enable scrolling
        });
    }
    
    // Close mobile menu when overlay is clicked
    if (overlay) {
        overlay.addEventListener('click', function() {
            mobileMenu.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = ''; // Re-enable scrolling
        });
    }
    
    // Close mobile menu when clicking on a link (optional)
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-links a');
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileMenu.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
});