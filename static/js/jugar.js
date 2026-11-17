// ---- Ajustes ----
const rutaBandera = (codigo) => `/static/flags/${codigo}.svg`;
const DURACION = 60;        // segundos de la partida en modo fácil
const FEEDBACK_MS = 900;    // cuánto se muestra verde/rojo antes de pasar a la próxima
const SEGUNDOS_URGENTE = 10;

// El continente sale del <body data-continente="..."> o, si falta, de la URL (/jugar/america)
const continente = document.body.dataset.continente || location.pathname.split("/").filter(Boolean).pop();

// ---- Elementos de la página ----
const porId = (id) => document.getElementById(id);

function faltante(id) {
    console.warn("Falta el elemento #" + id + " en jugar.html");
    return document.createElement("span");
}

function crear(tag, padre, id, texto = "") {
    const el = document.createElement(tag);
    if (id) el.id = id;
    el.textContent = texto;
    padre.appendChild(el);
    return el;
}

const principal = document.querySelector("main") || document.body;

const imgBandera = porId("bandera") || faltante("bandera");
const elTiempo = porId("tiempo") || faltante("tiempo");
const elPuntos = porId("puntos") || faltante("puntos");
const pantallaJuego = porId("pantalla-juego") || faltante("pantalla-juego");
const botones = [0, 1, 2, 3].map((i) => porId("op" + i) || faltante("op" + i));

// Botón volver
let btnVolver = porId("volver");
if (!btnVolver) {
    btnVolver = document.createElement("div");
    btnVolver.id = "volver";
    btnVolver.textContent = "← Volver";
    document.body.insertBefore(btnVolver, document.body.firstChild);
}

// Cartel de error
let elError = porId("error");
if (!elError) {
    elError = document.createElement("p");
    elError.id = "error";
    elError.hidden = true;
    document.body.insertBefore(elError, document.body.firstChild);
}

// Pantalla final
let pantallaFinal = porId("pantalla-final");
if (!pantallaFinal) {
    pantallaFinal = crear("section", principal, "pantalla-final");
    pantallaFinal.hidden = true;
}
const tituloFinal = porId("titulo-final") || pantallaFinal.querySelector("h2") || crear("h2", pantallaFinal, "titulo-final");
const detalleFinal = porId("detalle-final") || crear("p", pantallaFinal, "detalle-final");
let puntajeFinal = porId("puntaje-final");
let lineaPuntaje = porId("linea-puntaje");
if (!puntajeFinal) {
    lineaPuntaje = crear("p", pantallaFinal, "linea-puntaje", "Puntaje: ");
    puntajeFinal = crear("b", lineaPuntaje, "puntaje-final", "0");
} else if (!lineaPuntaje) {
    lineaPuntaje = puntajeFinal.parentElement || pantallaFinal;
}
const ayudaFinal = porId("ayuda-final") || crear("p", pantallaFinal, "ayuda-final");

// ---- Estado ----
let tiempo = DURACION, puntos = 0, bloqueado = true, terminado = false, reloj = null;
let seleccion = 0;        // opción marcada con el teclado (0 a 3)
let enVolver = false;     // true = el botón Volver está marcado

// ---- Utilidades ----
function mostrar(el, si) { el.hidden = !si; }

function animar(el, clase) {
    el.classList.remove(clase);
    void el.offsetWidth;
    el.classList.add(clase);
}

function marcarUrgencia(si) {
    document.body.classList.toggle("urgente", si);
    const caja = elTiempo.parentElement;
    if (caja) caja.classList.toggle("urgente", si);
}

function mostrarError(texto) {
    elError.textContent = texto;
    mostrar(elError, !!texto);
    if (texto) console.error(texto);
}

window.addEventListener("error", (ev) => mostrarError("Error en el juego: " + ev.message));
window.addEventListener("unhandledrejection", (ev) => mostrarError("Error en el juego: " + ev.reason));

function resaltar() {
    btnVolver.classList.toggle("seleccionada", enVolver);
    botones.forEach((b, i) => b.classList.toggle("seleccionada", !enVolver && !bloqueado && i === seleccion));
}

function irAContinentes() {
    clearInterval(reloj);
    window.location = "/jugar/facil";
}

function limpiarBotones() {
    botones.forEach((b) => b.classList.remove("correcta", "incorrecta"));
}

// ---- Partida ----
async function iniciar() {
    clearInterval(reloj);
    terminado = false;
    bloqueado = true;
    puntos = 0;
    tiempo = DURACION;
    seleccion = 0;
    enVolver = false;
    elPuntos.textContent = puntos;
    elTiempo.textContent = tiempo;
    marcarUrgencia(false);
    limpiarBotones();
    mostrarError("");
    mostrar(pantallaFinal, false);
    mostrar(pantallaJuego, true);

    const cargada = await siguientePregunta(true);   // true = ronda nueva (se mezclan las banderas)
    if (!cargada) return;
    reloj = setInterval(tick, 1000);                 // el tiempo arranca cuando aparece la 1ª bandera
}

function tick() {
    tiempo--;
    elTiempo.textContent = tiempo;
    marcarUrgencia(tiempo <= SEGUNDOS_URGENTE);
    if (tiempo <= 0) finalizar("tiempo");
}

