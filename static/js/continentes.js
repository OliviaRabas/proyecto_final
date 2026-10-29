const opciones = document.querySelectorAll('.opcion');
let actual = 0;

function resaltar() {
    opciones.forEach((op, i) => op.classList.toggle('seleccionada', i === actual));
}

alEntrada((evento) => {
    if (evento === "arriba_izquierda") actual = (actual - 1 + opciones.length) % opciones.length;
    if (evento === "abajo_izquierda")  actual = (actual + 1) % opciones.length;
    if (evento === "arriba_derecha")   window.location = opciones[actual].dataset.href;
    if (evento === "abajo_derecha")    window.location = "/";
    resaltar();
});

resaltar();