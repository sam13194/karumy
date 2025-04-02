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
});