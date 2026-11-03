const secciones = Array.from(document.querySelectorAll(".continente"));
const PASO = 150;   // cuántos píxeles se mueve con cada ▲ / ▼

// Continente que se está viendo ahora (el último cuyo título ya pasó por arriba)
function seccionActual() {
    let actual = 0;
    secciones.forEach((s, i) => {
        if (s.getBoundingClientRect().top <= 40) actual = i;
    });
    return actual;
}

function irA(indice) {
    if (indice < 0 || indice >= secciones.length) return;
    secciones[indice].scrollIntoView({ behavior: "smooth", block: "start" });
}

alEntrada((evento) => {
    if (evento === "volver")    window.location = "/";
    if (evento === "abajo")     window.scrollBy({ top: PASO, behavior: "smooth" });
    if (evento === "arriba")    window.scrollBy({ top: -PASO, behavior: "smooth" });
    if (evento === "derecha")   irA(seccionActual() + 1);
    if (evento === "izquierda") irA(seccionActual() - 1);
});