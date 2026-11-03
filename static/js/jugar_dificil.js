// ---- Ajustes ----
// Ruta de respaldo de las banderas (normalmente el servidor ya manda la ruta correcta)
const rutaBandera = (codigo) => `/static/flags/${codigo}.svg`;
const DURACION_NORMAL = 40;   // segundos de la partida en cada continente (en fácil son 60)
const DURACION_GLOBAL = 100;  // segundos en "global", que tiene muchas más banderas
const FEEDBACK_MS = 1200;   // cuánto se muestra verde/rojo antes de pasar a la próxima

const continente = document.body.dataset.continente;
const DURACION = continente === "global" ? DURACION_GLOBAL : DURACION_NORMAL;

// ---- Elementos de la página ----
// Si falta alguno en jugar_dificil.html, el juego NO se rompe: se crea solo (o se ignora).
const porId = (id) => document.getElementById(id);

function faltante(id) {
    console.warn("Falta el elemento #" + id + " en jugar_dificil.html");
    return document.createElement("span");   // elemento suelto, no se ve en la página
}

function crear(tag, padre, id, texto = "") {
    const el = document.createElement(tag);
    if (id) el.id = id;
    el.textContent = texto;
    padre.appendChild(el);
    return el;
}

const principal = document.querySelector("main") || document.body;

// Imprescindibles (vienen en jugar_dificil.html)
const imgBandera = porId("bandera") || faltante("bandera");
const elTiempo = porId("tiempo") || faltante("tiempo");
const elPuntos = porId("puntos") || faltante("puntos");
const pantallaJuego = porId("pantalla-juego") || faltante("pantalla-juego");
const inputRespuesta = porId("respuesta-texto") || faltante("respuesta-texto");
const elResultado = porId("resultado-texto") || faltante("resultado-texto");

// Botón volver (arriba a la izquierda)
let btnVolver = porId("volver");
if (!btnVolver) {
    btnVolver = document.createElement("div");
    btnVolver.id = "volver";
    btnVolver.textContent = "← Volver";
    document.body.insertBefore(btnVolver, document.body.firstChild);
}

// Cartel de error / aviso
let elError = porId("error");
if (!elError) {
    elError = document.createElement("p");
    elError.id = "error";
    elError.hidden = true;
    const header = document.querySelector("header");
    if (header && header.parentNode) header.parentNode.insertBefore(elError, header.nextSibling);
    else document.body.insertBefore(elError, document.body.firstChild);
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
let enVolver = false;       // true = el botón Volver está seleccionado con el teclado
const SEGUNDOS_URGENTE = 10; // desde acá el reloj se pone rojo y parpadea

// Suma o quita la clase "urgente" en la caja del tiempo (el <span> que contiene #tiempo)
function marcarUrgencia(si) {
    const caja = elTiempo.parentElement;
    if (caja) caja.classList.toggle("urgente", si);
}

// Mostrar / ocultar con el atributo "hidden"
function mostrar(el, si) {
    el.hidden = !si;
}

function mostrarError(texto) {
    elError.textContent = texto;
    mostrar(elError, !!texto);
    if (texto) console.error(texto);
}

window.addEventListener("error", (ev) => mostrarError("Error en el juego: " + ev.message));
window.addEventListener("unhandledrejection", (ev) => mostrarError("Error en el juego: " + ev.reason));

// Marca el botón Volver (▲) o devuelve el foco a la barra de texto (▼)
function resaltar() {
    btnVolver.classList.toggle("seleccionada", enVolver);
    if (enVolver) inputRespuesta.blur();
    else if (!terminado) inputRespuesta.focus();
}

function irAContinentes() {
    clearInterval(reloj);
    window.location = "/jugar/dificil";
}

// Deja la barra de texto lista para la próxima bandera
function limpiarRespuesta() {
    inputRespuesta.value = "";
    inputRespuesta.readOnly = false;
    inputRespuesta.classList.remove("correcta", "incorrecta");
    elResultado.textContent = "";
}

// ---- Partida ----
async function iniciar() {
    clearInterval(reloj);
    terminado = false;
    bloqueado = true;
    puntos = 0;
    tiempo = DURACION;
    enVolver = false;
    elPuntos.textContent = puntos;
    elTiempo.textContent = tiempo;
    marcarUrgencia(false);
    limpiarRespuesta();
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
    const url = `/api/dificil/pregunta/${continente}` + (nueva ? "?nueva=1" : "");
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
        finalizar("error", `El servidor respondió ${r.status} en ${url}. Reiniciá Flask con el app.py nuevo.`);
        return false;
    }
    if (terminado) return false;                       // el tiempo se acabó mientras cargaba
    if (!r.ok) {
        finalizar("error", datos.error || `El servidor respondió ${r.status}.`);
        return false;
    }
    if (datos.fin) {                                   // pasaron todas las banderas
        finalizar("banderas");
        return false;
    }

    mostrarError("");
    imgBandera.src = datos.imagen || rutaBandera(datos.bandera);
    limpiarRespuesta();
    bloqueado = false;
    if (!enVolver) inputRespuesta.focus();
    return true;
}

async function responder() {
    if (bloqueado || terminado) return;
    const texto = inputRespuesta.value.trim();
    if (!texto) return;                                // no se envía una respuesta vacía

    bloqueado = true;
    inputRespuesta.readOnly = true;

    let datos;
    try {
        const r = await fetch("/api/dificil/responder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texto })
        });
        datos = await r.json();
        if (!r.ok) throw new Error(datos.error || ("Error " + r.status));
    } catch (e) {
        finalizar("error", "No se pudo enviar la respuesta (" + e.message + ").");
        return;
    }
    if (terminado) return;

    inputRespuesta.classList.add(datos.acierto ? "correcta" : "incorrecta");
    if (datos.acierto) {
        puntos++;
        elPuntos.textContent = puntos;
    } else {
        elResultado.textContent = "Era: " + datos.correcta;
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
    if (esError) console.error(detalle);

    mostrarError("");
    enVolver = false;
    btnVolver.classList.remove("seleccionada");
    inputRespuesta.blur();
    mostrar(pantallaJuego, false);
    mostrar(pantallaFinal, true);
}

// ---- Teclado ----
alEntrada((evento) => {
    // Pantalla final: Enter = jugar de nuevo / reintentar, Esc = elegir continente
    if (terminado) {
        if (evento === "aceptar") iniciar();
        if (evento === "volver") irAContinentes();
        return;
    }

    if (evento === "volver") return irAContinentes();

    // ▲ selecciona el botón Volver, ▼ vuelve a la barra de texto
    if (evento === "arriba") { enVolver = true;  return resaltar(); }
    if (evento === "abajo")  { enVolver = false; return resaltar(); }

    if (evento === "aceptar") {
        if (enVolver) return irAContinentes();
        responder();
    }
});

// Si la imagen no carga, avisamos pero el juego sigue andando
imgBandera.addEventListener("error", () => {
    mostrarError("No se encontró la imagen de la bandera (" + imgBandera.getAttribute("src") + ").");
});

btnVolver.addEventListener("click", irAContinentes);

iniciar();