// Devuelve true si se cargó una pregunta
async function siguientePregunta(nueva = false) {
    const url = `/api/pregunta/${continente}` + (nueva ? "?nueva=1" : "");
    let r, datos;

    try {
        r = await fetch(url);
    } catch (e) {
        finalizar("error", "No hay conexión con el servidor (" + e.message + ").");
        return false;
    }
    try {
        datos = await r.json();
    } catch (e) {
        finalizar("error", `El servidor respondió ${r.status} en ${url}.`);
        return false;
    }
    if (terminado) return false;
    if (!r.ok) {
        finalizar("error", datos.error || `El servidor respondió ${r.status}.`);
        return false;
    }
    if (datos.fin) {
        finalizar("banderas");
        return false;
    }

    mostrarError("");
    imgBandera.src = datos.imagen || rutaBandera(datos.bandera);
    animar(imgBandera, "entra");
    limpiarBotones();
    datos.opciones.forEach((nombre, i) => { if (botones[i]) botones[i].textContent = nombre; });
    seleccion = 0;
    bloqueado = false;
    resaltar();
    return true;
}

async function responder(indice) {
    if (bloqueado || terminado) return;
    bloqueado = true;
    resaltar();

    let datos;
    try {
        const r = await fetch("/api/responder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ opcion: indice })
        });
        datos = await r.json();
        if (!r.ok) throw new Error(datos.error || ("Error " + r.status));
    } catch (e) {
        finalizar("error", "No se pudo enviar la respuesta (" + e.message + ").");
        return;
    }
    if (terminado) return;

    if (datos.acierto) {
        botones[indice].classList.add("correcta");
        puntos++;
        elPuntos.textContent = puntos;
        animar(elPuntos.parentElement, "pop");
    } else {
        botones[indice].classList.add("incorrecta");
        if (botones[datos.correcta]) botones[datos.correcta].classList.add("correcta");
    }

    setTimeout(() => {
        if (!terminado) siguientePregunta();
    }, FEEDBACK_MS);
}

function finalizar(motivo, detalle = "") {
    if (terminado) return;
    terminado = true;
    bloqueado = true;
    clearInterval(reloj);
    marcarUrgencia(false);

    const titulos = {
        tiempo: "¡Se acabó el tiempo!",
        banderas: "¡Pasaron todas las banderas!",
        error: "Ups, hubo un problema con el juego"
    };
    const esError = motivo === "error";
    tituloFinal.textContent = titulos[motivo];
    detalleFinal.textContent = esError ? detalle : "";
    puntajeFinal.textContent = puntos;
    mostrar(lineaPuntaje, !esError);
    ayudaFinal.textContent = esError
        ? "⏎ Enter: reintentar  ·  Esc: volver"
        : "⏎ Enter: jugar de nuevo  ·  Esc: elegir continente";

    mostrarError("");
    enVolver = false;
    btnVolver.classList.remove("seleccionada");
    mostrar(pantallaJuego, false);
    mostrar(pantallaFinal, true);
}

// ---- Teclado ----
let ultimoEvento = "";
let ultimaHora = 0;

function manejar(evento) {
    // Evita procesar dos veces la misma tecla (teclado directo + input.js)
    const ahora = Date.now();
    if (evento === ultimoEvento && ahora - ultimaHora < 80) return;
    ultimoEvento = evento;
    ultimaHora = ahora;

    if (terminado) {
        if (evento === "aceptar") iniciar();
        if (evento === "volver") irAContinentes();
        return;
    }
    if (evento === "volver") return irAContinentes();

    // Q W A S: responden directo
    const atajos = { q: 0, w: 1, a: 2, s: 3 };
    if (evento in atajos) return responder(atajos[evento]);

    if (bloqueado) return;

    if (evento === "aceptar") {
        if (enVolver) return irAContinentes();
        return responder(seleccion);
    }

    // Las 4 opciones están en una grilla de 2x2
    if (enVolver) {
        if (evento === "abajo") { enVolver = false; resaltar(); }
        return;
    }
    if (evento === "izquierda" && seleccion % 2 === 1) seleccion--;
    if (evento === "derecha" && seleccion % 2 === 0) seleccion++;
    if (evento === "abajo" && seleccion < 2) seleccion += 2;
    if (evento === "arriba") {
        if (seleccion >= 2) seleccion -= 2;
        else enVolver = true;                 // desde la fila de arriba se sube al botón Volver
    }
    resaltar();
}

// 1) Letras Q W A S directo desde el teclado
document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if ("qwas".includes(k) && k.length === 1) manejar(k);
});

// 2) Flechas, Enter y Esc vienen de input.js
if (typeof alEntrada === "function") alEntrada(manejar);

// ---- Mouse / touch ----
botones.forEach((b, i) => {
    b.addEventListener("click", () => { seleccion = i; responder(i); });
});
btnVolver.addEventListener("click", irAContinentes);

// Si la imagen no carga, avisamos pero el juego sigue
imgBandera.addEventListener("error", () => {
    mostrarError("No se encontró la imagen de la bandera (" + imgBandera.getAttribute("src") + ").");
});

iniciar();