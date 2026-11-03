const opciones = document.querySelectorAll('.opcion');
let actual = 0;

function resaltar() {
    opciones.forEach((op, i) => {
        op.classList.toggle('seleccionada', i === actual);
    });
}

alEntrada((evento) => {
    if (evento === "arriba" || evento === "izquierda") actual = (actual - 1 + opciones.length) % opciones.length;
    if (evento === "abajo"  || evento === "derecha")   actual = (actual + 1) % opciones.length;
    if (evento === "aceptar") window.location = opciones[actual].dataset.href;
    resaltar();
});

resaltar();