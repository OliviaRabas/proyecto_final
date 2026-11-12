const secciones = Array.from(document.querySelectorAll(".continente"));
const header = document.querySelector("header");
const PASO = 150;   // cuántos píxeles se mueve con cada ▲ / ▼
const SUAVE = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

// Avisa al CSS que hay JS (así las banderas solo se ocultan si después se pueden mostrar)
document.documentElement.classList.add("js");

// ---- Índice: una pastilla por continente + barra de progreso ----
// Se crean desde acá para no tener que tocar el HTML.
const indice = document.createElement("nav");
indice.id = "indice";
const chips = secciones.map((s, i) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = (s.querySelector("h2") || s).textContent.trim();
    chip.addEventListener("click", () => irA(i));
    indice.appendChild(chip);
    return chip;
});
const progreso = document.createElement("div");
progreso.id = "progreso";
header.append(indice, progreso);

// El encabezado es fijo: el CSS necesita saber cuánto mide para no tapar el contenido
function medirHeader() {
    document.documentElement.style.setProperty("--alto-header", header.offsetHeight + "px");
}

// ---- Continente actual ----
// Es el último cuyo título ya pasó por debajo del encabezado
function seccionActual() {
    const alFinal = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (alFinal) return secciones.length - 1;

    const limite = header.offsetHeight + 20;
    let actual = 0;
    secciones.forEach((s, i) => {
        if (s.getBoundingClientRect().top <= limite) actual = i;
    });
    return actual;
}

function irA(indiceSeccion) {
    if (indiceSeccion < 0 || indiceSeccion >= secciones.length) return;
    secciones[indiceSeccion].scrollIntoView({ behavior: SUAVE, block: "start" });
}

// ---- Progreso y pastilla activa (una vez por cuadro, no en cada evento) ----
let ultima = -1;
let pendiente = false;

function actualizar() {
    pendiente = false;

    const total = document.documentElement.scrollHeight - window.innerHeight;
    const avance = total > 0 ? Math.min(1, window.scrollY / total) : 0;
    progreso.style.transform = "scaleX(" + avance + ")";

    const a = seccionActual();
    if (a === ultima) return;
    ultima = a;
    chips.forEach((c, i) => c.classList.toggle("activo", i === a));
    const c = chips[a];
    if (c) indice.scrollTo({ left: c.offsetLeft - (indice.clientWidth - c.offsetWidth) / 2, behavior: SUAVE });
}

window.addEventListener("scroll", () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(actualizar);
}, { passive: true });

window.addEventListener("resize", () => { medirHeader(); actualizar(); });

// ---- Las banderas aparecen al llegar a la pantalla ----
const cartas = document.querySelectorAll(".pais");
if ("IntersectionObserver" in window) {
    const observador = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add("visto");
            observador.unobserve(e.target);
        });
    }, { rootMargin: "0px 0px 60px 0px" });
    cartas.forEach((c) => observador.observe(c));
} else {
    cartas.forEach((c) => c.classList.add("visto"));
}

// ---- Teclado (viene de input.js) ----
alEntrada((evento) => {
    if (evento === "volver")    window.location = "/";
    if (evento === "abajo")     window.scrollBy({ top: PASO, behavior: SUAVE });
    if (evento === "arriba")    window.scrollBy({ top: -PASO, behavior: SUAVE });
    if (evento === "derecha")   irA(seccionActual() + 1);
    if (evento === "izquierda") irA(seccionActual() - 1);
});

medirHeader();
actualizar();
// Si la tipografía tarda en cargar, el encabezado cambia de alto: se vuelve a medir
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { medirHeader(); actualizar(); });