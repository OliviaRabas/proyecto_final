const opciones = document.querySelectorAll('.opcion');
let actual = 0;
let saliendo = false;

// ---- Resaltado: también cambia el ambiente de toda la página ----
function resaltar() {
    opciones.forEach((op, i) => {
        op.classList.toggle('seleccionada', i === actual);
    });

    // El fondo se acerca al ambiente de la opción resaltada (claro o oscuro)
    const destino = opciones[actual].dataset.href || "";
    document.body.classList.toggle('previa-facil', destino.endsWith("facil"));
    document.body.classList.toggle('previa-dificil', destino.endsWith("dificil"));
}

// ---- Elegir: animación corta y después navega ----
function elegir() {
    if (saliendo) return;
    saliendo = true;
    opciones[actual].classList.add('elegida');
    document.body.classList.add('saliendo');
    const destino = opciones[actual].dataset.href;
    setTimeout(() => { window.location = destino; }, 300);
}

// ---- Teclado (viene de input.js) ----
alEntrada((evento) => {
    if (saliendo) return;
    if (evento === "arriba" || evento === "izquierda") actual = (actual - 1 + opciones.length) % opciones.length;
    if (evento === "abajo"  || evento === "derecha")   actual = (actual + 1) % opciones.length;
    if (evento === "aceptar") return elegir();
    if (evento === "volver")  { window.location = "/"; return; }
    resaltar();
});

// ---- Mouse (opcional, por si lo usan) ----
opciones.forEach((op, i) => {
    op.addEventListener('mouseenter', () => { actual = i; resaltar(); });
    op.addEventListener('click', () => { actual = i; resaltar(); elegir(); });
});

// ---- Decoración retro: scanlines + banderitas que flotan ----
// Se crean desde acá para no tener que tocar el HTML.
const scan = document.createElement("div");
scan.id = "scanlines";
document.body.appendChild(scan);

const ICONOS = ["🚩", "🏁", "🏳️", "🏴", "⭐", "🌍"];

function lanzarFlotante() {
    const el = document.createElement("span");
    el.className = "flotante";
    el.textContent = ICONOS[Math.floor(Math.random() * ICONOS.length)];
    el.style.left = Math.random() * 100 + "vw";
    el.style.fontSize = 1 + Math.random() * 1.6 + "rem";
    el.style.animationDuration = 7 + Math.random() * 6 + "s";
    document.body.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
}

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setInterval(lanzarFlotante, 900);
}

resaltar();