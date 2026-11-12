const PASO = 150;   // cuántos píxeles se mueve con cada ▲ / ▼
const SUAVE = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

alEntrada((evento) => {
    if (evento === "volver" || evento === "aceptar") window.location = "/";
    // En pantallas chicas las reglas no entran enteras: ▲ ▼ desplazan
    if (evento === "abajo") window.scrollBy({ top: PASO, behavior: SUAVE });
    if (evento === "arriba") window.scrollBy({ top: -PASO, behavior: SUAVE });
});