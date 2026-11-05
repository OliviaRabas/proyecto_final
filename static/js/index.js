const opciones = document.querySelectorAll('.opcion');
let actual = 0;

function resaltar() {
    opciones.forEach((op, i) => {
        // Usamos 'seleccionado' tal como está definido en tu CSS
        op.classList.toggle('seleccionado', i === actual);
    });
}

// Escuchamos los eventos de teclado para navegar por las opciones
document.addEventListener('keydown', (e) => {
    // Definimos el comportamiento según la tecla presionada
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        actual = (actual - 1 + opciones.length) % opciones.length;
        resaltar();
    } 
    else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        actual = (actual + 1) % opciones.length;
        resaltar();
    } 
    else if (e.key === "Enter") {
        // Animación sutil de confirmación antes de redirigir
        opciones[actual].style.transform = "scale(0.97)";
        setTimeout(() => {
            window.location.href = opciones[actual].dataset.href;
        }, 150);
    }
});

// Permitir también que el mouse actualice la selección al pasar por encima
opciones.forEach((op, i) => {
    op.addEventListener('mouseenter', () => {
        actual = i;
        resaltar();
    });
    
    op.addEventListener('click', () => {
        window.location.href = op.dataset.href;
    });
});

// Inicializar el estado resaltado al cargar la página
resaltar();