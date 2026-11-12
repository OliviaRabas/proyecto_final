const opciones = document.querySelectorAll('.opcion');
let actual = 0;
let saliendo = false;

function resaltar() {
    opciones.forEach((op, i) => {
        op.classList.toggle('seleccionada', i === actual);
    });
}

function elegir() {
    if (saliendo) return;
    saliendo = true;
    opciones[actual].classList.add('elegida');
    document.body.classList.add('saliendo');
    const destino = opciones[actual].dataset.href;
    setTimeout(() => { window.location = destino; }, 300);
}

alEntrada((evento) => {
    if (saliendo) return;
    if (evento === "aceptar") return elegir();
    if (evento === "volver")  { window.location = "/"; return; }
    // Con solo 2 opciones, cualquier flecha alterna entre ellas
    if (["arriba", "abajo", "izquierda", "derecha"].includes(evento)) {
        actual = (actual + 1) % opciones.length;
    }
    resaltar();
});

opciones.forEach((op, i) => {
    op.addEventListener('mouseenter', () => { actual = i; resaltar(); });
    op.addEventListener('click', () => { actual = i; resaltar(); elegir(); });
});

window.addEventListener('pageshow', () => {
    saliendo = false;
    document.body.classList.remove('saliendo');
    opciones.forEach(op => op.classList.remove('elegida'));
});

resaltar();