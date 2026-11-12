const opciones = document.querySelectorAll('.opcion');
let actual = 0;
let saliendo = false;

function resaltar() {
    opciones.forEach((op, i) => {
        op.classList.toggle('seleccionada', i === actual);
    });
}

// Elegir: animación corta y después navega
function elegir() {
    if (saliendo) return;
    saliendo = true;
    opciones[actual].classList.add('elegida');
    document.body.classList.add('saliendo');
    const destino = opciones[actual].dataset.href;
    setTimeout(() => { window.location = destino; }, 300);
}

// Cuántas columnas tiene la grilla (se lee del CSS, así si cambia no hay que tocar el JS)
function columnas() {
    const grilla = document.querySelector('.menu-continentes');
    return getComputedStyle(grilla).gridTemplateColumns.split(' ').length;
}

// Movimiento en 2D: arriba/abajo saltan de fila, izquierda/derecha cambian de columna
function mover(direccion) {
    const n = opciones.length;
    const cols = columnas();
    const fila = Math.floor(actual / cols);
    const col = actual % cols;

    if (direccion === "arriba") {
        // Si estoy en la primera fila, paso al final de la misma columna
        let destino = actual - cols;
        if (destino < 0) {
            destino = col;
            while (destino + cols < n) destino += cols;
        }
        actual = destino;
    }
    if (direccion === "abajo") {
        // Si estoy en la última fila, vuelvo al principio de la misma columna
        let destino = actual + cols;
        if (destino >= n) destino = col;
        actual = destino;
    }
    if (direccion === "izquierda") {
        if (col > 0) actual = actual - 1;
        else actual = Math.min(fila * cols + cols - 1, n - 1); // salta al final de la fila
    }
    if (direccion === "derecha") {
        if (col < cols - 1 && actual + 1 < n) actual = actual + 1;
        else actual = fila * cols;                              // vuelve al inicio de la fila
    }
}

alEntrada((evento) => {
    if (saliendo) return;
    if (evento === "aceptar") return elegir();
    if (evento === "volver")  { window.location = "/jugar"; return; }
    mover(evento);
    resaltar();
});

// Mouse (opcional, por si lo usan)
opciones.forEach((op, i) => {
    op.addEventListener('mouseenter', () => { actual = i; resaltar(); });
    op.addEventListener('click', () => { actual = i; resaltar(); elegir(); });
});

// Si el usuario vuelve con el botón "atrás" del navegador, la página
// no debe quedar a medio desvanecer
window.addEventListener('pageshow', () => {
    saliendo = false;
    document.body.classList.remove('saliendo');
    opciones.forEach(op => op.classList.remove('elegida'));
});

// ---- Decoración: iconos que flotan (se crean desde acá, sin tocar el HTML) ----
const ICONOS = ["💀", "🏴", "🔥", "🕯️", "🦇", "☠️"];
const MAX_FLOTANTES = 8;   // tope para que la página se mantenga liviana
let flotantes = 0;

function lanzarFlotante() {
    if (document.hidden || flotantes >= MAX_FLOTANTES) return;
    const el = document.createElement("span");
    el.className = "flotante";
    el.textContent = ICONOS[Math.floor(Math.random() * ICONOS.length)];
    el.style.left = Math.random() * 100 + "vw";
    el.style.fontSize = 1 + Math.random() * 1.6 + "rem";
    el.style.animationDuration = (5 + Math.random() * 4) + "s";
    document.body.appendChild(el);
    flotantes++;
    el.addEventListener("animationend", () => { el.remove(); flotantes--; });
}

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setInterval(lanzarFlotante, 1000);
}

resaltar();